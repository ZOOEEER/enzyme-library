import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { writeAllCsv, writeCsvTemplate } from './csv';

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
});
