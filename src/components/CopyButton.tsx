import { useState } from 'react';
import { copyText } from '../lib/api';

interface Props {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label = 'Copy path', className = 'btn btn-sm' }: Props) {
  const [done, setDone] = useState(false);

  async function handleCopy() {
    const ok = await copyText(text);
    if (ok) {
      setDone(true);
      window.setTimeout(() => setDone(false), 1600);
    }
  }

  return (
    <button type="button" className={className} onClick={handleCopy} disabled={!text}>
      {done ? 'Copied' : label}
    </button>
  );
}
