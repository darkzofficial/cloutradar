import 'server-only';

// Public address of the site. Falls back to the address the request came in on,
// so a missing NEXT_PUBLIC_SITE_URL can't send people to "undefined/...".
export function siteUrl(req?: Request): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  if (/^https?:\/\/[^/]+/.test(env)) return env;
  if (req) return new URL(req.url).origin;
  return 'http://localhost:3000';
}

// Names only, never values: tells the owner which Stripe setting needs fixing.
export function stripeProblems(): string[] {
  const p: string[] = [];
  const key = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (!key) p.push('STRIPE_SECRET_KEY is missing');
  else if (!/^(sk|rk)_(test|live)_/.test(key)) p.push('STRIPE_SECRET_KEY should start with sk_test_ or sk_live_');
  const price = (process.env.STRIPE_PRICE_ID || '').trim();
  if (!price) p.push('STRIPE_PRICE_ID is missing');
  else if (!price.startsWith('price_')) p.push('STRIPE_PRICE_ID should start with price_');
  return p;
}
