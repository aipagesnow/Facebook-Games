import { CopyButton } from './CopyButton';
import {
  formatPlaySetupClipboard,
  pickLabel,
  stepsToSelect,
  type PlaySetupStep,
} from '../lib/androidPlaySetup';

interface Props {
  steps: PlaySetupStep[];
  title?: string;
}

export function PlaySetupGuide({ steps, title }: Props) {
  const select = stepsToSelect(steps);
  const skip = steps.filter((u) => u.pick === 'skip');
  const clipboard = formatPlaySetupClipboard(steps);

  return (
    <div className="use-case-guide">
      <div className="header-actions" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <CopyButton text={clipboard} label="Copy Play setup checklist" className="btn btn-primary btn-sm" />
      </div>

      {title ? (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)' }}>
          For <strong>{title}</strong> on Play Console — do the green/blue rows. Skip the rest unless the pack says otherwise.
        </p>
      ) : null}

      <div className="section-title" style={{ marginBottom: 8 }}>
        Do these ({select.length})
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
        Leave unless needed ({skip.length})
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
