import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';

/**
 * Creates an authorized Supabase Admin Client using the project service role key.
 * Uses getSupabaseConfig to ensure URL and Service Key ALWAYS match the target environment.
 */
export function createAdminClient() {
  const { url, serviceKey } = getSupabaseConfig();
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
