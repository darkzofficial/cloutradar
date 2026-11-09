import { NextResponse } from 'next/server';
import { getSession } from '@/lib/account';
import { stripe } from '@/lib/stripe';
import { siteUrl } from '@/lib/site';

export const runtime = 'nodejs';

// Opens Stripe's hosted page where members update their card, see invoices or cancel.
export async function POST(req: Request) {
  const site = siteUrl(req);
  const { user, profile } = await getSession();
  if (!user) return NextResponse.redirect(`${site}/login?next=/account`, 303);
  if (!profile?.stripe_customer_id) return NextResponse.redirect(`${site}/pricing`, 303);
  try {
    const portal = await stripe().billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: `${site}/account` });
    return NextResponse.redirect(portal.url, 303);
  } catch (err) {
    const e = err as { code?: string; message?: string };
    console.error('[CloutRadar] Billing portal failed:', e.code ?? '', e.message ?? err);
    return NextResponse.redirect(`${site}/account?error=billing`, 303);
  }
}
