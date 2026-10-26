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
          <img src="${appUrl}/images/logo/irisi-icon.png" alt="ÌRÍSÍ Logo" width="56" height="56" style="border-radius: 12px; margin-bottom: 12px;" />
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

    sendLuxuryEmail(
      'martintimi2443@gmail.com',
      `🔥 New Waitlist Pass #${formattedPass}: ${email}`,
      `<p>New priority signup: <strong>${email}</strong> (Pass #${formattedPass})</p>`,
      { fromName: 'ÌRÍSÍ Waitlist' }
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
