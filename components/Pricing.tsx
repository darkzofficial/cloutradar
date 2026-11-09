import Link from 'next/link';
import { PRICE_LABEL, freeLimit } from '@/lib/account';
import { PRO_MAX_VIDEOS, FREE_MAX_VIDEOS } from '@/lib/scoring';

export default function Pricing({ signedIn, pro }: { signedIn: boolean; pro: boolean }) {
  const limit = freeLimit();
  return (
    <div className="plans">
      <div className="plan">
        <h3>Free</h3>
        <div className="price">£0<small>forever</small></div>
        <ul>
          <li>{limit} account scans a month</li>
          <li>6 core warning-sign checks</li>
          <li>Up to {FREE_MAX_VIDEOS} videos per scan</li>
          <li>This month&apos;s scans saved</li>
          <li className="no">Comment quality check</li>
          <li className="no">Follower growth and share rate checks</li>
          <li className="no">Benchmarks for the account&apos;s size</li>
        </ul>
        {signedIn ? (
          <Link className="btn" href="/scan">Run a free scan</Link>
        ) : (
          <Link className="btn" href="/login?next=/scan">Create a free account</Link>
        )}
      </div>
      <div className="plan pro">
        <h3>Pro <span className="tag solid">Most popular</span></h3>
        <div className="price">{PRICE_LABEL}<small>a month</small></div>
        <ul>
          <li><span><b>Unlimited</b> account scans</span></li>
          <li>9 checks, including comment quality, share rate and follower growth</li>
          <li>Up to {PRO_MAX_VIDEOS} videos per scan for a steadier read</li>
          <li>Benchmarks matched to the account&apos;s follower count</li>
          <li>What-to-check-next advice on every warning</li>
          <li>Full scan history with score trends per account</li>
          <li>Cancel any time from your account page</li>
        </ul>
        {pro ? (
          <Link className="btn" href="/account">You&apos;re on Pro</Link>
        ) : signedIn ? (
          <form action="/api/checkout" method="post" style={{ display: 'contents' }}>
            <button className="btn primary big" type="submit">Upgrade to Pro</button>
          </form>
        ) : (
          <Link className="btn primary big" href="/login?next=/pricing">Get Pro</Link>
        )}
      </div>
    </div>
  );
}
