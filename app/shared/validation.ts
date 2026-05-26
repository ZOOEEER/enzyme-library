import { TABLES, TableName, primaryField, tableSpec } from './schema';
import { parseAminoAcidInput } from './sequence';

export type RowData = Record<string, string | number | null | undefined>;

export interface ValidationIssue {
  level: 'error' | 'warning';
  table: TableName;
  rowId?: string;
  field?: string;
  message: string;
}

export type LookupMap = Partial<Record<TableName, Set<string>>>;
export type VocabMap = Record<string, Set<string>>;

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== '';
}


function numericBase(name: string): string {
  return name.replace(/_(typical|min|max|unit)$/, '');
}

function asText(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

function isNumericQuartetTypical(name: string): boolean {
  return name.endsWith('_typical');
}

function resultBase(name: string): string {
  return name.replace(/_(mean|std|unit|raw_data)$/, '');
}

const MUTATION_SET_PATTERN = /^[ABCDEFGHIKLMNPQRSTVWY][1-9][0-9]*[ABCDEFGHIKLMNPQRSTVWY](\/[ABCDEFGHIKLMNPQRSTVWY][1-9][0-9]*[ABCDEFGHIKLMNPQRSTVWY])*$/;

export function buildLookups(data: Partial<Record<TableName, RowData[]>>): LookupMap {
  const lookups: LookupMap = {};
  for (const table of TABLES) {
    const pk = primaryField(table.name);
    lookups[table.name] = new Set((data[table.name] ?? []).map((row) => asText(row[pk])).filter(Boolean));
  }
  return lookups;
}

export function buildVocab(data: Partial<Record<TableName, RowData[]>>): VocabMap {
  const result: VocabMap = {};
  for (const row of data.Controlled_Vocab ?? []) {
    for (const [field, value] of Object.entries(row)) {
      if (field === 'id' || !hasValue(value)) continue;
      result[field] ??= new Set();
      result[field].add(asText(value));
    }
  }
  return result;
}

export function validateRow(
  tableName: TableName,
  row: RowData,
  lookups: LookupMap = {},
  vocab: VocabMap = {},
  existingIds: Set<string> = new Set()
): ValidationIssue[] {
  const spec = tableSpec(tableName);
  const pk = primaryField(tableName);
  const rowId = asText(row[pk]);
  const issues: ValidationIssue[] = [];

  for (const field of spec.fields) {
    const value = row[field.name];
    if (field.required && !isNumericQuartetTypical(field.name) && !hasValue(value)) {
      issues.push({ level: 'error', table: tableName, rowId, field: field.name, message: '必填字段缺失' });
    }
    if (field.kind === 'number' && hasValue(value) && Number.isNaN(Number(value))) {
      issues.push({ level: 'error', table: tableName, rowId, field: field.name, message: '应为数字' });
    }
    if (field.references && hasValue(value)) {
      const target = lookups[field.references.table];
      if (target && !target.has(asText(value))) {
        issues.push({
          level: 'error',
          table: tableName,
          rowId,
          field: field.name,
          message: `外键不存在：${field.references.table}.${field.references.field}`
        });
      }
    }
    if (field.multiReferences && hasValue(value)) {
      const target = lookups[field.multiReferences.table];
      const ids = asText(value).split(',').map((item) => item.trim()).filter(Boolean);
      const missing = ids.filter((id) => target && !target.has(id));
      if (missing.length) {
        issues.push({
          level: 'error',
          table: tableName,
          rowId,
          field: field.name,
          message: `\u591a\u9009\u5173\u8054 ID \u4e0d\u5b58\u5728\uff1a${missing.join(', ')}`
        });
      }
    }
    const skipVocabCheck = tableName === 'Engineering' && ['WT_metric_value_unit', 'variant_metric_value_unit'].includes(field.name);
    if (field.vocab && hasValue(value) && !skipVocabCheck) {
      const allowed = vocab[field.vocab];
      if (allowed && allowed.size > 0 && !allowed.has(asText(value))) {
        issues.push({ level: 'warning', table: tableName, rowId, field: field.name, message: `不在受控词表 ${field.vocab} 中` });
      }
    }
  }

  const checkedRanges = new Set<string>();
  for (const field of spec.fields) {
    if (!field.name.endsWith('_min')) continue;
    const base = numericBase(field.name);
    if (checkedRanges.has(base)) continue;
    checkedRanges.add(base);
    const min = row[`${base}_min`];
    const max = row[`${base}_max`];
    if (hasValue(min) && hasValue(max) && !Number.isNaN(Number(min)) && !Number.isNaN(Number(max)) && Number(min) > Number(max)) {
      issues.push({ level: 'error', table: tableName, rowId, field: `${base}_min`, message: '\u4e0b\u9650\u4e0d\u80fd\u5927\u4e8e\u4e0a\u9650' });
    }
  }

  for (const field of spec.fields) {
    if (!field.required || !isNumericQuartetTypical(field.name)) continue;
    const base = numericBase(field.name);
    const typical = row[field.name];
    const min = row[`${base}_min`];
    const max = row[`${base}_max`];
    const unit = row[`${base}_unit`];
    const hasTypical = hasValue(typical);
    const hasMin = hasValue(min);
    const hasMax = hasValue(max);
    if (!hasTypical && !hasMin && !hasMax) {
      issues.push({ level: 'error', table: tableName, rowId, field: field.name, message: '\u5fc5\u586b\uff1a\u8bf7\u586b\u5199\u5178\u578b\u503c\u6216\u6210\u5bf9\u7684\u4e0b\u9650/\u4e0a\u9650' });
    }
    if (!hasTypical && hasMin !== hasMax) {
      issues.push({ level: 'error', table: tableName, rowId, field: `${base}_min`, message: '\u8303\u56f4\u9700\u8981\u540c\u65f6\u586b\u5199\u4e0b\u9650\u548c\u4e0a\u9650' });
    }
    if (base !== 'pH' && (hasTypical || (hasMin && hasMax)) && !hasValue(unit)) {
      issues.push({ level: 'error', table: tableName, rowId, field: `${base}_unit`, message: '\u586b\u5199\u6570\u503c\u6216\u8303\u56f4\u65f6\u5fc5\u987b\u9009\u62e9\u5355\u4f4d' });
    }
  }

  const checkedResults = new Set<string>();
  for (const field of spec.fields) {
    if (!field.name.endsWith('_mean')) continue;
    const base = resultBase(field.name);
    if (checkedResults.has(base) || !spec.fields.some((item) => item.name === `${base}_raw_data`)) continue;
    checkedResults.add(base);
    const mean = row[`${base}_mean`];
    const std = row[`${base}_std`];
    const unit = row[`${base}_unit`];
    const raw = row[`${base}_raw_data`];
    const hasMean = hasValue(mean);
    const hasStd = hasValue(std);
    const hasUnit = hasValue(unit);
    if (hasStd && !hasMean) {
      issues.push({ level: 'error', table: tableName, rowId, field: `${base}_std`, message: '\u586b\u5199 std \u65f6\u5fc5\u987b\u540c\u65f6\u586b\u5199 mean' });
    }
    if (hasMean && !hasUnit && !(tableName === 'Engineering' && base === 'fold_change')) {
      issues.push({ level: 'error', table: tableName, rowId, field: `${base}_unit`, message: '\u586b\u5199 mean \u65f6\u5fc5\u987b\u9009\u62e9\u5355\u4f4d' });
    }
    if (!hasMean && hasUnit) {
      issues.push({ level: 'warning', table: tableName, rowId, field: `${base}_unit`, message: '\u5df2\u9009\u62e9\u5355\u4f4d\u4f46\u672a\u586b\u5199 mean\uff1b\u8bf7\u786e\u8ba4\u662f\u5426\u9700\u8981\u7ed3\u6784\u5316\u6570\u503c' });
    }
    if (hasStd && !Number.isNaN(Number(std)) && Number(std) < 0) {
      issues.push({ level: 'error', table: tableName, rowId, field: `${base}_std`, message: 'std \u4e0d\u80fd\u5c0f\u4e8e 0' });
    }
    if (hasValue(raw)) {
      const invalid = asText(raw).split(',').map((item) => item.trim()).filter(Boolean).filter((item) => Number.isNaN(Number(item)));
      if (invalid.length) {
        issues.push({ level: 'warning', table: tableName, rowId, field: `${base}_raw_data`, message: `raw data \u5305\u542b\u975e\u6570\u5b57\u9879\uff1a${invalid.join(', ')}` });
      }
    }
  }

  if (tableName === 'Engineering') {
    if (hasValue(row.mutation_set) && !MUTATION_SET_PATTERN.test(asText(row.mutation_set))) {
      issues.push({
        level: 'warning',
        table: tableName,
        rowId,
        field: 'mutation_set',
        message: '\u7a81\u53d8\u7ec4\u5408\u5efa\u8bae\u4f7f\u7528 A123B \u6216 A123B/C45D \u683c\u5f0f\uff1b\u6c28\u57fa\u9178\u9700\u4e3a 20 \u79cd\u6807\u51c6\u5355\u5b57\u6bcd\u4ee3\u7801\uff0c\u591a\u70b9\u7a81\u53d8\u7528 / \u5206\u9694\u3002'
      });
    }

    const hasWtMetric = hasValue(row.WT_metric_value_mean) && hasValue(row.WT_metric_value_unit);
    const hasVariantMetric = hasValue(row.variant_metric_value_mean) && hasValue(row.variant_metric_value_unit);
    const hasFoldChange = hasValue(row.fold_change_mean);
    if (!hasFoldChange && !(hasWtMetric && hasVariantMetric)) {
      const field = hasWtMetric || hasVariantMetric ? 'WT_metric_value_mean/variant_metric_value_mean' : 'fold_change_mean';
      issues.push({
        level: 'error',
        table: tableName,
        rowId,
        field,
        message: '\u76f8\u5bf9\u503c\u5fc5\u987b\u586b\u5199 WT \u6307\u6807\u503c\u4e0e\u7a81\u53d8\u4f53\u6307\u6807\u503c\u4e00\u5bf9\uff0c\u6216\u76f4\u63a5\u586b\u5199\u76f8\u5bf9 WT \u500d\u6570\u3002'
      });
    }
  }

  if (spec.atLeastOne && !spec.atLeastOne.fields.some((field) => hasValue(row[field]))) {
    issues.push({ level: 'error', table: tableName, rowId, field: spec.atLeastOne.fields.join('/'), message: spec.atLeastOne.message });
  }

  if (tableName === 'WT_Enzymes' && hasValue(row.sequence_aa)) {
    const parsed = parseAminoAcidInput(asText(row.sequence_aa));
    if (parsed.nonStandardLetters.length) {
      issues.push({
        level: 'warning',
        table: tableName,
        rowId,
        field: 'sequence_aa',
        message: `\u6c28\u57fa\u9178\u5e8f\u5217\u5305\u542b\u975e\u6807\u51c6\u5b57\u6bcd\uff1a${parsed.nonStandardLetters.join(', ')}\uff1b\u8bf7\u786e\u8ba4\u662f\u5426\u4e3a\u975e\u5929\u7136\u6216\u4e0d\u786e\u5b9a\u6b8b\u57fa\u3002`
      });
    }
  }

  if (rowId && existingIds.has(rowId)) {
    issues.push({ level: 'error', table: tableName, rowId, field: pk, message: '主键重复' });
  }

  return issues;
}

export function validateDatabase(data: Partial<Record<TableName, RowData[]>>): ValidationIssue[] {
  const lookups = buildLookups(data);
  const vocab = buildVocab(data);
  const all: ValidationIssue[] = [];

  for (const table of TABLES) {
    const seen = new Set<string>();
    const pk = primaryField(table.name);
    for (const row of data[table.name] ?? []) {
      all.push(...validateRow(table.name, row, lookups, vocab, seen));
      const id = asText(row[pk]);
      if (id) seen.add(id);
    }
  }
  return all;
}

export function hasErrors(issues: ValidationIssue[]): boolean {
  return issues.some((issue) => issue.level === 'error');
}
