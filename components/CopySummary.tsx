'use client';
import { useState } from 'react';

export default function CopySummary({ text }: { text: string }) {
  const [msg, setMsg] = useState('');
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setMsg('Summary copied');
    } catch {
      setMsg('Copy is blocked here. Select the report text to copy it.');
    }
    setTimeout(() => setMsg(''), 2400);
  }
  return (
    <>
      <button className="btn" type="button" onClick={copy}>Copy summary</button>
      {msg && <div className="toast" role="status">{msg}</div>}
    </>
  );
}
