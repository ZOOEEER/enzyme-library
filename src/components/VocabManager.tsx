import { useMemo, useState } from 'react';
import type { VocabEntry } from '../../app/shared/schema';

interface Props {
  entries: VocabEntry[];
  onAdd: (vocabName: string, value: string) => Promise<void>;
  onDelete: (vocabName: string, value: string) => Promise<void>;
}

interface VocabSubgroup {
  title: string;
  vocabNames: string[];
}

interface VocabCategory {
  title: string;
  groups: VocabSubgroup[];
}

const VOCAB_CATEGORIES: VocabCategory[] = [
  {
    title: '\u57fa\u7840\u6570\u636e\u8bcd\u8868',
    groups: [
      { title: '\u6765\u6e90/\u6587\u732e', vocabNames: ['source_type', 'data_status'] },
      { title: '\u9176', vocabNames: ['organism_source_type', 'enzyme_form', 'signal_peptide_removal_status', 'activity_annotation_level'] },
      { title: '\u5316\u5408\u7269/\u53cd\u5e94', vocabNames: ['compound_role', 'stereo_descriptor_type', 'reaction_direction', 'cofactor', 'cofactor_regeneration'] }
    ]
  },
  {
    title: '\u5b9e\u9a8c\u4e0e\u6d3b\u6027\u8bcd\u8868',
    groups: [
      { title: '\u68c0\u6d4b/\u8bef\u5dee', vocabNames: ['assay_type', 'error_type'] },
      { title: '\u5de5\u7a0b\u6548\u679c', vocabNames: ['effect_type', 'activity_metric'] }
    ]
  },
  {
    title: '\u5355\u4f4d\u8bcd\u8868',
    groups: [
      { title: '\u6d53\u5ea6/\u6bd4\u4f8b/\u6761\u4ef6', vocabNames: ['concentration_unit', 'percent_unit', 'cosolvent_amount_unit', 'pH_unit', 'temperature_unit', 'time_unit'] },
      { title: '\u5b9e\u9a8c\u7528\u91cf/\u89c4\u6a21', vocabNames: ['enzyme_loading_unit', 'reaction_scale_unit'] },
      { title: '\u6d3b\u6027/\u52a8\u529b\u5b66', vocabNames: ['titer_unit', 'specific_activity_unit', 'kcat_unit', 'kcat_Km_unit', 'initial_rate_unit', 'TTN_unit', 'TOF_unit'] },
      { title: '\u76f8\u5bf9\u503c/\u517c\u5bb9', vocabNames: ['fold_unit', 'dimensionless_unit'] }
    ]
  }
];

export function VocabManager({ entries, onAdd, onDelete }: Props) {
  const [active, setActive] = useState(entries[0]?.vocabName ?? '');
  const [newValue, setNewValue] = useState('');
  const current = useMemo(() => entries.find((entry) => entry.vocabName === active) ?? entries[0], [active, entries]);
  const groupedEntries = useMemo(() => {
    const entryByName = new Map(entries.map((entry) => [entry.vocabName, entry]));
    const used = new Set<string>();
    const categories = VOCAB_CATEGORIES.map((category) => ({
      ...category,
      groups: category.groups
        .map((group) => {
          const groupEntries = group.vocabNames
            .map((vocabName) => entryByName.get(vocabName))
            .filter((entry): entry is VocabEntry => Boolean(entry));
          groupEntries.forEach((entry) => used.add(entry.vocabName));
          return { title: group.title, entries: groupEntries };
        })
        .filter((group) => group.entries.length)
    })).filter((category) => category.groups.length);
    const uncategorized = entries.filter((entry) => !used.has(entry.vocabName));
    if (uncategorized.length) {
      categories.push({
        title: '\u5176\u5b83/\u672a\u5f52\u7c7b',
        groups: [{ title: '\u672a\u5f52\u7c7b', entries: uncategorized }]
      });
    }
    return categories;
  }, [entries]);

  async function add() {
    if (!current || !newValue.trim()) return;
    await onAdd(current.vocabName, newValue);
    setNewValue('');
  }

  if (!current) return <section className="panel">{'\u6682\u65e0\u53d7\u63a7\u8bcd'}</section>;

  return (
    <section className="vocab-manager">
      <div className="vocab-group-list">
        {groupedEntries.map((category) => (
          <section className="vocab-category" key={category.title}>
            <h3>{category.title}</h3>
            <div className="vocab-category-grid">
              {category.groups.map((group) => (
                <div className="vocab-subgroup" key={group.title}>
                  <h4>{group.title}</h4>
                  <div className="vocab-subgroup-buttons">
                    {group.entries.map((entry) => (
                      <button key={entry.vocabName} className={entry.vocabName === current.vocabName ? 'active' : ''} onClick={() => setActive(entry.vocabName)}>
                        {entry.vocabName}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="panel vocab-detail">
        <h3>{current.vocabName}</h3>
        <p className="hint">
          {'\u5f15\u7528\u5b57\u6bb5\uff1a'}
          {current.usages.length ? current.usages.map((usage) => `${usage.table}.${usage.field}`).join('\uff1b') : '\u6682\u65e0\u5b57\u6bb5\u5f15\u7528'}
        </p>
        <div className="vocab-add">
          <input placeholder={'\u65b0\u589e\u8bcd\u9879...'} value={newValue} onChange={(event) => setNewValue(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && add()} />
          <button onClick={add}>{'\u65b0\u589e'}</button>
        </div>
        <div className="vocab-values">
          {current.values.map((value) => (
            <span className="vocab-pill" key={value}>
              {value}
              <button title={'\u5220\u9664\u8be5\u8bcd\u9879\uff1b\u4e0d\u4f1a\u81ea\u52a8\u4fee\u6539\u5386\u53f2\u8bb0\u5f55'} onClick={() => onDelete(current.vocabName, value)}>{'\u00d7'}</button>
            </span>
          ))}
        </div>
        {!current.values.length && <p className="empty">{'\u5c1a\u65e0\u8bcd\u9879\uff0c\u53ef\u5728\u4e0a\u65b9\u65b0\u589e\u3002'}</p>}
      </div>
    </section>
  );

}
