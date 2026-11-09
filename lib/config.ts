// True once the Supabase keys are set. Without them the public pages still load,
// and sign-in shows a setup message instead of crashing every page.
let warned = false;

export function supabaseProblems(): string[] {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  const problems: string[] = [];
  if (!url) problems.push('NEXT_PUBLIC_SUPABASE_URL is missing');
  else if (!/^https:\/\//.test(url))
    problems.push('NEXT_PUBLIC_SUPABASE_URL should look like https://abcdefgh.supabase.co');
  if (!key) problems.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
  return problems;
}

export function supabaseConfigured() {
  const problems = supabaseProblems();
  if (problems.length && !warned && typeof window === 'undefined') {
    warned = true;
    // Names only, never values. Shows in Vercel > Logs.
    console.warn(`[CloutRadar] Sign-in is off: ${problems.join('; ')}. Add these in Vercel > Settings > Environment Variables, then redeploy.`);
  }
  return problems.length === 0;
}
