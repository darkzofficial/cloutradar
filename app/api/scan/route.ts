import { NextResponse } from 'next/server';
import { getSession, monthStart } from '@/lib/account';
import { createAdminClient } from '@/lib/supabase/admin';
import { analyze, sanitizeInput } from '@/lib/scoring';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { user, pro, limit } = await getSession();
  if (!user) return NextResponse.json({ error: 'Sign in to run a scan.' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Missing scan details.' }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!pro) {
    // Count with the service role so the check can't be skipped from the browser.
    const { count, error } = await admin
      .from('scans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStart());
    if (error) return NextResponse.json({ error: 'Could not check your scan allowance. Try again.' }, { status: 500 });
    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        { error: `You've used all ${limit} free scans this month. Upgrade to Pro for unlimited scans.`, code: 'limit' },
        { status: 402 },
      );
    }
  }

  const { input, error } = sanitizeInput(body, pro);
  if (!input) return NextResponse.json({ error }, { status: 400 });

  const result = analyze(input, { pro });
  const { data, error: insErr } = await admin
    .from('scans')
    .insert({ user_id: user.id, handle: input.handle, input, result, score: result.score, pro })
    .select('id')
    .single();
  if (insErr) return NextResponse.json({ error: 'Could not save the scan. Try again.' }, { status: 500 });

  return NextResponse.json({ id: data.id, result });
}
