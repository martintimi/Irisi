import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const VALID_PASSCODES = ['irisi2026', 'irisi_vip', 'irisi', 'tycoon'];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. If launch mode is explicitly marked "live", skip gate entirely
  if (process.env.LAUNCH_MODE === 'live') {
    return NextResponse.next();
  }

  // 2. Always allow static assets, API routes, and administrative consoles
  const isStaticOrSystem =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/vendor-portal') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple-icon') ||
    pathname.includes('.') ||
    pathname === '/coming-soon';

  if (isStaticOrSystem) {
    return NextResponse.next();
  }

  // 3. Check for URL preview bypass query parameter (e.g. ?preview=irisi2026)
  const previewParam = searchParams.get('preview');
  if (previewParam && VALID_PASSCODES.includes(previewParam.toLowerCase().trim())) {
    const cleanUrl = new URL(request.url);
    cleanUrl.searchParams.delete('preview');

    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set({
      name: 'irisi_preview_pass',
      value: 'unlocked',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return response;
  }

  // 4. Check for preview unlock cookie
  const previewCookie = request.cookies.get('irisi_preview_pass');
  const isUnlocked = previewCookie?.value === 'unlocked';

  if (isUnlocked) {
    // Founder / VIP has unlocked access: view full store experience
    return NextResponse.next();
  }

  // 5. Public visitors without unlock pass:
  // Redirect to /coming-soon so that pathname cleanly matches in AppLayoutWrapper
  if (pathname !== '/coming-soon') {
    return NextResponse.redirect(new URL('/coming-soon', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
