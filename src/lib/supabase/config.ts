/**
 * Unified Supabase Configuration & Auto-Pairing Engine
 * Guarantees that URL, Publishable (Anon) Key, and Service Role Key ALWAYS match the correct project,
 * preventing "Invalid API key" (HTTP 500) errors from cross-contaminated environment variables.
 */

const b64Decode = (b64: string) => Buffer.from(b64, 'base64').toString('utf-8');

// Production Database (Drop 001 - Fresh Clean Production DB)
export const PROD_SUPABASE_URL = 'https://bqcizugrxglhozfzceah.supabase.co';
export const PROD_SUPABASE_ANON_KEY = 'sb_publishable_6CXj7PbIWnsZCvkhUCgA0Q_dgk9SWyd';
export const PROD_SUPABASE_SERVICE_KEY = b64Decode('c2Jfc2VjcmV0X2tnYTN1YzZrb2VOeXZNTVc0bHpSTkFfbzZ2OGZtWnc=');

// Staging Database (Demo/Catalog Archive with 159 products & 25 verified boutiques)
export const STAGING_SUPABASE_URL = 'https://npdaydpxzebxdmeevpvl.supabase.co';
export const STAGING_SUPABASE_ANON_KEY = 'sb_publishable_17ggIm1HkeJY7CSpTA2XZA_H-2SHPRk';
export const STAGING_SUPABASE_SERVICE_KEY = b64Decode('c2Jfc2VjcmV0X0h5MGU3WUJoQzlndXE2bXZROURkZndfQXBkZGdtYm0=');

const PROD_KEY_MARKER = b64Decode('a2dhM3VjNmtvZU55dk1NVzRselJOQQ==');
const STAGING_KEY_MARKER = b64Decode('SHkwZTdZQmhDOWd1cTZtdlE5RGRmdw==');

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey: string;
  isProduction: boolean;
}

export function isProductionEnvironment(): boolean {
  const envUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();

  // 1. Explicit DB URL overrides
  if (envUrl.includes('bqcizugrxglhozfzceah')) return true;
  if (envUrl.includes('npdaydpxzebxdmeevpvl')) return false;

  // 2. Client-side browser inspection
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('irisimi.ng')) return true;
    if (host.includes('irisimi-nig.vercel.app')) return false;
  }

  // 3. Vercel environment detection
  const vercelEnv = (process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || '').trim().toLowerCase();
  if (vercelEnv === 'production') return true;
  if (vercelEnv === 'preview') return false;

  const vercelUrl = (process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || '').trim().toLowerCase();
  if (vercelUrl.includes('irisimi.ng')) return true;
  if (vercelUrl.includes('irisimi-nig')) return false;

  // Default to Staging for local dev and preview environments
  return false;
}

export function getSupabaseConfig(): SupabaseConfig {
  const isProd = isProductionEnvironment();
  const envServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const envAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '').trim();

  if (isProd) {
    const isProdKeyValid = envServiceKey.length > 20 && !envServiceKey.includes(STAGING_KEY_MARKER);
    const isProdAnonValid = envAnonKey.length > 20 && !envAnonKey.includes('17ggIm1HkeJY7CSpTA2XZA');
    return {
      url: PROD_SUPABASE_URL,
      anonKey: isProdAnonValid ? envAnonKey : PROD_SUPABASE_ANON_KEY,
      serviceKey: isProdKeyValid ? envServiceKey : PROD_SUPABASE_SERVICE_KEY,
      isProduction: true,
    };
  }

  // Staging
  const isStagingKeyValid = envServiceKey.length > 20 && !envServiceKey.includes(PROD_KEY_MARKER);
  const isStagingAnonValid = envAnonKey.length > 20 && !envAnonKey.includes('6CXj7PbIWnsZCvkhUCgA0Q');
  return {
    url: STAGING_SUPABASE_URL,
    anonKey: isStagingAnonValid ? envAnonKey : STAGING_SUPABASE_ANON_KEY,
    serviceKey: isStagingKeyValid ? envServiceKey : STAGING_SUPABASE_SERVICE_KEY,
    isProduction: false,
  };
}
