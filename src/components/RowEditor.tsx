import { useEffect, useMemo, useRef, useState } from 'react';
import { ACTIVITY_METRIC_UNIT_VOCABS, FieldSpec, TableSpec, fieldHelp, fieldTitle, primaryField, vocabUsage } from '../../app/shared/schema';
import { parseAminoAcidInput } from '../../app/shared/sequence';
import { RowData, ValidationIssue } from '../../app/shared/validation';
import { SmilesPreview } from './SmilesPreview';
import { StructureSketcherModal } from './StructureSketcherModal';

interface Props {
  spec: TableSpec;
  row: RowData;
  vocabOptions?: Record<string, string[]>;
  referenceOptions?: Record<string, Array<{ value: string; label: string }>>;
  coreOnly?: boolean;
  issues?: ValidationIssue[];
  onSave: (row: RowData) => void;
  onCancel: () => void;
  mode?: 'create' | 'edit';
  onOpenCopy?: () => void;
}

const REFERENCE_OPTION_LIMIT = 100;

interface ReferenceOption {
  value: string;
  label: string;
}

function inputType(field: FieldSpec) {
  if (field.kind === 'number') return 'number';
  if (field.kind === 'date') return 'date';
  return 'text';
}

function isCoreField(field: FieldSpec, spec: TableSpec) {
  const metadataGroups = new Set(['\u5143\u6570\u636e', '\u5143\u4fe1\u606f']);
  const metadataFields = new Set(['reference_id', 'curator', 'curation_date', 'data_status', 'notes']);
  return Boolean(field.primary || field.required || field.core || metadataGroups.has(field.group ?? '') || metadataFields.has(field.name) || spec.atLeastOne?.fields.includes(field.name));
}

function compoundPrefix(role: string) {
  const value = role.toLowerCase();
  if (value.includes('\u5e95\u7269') || value.includes('substrate')) return 'SUB';
  if (value.includes('\u4ea7\u7269') || value.includes('product')) return 'PRO';
  if (value.includes('\u8f85\u56e0\u5b50') || value.includes('cofactor')) return 'COF';
  if (value.includes('\u6eb6\u5242') || value.includes('solvent')) return 'SOL';
  return 'CMP';
}

function isAutoCompoundId(value: unknown) {
  return /^(CMP|SUB|PRO|COF|SOL)-\d{4,}$/.test(String(value ?? ''));
}

function splitIds(value: unknown) {
  return String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean);
}

function isMeasurementTypical(field: FieldSpec) {
  return field.name.endsWith('_typical');
}

function isResultMean(field: FieldSpec) {
  return field.name.endsWith('_mean');
}

function fieldByName(fields: FieldSpec[], name: string) {
  return fields.find((field) => field.name === name);
}

function numericBase(name: string) {
  return name.replace(/_(typical|min|max|unit)$/, '');
}

function resultBase(name: string) {
  return name.replace(/_(mean|std|unit|raw_data)$/, '');
}

function isEngineeringRelativeMetric(base: string) {
  return base === 'WT_metric_value' || base === 'variant_metric_value';
}

function ReferenceCombobox({
  value,
  options,
  readOnly,
  onChange
}: {
  value: string;
  options: ReferenceOption[];
  readOnly?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const query = value.trim().toLowerCase();
  const filtered = options.filter((option) => {
    if (!query) return true;
    return option.value.toLowerCase().includes(query) || option.label.toLowerCase().includes(query);
  });
  const visible = filtered.slice(0, REFERENCE_OPTION_LIMIT);
  const truncated = filtered.length > visible.length;

  return (
    <div className="reference-combobox">
      <input
        value={value}
        onFocus={() => { if (!readOnly) setOpen(true); }}
        onClick={() => { if (!readOnly) setOpen(true); }}
        onChange={(event) => {
          onChange(event.target.value);
          if (!readOnly) setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
          if (event.key === 'ArrowDown' && !readOnly) setOpen(true);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        readOnly={readOnly}
      />
      {open && !readOnly && (
        <div className="reference-options" role="listbox">
          {visible.map((option) => (
            <button
              type="button"
              className="reference-option"
              key={option.value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <strong>{option.value}</strong>
              <span>{option.label}</span>
            </button>
          ))}
          {!visible.length && <div className="reference-option-note">{'\u65e0\u5339\u914d\u5173\u8054\u8bb0\u5f55'}</div>}
          {truncated && <div className="reference-option-note">{'\u4ec5\u663e\u793a\u524d 100 \u6761\uff0c\u8bf7\u7ee7\u7eed\u8f93\u5165\u7b5b\u9009\u3002'}</div>}
        </div>
      )}
    </div>
  );
}

export function RowEditor({ spec, row, vocabOptions = {}, referenceOptions = {}, coreOnly = false, issues = [], onSave, onCancel, mode = 'edit', onOpenCopy }: Props) {
  const [draft, setDraft] = useState<RowData>(row);
  const [smilesIssue, setSmilesIssue] = useState('');
  const [compoundIdManual, setCompoundIdManual] = useState(false);
  const sequenceFileInputRef = useRef<HTMLInputElement | null>(null);
  const structureImageInputRef = useRef<HTMLInputElement | null>(null);
  const [structureInputMessage, setStructureInputMessage] = useState('');
  const [recognizingStructure, setRecognizingStructure] = useState(false);
  const [sketcherOpen, setSketcherOpen] = useState(false);
  const pk = primaryField(spec.name);

  useEffect(() => {
    setDraft(row);
    setSmilesIssue('');
    setStructureInputMessage('');
    setSketcherOpen(false);
  }, [row]);

  const groups = useMemo(() => {
    const map = new Map<string, FieldSpec[]>();
    for (const field of spec.fields.filter((item) => !item.hidden && (!coreOnly || isCoreField(item, spec)))) {
      if (field.name.match(/_(min|max|unit)$/) && fieldByName(spec.fields, `${numericBase(field.name)}_typical`)) continue;
      if (field.name.match(/_(std|unit|raw_data)$/) && fieldByName(spec.fields, `${resultBase(field.name)}_mean`)) continue;
      const group = field.group ?? '\u5b57\u6bb5';
      map.set(group, [...(map.get(group) ?? []), field]);
    }
    return [...map.entries()];
  }, [spec, coreOnly]);

  function setField(name: string, value: string) {
    if (spec.name === 'Chemicals' && name === 'compound_id') setCompoundIdManual(true);
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function setFieldFromSystem(name: string, value: string) {
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function isReadonly(field: FieldSpec) {
    return Boolean(field.readonly || (mode === 'edit' && field.name === pk));
  }

  function toggleMultiField(name: string, value: string) {
    const current = new Set(splitIds(draft[name]));
    if (current.has(value)) current.delete(value);
    else current.add(value);
    setField(name, [...current].join(','));
  }

  function compoundText(id: string) {
    const row = (referenceOptions.Chemicals ?? []).find((option) => option.value === id);
    const chemical = row?.label ?? id;
    const formula = chemical.match(/\(([^)]+)\)/)?.[1];
    return formula ? `${id}(${formula})` : id;
  }

  function renderVocabSelect(field: FieldSpec) {
    const value = String(draft[field.name] ?? '');
    const options = vocabOptions[field.vocab ?? ''] ?? [];
    return (
      <>
        <select value={value} onChange={(event) => setField(field.name, event.target.value)} disabled={isReadonly(field)}>
          <option value="">{'\u8bf7\u9009\u62e9...'}</option>
          {value && !options.includes(value) && <option value={value}>{value}{'\u5f53\u524d\u503c\u4e0d\u5728\u53d7\u63a7\u8bcd\u8868\u4e2d'}</option>}
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        {value && !options.includes(value) && <small className="warning-text">{'\u5f53\u524d\u503c\u4e0d\u5728\u53d7\u63a7\u8bcd\u8868\u4e2d'}</small>}
      </>
    );
  }

  function renderNumericQuartet(field: FieldSpec) {
    const base = numericBase(field.name);
    const minField = fieldByName(spec.fields, `${base}_min`);
    const maxField = fieldByName(spec.fields, `${base}_max`);
    const unitField = fieldByName(spec.fields, `${base}_unit`);
    if (!minField || !maxField || !unitField) return null;
    return (
      <div className="numeric-quartet">
        <label><span>{'\u5178\u578b\u503c'}</span><input type="number" value={String(draft[field.name] ?? '')} onChange={(event) => setField(field.name, event.target.value)} /></label>
        <label><span>{'\u4e0b\u9650'}</span><input type="number" value={String(draft[minField.name] ?? '')} onChange={(event) => setField(minField.name, event.target.value)} /></label>
        <label><span>{'\u4e0a\u9650'}</span><input type="number" value={String(draft[maxField.name] ?? '')} onChange={(event) => setField(maxField.name, event.target.value)} /></label>
        {base !== 'pH' && <label><span>{'\u5355\u4f4d'}</span>{renderVocabSelect(unitField)}</label>}
      </div>
    );
  }

  function renderDynamicUnitSelect(field: FieldSpec, vocabName: string | undefined) {
    const value = String(draft[field.name] ?? '');
    const options = vocabName ? vocabOptions[vocabName] ?? [] : [];
    return (
      <>
        <select value={value} onChange={(event) => setField(field.name, event.target.value)} disabled={!vocabName}>
          <option value="">{vocabName ? '\u8bf7\u9009\u62e9...' : '\u8bf7\u5148\u9009\u62e9\u6307\u6807\u7c7b\u578b'}</option>
          {value && !options.includes(value) && <option value={value}>{value}{'\u5f53\u524d\u503c\u4e0d\u5728\u53d7\u63a7\u8bcd\u8868\u4e2d'}</option>}
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        {value && vocabName && !options.includes(value) && <small className="warning-text">{'\u5f53\u524d\u503c\u4e0d\u5728\u53d7\u63a7\u8bcd\u8868\u4e2d'}</small>}
        {!vocabName && <small>{'\u8bf7\u5148\u9009\u62e9\u6307\u6807\u7c7b\u578b'}</small>}
      </>
    );
  }

  function renderResultQuartet(field: FieldSpec) {
    const base = resultBase(field.name);
    const stdField = fieldByName(spec.fields, `${base}_std`);
    const unitField = fieldByName(spec.fields, `${base}_unit`);
    const rawField = fieldByName(spec.fields, `${base}_raw_data`);
    if (!stdField || !unitField || !rawField) return null;
    const metricUnitVocab = spec.name === 'Engineering' && isEngineeringRelativeMetric(base)
      ? ACTIVITY_METRIC_UNIT_VOCABS[String(draft.activity_metric ?? '')]
      : undefined;
    return (
      <div className="result-quartet">
        <label><span>mean</span><input type="number" value={String(draft[field.name] ?? '')} onChange={(event) => setField(field.name, event.target.value)} /></label>
        <label><span>std</span><input type="number" value={String(draft[stdField.name] ?? '')} onChange={(event) => setField(stdField.name, event.target.value)} /></label>
        {base !== 'fold_change' && (
          <label><span>{'\u5355\u4f4d'}</span>{metricUnitVocab !== undefined || (spec.name === 'Engineering' && isEngineeringRelativeMetric(base)) ? renderDynamicUnitSelect(unitField, metricUnitVocab) : renderVocabSelect(unitField)}</label>
        )}
        <label className="result-raw-data"><span>raw data</span><textarea value={String(draft[rawField.name] ?? '')} onChange={(event) => setField(rawField.name, event.target.value)} /></label>
      </div>
    );
  }

  function buildReactionEquation(current: RowData) {
    const left = [String(current.main_substrate_id ?? '').trim(), ...splitIds(current.secondary_substrate_ids), ...splitIds(current.co_substrate_ids)].filter(Boolean);
    const right = [String(current.main_product_id ?? '').trim(), ...splitIds(current.secondary_product_ids), ...splitIds(current.co_product_ids)].filter(Boolean);
    if (!left.length && !right.length) return '';
    return `${left.map(compoundText).join(' + ')} -> ${right.map(compoundText).join(' + ')}`;
  }

  function normalizeSequence(name: string, text: string) {
    setField(name, parseAminoAcidInput(text).sequence);
  }

  function importSequence() {
    sequenceFileInputRef.current?.click();
  }

  function importSequenceFile(name: string, file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => normalizeSequence(name, String(reader.result ?? ''));
    reader.readAsText(file);
  }

  function openStructureSketcher() {
    setSketcherOpen(true);
  }

  async function importStructureImage(file: File | undefined) {
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];
    if (file.type && !allowed.includes(file.type)) {
      setStructureInputMessage('\u4ec5\u652f\u6301 png/jpg/jpeg/webp/gif/bmp/tif/tiff \u7ed3\u6784\u56fe\u7247\u3002');
      return;
    }
    const imagePath = window.enzymeApi.pathForFile(file);
    if (!imagePath) {
      setStructureInputMessage('\u65e0\u6cd5\u83b7\u53d6\u56fe\u7247\u6587\u4ef6\u8def\u5f84\uff0c\u8bf7\u91cd\u65b0\u9009\u62e9\u672c\u5730\u56fe\u7247\u3002');
      return;
    }
    setRecognizingStructure(true);
    setStructureInputMessage('\u6b63\u5728\u4f7f\u7528 DECIMER \u8bc6\u522b\u7ed3\u6784\u56fe\u7247...');
    try {
      const result = await window.enzymeApi.recognizeStructureImage(imagePath);
      if (result.ok && result.smiles) {
        setFieldFromSystem('canonical_smiles', result.smiles);
        setStructureInputMessage('\u5df2\u4ece\u56fe\u7247\u8bc6\u522b\u56de\u586b canonical_smiles\uff0c\u8bf7\u4eba\u5de5\u6838\u5bf9\u540e\u4fdd\u5b58\u3002');
      } else {
        setStructureInputMessage(result.error || 'DECIMER \u672a\u80fd\u8bc6\u522b\u51fa SMILES\uff0c\u8bf7\u5c1d\u8bd5\u66f4\u6e05\u6670\u7684\u7ed3\u6784\u56fe\u7247\u3002');
      }
    } catch (error) {
      setStructureInputMessage(`OCSR \u8bc6\u522b\u5931\u8d25\uff1a${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRecognizingStructure(false);
    }
  }

  const smiles = String(draft.canonical_smiles || '');
  const helpFor = (field: FieldSpec) => fieldHelp(field);
  const atLeastOneField = spec.atLeastOne?.fields.join('/');
  const hasAtLeastOneError = Boolean(spec.atLeastOne && issues.some((issue) =>
    issue.level === 'error' &&
    issue.table === spec.name &&
    (issue.field === atLeastOneField || issue.message === spec.atLeastOne?.message)
  ));
  const issuesFor = (fieldName: string) => issues.filter((issue) => issue.table === spec.name && issue.field === fieldName);

  useEffect(() => {
    if (spec.name !== 'Chemicals') return;
    const trimmed = smiles.trim();
    if (!trimmed) {
      setSmilesIssue('');
      setDraft((current) => ({ ...current, formula: '', inchikey: '' }));
      return;
    }
    let canceled = false;
    window.enzymeApi.describeSmiles(trimmed).then((result) => {
      if (canceled) return;
      if (result.error) {
        setSmilesIssue(result.error);
        setDraft((current) => ({ ...current, formula: '', inchikey: '' }));
        return;
      }
      setSmilesIssue('');
      setDraft((current) => ({ ...current, formula: result.formula ?? '', inchikey: result.inchikey ?? '' }));
    });
    return () => { canceled = true; };
  }, [spec.name, smiles]);

  useEffect(() => {
    if (spec.name !== 'Chemicals' || mode !== 'create' || compoundIdManual) return;
    const currentId = String(draft.compound_id ?? '');
    if (currentId && !isAutoCompoundId(currentId)) return;
    const prefix = compoundPrefix(String(draft.compound_role_default ?? ''));
    if (currentId.startsWith(`${prefix}-`)) return;
    let canceled = false;
    window.enzymeApi.nextId('Chemicals', prefix).then((id) => {
      if (!canceled) setFieldFromSystem('compound_id', id);
    });
    return () => { canceled = true; };
  }, [spec.name, mode, draft.compound_role_default, compoundIdManual]);

  useEffect(() => {
    if (spec.name !== 'Engineering') return;
    const vocabName = ACTIVITY_METRIC_UNIT_VOCABS[String(draft.activity_metric ?? '')];
    const allowed = vocabName ? vocabOptions[vocabName] ?? [] : [];
    setDraft((current) => {
      const next = { ...current };
      for (const fieldName of ['WT_metric_value_unit', 'variant_metric_value_unit']) {
        const value = String(next[fieldName] ?? '');
        if (value && (!vocabName || !allowed.includes(value))) next[fieldName] = '';
      }
      return next;
    });
  }, [spec.name, draft.activity_metric, vocabOptions]);

  useEffect(() => {
    if (spec.name !== 'Reactions') return;
    const next = buildReactionEquation(draft);
    if (String(draft.reaction_equation_auto ?? '') !== next) setFieldFromSystem('reaction_equation_auto', next);
  }, [
    spec.name,
    draft.main_substrate_id,
    draft.main_product_id,
    draft.secondary_substrate_ids,
    draft.secondary_product_ids,
    draft.co_substrate_ids,
    draft.co_product_ids,
    referenceOptions.Chemicals
  ]);

  return (
    <section className="panel editor">
      <div className="editor-head">
        <h3>{'\u7f16\u8f91\uff1a'}{spec.title}</h3>
        <div>
          {mode === 'create' && onOpenCopy && <button type="button" onClick={onOpenCopy}>{'\u590d\u5236'}</button>}
          <button onClick={() => onSave(draft)}>{'\u4fdd\u5b58'}</button>
          <button onClick={onCancel}>{'\u53d6\u6d88'}</button>
        </div>
      </div>

      {groups.map(([group, fields]) => (
        <fieldset key={group} className={hasAtLeastOneError && fields.some((field) => spec.atLeastOne?.fields.includes(field.name)) ? 'fieldset-error' : ''}>
          <legend>{group}</legend>
          {spec.name === 'Chemicals' && fields.some((field) => field.name === 'canonical_smiles') && (
            <>
            <div className="atleastone-hint structure-hint">
              {'\u63d0\u793a\uff1a\u5316\u5408\u7269\u7ed3\u6784\u53ef\u901a\u8fc7\u753b\u677f\u7ed8\u5236\u3001\u76f4\u63a5\u586b\u5199 SMILES\uff0c\u6216\u8f7d\u5165\u56fe\u7247\u8fdb\u884c OCSR \u8bc6\u522b\u540e\u751f\u6210 SMILES\uff1b\u8bc6\u522b\u7ed3\u679c\u9700\u4eba\u5de5\u6838\u5bf9\u540e\u518d\u5199\u5165 canonical_smiles\u3002'}
            </div>
            <div className="structure-input-panel">
              <div className="structure-input-actions">
                <button type="button" onClick={openStructureSketcher}>{'\u753b\u677f\u7ed8\u5236\uff08Ketcher\uff09'}</button>
                <button type="button" onClick={() => structureImageInputRef.current?.click()} disabled={recognizingStructure}>{recognizingStructure ? '\u8bc6\u522b\u4e2d...' : '\u8f7d\u5165\u56fe\u7247\u8bc6\u522b\uff08OCSR\uff09'}</button>
                <input
                  ref={structureImageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/tiff"
                  className="hidden-file-input"
                  onChange={(event) => {
                    importStructureImage(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
              </div>
              <small>{'\u5f53\u524d\u4fdd\u5b58\u5b57\u6bb5\u4ecd\u4e3a canonical_smiles\uff1b\u753b\u677f\u548c\u56fe\u7247\u8bc6\u522b\u90fd\u53ea\u662f\u8f85\u52a9\u751f\u6210\u65b9\u5f0f\u3002'}</small>
              {structureInputMessage && <small className="warning-text">{structureInputMessage}</small>}
              <SmilesPreview smiles={smiles} />
            </div>
            {sketcherOpen && (
              <StructureSketcherModal
                initialSmiles={smiles}
                onApply={(nextSmiles) => {
                  setFieldFromSystem('canonical_smiles', nextSmiles);
                  setStructureInputMessage('\u5df2\u4ece Ketcher \u753b\u677f\u56de\u586b canonical_smiles\uff0c\u8bf7\u6838\u5bf9\u540e\u4fdd\u5b58\u3002');
                  setSketcherOpen(false);
                }}
                onClose={() => setSketcherOpen(false)}
              />
            )}
            </>
          )}
          {spec.name === 'WT_Enzymes' && group === '\u8868\u8fbe' && (
            <div className="atleastone-hint">
              {'\u63d0\u793a\uff1a\u8868\u8fbe/\u7eaf\u5316\u4fe1\u606f\u7528\u4e8e\u63cf\u8ff0\u9176\u6837\u54c1\u5236\u5907\u80cc\u666f\uff0c\u4e0d\u4f5c\u4e3a\u9176\u672c\u5f81\u6d3b\u6027\u53c2\u6570\uff1b\u5177\u4f53\u53cd\u5e94\u5b9e\u9a8c\u6761\u4ef6\u8bf7\u586b\u5199\u5728\u5b9e\u9a8c\u6761\u4ef6\u6216\u5b9e\u9a8c\u4e8b\u5b9e\u4e2d\u3002'}
            </div>
          )}
          {spec.name === 'Engineering' && group === '\u76f8\u5bf9\u503c' && (
            <div className="atleastone-hint">
              {'\u63d0\u793a\uff1a\u8bf7\u586b\u5199 WT \u6307\u6807\u503c\u4e0e\u7a81\u53d8\u4f53\u6307\u6807\u503c\u4e00\u5bf9\uff0c\u6216\u76f4\u63a5\u586b\u5199\u76f8\u5bf9 WT \u500d\u6570\u3002\u76f8\u5bf9 WT \u500d\u6570\u65e0\u5355\u4f4d\u3002'}
            </div>
          )}
          {spec.atLeastOne && fields.some((field) => spec.atLeastOne?.fields.includes(field.name)) && (
            <div className={hasAtLeastOneError ? 'atleastone-hint error' : 'atleastone-hint'}>
              {'\u63d0\u793a\uff1a'}{spec.atLeastOne.message}
            </div>
          )}
          {fields.map((field) => (
            <label key={field.name} className={field.required ? 'required' : field.recommended ? 'recommended' : ''}>
              <span>
                {fieldTitle(field)}
                {field.required && <b> {'\u5fc5\u586b'}</b>}
                {(field.primary || field.unique) && <b className="unique-mark"> {'\u552f\u4e00'}</b>}
                {!field.required && field.recommended && <em> {'\u5efa\u8bae'}</em>}
                {helpFor(field) && <span className="help" title={helpFor(field)}>?</span>}
              </span>
              {isResultMean(field) && fieldByName(spec.fields, `${resultBase(field.name)}_raw_data`) ? (
                renderResultQuartet(field)
              ) : isMeasurementTypical(field) && fieldByName(spec.fields, `${numericBase(field.name)}_unit`) ? (
                renderNumericQuartet(field)
              ) : field.multiReferences ? (
                <div className="multi-reference-list">
                  {(referenceOptions[field.multiReferences.table] ?? []).map((option) => {
                    const selected = splitIds(draft[field.name]).includes(option.value);
                    return (
                      <label key={option.value} className="multi-reference-option">
                        <input type="checkbox" checked={selected} onChange={() => toggleMultiField(field.name, option.value)} />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                  {!(referenceOptions[field.multiReferences.table] ?? []).length && <small>{'\u6682\u65e0\u53ef\u9009\u5316\u5408\u7269'}</small>}
                </div>
              ) : field.references ? (
                <ReferenceCombobox
                  value={String(draft[field.name] ?? '')}
                  options={referenceOptions[field.references.table] ?? []}
                  readOnly={isReadonly(field)}
                  onChange={(value) => setField(field.name, value)}
                />
              ) : field.vocab ? (
                renderVocabSelect(field)
              ) : field.kind === 'longtext' ? (
                <>
                  <textarea value={String(draft[field.name] ?? '')} onChange={(event) => setField(field.name, event.target.value)} />
                  {spec.name === 'WT_Enzymes' && field.name === 'sequence_aa' && (
                    <div className="sequence-helper">
                      <div className="sequence-actions">
                        <button type="button" onClick={() => normalizeSequence(field.name, String(draft[field.name] ?? ''))}>{'\u89e3\u6790\u5e76\u89c4\u8303\u5316'}</button>
                        <button type="button" onClick={importSequence}>{'\u4e0a\u4f20 FASTA/TXT'}</button>
                        <input
                          ref={sequenceFileInputRef}
                          type="file"
                          accept=".fasta,.fa,.faa,.txt,text/plain"
                          className="hidden-file-input"
                          onChange={(event) => {
                            importSequenceFile(field.name, event.target.files?.[0]);
                            event.target.value = '';
                          }}
                        />
                      </div>
                      <small>{'\u957f\u5ea6\uff1a'}{parseAminoAcidInput(String(draft[field.name] ?? '')).length} aa</small>
                      {parseAminoAcidInput(String(draft[field.name] ?? '')).nonStandardLetters.length > 0 && (
                        <small className="warning-text">
                          {'\u53d1\u73b0\u975e\u6807\u51c6\u6c28\u57fa\u9178\u5b57\u6bcd\uff1a'}
                          {parseAminoAcidInput(String(draft[field.name] ?? '')).nonStandardLetters.join(', ')}
                          {'\uff1b\u5df2\u4fdd\u7559\uff0c\u4e0d\u963b\u65ad\u4fdd\u5b58\u3002'}
                        </small>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <input
                  type={inputType(field)}
                  value={String(draft[field.name] ?? '')}
                  onChange={(event) => setField(field.name, event.target.value)}
                  readOnly={isReadonly(field)}
                />
              )}
              {field.references && <small>{'\u5173\u8054\uff1a'}{field.references.table}.{field.references.field}</small>}
              {mode === 'edit' && field.name === pk && <small>{'\u7f16\u8f91\u5df2\u6709\u8bb0\u5f55\u65f6\u7f16\u53f7\u4e0d\u53ef\u4fee\u6539\uff0c\u907f\u514d\u5f15\u7528\u6df7\u4e71\u3002'}</small>}
              {field.multiReferences && <small>{'\u591a\u9009\u5173\u8054\uff1a'}{field.multiReferences.table}.{field.multiReferences.field}{'\uff1b\u5b58\u50a8\u4e3a\u9017\u53f7\u5206\u9694 ID'}</small>}
              {field.vocab && <small>{'\u53d7\u63a7\u8bcd\uff1a'}{field.vocab}{'\uff1b\u5f15\u7528\u5b57\u6bb5\u6570\uff1a'}{vocabUsage(field.vocab).length}</small>}
              {spec.name === 'Chemicals' && field.name === 'compound_id' && <small>{mode === 'edit' ? '\u7f16\u8f91\u5df2\u6709\u8bb0\u5f55\u65f6\uff0c\u9ed8\u8ba4\u89d2\u8272\u4e0d\u4f1a\u6539\u5199\u7f16\u53f7\u3002' : '\u65b0\u589e\u8bb0\u5f55\u65f6\uff0c\u9009\u62e9\u9ed8\u8ba4\u89d2\u8272\u540e\u7cfb\u7edf\u4f1a\u6309\u89d2\u8272\u524d\u7f00\u5efa\u8bae\u7f16\u53f7\uff1b\u624b\u52a8\u4fee\u6539\u540e\u4e0d\u4f1a\u81ea\u52a8\u8986\u76d6\u3002'}</small>}
              {field.name === 'canonical_smiles' && smilesIssue && <small className="error-text">{smilesIssue}</small>}
              {issuesFor(field.name).map((issue, index) => (
                <small key={`${issue.level}-${index}`} className={issue.level === 'error' ? 'error-text' : 'warning-text'}>{issue.message}</small>
              ))}
            </label>
          ))}
        </fieldset>
      ))}
    </section>
  );
}
