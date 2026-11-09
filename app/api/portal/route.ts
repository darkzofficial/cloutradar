import { NextResponse } from 'next/server';
import { getSession } from '@/lib/account';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

// Opens Stripe's hosted page where members update their card, see invoices or cancel.
export async function POST() {
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const { user, profile } = await getSession();
  if (!user) return NextResponse.redirect(`${site}/login?next=/account`, 303);
  if (!profile?.stripe_customer_id) return NextResponse.redirect(`${site}/pricing`, 303);
  const portal = await stripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${site}/account`,
  });
  return NextResponse.redirect(portal.url, 303);
}
