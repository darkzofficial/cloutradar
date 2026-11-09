import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, monthStart } from '@/lib/account';

export const metadata = { title: 'My scans' };
export const dynamic = 'force-dynamic';

const BAND = (s: number | null) => (s === null ? 'na' : s >= 55 ? 'bad' : s >= 25 ? 'warn' : 'ok');
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default async function History() {
  const { supabase, user, pro } = await getSession();
  if (!user) redirect('/login?next=/history');
  let q = supabase.from('scans').select('id, handle, score, pro, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(200);
  if (!pro) q = q.gte('created_at', monthStart());
  const { data: scans } = await q;
  return (
    <div className="wrap">
      <section className="section">
        <div className="eyebrow">History</div>
        <h2>My scans</h2>
        {!pro && <p>Free accounts see this month&apos;s scans. <Link href="/pricing">Pro</Link> keeps your full history and shows how each account&apos;s score changes over time.</p>}
        {!scans?.length ? (
          <div className="panel empty"><h2>No scans yet</h2><span>Your scans will appear here.</span><Link className="btn primary" href="/scan">Run a scan</Link></div>
        ) : (
          <div className="tablewrap">
            <table>
              <thead><tr><th>Account</th><th>Score</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {scans.map((s) => (
                  <tr key={s.id}>
                    <td><Link href={`/history/${s.id}`} className="mono">@{s.handle}</Link> {s.pro && <span className="tag orange">Pro</span>}</td>
                    <td><span className={`tag ${BAND(s.score)}`}>{s.score ?? '—'}</span></td>
                    <td className="m">{fmtDate(s.created_at)}</td>
                    <td style={{ textAlign: 'right' }}><Link href={`/history/${s.id}`}>Open →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
