import path from 'node:path';
import fs from 'node:fs';
import { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu } from 'electron';
import isDev from 'electron-is-dev';
import { TABLES, TableName } from '../app/shared/schema';
import { validateDatabase } from '../app/shared/validation';
import { addVocabValue, allData, deleteRow, deleteVocabValue, listRows, listVocab, nextId, openDatabase, replaceAll, upsertRow, validateDatabaseFile, writeDatabaseSettings } from './database';
import { readWorkbook, writeWorkbook } from './excel';
import { readTableCsv, writeAllCsv, writeCsvTemplate, writeCurrentCsv } from './csv';
import { describeSmiles } from './chemistry';
import { recognizeStructureImage } from './ocsr';

let mainWindow: BrowserWindow | null = null;
let store: ReturnType<typeof openDatabase>;

const HELP_DOCS = new Set(['user-manual.md', 'data-model.md', 'data-persistence.md']);

function docPath(fileName: string) {
  const candidates = [
    path.join(process.cwd(), 'docs', fileName),
    path.join(process.resourcesPath ?? '', 'docs', fileName),
    path.join(__dirname, '../docs', fileName)
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
}

function configureMenu() {
  Menu.setApplicationMenu(null);
}

function createWindow() {
  app.setName('Enzyme Library');
  mainWindow = new BrowserWindow({
    title: 'Enzyme Library / 酶库',
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5288');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function registerDevShortcuts() {
  if (!isDev) return;
  globalShortcut.register('CommandOrControl+R', () => {
    mainWindow?.webContents.reload();
  });
  globalShortcut.register('CommandOrControl+F5', () => {
    app.relaunch();
    app.exit(0);
  });
}

app.whenReady().then(() => {
  store = openDatabase(app.getPath('userData'));
  configureMenu();
  createWindow();
  registerDevShortcuts();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

ipcMain.handle('schema:get', () => TABLES);
ipcMain.handle('db:path', () => store.path);
ipcMain.handle('rows:list', (_event, table: TableName) => listRows(store.db, table));
ipcMain.handle('rows:next-id', (_event, table: TableName, prefix?: string) => nextId(store.db, table, prefix));
ipcMain.handle('rows:save', async (_event, table: TableName, row) => upsertRow(store.db, table, row));
ipcMain.handle('rows:delete', (_event, table: TableName, id: string) => {
  deleteRow(store.db, table, id);
  return true;
});
ipcMain.handle('db:validate', () => validateDatabase(allData(store.db)));
ipcMain.handle('vocab:list', () => listVocab(store.db));
ipcMain.handle('vocab:add', (_event, vocabName: string, value: string) => addVocabValue(store.db, vocabName, value));
ipcMain.handle('vocab:delete', (_event, vocabName: string, value: string) => deleteVocabValue(store.db, vocabName, value));
ipcMain.handle('chem:describe-smiles', (_event, smiles: string) => describeSmiles(smiles));
ipcMain.handle('chem:recognize-structure-image', (_event, imagePath: string) => recognizeStructureImage(imagePath));
ipcMain.handle('help:read-doc', (_event, fileName: string) => {
  if (!HELP_DOCS.has(fileName)) return { ok: false, error: '\u4e0d\u652f\u6301\u7684\u5e2e\u52a9\u6587\u6863' };
  const target = docPath(fileName);
  try {
    return { ok: true, text: fs.readFileSync(target, 'utf8') };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('excel:import', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: '\u5bfc\u5165 \u9176\u5e93 Excel \u5de5\u4f5c\u7c3f',
    filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    properties: ['openFile']
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  const data = readWorkbook(result.filePaths[0]);
  return { canceled: false, filePath: result.filePaths[0], ...replaceAll(store.db, data) };
});

ipcMain.handle('excel:export', async () => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: '\u5bfc\u51fa \u9176\u5e93 Excel \u5de5\u4f5c\u7c3f',
    defaultPath: 'enzyme_library_export.xlsx',
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  writeWorkbook(result.filePath, allData(store.db));
  return { canceled: false, filePath: result.filePath, issues: validateDatabase(allData(store.db)) };
});

ipcMain.handle('csv:template', async (_event, table: TableName) => {
  if (table === 'Units') return { canceled: true, error: 'Units is not supported for CSV import/export' };
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: '下载当前表 CSV 模板',
    defaultPath: `${table}.csv`,
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  writeCsvTemplate(result.filePath, table);
  return { canceled: false, filePath: result.filePath };
});

ipcMain.handle('csv:import', async (_event, table: TableName) => {
  if (table === 'Units') return { canceled: true, error: 'Units is not supported for CSV import/export' };
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: '导入当前表 CSV',
    filters: [{ name: 'CSV', extensions: ['csv'] }],
    properties: ['openFile']
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  const rows = readTableCsv(result.filePaths[0], table);
  const issues = [];
  for (const row of rows) {
    const saved = await upsertRow(store.db, table, row);
    issues.push(...saved.issues);
  }
  return { canceled: false, filePath: result.filePaths[0], imported: !issues.some((issue) => issue.level === 'error'), issues };
});

ipcMain.handle('csv:export-all', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: '导出全部 CSV 到文件夹',
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  writeAllCsv(result.filePaths[0], allData(store.db));
  return { canceled: false, filePath: result.filePaths[0], issues: validateDatabase(allData(store.db)) };
});

ipcMain.handle('csv:export-current', async (_event, table: TableName) => {
  if (table === 'Units') return { canceled: true, error: 'Units is not supported for CSV import/export' };
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: '\u5bfc\u51fa\u5f53\u524d\u8868 CSV',
    defaultPath: `${table}.csv`,
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  writeCurrentCsv(result.filePath, table, allData(store.db)[table] ?? []);
  return { canceled: false, filePath: result.filePath, issues: validateDatabase(allData(store.db)) };
});

ipcMain.handle('sequence:import', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: '\u5bfc\u5165 FASTA/\u5e8f\u5217\u6587\u672c',
    filters: [{ name: 'FASTA/Text', extensions: ['fasta', 'fa', 'faa', 'txt'] }],
    properties: ['openFile']
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  return { canceled: false, filePath: result.filePaths[0], text: fs.readFileSync(result.filePaths[0], 'utf8') };
});

ipcMain.handle('db:backup', async () => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: '备份 SQLite 数据库',
    defaultPath: 'enzyme-library.sqlite',
    filters: [{ name: 'SQLite', extensions: ['sqlite', 'db'] }]
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  fs.copyFileSync(store.path, result.filePath);
  return { canceled: false, filePath: result.filePath };
});

ipcMain.handle('db:restore', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: '恢复 SQLite 数据库',
    filters: [{ name: 'SQLite', extensions: ['sqlite', 'db'] }],
    properties: ['openFile']
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  store.db.close();
  fs.copyFileSync(result.filePaths[0], store.path);
  store = openDatabase(app.getPath('userData'), store.path);
  return { canceled: false, filePath: result.filePaths[0] };
});

ipcMain.handle('db:select-file', async () => {
  const confirmation = await dialog.showMessageBox(mainWindow!, {
    type: 'warning',
    buttons: ['继续切换', '取消'],
    defaultId: 1,
    cancelId: 1,
    title: '切换数据库文件',
    message: '切换数据库文件不会删除当前数据库。',
    detail: '如需保存当前状态，请先点击“备份数据库”。切换后页面会刷新为新数据库内容。'
  });
  if (confirmation.response !== 0) return { canceled: true };
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: '选择或新建 SQLite 数据库文件',
    defaultPath: store.path,
    filters: [{ name: 'SQLite', extensions: ['sqlite', 'db'] }],
    properties: ['openFile', 'promptToCreate']
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  const selectedPath = result.filePaths[0];
  const validation = validateDatabaseFile(selectedPath);
  if (!validation.ok) return { canceled: false, error: validation.error };
  const previous = store;
  let nextStore: ReturnType<typeof openDatabase> | undefined;
  try {
    previous.db.close();
    nextStore = openDatabase(app.getPath('userData'), selectedPath);
    writeDatabaseSettings(app.getPath('userData'), { databasePath: selectedPath });
    store = nextStore;
    return { canceled: false, filePath: store.path };
  } catch (error) {
    nextStore?.db.close();
    store = openDatabase(app.getPath('userData'), previous.path);
    return { canceled: false, error: error instanceof Error ? error.message : String(error) };
  }
});
