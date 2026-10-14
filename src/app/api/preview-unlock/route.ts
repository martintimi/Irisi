import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const VALID_PASSCODES = ['irisi2026', 'irisi_vip', 'irisi', 'tycoon'];

export async function POST(request: Request) {
  try {
    const { passcode, action } = await request.json();

    if (action === 'lock') {
      const response = NextResponse.json({ success: true, status: 'locked' });
      response.cookies.delete('irisi_preview_pass');
      return response;
    }

    const cleanPass = (passcode || '').toLowerCase().trim();
    if (!VALID_PASSCODES.includes(cleanPass)) {
      return NextResponse.json({ error: 'Invalid founder passcode.' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      status: 'unlocked',
      message: 'Founder preview access granted.',
    });

    response.cookies.set({
      name: 'irisi_preview_pass',
      value: 'unlocked',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to process unlock.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  const lock = url.searchParams.get('lock');

  if (lock) {
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('irisi_preview_pass');
    return response;
  }

  if (key && VALID_PASSCODES.includes(key.toLowerCase().trim())) {
    const redirectUrl = new URL(url.searchParams.get('redirect') || '/', request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set({
      name: 'irisi_preview_pass',
      value: 'unlocked',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return response;
  }

  return NextResponse.json({ error: 'Invalid or missing key parameter' }, { status: 400 });
}
