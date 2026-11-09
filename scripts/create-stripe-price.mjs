// Creates the "CloutRadar Pro" product and its £6.99/month price in Stripe.
// Usage: STRIPE_SECRET_KEY=sk_test_... npm run stripe:setup
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('Set STRIPE_SECRET_KEY first, e.g. STRIPE_SECRET_KEY=sk_test_... npm run stripe:setup');
  process.exit(1);
}
const stripe = new Stripe(key, { apiVersion: '2024-06-20' });
const product = await stripe.products.create({
  name: 'CloutRadar Pro',
  description: 'Unlimited TikTok account scans with in-depth reports.',
});
const price = await stripe.prices.create({
  product: product.id,
  currency: 'gbp',
  unit_amount: 699,
  recurring: { interval: 'month' },
  tax_behavior: 'inclusive',
});
console.log(`Created ${product.name} (${product.id})`);
console.log(`Add this to your environment:\nSTRIPE_PRICE_ID=${price.id}`);
