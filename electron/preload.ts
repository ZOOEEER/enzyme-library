import { contextBridge, ipcRenderer, webUtils } from 'electron';
import type { TableName, TableSpec, VocabEntry } from '../app/shared/schema';
import type { RowData, ValidationIssue } from '../app/shared/validation';

const api = {
  getSchema: () => ipcRenderer.invoke('schema:get') as Promise<TableSpec[]>,
  dbPath: () => ipcRenderer.invoke('db:path') as Promise<string>,
  listRows: (table: TableName) => ipcRenderer.invoke('rows:list', table) as Promise<RowData[]>,
  nextId: (table: TableName, prefix?: string) => ipcRenderer.invoke('rows:next-id', table, prefix) as Promise<string>,
  saveRow: (table: TableName, row: RowData) => ipcRenderer.invoke('rows:save', table, row) as Promise<{ issues: ValidationIssue[] }>,
  deleteRow: (table: TableName, id: string) => ipcRenderer.invoke('rows:delete', table, id) as Promise<boolean>,
  validateDatabase: () => ipcRenderer.invoke('db:validate') as Promise<ValidationIssue[]>,
  listVocab: () => ipcRenderer.invoke('vocab:list') as Promise<VocabEntry[]>,
  addVocab: (vocabName: string, value: string) => ipcRenderer.invoke('vocab:add', vocabName, value) as Promise<VocabEntry[]>,
  deleteVocab: (vocabName: string, value: string) => ipcRenderer.invoke('vocab:delete', vocabName, value) as Promise<VocabEntry[]>,
  describeSmiles: (smiles: string) => ipcRenderer.invoke('chem:describe-smiles', smiles) as Promise<{ inchikey?: string; formula?: string; error?: string }>,
  pathForFile: (file: File) => webUtils.getPathForFile(file),
  recognizeStructureImage: (imagePath: string) => ipcRenderer.invoke('chem:recognize-structure-image', imagePath) as Promise<{ ok: boolean; smiles?: string; error?: string }>,
  readHelpDoc: (fileName: string) => ipcRenderer.invoke('help:read-doc', fileName) as Promise<{ ok: boolean; text?: string; error?: string }>,
  importExcel: () => ipcRenderer.invoke('excel:import'),
  exportExcel: () => ipcRenderer.invoke('excel:export'),
  downloadCsvTemplate: (table: TableName) => ipcRenderer.invoke('csv:template', table),
  importCsv: (table: TableName) => ipcRenderer.invoke('csv:import', table),
  exportCurrentCsv: (table: TableName) => ipcRenderer.invoke('csv:export-current', table),
  exportAllCsv: () => ipcRenderer.invoke('csv:export-all'),
  importSequenceText: () => ipcRenderer.invoke('sequence:import') as Promise<{ canceled: boolean; text?: string; filePath?: string }>,
  backupDatabase: () => ipcRenderer.invoke('db:backup'),
  restoreDatabase: () => ipcRenderer.invoke('db:restore'),
  selectDatabaseFile: () => ipcRenderer.invoke('db:select-file') as Promise<{ canceled: boolean; filePath?: string; error?: string }>
};

contextBridge.exposeInMainWorld('enzymeApi', api);
contextBridge.exposeInMainWorld('iredApi', api);

export type EnzymeApi = typeof api;
