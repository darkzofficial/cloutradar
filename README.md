# CloutRadar

Check a TikTok account for warning signs of bought followers and bot likes. Visitors enter a username or video link plus the numbers shown on the profile; CloutRadar scores the ratios and explains each warning sign.

- **Free:** 3 scans a month (change with `FREE_SCANS_PER_MONTH`), 6 checks, up to 5 videos.
- **Pro, £6.99/month:** unlimited scans, 9 checks (adds share rate, follower growth and comment quality), up to 12 videos, benchmarks by account size, advice on each warning, full history with score trends.

Built with Next.js 14, Supabase (sign-in and database) and Stripe (subscriptions).

## Set up (about 30 minutes)

### 1. Supabase
1. Create a project at supabase.com (choose the London region for UK users).
2. **SQL Editor > New query**: paste `supabase/schema.sql` and press Run.
3. **Authentication > URL Configuration**: set Site URL to your site address, and add `https://YOUR-DOMAIN/auth/callback` (and `http://localhost:3000/auth/callback` for development) to Redirect URLs.
4. **Project Settings > API**: copy the Project URL, the `anon` key and the `service_role` key.
5. Before launch, set up custom SMTP (Authentication > Emails) so sign-in emails come from your own domain; the built-in sender is rate limited.

### 2. Stripe
1. Create an account at stripe.com and stay in **test mode** until launch.
2. Copy your secret key from **Developers > API keys**, then create the £6.99 monthly price:
   ```bash
   STRIPE_SECRET_KEY=sk_test_... npm run stripe:setup
   ```
   It prints `STRIPE_PRICE_ID=price_...`.
3. **Settings > Billing > Customer portal**: turn on cancelling subscriptions and updating payment methods.
4. **Developers > Webhooks > Add endpoint**: `https://YOUR-DOMAIN/api/webhooks/stripe`, with the events `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` and `customer.subscription.deleted`. Copy the signing secret (`whsec_...`).

### 3. Run it locally
```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run dev
```
To test payments locally, forward webhooks with the Stripe CLI and use the `whsec_` it prints:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Pay with test card `4242 4242 4242 4242`, any future date and any CVC.

### 4. Deploy (Vercel)
1. Push this repo to GitHub and import it at vercel.com.
2. Add every variable from `.env.example` under **Settings > Environment Variables**, with `NEXT_PUBLIC_SITE_URL` set to your live address.
3. Deploy, then update the Supabase redirect URL and the Stripe webhook to the live domain.
4. When you're ready to take real money, switch Stripe to live mode, re-run `npm run stripe:setup` with your live key, and replace the Stripe variables.

## Before launch
- Have a solicitor review `app/terms` and `app/privacy` (they are drafts), especially the defamation risk of scoring named accounts and the refund wording.
- Register with HMRC for VAT once you pass the threshold; the price is set as VAT-inclusive.
- Register with the ICO (data protection fee) as you store email addresses.

## Project map
| Path | What it does |
| --- | --- |
| `lib/scoring.ts` | All scoring rules and thresholds, shared by free and Pro |
| `app/api/scan` | Checks the free limit, scores the scan, saves it |
| `app/api/checkout`, `app/api/portal` | Stripe Checkout and the billing portal |
| `app/api/webhooks/stripe` | Keeps each member's Pro status in sync with Stripe |
| `supabase/schema.sql` | Tables, row level security and the new-user trigger |
| `tests/` | Scoring tests: `npm test` |
