import 'server-only';
import { createClient } from '@/lib/supabase/server';

export interface Profile {
  id: string;
  email: string | null;
  stripe_customer_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export const PRICE_LABEL = '£6.99';

export function freeLimit() {
  const n = parseInt(process.env.FREE_SCANS_PER_MONTH || '3', 10);
  return Number.isFinite(n) && n > 0 ? n : 3;
}

// past_due keeps access while Stripe retries the card.
export function isPro(p: Pick<Profile, 'subscription_status' | 'current_period_end'> | null) {
  if (!p || !p.subscription_status) return false;
  if (!['active', 'trialing', 'past_due'].includes(p.subscription_status)) return false;
  return !p.current_period_end || new Date(p.current_period_end).getTime() > Date.now();
}

export function monthStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

export async function getSession() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null, pro: false, usedThisMonth: 0, limit: freeLimit() };
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle<Profile>();
  const { count } = await supabase
    .from('scans')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', monthStart());
  return { supabase, user, profile, pro: isPro(profile), usedThisMonth: count ?? 0, limit: freeLimit() };
}
