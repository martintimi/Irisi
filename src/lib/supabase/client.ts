import { createBrowserClient } from '@supabase/ssr';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_URL = (!rawUrl || rawUrl.includes('bflddlhjlpdvceuypxkh'))
  ? 'https://npdaydpxzebxdmeevpvl.supabase.co'
  : rawUrl;

const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_ANON_KEY = (!rawKey || rawKey.includes('I6AiJ9EP64cKcJhUt90eJQ'))
  ? 'sb_publishable_17ggIm1HkeJY7CSpTA2XZA_H-2SHPRk'
  : rawKey;

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Singleton browser client for easy client-side operations
export const supabase = createClient();

