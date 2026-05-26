import fs from 'node:fs';
import path from 'node:path';
import { TABLES, TableName, tableSpec } from '../app/shared/schema';
import { RowData } from '../app/shared/validation';

const BOM = '\uFEFF';
const CSV_TABLES = TABLES.filter((table) => table.name !== 'Units').map((table) => table.name);

function assertCsvTable(tableName: TableName): void {
  if (!CSV_TABLES.includes(tableName)) throw new Error(`${tableName} is not supported for CSV import/export`);
}

function escapeCsv(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((item) => item.trim() !== '') || rows.length === 0) rows.push(row);
  return rows;
}

function tableToCsv(tableName: TableName, rows: RowData[]): string {
  assertCsvTable(tableName);
  const fields = tableSpec(tableName).fields.filter((field) => !field.hidden).map((field) => field.name);
  const lines = [fields.map(escapeCsv).join(',')];
  for (const row of rows) lines.push(fields.map((field) => escapeCsv(row[field])).join(','));
  return BOM + lines.join('\r\n');
}

export function writeCsvTemplate(filePath: string, tableName: TableName): void {
  fs.writeFileSync(filePath, tableToCsv(tableName, []), 'utf8');
}

export function readTableCsv(filePath: string, tableName: TableName): RowData[] {
  assertCsvTable(tableName);
  const rows = parseCsv(fs.readFileSync(filePath, 'utf8'));
  const [header = [], ...body] = rows;
  const allowed = new Set(tableSpec(tableName).fields.filter((field) => !field.hidden).map((field) => field.name));
  return body.filter((line) => line.some((cell) => cell.trim() !== '')).map((line) => {
    const row: RowData = {};
    header.forEach((column, index) => {
      if (allowed.has(column)) row[column] = line[index] ?? '';
    });
    return row;
  });
}

export function writeAllCsv(directoryPath: string, data: Partial<Record<TableName, RowData[]>>): void {
  fs.mkdirSync(directoryPath, { recursive: true });
  for (const tableName of CSV_TABLES) {
    fs.writeFileSync(path.join(directoryPath, `${tableName}.csv`), tableToCsv(tableName, data[tableName] ?? []), 'utf8');
  }
}

export function writeCurrentCsv(filePath: string, tableName: TableName, rows: RowData[]): void {
  fs.writeFileSync(filePath, tableToCsv(tableName, rows), 'utf8');
}
