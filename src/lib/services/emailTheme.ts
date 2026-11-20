// Unified Quiet-Luxury Responsive Email Shell for ÌRÍSÍ
// Engineered to never shrink on Gmail/iOS Mail and remain razor-sharp in BOTH Light Mode and Dark Mode.

export const EMAIL_LOGO_URL =
  'https://res.cloudinary.com/dvnj8idde/image/upload/v1793703374/brand_assets/irisi_official_email_logo.png';
export const EMAIL_CONCIERGE_WHATSAPP = 'https://wa.me/2349070332145';

export type EmailAccentTone = 'gold' | 'emerald' | 'blue' | 'amber' | 'rose' | 'neutral';

const TONE_MAP: Record<
  EmailAccentTone,
  { pillBg: string; pillBorder: string; pillText: string }
> = {
  gold: { pillBg: '#FBF6E8', pillBorder: '#E5CFA0', pillText: '#8A6719' },
  emerald: { pillBg: '#ECFDF5', pillBorder: '#A7F3D0', pillText: '#047857' },
  blue: { pillBg: '#EFF6FF', pillBorder: '#BFDBFE', pillText: '#1D4ED8' },
  amber: { pillBg: '#FFFBEB', pillBorder: '#FDE68A', pillText: '#B45309' },
  rose: { pillBg: '#FFF1F2', pillBorder: '#FECDD3', pillText: '#BE123C' },
  neutral: { pillBg: '#F4F4F5', pillBorder: '#E4E4E7', pillText: '#3F3F46' },
};

export interface LuxuryEmailShellOptions {
  title: string;
  eyebrow?: string;
  preheader?: string;
  badge?: string;
  badgeTone?: EmailAccentTone;
  headline?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  ctaStyle?: 'obsidian' | 'gold' | 'emerald';
  footerNote?: string;
  supportUrl?: string;
  supportLabel?: string;
}

/**
 * Bulletproof 600px responsive editorial email template.
 * - Fixed fluid table geometry prevents Gmail mobile shrinking.
 * - Explicit obsidian header + crisp alabaster body with high-contrast charcoal ink.
 * - Clean @media (prefers-color-scheme: dark) dark mode support without garbled color inversion.
 */
export function buildIrisiEmailShell(opts: LuxuryEmailShellOptions): string {
  const {
    title,
    eyebrow = 'CURATED FASHION & COMMERCE',
    preheader = '',
    badge,
    badgeTone = 'gold',
    headline,
    bodyHtml,
    ctaLabel,
    ctaUrl,
    ctaStyle = 'obsidian',
    footerNote = 'Protected by ÌRÍSÍ Escrow · Verified Independent Fashion Houses',
    supportUrl = EMAIL_CONCIERGE_WHATSAPP,
    supportLabel = 'Chat with ÌRÍSÍ Concierge on WhatsApp',
  } = opts;

  const tone = TONE_MAP[badgeTone] || TONE_MAP.gold;
  const btnBg =
    ctaStyle === 'gold' ? '#D4AF37' : ctaStyle === 'emerald' ? '#059669' : '#0E0E11';
  const btnText = ctaStyle === 'gold' ? '#0B0B0D' : '#FFFFFF';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title}</title>
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-width: 100% !important;
      -webkit-text-size-adjust: 100% !important;
      -ms-text-size-adjust: 100% !important;
    }
    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
      border-collapse: collapse !important;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    a { text-decoration: none; }
    .email-shell {
      width: 100% !important;
      max-width: 600px !important;
    }
    @media only screen and (max-width: 620px) {
      .email-outer-pad {
        padding: 16px 10px !important;
      }
      .email-body-pad {
        padding: 26px 20px 28px !important;
      }
      .email-header-pad {
        padding: 28px 20px 24px !important;
      }
      .email-headline {
        font-size: 23px !important;
        line-height: 1.25 !important;
      }
      .stack-col {
        display: block !important;
        width: 100% !important;
        padding-bottom: 10px !important;
      }
    }
    @media (prefers-color-scheme: dark) {
      body, .irisi-outer {
        background-color: #09090B !important;
        color: #F4F4F5 !important;
      }
      .irisi-card {
        background-color: #141418 !important;
        border-color: #27272A !important;
      }
      .irisi-body-cell {
        background-color: #141418 !important;
        color: #E4E4E7 !important;
      }
      .irisi-panel {
        background-color: #1C1C22 !important;
        border-color: #2E2E36 !important;
      }
      .irisi-ink {
        color: #FAFAFA !important;
      }
      .irisi-text {
        color: #D4D4D8 !important;
      }
      .irisi-muted {
        color: #A1A1AA !important;
      }
      .irisi-divider {
        border-color: #27272A !important;
      }
      .irisi-btn-obsidian {
        background-color: #E6C367 !important;
        color: #09090B !important;
      }
      .irisi-support-btn {
        background-color: #1C1C22 !important;
        border-color: #3F3F46 !important;
        color: #FAFAFA !important;
      }
    }
  </style>
</head>
<body class="irisi-outer" style="margin:0; padding:0; width:100%; background-color:#F3F2EE; color:#18181B; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
  ${
    preheader
      ? `<div style="display:none; font-size:1px; color:#F3F2EE; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">${preheader}</div>`
      : ''
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="irisi-outer" style="width:100%; background-color:#F3F2EE; margin:0; padding:0;">
    <tr>
      <td align="center" class="email-outer-pad" style="padding: 32px 14px;">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td>
        <![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-shell irisi-card" style="width:100%; max-width:600px; margin:0 auto; background-color:#FFFFFF; border:1px solid #E6E3DC; border-radius:20px; overflow:hidden; box-shadow:0 12px 36px rgba(14,14,17,0.06);">
          <!-- SIGNATURE OBSIDIAN EDITORIAL HEADER -->
          <tr>
            <td align="center" class="email-header-pad" style="background-color:#0E0E11; padding:32px 28px 26px; border-bottom:2px solid #D4AF37;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <img src="${EMAIL_LOGO_URL}" alt="ÌRÍSÍ" width="48" height="48" style="display:block; width:48px; height:48px; border-radius:12px; border:1px solid rgba(212,175,55,0.45);" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <div style="font-family: Georgia, 'Times New Roman', serif; font-size:24px; font-weight:400; letter-spacing:0.26em; color:#FFFFFF; text-transform:uppercase; line-height:1.1; padding-left:0.26em;">
                      ÌRÍSÍ
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:8px;">
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:10px; font-weight:500; letter-spacing:0.22em; color:#E6C367; text-transform:uppercase;">
                      ${eyebrow}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CONTENT CARD -->
          <tr>
            <td class="email-body-pad irisi-body-cell" style="background-color:#FFFFFF; padding:32px 32px 34px; color:#18181B;">
              ${
                badge
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                      <tr>
                        <td align="left">
                          <span style="display:inline-block; background-color:${tone.pillBg}; border:1px solid ${tone.pillBorder}; color:${tone.pillText}; font-size:10.5px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; padding:6px 13px; border-radius:999px;">
                            ${badge}
                          </span>
                        </td>
                      </tr>
                    </table>`
                  : ''
              }

              ${
                headline
                  ? `<h2 class="email-headline irisi-ink" style="font-family: Georgia, 'Times New Roman', serif; font-size:26px; font-weight:400; line-height:1.25; color:#111114; margin:0 0 16px; letter-spacing:-0.01em;">
                      ${headline}
                    </h2>`
                  : ''
              }

              ${bodyHtml}

              ${
                ctaLabel && ctaUrl
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px; margin-bottom:10px;">
                      <tr>
                        <td align="center">
                          <a href="${ctaUrl}" class="${ctaStyle === 'obsidian' ? 'irisi-btn-obsidian' : ''}" style="display:inline-block; background-color:${btnBg}; color:${btnText}; font-size:13px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; text-decoration:none; padding:15px 32px; border-radius:999px; mso-padding-alt:0;">
                            ${ctaLabel} &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>`
                  : ''
              }

              <!-- CONCIERGE & FOOTER -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="irisi-divider" style="margin-top:30px; border-top:1px solid #ECEAE4;">
                <tr>
                  <td align="center" style="padding-top:24px;">
                    <p class="irisi-muted" style="font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#71717A; margin:0 0 12px; font-weight:500;">
                      Need personal assistance?
                    </p>
                    <a href="${supportUrl}" class="irisi-support-btn" style="display:inline-block; background-color:#F7F6F3; border:1px solid #DFDDD6; color:#18181B; font-size:12px; font-weight:600; padding:10px 20px; border-radius:999px; text-decoration:none;">
                      ${supportLabel} &rarr;
                    </a>
                    <p class="irisi-muted" style="font-size:11px; color:#A1A1AA; margin:18px 0 0; line-height:1.5;">
                      ${footerNote}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Reusable high-contrast detail key/value panel (works identically in Light & Dark Mode)
 */
export function buildDetailPanel(rows: Array<{ label: string; value: string; highlight?: string }>): string {
  const trs = rows
    .filter((r) => r.value !== undefined && r.value !== '')
    .map(
      (r, idx) => `
      <tr>
        <td class="irisi-muted irisi-divider" style="padding:10px 0; ${idx < rows.length - 1 ? 'border-bottom:1px solid #EAE8E2;' : ''} color:#71717A; font-size:12px; width:42%; vertical-align:top;">
          ${r.label}
        </td>
        <td align="right" class="irisi-ink irisi-divider" style="padding:10px 0; ${idx < rows.length - 1 ? 'border-bottom:1px solid #EAE8E2;' : ''} color:${r.highlight || '#111114'}; font-size:13px; font-weight:600; vertical-align:top; word-break:break-word;">
          ${r.value}
        </td>
      </tr>`
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="irisi-panel" style="width:100%; background-color:#F7F6F3; border:1px solid #E7E5DF; border-radius:14px; margin:18px 0 22px;">
      <tr>
        <td style="padding:8px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
            ${trs}
          </table>
        </td>
      </tr>
    </table>`;
}
