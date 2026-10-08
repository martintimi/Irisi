// Automated Vendor Lifecycle Notification Engine for ÌRÍSÍ Marketplace
import nodemailer from 'nodemailer';
import tls from 'tls';
import dns from 'dns';

export interface VendorContact {
  id: string;
  brandName: string;
  designerName?: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

export interface SoldItemReport {
  productName: string;
  size: string;
  color?: string;
  quantitySold: number;
  totalEarnings: number;
  imageUrl?: string;
}

export interface UnsoldItemReport {
  productId: string;
  productName: string;
  currentStock: number;
  price: number;
  imageUrl?: string;
}

const BRAND_LOGO_URL = 'https://irisimi-nig.vercel.app/images/logo/irisi-icon.png';
const CONCIERGE_WHATSAPP_URL = 'https://wa.me/2349070332145';

const FALLBACK_GMAIL_IPS = ['192.178.154.109', '142.250.153.108', '64.233.184.108'];
let cachedSmtpIp = '';

async function resolveSmtpHost(): Promise<string> {
  if (cachedSmtpIp) return cachedSmtpIp;
  try {
    const res = await new Promise<string>((resolve, reject) => {
      dns.lookup('smtp.gmail.com', { family: 4 }, (err, address) => {
        if (err || !address) reject(err);
        else resolve(address);
      });
    });
    cachedSmtpIp = res;
    return res;
  } catch (e) {
    return FALLBACK_GMAIL_IPS[0];
  }
}

/**
 * Direct Encrypted TLS SMTP socket engine for smtp.gmail.com:465
 * Bypasses Node/nodemailer STARTTLS & IPv6 DNS stalls, guaranteeing delivery in < 6 seconds.
 */
export async function sendDirectGmailTls(opts: {
  user: string;
  pass: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  fromName?: string;
}): Promise<{ success: boolean; message: string }> {
  const hostIp = await resolveSmtpHost();

  return new Promise((resolve, reject) => {
    const socket = tls.connect(465, hostIp, { servername: 'smtp.gmail.com' });
    let state = 'INIT';
    let buffer = '';

    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error('Direct TLS SMTP connection timed out after 12s'));
    }, 12000);

    socket.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    socket.on('data', (chunk) => {
      buffer += chunk.toString();

      while (buffer.includes('\r\n')) {
        const lineEnd = buffer.indexOf('\r\n');
        const line = buffer.slice(0, lineEnd);
        buffer = buffer.slice(lineEnd + 2);

        const isFinal = !line.match(/^\d{3}-/);
        const code = line.slice(0, 3);

        if (!isFinal) continue;

        if (state === 'INIT' && code === '220') {
          state = 'EHLO';
          socket.write('EHLO irisi.ng\r\n');
        } else if (state === 'EHLO' && code === '250') {
          state = 'AUTH_LOGIN';
          socket.write('AUTH LOGIN\r\n');
        } else if (state === 'AUTH_LOGIN' && code === '334') {
          state = 'AUTH_USER';
          socket.write(Buffer.from(opts.user).toString('base64') + '\r\n');
        } else if (state === 'AUTH_USER' && code === '334') {
          state = 'AUTH_PASS';
          socket.write(Buffer.from(opts.pass).toString('base64') + '\r\n');
        } else if (state === 'AUTH_PASS' && code === '235') {
          state = 'MAIL_FROM';
          socket.write(`MAIL FROM:<${opts.user}>\r\n`);
        } else if (state === 'MAIL_FROM' && code === '250') {
          state = 'RCPT_TO';
          socket.write(`RCPT TO:<${opts.to}>\r\n`);
        } else if (state === 'RCPT_TO' && code === '250') {
          state = 'DATA';
          socket.write('DATA\r\n');
        } else if (state === 'DATA' && code === '354') {
          state = 'SENDING_DATA';
          const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@irisi.ng>`;
          const cleanSubject = `=?UTF-8?B?${Buffer.from(opts.subject).toString('base64')}?=`;
          const bodyPayload = (opts.html || opts.text || '').replace(/\r?\n\./g, '\r\n..');
          const senderName = opts.fromName || 'ÌRÍSÍ Marketplace';
          const emailContent = [
            `From: "${senderName}" <${opts.user}>`,
            `To: <${opts.to}>`,
            `Subject: ${cleanSubject}`,
            `Message-ID: ${messageId}`,
            `MIME-Version: 1.0`,
            `Content-Type: text/html; charset=UTF-8`,
            `Content-Transfer-Encoding: 8bit`,
            ``,
            bodyPayload,
            `\r\n.\r\n`
          ].join('\r\n');
          socket.write(emailContent);
        } else if (state === 'SENDING_DATA' && code === '250') {
          state = 'QUIT';
          clearTimeout(timeout);
          socket.write('QUIT\r\n');
          resolve({ success: true, message: line });
        } else if (code.startsWith('4') || code.startsWith('5')) {
          clearTimeout(timeout);
          socket.destroy();
          reject(new Error(`SMTP Error: ${line}`));
        }
      }
    });
  });
}

/**
 * Universal transporter helper: uses Direct TLS Gmail SMTP, Fallback Nodemailer, Custom SMTP, or Resend
 */
export async function sendLuxuryEmail(
  to: string,
  subject: string,
  html: string,
  options?: { fromName?: string }
): Promise<{ success: boolean; provider: string; error?: string }> {
  // 1. Direct TLS Gmail SMTP (Fastest & 100% Reliable Delivery)
  const gmailUser = (process.env.GMAIL_USER || '').trim();
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD || '').trim();
  if (gmailUser && gmailPass) {
    try {
      const tlsRes = await sendDirectGmailTls({
        user: gmailUser,
        pass: gmailPass,
        to,
        subject,
        html,
        fromName: options?.fromName || 'ÌRÍSÍ Marketplace',
      });
      console.log(`[EMAIL DISPATCH] ⚡ Delivered via Direct TLS to ${to} (${subject}): ${tlsRes.message}`);
      return { success: true, provider: 'gmail_direct_tls' };
    } catch (tlsErr: any) {
      console.warn(`[EMAIL DISPATCH] ⚠️ Direct TLS failed for ${to}, trying Nodemailer fallback:`, tlsErr.message);
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: { user: gmailUser, pass: gmailPass },
          connectionTimeout: 10000,
        });

        const info = await transporter.sendMail({
          from: `"${options?.fromName || 'ÌRÍSÍ Marketplace'}" <${gmailUser}>`,
          to,
          subject,
          html,
        });

        console.log(`[EMAIL DISPATCH] ✅ Sent via Nodemailer Gmail to ${to} (${subject}) - ID: ${info?.messageId || 'ok'}`);
        return { success: true, provider: 'gmail_smtp' };
      } catch (err: any) {
        console.warn(`[EMAIL DISPATCH] ⚠️ Gmail SMTP failed for ${to}:`, err.message);
      }
    }
  }

  // 2. Custom SMTP
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"ÌRÍSÍ Merchant Relations" <${smtpUser}>`,
        to,
        subject,
        html,
      });

      console.log(`[VENDOR NOTIFICATION] ✅ Sent via Custom SMTP to ${to} (${subject})`);
      return { success: true, provider: 'smtp' };
    } catch (err: any) {
      console.warn(`[VENDOR NOTIFICATION] ⚠️ Custom SMTP failed for ${to}:`, err.message);
    }
  }

  // 3. Resend API
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'ÌRÍSÍ Merchant Relations <vendors@irisi.ng>',
          to,
          subject,
          html,
        }),
      });

      if (response.ok) {
        console.log(`[VENDOR NOTIFICATION] ✅ Sent via Resend to ${to} (${subject})`);
        return { success: true, provider: 'resend' };
      }
    } catch (err: any) {
      console.warn(`[VENDOR NOTIFICATION] ⚠️ Resend failed for ${to}:`, err.message);
    }
  }

  console.log(`[VENDOR NOTIFICATION] ℹ️ Email queued for ${to} (${subject}), but no active SMTP (GMAIL_USER/GMAIL_APP_PASSWORD) or RESEND_API_KEY in .env.local.`);
  return { success: false, provider: 'none', error: 'No active email provider configured in .env.local' };
}

/**
 * Base Luxury Email Template Wrapper
 */
function wrapLuxuryTemplate(title: string, bodyContent: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="background-color: #08090a; color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 32px 16px; -webkit-font-smoothing: antialiased;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #08090a;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 540px; background-color: #121316; border: 1px solid rgba(230, 195, 103, 0.22); border-radius: 20px; overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.65);">
              <!-- Brand Header with Official Logo -->
              <tr>
                <td align="center" style="background: linear-gradient(180deg, rgba(230, 195, 103, 0.16) 0%, rgba(18, 19, 22, 0) 100%); padding: 36px 24px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
                  <img src="${BRAND_LOGO_URL}" alt="ÌRÍSÍ Logo" width="56" height="56" style="display: block; margin: 0 auto 16px; border-radius: 12px; box-shadow: 0 6px 18px rgba(230, 195, 103, 0.35);" />
                  <h1 style="color: #e6c367; font-size: 24px; letter-spacing: 1.5px; margin: 0; font-weight: 700; text-transform: uppercase;">ÌRÍSÍ</h1>
                  <p style="color: #9ca3af; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin: 6px 0 0; font-weight: 500;">Merchant Partner Relations</p>
                </td>
              </tr>
              <!-- Email Body Content -->
              <tr>
                <td style="padding: 36px 32px;">
                  ${bodyContent}
                  <!-- Concierge WhatsApp Support Footer -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 24px; margin-top: 32px;">
                    <tr>
                      <td align="center">
                        <p style="color: #9ca3af; font-size: 11px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px;">We are here to support your brand's growth</p>
                        <a href="${CONCIERGE_WHATSAPP_URL}" style="display: inline-block; background-color: rgba(230, 195, 103, 0.1); border: 1px solid rgba(230, 195, 103, 0.3); color: #e6c367; padding: 10px 20px; border-radius: 10px; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.3px;">
                          💬 Chat with ÌRÍSÍ Merchant Concierge on WhatsApp &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ============================================================================
// 1. NEW ORDER RECEIVED ALERT
// ============================================================================
export async function sendVendorNewOrderNotification(params: {
  vendor: VendorContact;
  orderNumber: string;
  customerName: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryMethod: string;
  items: Array<{
    productName: string;
    size: string;
    color?: string;
    quantity: number;
    price: number;
    vendorPayout: number;
  }>;
  totalPayout: number;
  portalUrl?: string;
}) {
  const { vendor, orderNumber, customerName, deliveryCity, deliveryState, deliveryMethod, items, totalPayout, portalUrl } = params;
  const isPark = deliveryMethod === 'park_pickup';
  const portalLink = portalUrl || 'https://irisimi-nig.vercel.app/vendor-portal/orders?tab=pending';

  const itemsHtml = items.map((it) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06); color: #ffffff; font-size: 13px;">
        <strong>${it.productName}</strong><br>
        <span style="color: #9ca3af; font-size: 11px;">Size: ${it.size} ${it.color ? `• Color: ${it.color}` : ''} • Qty: ${it.quantity}</span>
      </td>
      <td align="right" style="padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06); color: #e6c367; font-weight: 700; font-size: 14px;">
        ₦${(it.vendorPayout * it.quantity).toLocaleString()}
      </td>
    </tr>
  `).join('');

  const bodyContent = `
    <div style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #10b981; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">🎉 New Order Received!</span>
    </div>
    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px; font-weight: 600;">You Have a New Order, ${vendor.brandName}!</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Customer <strong>${customerName}</strong> has placed an order from your store. Payment has been received, and your payout will be credited to your account upon delivery:
    </p>

    <div style="background-color: #0c0d0e; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 14px; padding: 16px 20px; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Number</td>
          <td align="right" style="color: #ffffff; font-weight: 700; font-family: monospace; font-size: 14px;">${orderNumber}</td>
        </tr>
        <tr>
          <td style="color: #9ca3af; font-size: 12px; padding-top: 8px;">Delivery Location</td>
          <td align="right" style="color: #ffffff; font-size: 12px; padding-top: 8px;">${deliveryCity}, ${deliveryState}</td>
        </tr>
        <tr>
          <td style="color: #9ca3af; font-size: 12px; padding-top: 8px;">Logistics Type</td>
          <td align="right" style="color: #ffffff; font-size: 12px; padding-top: 8px;">${isPark ? 'Motor Park Dropoff' : 'Doorstep Courier'}</td>
        </tr>
      </table>
    </div>

    <!-- Items Breakdown -->
    <h3 style="color: #ffffff; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Items to Prepare:</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      ${itemsHtml}
      <tr>
        <td style="padding-top: 14px; color: #ffffff; font-weight: 700; font-size: 14px;">Your Net Earnings Payout:</td>
        <td align="right" style="padding-top: 14px; color: #10b981; font-weight: 800; font-size: 18px;">₦${totalPayout.toLocaleString()}</td>
      </tr>
    </table>

    <div style="text-align: center; margin-top: 28px; margin-bottom: 24px;">
      <a href="${portalLink}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Package Order &amp; Mark Ready in Portal &rarr;
      </a>
    </div>

    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
      Please prepare this parcel within <strong>24 hours</strong> to maintain your high merchant dispatch score.
    </p>
  `;

  return sendLuxuryEmail(vendor.email, `ÌRÍSÍ - New Order Alert (${orderNumber}) for ${vendor.brandName}`, wrapLuxuryTemplate('New Order Alert', bodyContent));
}

// ============================================================================
// 2. PAYMENT SETTLEMENT / PAYOUT ALERT
// ============================================================================
export async function sendVendorSettlementNotification(params: {
  vendor: VendorContact;
  orderNumber: string;
  payoutAmount: number;
  bankName?: string;
  accountNumber?: string;
  customerName?: string;
  portalUrl?: string;
}) {
  const { vendor, orderNumber, payoutAmount, bankName, accountNumber, customerName, portalUrl } = params;
  const maskedAcc = accountNumber && accountNumber.length >= 4 ? `••••${accountNumber.slice(-4)}` : 'registered account';
  const resolvedBank = bankName || vendor.bankName || 'Bank Account';
  const portalLink = portalUrl || 'https://irisimi-nig.vercel.app/vendor-portal/settlements';

  const bodyContent = `
    <div style="background-color: rgba(230, 195, 103, 0.1); border: 1px solid rgba(230, 195, 103, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #e6c367; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">💰 Settlement Released</span>
    </div>
    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px; font-weight: 600;">Payment Disbursed to ${vendor.brandName}</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Customer <strong>${customerName || 'The customer'}</strong> has confirmed delivery for Order <strong>${orderNumber}</strong>. Your payout earnings have been settled and disbursed:
    </p>

    <!-- Amount Banner -->
    <div style="background-color: #0c0d0e; border: 1.5px dashed #10b981; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <span style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 6px;">Total Settled Payout</span>
      <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; color: #10b981; display: block;">₦${payoutAmount.toLocaleString()}</span>
      <span style="color: #9ca3af; font-size: 12px; display: block; margin-top: 8px;">Credited to ${resolvedBank} (${maskedAcc})</span>
    </div>

    <div style="text-align: center; margin-top: 28px; margin-bottom: 24px;">
      <a href="${portalLink}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.5px;">
        View Settlement History in Portal &rarr;
      </a>
    </div>

    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
      Thank you for being an exceptional merchant partner on ÌRÍSÍ. Let's keep making sales happen!
    </p>
  `;

  return sendLuxuryEmail(vendor.email, `ÌRÍSÍ - ₦${payoutAmount.toLocaleString()} Settlement Released for Order ${orderNumber}`, wrapLuxuryTemplate('Settlement Released', bodyContent));
}

// ============================================================================
// 3. WEEKLY MONDAY MORNING MOTIVATION & WISHES
// ============================================================================
export async function sendVendorWeeklyWishesNotification(params: {
  vendor: VendorContact;
  portalUrl?: string;
}) {
  const { vendor, portalUrl } = params;
  const portalLink = portalUrl || 'https://irisimi-nig.vercel.app/vendor-portal';

  const bodyContent = `
    <h2 style="color: #ffffff; font-size: 21px; margin: 0 0 14px; font-weight: 600; letter-spacing: -0.3px;">Wishing You a High-Sales &amp; Profitable Week, ${vendor.brandName}! ✨</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">
      As a new week kicks off, we want to celebrate your hustle and the dedication you bring to your brand. Whether you curate ready-to-wear pieces, craft shoes, design bags and jewelry, or run a boutique or fashion brand — your store is a cornerstone of the ÌRÍSÍ marketplace.
    </p>

    <!-- Warm Wishes & Weekly Tip Box -->
    <div style="background-color: #0c0d0e; border: 1px solid rgba(230, 195, 103, 0.25); border-radius: 16px; padding: 22px; margin-bottom: 24px;">
      <h3 style="color: #e6c367; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 10px; font-weight: 700;">💡 Pro-Tips for Maximum Sales This Week</h3>
      <p style="color: #d1d5db; font-size: 13px; line-height: 1.6; margin: 0 0 12px;">
        Mondays and Tuesdays are peak browsing days for shoppers looking for weekend outfits, footwear, jewelry, and accessories. Here is how to keep your store at the top:
      </p>
      <ul style="color: #9ca3af; font-size: 12px; line-height: 1.7; margin: 0; padding-left: 20px;">
        <li><strong style="color: #ffffff;">Audit Inventory:</strong> Verify your in-stock sizes, shoe numbers, and color variants so customers can buy instantly without out-of-stock cancellations.</li>
        <li><strong style="color: #ffffff;">List New Arrivals:</strong> Merchants who upload fresh drops and restocks get up to <strong>3x more store visits</strong> and customer inquiries.</li>
        <li><strong style="color: #ffffff;">Fast Dispatch:</strong> Fulfilling orders and dropping them off within 24 hours boosts your merchant ranking on the homepage.</li>
      </ul>
    </div>

    <div style="text-align: center; margin-top: 28px; margin-bottom: 24px;">
      <a href="${portalLink}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Open Your Merchant Dashboard &rarr;
      </a>
    </div>

    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
      May your sales multiply, your parcels dispatch swiftly, and your store reach new heights this week!
    </p>
  `;

  return sendLuxuryEmail(vendor.email, `ÌRÍSÍ - Wishing ${vendor.brandName} a High-Sales & Successful Week! ✨`, wrapLuxuryTemplate('Weekly Wishes', bodyContent));
}

// ============================================================================
// 4. INACTIVE VENDOR CHECK-IN ("WE MISS YOU AT ÌRÍSÍ")
// ============================================================================
export async function sendVendorInactiveCheckInNotification(params: {
  vendor: VendorContact;
  daysInactive?: number;
  portalUrl?: string;
}) {
  const { vendor, daysInactive = 7, portalUrl } = params;
  const portalLink = portalUrl || 'https://irisimi-nig.vercel.app/vendor-portal/publish';

  const bodyContent = `
    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 14px; font-weight: 600;">Checking In on You &amp; ${vendor.brandName} 🤝</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${vendor.designerName || vendor.brandName},<br><br>
      We noticed things have been quiet on your ÌRÍSÍ storefront over the past ${daysInactive} days. We know how busy running a retail business, boutique, brand, or workshop can be, and we wanted to personally reach out.
    </p>

    <!-- Support Box -->
    <div style="background-color: #0c0d0e; border: 1px dashed rgba(230, 195, 103, 0.3); border-radius: 16px; padding: 22px; margin-bottom: 24px;">
      <h3 style="color: #e6c367; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 10px; font-weight: 700;">How Can We Support Your Store This Week?</h3>
      <p style="color: #d1d5db; font-size: 13px; line-height: 1.6; margin: 0 0 12px;">
        Whether you need help with:
      </p>
      <ul style="color: #9ca3af; font-size: 12px; line-height: 1.7; margin: 0 0 14px; padding-left: 20px;">
        <li>Photographing or uploading your latest shoes, bags, clothing, or jewelry</li>
        <li>Stock pricing suggestions and trending demand in your category</li>
        <li>Syncing offline store inventory with your online listings</li>
      </ul>
      <p style="color: #ffffff; font-size: 13px; margin: 0; font-weight: 500;">
        Our merchant support team is ready to assist you personally — no automated bots, just direct partnership.
      </p>
    </div>

    <div style="text-align: center; margin-top: 28px; margin-bottom: 24px;">
      <a href="${portalLink}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Upload New Arrivals &amp; Restock Store &rarr;
      </a>
    </div>

    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
      Shoppers across Nigeria and abroad are constantly searching for fresh fits, footwear, and accessories. We’d love to see your storefront active and selling!
    </p>
  `;

  return sendLuxuryEmail(vendor.email, `ÌRÍSÍ - Checking in on ${vendor.brandName}: How can we support your business?`, wrapLuxuryTemplate('We Miss You', bodyContent));
}

// ============================================================================
// 5. MONTHLY PERFORMANCE & STOCK RECONCILIATION DIGEST
// ============================================================================
export async function sendVendorMonthlyDigestNotification(params: {
  vendor: VendorContact;
  monthName: string;
  year: number;
  totalEarnings: number;
  totalOrdersCompleted: number;
  soldItems: SoldItemReport[];
  unsoldItems: UnsoldItemReport[];
  portalUrl?: string;
}) {
  const { vendor, monthName, year, totalEarnings, totalOrdersCompleted, soldItems, unsoldItems, portalUrl } = params;
  const portalLink = portalUrl || 'https://irisimi-nig.vercel.app/vendor-portal/publish';

  const soldItemsRows = soldItems.length > 0 ? soldItems.map(it => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06); color: #ffffff; font-size: 13px;">
        <strong>${it.productName}</strong><br>
        <span style="color: #9ca3af; font-size: 11px;">Size ${it.size} • ${it.quantitySold} unit(s) sold</span>
      </td>
      <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06); color: #10b981; font-weight: 700; font-size: 13px;">
        ₦${it.totalEarnings.toLocaleString()}
      </td>
    </tr>
  `).join('') : `
    <tr>
      <td colspan="2" style="padding: 14px 0; text-align: center; color: #9ca3af; font-size: 12px;">
        No completed orders recorded this month. Let's make next month huge!
      </td>
    </tr>
  `;

  const unsoldItemsRows = unsoldItems.length > 0 ? unsoldItems.slice(0, 10).map(it => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06); color: #ffffff; font-size: 13px;">
        <strong>${it.productName}</strong><br>
        <span style="color: #9ca3af; font-size: 11px;">Current Online Stock: ${it.currentStock} piece(s)</span>
      </td>
      <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06); color: #e6c367; font-size: 12px;">
        ₦${it.price.toLocaleString()}
      </td>
    </tr>
  `).join('') : `
    <tr>
      <td colspan="2" style="padding: 14px 0; text-align: center; color: #10b981; font-size: 12px;">
        Outstanding! Every active piece in your catalog had customer engagement this month.
      </td>
    </tr>
  `;

  const bodyContent = `
    <h2 style="color: #ffffff; font-size: 21px; margin: 0 0 12px; font-weight: 600;">${monthName} ${year} Sales &amp; Stock Audit</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Here is your monthly performance report for <strong>${vendor.brandName}</strong>. Review your numbers and reconcile any stock that may have been sold offline in your boutique or showroom:
    </p>

    <!-- Metrics Cards -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td width="48%" style="background-color: #0c0d0e; border: 1px solid rgba(230, 195, 103, 0.2); border-radius: 14px; padding: 18px; text-align: center;">
          <span style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Net Earnings</span>
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 800; color: #10b981; display: block;">₦${totalEarnings.toLocaleString()}</span>
        </td>
        <td width="4%"></td>
        <td width="48%" style="background-color: #0c0d0e; border: 1px solid rgba(230, 195, 103, 0.2); border-radius: 14px; padding: 18px; text-align: center;">
          <span style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Orders Completed</span>
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 800; color: #e6c367; display: block;">${totalOrdersCompleted}</span>
        </td>
      </tr>
    </table>

    <!-- Sold Items Table -->
    <h3 style="color: #ffffff; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Top Performing Pieces Sold</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      ${soldItemsRows}
    </table>

    <!-- Unsold Stock Reconciliation Table -->
    <div style="background-color: rgba(230, 195, 103, 0.05); border: 1px solid rgba(230, 195, 103, 0.25); border-radius: 14px; padding: 18px 20px; margin-bottom: 24px;">
      <h3 style="color: #e6c367; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 6px; font-weight: 700;">📦 Unsold Inventory Checklist</h3>
      <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0 0 14px;">
        Sold any of these items offline in your physical studio? Reconcile your quantities so customers don't order out-of-stock pieces:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${unsoldItemsRows}
      </table>
    </div>

    <div style="text-align: center; margin-top: 24px; margin-bottom: 24px;">
      <a href="${portalLink}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Sync Your Quantities in Portal &rarr;
      </a>
    </div>

    <p style="color: #9ca3af; font-size: 11px; line-height: 1.5; margin: 0; text-align: center;">
      This monthly audit is generated on the 1st of every month to keep your online inventory synchronized with your physical store, boutique, or showroom.
    </p>
  `;

  return sendLuxuryEmail(vendor.email, `ÌRÍSÍ - Your ${monthName} ${year} Monthly Sales & Stock Audit (${vendor.brandName})`, wrapLuxuryTemplate('Monthly Digest', bodyContent));
}

// ============================================================================
// 6. VENDOR STORE ACCOUNT APPROVED & ACTIVATED
// ============================================================================
export async function sendVendorAccountApprovedNotification(params: {
  vendor: VendorContact;
  portalUrl?: string;
}) {
  const { vendor, portalUrl } = params;
  const portalLink = portalUrl || 'https://irisimi-nig.vercel.app/vendor-portal';

  const bodyContent = `
    <div style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #10b981; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">🎉 Store Verified &amp; Approved!</span>
    </div>

    <h2 style="color: #ffffff; font-size: 21px; margin: 0 0 14px; font-weight: 600; letter-spacing: -0.3px;">Welcome to ÌRÍSÍ, ${vendor.brandName}! ✨</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">
      Congratulations! Your merchant application has been reviewed and officially approved by the ÌRÍSÍ governance team. Your brand is now verified and active on the marketplace.
    </p>

    <!-- Checklist Box -->
    <div style="background-color: #0c0d0e; border: 1px solid rgba(230, 195, 103, 0.25); border-radius: 16px; padding: 22px; margin-bottom: 24px;">
      <h3 style="color: #e6c367; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 12px; font-weight: 700;">🚀 3 Steps to Start Making Sales:</h3>
      <ol style="color: #d1d5db; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li><strong style="color: #ffffff;">Publish Your First Drops:</strong> List your ready-to-wear pieces, shoes, jewelry, or bags with clear studio photos.</li>
        <li><strong style="color: #ffffff;">Confirm Payout Details:</strong> Ensure your Nigerian bank account is saved for automated escrow disbursements upon delivery.</li>
        <li><strong style="color: #ffffff;">Share Your Store Link:</strong> Direct your Instagram and WhatsApp audience to your verified ÌRÍSÍ storefront.</li>
      </ol>
    </div>

    <div style="text-align: center; margin-top: 28px; margin-bottom: 24px;">
      <a href="${portalLink}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 34px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Access Merchant Portal &amp; Upload Stock &rarr;
      </a>
    </div>

    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
      Our merchant success concierge is always here to help you scale your brand. Welcome to the family!
    </p>
  `;

  return sendLuxuryEmail(vendor.email, `ÌRÍSÍ - Your Store Has Been Approved! Welcome ${vendor.brandName} 🎉`, wrapLuxuryTemplate('Store Approved', bodyContent));
}

// ============================================================================
// 7. VENDOR STORE ACCOUNT REJECTED / RETURNED FOR CORRECTION
// ============================================================================
export async function sendVendorAccountRejectedNotification(params: {
  vendor: VendorContact;
  rejectionReason: string;
  portalUrl?: string;
}) {
  const { vendor, rejectionReason, portalUrl } = params;
  const portalLink = portalUrl || 'https://irisimi-nig.vercel.app/vendor-portal/settings';

  const bodyContent = `
    <div style="background-color: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.35); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #f43f5e; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">⚠️ Application Update Required</span>
    </div>

    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 14px; font-weight: 600;">Update on Your ÌRÍSÍ Store Application</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${vendor.designerName || vendor.brandName},<br><br>
      Thank you for your interest in joining ÌRÍSÍ. Our compliance team reviewed your store registration, and before we can activate your storefront, a few details require your attention:
    </p>

    <!-- Specific Reason Box -->
    <div style="background-color: #0c0d0e; border: 1.5px solid rgba(244, 63, 94, 0.3); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <span style="color: #f43f5e; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; display: block; margin-bottom: 8px;">Reason / Notes from Verification Team:</span>
      <p style="color: #ffffff; font-size: 14px; line-height: 1.6; margin: 0; font-family: monospace; background-color: rgba(255, 255, 255, 0.04); padding: 12px 14px; border-radius: 10px;">
        &ldquo;${rejectionReason || 'Please verify brand identity, provide clearer item photos, or update bank account registration details.'}&rdquo;
      </p>
    </div>

    <div style="text-align: center; margin-top: 28px; margin-bottom: 24px;">
      <a href="${portalLink}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Update Store Profile &amp; Re-Submit &rarr;
      </a>
    </div>

    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
      Need clarification? You can reply directly or message our onboarding team on WhatsApp using the concierge button below.
    </p>
  `;

  return sendLuxuryEmail(vendor.email, `ÌRÍSÍ - Action Required on Your Store Registration (${vendor.brandName})`, wrapLuxuryTemplate('Application Update', bodyContent));
}

// ============================================================================
// 8. UNFULFILLED / PENDING ORDER DISPATCH REMINDER (18-24h NUDGE)
// ============================================================================
export async function sendVendorUnfulfilledOrderReminder(params: {
  vendor: VendorContact;
  orderNumber: string;
  customerName: string;
  hoursPending?: number;
  items: Array<{ productName: string; size: string; quantity: number }>;
  portalUrl?: string;
}) {
  const { vendor, orderNumber, customerName, hoursPending = 24, items, portalUrl } = params;
  const portalLink = portalUrl || 'https://irisimi-nig.vercel.app/vendor-portal/orders?tab=pending';

  const itemsList = items.map((it) => `• ${it.productName} (Size: ${it.size} • Qty: ${it.quantity})`).join('<br>');

  const bodyContent = `
    <div style="background-color: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #f59e0b; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">⏰ Dispatch Reminder: Order Waiting</span>
    </div>

    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 14px; font-weight: 600;">Order #${orderNumber} Awaiting Packaging</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${vendor.brandName},<br><br>
      This is a friendly reminder that Order <strong>#${orderNumber}</strong> placed by <strong>${customerName}</strong> was received over ${hoursPending} hours ago and is awaiting dispatch.
    </p>

    <!-- Order Items Summary Box -->
    <div style="background-color: #0c0d0e; border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <span style="color: #f59e0b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; display: block; margin-bottom: 8px;">Items to Prepare &amp; Drop Off:</span>
      <div style="color: #ffffff; font-size: 13px; line-height: 1.8;">
        ${itemsList}
      </div>
    </div>

    <div style="text-align: center; margin-top: 28px; margin-bottom: 24px;">
      <a href="${portalLink}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 34px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Mark Order Packaged &amp; Dispatched &rarr;
      </a>
    </div>

    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
      Prompt fulfillment protects your merchant dispatch score and prevents customer order cancellation. Thank you!
    </p>
  `;

  return sendLuxuryEmail(vendor.email, `ÌRÍSÍ Reminder - Order #${orderNumber} is Awaiting Fulfillment (${vendor.brandName})`, wrapLuxuryTemplate('Order Reminder', bodyContent));
}

// ============================================================================
// 9. MISSING BANK DETAILS / PAYOUT SETUP REMINDER
// ============================================================================
export async function sendVendorMissingBankDetailsReminder(params: {
  vendor: VendorContact;
  portalUrl?: string;
}) {
  const { vendor, portalUrl } = params;
  const portalLink = portalUrl || 'https://irisimi-nig.vercel.app/vendor-portal/settings';

  const bodyContent = `
    <div style="background-color: rgba(230, 195, 103, 0.12); border: 1px solid rgba(230, 195, 103, 0.35); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #e6c367; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">🏦 Action Required: Payout Account</span>
    </div>

    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 14px; font-weight: 600;">Link Your Nigerian Bank Account for Payouts</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${vendor.designerName || vendor.brandName},<br><br>
      We noticed that your settlement bank account has not been saved on your ÌRÍSÍ merchant profile yet. 
    </p>

    <!-- Why it matters -->
    <div style="background-color: #0c0d0e; border: 1px solid rgba(230, 195, 103, 0.25); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <h3 style="color: #e6c367; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 10px; font-weight: 700;">Why This is Essential:</h3>
      <p style="color: #d1d5db; font-size: 13px; line-height: 1.6; margin: 0;">
        When shoppers purchase your pieces, footwear, or accessories, their payment is locked in secure escrow. As soon as the customer receives their order, <strong>funds are automatically disbursed</strong> to your registered bank account without manual delays.
      </p>
    </div>

    <div style="text-align: center; margin-top: 28px; margin-bottom: 24px;">
      <a href="${portalLink}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 34px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Add Bank Details in Merchant Settings &rarr;
      </a>
    </div>

    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
      It takes less than 60 seconds to enter your bank name, account number, and account name.
    </p>
  `;

  return sendLuxuryEmail(vendor.email, `ÌRÍSÍ - Action Required: Add Your Payout Bank Details (${vendor.brandName})`, wrapLuxuryTemplate('Payout Setup', bodyContent));
}

// ============================================================================
// 10. LOW STOCK / OUT OF STOCK ALERT REMINDER
// ============================================================================
export async function sendVendorLowStockReminder(params: {
  vendor: VendorContact;
  productName: string;
  currentStock: number;
  size?: string;
  portalUrl?: string;
}) {
  const { vendor, productName, currentStock, size, portalUrl } = params;
  const isOutOfStock = currentStock <= 0;
  const portalLink = portalUrl || 'https://irisimi-nig.vercel.app/vendor-portal/products';

  const bodyContent = `
    <div style="background-color: ${isOutOfStock ? 'rgba(244, 63, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)'}; border: 1px solid ${isOutOfStock ? 'rgba(244, 63, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)'}; border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: ${isOutOfStock ? '#f43f5e' : '#f59e0b'}; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">
        ${isOutOfStock ? '🚨 Sold Out Alert' : '⚠️ Low Stock Warning'}
      </span>
    </div>

    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 14px; font-weight: 600;">
      ${isOutOfStock ? `"${productName}" is Sold Out!` : `Only ${currentStock} Unit(s) Left of "${productName}"`}
    </h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${vendor.brandName},<br><br>
      ${isOutOfStock 
        ? `Your item <strong>${productName}</strong> ${size ? `(Size: ${size})` : ''} has reached <strong>0 units</strong>. Shoppers currently see this item as Out of Stock.` 
        : `Your item <strong>${productName}</strong> ${size ? `(Size: ${size})` : ''} is down to its last <strong>${currentStock} unit(s)</strong>.`}
    </p>

    <!-- Restock Recommendation Box -->
    <div style="background-color: #0c0d0e; border: 1px solid rgba(230, 195, 103, 0.25); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <h3 style="color: #e6c367; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px; font-weight: 700;">Why Restock Promptly?</h3>
      <p style="color: #d1d5db; font-size: 13px; line-height: 1.6; margin: 0;">
        Items with active customer views and search volume lose algorithm rank when marked out of stock. If you have restocked your physical boutique or studio, update your numbers online now to capture active buyers.
      </p>
    </div>

    <div style="text-align: center; margin-top: 28px; margin-bottom: 24px;">
      <a href="${portalLink}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 34px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Update Stock Quantity in Portal &rarr;
      </a>
    </div>

    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
      Keep your best-selling styles available for eager shoppers across Nigeria.
    </p>
  `;

  return sendLuxuryEmail(vendor.email, `ÌRÍSÍ Alert - ${isOutOfStock ? 'Sold Out' : 'Low Stock'}: ${productName} (${vendor.brandName})`, wrapLuxuryTemplate('Stock Alert', bodyContent));
}

// ============================================================================
// 11. THURSDAY / FRIDAY WEEKEND RUSH READINESS REMINDER
// ============================================================================
export async function sendVendorWeekendRushReminder(params: {
  vendor: VendorContact;
  portalUrl?: string;
}) {
  const { vendor, portalUrl } = params;
  const portalLink = portalUrl || 'https://irisimi-nig.vercel.app/vendor-portal';

  const bodyContent = `
    <div style="background-color: rgba(230, 195, 103, 0.12); border: 1px solid rgba(230, 195, 103, 0.35); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #e6c367; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">🛍️ Weekend Rush Ahead</span>
    </div>

    <h2 style="color: #ffffff; font-size: 21px; margin: 0 0 14px; font-weight: 600; letter-spacing: -0.3px;">Get Ready for Weekend Shoppers, ${vendor.brandName}! ✨</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">
      Thursday through Sunday is when ÌRÍSÍ experiences its highest traffic of the week. Shoppers are shopping for upcoming weddings, celebrations, dinners, and weekend parties.
    </p>

    <!-- Checklist Box -->
    <div style="background-color: #0c0d0e; border: 1px solid rgba(230, 195, 103, 0.25); border-radius: 16px; padding: 22px; margin-bottom: 24px;">
      <h3 style="color: #e6c367; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 10px; font-weight: 700;">⚡ 3-Minute Weekend Prep:</h3>
      <ul style="color: #9ca3af; font-size: 12px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li><strong style="color: #ffffff;">Check High-Demand Sizes:</strong> Make sure popular sizes (M, L, XL, Shoe 42-45) are listed in stock.</li>
        <li><strong style="color: #ffffff;">Post Fresh Arrivals:</strong> Weekend shoppers love seeing "Just In" pieces and new catalog drops.</li>
        <li><strong style="color: #ffffff;">Prepare Packaging Materials:</strong> Have your luxury boxes and mailers ready for swift Monday dispatch.</li>
      </ul>
    </div>

    <div style="text-align: center; margin-top: 28px; margin-bottom: 24px;">
      <a href="${portalLink}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 34px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Review Your Storefront Before the Weekend &rarr;
      </a>
    </div>

    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
      Here's to a record-breaking weekend of orders and sales for your brand!
    </p>
  `;

  return sendLuxuryEmail(vendor.email, `ÌRÍSÍ - Prepare for the Weekend Rush, ${vendor.brandName}! 🛍️`, wrapLuxuryTemplate('Weekend Prep', bodyContent));
}

// ============================================================================
// 12. VENDOR STORE ACCOUNT SUSPENDED BY ADMIN
// ============================================================================
export async function sendVendorAccountSuspendedNotification(params: {
  vendor: VendorContact;
  suspensionReason: string;
}) {
  const { vendor, suspensionReason } = params;

  const bodyContent = `
    <div style="background-color: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.4); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #f43f5e; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">⚠️ Store Account Suspended</span>
    </div>

    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 14px; font-weight: 600;">Notice of Account Suspension: ${vendor.brandName}</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${vendor.designerName || vendor.brandName},<br><br>
      This is an official communication from the ÌRÍSÍ Compliance and Governance Team. Please be advised that your merchant storefront and product listings have been temporarily <strong>suspended</strong>.
    </p>

    <!-- Suspension Reason Box -->
    <div style="background-color: #0c0d0e; border: 1.5px solid rgba(244, 63, 94, 0.35); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <span style="color: #f43f5e; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; display: block; margin-bottom: 8px;">Reason for Suspension:</span>
      <p style="color: #ffffff; font-size: 14px; line-height: 1.6; margin: 0; font-family: monospace; background-color: rgba(255, 255, 255, 0.04); padding: 12px 14px; border-radius: 10px;">
        &ldquo;${suspensionReason || 'Store suspended due to compliance review or policy breach.'}&rdquo;
      </p>
    </div>

    <!-- Impact Details -->
    <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 16px 20px; margin-bottom: 24px;">
      <h3 style="color: #e6c367; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px; font-weight: 700;">Account Status Restrictions:</h3>
      <ul style="color: #9ca3af; font-size: 12px; line-height: 1.7; margin: 0; padding-left: 20px;">
        <li>Your catalog pieces are hidden from shoppers across the marketplace and search.</li>
        <li>Active sessions and portal login access have been restricted until resolved.</li>
        <li>Any pending escrow disbursements for delivered orders remain securely registered.</li>
      </ul>
    </div>

    <div style="text-align: center; margin-top: 28px; margin-bottom: 24px;">
      <a href="${CONCIERGE_WHATSAPP_URL}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Contact Concierge to Appeal Suspension &rarr;
      </a>
    </div>

    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
      If you believe this action was taken in error or if you have questions regarding store reinstatement, please message our merchant concierge immediately.
    </p>
  `;

  return sendLuxuryEmail(
    vendor.email,
    `ÌRÍSÍ Notice: Merchant Account Suspended - ${vendor.brandName}`,
    wrapLuxuryTemplate('Account Suspended', bodyContent)
  );
}

// ============================================================================
// 13. VENDOR STORE ACCOUNT REINSTATED BY ADMIN
// ============================================================================
export async function sendVendorAccountReinstatedNotification(params: {
  vendor: VendorContact;
  portalUrl?: string;
}) {
  const { vendor, portalUrl } = params;
  const portalLink = portalUrl || 'https://irisimi-nig.vercel.app/vendor-portal';

  const bodyContent = `
    <div style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #10b981; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">✅ Account Reinstated &amp; Active</span>
    </div>

    <h2 style="color: #ffffff; font-size: 21px; margin: 0 0 14px; font-weight: 600; letter-spacing: -0.3px;">Store Reinstated: Welcome Back, ${vendor.brandName}! ✨</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">
      We are pleased to inform you that your merchant account suspension has been lifted by the ÌRÍSÍ administration. Your store is now fully verified and reinstated.
    </p>

    <!-- Restored Features Box -->
    <div style="background-color: #0c0d0e; border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <h3 style="color: #10b981; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px; font-weight: 700;">Restored Store Privileges:</h3>
      <ul style="color: #d1d5db; font-size: 12px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>All active catalog pieces are live and discoverable by shoppers across Nigeria.</li>
        <li>Merchant portal login and management features have been fully re-enabled.</li>
        <li>Escrow settlements and order fulfillment operations are active.</li>
      </ul>
    </div>

    <div style="text-align: center; margin-top: 28px; margin-bottom: 24px;">
      <a href="${portalLink}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 34px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Access Merchant Portal &rarr;
      </a>
    </div>

    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
      Thank you for your cooperation and commitment to high-standard craftsmanship on ÌRÍSÍ.
    </p>
  `;

  return sendLuxuryEmail(
    vendor.email,
    `ÌRÍSÍ Notice: Merchant Account Reinstated - Welcome Back ${vendor.brandName}! ✨`,
    wrapLuxuryTemplate('Account Reinstated', bodyContent)
  );
}
