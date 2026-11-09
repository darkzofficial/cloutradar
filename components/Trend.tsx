// Small score-over-time chart for one account (Pro history).
export default function Trend({ points }: { points: { date: string; score: number }[] }) {
  if (points.length < 2) return null;
  const W = 520, H = 140, m = { t: 14, r: 16, b: 24, l: 32 };
  const x = (i: number) => m.l + ((W - m.l - m.r) * i) / (points.length - 1);
  const y = (v: number) => m.t + (H - m.t - m.b) * (1 - v / 100);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.score).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
  const last = points[points.length - 1];
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 300, display: 'block' }} role="img" aria-label="Suspicion score over time">
        {[0, 25, 55, 100].map((v) => (
          <g key={v}>
            <line x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={m.l - 6} y={y(v) + 4} textAnchor="end" fill="var(--muted)" fontSize="10" fontFamily="JetBrains Mono, monospace">{v}</text>
          </g>
        ))}
        <path d={area} fill="rgba(255,106,19,.12)" />
        <path d={line} fill="none" stroke="var(--orange)" strokeWidth="2" />
        {points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.score)} r={i === points.length - 1 ? 4.5 : 3} fill={i === points.length - 1 ? 'var(--orange)' : 'var(--panel)'} stroke="var(--orange)" strokeWidth="1.5" />)}
        <text x={x(0)} y={H - 6} fill="var(--muted)" fontSize="10" fontFamily="JetBrains Mono, monospace">{points[0].date}</text>
        <text x={x(points.length - 1)} y={H - 6} textAnchor="end" fill="var(--muted)" fontSize="10" fontFamily="JetBrains Mono, monospace">{last.date}</text>
      </svg>
    </div>
  );
}
