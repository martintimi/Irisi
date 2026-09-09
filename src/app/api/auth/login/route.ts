import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, expectedRole } = body;

    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: 'Email or phone number, and password are required' }, { status: 400 });
    }

    const supabase = await createClient();

    let resolvedEmail = normalizedEmail;

    // Support logging in with Nigerian phone number (080..., 090..., +234...)
    if (!normalizedEmail.includes('@')) {
      const cleanPhone = normalizedEmail.replace(/[^0-9+]/g, '');
      const localPhone = cleanPhone.startsWith('+234')
        ? '0' + cleanPhone.slice(4)
        : cleanPhone.startsWith('234')
        ? '0' + cleanPhone.slice(3)
        : cleanPhone;
      const intlPhone = cleanPhone.startsWith('0')
        ? '+234' + cleanPhone.slice(1)
        : cleanPhone.startsWith('+')
        ? cleanPhone
        : '+234' + cleanPhone;

      if (expectedRole === 'vendor') {
        const { data: vMatch } = await supabase
          .from('vendors')
          .select('email, phone')
          .or(`phone.eq.${localPhone},phone.eq.${intlPhone},phone.eq.${cleanPhone}`)
          .maybeSingle();

        if (vMatch?.email) {
          resolvedEmail = vMatch.email.trim().toLowerCase();
        }
      } else {
        const { data: pMatch } = await supabase
          .from('profiles')
          .select('email, phone')
          .or(`phone.eq.${localPhone},phone.eq.${intlPhone},phone.eq.${cleanPhone}`)
          .maybeSingle();

        if (pMatch?.email) {
          resolvedEmail = pMatch.email.trim().toLowerCase();
        } else {
          const { data: vMatch } = await supabase
            .from('vendors')
            .select('email, phone')
            .or(`phone.eq.${localPhone},phone.eq.${intlPhone},phone.eq.${cleanPhone}`)
            .maybeSingle();

          if (vMatch?.email) {
            resolvedEmail = vMatch.email.trim().toLowerCase();
          }
        }
      }

      if (!resolvedEmail || !resolvedEmail.includes('@')) {
        return NextResponse.json(
          { error: 'No registered account found with that phone number. Please check or use your email.' },
          { status: 404 }
        );
      }
    }

    // 1. Authenticate credentials with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    if (authError || !authData?.user) {
      return NextResponse.json({
        error: authError?.message || 'Invalid email or password. Please check your credentials.'
      }, { status: 401 });
    }

    const user = authData.user;
    const metadataType = user.user_metadata?.user_type; // 'shopper' | 'vendor'
    const token = authData.session?.access_token || user.id;

    // 2. Query both tables to verify exact account existence
    const { data: vendorRecord } = await supabase
      .from('vendors')
      .select('*')
      .or(`user_id.eq.${user.id},email.eq.${normalizedEmail}`)
      .maybeSingle();

    const { data: profileRecord } = await supabase
      .from('profiles')
      .select('*')
      .or(`id.eq.${user.id},email.eq.${normalizedEmail}`)
      .maybeSingle();

    // 3. Strict Role Isolation Check
    if (expectedRole === 'shopper') {
      if (vendorRecord && !profileRecord && metadataType === 'vendor') {
        return NextResponse.json({
          error: 'This account is registered as a Merchant Atelier. Please sign in via the Partner Portal at /vendor-portal/auth.'
        }, { status: 403 });
      }

      const response = NextResponse.json({
        success: true,
        user,
        token,
        userType: 'shopper',
        profile: profileRecord || {
          id: user.id,
          name: user.user_metadata?.full_name || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          phone: user.user_metadata?.phone || '',
          gender: user.user_metadata?.gender || 'male',
        },
      });

      response.cookies.set('veyra_shopper_id', user.id, { path: '/', httpOnly: false });
      return response;
    }

    if (expectedRole === 'vendor') {
      if (!vendorRecord && (profileRecord || metadataType === 'shopper')) {
        return NextResponse.json({
          error: 'This account is registered as a Customer Shopper. Please sign in via the Shopper Storefront at /auth.'
        }, { status: 403 });
      }

      if (!vendorRecord) {
        return NextResponse.json({
          error: 'No merchant atelier found for this account. Please register your store first.'
        }, { status: 404 });
      }

      const response = NextResponse.json({
        success: true,
        user,
        token,
        vendorId: vendorRecord.id,
        userType: 'vendor',
        vendor: vendorRecord,
      });

      response.cookies.set('veyra_vendor_id', vendorRecord.id, { path: '/', httpOnly: false });
      response.cookies.set('veyra_vendor_token', token, { path: '/', httpOnly: false });
      return response;
    }

    // Default fallback
    if (vendorRecord) {
      const response = NextResponse.json({
        success: true,
        user,
        token,
        vendorId: vendorRecord.id,
        userType: 'vendor',
        vendor: vendorRecord,
      });
      response.cookies.set('veyra_vendor_id', vendorRecord.id, { path: '/', httpOnly: false });
      return response;
    } else {
      const response = NextResponse.json({
        success: true,
        user,
        token,
        userType: 'shopper',
        profile: profileRecord,
      });
      response.cookies.set('veyra_shopper_id', user.id, { path: '/', httpOnly: false });
      return response;
    }
  } catch (error: any) {
    console.error('API /api/auth/login error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
