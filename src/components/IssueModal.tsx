import { ValidationIssue } from '../../app/shared/validation';
import { IssuePanel } from './IssuePanel';

interface Props {
  issues: ValidationIssue[];
  title: string;
  onClose: () => void;
}

export function IssueModal({ issues, title, onClose }: Props) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-head">
          <h3>{title}</h3>
          <button onClick={onClose}>关闭</button>
        </div>
        <IssuePanel issues={issues} />
      </div>
    </div>
  );
}
