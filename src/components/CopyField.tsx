import { CopyButton } from './CopyButton';

interface Props {
  label: string;
  value: string;
  multiline?: boolean;
  copyLabel?: string;
}

/** Single Facebook / form field with an always-visible copy control. */
export function CopyField({ label, value, multiline, copyLabel = 'Copy' }: Props) {
  const text = value || '';
  return (
    <div className="copy-field">
      <div className="copy-field-head">
        <span className="copy-field-label">{label}</span>
        <CopyButton text={text} label={copyLabel} className="btn btn-sm" />
      </div>
      {multiline ? (
        <pre className="copy-field-value copy-field-value-multi">{text || '—'}</pre>
      ) : (
        <code className="copy-field-value">{text || '—'}</code>
      )}
    </div>
  );
}
