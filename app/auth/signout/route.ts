import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/config';

export async function POST(req: Request) {
  if (supabaseConfigured()) await createClient().auth.signOut();
  return NextResponse.redirect(new URL('/', req.url), 303);
}
