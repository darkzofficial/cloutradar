// True once the Supabase keys are set. Without them the public pages still load,
// and sign-in shows a setup message instead of crashing every page.
export function supabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!url && !!key && /^https:\/\/.+/.test(url);
}
