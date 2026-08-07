export function StatusBadge({ status }: { status?: string | null }) {
  const s = (status || 'unknown').toLowerCase();
  let cls = 'badge';
  if (s === 'ready') cls += ' badge-ready';
  else if (s === 'candidate') cls += ' badge-candidate';
  else if (s === 'published') cls += ' badge-published';
  else if (s === 'in-production' || s === 'production') cls += ' badge-production';

  return <span className={cls}>{status || 'unknown'}</span>;
}
