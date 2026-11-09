import type { ScanResult } from '@/lib/scoring';
import { TIERS } from '@/lib/scoring';
import Gauge from './Gauge';
import CopySummary from './CopySummary';

const LABEL: Record<string, string> = { ok: 'normal', warn: 'warning', bad: 'strong', na: 'no data' };

export function summaryText(r: ScanResult) {
  return (
    `CloutRadar scan of @${r.handle}: ${r.score === null ? 'not enough data' : `${r.score}/100`} (${r.verdict}).\n` +
    r.signals.filter((s) => s.level !== 'na').map((s) => `- ${s.name}: ${s.value} (${LABEL[s.level]})`).join('\n') +
    '\nBased on the numbers entered. Warning signs, not proof.'
  );
}

export default function Report({ result, label, date }: { result: ScanResult; label?: string; date?: string }) {
  return (
    <>
      <div className="ph">
        <h2>{result.pro ? 'Pro report' : 'Scan report'}</h2>
        <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {label && <span className="tag orange">{label}</span>}
          {result.pro && <span className="tag solid">Pro</span>}
        </span>
      </div>
      <div className="rhead">
        <Gauge score={result.score} band={result.band} />
        <div className="verdict">
          <span className="handle">@{result.handle}</span>
          <span className={`vtitle ${result.band}`}>{result.verdict}</span>
          <span className="vsub">
            {result.summary}{' '}
            {result.checksUsed > 0 && `${result.strong} strong and ${result.minor} minor warning signs across ${result.checksUsed} checks.`}
          </span>
          {result.pro && result.tier && <span className="mono muted" style={{ fontSize: 12 }}>Compared with accounts {TIERS[result.tier].label.toLowerCase()}</span>}
          {date && <span className="mono muted" style={{ fontSize: 12 }}>Scanned {date}</span>}
        </div>
      </div>
      <div className="signals">
        {result.signals.map((s) => (
          <div key={s.id} className={`sig ${s.level}`}>
            <span className="stripe" />
            <div>
              <h3>
                {s.name}
                {s.pro && <span className="tag orange">Pro</span>}
              </h3>
              <p>{s.explanation}</p>
              {s.benchmark && <div className="bench">{s.benchmark}</div>}
              {s.advice && <div className="advice">{s.advice}</div>}
            </div>
            <div className="val">
              {s.value}
              <small>{s.detail}</small>
              <span className={`tag ${s.level}`}>{LABEL[s.level]}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="actions">
        <CopySummary text={summaryText(result)} />
      </div>
      <div className="disclaimer">
        This score is based only on the numbers entered. It shows warning signs, not proof that an account bought followers or likes.
      </div>
    </>
  );
}
