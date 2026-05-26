import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { allData, defaultDatabasePath, deleteRow, listRows, openDatabase, readDatabaseSettings, settingsPath, upsertRow, validateDatabaseFile, writeDatabaseSettings } from './database';

const tempDirs: string[] = [];
const sqliteNativeAvailable = (() => {
  try {
    const BetterSqlite3 = require('better-sqlite3');
    const db = new BetterSqlite3(':memory:');
    db.close();
    return true;
  } catch {
    return false;
  }
})();
const describeIfSqliteNativeAvailable = sqliteNativeAvailable ? describe : describe.skip;

function tempUserData() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'enzyme-db-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describeIfSqliteNativeAvailable('database persistence and row operations', () => {
  it('uses an isolated SQLite database and keeps the legacy copy migration compatible', () => {
    const userData = tempUserData();
    const legacyPath = path.join(userData, 'ired-enzyme-library.sqlite');
    fs.writeFileSync(legacyPath, '');
    const store = openDatabase(userData);
    try {
      expect(store.path).toBe(path.join(userData, 'enzyme-library.sqlite'));
      expect(fs.existsSync(store.path)).toBe(true);
    } finally {
      store.db.close();
    }
  });

  it('opens the configured database path from settings and initializes missing files', () => {
    const userData = tempUserData();
    const customPath = path.join(userData, 'projects', 'custom.sqlite');
    writeDatabaseSettings(userData, { databasePath: customPath });
    expect(readDatabaseSettings(userData).databasePath).toBe(customPath);
    expect(settingsPath(userData)).toBe(path.join(userData, 'settings.json'));
    const store = openDatabase(userData);
    try {
      expect(store.path).toBe(customPath);
      expect(fs.existsSync(customPath)).toBe(true);
      expect(defaultDatabasePath(userData)).toBe(path.join(userData, 'enzyme-library.sqlite'));
    } finally {
      store.db.close();
    }
  });

  it('rejects existing SQLite files that do not look like Enzyme Library databases', () => {
    const userData = tempUserData();
    const foreignPath = path.join(userData, 'foreign.sqlite');
    const foreign = new Database(foreignPath);
    foreign.prepare('CREATE TABLE other_app (id TEXT PRIMARY KEY)').run();
    foreign.close();
    expect(validateDatabaseFile(foreignPath).ok).toBe(false);
    const reopened = new Database(foreignPath, { readonly: true });
    try {
      const tables = reopened.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>;
      expect(tables.map((table) => table.name)).toEqual(['other_app']);
    } finally {
      reopened.close();
    }
  });

  it('upserts valid rows, updates by primary key, and deletes by primary key', async () => {
    const store = openDatabase(tempUserData());
    try {
      const first = await upsertRow(store.db, 'References', {
        reference_id: 'REF-0001',
        source: '文献',
        citation_or_note: 'first'
      });
      expect(first.issues).toHaveLength(0);

      const update = await upsertRow(store.db, 'References', {
        reference_id: 'REF-0001',
        source: '专利',
        citation_or_note: 'updated'
      });
      expect(update.issues).toHaveLength(0);
      expect(listRows(store.db, 'References')).toEqual([
        expect.objectContaining({ reference_id: 'REF-0001', source: '专利', citation_or_note: 'updated' })
      ]);

      deleteRow(store.db, 'References', 'REF-0001');
      expect(listRows(store.db, 'References')).toHaveLength(0);
    } finally {
      store.db.close();
    }
  });

  it('models CSV import as row-by-row upsert: successful rows remain when a later row has errors', async () => {
    const store = openDatabase(tempUserData());
    try {
      const rows = [
        { reference_id: 'REF-0001', source: '文献', citation_or_note: 'valid' },
        { reference_id: 'REF-0002', source: '文献', citation_or_note: '' }
      ];
      const issues = [];
      for (const row of rows) {
        const saved = await upsertRow(store.db, 'References', row);
        issues.push(...saved.issues);
      }
      expect(issues.some((issue) => issue.level === 'error' && issue.rowId === 'REF-0002')).toBe(true);
      expect(listRows(store.db, 'References')).toEqual([
        expect.objectContaining({ reference_id: 'REF-0001', citation_or_note: 'valid' })
      ]);
    } finally {
      store.db.close();
    }
  });

  it('rejects missing foreign keys and keeps invalid fact rows out of the database', async () => {
    const store = openDatabase(tempUserData());
    try {
      await upsertRow(store.db, 'References', { reference_id: 'REF-0001', source: '文献', citation_or_note: 'ref' });
      const result = await upsertRow(store.db, 'Enzyme_Substrate_Relations', {
        relation_id: 'REL-0001',
        enzyme_id: 'ENZ-MISSING',
        reaction_id: 'RXN-MISSING',
        condition_id: 'COND-MISSING',
        reference_id: 'REF-0001'
      });
      expect(result.issues.some((issue) => issue.level === 'error' && issue.field === 'enzyme_id')).toBe(true);
      expect(listRows(store.db, 'Enzyme_Substrate_Relations')).toHaveLength(0);
    } finally {
      store.db.close();
    }
  });

  it('generates formula/InChIKey for Chemicals and rejects duplicate structures', async () => {
    const store = openDatabase(tempUserData());
    try {
      const ethanol = await upsertRow(store.db, 'Chemicals', {
        compound_id: 'CMP-0001',
        compound_name: 'ethanol',
        canonical_smiles: 'CCO'
      });
      expect(ethanol.issues).toHaveLength(0);
      const saved = listRows(store.db, 'Chemicals')[0];
      expect(saved.formula).toBe('C2H6O');
      expect(String(saved.inchikey ?? '')).toHaveLength(27);

      const duplicate = await upsertRow(store.db, 'Chemicals', {
        compound_id: 'CMP-0002',
        compound_name: 'ethanol duplicate',
        canonical_smiles: 'CCO'
      });
      expect(duplicate.issues.some((issue) => issue.level === 'error' && issue.field === 'inchikey')).toBe(true);
      expect(listRows(store.db, 'Chemicals')).toHaveLength(1);
    } finally {
      store.db.close();
    }
  });

  it('exposes validation issues from persisted data snapshots', async () => {
    const store = openDatabase(tempUserData());
    try {
      await upsertRow(store.db, 'References', { reference_id: 'REF-0001', source: '文献', citation_or_note: 'ref' });
      const data = allData(store.db);
      expect(data.References?.some((row) => row.reference_id === 'REF-0001')).toBe(true);
      expect(data.Units?.length).toBeGreaterThan(0);
      expect(data.Controlled_Vocab?.length).toBeGreaterThan(0);
    } finally {
      store.db.close();
    }
  });
});
