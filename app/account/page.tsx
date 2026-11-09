import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, PRICE_LABEL } from '@/lib/account';

export const metadata = { title: 'Account' };
export const dynamic = 'force-dynamic';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export default async function Account({ searchParams }: { searchParams: { upgraded?: string; error?: string } }) {
  const { user, profile, pro, usedThisMonth, limit } = await getSession();
  if (!user) redirect('/login?next=/account');
  const status = profile?.subscription_status;
  return (
    <div className="wrap">
      <section className="section" style={{ maxWidth: 720 }}>
        <div className="eyebrow">Account</div>
        <h2>{pro ? 'CloutRadar Pro' : 'Free plan'}</h2>
        {searchParams.upgraded && (
          pro
            ? <div className="notice good">Welcome to Pro. You now have unlimited scans and the full report.</div>
            : <div className="notice orange">Payment received. Your Pro access is being switched on; refresh this page in a few seconds.</div>
        )}
        {searchParams.error === 'billing' && <div className="notice err" role="alert">We couldn&apos;t open the billing page just now. Please try again in a few minutes.</div>}
        {status === 'past_due' && <div className="notice err">Your last payment didn&apos;t go through. Update your card in Manage billing to keep Pro.</div>}
        <div className="panel">
          <div className="ph"><span className="muted">Signed in as</span><span className="mono">{user.email}</span></div>
          <div className="ph">
            <span className="muted">Plan</span>
            <span>{pro ? <span className="tag solid">Pro · {PRICE_LABEL}/month</span> : <span className="tag na">Free</span>}</span>
          </div>
          {pro && profile?.current_period_end && (
            <div className="ph">
              <span className="muted">{profile.cancel_at_period_end ? 'Pro ends on' : 'Renews on'}</span>
              <span className="mono">{fmtDate(profile.current_period_end)}</span>
            </div>
          )}
          {!pro && (
            <div className="ph"><span className="muted">Scans this month</span><span className="mono">{Math.min(usedThisMonth, limit)} of {limit}</span></div>
          )}
          <div className="actions">
            {profile?.stripe_customer_id && (
              <form action="/api/portal" method="post"><button className="btn" type="submit">Manage billing</button></form>
            )}
            {!pro && (
              <form action="/api/checkout" method="post"><button className="btn primary" type="submit">Upgrade to Pro for {PRICE_LABEL}/month</button></form>
            )}
            <Link className="btn ghost" href="/history">My scans</Link>
            <form action="/auth/signout" method="post"><button className="btn ghost" type="submit">Sign out</button></form>
          </div>
        </div>
      </section>
    </div>
  );
}
