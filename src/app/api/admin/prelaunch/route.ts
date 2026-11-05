import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendLuxuryEmail } from '@/lib/services/vendorNotificationService';
import { getBaseUrl } from '@/lib/utils/url';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminClient = createAdminClient();
    const { data: notifications, error } = await adminClient
      .from('notifications')
      .select('*')
      .in('type', ['waitlist_subscriber', 'vendor_application', 'merch_waitlist'])
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const vendors: any[] = [];
    const merch: any[] = [];
    const waitlist: any[] = [];

    const merchSizes: Record<string, number> = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
    const merchColors: Record<string, number> = { 'Onyx Black': 0, 'Bone White': 0 };

    (notifications || []).forEach((row) => {
      let parsedMessage: any = {};
      try {
        parsedMessage = typeof row.message === 'string' ? JSON.parse(row.message) : (row.message || {});
      } catch {
        parsedMessage = { raw: row.message };
      }

      const item = {
        id: row.id,
        createdAt: row.created_at,
        read: !!row.read,
        title: row.title,
        ...parsedMessage,
      };

      if (row.type === 'vendor_application') {
        vendors.push(item);
      } else if (row.type === 'merch_waitlist') {
        merch.push(item);
        const sz = (item.size || 'L').toUpperCase();
        merchSizes[sz] = (merchSizes[sz] || 0) + 1;

        const col = item.colorway?.toLowerCase().includes('white') ? 'Bone White' : 'Onyx Black';
        merchColors[col] = (merchColors[col] || 0) + 1;
      } else if (row.type === 'waitlist_subscriber') {
        waitlist.push(item);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        vendors,
        merch,
        waitlist,
        metrics: {
          totalVendors: vendors.length,
          pendingVendors: vendors.filter((v) => !v.read).length,
          totalMerch: merch.length,
          merchSizes,
          merchColors,
          totalWaitlist: waitlist.length,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch pre-launch data.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const { action, id, email, brandName, specialty } = body;

    if (action === 'invite_vendor') {
      if (!email) {
        return NextResponse.json({ error: 'Vendor email required' }, { status: 400 });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const phone = (body.phone || body.founderPhone || '').trim();
      const state = (body.state || 'Lagos').trim();
      const city = (body.city || '').trim();
      const effectiveSpecialty = specialty || body.specialty || 'streetwear';
      const effectiveStockModel = body.stockModel || 'in_stock';
      const cleanBrand = (brandName || 'Designer').trim();

      // 1. Generate 4-Digit VIP Access Code
      const accessCode = Math.floor(1000 + Math.random() * 9000).toString();

      // 2. Generate or locate Vendor ID
      let vendorId = cleanBrand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `brand-${Date.now()}`;

      // Check if vendor already exists
      const { data: existingVendors } = await adminClient
        .from('vendors')
        .select('*')
        .eq('email', normalizedEmail)
        .limit(1);

      if (existingVendors?.[0]) {
        vendorId = existingVendors[0].id;
      }

      // 3. Locate or create Supabase Auth User
      const { data: userList } = await adminClient.auth.admin.listUsers();
      let authUser = userList?.users?.find((u: any) => u.email?.toLowerCase() === normalizedEmail);

      if (!authUser) {
        const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
          email: normalizedEmail,
          password: 'IrisiVendor2026!',
          email_confirm: true,
          user_metadata: {
            user_type: 'vendor',
            brand_name: cleanBrand,
            phone,
            is_verified: true,
          },
        });
        if (!createErr && created?.user) {
          authUser = created.user;
        }
      } else {
        await adminClient.auth.admin.updateUserById(authUser.id, {
          email_confirm: true,
          user_metadata: {
            ...authUser.user_metadata,
            user_type: 'vendor',
            brand_name: cleanBrand,
            is_verified: true,
          },
        }).catch(() => {});
      }

      // 4. Provision & Approve Vendor Record in Database
      const bioObj = {
        bio: '',
        specialty: effectiveSpecialty,
        vendorSpecialty: effectiveSpecialty,
        city,
        state,
        socialLinks: body.socialLinks || [],
        stockModel: effectiveStockModel,
        isProfileSaved: true,
        approvalStatus: 'approved',
        mustSetPassword: true,
        accessCode,
        approvedAt: new Date().toISOString(),
      };

      await adminClient.from('vendors').upsert({
        id: vendorId,
        user_id: authUser?.id || null,
        brand_name: cleanBrand,
        designer_name: cleanBrand,
        contact_person: cleanBrand,
        email: normalizedEmail,
        phone,
        location: [city, state].filter(Boolean).join(', ') || 'Lagos, Nigeria',
        vendor_type: effectiveSpecialty === 'native_tailoring' ? 'fashion_designer' : 'boutique_seller',
        is_verified: true,
        bio: JSON.stringify(bioObj),
      }, { onConflict: 'id' });

      // 5. Construct 1-Click Magic Login Token
      const tokenPayload = {
        email: normalizedEmail,
        vendorId,
        accessCode,
        brandName: cleanBrand,
        exp: Date.now() + 7 * 86400000, // 7 days validity
      };
      const magicToken = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
      const portalUrl = `${getBaseUrl()}/vendor-portal/auth?action=access&token=${magicToken}&email=${encodeURIComponent(normalizedEmail)}`;

      // 6. Update notification record if ID is provided
      if (id) {
        const { data: currentNotif } = await adminClient.from('notifications').select('message').eq('id', id).maybeSingle();
        let notifMsg: any = {};
        try {
          notifMsg = JSON.parse(currentNotif?.message || '{}');
        } catch (_) {}
        notifMsg.approved = true;
        notifMsg.accessCode = accessCode;
        notifMsg.magicToken = magicToken;
        notifMsg.approvedAt = new Date().toISOString();

        await adminClient.from('notifications').update({
          read: true,
          message: JSON.stringify(notifMsg),
        }).eq('id', id);
      }

      // 7. Dispatch Official Luxury Approval Email
      const emailHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="light dark">
          <meta name="supported-color-schemes" content="light dark">
          <title>ÌRÍSÍ Merchant Approval</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #08090a; background-image: linear-gradient(#08090a, #08090a); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background-color: #08090a; background-image: linear-gradient(#08090a, #08090a); color: #f4ede3; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(230,195,103,0.3);">
            <!-- Brand Logo Header -->
            <div style="text-align: center; margin-bottom: 28px;">
              <img src="https://res.cloudinary.com/dvnj8idde/image/upload/v1793703374/brand_assets/irisi_official_email_logo.png" alt="ÌRÍSÍ Emblem" width="64" height="64" style="display: block; margin: 0 auto 16px; border-radius: 14px; box-shadow: 0 8px 24px rgba(230, 195, 103, 0.35); border: 1px solid rgba(230, 195, 103, 0.4);" />
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff;">ÌRÍSÍ</h1>
              <p style="margin: 6px 0 0; font-size: 11px; color: #e6c367; text-transform: uppercase;">Official Merchant Admission · Drop 001</p>
            </div>

            <!-- Main Acceptance Card -->
            <div style="background-color: #121316; background-image: linear-gradient(#121316, #121316); border: 1px solid rgba(230,195,103,0.25); border-radius: 14px; padding: 28px; margin-bottom: 24px;">
              <div style="text-align: center; margin-bottom: 16px;">
                <span style="background: #e6c367; color: #08090a; font-size: 10px; font-weight: 800; padding: 5px 16px; border-radius: 999px; text-transform: uppercase;">Application Approved</span>
              </div>
              <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 12px; text-align: center;">Welcome to the Collective, ${cleanBrand} 🥂</h2>
              <p style="color: #d1d5db; font-size: 13.5px; line-height: 1.7; margin: 0 0 24px; text-align: center;">
                The ÌRÍSÍ Curation Board has reviewed your brand and officially approved your merchant store for <strong>Launch Drop 001</strong>. Your account is already verified — no secondary review required!
              </p>

              <!-- 1-Click Instant Login Button -->
              <div style="text-align: center; margin: 28px 0;">
                <a href="${portalUrl}" style="background-color: #e6c367; color: #08090a; font-weight: 800; font-size: 13px; text-transform: uppercase; padding: 16px 36px; border-radius: 12px; text-decoration: none; display: inline-block;">
                  Enter Your Store Now &rarr;
                </a>
                <span style="display: block; margin-top: 8px; font-size: 11px; color: #9ca3af;">1-Tap Secure Login (No password needed)</span>
              </div>

              <!-- 4-Digit VIP Access Code Card -->
              <div style="margin-top: 24px; padding: 20px; background-color: #0b0c0e; background-image: linear-gradient(#0b0c0e, #0b0c0e); border: 1.5px dashed rgba(230,195,103,0.5); border-radius: 12px; text-align: center;">
                <span style="font-size: 10px; font-family: monospace; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af; display: block; margin-bottom: 8px;">Your 4-Digit Access Code</span>
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #e6c367; display: block; margin: 6px 0;">${accessCode}</span>
                <span style="font-size: 11px; color: #d1d5db; display: block; margin-top: 8px;">
                  Copy this 4-digit code to sign in at the <a href="${getBaseUrl()}/vendor-portal/auth" style="color: #e6c367; text-decoration: underline;">Merchant Portal</a> anytime.
                </span>
              </div>
            </div>

            <p style="text-align: center; font-size: 11px; color: #71717a; margin: 0;">ÌRÍSÍ Marketplace · Direct Merchant Atelier</p>
          </div>
        </body>
        </html>
      `;

      const emailRes = await sendLuxuryEmail(
        normalizedEmail,
        `✨ ÌRÍSÍ · Your Brand Has Been Approved! Welcome to Drop 001 (${cleanBrand})`,
        emailHtml,
        { fromName: 'ÌRÍSÍ Brand Curation' }
      );

      return NextResponse.json({
        success: true,
        message: `Account approved and VIP invitation dispatched to ${normalizedEmail}`,
        portalUrl,
        accessCode,
        vendorId,
        provider: emailRes.provider,
        emailDelivered: emailRes.success,
      });
    }

    if (action === 'mark_read') {
      if (id) {
        await adminClient.from('notifications').update({ read: true }).eq('id', id);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Action failed.' }, { status: 500 });
  }
}
