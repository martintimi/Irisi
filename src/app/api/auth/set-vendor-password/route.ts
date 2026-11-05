import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const { email, newPassword, vendorId } = body;

    const normalizedEmail = (email || '').toLowerCase().trim();
    const cleanPassword = (newPassword || '').trim();

    if (!cleanPassword || cleanPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: 'Account email is required.' },
        { status: 400 }
      );
    }

    // Locate auth user
    const { data: userList } = await adminClient.auth.admin.listUsers();
    let authUser: any = userList?.users?.find((u: any) => u.email?.toLowerCase() === normalizedEmail);

    if (authUser) {
      // Update password hash immediately
      const { error: updateErr } = await adminClient.auth.admin.updateUserById(authUser.id, {
        password: cleanPassword,
      });

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }
    } else {
      // Create user if missing
      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password: cleanPassword,
        email_confirm: true,
        user_metadata: { user_type: 'vendor', is_verified: true }
      });
      if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 });
      authUser = created?.user;
    }

    // Update vendor bio to clear mustSetPassword flag
    if (vendorId || normalizedEmail) {
      const { data: vendors } = await adminClient
        .from('vendors')
        .select('*')
        .or(vendorId ? `id.eq.${vendorId},email.eq.${normalizedEmail}` : `email.eq.${normalizedEmail}`)
        .limit(1);

      if (vendors?.[0]) {
        try {
          const v = vendors[0];
          let bioObj: any = {};
          if (v.bio && v.bio.startsWith('{')) {
            bioObj = JSON.parse(v.bio);
          }
          bioObj.mustSetPassword = false;
          bioObj.passwordConfiguredAt = new Date().toISOString();

          await adminClient.from('vendors').update({
            user_id: authUser?.id || v.user_id,
            bio: JSON.stringify(bioObj),
          }).eq('id', v.id);
        } catch (_) {}
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password set successfully! You can now log in directly with your password.',
    });
  } catch (err: any) {
    console.error('[SET VENDOR PASSWORD ERROR]', err);
    return NextResponse.json({ error: err.message || 'Failed to update password.' }, { status: 500 });
  }
}
