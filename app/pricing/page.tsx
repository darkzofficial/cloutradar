import Pricing from '@/components/Pricing';
import { getSession } from '@/lib/account';

export const metadata = { title: 'Pricing' };

export default async function PricingPage({ searchParams }: { searchParams: { canceled?: string } }) {
  const { user, pro } = await getSession();
  return (
    <div className="wrap">
      <section className="section">
        <div className="eyebrow">Pricing</div>
        <h2>Unlimited scans for £6.99 a month</h2>
        <p>Free accounts get a few scans a month. Pro removes the limit and adds deeper checks and benchmarks. Cancel any time.</p>
        {searchParams.canceled && <div className="notice">Checkout was cancelled, so you haven&apos;t been charged.</div>}
        <Pricing signedIn={!!user} pro={pro} />
        <p className="mono" style={{ fontSize: 12, color: 'var(--dim)' }}>Price includes VAT where it applies. Payments are handled by Stripe.</p>
      </section>
    </div>
  );
}
