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
      <div style="background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 36px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.04);">
          <tr>
            <td align="center" style="padding: 32px 24px 20px; border-bottom: 1px solid #f1f5f9; background: #ffffff;">
              <img src="https://res.cloudinary.com/dvnj8idde/image/upload/v1793703374/brand_assets/irisi_official_email_logo.png" alt="ÌRÍSÍ Emblem" width="60" height="60" style="display: block; margin: 0 auto 12px; border-radius: 14px; border: 1px solid #e2e8f0;" />
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">ÌRÍSÍ</h1>
              <p style="margin: 4px 0 0; font-size: 10px; color: #b89035; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Founder &amp; Curation Board Alert</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 32px; background-color: #ffffff;">
              <h2 style="color: #111827; margin: 0 0 16px; font-size: 19px; font-weight: 700;">✨ New Brand Application: ${applicationData.brandName}</h2>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; font-size: 13.5px; line-height: 1.8; color: #1f2937;">
                <p style="margin: 0 0 8px;"><strong>Brand / Store:</strong> <span style="color: #111827; font-size: 15px; font-weight: 700;">${applicationData.brandName}</span></p>
                <p style="margin: 0 0 8px;"><strong>Department:</strong> <span style="color: #b89035; font-weight: 600;">${applicationData.specialty}</span></p>
                <p style="margin: 0 0 8px;"><strong>Location:</strong> ${applicationData.location}</p>
                <p style="margin: 0 0 8px;"><strong>WhatsApp:</strong> <a href="${waLink}" style="color: #16a34a; font-weight: bold;">${applicationData.founderPhone} (Tap to Chat)</a></p>
                <p style="margin: 0 0 8px;"><strong>Email:</strong> ${applicationData.founderEmail}</p>
                ${
                  cleanedSocialLinks.length > 0
                    ? `<div style="margin: 0 0 8px;"><strong>Social Media Channels:</strong>
                        <ul style="margin: 4px 0 0; padding-left: 18px;">
                          ${cleanedSocialLinks
                            .map(
                              (s) =>
                                `<li style="margin-bottom: 3px;">
                                  <span style="color: #b89035; font-weight: 600;">${getPlatformLabel(s.platform)}:</span>
                                  <a href="${formatSocialUrl(s.platform, s.handle)}" target="_blank" rel="noreferrer" style="color: #0284c7; text-decoration: underline; margin-left: 4px;">${s.handle}</a>
                                </li>`
                            )
                            .join('')}
                        </ul>
                      </div>`
                    : igLink
                    ? `<p style="margin: 0 0 8px;"><strong>Instagram:</strong> <a href="${igLink}" style="color: #0284c7;">@${applicationData.instagramHandle}</a></p>`
                    : ''
                }
                <p style="margin: 0 0 8px;"><strong>Stock Model:</strong> <span style="color: ${applicationData.stockModel === 'in_stock' ? '#16a34a' : applicationData.stockModel === 'pre_order' ? '#d97706' : '#db2777'}; font-weight: 700;">${applicationData.stockModel === 'in_stock' ? '📦 Physical Stock on Ground' : applicationData.stockModel === 'pre_order' ? '✂️ Made to Order / Pre-Order' : '🤝 Sourcing / Middleman'}</span></p>
                ${applicationData.workshopAddress ? `<p style="margin: 0 0 8px;"><strong>Workshop / Store Address:</strong> ${applicationData.workshopAddress}</p>` : ''}
                ${applicationData.activePostUrl ? `<p style="margin: 0 0 8px;"><strong>Active Product Video / Post:</strong> <a href="${applicationData.activePostUrl}" target="_blank" style="color: #0284c7; text-decoration: underline;">${applicationData.activePostUrl}</a></p>` : ''}
                ${applicationData.sampleMedia && applicationData.sampleMedia.length > 0 ? `
                  <div style="margin: 12px 0 8px;">
                    <strong>Uploaded Sample Photos (${applicationData.sampleMedia.length}):</strong>
                    <div style="display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
                      ${applicationData.sampleMedia.map((m: string) => `<a href="${m}" target="_blank"><img src="${m}" width="70" height="70" style="object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1;" /></a>`).join('')}
                    </div>
                  </div>
                ` : ''}
                ${applicationData.lookbookUrl ? `<p style="margin: 0;"><strong>Catalog:</strong> <a href="${applicationData.lookbookUrl}" style="color: #b89035;">${applicationData.lookbookUrl}</a></p>` : ''}
              </div>
              <div style="margin-top: 24px; text-align: center;">
                <a href="${waLink}" style="display: inline-block; background-color: #16a34a; color: #ffffff; font-weight: 700; font-size: 13.5px; padding: 13px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 2px 8px rgba(22,163,74,0.25);">
                  💬 Open WhatsApp Chat
                </a>
              </div>
            </td>
          </tr>
        </table>
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
