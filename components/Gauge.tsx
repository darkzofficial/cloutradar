export default function Gauge({ score, band }: { score: number | null; band: string }) {
  const col = ({ ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)' } as Record<string, string>)[band] ?? 'var(--dim)';
  const R = 70, cx = 90, cy = 90, a0 = Math.PI * 0.75, span = Math.PI * 1.5;
  const pt = (a: number) => [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  const arc = (from: number, to: number) => {
    const [x1, y1] = pt(from), [x2, y2] = pt(to);
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${R} ${R} 0 ${to - from > Math.PI ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  const s = score === null ? 0 : score / 100;
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const a = a0 + (span * i) / 10;
    return (
      <line key={i} x1={cx + (R + 9) * Math.cos(a)} y1={cy + (R + 9) * Math.sin(a)} x2={cx + (R + 14) * Math.cos(a)} y2={cy + (R + 14) * Math.sin(a)} stroke="var(--line-2)" strokeWidth="1.5" />
    );
  });
  return (
    <div className="gauge">
      <svg viewBox="0 0 180 160" role="img" aria-label={`Suspicion score ${score === null ? 'not available' : `${score} out of 100`}`}>
        {ticks}
        <path d={arc(a0, a0 + span)} fill="none" stroke="var(--panel-2)" strokeWidth="12" strokeLinecap="round" />
        {s > 0 && <path d={arc(a0, a0 + span * Math.max(s, 0.01))} fill="none" stroke={col} strokeWidth="12" strokeLinecap="round" />}
        <text x="90" y="98" textAnchor="middle" fill="var(--fg)" fontFamily="Big Shoulders Display, Impact, sans-serif" fontWeight="900" fontSize="54">
          {score === null ? '—' : score}
        </text>
        <text x="90" y="122" textAnchor="middle" fill="var(--muted)" fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="1.5">
          SUSPICION / 100
        </text>
      </svg>
    </div>
  );
}
