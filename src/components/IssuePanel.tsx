import { ValidationIssue } from '../../app/shared/validation';

interface Props {
  issues: ValidationIssue[];
}

export function IssuePanel({ issues }: Props) {
  const errors = issues.filter((issue) => issue.level === 'error').length;
  const warnings = issues.filter((issue) => issue.level === 'warning').length;

  return (
    <section className="panel">
      <h3>校验报告</h3>
      <p><b className="error-text">{errors}</b> 个 Error，<b className="warning-text">{warnings}</b> 个 Warning</p>
      <div className="issue-list">
        {issues.map((issue, index) => (
          <div className={`issue ${issue.level}`} key={`${issue.table}-${issue.rowId}-${issue.field}-${index}`}>
            <strong>{issue.level.toUpperCase()}</strong>
            <span>{issue.table}</span>
            <span>{issue.rowId || '-'}</span>
            <span>{issue.field || '-'}</span>
            <p>{issue.message}</p>
          </div>
        ))}
      </div>
      {!issues.length && <p className="empty">没有发现校验问题。</p>}
    </section>
  );
}
