import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
    });

    if (error) {
      console.error('Supabase resend OTP error:', error);
      if (error.message?.toLowerCase().includes('rate limit')) {
        return NextResponse.json({
          error: 'Email rate limit reached on authentication service. Please wait a short while before requesting another verification email.'
        }, { status: 429 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `A fresh 6-digit confirmation code has been dispatched to ${normalizedEmail}. Please check your email inbox.`
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({ error: error.message || 'Server error resending OTP' }, { status: 500 });
  }
}
