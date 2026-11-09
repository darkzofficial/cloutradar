import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Report from '@/components/Report';
import Trend from '@/components/Trend';
import { getSession } from '@/lib/account';
import type { ScanResult } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default async function ScanDetail({ params }: { params: { id: string } }) {
  const { supabase, user, pro } = await getSession();
  if (!user) redirect('/login?next=/history');
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const { data: scan } = await supabase.from('scans').select('*').eq('id', params.id).eq('user_id', user.id).maybeSingle();
  if (!scan) notFound();
  const result = scan.result as ScanResult;

  let trend: { date: string; score: number }[] = [];
  if (pro) {
    const { data } = await supabase.from('scans').select('score, created_at').eq('user_id', user.id).eq('handle', scan.handle)
      .not('score', 'is', null).order('created_at', { ascending: true }).limit(50);
    trend = (data ?? []).map((r) => ({ date: new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), score: r.score as number }));
  }

  return (
    <div className="wrap">
      <section className="section">
        <div className="eyebrow"><Link href="/history">← My scans</Link></div>
        <div className="two">
          <section className="panel"><Report result={result} date={fmtDate(scan.created_at)} /></section>
          <section className="panel">
            <h2>@{scan.handle} over time</h2>
            {pro ? (
              trend.length >= 2 ? <Trend points={trend} /> : <p className="muted">Scan this account again later to see how its score changes.</p>
            ) : (
              <div className="locked"><strong>Score trends are a Pro feature</strong><p>See whether an account&apos;s numbers are getting more or less suspicious with every scan.</p><Link className="btn primary small" href="/pricing" style={{ alignSelf: 'flex-start' }}>See Pro</Link></div>
            )}
            <Link className="btn" href={`/scan?handle=${encodeURIComponent(scan.handle)}`}>Scan @{scan.handle} again</Link>
          </section>
        </div>
      </section>
    </div>
  );
}
