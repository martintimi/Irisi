import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let vendorId = 
      searchParams.get('id') || 
      searchParams.get('vendorId') || 
      request.headers.get('x-vendor-id');

    const adminClient = createAdminClient();

    let vendorList: any[] = [];
    const cleanVId = vendorId && vendorId.trim().length > 0 && vendorId !== 'undefined' && vendorId !== 'null'
      ? vendorId.trim()
      : '';

    if (cleanVId) {
      const { data, error } = await adminClient
        .from('vendors')
        .select('*')
        .or(`id.eq.${cleanVId},email.eq.${cleanVId}`)
        .order('created_at', { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      vendorList = data || [];
    } else {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await adminClient
          .from('vendors')
          .select('*')
          .or(`user_id.eq.${user.id},email.eq.${user.email}`)
          .order('created_at', { ascending: false });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        vendorList = data || [];
      } else {
        return NextResponse.json({ success: false, error: 'No active vendor session' }, { status: 401 });
      }
    }

    const vendor = (cleanVId ? vendorList.find(v => v.id === cleanVId) : null)
      || vendorList.find(v => v.is_verified)
      || vendorList[0]
      || null;

    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    let bioText = vendor?.bio || '';
    let isProfileSaved = false;
    let approvalStatus = vendor?.is_verified ? 'approved' : 'pending';
    let rejectionReason = '';
    let city = '';
    let state = '';
    let dispatchDays = '1-2 business days';
    let logoUrl = vendor?.logo_url || vendor?.logo || '';
    let mustSetPassword = false;

    let socialLinks: any = {
      instagram: '',
      tiktok: '',
      snapchat: '',
      whatsapp: vendor?.phone || ''
    };

    let vendorSpecialty = 'multi_department';
    let secondaryCity = '';
    let secondaryState = '';
    let hasSecondaryHub = false;

    let isSuspended = false;
    let suspensionReason = '';
    let shippingRates: any = {
      sameCity: 1000,
      closeHub: 2500,
      interstate: 4500,
      parkPickup: 1500,
      parkPickupEnabled: true,
    };

    if (bioText.startsWith('{') && bioText.endsWith('}')) {
      try {
        const parsed = JSON.parse(bioText);
        bioText = parsed.bio || '';
        if (Array.isArray(parsed.socialLinks)) {
          for (const s of parsed.socialLinks) {
            if (s && typeof s === 'object' && s.platform && s.handle) {
              const p = String(s.platform).toLowerCase().trim();
              const h = String(s.handle).trim();
              if (!h) continue;
              if (p === 'instagram') socialLinks.instagram = h;
              else if (p === 'tiktok') socialLinks.tiktok = h;
              else if (p === 'snapchat') socialLinks.snapchat = h;
              else if (p === 'whatsapp') socialLinks.whatsapp = h;
            }
          }
        } else if (parsed.socialLinks && typeof parsed.socialLinks === 'object') {
          if (typeof parsed.socialLinks.instagram === 'string' && parsed.socialLinks.instagram.trim()) socialLinks.instagram = parsed.socialLinks.instagram.trim();
          if (typeof parsed.socialLinks.tiktok === 'string' && parsed.socialLinks.tiktok.trim()) socialLinks.tiktok = parsed.socialLinks.tiktok.trim();
          if (typeof parsed.socialLinks.snapchat === 'string' && parsed.socialLinks.snapchat.trim()) socialLinks.snapchat = parsed.socialLinks.snapchat.trim();
          if (typeof parsed.socialLinks.whatsapp === 'string' && parsed.socialLinks.whatsapp.trim()) socialLinks.whatsapp = parsed.socialLinks.whatsapp.trim();
          // Recover from previously spread array ({ '0': { platform, handle }, ... })
          for (const val of Object.values(parsed.socialLinks)) {
            if (val && typeof val === 'object' && (val as any).platform && (val as any).handle) {
              const p = String((val as any).platform).toLowerCase().trim();
              const h = String((val as any).handle).trim();
              if (!h) continue;
              if (p === 'instagram' && !socialLinks.instagram) socialLinks.instagram = h;
              else if (p === 'tiktok' && !socialLinks.tiktok) socialLinks.tiktok = h;
              else if (p === 'snapchat' && !socialLinks.snapchat) socialLinks.snapchat = h;
              else if (p === 'whatsapp' && !socialLinks.whatsapp) socialLinks.whatsapp = h;
            }
          }
        }
        if (parsed.instagramHandle && !socialLinks.instagram) {
          socialLinks.instagram = String(parsed.instagramHandle).trim();
        }
        mustSetPassword = parsed.mustSetPassword === true;
        isProfileSaved = parsed.isProfileSaved === true;
        approvalStatus = parsed.approvalStatus || (vendor?.is_verified ? 'approved' : isProfileSaved ? 'pending' : 'unsubmitted');
        rejectionReason = parsed.rejectionReason || '';
        suspensionReason = parsed.suspensionReason || '';
        if (parsed.approvalStatus === 'suspended') {
          isSuspended = true;
          approvalStatus = 'suspended';
        }
        city = parsed.city || '';
        state = parsed.state || '';
        secondaryCity = parsed.secondaryCity || '';
        secondaryState = parsed.secondaryState || '';
        hasSecondaryHub = !!(parsed.hasSecondaryHub || (secondaryCity && secondaryState));
        dispatchDays = parsed.dispatchDays || '1-2 business days';
        const rawSpec = parsed.specialty || parsed.vendorSpecialty || (vendor?.vendor_type === 'fashion_designer' ? 'native_tailoring' : 'streetwear');
        vendorSpecialty = rawSpec === 'apparel' ? 'streetwear' : rawSpec === 'jewelry' ? 'accessories' : rawSpec;
        logoUrl = parsed.logoUrl || parsed.logo || vendor?.logo_url || vendor?.logo || '';
        if (parsed.shippingRates) {
          shippingRates = { ...shippingRates, ...parsed.shippingRates };
        }
      } catch (e) {}
    } else if (bioText && bioText.trim().length > 0) {
      isProfileSaved = true;
    }

    // If social links or city/state are still missing on this vendor record, look up their pre-launch vendor_application notification
    if ((!socialLinks.instagram && !socialLinks.tiktok && !socialLinks.snapchat) || !city || !state) {
      try {
        const { data: appNotifs } = await adminClient
          .from('notifications')
          .select('message')
          .eq('type', 'vendor_application')
          .order('created_at', { ascending: false })
          .limit(100);
        const vEmailLower = (vendor?.email || '').toLowerCase().trim();
        const vBrandLower = (vendor?.brand_name || '').toLowerCase().trim();
        for (const n of appNotifs || []) {
          try {
            const msg = typeof n.message === 'string' ? JSON.parse(n.message) : (n.message || {});
            const mEmail = (msg.founderEmail || '').toLowerCase().trim();
            const mBrand = (msg.brandName || '').toLowerCase().trim();
            if ((vEmailLower && mEmail === vEmailLower) || (vBrandLower && mBrand === vBrandLower)) {
              if (!city && msg.city) city = String(msg.city).trim();
              if (!state && msg.state) state = String(msg.state).trim();
              if (!socialLinks.instagram && msg.instagramHandle) {
                socialLinks.instagram = String(msg.instagramHandle).trim();
              }
              if (Array.isArray(msg.socialLinks)) {
                for (const s of msg.socialLinks) {
                  if (s && typeof s === 'object' && s.platform && s.handle) {
                    const p = String(s.platform).toLowerCase().trim();
                    const h = String(s.handle).trim();
                    if (!h) continue;
                    if (p === 'instagram' && !socialLinks.instagram) socialLinks.instagram = h;
                    else if (p === 'tiktok' && !socialLinks.tiktok) socialLinks.tiktok = h;
                    else if (p === 'snapchat' && !socialLinks.snapchat) socialLinks.snapchat = h;
                    else if (p === 'whatsapp' && !socialLinks.whatsapp) socialLinks.whatsapp = h;
                  }
                }
              }
              break;
            }
          } catch {}
        }
      } catch {}
    }

    const verified = !isSuspended && !!vendor?.is_verified;
    const finalApprovalStatus = isSuspended ? 'suspended' : verified ? 'approved' : (approvalStatus || 'pending');

    if (isSuspended || finalApprovalStatus === 'suspended') {
      return NextResponse.json({
        success: false,
        isSuspended: true,
        approvalStatus: 'suspended',
        suspensionReason,
        error: `Your merchant account has been suspended by administration. Reason: "${suspensionReason || 'Account suspended by administration.'}". Please contact ÌRÍSÍ Concierge Support on WhatsApp to appeal.`
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      vendor: {
        ...vendor,
        is_verified: verified,
        isVerified: verified,
        bio: bioText,
        logoUrl,
        specialty: vendorSpecialty,
        vendorSpecialty,
        socialLinks,
        city,
        state,
        secondaryCity,
        secondaryState,
        hasSecondaryHub,
        dispatchDays,
        shippingRates,
        isProfileSaved: isProfileSaved || verified,
        approvalStatus: finalApprovalStatus,
        rejectionReason,
        isSuspended,
        suspensionReason,
        mustSetPassword,
      }
    });
  } catch (error: any) {
    console.error('API /api/vendor/profile GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let vendorId = 
      body.vendorId || 
      body.id || 
      request.headers.get('x-vendor-id');

    const adminClient = createAdminClient();

    // If no vendorId was supplied in the body or header, resolve via the
    // authenticated Supabase session (handles new devices / cleared localStorage)
    if (!vendorId || vendorId === 'undefined' || vendorId === 'null') {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Vendor ID required — please log in again.' }, { status: 400 });
      }
      // Look up vendor by user_id or email from the auth session
      const { data: sVendors } = await adminClient
        .from('vendors')
        .select('id, is_verified')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .order('created_at', { ascending: false });
      const best = (sVendors || []).find((v: any) => v.is_verified) || sVendors?.[0];
      if (!best?.id) {
        return NextResponse.json({ error: 'No vendor account found for this session.' }, { status: 404 });
      }
      vendorId = best.id;
    }

    // Fetch existing vendor to check previous verified status and preserve fields on partial updates
    const { data: existingList } = await adminClient
      .from('vendors')
      .select('*')
      .or(`id.eq.${vendorId},email.eq.${vendorId}`)
      .order('created_at', { ascending: false });

    const existingVendor = (existingList || []).find((v: any) => v.id === vendorId)
      || (existingList || []).find((v: any) => v.is_verified)
      || existingList?.[0]
      || null;

    const wasVerified = !!existingVendor?.is_verified;

    // Parse existing bio to compare previous fields
    let existingBioObj: any = {};
    if (existingVendor?.bio && existingVendor.bio.startsWith('{')) {
      try { existingBioObj = JSON.parse(existingVendor.bio); } catch (e) {}
    }

    if (existingBioObj.approvalStatus === 'suspended') {
      return NextResponse.json({
        error: 'Cannot update profile: your merchant account is currently suspended by administration.'
      }, { status: 403 });
    }

    // Preserve existing specialty if not explicitly passed (e.g., settlement update)
    const specialty = body.specialty || 
      body.vendorSpecialty || 
      existingBioObj.specialty || 
      existingBioObj.vendorSpecialty || 
      (existingVendor?.vendor_type === 'fashion_designer' ? 'native_tailoring' : 'streetwear');

    // Preserve and persist vendorType: if native_tailoring or fashion_designer selected, ensure fashion_designer
    const vendorType = body.vendorType || 
      (specialty === 'native_tailoring' ? 'fashion_designer' : (existingVendor?.vendor_type || 'boutique_seller'));

    const existingSocialMap: Record<string, string> = {
      instagram: '',
      tiktok: '',
      snapchat: '',
      whatsapp: existingVendor?.phone || '',
    };
    if (Array.isArray(existingBioObj.socialLinks)) {
      for (const s of existingBioObj.socialLinks) {
        if (s && typeof s === 'object' && s.platform && s.handle) {
          const p = String(s.platform).toLowerCase().trim();
          const h = String(s.handle).trim();
          if (!h) continue;
          if (p === 'instagram') existingSocialMap.instagram = h;
          else if (p === 'tiktok') existingSocialMap.tiktok = h;
          else if (p === 'snapchat') existingSocialMap.snapchat = h;
          else if (p === 'whatsapp') existingSocialMap.whatsapp = h;
        }
      }
    } else if (existingBioObj.socialLinks && typeof existingBioObj.socialLinks === 'object') {
      if (typeof existingBioObj.socialLinks.instagram === 'string') existingSocialMap.instagram = existingBioObj.socialLinks.instagram;
      if (typeof existingBioObj.socialLinks.tiktok === 'string') existingSocialMap.tiktok = existingBioObj.socialLinks.tiktok;
      if (typeof existingBioObj.socialLinks.snapchat === 'string') existingSocialMap.snapchat = existingBioObj.socialLinks.snapchat;
      if (typeof existingBioObj.socialLinks.whatsapp === 'string') existingSocialMap.whatsapp = existingBioObj.socialLinks.whatsapp;
    }

    const socialLinks = {
      instagram: (body.instagram !== undefined ? body.instagram : existingSocialMap.instagram).trim(),
      tiktok: (body.tiktok !== undefined ? body.tiktok : existingSocialMap.tiktok).trim(),
      snapchat: (body.snapchat !== undefined ? body.snapchat : existingSocialMap.snapchat).trim(),
      whatsapp: (body.whatsapp !== undefined ? body.whatsapp : existingSocialMap.whatsapp).trim()
    };

    const logoUrl = (body.logoUrl !== undefined ? body.logoUrl : (existingBioObj.logoUrl || existingVendor?.logo_url || '')).trim();
    const secondaryCity = (body.secondaryCity !== undefined ? body.secondaryCity : (existingBioObj.secondaryCity || '')).trim();
    const secondaryState = (body.secondaryState !== undefined ? body.secondaryState : (existingBioObj.secondaryState || '')).trim();
    const hasSecondaryHub = !!((body.hasSecondaryHub !== undefined ? body.hasSecondaryHub : existingBioObj.hasSecondaryHub) && secondaryCity && secondaryState);

    // If an approved vendor updates their bank account or profile, they stay approved so they are never locked out of adding products!
    const finalVerified = wasVerified ? true : false;
    const finalApprovalStatus = wasVerified ? 'approved' : (existingBioObj.approvalStatus || 'pending');

    const shippingRates = body.shippingRates || {
      sameCity: body.sameCityFee !== undefined ? Number(body.sameCityFee) : (existingBioObj.shippingRates?.sameCity ?? 1000),
      closeHub: body.closeHubFee !== undefined ? Number(body.closeHubFee) : (existingBioObj.shippingRates?.closeHub ?? 2500),
      interstate: body.interstateFee !== undefined ? Number(body.interstateFee) : (existingBioObj.shippingRates?.interstate ?? 4500),
      parkPickup: body.parkPickupFee !== undefined ? Number(body.parkPickupFee) : (existingBioObj.shippingRates?.parkPickup ?? 1500),
      parkPickupEnabled: body.parkPickupEnabled !== undefined ? !!body.parkPickupEnabled : (existingBioObj.shippingRates?.parkPickupEnabled ?? true),
    };

    const bioPayload = JSON.stringify({
      ...existingBioObj,
      bio: body.bio !== undefined ? body.bio : (existingBioObj.bio || ''),
      logoUrl,
      specialty,
      vendorSpecialty: specialty,
      socialLinks,
      city: body.city !== undefined ? body.city : (existingBioObj.city || ''),
      state: body.state !== undefined ? body.state : (existingBioObj.state || ''),
      secondaryCity,
      secondaryState,
      hasSecondaryHub,
      dispatchDays: body.dispatchDays || existingBioObj.dispatchDays || '1-2 business days',
      shippingRates,
      isProfileSaved: true,
      approvalStatus: finalApprovalStatus,
      rejectionReason: existingBioObj.rejectionReason || '',
      hasSensitivePendingUpdate: false
    });

    const updateData: any = {
      vendor_type: vendorType,
      bio: bioPayload,
      is_verified: finalVerified,
    };

    if (body.brandName !== undefined) updateData.brand_name = body.brandName;
    if (body.designerName !== undefined) updateData.designer_name = body.designerName;
    if (body.contactPerson !== undefined) updateData.contact_person = body.contactPerson;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.bankName !== undefined) updateData.bank_name = body.bankName;
    if (body.accountNumber !== undefined) updateData.account_number = body.accountNumber;
    if (body.accountName !== undefined) updateData.account_name = body.accountName;

    const { data: updated, error } = await adminClient
      .from('vendors')
      .update(updateData)
      .eq('id', existingVendor?.id || vendorId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating vendor profile in DB:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      isAutoApproved: finalVerified,
      hasSensitivePendingUpdate: false,
      message: 'Store profile updated successfully!',
      vendor: {
        ...updated,
        specialty,
        vendorSpecialty: specialty,
        bio: body.bio || '',
        logoUrl,
        socialLinks,
        city: body.city || '',
        state: body.state || '',
        secondaryCity,
        secondaryState,
        hasSecondaryHub,
        dispatchDays: body.dispatchDays || '1-2 business days',
        shippingRates,
        isProfileSaved: true,
        is_verified: finalVerified,
        isVerified: finalVerified,
        approvalStatus: finalApprovalStatus,
        rejectionReason: ''
      }
    });
  } catch (error: any) {
    console.error('API /api/vendor/profile POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
