import { describe, it, expect } from 'vitest';
import type Stripe from 'stripe';
import { periodEnd } from '@/lib/subscription';

const asSub = (o: object) => o as unknown as Stripe.Subscription;

describe('periodEnd', () => {
  it('reads the old top-level field', () => {
    expect(periodEnd(asSub({ current_period_end: 1_800_000_000 }))).toBe('2027-01-15T08:00:00.000Z');
  });
  it('reads the item-level field used by newer API versions', () => {
    expect(periodEnd(asSub({ items: { data: [{ current_period_end: 1_800_000_000 }] } }))).toBe('2027-01-15T08:00:00.000Z');
  });
  it('returns null when neither is present', () => {
    expect(periodEnd(asSub({ items: { data: [] } }))).toBeNull();
  });
});
