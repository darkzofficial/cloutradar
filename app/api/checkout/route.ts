import { NextResponse } from 'next/server';
import { getSession } from '@/lib/account';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { siteUrl, stripeProblems } from '@/lib/site';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const site = siteUrl(req);
  const { user, profile, pro } = await getSession();
  if (!user) return NextResponse.redirect(`${site}/login?next=/pricing`, 303);
  if (pro) return NextResponse.redirect(`${site}/account`, 303);

  const problems = stripeProblems();
  if (problems.length) {
    console.error(`[CloutRadar] Checkout is off: ${problems.join('; ')}. Fix in Vercel > Settings > Environment Variables, then redeploy.`);
    return NextResponse.redirect(`${site}/pricing?error=setup`, 303);
  }

  try {
    let customerId = profile?.stripe_customer_id ?? null;
    if (customerId) {
      // A customer saved from another Stripe account (or test vs live) doesn't exist here.
      const existing = await stripe().customers.retrieve(customerId).catch(() => null);
      if (!existing || ('deleted' in existing && existing.deleted)) customerId = null;
    }
    if (!customerId) {
      const customer = await stripe().customers.create({ email: user.email ?? undefined, metadata: { user_id: user.id } });
      customerId = customer.id;
      const { error } = await createAdminClient().from('profiles').upsert({ id: user.id, email: user.email, stripe_customer_id: customerId });
      if (error) throw new Error(`Saving the Stripe customer failed: ${error.message}`);
    }

    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: process.env.STRIPE_PRICE_ID!.trim(), quantity: 1 }],
      subscription_data: { metadata: { user_id: user.id } },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: `${site}/account?upgraded=1`,
      cancel_url: `${site}/pricing?canceled=1`,
    });
    return NextResponse.redirect(session.url!, 303);
  } catch (err) {
    const e = err as { type?: string; code?: string; message?: string };
    console.error('[CloutRadar] Checkout failed:', e.type ?? '', e.code ?? '', e.message ?? err);
    return NextResponse.redirect(`${site}/pricing?error=checkout`, 303);
  }
}
