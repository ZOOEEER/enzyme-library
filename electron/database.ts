import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { TABLES, TableName, VocabEntry, autoIdPrefix, primaryField, tableSpec, vocabUsage } from '../app/shared/schema';
import { RowData, buildLookups, buildVocab, hasErrors, validateDatabase, validateRow } from '../app/shared/validation';
import { inchikeyFromSmiles } from './chemistry';
import { readSheetRows } from './excel';

export interface AppDatabase {
  path: string;
  db: Database.Database;
}

function sqlType(kind?: string): string {
  return kind === 'number' ? 'REAL' : 'TEXT';
}

function quote(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

export function openDatabase(userDataPath: string): AppDatabase {
  fs.mkdirSync(userDataPath, { recursive: true });
  const dbPath = path.join(userDataPath, 'enzyme-library.sqlite');
  const legacyDbPath = path.join(userDataPath, 'ired-enzyme-library.sqlite');
  if (!fs.existsSync(dbPath) && fs.existsSync(legacyDbPath)) fs.copyFileSync(legacyDbPath, dbPath);
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initialize(db);
  return { path: dbPath, db };
}

export function initialize(db: Database.Database): void {
  db.prepare('CREATE TABLE IF NOT EXISTS __meta (key TEXT PRIMARY KEY, value TEXT)').run();
  const version = db.prepare('SELECT value FROM __meta WHERE key = ?').get('schema_version') as { value?: string } | undefined;
  if (version?.value !== '2') migrateToV2(db);
  for (const table of TABLES) {
    const columns = table.fields.map((field) => {
      const parts = [quote(field.name), sqlType(field.kind)];
      if (field.primary) parts.push('PRIMARY KEY');
      return parts.join(' ');
    });
    db.prepare(`CREATE TABLE IF NOT EXISTS ${quote(table.name)} (${columns.join(', ')})`).run();
    ensureColumns(db, table.name);
    migrateNumericValues(db, table.name);
  }
  ensureDefaultVocab(db);
  ensureDefaultUnits(db);
}



const numericMigrations: Partial<Record<TableName, Array<{ old: string; typical: string; unit?: string; unitValue?: string }>>> = {
  Conditions: [
    { old: 'enzyme_loading_value', typical: 'enzyme_loading_typical', unit: 'enzyme_loading_unit' },
    { old: 'substrate_conc_mM', typical: 'substrate_conc_typical', unit: 'substrate_conc_unit', unitValue: 'mM' },
    { old: 'cofactor_conc_mM', typical: 'cofactor_conc_typical', unit: 'cofactor_conc_unit', unitValue: 'mM' },
    { old: 'cosolvent_percent', typical: 'cosolvent_amount_typical', unit: 'cosolvent_amount_unit', unitValue: '%' },
    { old: 'cosolvent_typical', typical: 'cosolvent_amount_typical' },
    { old: 'cosolvent_unit', typical: 'cosolvent_amount_unit' },
    { old: 'pH', typical: 'pH_typical', unit: 'pH_unit', unitValue: 'pH' },
    { old: 'temperature_C', typical: 'temperature_typical', unit: 'temperature_unit', unitValue: '?C' },
    { old: 'time_h', typical: 'time_typical', unit: 'time_unit', unitValue: 'h' },
    { old: 'reaction_scale_value', typical: 'reaction_scale_typical', unit: 'reaction_scale_unit' }
  ],
  Enzyme_Substrate_Relations: [
    { old: 'conversion_percent', typical: 'conversion_mean', unit: 'conversion_unit', unitValue: '%' },
    { old: 'conversion_typical', typical: 'conversion_mean' },
    { old: 'yield_percent', typical: 'yield_mean', unit: 'yield_unit', unitValue: '%' },
    { old: 'yield_typical', typical: 'yield_mean' },
    { old: 'product_titer_g_L', typical: 'product_titer_g_L_mean', unit: 'product_titer_g_L_unit', unitValue: 'g/L' },
    { old: 'product_titer_g_L_typical', typical: 'product_titer_g_L_mean' },
    { old: 'product_titer_mM', typical: 'product_titer_mM_mean', unit: 'product_titer_mM_unit', unitValue: 'mM' },
    { old: 'product_titer_mM_typical', typical: 'product_titer_mM_mean' },
    { old: 'specific_activity_U_mg', typical: 'specific_activity_mean', unit: 'specific_activity_unit', unitValue: 'U/mg' },
    { old: 'specific_activity_typical', typical: 'specific_activity_mean' },
    { old: 'kcat_s_1', typical: 'kcat_mean', unit: 'kcat_unit', unitValue: 's??' },
    { old: 'kcat_typical', typical: 'kcat_mean' },
    { old: 'Km_mM', typical: 'Km_mean', unit: 'Km_unit', unitValue: 'mM' },
    { old: 'Km_typical', typical: 'Km_mean' },
    { old: 'kcat_Km_M_1_s_1', typical: 'kcat_Km_mean', unit: 'kcat_Km_unit', unitValue: 'M?? s??' },
    { old: 'kcat_Km_typical', typical: 'kcat_Km_mean' },
    { old: 'initial_rate_mM_min', typical: 'initial_rate_mean', unit: 'initial_rate_unit', unitValue: 'mM/min' },
    { old: 'initial_rate_typical', typical: 'initial_rate_mean' },
    { old: 'TTN_mol_mol', typical: 'TTN_mean', unit: 'TTN_unit', unitValue: 'mol/mol' },
    { old: 'TTN_typical', typical: 'TTN_mean' },
    { old: 'TOF_h_1', typical: 'TOF_mean', unit: 'TOF_unit', unitValue: 'h??' },
    { old: 'TOF_typical', typical: 'TOF_mean' },
    { old: 'ee_percent', typical: 'ee_mean', unit: 'ee_unit', unitValue: '%' },
    { old: 'ee_typical', typical: 'ee_mean' },
    { old: 'de_percent', typical: 'de_mean', unit: 'de_unit', unitValue: '%' },
    { old: 'de_typical', typical: 'de_mean' }
  ],
  Engineering: [
    { old: 'conversion_percent', typical: 'conversion_mean', unit: 'conversion_unit', unitValue: '%' },
    { old: 'conversion_typical', typical: 'conversion_mean', unit: 'conversion_unit' },
    { old: 'yield_percent', typical: 'yield_mean', unit: 'yield_unit', unitValue: '%' },
    { old: 'yield_typical', typical: 'yield_mean', unit: 'yield_unit' },
    { old: 'product_titer_g_L', typical: 'product_titer_g_L_mean', unit: 'product_titer_g_L_unit', unitValue: 'g/L' },
    { old: 'product_titer_g_L_typical', typical: 'product_titer_g_L_mean', unit: 'product_titer_g_L_unit' },
    { old: 'specific_activity_U_mg', typical: 'specific_activity_mean', unit: 'specific_activity_unit', unitValue: 'U/mg' },
    { old: 'specific_activity_typical', typical: 'specific_activity_mean', unit: 'specific_activity_unit' },
    { old: 'kcat_s_1', typical: 'kcat_mean', unit: 'kcat_unit', unitValue: 's^-1' },
    { old: 'kcat_typical', typical: 'kcat_mean', unit: 'kcat_unit' },
    { old: 'Km_mM', typical: 'Km_mean', unit: 'Km_unit', unitValue: 'mM' },
    { old: 'Km_typical', typical: 'Km_mean', unit: 'Km_unit' },
    { old: 'kcat_Km_M_1_s_1', typical: 'kcat_Km_mean', unit: 'kcat_Km_unit', unitValue: 'M^-1 s^-1' },
    { old: 'kcat_Km_typical', typical: 'kcat_Km_mean', unit: 'kcat_Km_unit' },
    { old: 'initial_rate_mM_min', typical: 'initial_rate_mean', unit: 'initial_rate_unit', unitValue: 'mM/min' },
    { old: 'initial_rate_typical', typical: 'initial_rate_mean', unit: 'initial_rate_unit' },
    { old: 'TTN_mol_mol', typical: 'TTN_mean', unit: 'TTN_unit', unitValue: 'mol/mol' },
    { old: 'TTN_typical', typical: 'TTN_mean', unit: 'TTN_unit' },
    { old: 'TOF_h_1', typical: 'TOF_mean', unit: 'TOF_unit', unitValue: 'h^-1' },
    { old: 'TOF_typical', typical: 'TOF_mean', unit: 'TOF_unit' },
    { old: 'ee_percent', typical: 'ee_mean', unit: 'ee_unit', unitValue: '%' },
    { old: 'ee_typical', typical: 'ee_mean', unit: 'ee_unit' },
    { old: 'de_percent', typical: 'de_mean', unit: 'de_unit', unitValue: '%' },
    { old: 'de_typical', typical: 'de_mean', unit: 'de_unit' },
    { old: 'Tm_C', typical: 'Tm_mean', unit: 'Tm_unit', unitValue: '?C' },
    { old: 'Tm_typical', typical: 'Tm_mean', unit: 'Tm_unit' },
    { old: 'half_life_h', typical: 'half_life_mean', unit: 'half_life_unit', unitValue: 'h' },
    { old: 'half_life_typical', typical: 'half_life_mean', unit: 'half_life_unit' },
    { old: 'residual_activity_typical', typical: 'residual_activity_mean', unit: 'residual_activity_unit' },
    { old: 'WT_metric_value_standard_unit', typical: 'WT_metric_value_mean', unit: 'WT_metric_value_unit', unitValue: 'none' },
    { old: 'WT_metric_value_typical', typical: 'WT_metric_value_mean', unit: 'WT_metric_value_unit' },
    { old: 'variant_metric_value_standard_unit', typical: 'variant_metric_value_mean', unit: 'variant_metric_value_unit', unitValue: 'none' },
    { old: 'variant_metric_value_typical', typical: 'variant_metric_value_mean', unit: 'variant_metric_value_unit' },
    { old: 'fold_change_vs_WT', typical: 'fold_change_mean', unit: 'fold_change_unit', unitValue: 'fold' },
    { old: 'fold_change_typical', typical: 'fold_change_mean', unit: 'fold_change_unit' }
  ]};

function migrateNumericValues(db: Database.Database, tableName: TableName): void {
  const rules = numericMigrations[tableName];
  if (!rules?.length) return;
  const existing = new Set((db.prepare(`PRAGMA table_info(${quote(tableName)})`).all() as Array<{ name: string }>).map((column) => column.name));
  for (const rule of rules) {
    if (!existing.has(rule.old) || !existing.has(rule.typical)) continue;
    db.prepare(`UPDATE ${quote(tableName)} SET ${quote(rule.typical)} = ${quote(rule.old)} WHERE (${quote(rule.typical)} IS NULL OR ${quote(rule.typical)} = '') AND ${quote(rule.old)} IS NOT NULL AND ${quote(rule.old)} != ''`).run();
    if (rule.unit && rule.unitValue && existing.has(rule.unit)) {
      db.prepare(`UPDATE ${quote(tableName)} SET ${quote(rule.unit)} = ? WHERE (${quote(rule.unit)} IS NULL OR ${quote(rule.unit)} = '') AND ${quote(rule.typical)} IS NOT NULL AND ${quote(rule.typical)} != ''`).run(rule.unitValue);
    }
  }
}
function tableExists(db: Database.Database, tableName: string): boolean {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(tableName);
  return Boolean(row);
}

function ensureColumns(db: Database.Database, tableName: TableName): void {
  const existing = new Set((db.prepare(`PRAGMA table_info(${quote(tableName)})`).all() as Array<{ name: string }>).map((column) => column.name));
  const spec = tableSpec(tableName);
  for (const field of spec.fields) {
    if (existing.has(field.name)) continue;
    db.prepare(`ALTER TABLE ${quote(tableName)} ADD COLUMN ${quote(field.name)} ${sqlType(field.kind)}`).run();
  }
}

function migrateToV2(db: Database.Database): void {
  const tables = TABLES.map((table) => table.name);
  const backupSuffix = new Date().toISOString().replace(/[:.]/g, '-');
  for (const tableName of tables) {
    if (!tableExists(db, tableName)) continue;
    db.prepare(`ALTER TABLE ${quote(tableName)} RENAME TO ${quote(`${tableName}_bak_${backupSuffix}`)}`).run();
  }
  if (tableExists(db, 'Reaction_Types')) {
    db.prepare(`ALTER TABLE ${quote('Reaction_Types')} RENAME TO ${quote(`Reaction_Types_bak_${backupSuffix}`)}`).run();
  }
  db.prepare('INSERT OR REPLACE INTO __meta (key, value) VALUES (?, ?)').run('schema_version', '2');
}

export function listRows(db: Database.Database, tableName: TableName): RowData[] {
  return db.prepare(`SELECT * FROM ${quote(tableName)}`).all() as RowData[];
}

export function nextId(db: Database.Database, tableName: TableName, overridePrefix?: string): string {
  const prefix = overridePrefix ?? autoIdPrefix(tableName);
  if (!prefix) return '';
  const pk = primaryField(tableName);
  const rows = db.prepare(`SELECT ${quote(pk)} AS id FROM ${quote(tableName)}`).all() as Array<{ id?: string }>;
  const pattern = new RegExp(`^${prefix}-(\\d{4,})$`);
  const max = rows.reduce((current, row) => {
    const match = String(row.id ?? '').match(pattern);
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

export function allData(db: Database.Database): Partial<Record<TableName, RowData[]>> {
  const data: Partial<Record<TableName, RowData[]>> = {};
  for (const table of TABLES) data[table.name] = listRows(db, table.name);
  return data;
}

function vocabColumns(): string[] {
  return tableSpec('Controlled_Vocab').fields.map((field) => field.name).filter((name) => name !== 'id');
}

export function listVocab(db: Database.Database): VocabEntry[] {
  const rows = listRows(db, 'Controlled_Vocab');
  return vocabColumns().map((vocabName) => {
    const values = rows.map((row) => String(row[vocabName] ?? '').trim()).filter(Boolean);
    return { vocabName, values: [...new Set(values)], usages: vocabUsage(vocabName) };
  });
}

export function addVocabValue(db: Database.Database, vocabName: string, value: string): VocabEntry[] {
  const clean = value.trim();
  if (!vocabColumns().includes(vocabName) || !clean) return listVocab(db);
  const exists = db.prepare(`SELECT 1 FROM ${quote('Controlled_Vocab')} WHERE ${quote(vocabName)} = ?`).get(clean);
  if (exists) return listVocab(db);
  const nextId = (db.prepare(`SELECT COALESCE(MAX(CAST(id AS INTEGER)), 0) + 1 AS id FROM ${quote('Controlled_Vocab')}`).get() as { id: number }).id;
  db.prepare(`INSERT INTO ${quote('Controlled_Vocab')} (${quote('id')}, ${quote(vocabName)}) VALUES (?, ?)`).run(String(nextId), clean);
  return listVocab(db);
}

export function deleteVocabValue(db: Database.Database, vocabName: string, value: string): VocabEntry[] {
  if (!vocabColumns().includes(vocabName)) return listVocab(db);
  db.prepare(`UPDATE ${quote('Controlled_Vocab')} SET ${quote(vocabName)} = NULL WHERE ${quote(vocabName)} = ?`).run(value);
  return listVocab(db);
}

function ensureDefaultVocab(db: Database.Database): void {
  const count = (db.prepare(`SELECT COUNT(*) AS count FROM ${quote('Controlled_Vocab')}`).get() as { count: number }).count;
  if (count === 0) {
    const defaults: Record<string, string[]> = {
      effect_type: ['activity increase', 'activity decrease', 'enantioselectivity increase', 'enantioselectivity switch', 'thermostability increase', 'expression increase'],
      cofactor: ['NADPH', 'NADH', 'NAD(P)H', 'not specified'],
      cofactor_regeneration: ['GDH/glucose', 'FDH/formate', 'IPDH/isopropanol', 'none'],
      stereo_descriptor_type: ['R/S', 'E/Z', 'cis/trans', 'racemic', 'achiral', 'other'],
      organism_source_type: ['bacterium', 'fungus', 'plant', 'metagenome', 'synthetic construct', 'unknown'],
      assay_type: ['HPLC', 'GC', 'LC-MS', 'NADPH depletion', 'chiral HPLC', 'NMR'],
      error_type: ['SD', 'SEM', 'CI', 'range', 'not specified', 'other'],
      data_status: ['raw', 'curated', 'checked', 'conflict', 'excluded'],
      source_type: ['实验', '文献', '专利', '数据库'],
      compound_role: ['substrate', 'product', 'amine partner', 'carbonyl precursor', 'imine intermediate', 'cofactor', 'cosolvent'],
      enzyme_form: ['purified enzyme', 'whole cell', 'cell lysate', 'immobilized enzyme', 'not specified'],
      reaction_direction: ['forward', 'reverse', 'equilibrium', 'not specified'],
      signal_peptide_removal_status: ['removed', 'not removed', 'unknown', 'not specified'],
      activity_annotation_level: ['qualitative', 'quantitative summary', 'conflicting', 'unknown'],
      activity_metric: ['conversion', 'yield', 'product_titer', 'specific_activity', 'initial_rate', 'TTN', 'TOF', 'kcat', 'Km', 'kcat_Km', 'ee', 'de', 'Tm', 'half_life', 'residual_activity'],
      percent_unit: ['%'],
      concentration_unit: ['mM', 'µM', 'M', 'mg/mL', 'g/L'],
      cosolvent_amount_unit: ['%', '% v/v', '% w/v', 'mM', 'µM', 'mg/mL'],
      pH_unit: ['pH'],
      temperature_unit: ['°C', 'K'],
      time_unit: ['s', 'min', 'h', 'd'],
      enzyme_loading_unit: ['mg/mL', 'g/L', 'µM enzyme', 'mol%', 'U/mL', 'U', 'mg', 'µg'],
      reaction_scale_unit: ['µL', 'mL', 'L', 'µmol', 'mmol', 'mol', 'mg substrate', 'g substrate'],
      titer_unit: ['g/L', 'mg/mL'],
      specific_activity_unit: ['U/mg', 'U/g', 'kat/kg'],
      kcat_unit: ['s^-1', 'min^-1'],
      kcat_Km_unit: ['M^-1 s^-1', 'mM^-1 s^-1'],
      initial_rate_unit: ['mM/min', 'µM/min', 'mol/L/s'],
      TTN_unit: ['mol/mol', 'none'],
      TOF_unit: ['h^-1', 's^-1', 'min^-1'],
      dimensionless_unit: ['none', 'fold']
    };
    const columns = vocabColumns();
    const maxLen = Math.max(...Object.values(defaults).map((values) => values.length));
    const insert = db.prepare(
      `INSERT INTO ${quote('Controlled_Vocab')} (${['id', ...columns].map(quote).join(', ')}) VALUES (${['@id', ...columns.map((name) => `@${name}`)].join(', ')})`
    );
    for (let i = 0; i < maxLen; i += 1) {
      const row: RowData = { id: String(i + 1) };
      for (const column of columns) row[column] = defaults[column]?.[i] ?? null;
      insert.run(row);
    }
  }
  for (const value of ['实验', '文献', '专利', '数据库']) addVocabValue(db, 'source_type', value);
  for (const value of ['SD', 'SEM', 'CI', 'range', 'not specified', 'other']) addVocabValue(db, 'error_type', value);
  for (const value of ['conversion', 'yield', 'product_titer', 'specific_activity', 'initial_rate', 'TTN', 'TOF', 'kcat', 'Km', 'kcat_Km', 'ee', 'de', 'Tm', 'half_life', 'residual_activity']) addVocabValue(db, 'activity_metric', value);
  for (const value of ['%']) addVocabValue(db, 'percent_unit', value);
  for (const value of ['mM', 'µM', 'M', 'mg/mL', 'g/L', 'nM']) addVocabValue(db, 'concentration_unit', value);
  for (const value of ['%', '% v/v', '% w/v', 'mM', 'µM', 'mg/mL']) addVocabValue(db, 'cosolvent_amount_unit', value);
  for (const value of ['pH']) addVocabValue(db, 'pH_unit', value);
  for (const value of ['°C', 'K']) addVocabValue(db, 'temperature_unit', value);
  for (const value of ['s', 'min', 'h', 'd']) addVocabValue(db, 'time_unit', value);
  for (const value of ['mg/mL', 'g/L', 'µM enzyme', 'mol%', 'U/mL', 'U', 'mg', 'µg']) addVocabValue(db, 'enzyme_loading_unit', value);
  for (const value of ['µL', 'mL', 'L', 'µmol', 'mmol', 'mol', 'mg substrate', 'g substrate']) addVocabValue(db, 'reaction_scale_unit', value);
  for (const value of ['g/L', 'mg/mL', 'mM', 'µM']) addVocabValue(db, 'titer_unit', value);
  for (const value of ['U/mg', 'U/g', 'U/mL', 'kat/kg']) addVocabValue(db, 'specific_activity_unit', value);
  for (const value of ['s^-1', 'min^-1', 'h^-1']) addVocabValue(db, 'kcat_unit', value);
  for (const value of ['M^-1 s^-1', 'mM^-1 s^-1', 'M^-1 min^-1', 'mM^-1 min^-1']) addVocabValue(db, 'kcat_Km_unit', value);
  for (const value of ['mM/min', 'µM/min', 'M/s', 'mol/L/s']) addVocabValue(db, 'initial_rate_unit', value);
  for (const value of ['mol/mol', 'turnovers', 'none']) addVocabValue(db, 'TTN_unit', value);
  for (const value of ['h^-1', 's^-1', 'min^-1', 'd^-1']) addVocabValue(db, 'TOF_unit', value);
  for (const value of ['none', 'fold']) addVocabValue(db, 'dimensionless_unit', value);
}

function templatePath(): string {
  const candidates = [
    path.join(process.cwd(), 'data_spec', 'enzyme_library_template.xlsx'),
    path.join(__dirname, '..', '..', 'data_spec', 'enzyme_library_template.xlsx'),
    path.join(process.resourcesPath ?? '', 'data_spec', 'enzyme_library_template.xlsx'),
    path.join(process.cwd(), 'data_spec', 'IRED_enzyme_library_template-f.xlsx'),
    path.join(__dirname, '..', '..', 'data_spec', 'IRED_enzyme_library_template-f.xlsx'),
    path.join(process.resourcesPath ?? '', 'data_spec', 'IRED_enzyme_library_template-f.xlsx')
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
}

function ensureDefaultUnits(db: Database.Database): void {
  const count = (db.prepare(`SELECT COUNT(*) AS count FROM ${quote('Units')}`).get() as { count: number }).count;
  const fields = tableSpec('Units').fields.map((field) => field.name);
  const insert = db.prepare(`INSERT INTO ${quote('Units')} (${fields.map(quote).join(', ')}) VALUES (${fields.map((field) => `@${field}`).join(', ')})`);
  if (count === 0) {
    const rows = readSheetRows(templatePath(), 'Units');
    if (rows.length) {
      const tx = db.transaction(() => {
        rows.forEach((row, index) => {
          const clean: RowData = {};
          for (const field of fields) clean[field] = row[field] ?? null;
          clean.id = clean.id || String(index + 1);
          insert.run(clean);
        });
      });
      tx();
    }
  }
  ensureWtResultUnits(db);
}

function ensureWtResultUnits(db: Database.Database): void {
  const rows: Array<{ field_name: string; default_unit: string; quantity_type: string; notes: string }> = [
    { field_name: 'conversion_unit', default_unit: '%', quantity_type: 'fraction', notes: 'WT conversion result unit.' },
    { field_name: 'yield_unit', default_unit: '%', quantity_type: 'fraction', notes: 'WT yield result unit.' },
    { field_name: 'product_titer_g_L_unit', default_unit: 'g/L', quantity_type: 'mass concentration', notes: 'Product titer by mass concentration.' },
    { field_name: 'specific_activity_unit', default_unit: 'U/mg', quantity_type: 'specific activity', notes: 'Activity normalized by protein or enzyme amount.' },
    { field_name: 'initial_rate_unit', default_unit: 'mM/min', quantity_type: 'rate', notes: 'Initial reaction rate.' },
    { field_name: 'TTN_unit', default_unit: 'mol/mol', quantity_type: 'turnover number', notes: 'Total turnover number.' },
    { field_name: 'TOF_unit', default_unit: 'h^-1', quantity_type: 'turnover frequency', notes: 'Turnover frequency.' },
    { field_name: 'kcat_unit', default_unit: 's^-1', quantity_type: 'kinetic constant', notes: 'Catalytic constant.' },
    { field_name: 'Km_unit', default_unit: 'mM', quantity_type: 'concentration', notes: 'Michaelis constant.' },
    { field_name: 'kcat_Km_unit', default_unit: 'M^-1 s^-1', quantity_type: 'catalytic efficiency', notes: 'Catalytic efficiency.' },
    { field_name: 'ee_unit', default_unit: '%', quantity_type: 'selectivity', notes: 'Enantiomeric excess.' },
    { field_name: 'de_unit', default_unit: '%', quantity_type: 'selectivity', notes: 'Diastereomeric excess.' },
    { field_name: 'Tm_unit', default_unit: '°C', quantity_type: 'temperature', notes: 'Melting or transition temperature.' },
    { field_name: 'half_life_unit', default_unit: 'h', quantity_type: 'time', notes: 'Half-life under specified condition.' },
    { field_name: 'residual_activity_unit', default_unit: '%', quantity_type: 'fraction', notes: 'Residual activity after treatment.' }
  ];
  const nextId = db.prepare(`SELECT COALESCE(MAX(CAST(id AS INTEGER)), 0) + 1 AS id FROM ${quote('Units')}`);
  const insert = db.prepare(`INSERT INTO ${quote('Units')} (${quote('id')}, ${quote('table_name')}, ${quote('field_name')}, ${quote('default_unit')}, ${quote('quantity_type')}, ${quote('notes')}) VALUES (?, ?, ?, ?, ?, ?)`);
  for (const row of rows) {
    const exists = db.prepare(`SELECT 1 FROM ${quote('Units')} WHERE ${quote('table_name')} = ? AND ${quote('field_name')} = ?`).get('Enzyme_Substrate_Relations', row.field_name);
    if (exists) continue;
    const id = (nextId.get() as { id: number }).id;
    insert.run(String(id), 'Enzyme_Substrate_Relations', row.field_name, row.default_unit, row.quantity_type, row.notes);
  }
}

export async function upsertRow(db: Database.Database, tableName: TableName, row: RowData): Promise<{ issues: ReturnType<typeof validateRow> }> {
  if (tableName === 'Chemicals') {
    const result = await inchikeyFromSmiles(String(row.canonical_smiles ?? ''));
    if (result.error) {
      return { issues: [{ level: 'error', table: tableName, rowId: String(row.compound_id ?? ''), field: 'canonical_smiles', message: result.error }] };
    }
    row.inchikey = result.inchikey;
    row.formula = result.formula;
    const duplicate = db.prepare(`SELECT compound_id FROM ${quote('Chemicals')} WHERE inchikey = ? AND compound_id != ?`)
      .get(result.inchikey, row.compound_id ?? '') as { compound_id?: string } | undefined;
    if (duplicate?.compound_id) {
      return { issues: [{ level: 'error', table: tableName, rowId: String(row.compound_id ?? ''), field: 'inchikey', message: `InChIKey \u4e0e\u5df2\u6709\u5316\u5408\u7269\u51b2\u7a81\uff1a${duplicate.compound_id}` }] };
    }
  }
  const data = allData(db);
  const pk = primaryField(tableName);
  const rowId = String(row[pk] ?? '').trim();
  const existing = new Set((data[tableName] ?? []).map((item) => String(item[pk] ?? '')).filter((id) => id && id !== rowId));
  const issues = validateRow(tableName, row, buildLookups(data), buildVocab(data), existing);
  if (hasErrors(issues)) return { issues };

  const spec = tableSpec(tableName);
  const clean: RowData = {};
  for (const field of spec.fields) clean[field.name] = row[field.name] ?? null;
  const fields = spec.fields.map((field) => field.name);
  const placeholders = fields.map((field) => `@${field}`);
  const updates = fields.filter((field) => field !== pk).map((field) => `${quote(field)} = excluded.${quote(field)}`);
  db.prepare(
    `INSERT INTO ${quote(tableName)} (${fields.map(quote).join(', ')}) VALUES (${placeholders.join(', ')})
     ON CONFLICT(${quote(pk)}) DO UPDATE SET ${updates.join(', ')}`
  ).run(clean);
  return { issues };
}

export function deleteRow(db: Database.Database, tableName: TableName, id: string): void {
  const pk = primaryField(tableName);
  db.prepare(`DELETE FROM ${quote(tableName)} WHERE ${quote(pk)} = ?`).run(id);
}

export function replaceAll(db: Database.Database, data: Partial<Record<TableName, RowData[]>>) {
  const issues = validateDatabase(data);
  if (hasErrors(issues)) return { issues, imported: false };
  const tx = db.transaction(() => {
    for (const table of [...TABLES].reverse()) db.prepare(`DELETE FROM ${quote(table.name)}`).run();
    for (const table of TABLES) {
      for (const row of data[table.name] ?? []) {
        const spec = tableSpec(table.name);
        const clean: RowData = {};
        for (const field of spec.fields) clean[field.name] = row[field.name] ?? null;
        const fields = spec.fields.map((field) => field.name);
        const placeholders = fields.map((field) => `@${field}`);
        db.prepare(`INSERT INTO ${quote(table.name)} (${fields.map(quote).join(', ')}) VALUES (${placeholders.join(', ')})`).run(clean);
      }
    }
  });
  tx();
  ensureDefaultVocab(db);
  ensureDefaultUnits(db);
  return { issues, imported: true };
}
