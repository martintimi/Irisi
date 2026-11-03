import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendSignupVerificationEmail } from '@/lib/services/emailService';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

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
      isPreApproved,
      socialLinks: incomingSocialLinks,
    } = body;

    const normalizedEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Check if user already exists in auth
    const { data: userList } = await adminClient.auth.admin.listUsers();
    const existingAuthUser = userList?.users?.find((u: any) => u.email?.toLowerCase() === normalizedEmail);

    // If an account is ALREADY CONFIRMED, prevent duplicate creation
    if (existingAuthUser && existingAuthUser.email_confirmed_at) {
      return NextResponse.json({
        error: 'An account with this email address already exists. Please Sign In instead.'
      }, { status: 400 });
    }

    // 2. Check if phone already exists for a confirmed account (if provided)
    if (cleanPhone) {
      const { data: existingPhone } = await adminClient
        .from('profiles')
        .select('id, phone')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (existingPhone && (!existingAuthUser || existingPhone.id !== existingAuthUser.id)) {
        return NextResponse.json({
          error: 'An account with this mobile phone number already exists. Please Sign In or use another number.'
        }, { status: 400 });
      }
    }

    // 3. Generate account & 6-digit OTP code via Supabase Admin API
    let userId = '';
    let otpCode = '';
    let actionLink = '';
    let authUser: any = null;

    if (isPreApproved) {
      // Pre-approved vendor invited by Admin — auto-confirm email directly
      if (existingAuthUser) {
        userId = existingAuthUser.id;
        authUser = existingAuthUser;
        if (password) {
          await adminClient.auth.admin.updateUserById(userId, {
            password,
            email_confirm: true,
            user_metadata: {
              full_name: fullName || brandName || normalizedEmail.split('@')[0],
              phone: cleanPhone,
              user_type: userType,
              is_verified: true,
            }
          }).catch(e => console.warn('Update pre-approved user notice:', e));
        }
      } else {
        const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
          email: normalizedEmail,
          password: password || 'IrisiVendor2026!',
          email_confirm: true,
          user_metadata: {
            full_name: fullName || brandName || normalizedEmail.split('@')[0],
            phone: cleanPhone,
            user_type: userType,
            is_verified: true,
          }
        });
        if (createErr) {
          return NextResponse.json({ error: createErr.message }, { status: 400 });
        }
        userId = created?.user?.id || '';
        authUser = created?.user;
      }
    } else if (existingAuthUser) {
      userId = existingAuthUser.id;
      authUser = existingAuthUser;
      if (password) {
        await adminClient.auth.admin.updateUserById(userId, { password }).catch(e => console.warn('Update password notice:', e));
      }
      const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
        type: 'signup',
        email: normalizedEmail,
        password: password || 'IrisiAuth2026!',
        options: {
          data: {
            full_name: fullName || brandName || normalizedEmail.split('@')[0],
            phone: cleanPhone,
            gender: gender || 'male',
            user_type: userType,
          }
        }
      });

      if (linkErr) {
        console.error('generateLink error for unconfirmed user:', linkErr);
        return NextResponse.json({ error: linkErr.message }, { status: 400 });
      }

      otpCode = linkData?.properties?.email_otp || '';
      actionLink = linkData?.properties?.action_link || '';
    } else {
      const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
        type: 'signup',
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName || brandName || normalizedEmail.split('@')[0],
            phone: cleanPhone,
            gender: gender || 'male',
            user_type: userType,
          }
        }
      });

      if (linkErr) {
        console.error('generateLink error for new user:', linkErr);
        return NextResponse.json({ error: linkErr.message }, { status: 400 });
      }

      userId = linkData?.user?.id;
      authUser = linkData?.user;
      otpCode = linkData?.properties?.email_otp || '';
      actionLink = linkData?.properties?.action_link || '';
    }

    if (!userId || !otpCode) {
      return NextResponse.json({ error: 'Failed to generate verification credentials' }, { status: 500 });
    }

    // 4. Save 6-digit OTP into user_metadata for reliable verification
    await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...(authUser?.user_metadata || {}),
        verification_otp: otpCode,
        verification_otp_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        full_name: fullName || brandName || normalizedEmail.split('@')[0],
        phone: cleanPhone,
        user_type: userType,
      }
    });

    // 5. Dispatch the verification email containing the 6-digit OTP (Skip if pre-approved)
    let emailResult: any = { success: true };
    if (!isPreApproved) {
      emailResult = await sendSignupVerificationEmail({
        recipientEmail: normalizedEmail,
        recipientName: brandName || fullName || undefined,
        otpCode,
        actionLink,
        userType,
      });
    }
    console.log(`[Register POST] 📨 Dispatched signup OTP email to ${normalizedEmail}:`, emailResult);

    // If direct SMTP failed, trigger Supabase native auth email fallback
    if (!emailResult.success) {
      console.warn(`[Register POST] ⚠️ Direct email dispatch failed (${emailResult.error}), trying Supabase native resend fallback...`);
      try {
        await adminClient.auth.resend({
          type: 'signup',
          email: normalizedEmail,
        });
        console.log(`[Register POST] ✅ Supabase native auth resend triggered for ${normalizedEmail}`);
      } catch (sbErr: any) {
        console.warn(`[Register POST] Supabase native resend notice:`, sbErr?.message);
      }
    }

    const twinId = `VY-NIG-${Math.floor(100 + Math.random() * 900)}`;

    if (userType === 'vendor') {
      const defaultPrefix = vendorType === 'boutique_seller' ? 'boutique' : 'atelier';
      const cleanBrand = (brandName || defaultPrefix).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const vendorId = cleanBrand || `vendor-${Date.now()}`;
      const finalSpecialty = specialty || vendorSpecialty || (vendorType === 'fashion_designer' ? 'native_tailoring' : 'streetwear');
      let preloadedSocials: any = {
        instagram: '',
        tiktok: '',
        snapchat: '',
        whatsapp: cleanPhone || ''
      };

      if (Array.isArray(incomingSocialLinks)) {
        incomingSocialLinks.forEach((s: any) => {
          if (s?.platform && s?.handle) {
            preloadedSocials[s.platform] = s.handle;
          }
        });
      } else if (incomingSocialLinks && typeof incomingSocialLinks === 'object') {
        preloadedSocials = { ...preloadedSocials, ...incomingSocialLinks };
      }

      const initialBioObj = {
        bio: '',
        specialty: finalSpecialty,
        vendorSpecialty: finalSpecialty,
        city: (body.city || '').trim(),
        state: (body.state || '').trim(),
        socialLinks: preloadedSocials,
        isProfileSaved: isPreApproved ? true : false,
        approvalStatus: isPreApproved ? 'approved' : 'unsubmitted',
        rejectionReason: '',
        preApprovedAt: isPreApproved ? new Date().toISOString() : undefined,
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
        bank_name: (accountNumber && bankName) ? bankName.trim() : (bankName ? bankName.trim() : ''),
        account_number: (accountNumber && accountNumber.trim()) || '',
        account_name: (accountName && accountName.trim()) || '',
        is_verified: isPreApproved ? true : false, // Instantly verified if pre-approved by Admin!
        bio: JSON.stringify(initialBioObj)
      }, { onConflict: 'id' }).select().single();

      if (vendorError) {
        console.error('Vendor insert error:', vendorError);
        return NextResponse.json({ error: vendorError.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        directLogin: !!isPreApproved,
        user: authUser || { id: userId, email: normalizedEmail },
        userType: 'vendor',
        vendor: vendorData,
        vendorProfile: {
          brandName: vendorData.brand_name,
          designerName: vendorData.designer_name,
          email: vendorData.email,
          phone: vendorData.phone,
          location: vendorData.location,
          city: body.city || '',
          state: body.state || '',
          vendorType: vendorData.vendor_type,
          specialty: finalSpecialty,
          isProfileSaved: isPreApproved ? true : false,
          approvalStatus: isPreApproved ? 'approved' : 'unsubmitted',
          is_verified: isPreApproved ? true : false,
        },
        message: isPreApproved
          ? 'Storefront activated and verified! Welcome to ÌRÍSÍ.'
          : `A 6-digit verification code has been dispatched to ${normalizedEmail}. Please check your email inbox to activate your store.`
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
        user: authUser || { id: userId, email: normalizedEmail },
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
