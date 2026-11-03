import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendLuxuryEmail } from '@/lib/services/vendorNotificationService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const {
      brandName,
      specialty,
      instagramHandle,
      socialLinks,
      founderPhone,
      founderEmail,
      state,
      city,
      lookbookUrl,
      stockModel,
      activePostUrl,
      workshopAddress,
      sampleMedia,
    } = body;

    if (!brandName || !founderPhone || !founderEmail) {
      return NextResponse.json(
        { error: 'Brand name, phone number, and email are required.' },
        { status: 400 }
      );
    }

    if (!stockModel) {
      return NextResponse.json(
        { error: 'Please specify how you stock or sell your items.' },
        { status: 400 }
      );
    }

    const cleanedSocialLinks: Array<{ platform: string; handle: string }> = Array.isArray(socialLinks)
      ? socialLinks
          .map((s: any) => ({
            platform: String(s?.platform || 'other').toLowerCase().trim(),
            handle: String(s?.handle || '').trim(),
          }))
          .filter((s: any) => s.handle.length > 0)
      : [];

    const effectiveIg =
      (instagramHandle || '').replace('@', '').trim() ||
      (cleanedSocialLinks.find((s) => s.platform === 'instagram')?.handle || '').replace('@', '').trim() ||
      (cleanedSocialLinks[0]?.handle || '').replace('@', '').trim();

    const applicationData = {
      brandName: brandName.trim(),
      specialty: specialty || 'streetwear',
      instagramHandle: effectiveIg,
      socialLinks: cleanedSocialLinks,
      founderPhone: founderPhone.trim(),
      founderEmail: founderEmail.toLowerCase().trim(),
      location: [city, state].filter(Boolean).join(', ') || 'Nigeria',
      state: (state || '').trim(),
      city: (city || '').trim(),
      lookbookUrl: (lookbookUrl || '').trim(),
      stockModel: stockModel || 'in_stock',
      activePostUrl: (activePostUrl || '').trim(),
      workshopAddress: (workshopAddress || '').trim(),
      sampleMedia: Array.isArray(sampleMedia) ? sampleMedia.filter((u: any) => typeof u === 'string' && u.startsWith('http')) : [],
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

    const formatSocialUrl = (platform: string, handle: string) => {
      const cleanHandle = handle.replace(/^@/, '');
      if (handle.startsWith('http://') || handle.startsWith('https://')) return handle;
      switch (platform) {
        case 'instagram':
          return `https://instagram.com/${cleanHandle}`;
        case 'tiktok':
          return `https://tiktok.com/@${cleanHandle}`;
        case 'x':
          return `https://x.com/${cleanHandle}`;
        case 'facebook':
          return `https://facebook.com/${cleanHandle}`;
        case 'threads':
          return `https://threads.net/@${cleanHandle}`;
        case 'youtube':
          return `https://youtube.com/@${cleanHandle}`;
        case 'pinterest':
          return `https://pinterest.com/${cleanHandle}`;
        case 'whatsapp_catalog':
          return `https://wa.me/${handle.replace(/\D/g, '')}`;
        default:
          return `https://${cleanHandle}`;
      }
    };

    const getPlatformLabel = (platform: string) => {
      const map: Record<string, string> = {
        instagram: 'Instagram',
        tiktok: 'TikTok',
        x: 'X (Twitter)',
        facebook: 'Facebook',
        threads: 'Threads',
        youtube: 'YouTube',
        pinterest: 'Pinterest',
        whatsapp_catalog: 'WhatsApp Catalog',
        website: 'Website',
      };
      return map[platform] || platform.toUpperCase();
    };

    const igLink = applicationData.instagramHandle
      ? `https://instagram.com/${applicationData.instagramHandle}`
      : null;

    const founderHtml = `
      <div style="background-color: #0b0c0e; color: #f4ede3; font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 36px 24px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(230,195,103,0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.65);">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 20px;">
          <img src="https://res.cloudinary.com/dvnj8idde/image/upload/v1793703374/brand_assets/irisi_official_email_logo.png" alt="ÌRÍSÍ Emblem" width="60" height="60" style="display: block; margin: 0 auto 12px; border-radius: 14px; box-shadow: 0 8px 20px rgba(230, 195, 103, 0.35); border: 1px solid rgba(230, 195, 103, 0.4);" />
          <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.25em; text-transform: uppercase; color: #e6c367;">Ì R Í S Í</h1>
          <p style="margin: 4px 0 0; font-size: 10px; letter-spacing: 0.3em; color: #9ca3af; text-transform: uppercase;">Founder &amp; Curation Board Alert</p>
        </div>
        <h2 style="color: #e6c367; margin-top: 0; font-size: 20px; text-transform: uppercase;">✨ New Brand Application: ${applicationData.brandName}</h2>
        <div style="background: rgba(255,255,255,0.04); border-radius: 10px; padding: 20px; font-size: 13px; line-height: 1.8;">
          <p style="margin: 0 0 8px;"><strong>Brand / Store:</strong> <span style="color: #ffffff; font-size: 15px;">${applicationData.brandName}</span></p>
          <p style="margin: 0 0 8px;"><strong>Department:</strong> <span style="color: #e6c367;">${applicationData.specialty}</span></p>
          <p style="margin: 0 0 8px;"><strong>Location:</strong> ${applicationData.location}</p>
          <p style="margin: 0 0 8px;"><strong>WhatsApp:</strong> <a href="${waLink}" style="color: #22c55e; font-weight: bold;">${applicationData.founderPhone} (Tap to Chat)</a></p>
          <p style="margin: 0 0 8px;"><strong>Email:</strong> ${applicationData.founderEmail}</p>
          ${
            cleanedSocialLinks.length > 0
              ? `<div style="margin: 0 0 8px;"><strong>Social Media Channels:</strong>
                  <ul style="margin: 4px 0 0; padding-left: 18px;">
                    ${cleanedSocialLinks
                      .map(
                        (s) =>
                          `<li style="margin-bottom: 3px;">
                            <span style="color: #e6c367;">${getPlatformLabel(s.platform)}:</span>
                            <a href="${formatSocialUrl(s.platform, s.handle)}" target="_blank" rel="noreferrer" style="color: #38bdf8; text-decoration: underline; margin-left: 4px;">${s.handle}</a>
                          </li>`
                      )
                      .join('')}
                  </ul>
                </div>`
              : igLink
              ? `<p style="margin: 0 0 8px;"><strong>Instagram:</strong> <a href="${igLink}" style="color: #38bdf8;">@${applicationData.instagramHandle}</a></p>`
              : ''
          }
          <p style="margin: 0 0 8px;"><strong>Stock Model:</strong> <span style="color: ${applicationData.stockModel === 'in_stock' ? '#22c55e' : applicationData.stockModel === 'pre_order' ? '#e6c367' : '#ec4899'}; font-weight: 700;">${applicationData.stockModel === 'in_stock' ? '📦 Physical Stock on Ground' : applicationData.stockModel === 'pre_order' ? '✂️ Made to Order / Pre-Order' : '🤝 Sourcing / Middleman'}</span></p>
          ${applicationData.workshopAddress ? `<p style="margin: 0 0 8px;"><strong>Workshop / Store Address:</strong> ${applicationData.workshopAddress}</p>` : ''}
          ${applicationData.activePostUrl ? `<p style="margin: 0 0 8px;"><strong>Active Product Video / Post:</strong> <a href="${applicationData.activePostUrl}" target="_blank" style="color: #38bdf8; text-decoration: underline;">${applicationData.activePostUrl}</a></p>` : ''}
          ${applicationData.sampleMedia && applicationData.sampleMedia.length > 0 ? `
            <div style="margin: 12px 0 8px;">
              <strong>Uploaded Sample Media (${applicationData.sampleMedia.length}):</strong>
              <div style="display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
                ${applicationData.sampleMedia.map((m: string) => `<a href="${m}" target="_blank"><img src="${m}" width="70" height="70" style="object-fit: cover; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);" /></a>`).join('')}
              </div>
            </div>
          ` : ''}
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
