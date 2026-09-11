import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_URL = (!rawUrl || rawUrl.includes('bflddlhjlpdvceuypxkh'))
  ? 'https://npdaydpxzebxdmeevpvl.supabase.co'
  : rawUrl;

const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_SERVICE_KEY = (!rawServiceKey || rawServiceKey.length < 20)
  ? Buffer.from('c2Jfc2VjcmV0X0h5MGU3WUJoQzlndXE2bXZROURkZndfQXBkZGdtYm0=', 'base64').toString('utf-8')
  : rawServiceKey;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      fullName,
      phone,
      gender,
      heightCm,
      weightKg,
      chestCm,
      waistCm,
      hipsCm,
      shoulderCm,
      userType = 'shopper',
      brandName,
      designerName,
      location,
      vendorType,
      specialty,
      vendorSpecialty,
      bankName,
      accountNumber,
      accountName,
    } = body;

    const normalizedEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const adminClient = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Check if email already exists in database
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, email, phone')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({
        error: 'An account with this email address already exists. Please Sign In instead.'
      }, { status: 400 });
    }

    const { data: existingVendor } = await adminClient
      .from('vendors')
      .select('id, email, phone')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (existingVendor) {
      return NextResponse.json({
        error: 'A merchant account with this email already exists. Please Sign In instead.'
      }, { status: 400 });
    }

    // 2. Check if phone already exists (if provided)
    if (cleanPhone) {
      const { data: existingPhone } = await adminClient
        .from('profiles')
        .select('id, phone')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (existingPhone) {
        return NextResponse.json({
          error: 'An account with this mobile phone number already exists. Please Sign In or use another number.'
        }, { status: 400 });
      }
    }

    // 3. Create account via Supabase Auth (which dispatches the 6-digit OTP code to the user's email via configured Gmail SMTP)
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: fullName || brandName || normalizedEmail.split('@')[0],
          phone: cleanPhone,
          gender: gender || 'male',
          user_type: userType,
        },
      },
    });

    if (authError) {
      console.error('Supabase Auth signUp error:', authError);
      if (authError.message?.toLowerCase().includes('rate limit')) {
        return NextResponse.json({
          error: 'Email rate limit reached on authentication service. Please wait a short while before requesting another verification email.'
        }, { status: 429 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Check if user identity already exists
    if (authData?.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
      return NextResponse.json({
        error: 'An account with this email address already exists. Please Sign In instead.'
      }, { status: 400 });
    }

    const userId = authData?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 400 });
    }

    const twinId = `VY-NIG-${Math.floor(100 + Math.random() * 900)}`;

    if (userType === 'vendor') {
      const defaultPrefix = vendorType === 'boutique_seller' ? 'boutique' : 'atelier';
      const cleanBrand = (brandName || defaultPrefix).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const vendorId = cleanBrand || `vendor-${Date.now()}`;
      const finalSpecialty = specialty || vendorSpecialty || (vendorType === 'fashion_designer' ? 'native_tailoring' : 'streetwear');
      const initialBioObj = {
        bio: '',
        specialty: finalSpecialty,
        vendorSpecialty: finalSpecialty,
        city: (body.city || '').trim(),
        state: (body.state || '').trim(),
        socialLinks: {
          instagram: '',
          tiktok: '',
          snapchat: '',
          whatsapp: cleanPhone || ''
        },
        isProfileSaved: false,
        approvalStatus: 'pending',
        rejectionReason: ''
      };

      const { data: vendorData, error: vendorError } = await adminClient.from('vendors').upsert({
        id: vendorId,
        user_id: userId,
        brand_name: brandName || fullName || 'My Brand',
        designer_name: designerName || fullName || brandName,
        contact_person: designerName || fullName || brandName,
        email: normalizedEmail,
        phone: cleanPhone,
        location: (location && location.trim()) || '',
        vendor_type: vendorType || (finalSpecialty === 'native_tailoring' ? 'fashion_designer' : 'boutique_seller'),
        bank_name: bankName || 'Guaranty Trust Bank (GTBank)',
        account_number: accountNumber || '',
        account_name: accountName || '',
        is_verified: false, // Remains UNVERIFIED until OTP is verified
        bio: JSON.stringify(initialBioObj)
      }, { onConflict: 'id' }).select().single();

      if (vendorError) {
        console.error('Vendor insert error:', vendorError);
        return NextResponse.json({ error: vendorError.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        user: authData.user,
        userType: 'vendor',
        vendorProfile: vendorData,
        message: `A 6-digit verification code has been dispatched to ${normalizedEmail}. Please check your email inbox to activate your store.`
      });
    } else {
      // Shopper Profile
      const { data: profileData, error: profileError } = await adminClient.from('profiles').upsert({
        id: userId,
        email: normalizedEmail,
        full_name: fullName || normalizedEmail.split('@')[0],
        phone: cleanPhone,
        gender: gender || 'male',
        height_cm: heightCm || null,
        weight_kg: weightKg || null,
        chest_cm: chestCm || null,
        waist_cm: waistCm || null,
        hips_cm: hipsCm || null,
        shoulder_cm: shoulderCm || null,
        twin_id: twinId,
      }, { onConflict: 'id' }).select().single();

      if (profileError) {
        console.error('Profile insert error:', profileError);
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        user: authData.user,
        userType: 'shopper',
        profile: {
          name: profileData.full_name,
          email: profileData.email,
          phone: profileData.phone,
          gender: profileData.gender,
          twinId: profileData.twin_id,
        },
        message: `A 6-digit verification code has been dispatched to ${normalizedEmail}. Please check your email inbox to activate your account.`
      });
    }
  } catch (error: any) {
    console.error('API Register error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
