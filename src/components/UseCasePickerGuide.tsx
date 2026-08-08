import { CopyButton } from './CopyButton';
import {
  formatUseCasesClipboard,
  pickLabel,
  useCasesToSelect,
  type MetaUseCaseAdvice,
} from '../lib/fbUseCases';

interface Props {
  useCases: MetaUseCaseAdvice[];
  gameTitle?: string;
}

export function UseCasePickerGuide({ useCases, gameTitle }: Props) {
  const select = useCasesToSelect(useCases);
  const skip = useCases.filter((u) => u.pick === 'skip');
  const clipboard = formatUseCasesClipboard(useCases);

  return (
    <div className="use-case-guide">
      <div className="header-actions" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <CopyButton text={clipboard} label="Copy use-case checklist" className="btn btn-primary btn-sm" />
      </div>

      {gameTitle ? (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)' }}>
          For <strong>{gameTitle}</strong> on Meta’s <em>Create an app → Use cases</em> step —
          check only the green rows. Leave everything else unchecked.
        </p>
      ) : null}

      <div className="section-title" style={{ marginBottom: 8 }}>
        Select these ({select.length})
      </div>
      <div className="use-case-list">
        {select.map((u) => (
          <div key={u.name} className={`use-case-row use-case-${u.pick}`}>
            <div className="use-case-badge">{pickLabel(u.pick)}</div>
            <div className="use-case-body">
              <strong>{u.name}</strong>
              <span>{u.why}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title" style={{ margin: '16px 0 8px' }}>
        Leave unchecked ({skip.length})
      </div>
      <details className="use-case-skip-details">
        <summary>Show skip list</summary>
        <ul className="use-case-skip-list">
          {skip.map((u) => (
            <li key={u.name}>
              <strong>{u.name}</strong>
              <span> — {u.why}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
