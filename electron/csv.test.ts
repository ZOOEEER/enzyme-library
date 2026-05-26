import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { readTableCsv, writeAllCsv, writeCsvTemplate, writeCurrentCsv } from './csv';

function tempPath(name: string) {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'enzyme-csv-')), name);
}

describe('csv import/export surface', () => {
  it('excludes Units from CSV exchange', () => {
    expect(() => writeCsvTemplate(tempPath('Units.csv'), 'Units')).toThrow(/not supported/);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'enzyme-csv-all-'));
    writeAllCsv(dir, {});
    expect(fs.existsSync(path.join(dir, 'Units.csv'))).toBe(false);
  });

  it('exports schema-visible fields only', () => {
    const filePath = tempPath('WT_Enzymes.csv');
    writeCsvTemplate(filePath, 'WT_Enzymes');
    const header = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)[0];
    expect(header).toContain('expression_purification_method');
    expect(header).not.toContain('protein_form');
  });

  it('parses BOM, quoted cells, newlines, blank lines, and ignores unknown legacy columns', () => {
    const filePath = tempPath('Chemicals.csv');
    fs.writeFileSync(
      filePath,
      '\uFEFFcompound_id,compound_name,canonical_smiles,protein_form,notes\r\n' +
        'CMP-0001,"ethyl, acetate",CCOC=O,legacy,"line 1\nline ""2"""\r\n' +
        ',,,,\r\n',
      'utf8'
    );
    const rows = readTableCsv(filePath, 'Chemicals');
    expect(rows).toEqual([
      {
        compound_id: 'CMP-0001',
        compound_name: 'ethyl, acetate',
        canonical_smiles: 'CCOC=O',
        notes: 'line 1\nline "2"'
      }
    ]);
  });

  it('exports the rows passed to current table export regardless of visible table columns', () => {
    const filePath = tempPath('References.csv');
    writeCurrentCsv(filePath, 'References', [
      { reference_id: 'REF-0001', source: '文献', citation_or_note: 'A,B', notes: 'keep all exported schema fields' }
    ]);
    const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    expect(content.split(/\r?\n/)[0]).toContain('citation_or_note');
    expect(content).toContain('"A,B"');
    expect(readTableCsv(filePath, 'References')[0]).toMatchObject({
      reference_id: 'REF-0001',
      source: '文献',
      citation_or_note: 'A,B'
    });
  });
});
