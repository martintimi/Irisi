import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendLuxuryEmail } from '@/lib/services/vendorNotificationService';
import { buildIrisiEmailShell, buildDetailPanel } from '@/lib/services/emailTheme';
import { getBaseUrl } from '@/lib/utils/url';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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

    const emailHtml = buildIrisiEmailShell({
      title: 'Priority Access Pass Secured',
      eyebrow: 'PRIVATE CLIENT ROSTER',
      preheader: `Your ÌRÍSÍ Priority Access Pass #${formattedPass} is confirmed.`,
      badge: `Priority Pass #${formattedPass}`,
      badgeTone: 'gold',
      headline: 'Welcome to the Priority Roster',
      bodyHtml: `
        <p class="irisi-text" style="color:#3F3F46; font-size:14.5px; line-height:1.7; margin:0 0 18px;">
          Your email has secured founding access to <strong>ÌRÍSÍ</strong>. When doors open, your pass unlocks an exclusive early shopping window to browse curated independent designers and limited drops first.
        </p>
        ${buildDetailPanel([
          { label: 'Pass Number', value: `#${formattedPass}`, highlight: '#9E7724' },
          { label: 'Registered Email', value: email },
          { label: 'Access Tier', value: 'Founding Early Access', highlight: '#059669' },
        ])}
      `,
      ctaLabel: 'Visit ÌRÍSÍ',
      ctaUrl: getBaseUrl(),
      ctaStyle: 'obsidian',
    });

    const founderAlertHtml = buildIrisiEmailShell({
      title: `New Waitlist Pass #${formattedPass}`,
      eyebrow: 'WAITLIST DESK ALERT',
      preheader: `${email} just secured Priority Pass #${formattedPass}.`,
      badge: 'New Waitlist Pass Holder',
      badgeTone: 'gold',
      headline: `Pass #${formattedPass} Reserved`,
      bodyHtml: buildDetailPanel([
        { label: 'Pass Number', value: `#${formattedPass}`, highlight: '#9E7724' },
        { label: 'Shopper Email', value: email },
        { label: 'Joined At', value: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) },
      ]),
      ctaLabel: 'Open Super Admin',
      ctaUrl: `${getBaseUrl()}/admin`,
      ctaStyle: 'obsidian',
    });

    const adminInbox = (process.env.ADMIN_NOTIFICATION_EMAIL || 'martintimi2443@gmail.com').trim();
    await Promise.allSettled([
      sendLuxuryEmail(email, 'ÌRÍSÍ · Priority Access Pass Secured', emailHtml, {
        fromName: 'ÌRÍSÍ Private Client',
      }),
      sendLuxuryEmail(adminInbox, `New Waitlist Pass #${formattedPass}: ${email}`, founderAlertHtml, {
        fromName: 'ÌRÍSÍ Waitlist Desk',
      }),
    ]);

    return NextResponse.json({
      success: true,
      passNumber: formattedPass,
      message: 'Priority pass secured.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to record waitlist entry.' }, { status: 500 });
  }
}
