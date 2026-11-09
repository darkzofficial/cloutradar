import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl } from '@/lib/config';

// Service-role client: bypasses row level security. Server code only.
export function createAdminClient() {
  return createClient(supabaseUrl(), (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
