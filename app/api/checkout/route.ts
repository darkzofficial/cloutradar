import { NextResponse } from 'next/server';
import { getSession } from '@/lib/account';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function POST() {
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const { user, profile, pro } = await getSession();
  if (!user) return NextResponse.redirect(`${site}/login?next=/pricing`, 303);
  if (pro) return NextResponse.redirect(`${site}/account`, 303);

  let customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe().customers.create({ email: user.email ?? undefined, metadata: { user_id: user.id } });
    customerId = customer.id;
    await createAdminClient().from('profiles').upsert({ id: user.id, email: user.email, stripe_customer_id: customerId });
  }

  const session = await stripe().checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    subscription_data: { metadata: { user_id: user.id } },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    automatic_tax: { enabled: false },
    success_url: `${site}/account?upgraded=1`,
    cancel_url: `${site}/pricing?canceled=1`,
  });
  return NextResponse.redirect(session.url!, 303);
}
