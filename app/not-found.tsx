import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="wrap"><div className="auth panel empty"><h2>Nothing on the radar</h2><span>That page doesn&apos;t exist or isn&apos;t yours.</span><Link className="btn primary" href="/">Go home</Link></div></div>
  );
}
