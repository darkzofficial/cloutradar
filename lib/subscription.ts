import type Stripe from 'stripe';

// Newer Stripe API versions (2025-03-31 onward) moved current_period_end from the
// subscription onto each subscription item. Webhook payloads use the endpoint's
// API version, so read whichever is present.
export function periodEnd(sub: Stripe.Subscription): string | null {
  const s = sub as unknown as { current_period_end?: number; items?: { data?: { current_period_end?: number }[] } };
  const fromItems = (s.items?.data ?? []).map((i) => i.current_period_end).filter((n): n is number => typeof n === 'number');
  const ts = typeof s.current_period_end === 'number' ? s.current_period_end : fromItems.length ? Math.max(...fromItems) : null;
  return ts ? new Date(ts * 1000).toISOString() : null;
}
