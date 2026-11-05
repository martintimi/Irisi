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
      <div style="background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 36px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.04);">
          <tr>
            <td align="center" style="padding: 36px 24px 20px; border-bottom: 1px solid #f1f5f9; background: #ffffff;">
              <img src="https://res.cloudinary.com/dvnj8idde/image/upload/v1793703374/brand_assets/irisi_official_email_logo.png" alt="ÌRÍSÍ Emblem" width="64" height="64" style="display: block; margin: 0 auto 14px; border-radius: 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;" />
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">ÌRÍSÍ</h1>
              <p style="margin: 6px 0 0; font-size: 11px; color: #b89035; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Sovereign Marketplace · Nigeria</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 36px; background-color: #ffffff;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 26px 20px; text-align: center; margin-bottom: 20px;">
                <span style="background: #111827; color: #ffffff; font-size: 11px; font-weight: 800; padding: 5px 16px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px;">Pass #${formattedPass}</span>
                <h2 style="color: #111827; font-size: 22px; margin: 16px 0 10px; font-weight: 700;">Welcome to the Priority Roster</h2>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.65; margin: 0;">
                  Your email has secured founding access. When the runway opens, your registered email unlocks an <strong>exclusive early shopping window</strong> on opening day.
                </p>
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

    sendLuxuryEmail(email, 'ÌRÍSÍ · Priority Access Pass Secured', emailHtml, {
      fromName: 'ÌRÍSÍ Private Client',
    }).catch(() => {});

    const founderAlertHtml = `
      <div style="background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 36px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden;">
          <tr>
            <td align="center" style="padding: 32px 24px 20px; border-bottom: 1px solid #f1f5f9;">
              <img src="https://res.cloudinary.com/dvnj8idde/image/upload/v1793703374/brand_assets/irisi_official_email_logo.png" alt="ÌRÍSÍ Emblem" width="60" height="60" style="display: block; margin: 0 auto 12px; border-radius: 14px; border: 1px solid #e2e8f0;" />
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #111827;">ÌRÍSÍ</h1>
              <p style="margin: 4px 0 0; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Priority Waitlist Dispatch</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px;">
              <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: 10px 14px; margin-bottom: 20px; text-align: center;">
                <span style="color: #92400e; font-weight: 700; font-size: 12px; text-transform: uppercase;">🔥 New Waitlist Pass Holder</span>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; font-size: 13.5px; line-height: 1.8; color: #1f2937;">
                <p style="margin: 0 0 8px;"><strong>Pass Number:</strong> <span style="color: #b89035; font-weight: 800; font-family: monospace;">#${formattedPass}</span></p>
                <p style="margin: 0 0 8px;"><strong>Registered Email:</strong> <span style="color: #111827; font-weight: 600;">${email}</span></p>
                <p style="margin: 0; color: #64748b;"><strong>Timestamp:</strong> ${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}</p>
              </div>
            </td>
          </tr>
        </table>
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
