import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createVanillaSupabase } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bflddlhjlpdvceuypxkh.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_I6AiJ9EP64cKcJhUt90eJQ_zf3BPdNV';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    const cleanNewPassword = (newPassword || '').trim();
    const cleanCurrentPassword = (currentPassword || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanNewPassword || cleanNewPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const serverSupabase = await createServerSupabase();
    const { data: { user: sessionUser } } = await serverSupabase.auth.getUser();

    const targetEmail = cleanEmail || sessionUser?.email;

    if (!targetEmail && !sessionUser) {
      return NextResponse.json(
        { error: 'Please provide your account email address to update your password.' },
        { status: 400 }
      );
    }

    // 1. Create a clean Supabase client to verify current password without polluting session cookies
    const authClient = createVanillaSupabase(SUPABASE_URL, ANON_KEY);
    let verifiedSession: any = null;

    if (targetEmail && cleanCurrentPassword) {
      // Check user's provided current password
      const { data: signInData, error: signInErr } = await authClient.auth.signInWithPassword({
        email: targetEmail,
        password: cleanCurrentPassword,
      });

      if (!signInErr && signInData?.session) {
        verifiedSession = signInData.session;
      } else {
        // Fallback default passwords for accounts created via OTP or quick signup
        const defaultPasswords = [
          'IrisiCustomer2026!',
          'IrisiVendor2026!',
          'Irisi2026!',
          'VeyraCustomer2026!',
          'VeyraVendor2026!'
        ];
        for (const dp of defaultPasswords) {
          const { data: defData, error: defErr } = await authClient.auth.signInWithPassword({
            email: targetEmail,
            password: dp,
          });
          if (!defErr && defData?.session) {
            verifiedSession = defData.session;
            break;
          }
        }
      }
    }

    // 2. Perform password update
    if (verifiedSession) {
      const { error: updateErr } = await authClient.auth.updateUser({
        password: cleanNewPassword,
      });

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }

      // Also update on server session if available
      if (sessionUser) {
        await serverSupabase.auth.updateUser({ password: cleanNewPassword }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully.',
      });
    }

    // If current password didn't match and user is already logged in via active session
    if (sessionUser) {
      const { error: updateErr } = await serverSupabase.auth.updateUser({
        password: cleanNewPassword,
      });

      if (!updateErr) {
        return NextResponse.json({
          success: true,
          message: 'Password updated successfully for your active session.',
        });
      }
    }

    return NextResponse.json(
      { error: 'Current password is incorrect. Please check your existing password and try again.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Password change API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while changing password.' },
      { status: 500 }
    );
  }
}
