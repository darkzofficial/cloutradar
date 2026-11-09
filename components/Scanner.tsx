'use client';
import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { ScanResult } from '@/lib/scoring';
import { FREE_MAX_VIDEOS, PRO_MAX_VIDEOS, PRO_MAX_COMMENTS, parseNum, parseTarget } from '@/lib/scoring';
import ReportClient from './ReportClient';

type Row = { views: string; likes: string; comments: string; shares: string };
const emptyRow = (): Row => ({ views: '', likes: '', comments: '', shares: '' });
const KEYS: (keyof Row)[] = ['views', 'likes', 'comments', 'shares'];

interface Props {
  pro: boolean;
  used: number;
  limit: number;
  initialHandle?: string;
}

export default function Scanner({ pro, used: usedInitial, limit, initialHandle }: Props) {
  const maxRows = pro ? PRO_MAX_VIDEOS : FREE_MAX_VIDEOS;
  const [target, setTarget] = useState(initialHandle ? '@' + initialHandle : '');
  const [profile, setProfile] = useState({ followers: '', following: '', totalLikes: '', videoCount: '' });
  const [rows, setRows] = useState<Row[]>(() => Array.from({ length: maxRows }, emptyRow));
  const [comments, setComments] = useState('');
  const [prev, setPrev] = useState({ followers: '', date: '' });
  const [error, setError] = useState('');
  const [limitHit, setLimitHit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [used, setUsed] = useState(usedInitial);
  const reportRef = useRef<HTMLDivElement>(null);

  const targetState = useMemo(() => (target.trim() ? parseTarget(target) : null), [target]);
  const remaining = Math.max(0, limit - used);
  const bad = (v: string) => Number.isNaN(parseNum(v));

  function setRow(i: number, k: keyof Row, v: string) {
    setRows((r) => r.map((row, j) => (j === i ? { ...row, [k]: v } : row)));
  }

  function clearAll() {
    setTarget('');
    setProfile({ followers: '', following: '', totalLikes: '', videoCount: '' });
    setRows(Array.from({ length: maxRows }, emptyRow));
    setComments('');
    setPrev({ followers: '', date: '' });
    setError('');
    setResult(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLimitHit(false);
    if (!targetState || 'error' in targetState) {
      setError(targetState && 'error' in targetState ? targetState.error : 'Enter a username or a video link.');
      return;
    }
    const allValues = [...Object.values(profile), ...rows.flatMap((r) => KEYS.map((k) => r[k])), prev.followers];
    if (allValues.some(bad)) {
      setError("Some numbers couldn't be read. Use digits with an optional K, M or B, like 12,400 or 1.2M.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          ...profile,
          videos: rows,
          ...(pro ? { comments: comments.split('\n'), previousFollowers: prev.followers, previousDate: prev.date } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'The scan failed. Try again.');
        if (data.code === 'limit') setLimitHit(true);
        return;
      }
      setResult(data.result);
      setUsed((u) => u + 1);
      requestAnimationFrame(() => {
        if (window.innerWidth < 900) reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch {
      setError('Could not reach CloutRadar. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="two">
      <form className="panel" onSubmit={submit} noValidate>
        <div className="ph">
          <h2>Scan an account</h2>
          <button className="btn ghost small" type="button" onClick={clearAll}>Clear</button>
        </div>

        {!pro && (
          <div className="usage" aria-live="polite">
            <span className="mono">{remaining} of {limit} free scans left this month</span>
            <span className="meter"><i style={{ width: `${(Math.min(used, limit) / limit) * 100}%` }} /></span>
          </div>
        )}

        <div className="field">
          <label htmlFor="target">TikTok username or video URL</label>
          <input
            id="target"
            type="text"
            className={`big ${targetState && 'error' in targetState ? 'invalid' : ''}`}
            autoComplete="off"
            spellCheck={false}
            placeholder="@username or https://www.tiktok.com/@username/video/…"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <p className={`hint ${targetState ? ('error' in targetState ? 'err' : 'okk') : ''}`}>
            {targetState ? ('error' in targetState ? targetState.error : `Scanning @${targetState.handle}`) : ''}
          </p>
        </div>

        <fieldset>
          <legend>Profile numbers <span>shown at the top of the profile</span></legend>
          <div className="grid4">
            {([
              ['followers', 'Followers', '250K'],
              ['following', 'Following', '310'],
              ['totalLikes', 'Likes', '3.1M'],
              ['videoCount', 'Videos', '140'],
            ] as const).map(([k, label, ph]) => (
              <div className="field" key={k}>
                <label htmlFor={k}>{label}</label>
                <input id={k} type="text" inputMode="decimal" placeholder={ph} className={bad(profile[k]) ? 'invalid' : ''}
                  value={profile[k]} onChange={(e) => setProfile((p) => ({ ...p, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Recent videos <span>{pro ? `up to ${PRO_MAX_VIDEOS}` : `3 to ${FREE_MAX_VIDEOS}`} normal posts, skip pinned ones</span></legend>
          <div className="vids">
            <span />
            {KEYS.map((k) => <span className="hd" key={k}>{k}</span>)}
            {rows.map((row, i) => (
              <Rowish key={i} i={i} row={row} onChange={setRow} />
            ))}
          </div>
        </fieldset>

        {pro ? (
          <>
            <fieldset>
              <legend>Comment check <span className="tag orange">Pro</span> <span>paste up to {PRO_MAX_COMMENTS} comments, one per line</span></legend>
              <textarea id="comments" value={comments} onChange={(e) => setComments(e.target.value)}
                placeholder={'this transition is unreal how long did it take\n🔥🔥🔥\nnice\nfollow me back pls'} />
            </fieldset>
            <fieldset>
              <legend>Follower growth <span className="tag orange">Pro</span> <span>an earlier follower count, if you have one</span></legend>
              <div className="grid2">
                <div className="field">
                  <label htmlFor="prev-followers">Followers back then</label>
                  <input id="prev-followers" type="text" inputMode="decimal" placeholder="180K" className={bad(prev.followers) ? 'invalid' : ''}
                    value={prev.followers} onChange={(e) => setPrev((p) => ({ ...p, followers: e.target.value }))} />
                </div>
                <div className="field">
                  <label htmlFor="prev-date">On this date</label>
                  <input id="prev-date" type="date" value={prev.date} max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setPrev((p) => ({ ...p, date: e.target.value }))} />
                </div>
              </div>
              <p className="hint">Scanned this account before? Its earlier scans appear in My scans, so you can compare them.</p>
            </fieldset>
          </>
        ) : (
          <div className="locked">
            <strong>Pro adds three more checks</strong>
            <p>Comment quality, share rate and follower growth, plus benchmarks for the account&apos;s size and {PRO_MAX_VIDEOS} video slots.</p>
            <Link className="btn primary small" href="/pricing" style={{ alignSelf: 'flex-start' }}>See Pro for £6.99 a month</Link>
          </div>
        )}

        <div className="actions">
          <button className="btn primary big" type="submit" disabled={busy || (!pro && remaining === 0)}>
            {busy ? 'Scanning…' : 'Run scan'}
          </button>
        </div>
        {error && (
          <div className="notice err" role="alert">
            {error}
            {(limitHit || (!pro && remaining === 0)) && (
              <form action="/api/checkout" method="post" style={{ marginTop: 10 }}>
                <button className="btn primary small" type="submit">Upgrade to Pro</button>
              </form>
            )}
          </div>
        )}
        {!pro && remaining === 0 && !error && (
          <div className="notice orange">
            You&apos;ve used this month&apos;s free scans. They reset on the 1st.
            <form action="/api/checkout" method="post" style={{ marginTop: 10 }}>
              <button className="btn primary small" type="submit">Upgrade for unlimited scans</button>
            </form>
          </div>
        )}

        <details className="help">
          <summary>Where do I find these numbers?</summary>
          <ol>
            <li>Open the profile in the TikTok app or at tiktok.com. Followers, Following and Likes sit under the name.</li>
            <li>The view count is printed on each video thumbnail in the profile grid.</li>
            <li>Open a video to read its likes, comments and shares on the right side.</li>
            <li>Shorthand works: type 1.2M, 45K or 12,400.</li>
          </ol>
        </details>
      </form>

      <section className="panel" ref={reportRef} aria-live="polite">
        {result ? (
          <ReportClient result={result} />
        ) : (
          <div className="empty">
            <h2>No scan yet</h2>
            <span>Enter a username and the profile numbers, then press Run scan.</span>
          </div>
        )}
      </section>
    </div>
  );
}

function Rowish({ i, row, onChange }: { i: number; row: Row; onChange: (i: number, k: keyof Row, v: string) => void }) {
  return (
    <>
      <span className="n">{i + 1}</span>
      {KEYS.map((k) => (
        <input key={k} id={`v${i}-${k}`} type="text" inputMode="decimal" aria-label={`Video ${i + 1} ${k}`}
          className={Number.isNaN(parseNum(row[k])) ? 'invalid' : ''} value={row[k]} onChange={(e) => onChange(i, k, e.target.value)} />
      ))}
    </>
  );
}
