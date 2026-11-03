import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendLuxuryEmail } from '@/lib/services/vendorNotificationService';
import { getBaseUrl } from '@/lib/utils/url';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const email = (body.email || '').toLowerCase().trim();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const passNumber = Math.floor(700 + Math.random() * 250);
    const formattedPass = String(passNumber).padStart(5, '0');

    try {
      await adminClient.from('notifications').insert({
        title: `WAITLIST:${email}`,
        message: JSON.stringify({
          email,
          passNumber: formattedPass,
          joinedAt: new Date().toISOString(),
        }),
        type: 'waitlist_subscriber',
        read: false,
      });
    } catch (dbErr) {
      console.error('[WAITLIST DB ERROR]', dbErr);
    }

    const appUrl = getBaseUrl();
    const emailHtml = `
      <div style="background-color: #0b0c0e; color: #f4ede3; font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px 24px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(230,195,103,0.3);">
        <div style="text-align: center; margin-bottom: 28px;">
          <img src="https://res.cloudinary.com/dvnj8idde/image/upload/v1793703374/brand_assets/irisi_official_email_logo.png" alt="ÌRÍSÍ Emblem" width="64" height="64" style="display: block; margin: 0 auto 14px; border-radius: 14px; box-shadow: 0 8px 24px rgba(230, 195, 103, 0.35); border: 1px solid rgba(230, 195, 103, 0.4);" />
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.25em; font-weight: 800; color: #ffffff;">Ì R Í S Í</h1>
          <p style="margin: 4px 0 0; font-size: 10px; letter-spacing: 0.35em; color: #e6c367; text-transform: uppercase;">Sovereign Marketplace · Nigeria</p>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(230,195,103,0.2); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px;">
          <span style="background: #e6c367; color: #08090a; font-size: 10px; font-weight: 800; letter-spacing: 0.2em; padding: 4px 12px; border-radius: 999px; text-transform: uppercase;">Pass #${formattedPass}</span>
          <h2 style="color: #ffffff; font-size: 20px; margin: 12px 0 8px;">Welcome to the Priority Roster</h2>
          <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 0;">
            Your email has secured founding access. When the runway opens, your registered email unlocks an <strong>exclusive early shopping window</strong> on opening day.
          </p>
        </div>
        <p style="text-align: center; font-size: 11px; color: #71717a; margin: 0;">Lagos · Abuja · London · Worldwide</p>
      </div>
    `;

    sendLuxuryEmail(email, 'Ì R Í S Í · Priority Access Pass Secured', emailHtml, {
      fromName: 'ÌRÍSÍ Private Client',
    }).catch(() => {});

    const founderAlertHtml = `
      <div style="background-color: #08090a; color: #f4ede3; font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 36px 24px; max-width: 580px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(230,195,103,0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.65);">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 20px;">
          <img src="https://res.cloudinary.com/dvnj8idde/image/upload/v1793703374/brand_assets/irisi_official_email_logo.png" alt="ÌRÍSÍ Emblem" width="60" height="60" style="display: block; margin: 0 auto 12px; border-radius: 14px; box-shadow: 0 8px 20px rgba(230, 195, 103, 0.35); border: 1px solid rgba(230, 195, 103, 0.4);" />
          <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.25em; text-transform: uppercase; color: #e6c367;">Ì R Í S Í</h1>
          <p style="margin: 4px 0 0; font-size: 10px; letter-spacing: 0.3em; color: #9ca3af; text-transform: uppercase;">Priority Waitlist Dispatch</p>
        </div>
        <div style="background: rgba(230, 195, 103, 0.1); border: 1px solid rgba(230, 195, 103, 0.3); border-radius: 10px; padding: 10px 14px; margin-bottom: 20px; text-align: center;">
          <span style="color: #e6c367; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">🔥 New Waitlist Pass Holder</span>
        </div>
        <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 20px; font-size: 13px; line-height: 1.8;">
          <p style="margin: 0 0 8px;"><strong>Pass Number:</strong> <span style="color: #e6c367; font-weight: 800; font-family: monospace;">#${formattedPass}</span></p>
          <p style="margin: 0 0 8px;"><strong>Registered Email:</strong> <span style="color: #ffffff;">${email}</span></p>
          <p style="margin: 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}</p>
        </div>
      </div>
    `;

    sendLuxuryEmail(
      'martintimi2443@gmail.com',
      `🔥 New Waitlist Pass #${formattedPass}: ${email}`,
      founderAlertHtml,
      { fromName: 'ÌRÍSÍ Waitlist Desk' }
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      passNumber: formattedPass,
      message: 'Priority pass secured.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to record waitlist entry.' }, { status: 500 });
  }
}
