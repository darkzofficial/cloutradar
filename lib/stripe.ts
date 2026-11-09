import 'server-only';
import Stripe from 'stripe';

let client: Stripe | null = null;
export function stripe() {
  if (!client) client = new Stripe((process.env.STRIPE_SECRET_KEY || '').trim(), { apiVersion: '2024-06-20' });
  return client;
}
