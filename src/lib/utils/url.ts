/**
 * Returns the base URL for the application.
 *
 * Priority:
 *  1. Incoming HTTP Request Origin / Host (ensures staging .vercel.app stays on staging and live stays on irisimi.ng)
 *  2. Vercel Preview Branch URL when VERCEL_ENV === 'preview' (staging branch)
 *  3. NEXT_PUBLIC_APP_URL – set in Vercel production env (e.g. "https://irisimi.ng")
 *  4. VERCEL_URL – auto-set by Vercel on every deployment
 *  5. localhost fallback – for local development
 */
export function getBaseUrl(request?: Request): string {
  // 1. If an HTTP Request is provided, respect the exact domain the user/admin is currently on
  if (request) {
    try {
      const origin = request.headers.get('origin');
      if (origin && (origin.startsWith('https://') || origin.startsWith('http://'))) {
        return origin.replace(/\/+$/, '');
      }
      const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
      if (forwardedHost) {
        const cleanHost = forwardedHost.split(',')[0].trim();
        const proto = (request.headers.get('x-forwarded-proto') || (cleanHost.includes('localhost') ? 'http' : 'https')).split(',')[0].trim();
        return `${proto}://${cleanHost}`.replace(/\/+$/, '');
      }
    } catch {}
  }

  // 2. If running on a Vercel Preview / Staging deployment, keep links on the staging .vercel.app domain
  if (process.env.VERCEL_ENV === 'preview') {
    const previewHost = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
    if (previewHost) {
      return `https://${previewHost.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;
    }
  }

  // 3. Explicit production env var
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
  }

  // 4. Vercel auto-injected VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;
  }

  // 5. Local dev fallback
  return `http://localhost:${process.env.PORT || 3000}`;
}
