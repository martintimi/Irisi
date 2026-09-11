import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let vendorId = 
      searchParams.get('id') || 
      searchParams.get('vendorId') || 
      request.headers.get('x-vendor-id');

    const supabase = await createClient();

    let query = supabase.from('vendors').select('*');

    if (vendorId && vendorId.trim().length > 0 && vendorId !== 'undefined' && vendorId !== 'null') {
      const cleanVId = vendorId.trim();
      query = query.or(`id.eq.${cleanVId},email.eq.${cleanVId}`);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        query = query.or(`user_id.eq.${user.id},email.eq.${user.email}`);
      } else {
        return NextResponse.json({ success: false, error: 'No active vendor session' }, { status: 401 });
      }
    }

    const { data: vendor, error } = await query.limit(1).maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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

    let socialLinks: any = {
      instagram: '',
      tiktok: '',
      snapchat: '',
      whatsapp: vendor?.phone || ''
    };

    let vendorSpecialty = 'multi_department';
    if (bioText.startsWith('{') && bioText.endsWith('}')) {
      try {
        const parsed = JSON.parse(bioText);
        bioText = parsed.bio || '';
        socialLinks = { ...socialLinks, ...parsed.socialLinks };
        const hasCoreInfo = !!(vendor?.brand_name && (vendor?.phone || vendor?.email) && vendor?.account_number);
        isProfileSaved = parsed.isProfileSaved !== undefined ? (parsed.isProfileSaved || hasCoreInfo) : true;
        approvalStatus = parsed.approvalStatus || (vendor?.is_verified ? 'approved' : 'pending');
        rejectionReason = parsed.rejectionReason || '';
        city = parsed.city || '';
        state = parsed.state || '';
        dispatchDays = parsed.dispatchDays || '1-2 business days';
        const rawSpec = parsed.specialty || parsed.vendorSpecialty || (vendor?.vendor_type === 'fashion_designer' ? 'native_tailoring' : 'streetwear');
        vendorSpecialty = rawSpec === 'apparel' ? 'streetwear' : rawSpec === 'jewelry' ? 'accessories' : rawSpec;
      } catch (e) {}
    } else if (bioText && bioText.trim().length > 0) {
      isProfileSaved = true;
    }

    const verified = !!vendor?.is_verified;
    const finalApprovalStatus = verified ? 'approved' : (approvalStatus || 'pending');

    return NextResponse.json({
      success: true,
      vendor: {
        ...vendor,
        is_verified: verified,
        isVerified: verified,
        bio: bioText,
        specialty: vendorSpecialty,
        vendorSpecialty,
        socialLinks,
        city,
        state,
        dispatchDays,
        isProfileSaved: isProfileSaved || verified,
        approvalStatus: finalApprovalStatus,
        rejectionReason,
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
    const vendorId = 
      body.vendorId || 
      body.id || 
      request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    const socialLinks = {
      instagram: body.instagram || body.socialLinks?.instagram || '',
      tiktok: body.tiktok || body.socialLinks?.tiktok || '',
      snapchat: body.snapchat || body.socialLinks?.snapchat || '',
      whatsapp: body.whatsapp || body.socialLinks?.whatsapp || body.phone || ''
    };

    const specialty = body.specialty || body.vendorSpecialty || 'multi_department';

    const bioPayload = JSON.stringify({
      bio: body.bio || '',
      specialty,
      vendorSpecialty: specialty,
      socialLinks,
      city: body.city || '',
      state: body.state || '',
      dispatchDays: body.dispatchDays || '1-2 business days',
      isProfileSaved: true,
      approvalStatus: 'pending'
    });

    const { data: updated, error } = await supabase
      .from('vendors')
      .update({
        brand_name: body.brandName,
        designer_name: body.designerName,
        contact_person: body.contactPerson,
        phone: body.phone,
        location: body.location,
        bank_name: body.bankName,
        account_number: body.accountNumber,
        account_name: body.accountName,
        bio: bioPayload,
        is_verified: false,
      })
      .or(`id.eq.${vendorId},email.eq.${vendorId}`)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating vendor profile in DB:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      vendor: {
        ...updated,
        specialty,
        vendorSpecialty: specialty,
        bio: body.bio || '',
        socialLinks,
        city: body.city || '',
        state: body.state || '',
        dispatchDays: body.dispatchDays || '1-2 business days',
        isProfileSaved: true,
        is_verified: false,
        isVerified: false,
        approvalStatus: 'pending',
        rejectionReason: ''
      }
    });
  } catch (error: any) {
    console.error('API /api/vendor/profile POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
