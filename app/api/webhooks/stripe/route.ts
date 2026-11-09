import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { periodEnd } from '@/lib/subscription';

export const runtime = 'nodejs';

async function syncSubscription(sub: Stripe.Subscription) {
  const admin = createAdminClient();
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const fields = {
    stripe_customer_id: customerId,
    subscription_id: sub.id,
    subscription_status: sub.status,
    current_period_end: periodEnd(sub),
    cancel_at_period_end: sub.cancel_at_period_end,
  };
  const userId = sub.metadata?.user_id;
  const { error } = userId
    ? await admin.from('profiles').upsert({ id: userId, ...fields })
    : await admin.from('profiles').update(fields).eq('stripe_customer_id', customerId);
  // Throwing makes the route answer 500, so Stripe retries the event later.
  if (error) throw new Error(`Could not save subscription ${sub.id}: ${error.message}`);
}

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode === 'subscription' && s.subscription) {
          const sub = await stripe().subscriptions.retrieve(s.subscription as string);
          if (!sub.metadata?.user_id && s.client_reference_id) sub.metadata = { ...sub.metadata, user_id: s.client_reference_id };
          await syncSubscription(sub);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
    }
  } catch (err) {
    console.error('Stripe webhook failed', event.type, event.id, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
