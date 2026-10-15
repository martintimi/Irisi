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
    const {
      brandName,
      specialty,
      instagramHandle,
      founderPhone,
      founderEmail,
      state,
      city,
      lookbookUrl,
    } = body;

    if (!brandName || !founderPhone || !founderEmail) {
      return NextResponse.json(
        { error: 'Brand name, phone number, and email are required.' },
        { status: 400 }
      );
    }

    const applicationData = {
      brandName: brandName.trim(),
      specialty: specialty || 'streetwear',
      instagramHandle: (instagramHandle || '').replace('@', '').trim(),
      founderPhone: founderPhone.trim(),
      founderEmail: founderEmail.toLowerCase().trim(),
      location: [city, state].filter(Boolean).join(', ') || 'Nigeria',
      lookbookUrl: (lookbookUrl || '').trim(),
      submittedAt: new Date().toISOString(),
    };

    try {
      await adminClient.from('notifications').insert({
        title: `VENDOR_APPLY:${applicationData.brandName}`,
        message: JSON.stringify(applicationData),
        type: 'vendor_application',
        read: false,
      });
    } catch (dbErr) {
      console.error('[VENDOR DB ERROR]', dbErr);
    }

    const cleanPhone = applicationData.founderPhone.replace(/\D/g, '');
    const waLink = cleanPhone.startsWith('234')
      ? `https://wa.me/${cleanPhone}`
      : cleanPhone.startsWith('0')
      ? `https://wa.me/234${cleanPhone.slice(1)}`
      : `https://wa.me/${cleanPhone}`;

    const igLink = applicationData.instagramHandle
      ? `https://instagram.com/${applicationData.instagramHandle}`
      : null;

    const founderHtml = `
      <div style="background-color: #0b0c0e; color: #f4ede3; font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 32px 20px; max-width: 600px; margin: 0 auto; border-radius: 14px; border: 1px solid rgba(230,195,103,0.3);">
        <h2 style="color: #e6c367; margin-top: 0; font-size: 20px; text-transform: uppercase;">✨ New Brand Application: ${applicationData.brandName}</h2>
        <div style="background: rgba(255,255,255,0.04); border-radius: 10px; padding: 20px; font-size: 13px; line-height: 1.8;">
          <p style="margin: 0 0 8px;"><strong>Brand / Store:</strong> <span style="color: #ffffff; font-size: 15px;">${applicationData.brandName}</span></p>
          <p style="margin: 0 0 8px;"><strong>Department:</strong> <span style="color: #e6c367;">${applicationData.specialty}</span></p>
          <p style="margin: 0 0 8px;"><strong>Location:</strong> ${applicationData.location}</p>
          <p style="margin: 0 0 8px;"><strong>WhatsApp:</strong> <a href="${waLink}" style="color: #22c55e; font-weight: bold;">${applicationData.founderPhone} (Tap to Chat)</a></p>
          <p style="margin: 0 0 8px;"><strong>Email:</strong> ${applicationData.founderEmail}</p>
          ${igLink ? `<p style="margin: 0 0 8px;"><strong>Instagram:</strong> <a href="${igLink}" style="color: #38bdf8;">@${applicationData.instagramHandle}</a></p>` : ''}
          ${applicationData.lookbookUrl ? `<p style="margin: 0;"><strong>Catalog:</strong> <a href="${applicationData.lookbookUrl}" style="color: #e6c367;">${applicationData.lookbookUrl}</a></p>` : ''}
        </div>
        <div style="margin-top: 20px; text-align: center;">
          <a href="${waLink}" style="display: inline-block; background-color: #22c55e; color: #ffffff; font-weight: 700; font-size: 13px; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
            💬 Open WhatsApp Chat
          </a>
        </div>
      </div>
    `;

    sendLuxuryEmail(
      'martintimi2443@gmail.com',
      `🌟 Brand Application: ${applicationData.brandName}`,
      founderHtml,
      { fromName: 'ÌRÍSÍ Brand Relations' }
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Application received. Our curation team will contact you via WhatsApp.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to submit application.' }, { status: 500 });
  }
}
