/**
 * Returns the base URL for the application.
 *
 * Priority:
 *  1. NEXT_PUBLIC_APP_URL  – set in Vercel production env (e.g. "https://irisimi.ng")
 *  2. VERCEL_URL           – auto-set by Vercel on every deployment (preview & production)
 *  3. localhost fallback   – for local development
 *
 * Never hardcode a domain anywhere — always call getBaseUrl().
 */
export function getBaseUrl(): string {
  // Explicit env var takes top priority (set this to https://irisimi.ng in production)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
  }

  // Vercel auto-injects VERCEL_URL (without protocol) on every deploy
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Local dev fallback
  return `http://localhost:${process.env.PORT || 3000}`;
}
