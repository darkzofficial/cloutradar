import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/config';

// The sign-in email links here. Only same-site paths are allowed as the next page.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next') || '/scan';
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/scan';
  if (code && supabaseConfigured()) {
    const { error } = await createClient().auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL('/login?error=link', url.origin));
}
