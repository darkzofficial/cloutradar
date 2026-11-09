import Link from 'next/link';
import Logo from './Logo';
import { getSession } from '@/lib/account';

export default async function Nav() {
  const { user, pro } = await getSession();
  return (
    <div className="wrap">
      <nav className="nav">
        <Logo />
        <div className="navlinks">
          <Link href="/#how" className="hide-sm">How it works</Link>
          {!pro && <Link href="/pricing">Pricing</Link>}
          {user ? (
            <>
              <Link href="/history" className="hide-sm">My scans</Link>
              <Link href="/account">{pro ? <span className="tag solid">Pro</span> : 'Account'}</Link>
              <Link href="/scan" className="btn primary small">New scan</Link>
            </>
          ) : (
            <>
              <Link href="/login">Sign in</Link>
              <Link href="/login?next=/scan" className="btn primary small">Start free</Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
