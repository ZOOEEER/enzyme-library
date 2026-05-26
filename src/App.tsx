import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { TABLE_GROUPS, TableName, TableSpec, VocabEntry, autoIdPrefix, primaryField } from '../app/shared/schema';
import { RowData, ValidationIssue } from '../app/shared/validation';
import { DataTable } from './components/DataTable';
import { RowEditor } from './components/RowEditor';
import { VocabManager } from './components/VocabManager';
import { IssueModal } from './components/IssueModal';
import { UnitsManager } from './components/UnitsManager';

type ActivePage = TableName | 'Settings' | 'Help' | 'About';
type HelpDocName = 'user-manual.md' | 'data-model.md' | 'data-persistence.md';

const HELP_DOCS: Array<{ file: HelpDocName; title: string }> = [
  { file: 'user-manual.md', title: '\u7528\u6237\u624b\u518c' },
  { file: 'data-model.md', title: '\u6570\u636e\u6a21\u578b' },
  { file: 'data-persistence.md', title: '\u6570\u636e\u6301\u4e45\u5316' }
];

const HELP_DOC_FALLBACKS: Partial<Record<HelpDocName, string>> = {
  'data-persistence.md': `# \u6570\u636e\u6301\u4e45\u5316

## \u57fa\u672c\u539f\u5219

- SQLite \u662f\u5e94\u7528\u5185\u7684\u6743\u5a01\u6570\u636e\u6e90\u3002
- CSV \u548c xlsx \u7528\u4e8e\u6a21\u677f\u3001\u6279\u91cf\u7f16\u8f91\u548c\u534f\u4f5c\u4ea4\u6362\u3002
- CSV \u5bfc\u5165\u65f6\uff0c\u672a\u77e5\u65e7\u5217\u4f1a\u88ab\u5ffd\u7565\uff1b\u4fdd\u5b58\u524d\u4ecd\u9700\u901a\u8fc7\u6821\u9a8c\u3002
- \u5217\u8868\u5b57\u6bb5\u53ea\u662f\u672c\u673a\u663e\u793a\u504f\u597d\uff0c\u4e0d\u6539\u53d8\u5b9e\u9645\u6570\u636e\u3002

## CSV \u4ea4\u6362

- \`\u4e0b\u8f7d\u6a21\u677f CSV\`\uff1a\u5bfc\u51fa\u5f53\u524d\u8868\u7684\u7a7a\u6a21\u677f\u3002
- \`\u5bfc\u5165 CSV\`\uff1a\u6309\u5f53\u524d\u8868\u4e3b\u952e\u65b0\u589e\u6216\u66f4\u65b0\uff0c\u4e0d\u6e05\u7a7a\u6574\u8868\u3002
- \`\u5bfc\u51fa\u5f53\u524d CSV\`\uff1a\u5bfc\u51fa\u5f53\u524d\u8868\u5168\u90e8\u6570\u636e\uff0c\u4e0d\u53d7\u641c\u7d22\u548c\u5217\u8868\u5b57\u6bb5\u5f71\u54cd\u3002
- \`\u5bfc\u51fa\u5168\u90e8 CSV\`\uff1a\u5bfc\u51fa\u6240\u6709\u53c2\u4e0e\u6570\u636e\u4ea4\u6362\u7684\u8868\u3002
- \u6279\u91cf\u5bfc\u5165\u540e\u5efa\u8bae\u8fd0\u884c \`\u6574\u5e93\u6821\u9a8c\`\uff0c\u68c0\u67e5\u5fc5\u586b\u5b57\u6bb5\u3001\u5f15\u7528\u5173\u7cfb\u3001\u5355\u4f4d\u548c\u7ed3\u6784\u5316\u7ed3\u679c\u3002

## \u8bbe\u7f6e\u3001\u5907\u4efd\u4e0e\u6062\u590d

- \u8bbe\u7f6e\u9875\u663e\u793a SQLite \u6570\u636e\u5e93\u8def\u5f84\u3002
- \u53ef\u5907\u4efd\u5f53\u524d\u6570\u636e\u5e93\u3002
- \u53ef\u4ece SQLite \u6587\u4ef6\u6062\u590d\u6570\u636e\u5e93\u3002
- \u6062\u590d\u6570\u636e\u5e93\u6216\u6279\u91cf\u5bfc\u5165\u540e\uff0c\u5efa\u8bae\u8fd0\u884c \`\u6574\u5e93\u6821\u9a8c\`\u3002`
};

function emptyRow(spec: TableSpec): RowData {
  const row: RowData = {};
  for (const field of spec.fields) row[field.name] = '';
  return row;
}

function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return parts.filter(Boolean).map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <span key={key}>{link[1]}</span>;
    return part;
  });
}

function MarkdownView({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const lines = text.split(/\r?\n/);
  let listItems: ReactNode[][] = [];
  let ordered = false;
  let codeLines: string[] = [];
  let inCode = false;

  function flushList(key: string) {
    if (!listItems.length) return;
    const items = listItems.map((item, index) => <li key={`${key}-li-${index}`}>{item}</li>);
    nodes.push(ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>);
    listItems = [];
  }

  function flushCode(key: string) {
    nodes.push(<pre key={key}><code>{codeLines.join('\n')}</code></pre>);
    codeLines = [];
  }

  lines.forEach((line, index) => {
    if (line.trimStart().startsWith('```')) {
      if (inCode) flushCode(`code-${index}`);
      else flushList(`list-before-code-${index}`);
      inCode = !inCode;
      return;
    }
    if (inCode) {
      codeLines.push(line);
      return;
    }
    if (!line.trim()) {
      flushList(`list-${index}`);
      return;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushList(`list-before-heading-${index}`);
      const level = Math.min(heading[1].length, 4);
      const content = renderInlineMarkdown(heading[2], `h-${index}`);
      if (level === 1) nodes.push(<h1 key={`h-${index}`}>{content}</h1>);
      else if (level === 2) nodes.push(<h2 key={`h-${index}`}>{content}</h2>);
      else if (level === 3) nodes.push(<h3 key={`h-${index}`}>{content}</h3>);
      else nodes.push(<h4 key={`h-${index}`}>{content}</h4>);
      return;
    }
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    const orderedItem = line.match(/^\s*\d+\.\s+(.+)$/);
    if (bullet || orderedItem) {
      const nextOrdered = Boolean(orderedItem);
      if (listItems.length && ordered !== nextOrdered) flushList(`list-switch-${index}`);
      ordered = nextOrdered;
      listItems.push(renderInlineMarkdown((bullet ?? orderedItem)![1], `li-${index}`));
      return;
    }
    flushList(`list-before-p-${index}`);
    nodes.push(<p key={`p-${index}`}>{renderInlineMarkdown(line, `p-${index}`)}</p>);
  });
  if (inCode) flushCode('code-tail');
  flushList('list-tail');
  return <div className="markdown-view">{nodes}</div>;
}

export default function App() {
  const [schema, setSchema] = useState<TableSpec[]>([]);
  const [active, setActive] = useState<ActivePage>('WT_Enzymes');
  const [rows, setRows] = useState<RowData[]>([]);
  const [editing, setEditing] = useState<RowData | null>(null);
  const [editingMode, setEditingMode] = useState<'create' | 'edit'>('edit');
  const [copyPickerOpen, setCopyPickerOpen] = useState(false);
  const [copyQuery, setCopyQuery] = useState('');
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [status, setStatus] = useState('正在初始化...');
  const [query, setQuery] = useState('');
  const [dbPath, setDbPath] = useState('');
  const [coreOnly, setCoreOnly] = useState(true);
  const [helpDoc, setHelpDoc] = useState<HelpDocName>('user-manual.md');
  const [helpText, setHelpText] = useState('');
  const [helpError, setHelpError] = useState('');
  const [helpLoading, setHelpLoading] = useState(false);
  const [allRows, setAllRows] = useState<Partial<Record<TableName, RowData[]>>>({});
  const [vocabEntries, setVocabEntries] = useState<VocabEntry[]>([]);
  const [modalIssues, setModalIssues] = useState<ValidationIssue[] | null>(null);
  const [editorIssues, setEditorIssues] = useState<ValidationIssue[]>([]);
  const [modalTitle, setModalTitle] = useState('校验报告');
  const [pendingDelete, setPendingDelete] = useState<RowData | null>(null);
  const refreshSeq = useRef(0);

  const activeTable = active === 'Settings' || active === 'Help' || active === 'About' ? 'WT_Enzymes' : active;
  const activeSpec = useMemo(() => schema.find((item) => item.name === activeTable), [schema, activeTable]);

  async function refresh(table: TableName = activeTable) {
    const seq = ++refreshSeq.current;
    const [nextRows, nextIssues, nextVocab] = await Promise.all([window.enzymeApi.listRows(table), window.enzymeApi.validateDatabase(), window.enzymeApi.listVocab()]);
    const snapshots: Partial<Record<TableName, RowData[]>> = {};
    await Promise.all(schema.map(async (item) => { snapshots[item.name] = await window.enzymeApi.listRows(item.name); }));
    if (seq !== refreshSeq.current) return;
    setRows(nextRows);
    setIssues(nextIssues);
    setVocabEntries(nextVocab);
    setAllRows(snapshots);
  }

  useEffect(() => {
    Promise.all([window.enzymeApi.getSchema(), window.enzymeApi.dbPath()]).then(([specs, path]) => {
      setSchema(specs);
      setDbPath(path);
      setStatus('就绪');
    });
  }, []);

  useEffect(() => {
    refreshSeq.current += 1;
    setRows([]);
    setEditing(null);
    setCopyPickerOpen(false);
    setCopyQuery('');
    if (schema.length && active !== 'Settings' && active !== 'Help' && active !== 'About') refresh(activeTable);
    setEditorIssues([]);
  }, [active, activeTable, schema.length]);

  useEffect(() => {
    if (active !== 'Help') return;
    let canceled = false;
    setHelpLoading(true);
    setHelpError('');
    window.enzymeApi.readHelpDoc(helpDoc).then((result) => {
      if (canceled) return;
      setHelpLoading(false);
      if (result.ok) setHelpText(result.text ?? '');
      else if (HELP_DOC_FALLBACKS[helpDoc]) setHelpText(HELP_DOC_FALLBACKS[helpDoc] ?? '');
      else setHelpError(result.error ?? '\u65e0\u6cd5\u8bfb\u53d6\u5e2e\u52a9\u6587\u6863');
    });
    return () => { canceled = true; };
  }, [active, helpDoc]);

  async function save(row: RowData) {
    if (!activeSpec) return;
    const result = await window.enzymeApi.saveRow(activeSpec.name, row);
    setIssues(result.issues);
    if (result.issues.some((issue) => issue.level === 'error')) {
      setEditorIssues(result.issues);
      setStatus('保存失败：请先修复 Error');
      setModalTitle('保存失败：请修复以下问题');
      setModalIssues(result.issues);
      return;
    }
    setEditorIssues([]);
    setEditing(null);
    setCopyPickerOpen(false);
    setCopyQuery('');
    setStatus('已保存');
    await refresh(activeSpec.name);
  }

  async function createRow() {
    if (!activeSpec) return;
    const row = emptyRow(activeSpec);
    if (activeSpec.name === 'Units') {
      const maxId = rows.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
      row.id = String(maxId + 1);
    } else if (autoIdPrefix(activeSpec.name)) {
      row[primaryField(activeSpec.name)] = await window.enzymeApi.nextId(activeSpec.name);
    }
    setEditorIssues([]);
    setEditingMode('create');
    setCopyPickerOpen(false);
    setCopyQuery('');
    setEditing(row);
  }

  function editRow(row: RowData) {
    setEditorIssues([]);
    setEditingMode('edit');
    setCopyPickerOpen(false);
    setCopyQuery('');
    setEditing(row);
  }

  async function runValidation() {
    const nextIssues = await window.enzymeApi.validateDatabase();
    setIssues(nextIssues);
    setModalTitle('整库校验报告');
    setModalIssues(nextIssues);
    setStatus('校验完成');
  }

  function remove(row: RowData) {
    setPendingDelete(row);
  }

  async function confirmDelete() {
    if (!activeSpec || !pendingDelete) return;
    const id = String(pendingDelete[primaryField(activeSpec.name)] ?? '');
    if (!id) {
      setPendingDelete(null);
      return;
    }
    await window.enzymeApi.deleteRow(activeSpec.name, id);
    setPendingDelete(null);
    setStatus('\u5df2\u5220\u9664');
    await refresh(activeSpec.name);
  }

  async function downloadCsvTemplate() {
    if (!activeSpec) return;
    const result = await window.enzymeApi.downloadCsvTemplate(activeSpec.name);
    if (result.canceled) return;
    setStatus(`\u5df2\u4e0b\u8f7d CSV \u6a21\u677f\uff1a${result.filePath}`);
  }

  async function importCsv() {
    if (!activeSpec) return;
    const result = await window.enzymeApi.importCsv(activeSpec.name);
    if (result.canceled) return;
    setStatus(result.imported ? `\u5df2\u5bfc\u5165 CSV\uff1a${result.filePath}` : 'CSV \u5bfc\u5165\u5b58\u5728 Error');
    setIssues(result.issues ?? []);
    if (!result.imported || result.issues?.length) {
      setModalTitle(result.imported ? 'CSV \u5bfc\u5165\u5b8c\u6210\uff1a\u6821\u9a8c\u62a5\u544a' : 'CSV \u5bfc\u5165\u5931\u8d25\uff1a\u8bf7\u4fee\u590d\u4ee5\u4e0b\u95ee\u9898');
      setModalIssues(result.issues ?? []);
    }
    await refresh(activeSpec.name);
  }

  async function exportAllCsv() {
    const result = await window.enzymeApi.exportAllCsv();
    if (result.canceled) return;
    setStatus(`\u5df2\u5bfc\u51fa\u5168\u90e8 CSV\uff1a${result.filePath}`);
    setIssues(result.issues ?? []);
  }

  async function exportCurrentCsv() {
    if (!activeSpec || activeSpec.name === 'Units') return;
    const result = await window.enzymeApi.exportCurrentCsv(activeSpec.name);
    if (result.canceled) return;
    setStatus(`\u5df2\u5bfc\u51fa\u5f53\u524d CSV\uff1a${result.filePath}`);
    setIssues(result.issues ?? []);
  }

  async function backup() {
    const result = await window.enzymeApi.backupDatabase();
    if (!result.canceled) setStatus(`已备份：${result.filePath}`);
  }

  async function restore() {
    const result = await window.enzymeApi.restoreDatabase();
    if (!result.canceled) {
      setStatus(`已恢复：${result.filePath}`);
      await refresh(activeTable);
    }
  }

  async function addVocab(vocabName: string, value: string) {
    setVocabEntries(await window.enzymeApi.addVocab(vocabName, value));
    await refresh(activeTable);
    setStatus('已新增受控词');
  }

  async function deleteVocab(vocabName: string, value: string) {
    setVocabEntries(await window.enzymeApi.deleteVocab(vocabName, value));
    await refresh(activeTable);
    setStatus('已删除受控词；历史数据不会自动修改');
  }

  const filteredRows = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  const copyRows = activeSpec ? (allRows[activeSpec.name] ?? rows) : [];
  function rowSummary(row: RowData) {
    const value = activeSpec ? String(row[primaryField(activeSpec.name)] ?? '') : '';
    const name = String(row.enzyme_name ?? row.compound_name ?? row.reaction_name ?? row.condition_name ?? row.citation_or_note ?? row.source ?? row.mutant_name ?? row.mutation_set ?? '');
    return name ? `${value} \u2014 ${name}` : value;
  }
  const filteredCopyRows = copyRows.filter((row) => rowSummary(row).toLowerCase().includes(copyQuery.toLowerCase()));

  function copyFrom(row: RowData) {
    if (!activeSpec || !editing) return;
    const pk = primaryField(activeSpec.name);
    setEditing({ ...row, [pk]: editing[pk] ?? '' });
    setCopyPickerOpen(false);
    setCopyQuery('');
    setEditorIssues([]);
    setStatus('\u5df2\u590d\u5236\u8bb0\u5f55\uff1b\u8bf7\u68c0\u67e5\u540e\u4fdd\u5b58');
  }
  const vocabOptions = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const entry of vocabEntries) result[entry.vocabName] = entry.values;
    return result;
  }, [vocabEntries]);
  const referenceOptions = useMemo(() => {
    const result: Record<string, Array<{ value: string; label: string }>> = {};
    for (const spec of schema) {
      const pk = primaryField(spec.name);
      result[spec.name] = (allRows[spec.name] ?? []).map((row) => {
        const value = String(row[pk] ?? '');
        const name = String(row.enzyme_name ?? row.compound_name ?? row.reaction_name ?? row.condition_name ?? row.citation_or_note ?? row.source ?? '');
        return { value, label: name ? `${value} — ${name}` : value };
      }).filter((item) => item.value);
    }
    return result;
  }, [allRows, schema]);


  function renderSettings() {
    return (
      <section className="settings-page">
        <div className="panel">
          <h3>{'\u8bbe\u7f6e'}</h3>
          <p className="hint">{'\u6570\u636e\u5e93\u7ef4\u62a4\u4e0e\u6574\u5e93\u6821\u9a8c\u529f\u80fd\u96c6\u4e2d\u653e\u5728\u8fd9\u91cc\uff0c\u65e5\u5e38\u5f55\u5165\u4f18\u5148\u4f7f\u7528\u5de6\u4fa7\u6570\u636e\u8868\u548c CSV \u5bfc\u5165\u5bfc\u51fa\u3002'}</p>
          <label>
            <span>{'SQLite \u6570\u636e\u5e93\u8def\u5f84'}</span>
            <input value={dbPath} readOnly />
          </label>
          <div className="settings-actions">
            <button onClick={backup}>{'\u5907\u4efd\u6570\u636e\u5e93'}</button>
            <button onClick={restore}>{'\u6062\u590d\u6570\u636e\u5e93'}</button>
          </div>
        </div>
        <div className="panel">
          <h3>{'\u6570\u636e\u4ea4\u6362\u8bf4\u660e'}</h3>
          <p>{'SQLite \u662f\u5e94\u7528\u5185\u6743\u5a01\u6570\u636e\u6e90\uff1bCSV \u7528\u4e8e\u6a21\u677f\u4e0b\u8f7d\u3001\u6279\u91cf\u7f16\u8f91\u548c\u534f\u4f5c\u4ea4\u6362\u3002'}</p>
          <p>{'\u5f53\u524d\u8868 CSV \u5bfc\u5165\u6309\u4e3b\u952e\u65b0\u589e/\u66f4\u65b0\uff0c\u4e0d\u4f1a\u6e05\u7a7a\u6574\u5f20\u8868\u3002'}</p>
        </div>
      </section>
    );
  }

  function renderHelp() {
    return (
      <section className="help-page">
        <div className="panel">
          <div className="help-doc-tabs" role="tablist" aria-label="help-documents">
            {HELP_DOCS.map((doc) => (
              <button
                key={doc.file}
                className={helpDoc === doc.file ? 'active' : ''}
                onClick={() => setHelpDoc(doc.file)}
                type="button"
              >
                {doc.title}
              </button>
            ))}
          </div>
          {helpLoading && <p className="hint">{'\u6b63\u5728\u8bfb\u53d6\u5e2e\u52a9\u6587\u6863...'}</p>}
          {helpError && <p className="error-text">{helpError}</p>}
          {!helpLoading && !helpError && <MarkdownView text={helpText} />}
        </div>
      </section>
    );
  }

  function renderAbout() {
    return (
      <section className="settings-page">
        <div className="panel">
          <h3>{'Enzyme Library / \u9176\u5e93'}</h3>
          <p>{'\u7248\u672c\uff1a0.1.0'}</p>
          <p>{'\u7528\u9014\uff1a\u672c\u5730\u9176\u5e93\u6570\u636e\u5f55\u5165\u3001\u7ed3\u6784\u5316\u6574\u7406\u4e0e\u6821\u9a8c\u5de5\u5177\u3002'}</p>
          <p>{'GitHub\uff1ahttps://github.com/ZOOEEER/enzyme-library'}</p>
        </div>
        <div className="panel">
          <h3>{'\u6388\u6743\u4e0e\u4f7f\u7528'}</h3>
          <p>{'\u672c\u9879\u76ee\u4ee5 source-available \u975e\u5546\u7528\u65b9\u5f0f\u63d0\u4f9b\uff1a\u53ef\u7528\u4e8e\u5b66\u4e60\u3001\u8bc4\u4f30\u3001\u5f00\u53d1\u548c\u5185\u90e8\u975e\u5546\u4e1a\u4f7f\u7528\u3002'}</p>
          <p>{'\u672a\u7ecf\u6388\u6743\uff0c\u4e0d\u5f97\u7528\u4e8e\u5546\u4e1a\u9500\u552e\u3001\u5546\u4e1a\u5206\u53d1\u3001SaaS/\u6258\u7ba1\u670d\u52a1\u3001\u5546\u4e1a\u4ea7\u54c1\u96c6\u6210\u6216\u5bf9\u5916\u6536\u8d39\u670d\u52a1\u3002'}</p>
          <p>{'\u5546\u4e1a\u4f7f\u7528\u9700\u53e6\u884c\u83b7\u5f97\u6388\u6743\u3002\u7b2c\u4e09\u65b9\u4f9d\u8d56\u7ec4\u4ef6\u9075\u5faa\u5404\u81ea\u8bb8\u53ef\u8bc1\u3002'}</p>
        </div>
      </section>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>{'\u9176\u5e93'}</h1>
        <p className="subtitle">{'Enzyme Library \u6570\u636e\u5f55\u5165\u4e0e\u6821\u9a8c\u5de5\u5177'}</p>
        <nav>
          {TABLE_GROUPS.map((group) => (
            <div className="nav-group" key={group.title}>
              <div className="nav-group-title">{group.title}</div>
              {group.tables.map((name) => {
                const spec = schema.find((item) => item.name === name);
                return (
                  <button key={name} className={active === name ? 'active' : ''} onClick={() => setActive(name)}>
                    {spec?.title ?? name}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className={active === 'Settings' ? 'active' : ''} onClick={() => setActive('Settings')}>{'\u8bbe\u7f6e'}</button>
          <button className={active === 'Help' ? 'active' : ''} onClick={() => setActive('Help')}>{'\u5e2e\u52a9'}</button>
          <button className={active === 'About' ? 'active' : ''} onClick={() => setActive('About')}>{'\u5173\u4e8e'}</button>
        </div>
      </aside>

      <main className="main">
        <header className="toolbar">
          <div>
            <h2>{active === 'Settings' ? '\u8bbe\u7f6e' : active === 'Help' ? '\u5e2e\u52a9' : active === 'About' ? '\u5173\u4e8e' : activeSpec?.title}</h2>
            <p>{active === 'Settings' ? '\u6570\u636e\u5e93\u7ef4\u62a4\u3001\u5907\u4efd\u6062\u590d\u4e0e\u6574\u5e93\u6821\u9a8c\u3002' : active === 'Help' ? '\u67e5\u770b\u7528\u6237\u624b\u518c\u3001\u6570\u636e\u6a21\u578b\u548c\u6570\u636e\u6301\u4e45\u5316\u8bf4\u660e\u3002' : active === 'About' ? '\u7248\u6743\u3001\u6388\u6743\u4e0e\u9879\u76ee\u4fe1\u606f\u3002' : activeSpec?.description}</p>
          </div>
          <div className="actions">
            <button className="validate-button" onClick={runValidation}>{'\u6574\u5e93\u6821\u9a8c'}</button>
            {active !== 'Settings' && active !== 'Help' && active !== 'About' && activeSpec && <button onClick={downloadCsvTemplate}>{'\u4e0b\u8f7d\u6a21\u677f CSV'}</button>}
            {active !== 'Settings' && active !== 'Help' && active !== 'About' && activeSpec && <button onClick={importCsv}>{'\u5bfc\u5165 CSV'}</button>}
            {active !== 'Settings' && active !== 'Help' && active !== 'About' && activeSpec && activeSpec.name !== 'Units' && <button onClick={exportCurrentCsv}>{'\u5bfc\u51fa\u5f53\u524d CSV'}</button>}
            {active !== 'Help' && active !== 'About' && <button onClick={exportAllCsv}>{'\u5bfc\u51fa\u5168\u90e8 CSV'}</button>}
          </div>
        </header>

        <section className="workbench list-layout">
          {active === 'Settings' ? renderSettings() : active === 'Help' ? renderHelp() : active === 'About' ? renderAbout() : active === 'Controlled_Vocab' ? (
            <div className="full-pane">
              <VocabManager entries={vocabEntries} onAdd={addVocab} onDelete={deleteVocab} />
            </div>
          ) : active === 'Units' && activeSpec ? (
            <>
              <div className="full-pane">
                <UnitsManager rows={rows} query={query} onQuery={setQuery} />
              </div>
              {editing && (
                <aside className="editor-drawer">
                  <RowEditor
                    spec={activeSpec}
                    row={editing}
                    coreOnly={false}
                    issues={editorIssues}
                    vocabOptions={vocabOptions}
                    referenceOptions={referenceOptions}
                    onCancel={() => { setEditorIssues([]); setEditing(null); setCopyPickerOpen(false); setCopyQuery(''); }}
                    onSave={save}
                    mode={editingMode}
                    onOpenCopy={editingMode === 'create' ? () => setCopyPickerOpen(true) : undefined}
                  />
                </aside>
              )}
            </>
          ) : <>
          <div className="full-pane">
            <div className="table-actions">
              <input placeholder={'\u641c\u7d22\u5f53\u524d\u8868...'} value={query} onChange={(event) => setQuery(event.target.value)} />
              <div className="field-mode-toggle" role="group" aria-label="field-mode">
                <span>{'\u5b57\u6bb5\u6a21\u5f0f'}</span>
                <button type="button" className={coreOnly ? 'active' : ''} onClick={() => setCoreOnly(true)}>{'\u6838\u5fc3\u5b57\u6bb5'}</button>
                <button type="button" className={!coreOnly ? 'active' : ''} onClick={() => setCoreOnly(false)}>{'\u5168\u90e8\u5b57\u6bb5'}</button>
              </div>
              <button disabled={!activeSpec} onClick={createRow}>{'\u65b0\u589e'}</button>
            </div>
            {activeSpec && <DataTable spec={activeSpec} rows={filteredRows} allRows={allRows} onEdit={editRow} onDelete={remove} />}
          </div>
          {activeSpec && editing && (
            <aside className="editor-drawer">
              <RowEditor
                spec={activeSpec}
                row={editing}
                coreOnly={coreOnly}
                issues={editorIssues}
                vocabOptions={vocabOptions}
                referenceOptions={referenceOptions}
                onCancel={() => { setEditorIssues([]); setEditing(null); setCopyPickerOpen(false); setCopyQuery(''); }}
                onSave={save}
                mode={editingMode}
                onOpenCopy={editingMode === 'create' ? () => setCopyPickerOpen(true) : undefined}
              />
            </aside>
          )}
          </>}
        </section>
        <footer>{status}</footer>
      </main>
      {activeSpec && pendingDelete && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal confirm-modal">
            <div className="modal-head">
              <h3>{'\u786e\u8ba4\u5220\u9664'}</h3>
              <button onClick={() => setPendingDelete(null)}>{'\u5173\u95ed'}</button>
            </div>
            <div className="modal-body">
              <p>{'\u786e\u8ba4\u5220\u9664'} <strong>{String(pendingDelete[primaryField(activeSpec.name)] ?? '')}</strong>{'\uff1f'}</p>
              <p className="muted">{'\u5220\u9664\u540e\u5c06\u4ece\u5f53\u524d\u8868\u79fb\u9664\u8be5\u8bb0\u5f55\u3002'}</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setPendingDelete(null)}>{'\u53d6\u6d88'}</button>
              <button className="danger primary-danger" onClick={confirmDelete}>{'\u5220\u9664'}</button>
            </div>
          </div>
        </div>
      )}
      {modalIssues && <IssueModal title={modalTitle} issues={modalIssues} onClose={() => setModalIssues(null)} />}
      {activeSpec && editing && editingMode === 'create' && copyPickerOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal copy-modal">
            <div className="modal-head">
              <h3>{'\u590d\u5236\u73b0\u6709\u8bb0\u5f55'}</h3>
              <button onClick={() => setCopyPickerOpen(false)}>{'\u5173\u95ed'}</button>
            </div>
            <div className="modal-body">
              <input placeholder={'\u641c\u7d22\u7f16\u53f7\u6216\u6458\u8981...'} value={copyQuery} onChange={(event) => setCopyQuery(event.target.value)} />
              <div className="copy-list">
                {filteredCopyRows.map((row, index) => (
                  <button key={`${String(row[primaryField(activeSpec.name)] ?? '')}-${index}`} onClick={() => copyFrom(row)}>
                    {rowSummary(row)}
                  </button>
                ))}
              </div>
              {!filteredCopyRows.length && <p className="empty">{'\u5f53\u524d\u8868\u6682\u65e0\u53ef\u590d\u5236\u8bb0\u5f55'}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

