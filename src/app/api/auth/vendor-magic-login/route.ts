import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * VIP Vendor Magic Login Endpoint
 * Supports:
 * 1. 1-Click Magic Token login (?token=...&email=...)
 * 2. 6-Digit VIP Access Code login ({ email, accessCode })
 */
export async function POST(request: Request) {
  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const { token, email, accessCode } = body;

    const normalizedEmail = (email || '').toLowerCase().trim();

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    let isAuthorized = false;
    let resolvedVendorId = '';
    let applicantData: any = null;

    // ── Method 1: Verify 1-Click Magic Token ─────────────────────────────────
    if (token) {
      try {
        const decodedStr = Buffer.from(token, 'base64url').toString('utf8');
        const tokenObj = JSON.parse(decodedStr);

        if (tokenObj.email && tokenObj.email.toLowerCase() === normalizedEmail) {
          // Check expiration (7 days validity)
          if (!tokenObj.exp || tokenObj.exp > Date.now()) {
            isAuthorized = true;
            resolvedVendorId = tokenObj.vendorId || '';
          }
        }
      } catch (err) {
        console.warn('[MAGIC LOGIN] Failed to decode token:', err);
      }
    }

    // ── Method 2: Verify 6-Digit VIP Access Code ─────────────────────────────
    if (!isAuthorized && accessCode) {
      const cleanCode = String(accessCode).replace(/\D/g, '').trim();

      // Look up application in notifications table
      const { data: appNotifs } = await adminClient
        .from('notifications')
        .select('*')
        .eq('type', 'vendor_application')
        .order('created_at', { ascending: false });

      for (const notif of appNotifs || []) {
        try {
          const parsed = JSON.parse(notif.message);
          if (
            parsed.founderEmail &&
            parsed.founderEmail.toLowerCase().trim() === normalizedEmail &&
            parsed.accessCode &&
            String(parsed.accessCode).trim() === cleanCode
          ) {
            isAuthorized = true;
            applicantData = parsed;
            break;
          }
        } catch (_) {}
      }
    }

    // Fallback: Check if token matches claim data from URL
    if (!isAuthorized && token) {
      try {
        const jsonStr = decodeURIComponent(escape(atob(token.replace(/-/g, '+').replace(/_/g, '/'))));
        const claimObj = JSON.parse(jsonStr);
        if (claimObj.email && claimObj.email.toLowerCase() === normalizedEmail && claimObj.isPreApproved) {
          isAuthorized = true;
          applicantData = claimObj;
        }
      } catch (_) {}
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Invalid or expired VIP access code. Please check your invitation email or contact Concierge.' },
        { status: 401 }
      );
    }

    // Find or locate vendor in vendors table
    let { data: vendorList } = await adminClient
      .from('vendors')
      .select('*')
      .eq('email', normalizedEmail)
      .order('created_at', { ascending: false });

    let vendor = vendorList?.[0] || null;

    // Self-healing: If vendor record wasn't created yet, provision it immediately from applicant data
    if (!vendor && applicantData) {
      const brandName = applicantData.brandName || 'My Brand';
      const vId = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `brand-${Date.now()}`;
      
      const bioObj = {
        bio: '',
        specialty: applicantData.specialty || 'streetwear',
        vendorSpecialty: applicantData.specialty || 'streetwear',
        city: applicantData.city || '',
        state: applicantData.state || 'Lagos',
        socialLinks: applicantData.socialLinks || {},
        isProfileSaved: true,
        approvalStatus: 'approved',
        mustSetPassword: true,
        approvedAt: new Date().toISOString(),
      };

      const { data: createdVendor } = await adminClient.from('vendors').upsert({
        id: vId,
        brand_name: brandName,
        designer_name: brandName,
        contact_person: brandName,
        email: normalizedEmail,
        phone: applicantData.founderPhone || applicantData.phone || '',
        location: [applicantData.city, applicantData.state].filter(Boolean).join(', ') || 'Lagos, Nigeria',
        vendor_type: applicantData.specialty === 'native_tailoring' ? 'fashion_designer' : 'boutique_seller',
        is_verified: true,
        bio: JSON.stringify(bioObj),
      }, { onConflict: 'id' }).select().single();

      vendor = createdVendor;
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor profile not found for this invitation.' }, { status: 404 });
    }

    // Ensure vendor is marked as verified & approved in DB
    try {
      let currentBio: any = {};
      if (vendor.bio && vendor.bio.startsWith('{')) {
        currentBio = JSON.parse(vendor.bio);
      }
      currentBio.isProfileSaved = true;
      currentBio.approvalStatus = 'approved';

      await adminClient.from('vendors').update({
        is_verified: true,
        bio: JSON.stringify(currentBio),
      }).eq('id', vendor.id);
    } catch (_) {}

    // Check / fetch Supabase Auth user to generate auth session token
    const { data: userList } = await adminClient.auth.admin.listUsers();
    let authUser: any = userList?.users?.find((u: any) => u.email?.toLowerCase() === normalizedEmail);

    if (!authUser) {
      const { data: newUser } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password: 'IrisiVendor2026!',
        email_confirm: true,
        user_metadata: {
          user_type: 'vendor',
          brand_name: vendor.brand_name,
          phone: vendor.phone,
          is_verified: true,
        },
      });
      authUser = newUser?.user;
    }

    if (authUser && !vendor.user_id) {
      await adminClient.from('vendors').update({ user_id: authUser.id }).eq('id', vendor.id);
    }

    const tokenPayload = authUser?.id || vendor.id;

    const response = NextResponse.json({
      success: true,
      message: 'VIP invitation verified! Welcome to ÌRÍSÍ.',
      redirectUrl: '/vendor-portal',
      vendorId: vendor.id,
      userType: 'vendor',
      mustSetPassword: true,
      vendor: {
        ...vendor,
        is_verified: true,
        isVerified: true,
        approvalStatus: 'approved',
        isProfileSaved: true,
      },
    });

    // Set all required auth cookies for instant seamless access
    response.cookies.set('irisi_vendor_id', vendor.id, { path: '/', httpOnly: false, maxAge: 2592000, sameSite: 'lax' });
    response.cookies.set('veyra_vendor_id', vendor.id, { path: '/', httpOnly: false, maxAge: 2592000, sameSite: 'lax' });
    response.cookies.set('veyra_vendor_token', tokenPayload, { path: '/', httpOnly: false, maxAge: 2592000, sameSite: 'lax' });

    return response;
  } catch (err: any) {
    console.error('[VENDOR MAGIC LOGIN ERROR]', err);
    return NextResponse.json({ error: err.message || 'VIP login failed.' }, { status: 500 });
  }
}
