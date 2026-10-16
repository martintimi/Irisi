import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendLuxuryEmail } from '@/lib/services/vendorNotificationService';

export const dynamic = 'force-dynamic';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://npdaydpxzebxdmeevpvl.supabase.co';
const rawServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  Buffer.from('c2Jfc2VjcmV0X0h5MGU3WUJoQzlndXE2bXZROURkZndfQXBkZGdtYm0=', 'base64').toString('utf-8');

const adminClient = createClient(rawUrl, rawServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function POST(request: Request) {
  try {
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
    sendLuxuryEmail(
      'martintimi2443@gmail.com',
      `👕 New Merch Reservation: ${reservationData.colorway} (${reservationData.size})`,
      `<p>New Sovereign Tee reservation:</p>
       <ul>
         <li><strong>Color:</strong> ${reservationData.colorway}</li>
         <li><strong>Size:</strong> ${reservationData.size}</li>
         <li><strong>Email:</strong> ${reservationData.email}</li>
         <li><strong>WhatsApp:</strong> ${reservationData.phone}</li>
       </ul>`,
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
