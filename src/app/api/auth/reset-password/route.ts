import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSupabaseConfig } from '@/lib/supabase/config';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function getPhoneCandidates(rawPhone: string): string[] {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return [];
  const candidates = new Set<string>();
  candidates.add(rawPhone.trim());
  candidates.add(digits);
  if (digits.startsWith('234') && digits.length >= 12) {
    const local = '0' + digits.slice(3);
    const noPrefix = digits.slice(3);
    candidates.add('+' + digits);
    candidates.add(digits);
    candidates.add(local);
    candidates.add(noPrefix);
  } else if (digits.startsWith('0') && digits.length === 11) {
    const noZero = digits.slice(1);
    candidates.add('234' + noZero);
    candidates.add('+234' + noZero);
    candidates.add(noZero);
  } else if (digits.length === 10) {
    candidates.add('0' + digits);
    candidates.add('234' + digits);
    candidates.add('+234' + digits);
  }
  return Array.from(candidates);
}

export async function POST(request: Request) {
  try {
    const adminClient = createAdminClient();
    const { url, anonKey } = getSupabaseConfig();
    const anonClient = createClient(url, anonKey);
    const body = await request.json();
    const { identifier, token, newPassword } = body;

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return NextResponse.json({ error: 'Account identifier is required.' }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const trimmed = identifier.trim();
    let resolvedEmail = trimmed.toLowerCase();

    // If identifier is not an email, resolve via Nigerian phone candidates or brand name
    if (!trimmed.includes('@')) {
      const candidates = getPhoneCandidates(trimmed);
      const { data: vMatch } = await adminClient
        .from('vendors')
        .select('email')
        .in('phone', candidates)
        .maybeSingle();

      if (vMatch?.email) {
        resolvedEmail = vMatch.email.trim().toLowerCase();
      } else {
        const { data: pMatch } = await adminClient
          .from('profiles')
          .select('email')
          .in('phone', candidates)
          .maybeSingle();

        if (pMatch?.email) {
          resolvedEmail = pMatch.email.trim().toLowerCase();
        } else {
          // Check brand name
          const { data: vBrand } = await adminClient
            .from('vendors')
            .select('email')
            .or(`id.ilike.${trimmed},brand_name.ilike.${trimmed}`)
            .maybeSingle();

          if (vBrand?.email) {
            resolvedEmail = vBrand.email.trim().toLowerCase();
          } else {
            return NextResponse.json(
              { error: 'Account not found. Please verify your email or phone number.' },
              { status: 404 }
            );
          }
        }
      }
    }

    const cleanToken = (token || '').trim();
    let verifiedUser: any = null;

    // 1. If 6-digit code was provided, verify with Supabase Auth
    if (cleanToken) {
      // 1a. Primary verification: verify with type 'recovery'
      const { data: recoveryVerify, error: recoveryErr } = await anonClient.auth.verifyOtp({
        email: resolvedEmail,
        token: cleanToken,
        type: 'recovery',
      });

      if (recoveryErr) {
        console.warn('[reset-password] Supabase verifyOtp recovery error:', recoveryErr.message);
      }

      if (!recoveryErr && recoveryVerify?.user) {
        verifiedUser = recoveryVerify.user;
      } else {
        // 1b. Secondary verification: verify with type 'email'
        const { data: emailVerify, error: emailErr } = await anonClient.auth.verifyOtp({
          email: resolvedEmail,
          token: cleanToken,
          type: 'email',
        });

        if (emailErr) {
          console.warn('[reset-password] Supabase verifyOtp email error:', emailErr.message);
        }

        if (!emailErr && emailVerify?.user) {
          verifiedUser = emailVerify.user;
        }
      }

      // 1c. Fallback verification: check user_metadata recovery_otp
      if (!verifiedUser) {
        const { data: userList } = await adminClient.auth.admin.listUsers();
        const targetUser = userList?.users?.find(
          (u: any) => u.email?.toLowerCase() === resolvedEmail
        );
        if (targetUser) {
          const storedOtp = targetUser.user_metadata?.recovery_otp || targetUser.user_metadata?.verification_otp;
          const expiresAt = targetUser.user_metadata?.recovery_otp_expires_at || targetUser.user_metadata?.verification_otp_expires_at;
          if (storedOtp && storedOtp === cleanToken) {
            if (!expiresAt || new Date(expiresAt) > new Date()) {
              verifiedUser = targetUser;
            }
          }
        }
      }
    } else {
      // 2. No code provided: Check if user has an active recovery session from clicking email link
      const serverSupabase = await createServerSupabase();
      const { data: { user: sessionUser } } = await serverSupabase.auth.getUser();

      if (sessionUser && (sessionUser.email?.toLowerCase() === resolvedEmail || !resolvedEmail)) {
        verifiedUser = sessionUser;
      }
    }

    if (!verifiedUser) {
      if (cleanToken) {
        return NextResponse.json(
          { error: 'The 6-digit verification code entered is invalid or has expired. Please check your latest email or click "Resend Code" to receive a fresh code.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'The 6-digit verification code is required, or please click the recovery link sent to your email.' },
        { status: 400 }
      );
    }

    const userId = verifiedUser.id;

    // 3. Update user's password securely via Supabase Admin API
    const { error: updateErr } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
      email_confirm: true,
      user_metadata: {
        ...(verifiedUser.user_metadata || {}),
        recovery_otp: null,
        recovery_otp_expires_at: null,
      }
    });

    if (updateErr) {
      console.error('[reset-password] updateUserById error:', updateErr);
      return NextResponse.json(
        { error: updateErr.message || 'Failed to update your password. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been updated successfully! You can now sign in with your new password.',
      user: {
        id: userId,
        email: resolvedEmail,
      },
    });
  } catch (error: any) {
    console.error('[reset-password] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while updating your password.' },
      { status: 500 }
    );
  }
}
