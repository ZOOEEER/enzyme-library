import XLSX from 'xlsx';
import { TABLES, TableName } from '../app/shared/schema';
import { RowData } from '../app/shared/validation';

export function readWorkbook(filePath: string): Partial<Record<TableName, RowData[]>> {
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const data: Partial<Record<TableName, RowData[]>> = {};
  for (const table of TABLES) {
    const sheet = workbook.Sheets[table.name];
    if (!sheet) {
      if (table.name !== 'Controlled_Vocab') data[table.name] = [];
      continue;
    }
    data[table.name] = XLSX.utils.sheet_to_json<RowData>(sheet, { defval: '' });
  }
  return data;
}

export function writeWorkbook(filePath: string, data: Partial<Record<TableName, RowData[]>>): void {
  const workbook = XLSX.utils.book_new();
  for (const table of TABLES) {
    const rows = data[table.name] ?? [];
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: table.fields.map((field) => field.name) });
    XLSX.utils.book_append_sheet(workbook, worksheet, table.name);
  }
  XLSX.writeFile(workbook, filePath);
}

export function readSheetRows(filePath: string, sheetName: string): RowData[] {
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const sheet = workbook.Sheets[sheetName];
  return sheet ? XLSX.utils.sheet_to_json<RowData>(sheet, { defval: '' }) : [];
}
