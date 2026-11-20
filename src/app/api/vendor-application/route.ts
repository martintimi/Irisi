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
    const {
      brandName,
      specialty,
      instagramHandle,
      socialLinks,
      founderPhone,
      founderEmail,
      country,
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

    const effectiveCountry = (country || '').trim();

    const applicationData = {
      brandName: brandName.trim(),
      specialty: specialty || 'streetwear',
      instagramHandle: effectiveIg,
      socialLinks: cleanedSocialLinks,
      founderPhone: founderPhone.trim(),
      founderEmail: founderEmail.toLowerCase().trim(),
      country: effectiveCountry,
      state: (state || '').trim(),
      city: (city || '').trim(),
      location: [city, state, effectiveCountry].filter(Boolean).join(', ') || 'Location provided on review',
      lookbookUrl: (lookbookUrl || '').trim(),
      stockModel: stockModel || 'in_stock',
      activePostUrl: (activePostUrl || '').trim(),
      workshopAddress: (workshopAddress || '').trim(),
      sampleMedia: Array.isArray(sampleMedia)
        ? sampleMedia.filter((u: any) => typeof u === 'string' && u.startsWith('http'))
        : [],
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

    const stockModelLabel =
      applicationData.stockModel === 'in_stock'
        ? 'Physical Stock Ready to Ship'
        : applicationData.stockModel === 'pre_order'
        ? 'Made to Order / Craft-on-Order'
        : 'Curated / Sourcing';

    const socialsHtml =
      cleanedSocialLinks.length > 0
        ? cleanedSocialLinks
            .map(
              (s) =>
                `<div style="margin-bottom:3px;"><span style="color:#9E7724; font-weight:600;">${getPlatformLabel(
                  s.platform
                )}:</span> <a href="${formatSocialUrl(
                  s.platform,
                  s.handle
                )}" style="color:#2563EB; text-decoration:underline;">${s.handle}</a></div>`
            )
            .join('')
        : applicationData.instagramHandle
        ? `<a href="https://instagram.com/${applicationData.instagramHandle}" style="color:#2563EB; text-decoration:underline;">@${applicationData.instagramHandle}</a>`
        : 'Not provided';

    const detailRows: Array<{ label: string; value: string; highlight?: string }> = [
      { label: 'Brand / Store', value: applicationData.brandName },
      { label: 'Specialty', value: applicationData.specialty, highlight: '#9E7724' },
      { label: 'Location', value: applicationData.location },
      {
        label: 'WhatsApp',
        value: `<a href="${waLink}" style="color:#059669; text-decoration:underline;">${applicationData.founderPhone}</a>`,
      },
      { label: 'Email', value: applicationData.founderEmail },
      { label: 'Stock Model', value: stockModelLabel },
      { label: 'Social Channels', value: socialsHtml },
    ];

    if (applicationData.workshopAddress) {
      detailRows.push({ label: 'Studio / Workshop', value: applicationData.workshopAddress });
    }
    if (applicationData.activePostUrl) {
      detailRows.push({
        label: 'Featured Video / Post',
        value: `<a href="${applicationData.activePostUrl}" style="color:#2563EB; text-decoration:underline;">Open Link &rarr;</a>`,
      });
    }
    if (applicationData.lookbookUrl) {
      detailRows.push({
        label: 'Lookbook / Catalog',
        value: `<a href="${applicationData.lookbookUrl}" style="color:#9E7724; text-decoration:underline;">View Catalog &rarr;</a>`,
      });
    }

    const mediaGalleryHtml =
      applicationData.sampleMedia.length > 0
        ? `
          <div style="margin:16px 0 8px;">
            <div class="irisi-muted" style="font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#71717A; font-weight:600; margin-bottom:10px;">
              Submitted Sample Pieces (${applicationData.sampleMedia.length})
            </div>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                ${applicationData.sampleMedia
                  .slice(0, 4)
                  .map(
                    (m: string) =>
                      `<td style="padding-right:8px;"><a href="${m}"><img src="${m}" width="84" height="84" style="display:block; width:84px; height:84px; object-fit:cover; border-radius:10px; border:1px solid #E4E4E7;" /></a></td>`
                  )
                  .join('')}
              </tr>
            </table>
          </div>`
        : '';

    const founderHtml = buildIrisiEmailShell({
      title: `New Brand Application: ${applicationData.brandName}`,
      eyebrow: 'FOUNDER & CURATION BOARD ALERT',
      preheader: `${applicationData.brandName} (${applicationData.specialty}) just applied to join ÌRÍSÍ.`,
      badge: 'New Founding Brand Applicant',
      badgeTone: 'gold',
      headline: applicationData.brandName,
      bodyHtml: `
        <p class="irisi-text" style="color:#3F3F46; font-size:14px; line-height:1.65; margin:0 0 12px;">
          A new independent fashion brand just submitted an application to sell on ÌRÍSÍ. Review their portfolio details below or message the founder directly on WhatsApp.
        </p>
        ${buildDetailPanel(detailRows)}
        ${mediaGalleryHtml}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
          <tr>
            <td align="center">
              <a href="${getBaseUrl()}/admin" style="font-size:12px; color:#9E7724; text-decoration:underline; font-weight:600;">
                Review &amp; Approve in Super Admin Dashboard &rarr;
              </a>
            </td>
          </tr>
        </table>
      `,
      ctaLabel: 'Chat Founder on WhatsApp',
      ctaUrl: waLink,
      ctaStyle: 'emerald',
      supportUrl: `${getBaseUrl()}/admin`,
      supportLabel: 'Open ÌRÍSÍ Admin Board',
    });

    // CRITICAL: AWAIT email dispatch cleanly so Vercel serverless NEVER terminates the request before Resend/SMTP completes!
    const adminInbox = (process.env.ADMIN_NOTIFICATION_EMAIL || 'martintimi2443@gmail.com').trim();
    try {
      await sendLuxuryEmail(adminInbox, `New Brand Application: ${applicationData.brandName}`, founderHtml, {
        fromName: 'ÌRÍSÍ Brand Relations',
      });
    } catch (emailErr) {
      console.warn('[VENDOR APPLY EMAIL WARN]', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Application received. Our curation team will contact you via WhatsApp.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to submit application.' }, { status: 500 });
  }
}
