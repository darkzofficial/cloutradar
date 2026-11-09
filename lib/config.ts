// Supabase settings, cleaned up so small paste mistakes don't break the site.
// Safe to import from browser code: NEXT_PUBLIC_ values are inlined at build time.

let warned = false;

// Keep only the base address (https://abcdefgh.supabase.co). Pages in the Supabase
// dashboard sometimes show it with /rest/v1/ on the end, which breaks every request.
export function normalizeSupabaseUrl(raw: string | undefined): string {
  const v = (raw || '').trim().replace(/^['"]|['"]$/g, '');
  if (!v) return '';
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return u.origin;
  } catch {
    return v;
  }
}

export const supabaseUrl = () => normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseAnonKey = () => (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');

export function supabaseProblems(): string[] {
  const url = supabaseUrl();
  const problems: string[] = [];
  if (!url) problems.push('NEXT_PUBLIC_SUPABASE_URL is missing');
  else if (!/^https:\/\/[^/]+$/.test(url)) problems.push('NEXT_PUBLIC_SUPABASE_URL should look like https://abcdefgh.supabase.co');
  if (!supabaseAnonKey()) problems.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
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
