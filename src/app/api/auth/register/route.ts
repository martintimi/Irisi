import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const supabase = await createClient();

    // 1. Check if email already exists in database
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, phone')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({
        error: 'An account with this email address already exists. Please Sign In instead.'
      }, { status: 400 });
    }

    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id, email, phone')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingVendor) {
      return NextResponse.json({
        error: 'A merchant account with this email already exists. Please Sign In instead.'
      }, { status: 400 });
    }

    // 2. Check if phone already exists (if provided)
    if (cleanPhone) {
      const { data: existingPhone } = await supabase
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

    // 3. Create account in Supabase Auth
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
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Supabase returns empty identities array when user already exists in Auth
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
      const vendorId = (brandName || defaultPrefix).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const finalSpecialty = specialty || vendorSpecialty || (vendorType === 'fashion_designer' ? 'apparel' : 'multi_department');
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

      const { data: vendorData, error: vendorError } = await supabase.from('vendors').insert({
        id: vendorId,
        user_id: userId,
        brand_name: brandName || fullName,
        designer_name: designerName || fullName,
        contact_person: designerName || fullName,
        email: normalizedEmail,
        phone: cleanPhone,
        location: (location && location.trim()) || '',
        vendor_type: vendorType || 'fashion_designer',
        bank_name: bankName || 'Guaranty Trust Bank (GTBank)',
        account_number: accountNumber || '',
        account_name: accountName || '',
        is_verified: false,
        bio: JSON.stringify(initialBioObj)
      }).select().single();

      if (vendorError) {
        return NextResponse.json({ error: vendorError.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        user: authData.user,
        userType: 'vendor',
        vendorProfile: vendorData,
      });
    } else {
      // Shopper Profile
      const { data: profileData, error: profileError } = await supabase.from('profiles').insert({
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
      }).select().single();

      if (profileError) {
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
      });
    }
  } catch (error: any) {
    console.error('API Register error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
