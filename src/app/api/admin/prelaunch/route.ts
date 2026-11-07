import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendLuxuryEmail } from '@/lib/services/vendorNotificationService';
import { getBaseUrl } from '@/lib/utils/url';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminClient = createAdminClient();
    const [{ data: notifications, error }, { data: dbVendors }] = await Promise.all([
      adminClient
        .from('notifications')
        .select('*')
        .in('type', ['waitlist_subscriber', 'vendor_application', 'merch_waitlist'])
        .order('created_at', { ascending: false }),
      adminClient
        .from('vendors')
        .select('id, email, brand_name, is_verified, bio'),
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build lookup map of vendor records by email
    const vendorMap = new Map<string, any>();
    (dbVendors || []).forEach((v: any) => {
      if (v.email) {
        let parsedBio: any = {};
        try {
          parsedBio = typeof v.bio === 'string' && v.bio.startsWith('{') ? JSON.parse(v.bio) : (v.bio || {});
        } catch {}
        vendorMap.set(v.email.toLowerCase().trim(), { ...v, parsedBio });
      }
    });

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

      const item: any = {
        id: row.id,
        createdAt: row.created_at,
        read: !!row.read,
        title: row.title,
        ...parsedMessage,
      };

      if (row.type === 'vendor_application') {
        const emailKey = (item.founderEmail || '').toLowerCase().trim();
        const matchedVendor = emailKey ? vendorMap.get(emailKey) : null;
        const bio = matchedVendor?.parsedBio || {};

        // STRICT LOGIN TRACKING: Never mark as logged in just because invite_vendor created a vendor record.
        // Only true when the vendor actually signs in via 1-tap link, 4-digit code, or sets their password.
        const hasLoggedIn = !!(
          item.hasLoggedIn === true ||
          bio.hasLoggedIn === true ||
          (matchedVendor && bio.mustSetPassword === false && !!bio.accessCode)
        );
        item.hasLoggedIn = hasLoggedIn;
        item.firstLoginAt = item.firstLoginAt || bio.firstLoginAt || null;
        item.accessCode = item.accessCode || bio.accessCode || null;
        item.approvedAt = item.approvedAt || bio.approvedAt || null;
        item.reapplyRequested = !!item.reapplyRequested;
        item.reapplyNote = item.reapplyNote || '';

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
          invitedNotLoggedIn: vendors.filter((v) => v.read && !v.hasLoggedIn).length,
          loggedInVendors: vendors.filter((v) => v.hasLoggedIn).length,
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

      // 4. Provision & Approve Vendor Record in Database (Stays in Pre-Launch until first login)
      let existingBio: any = {};
      if (existingVendors?.[0]?.bio) {
        try {
          existingBio = typeof existingVendors[0].bio === 'string' && existingVendors[0].bio.startsWith('{')
            ? JSON.parse(existingVendors[0].bio)
            : {};
        } catch {}
      }

      // Check if this specific application already had a recorded login
      let currentNotifMsg: any = {};
      if (id) {
        const { data: currentNotif } = await adminClient.from('notifications').select('message').eq('id', id).maybeSingle();
        try {
          currentNotifMsg = JSON.parse(currentNotif?.message || '{}');
        } catch (_) {}
      }
      const alreadyLoggedInOnThisApp = currentNotifMsg.hasLoggedIn === true;

      const bioObj = {
        ...existingBio,
        bio: existingBio.bio || '',
        specialty: effectiveSpecialty,
        vendorSpecialty: effectiveSpecialty,
        city,
        state,
        socialLinks: body.socialLinks || existingBio.socialLinks || [],
        stockModel: effectiveStockModel,
        isProfileSaved: true,
        approvalStatus: 'approved',
        invitedPrelaunch: true,
        hasLoggedIn: alreadyLoggedInOnThisApp,
        firstLoginAt: alreadyLoggedInOnThisApp ? (currentNotifMsg.firstLoginAt || existingBio.firstLoginAt || null) : null,
        mustSetPassword: alreadyLoggedInOnThisApp ? existingBio.mustSetPassword !== false : true,
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
      const portalUrl = `${getBaseUrl()}/vendor-portal/auth?action=access&code=${accessCode}&email=${encodeURIComponent(normalizedEmail)}`;

      // 6. Update notification record if ID is provided
      if (id) {
        currentNotifMsg.approved = true;
        currentNotifMsg.reapplyRequested = false;
        currentNotifMsg.reapplyNote = '';
        currentNotifMsg.hasLoggedIn = alreadyLoggedInOnThisApp;
        currentNotifMsg.accessCode = accessCode;
        currentNotifMsg.magicToken = magicToken;
        currentNotifMsg.approvedAt = new Date().toISOString();

        await adminClient.from('notifications').update({
          read: true,
          message: JSON.stringify(currentNotifMsg),
        }).eq('id', id);
      }

      // 7. Dispatch Official Luxury Approval Email (Clean White Background, High Inbox Deliverability & Clickable Copy Button)
      const copyUrl = `${getBaseUrl()}/vendor-portal/auth?action=code&code=${accessCode}&email=${encodeURIComponent(normalizedEmail)}&autocopy=1`;
      const plainText = [
        `ÌRÍSÍ — Official Merchant Admission`,
        ``,
        `Welcome to the Collective, ${cleanBrand}.`,
        `The ÌRÍSÍ team has reviewed your brand and approved your merchant store for Launch Drop 001. Your account is verified and ready.`,
        ``,
        `Enter Your Store Now: ${portalUrl}`,
        ``,
        `Your 4-Digit Access Code: ${accessCode}`,
        `Copy Code & Sign In: ${copyUrl}`,
        ``,
        `ÌRÍSÍ Marketplace · Direct Merchant Atelier`,
      ].join('\n');

      const emailHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ÌRÍSÍ Merchant Approval</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; padding: 36px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.04);">
                  <!-- Brand Logo Header -->
                  <tr>
                    <td align="center" style="padding: 36px 24px 20px; border-bottom: 1px solid #f1f5f9; background: #ffffff;">
                      <img src="https://res.cloudinary.com/dvnj8idde/image/upload/v1793703374/brand_assets/irisi_official_email_logo.png" alt="ÌRÍSÍ Emblem" width="64" height="64" style="display: block; margin: 0 auto 14px; border-radius: 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;" />
                      <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">ÌRÍSÍ</h1>
                      <p style="margin: 6px 0 0; font-size: 11px; color: #b89035; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Official Merchant Admission · Drop 001</p>
                    </td>
                  </tr>

                  <!-- Main Acceptance Content -->
                  <tr>
                    <td style="padding: 32px 32px 36px; background-color: #ffffff;">
                      <div style="text-align: center; margin-bottom: 20px;">
                        <span style="display: inline-block; background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-size: 11px; font-weight: 800; padding: 5px 16px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px;">Application Approved</span>
                      </div>
                      <h2 style="color: #111827; font-size: 22px; margin: 0 0 12px; text-align: center; font-weight: 700;">Welcome to the Collective, ${cleanBrand}</h2>
                      <p style="color: #4b5563; font-size: 14px; line-height: 1.65; margin: 0 0 26px; text-align: center;">
                        The ÌRÍSÍ team has reviewed your brand and officially approved your merchant store for <strong>Launch Drop 001</strong>. Your account is already verified — no secondary review required.
                      </p>

                      <!-- 1-Click Instant Login Button -->
                      <div style="text-align: center; margin: 28px 0 32px;">
                        <a href="${portalUrl}" style="background-color: #111827; color: #ffffff; font-weight: 700; font-size: 13.5px; text-transform: uppercase; padding: 16px 36px; border-radius: 12px; text-decoration: none; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(17,24,39,0.18);">
                          Enter Your Store Now &rarr;
                        </a>
                        <span style="display: block; margin-top: 8px; font-size: 11.5px; color: #6b7280;">1-Tap Secure Login (No password needed)</span>
                      </div>

                      <!-- 4-Digit VIP Access Code Card with Clickable Copy Button -->
                      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 14px; padding: 22px 20px; text-align: center;">
                        <span style="font-size: 11px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; display: block; margin-bottom: 6px;">Your 4-Digit Access Code</span>
                        <div style="font-family: 'Courier New', Courier, monospace; font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #111827; display: block; margin: 8px 0; user-select: all; -webkit-user-select: all;">${accessCode}</div>
                        
                        <!-- Clickable Copy Code Button -->
                        <div style="margin-top: 14px;">
                          <a href="${copyUrl}" target="_blank" style="display: inline-block; background-color: #111827; color: #ffffff; border: 1px solid #111827; padding: 10px 24px; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, sans-serif; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
                            Copy Code to Clipboard
                          </a>
                        </div>
                        <span style="font-size: 11px; color: #64748b; display: block; margin-top: 8px;">
                          Click above to copy code and enter your merchant workspace
                        </span>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td align="center" style="padding: 20px 24px; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
                      <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 500;">ÌRÍSÍ Marketplace · Direct Merchant Atelier</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const emailRes = await sendLuxuryEmail(
        normalizedEmail,
        `ÌRÍSÍ Merchant Portal: Application Approved for ${cleanBrand}`,
        emailHtml,
        { fromName: 'ÌRÍSÍ Brand Relations', plainText }
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

    if (action === 'request_reapply') {
      if (!id || !email) {
        return NextResponse.json({ error: 'Application ID and email are required.' }, { status: 400 });
      }
      const normalizedEmail = email.toLowerCase().trim();
      const cleanBrand = (brandName || 'Designer').trim();
      const note = (body.note || 'Please review your brand details and attach clear photos of your products before re-submitting.').trim();
      const reapplyUrl = `${getBaseUrl()}/coming-soon?apply=1`;

      const { data: currentNotif } = await adminClient.from('notifications').select('message').eq('id', id).maybeSingle();
      let notifMsg: any = {};
      try {
        notifMsg = JSON.parse(currentNotif?.message || '{}');
      } catch (_) {}

      notifMsg.approved = false;
      notifMsg.hasLoggedIn = false;
      notifMsg.reapplyRequested = true;
      notifMsg.reapplyNote = note;
      notifMsg.reapplyRequestedAt = new Date().toISOString();

      await adminClient.from('notifications').update({
        read: false,
        message: JSON.stringify(notifMsg),
      }).eq('id', id);

      const emailHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; padding: 36px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden;">
                  <tr>
                    <td align="center" style="padding: 32px 24px 18px; border-bottom: 1px solid #f1f5f9;">
                      <img src="https://res.cloudinary.com/dvnj8idde/image/upload/v1793703374/brand_assets/irisi_official_email_logo.png" alt="ÌRÍSÍ" width="56" height="56" style="display: block; margin: 0 auto 12px; border-radius: 12px; border: 1px solid #e2e8f0;" />
                      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #111827;">ÌRÍSÍ</h1>
                      <p style="margin: 4px 0 0; font-size: 11px; color: #b89035; text-transform: uppercase; font-weight: 700;">Founding Brand Application Update</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 28px 28px 32px;">
                      <h2 style="color: #111827; font-size: 20px; margin: 0 0 12px; font-weight: 700;">Action Required for ${cleanBrand}</h2>
                      <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 18px;">
                        Thank you for applying to join <strong>ÌRÍSÍ Drop 001</strong>. Before we can issue your merchant invite, please update and re-submit your application with the following correction:
                      </p>
                      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin-bottom: 24px; color: #92400e; font-size: 13.5px; line-height: 1.6;">
                        <strong>Curation Team Note:</strong><br/>${note}
                      </div>
                      <div style="text-align: center; margin: 24px 0 8px;">
                        <a href="${reapplyUrl}" style="background-color: #111827; color: #ffffff; font-weight: 700; font-size: 13.5px; text-transform: uppercase; padding: 14px 32px; border-radius: 10px; text-decoration: none; display: inline-block;">
                          Update &amp; Re-Apply Now &rarr;
                        </a>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      await sendLuxuryEmail(
        normalizedEmail,
        `ÌRÍSÍ Application Update: Action Required for ${cleanBrand}`,
        emailHtml,
        { fromName: 'ÌRÍSÍ Brand Relations' }
      ).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Re-application request sent to ${cleanBrand} (${normalizedEmail}).`,
      });
    }

    if (action === 'delete_application') {
      if (!id) {
        return NextResponse.json({ error: 'Application ID required' }, { status: 400 });
      }
      await adminClient.from('notifications').delete().eq('id', id);
      return NextResponse.json({ success: true, message: 'Application removed.' });
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
