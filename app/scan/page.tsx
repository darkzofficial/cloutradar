import { redirect } from 'next/navigation';
import Scanner from '@/components/Scanner';
import { getSession } from '@/lib/account';

export const metadata = { title: 'New scan' };
export const dynamic = 'force-dynamic';

export default async function ScanPage({ searchParams }: { searchParams: { handle?: string } }) {
  const { user, pro, usedThisMonth, limit } = await getSession();
  if (!user) redirect('/login?next=/scan');
  const handle = searchParams.handle && /^[a-z0-9._]{2,24}$/i.test(searchParams.handle) ? searchParams.handle : undefined;
  return (
    <div className="wrap">
      <section className="section">
        <div className="eyebrow">{pro ? 'Pro scan' : 'Free scan'}</div>
        <Scanner pro={pro} used={usedThisMonth} limit={limit} initialHandle={handle} />
      </section>
    </div>
  );
}
