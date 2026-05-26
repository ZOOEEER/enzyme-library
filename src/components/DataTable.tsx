import { useEffect, useMemo, useState } from 'react';
import { FieldSpec, TableSpec, fieldTitle, primaryField } from '../../app/shared/schema';
import { RowData } from '../../app/shared/validation';
import { SmilesPreview } from './SmilesPreview';

interface Props {
  spec: TableSpec;
  rows: RowData[];
  allRows?: Partial<Record<string, RowData[]>>;
  onEdit: (row: RowData) => void;
  onDelete: (row: RowData) => void;
}

type ListColumnKind = 'field' | 'wtResult';

type ListColumn = {
  id: string;
  name: string;
  label: string;
  group: string;
  kind: ListColumnKind;
  fieldName?: string;
  base?: string;
  required?: boolean;
};

type ListColumnConfig = {
  defaultIds: string[];
  groups: Array<{ title: string; columns: ListColumn[] }>;
};

const ACTIVITY_LIST_CONFIGS: Partial<Record<string, ListColumnConfig>> = {
  Enzyme_Substrate_Relations: {
    defaultIds: ['relation_id', 'enzyme_id', 'reaction_id', 'condition_id', 'conversion', 'ee', 'reference_id'],
    groups: [
      {
        title: '\u8bc6\u522b\u4fe1\u606f',
        columns: [
          { id: 'relation_id', name: 'relation_id', fieldName: 'relation_id', label: '\u4e8b\u5b9e\u7f16\u53f7', group: '\u8bc6\u522b\u4fe1\u606f', kind: 'field' },
          { id: 'enzyme_id', name: 'enzyme_id', fieldName: 'enzyme_id', label: '\u9176\u7f16\u53f7', group: '\u8bc6\u522b\u4fe1\u606f', kind: 'field' },
          { id: 'reaction_id', name: 'reaction_id', fieldName: 'reaction_id', label: '\u53cd\u5e94\u7f16\u53f7', group: '\u8bc6\u522b\u4fe1\u606f', kind: 'field' },
          { id: 'condition_id', name: 'condition_id', fieldName: 'condition_id', label: '\u6761\u4ef6\u7f16\u53f7', group: '\u8bc6\u522b\u4fe1\u606f', kind: 'field' }
        ]
      },
      {
        title: '\u6d3b\u6027',
        columns: [
          { id: 'conversion', name: 'conversion', base: 'conversion', label: '\u8f6c\u5316\u7387', group: '\u6d3b\u6027', kind: 'wtResult' },
          { id: 'yield', name: 'yield', base: 'yield', label: '\u6536\u7387', group: '\u6d3b\u6027', kind: 'wtResult' },
          { id: 'product_titer_g_L', name: 'product_titer_g_L', base: 'product_titer_g_L', label: '\u4ea7\u7269\u6ef4\u5ea6', group: '\u6d3b\u6027', kind: 'wtResult' }
        ]
      },
      {
        title: '\u9009\u62e9\u6027',
        columns: [
          { id: 'ee', name: 'ee', base: 'ee', label: '\u5bf9\u6620\u4f53\u8fc7\u91cf', group: '\u9009\u62e9\u6027', kind: 'wtResult' },
          { id: 'de', name: 'de', base: 'de', label: '\u975e\u5bf9\u6620\u4f53\u8fc7\u91cf', group: '\u9009\u62e9\u6027', kind: 'wtResult' }
        ]
      },
      {
        title: '\u9176\u6d3b',
        columns: [
          { id: 'specific_activity', name: 'specific_activity', base: 'specific_activity', label: '\u6bd4\u6d3b\u529b', group: '\u9176\u6d3b', kind: 'wtResult' },
          { id: 'initial_rate', name: 'initial_rate', base: 'initial_rate', label: '\u521d\u901f\u7387', group: '\u9176\u6d3b', kind: 'wtResult' },
          { id: 'TTN', name: 'TTN', base: 'TTN', label: '\u603b\u8f6c\u5316\u6570', group: '\u9176\u6d3b', kind: 'wtResult' },
          { id: 'TOF', name: 'TOF', base: 'TOF', label: '\u8f6c\u5316\u9891\u7387', group: '\u9176\u6d3b', kind: 'wtResult' }
        ]
      },
      {
        title: '\u9176\u4fc3\u53cd\u5e94\u52a8\u529b\u5b66',
        columns: [
          { id: 'kcat', name: 'kcat', base: 'kcat', label: 'kcat', group: '\u9176\u4fc3\u53cd\u5e94\u52a8\u529b\u5b66', kind: 'wtResult' },
          { id: 'Km', name: 'Km', base: 'Km', label: 'Km', group: '\u9176\u4fc3\u53cd\u5e94\u52a8\u529b\u5b66', kind: 'wtResult' },
          { id: 'kcat_Km', name: 'kcat_Km', base: 'kcat_Km', label: 'kcat/Km', group: '\u9176\u4fc3\u53cd\u5e94\u52a8\u529b\u5b66', kind: 'wtResult' }
        ]
      },
      {
        title: '\u7a33\u5b9a\u6027',
        columns: [
          { id: 'Tm', name: 'Tm', base: 'Tm', label: 'Tm', group: '\u7a33\u5b9a\u6027', kind: 'wtResult' },
          { id: 'half_life', name: 'half_life', base: 'half_life', label: '\u534a\u8870\u671f', group: '\u7a33\u5b9a\u6027', kind: 'wtResult' },
          { id: 'residual_activity', name: 'residual_activity', base: 'residual_activity', label: '\u6b8b\u4f59\u6d3b\u6027', group: '\u7a33\u5b9a\u6027', kind: 'wtResult' }
        ]
      },
      {
        title: '\u6765\u6e90/\u5143\u6570\u636e',
        columns: [
          { id: 'reference_id', name: 'reference_id', fieldName: 'reference_id', label: '\u6765\u6e90\u7f16\u53f7', group: '\u6765\u6e90/\u5143\u6570\u636e', kind: 'field' }
        ]
      }
    ]
  },
  Engineering: {
    defaultIds: ['variant_id', 'parent_enzyme_id', 'variant_name', 'mutation_set', 'reaction_id', 'screening_condition_id', 'activity_metric', 'fold_change', 'reference_id'],
    groups: [
      {
        title: '\u8bc6\u522b\u4fe1\u606f',
        columns: [
          { id: 'variant_id', name: 'variant_id', fieldName: 'variant_id', label: '\u7a81\u53d8\u4f53\u7f16\u53f7', group: '\u8bc6\u522b\u4fe1\u606f', kind: 'field' },
          { id: 'parent_enzyme_id', name: 'parent_enzyme_id', fieldName: 'parent_enzyme_id', label: '\u4eb2\u672c\u9176\u7f16\u53f7', group: '\u8bc6\u522b\u4fe1\u606f', kind: 'field' },
          { id: 'variant_name', name: 'variant_name', fieldName: 'variant_name', label: '\u7a81\u53d8\u4f53\u540d\u79f0', group: '\u8bc6\u522b\u4fe1\u606f', kind: 'field' },
          { id: 'mutation_set', name: 'mutation_set', fieldName: 'mutation_set', label: '\u7a81\u53d8\u7ec4\u5408', group: '\u8bc6\u522b\u4fe1\u606f', kind: 'field' },
          { id: 'reaction_id', name: 'reaction_id', fieldName: 'reaction_id', label: '\u53cd\u5e94\u7f16\u53f7', group: '\u8bc6\u522b\u4fe1\u606f', kind: 'field' },
          { id: 'screening_condition_id', name: 'screening_condition_id', fieldName: 'screening_condition_id', label: '\u7b5b\u9009\u6761\u4ef6\u7f16\u53f7', group: '\u8bc6\u522b\u4fe1\u606f', kind: 'field' },
          { id: 'baseline_relation_id', name: 'baseline_relation_id', fieldName: 'baseline_relation_id', label: '\u57fa\u7ebf\u4e8b\u5b9e\u7f16\u53f7', group: '\u8bc6\u522b\u4fe1\u606f', kind: 'field' }
        ]
      },
      {
        title: '\u6d3b\u6027',
        columns: [
          { id: 'conversion', name: 'conversion', base: 'conversion', label: '\u8f6c\u5316\u7387', group: '\u6d3b\u6027', kind: 'wtResult' },
          { id: 'yield', name: 'yield', base: 'yield', label: '\u6536\u7387', group: '\u6d3b\u6027', kind: 'wtResult' },
          { id: 'product_titer_g_L', name: 'product_titer_g_L', base: 'product_titer_g_L', label: '\u4ea7\u7269\u6ef4\u5ea6', group: '\u6d3b\u6027', kind: 'wtResult' }
        ]
      },
      {
        title: '\u9176\u6d3b',
        columns: [
          { id: 'specific_activity', name: 'specific_activity', base: 'specific_activity', label: '\u6bd4\u6d3b\u529b', group: '\u9176\u6d3b', kind: 'wtResult' },
          { id: 'initial_rate', name: 'initial_rate', base: 'initial_rate', label: '\u521d\u901f\u7387', group: '\u9176\u6d3b', kind: 'wtResult' },
          { id: 'TTN', name: 'TTN', base: 'TTN', label: '\u603b\u8f6c\u5316\u6570', group: '\u9176\u6d3b', kind: 'wtResult' },
          { id: 'TOF', name: 'TOF', base: 'TOF', label: '\u8f6c\u5316\u9891\u7387', group: '\u9176\u6d3b', kind: 'wtResult' }
        ]
      },
      {
        title: '\u9009\u62e9\u6027',
        columns: [
          { id: 'ee', name: 'ee', base: 'ee', label: '\u5bf9\u6620\u4f53\u8fc7\u91cf', group: '\u9009\u62e9\u6027', kind: 'wtResult' },
          { id: 'de', name: 'de', base: 'de', label: '\u975e\u5bf9\u6620\u4f53\u8fc7\u91cf', group: '\u9009\u62e9\u6027', kind: 'wtResult' }
        ]
      },
      {
        title: '\u9176\u4fc3\u53cd\u5e94\u52a8\u529b\u5b66',
        columns: [
          { id: 'kcat', name: 'kcat', base: 'kcat', label: 'kcat', group: '\u9176\u4fc3\u53cd\u5e94\u52a8\u529b\u5b66', kind: 'wtResult' },
          { id: 'Km', name: 'Km', base: 'Km', label: 'Km', group: '\u9176\u4fc3\u53cd\u5e94\u52a8\u529b\u5b66', kind: 'wtResult' },
          { id: 'kcat_Km', name: 'kcat_Km', base: 'kcat_Km', label: 'kcat/Km', group: '\u9176\u4fc3\u53cd\u5e94\u52a8\u529b\u5b66', kind: 'wtResult' }
        ]
      },
      {
        title: '\u7a33\u5b9a\u6027',
        columns: [
          { id: 'Tm', name: 'Tm', base: 'Tm', label: 'Tm', group: '\u7a33\u5b9a\u6027', kind: 'wtResult' },
          { id: 'half_life', name: 'half_life', base: 'half_life', label: '\u534a\u8870\u671f', group: '\u7a33\u5b9a\u6027', kind: 'wtResult' },
          { id: 'residual_activity', name: 'residual_activity', base: 'residual_activity', label: '\u6b8b\u4f59\u6d3b\u6027', group: '\u7a33\u5b9a\u6027', kind: 'wtResult' }
        ]
      },
      {
        title: '\u76f8\u5bf9\u503c',
        columns: [
          { id: 'activity_metric', name: 'activity_metric', fieldName: 'activity_metric', label: '\u6307\u6807\u7c7b\u578b', group: '\u76f8\u5bf9\u503c', kind: 'field' },
          { id: 'WT_metric_value', name: 'WT_metric_value', base: 'WT_metric_value', label: 'WT \u6307\u6807\u503c', group: '\u76f8\u5bf9\u503c', kind: 'wtResult' },
          { id: 'variant_metric_value', name: 'variant_metric_value', base: 'variant_metric_value', label: '\u7a81\u53d8\u4f53\u6307\u6807\u503c', group: '\u76f8\u5bf9\u503c', kind: 'wtResult' },
          { id: 'fold_change', name: 'fold_change', base: 'fold_change', label: '\u76f8\u5bf9 WT \u500d\u6570', group: '\u76f8\u5bf9\u503c', kind: 'wtResult' }
        ]
      },
      {
        title: '\u5de5\u7a0b\u6548\u679c',
        columns: [
          { id: 'effect_type', name: 'effect_type', fieldName: 'effect_type', label: '\u6548\u679c\u7c7b\u578b', group: '\u5de5\u7a0b\u6548\u679c', kind: 'field' }
        ]
      },
      {
        title: '\u5143\u6570\u636e',
        columns: [
          { id: 'reference_id', name: 'reference_id', fieldName: 'reference_id', label: '\u6765\u6e90\u7f16\u53f7', group: '\u5143\u6570\u636e', kind: 'field' }
        ]
      }
    ]
  }
};

function storageKey(tableName: string): string {
  return `enzyme:list-columns:${tableName}`;
}

function loadColumnIds(tableName: string, defaults: string[]): string[] {
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(storageKey(tableName));
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string') ? Array.from(new Set(parsed)) : defaults;
  } catch {
    return defaults;
  }
}

function isListColumn(field: unknown): field is ListColumn {
  return Boolean(field && typeof field === 'object' && 'id' in field && 'kind' in field);
}

function isRequiredListColumn(column: ListColumn, spec: TableSpec): boolean {
  const fieldName = column.fieldName ?? column.name;
  if (spec.fields.some((field) => field.name === fieldName && field.required)) return true;
  return Boolean(column.base && spec.fields.some((field) => field.name === `${column.base}_mean` && field.required));
}

export function DataTable({ spec, rows, allRows = {}, onEdit, onDelete }: Props) {
  const pk = primaryField(spec.name);
  const wtPreviewFieldNames = ['enzyme_id', 'enzyme_name', 'uniprot_id', 'genbank_id', 'ncbi_accession', 'pdb_id', 'sequence_aa'];
  const chemicalPreviewFieldNames = ['compound_id', 'compound_name', 'compound_role_default', 'formula', 'structure_preview', 'canonical_smiles', 'inchikey'];
  const reactionPreviewFieldNames = ['reaction_id', 'reaction_name', 'main_substrate_id', 'main_product_id', 'reference_id'];
  const conditionPreviewFieldNames = ['condition_id', 'condition_name', 'enzyme_form', 'enzyme_loading', 'substrate_conc', 'buffer', 'pH', 'temperature', 'time', 'reaction_scale'];
  const conditionMetricBases = ['enzyme_loading', 'substrate_conc', 'cofactor_conc', 'cosolvent_amount', 'pH', 'temperature', 'time', 'reaction_scale'];
  const baseDefaultFieldNames: Partial<Record<string, string[]>> = {
    References: ['reference_id', 'source', 'citation_or_note', 'doi_or_url', 'curator', 'curation_date', 'data_status', 'notes'],
    WT_Enzymes: wtPreviewFieldNames,
    Chemicals: chemicalPreviewFieldNames,
    Reactions: reactionPreviewFieldNames,
    Conditions: conditionPreviewFieldNames
  };
  const baseListConfig = useMemo<ListColumnConfig | undefined>(() => {
    const defaultIds = baseDefaultFieldNames[spec.name];
    if (!defaultIds) return undefined;
    const columns = spec.fields.filter((field) => !field.hidden).reduce<ListColumn[]>((items, field) => {
      const conditionMetricBase = spec.name === 'Conditions' && field.name.endsWith('_typical') ? field.name.replace(/_typical$/, '') : '';
      if (conditionMetricBase && conditionMetricBases.includes(conditionMetricBase)) {
        items.push({ id: conditionMetricBase, name: conditionMetricBase, label: fieldTitle(field).split(' / ')[0], group: field.group ?? '\u5217\u8868\u5b57\u6bb5', kind: 'field', required: field.required });
      } else if (!conditionMetricBases.some((base) => field.name.startsWith(`${base}_`))) {
        items.push({ id: field.name, name: field.name, fieldName: field.name, label: fieldTitle(field).split(' / ')[0], group: field.group ?? '\u5217\u8868\u5b57\u6bb5', kind: 'field', required: field.required });
      }
      return items;
    }, []);
    if (spec.name === 'Chemicals') {
      const structureField = spec.fields.find((field) => field.name === 'canonical_smiles');
      const smilesIndex = columns.findIndex((column) => column.id === 'canonical_smiles');
      columns.splice(smilesIndex >= 0 ? smilesIndex : columns.length, 0, { id: 'structure_preview', name: 'structure_preview', label: '\u7ed3\u6784\u56fe', group: structureField?.group ?? '\u7ed3\u6784', kind: 'field', required: structureField?.required });
    }
    const groups = columns.reduce<Array<{ title: string; columns: ListColumn[] }>>((items, column) => {
      const group = items.find((item) => item.title === column.group);
      if (group) group.columns.push(column);
      else items.push({ title: column.group, columns: [column] });
      return items;
    }, []);
    return { defaultIds, groups };
  }, [spec.fields, spec.name]);
  const listConfig = useMemo<ListColumnConfig | undefined>(() => {
    const config = ACTIVITY_LIST_CONFIGS[spec.name] ?? baseListConfig;
    if (!config) return undefined;
    return {
      defaultIds: config.defaultIds,
      groups: config.groups.map((group) => ({
        ...group,
        columns: group.columns.map((column) => ({
          ...column,
          required: column.required ?? isRequiredListColumn(column, spec)
        }))
      }))
    };
  }, [baseListConfig, spec]);
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>(() => listConfig ? loadColumnIds(spec.name, listConfig.defaultIds) : []);
  useEffect(() => {
    setColumnPickerOpen(false);
    setSelectedColumnIds(listConfig ? loadColumnIds(spec.name, listConfig.defaultIds) : []);
  }, [listConfig, spec.name]);

  const listColumns = useMemo(() => listConfig ? listConfig.groups.flatMap((group) => group.columns) : [], [listConfig]);
  const selectedListColumns = listConfig
    ? listColumns.filter((column) => selectedColumnIds.includes(column.id))
    : [];
  const previewFields = listConfig
    ? selectedListColumns
    : spec.fields.slice(0, 8);

  function persistColumnIds(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids));
    setSelectedColumnIds(uniqueIds);
    if (typeof window !== 'undefined') window.localStorage.setItem(storageKey(spec.name), JSON.stringify(uniqueIds));
  }

  function toggleColumn(id: string) {
    const next = selectedColumnIds.includes(id) ? selectedColumnIds.filter((item) => item !== id) : [...selectedColumnIds, id];
    persistColumnIds(next.length ? next : listConfig?.defaultIds ?? []);
  }

  function resetColumns() {
    if (!listConfig) return;
    persistColumnIds(listConfig.defaultIds);
  }

  function cellValue(fieldName: string, value: unknown): string {
    if (spec.name === 'WT_Enzymes' && fieldName === 'sequence_aa') {
      const sequence = String(value ?? '').replace(/\s+/g, '');
      if (!sequence) return '';
      if (sequence.length <= 16) return `${sequence} (${sequence.length} aa)`;
      return `${sequence.slice(0, 8)}...${sequence.slice(-8)} (${sequence.length} aa)`;
    }
    return String(value ?? '');
  }

  function renderMetric(row: RowData, base: string): string {
    const typical = String(row[`${base}_typical`] ?? '').trim();
    const min = String(row[`${base}_min`] ?? '').trim();
    const max = String(row[`${base}_max`] ?? '').trim();
    const unit = String(row[`${base}_unit`] ?? '').trim();
    const value = typical && min && max ? `${typical}(${min}-${max})` : typical || (min && max ? `${min}-${max}` : '');
    return [value, unit].filter(Boolean).join(' ');
  }

  function renderResult(row: RowData, base: string): string {
    const mean = String(row[`${base}_mean`] ?? '').trim();
    const std = String(row[`${base}_std`] ?? '').trim();
    const unit = String(row[`${base}_unit`] ?? '').trim();
    const raw = String(row[`${base}_raw_data`] ?? '').trim();
    const value = mean && std ? `${mean} \u00b1 ${std}` : mean;
    return [value, unit ? `(${unit})` : '', raw ? `(${raw})` : ''].filter(Boolean).join(' ');
  }

  function chemicalFor(id: unknown) {
    return (allRows.Chemicals ?? []).find((row) => String(row.compound_id ?? '') === String(id ?? ''));
  }

  function renderReactionCompound(id: unknown) {
    const chemical = chemicalFor(id);
    const smiles = String(chemical?.canonical_smiles ?? '');
    return (
      <div className="reaction-compound-cell">
        <span>{String(id ?? '')}</span>
        {smiles && <SmilesPreview smiles={smiles} compact />}
      </div>
    );
  }

  function renderHeader(field: typeof previewFields[number]) {
    const title = isListColumn(field) ? `${field.label} / ${field.name}` : fieldTitle(field as FieldSpec);
    const [chinese, english] = title.split(' / ');
    return (
      <span className="table-header-title" title={title}>
        <span className="table-header-cn">{chinese}</span>
        {english && <span className="table-header-en">{english}</span>}
      </span>
    );
  }

  function renderColumn(row: RowData, field: typeof previewFields[number]) {
    if (spec.name === 'Reactions' && ['main_substrate_id', 'main_product_id'].includes(field.name)) return renderReactionCompound(row[field.name]);
    if (spec.name === 'Chemicals' && field.name === 'structure_preview') return <SmilesPreview smiles={String(row.canonical_smiles ?? '')} compact />;
    if (spec.name === 'Conditions' && conditionMetricBases.includes(field.name)) return renderMetric(row, field.name);
    if (isListColumn(field) && field.kind === 'wtResult' && field.base) return renderResult(row, field.base);
    const fieldName = isListColumn(field) ? field.fieldName ?? field.name : field.name;
    return cellValue(field.name, row[fieldName]);
  }

  return (
    <div className="data-table">
      {listConfig && (
        <div className="list-column-toolbar">
          <button onClick={() => setColumnPickerOpen((value) => !value)}>{'\u5217\u8868\u5b57\u6bb5'}</button>
          <button onClick={resetColumns}>{'\u6062\u590d\u9ed8\u8ba4'}</button>
          {columnPickerOpen && (
            <div className="list-column-picker">
              {listConfig.groups.map((group) => (
                <div key={group.title} className="list-column-group">
                  <strong>{group.title}</strong>
                  {group.columns.map((column) => (
                    <label key={column.id}>
                      <input type="checkbox" checked={selectedColumnIds.includes(column.id)} onChange={() => toggleColumn(column.id)} />
                      <span className={column.required ? 'list-column-required' : undefined}>{column.label}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <table>
        <thead>
          <tr>
            {previewFields.map((field) => <th key={isListColumn(field) ? field.id : field.name}>{renderHeader(field)}</th>)}
            <th className="action-cell">{'\u64cd\u4f5c'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row[pk] ?? index)}>
              {previewFields.map((field) => {
                const isReactionCompoundColumn = spec.name === 'Reactions' && ['main_substrate_id', 'main_product_id'].includes(field.name);
                return (
                <td
                  key={isListColumn(field) ? field.id : field.name}
                  className={isReactionCompoundColumn ? 'reaction-compound-column' : undefined}
                >
                  {renderColumn(row, field)}
                </td>
                );
              })}
              <td className="action-cell">
                <div className="row-actions">
                  <button onClick={() => onEdit({ ...row })}>编辑</button>
                  <button className="danger" onClick={() => onDelete(row)}>删除</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="empty">当前表暂无数据。</p>}
    </div>
  );
}
