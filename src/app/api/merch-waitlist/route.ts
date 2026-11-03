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
      <div style="background-color: #08090a; color: #f4ede3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; max-width: 580px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(230,195,103,0.3);">
        <div style="text-align: center; margin-bottom: 28px;">
          <img src="https://res.cloudinary.com/dvnj8idde/image/upload/v1793703374/brand_assets/irisi_official_email_logo.png" alt="ÌRÍSÍ Emblem" width="64" height="64" style="display: block; margin: 0 auto 14px; border-radius: 14px; box-shadow: 0 8px 24px rgba(230, 195, 103, 0.35); border: 1px solid rgba(230, 195, 103, 0.4);" />
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.3em; text-transform: uppercase; color: #ffffff;">Ì R Í S Í</h1>
          <p style="margin: 6px 0 0; font-size: 10px; letter-spacing: 0.35em; color: #e6c367; text-transform: uppercase;">Official Archive · Drop 001</p>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(230,195,103,0.2); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px;">
          <span style="background: #e6c367; color: #08090a; font-size: 10px; font-weight: 800; letter-spacing: 0.2em; padding: 4px 14px; border-radius: 999px; text-transform: uppercase;">Allocation Reserved</span>
          <h2 style="color: #ffffff; font-size: 20px; margin: 14px 0 8px;">Sovereign Heavyweight Tee</h2>
          <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 0 0 16px;">
            Your reservation for the <strong>${reservationData.colorway}</strong> in size <strong>${reservationData.size}</strong> has been secured for Launch Drop 001.
          </p>
          <div style="background: rgba(0,0,0,0.4); border-radius: 8px; padding: 12px; font-size: 12px; text-align: left; color: #d4d4d8;">
            <p style="margin: 0 0 6px;">🔒 <strong>Allocation Hold:</strong> 2-Hour Guaranteed Window before public release</p>
            <p style="margin: 0 0 6px;">📦 <strong>Archival Packaging:</strong> Serialized dustbag & authenticity certificate</p>
            <p style="margin: 0;">💬 <strong>Drop Notification:</strong> Direct WhatsApp & email alert sent 1 hour early</p>
          </div>
        </div>
        <p style="text-align: center; font-size: 11px; color: #71717a; margin: 0;">Lagos · Abuja · London · Worldwide</p>
      </div>
    `;

    sendLuxuryEmail(reservationData.email, 'Ì R Í S Í · Sovereign Tee Priority Allocation Confirmed', emailHtml, {
      fromName: 'ÌRÍSÍ Archive',
    }).catch(() => {});

    // Notify founder
    const merchAlertHtml = `
      <div style="background-color: #08090a; color: #f4ede3; font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 36px 24px; max-width: 580px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(230,195,103,0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.65);">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 20px;">
          <img src="https://res.cloudinary.com/dvnj8idde/image/upload/v1793703374/brand_assets/irisi_official_email_logo.png" alt="ÌRÍSÍ Emblem" width="60" height="60" style="display: block; margin: 0 auto 12px; border-radius: 14px; box-shadow: 0 8px 20px rgba(230, 195, 103, 0.35); border: 1px solid rgba(230, 195, 103, 0.4);" />
          <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.25em; text-transform: uppercase; color: #e6c367;">Ì R Í S Í</h1>
          <p style="margin: 4px 0 0; font-size: 10px; letter-spacing: 0.3em; color: #9ca3af; text-transform: uppercase;">Merch Allocation Desk</p>
        </div>
        <div style="background: rgba(230, 195, 103, 0.1); border: 1px solid rgba(230, 195, 103, 0.3); border-radius: 10px; padding: 10px 14px; margin-bottom: 20px; text-align: center;">
          <span style="color: #e6c367; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">👕 New Heavyweight Tee Allocation Hold</span>
        </div>
        <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 20px; font-size: 13px; line-height: 1.8;">
          <p style="margin: 0 0 8px;"><strong>Colorway:</strong> <span style="color: #ffffff; font-weight: 700;">${reservationData.colorway}</span></p>
          <p style="margin: 0 0 8px;"><strong>Size:</strong> <span style="color: #e6c367; font-weight: 700;">${reservationData.size}</span></p>
          <p style="margin: 0 0 8px;"><strong>Email:</strong> <span style="color: #ffffff;">${reservationData.email}</span></p>
          <p style="margin: 0 0 8px;"><strong>WhatsApp:</strong> <a href="https://wa.me/${reservationData.phone.replace(/\\D/g, '')}" style="color: #22c55e; font-weight: bold;">${reservationData.phone} (Tap to Chat)</a></p>
          <p style="margin: 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}</p>
        </div>
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
