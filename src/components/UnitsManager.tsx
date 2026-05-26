import { RowData } from '../../app/shared/validation';

interface Props {
  rows: RowData[];
  query: string;
  onQuery: (value: string) => void;
}

interface UnitGroup {
  quantityType: string;
  units: string[];
}

export function UnitsManager({ rows, query, onQuery }: Props) {
  const groups = rows.reduce<Map<string, Set<string>>>((map, row) => {
    const quantityType = String(row.quantity_type ?? '').trim() || '\u672a\u5206\u7c7b';
    const unit = String(row.default_unit ?? '').trim();
    if (!unit) return map;
    if (!map.has(quantityType)) map.set(quantityType, new Set<string>());
    map.get(quantityType)?.add(unit);
    return map;
  }, new Map<string, Set<string>>());
  const normalizedQuery = query.trim().toLowerCase();
  const groupedRows: UnitGroup[] = [...groups.entries()]
    .map(([quantityType, units]) => ({ quantityType, units: [...units].sort((left, right) => left.localeCompare(right)) }))
    .sort((left, right) => left.quantityType.localeCompare(right.quantityType))
    .filter((group) => {
      if (!normalizedQuery) return true;
      return group.quantityType.toLowerCase().includes(normalizedQuery) || group.units.some((unit) => unit.toLowerCase().includes(normalizedQuery));
    });

  return (
    <section className="units-manager">
      <div className="table-actions">
        <input placeholder={'\u641c\u7d22\u7269\u7406\u7c7b\u578b\u6216\u5355\u4f4d...'} value={query} onChange={(event) => onQuery(event.target.value)} />
      </div>
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>{'\u7269\u7406\u7c7b\u578b'}</th>
              <th>{'\u5355\u4f4d'}</th>
            </tr>
          </thead>
          <tbody>
            {groupedRows.map((group) => (
              <tr key={group.quantityType}>
                <td>{group.quantityType}</td>
                <td>
                  <div className="unit-pill-list">
                    {group.units.map((unit) => <span className="unit-pill" key={unit}>{unit}</span>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!groupedRows.length && <p className="empty">{'\u6682\u65e0\u5355\u4f4d\u8bf4\u660e'}</p>}
      </div>
    </section>
  );
}
