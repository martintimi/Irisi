import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendLuxuryEmail } from '@/lib/services/vendorNotificationService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const { email, phone, colorway, size } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 });
    }

    if (!phone) {
      return NextResponse.json({ error: 'WhatsApp phone number is required.' }, { status: 400 });
    }

    const reservationData = {
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      colorway: colorway === 'white' ? 'Bone White' : 'Onyx Black',
      size: (size || 'L').toUpperCase(),
      product: 'ÌRÍSÍ Sovereign Heavyweight Tee (320 GSM)',
      submittedAt: new Date().toISOString(),
    };

    // Store in Supabase notifications table
    try {
      await adminClient.from('notifications').insert({
        title: `MERCH_RESERVE:${reservationData.colorway}:${reservationData.size}:${reservationData.email}`,
        message: JSON.stringify(reservationData),
        type: 'merch_waitlist',
        read: false,
      });
    } catch (dbErr) {
      console.error('[MERCH WAITLIST DB ERROR]', dbErr);
    }

    // Send luxury confirmation email to customer
    const emailHtml = `
      <div style="background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 36px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.04);">
          <tr>
            <td align="center" style="padding: 36px 24px 20px; border-bottom: 1px solid #f1f5f9; background: #ffffff;">
              <img src="https://res.cloudinary.com/dvnj8idde/image/upload/v1793703374/brand_assets/irisi_official_email_logo.png" alt="ÌRÍSÍ Emblem" width="64" height="64" style="display: block; margin: 0 auto 14px; border-radius: 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;" />
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">ÌRÍSÍ</h1>
              <p style="margin: 6px 0 0; font-size: 11px; color: #b89035; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Official Archive · Drop 001</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 36px; background-color: #ffffff;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 26px 20px; text-align: center; margin-bottom: 20px;">
                <span style="background: #111827; color: #ffffff; font-size: 11px; font-weight: 800; padding: 5px 16px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px;">Allocation Reserved</span>
                <h2 style="color: #111827; font-size: 22px; margin: 16px 0 10px; font-weight: 700;">Sovereign Heavyweight Tee</h2>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.65; margin: 0 0 18px;">
                  Your reservation for the <strong>${reservationData.colorway}</strong> in size <strong>${reservationData.size}</strong> has been secured for Launch Drop 001.
                </p>
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; font-size: 12.5px; text-align: left; color: #374151;">
                  <p style="margin: 0 0 6px;">🔒 <strong>Allocation Hold:</strong> 2-Hour Guaranteed Window before public release</p>
                  <p style="margin: 0 0 6px;">📦 <strong>Archival Packaging:</strong> Serialized dustbag &amp; authenticity certificate</p>
                  <p style="margin: 0;">💬 <strong>Drop Notification:</strong> Direct WhatsApp &amp; email alert sent 1 hour early</p>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 18px 24px; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 500;">ÌRÍSÍ Marketplace · Sovereign Luxury</p>
            </td>
          </tr>
        </table>
      </div>
    `;

    sendLuxuryEmail(reservationData.email, 'ÌRÍSÍ · Sovereign Tee Priority Allocation Confirmed', emailHtml, {
      fromName: 'ÌRÍSÍ Archive',
    }).catch(() => {});

    // Notify founder
    const merchAlertHtml = `
      <div style="background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 36px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden;">
          <tr>
            <td align="center" style="padding: 32px 24px 20px; border-bottom: 1px solid #f1f5f9;">
              <img src="https://res.cloudinary.com/dvnj8idde/image/upload/v1793703374/brand_assets/irisi_official_email_logo.png" alt="ÌRÍSÍ Emblem" width="60" height="60" style="display: block; margin: 0 auto 12px; border-radius: 14px; border: 1px solid #e2e8f0;" />
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #111827;">ÌRÍSÍ</h1>
              <p style="margin: 4px 0 0; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Merch Allocation Desk</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px;">
              <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: 10px 14px; margin-bottom: 20px; text-align: center;">
                <span style="color: #92400e; font-weight: 700; font-size: 12px; text-transform: uppercase;">👕 New Heavyweight Tee Allocation Hold</span>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; font-size: 13.5px; line-height: 1.8; color: #1f2937;">
                <p style="margin: 0 0 8px;"><strong>Colorway:</strong> <span style="color: #111827; font-weight: 700;">${reservationData.colorway}</span></p>
                <p style="margin: 0 0 8px;"><strong>Size:</strong> <span style="color: #b89035; font-weight: 700;">${reservationData.size}</span></p>
                <p style="margin: 0 0 8px;"><strong>Email:</strong> <span style="color: #111827;">${reservationData.email}</span></p>
                <p style="margin: 0 0 8px;"><strong>WhatsApp:</strong> <a href="https://wa.me/${reservationData.phone.replace(/\\D/g, '')}" style="color: #16a34a; font-weight: bold;">${reservationData.phone} (Tap to Chat)</a></p>
                <p style="margin: 0; color: #64748b;"><strong>Timestamp:</strong> ${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}</p>
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;

    sendLuxuryEmail(
      'martintimi2443@gmail.com',
      `👕 New Merch Reservation: ${reservationData.colorway} (${reservationData.size})`,
      merchAlertHtml,
      { fromName: 'ÌRÍSÍ Merch Desk' }
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Priority allocation reserved successfully.',
      reservation: reservationData,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to record merch reservation.' }, { status: 500 });
  }
}
