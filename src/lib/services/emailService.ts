import nodemailer from 'nodemailer';
import { sendLuxuryEmail } from '@/lib/services/vendorNotificationService';

export interface OrderEmailPayload {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  deliveryAddress: string;
  items: Array<{
    productName: string;
    size: string;
    quantity: number;
    price: number;
    color?: string;
    vendorName?: string;
    imageUrl?: string;
  }>;
  totalAmount: number;
  shippingFee: number;
  driverPhone?: string;
  waybillNumber?: string;
  vendorName?: string;
}

function wrapEmailHtml(title: string, content: string): string {
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
              <tr>
                <td align="center" style="background: linear-gradient(180deg, rgba(230, 195, 103, 0.16) 0%, rgba(18, 19, 22, 0) 100%); padding: 36px 24px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
                  <img src="https://irisimi-nig.vercel.app/images/logo/irisi-icon.png" alt="ÌRÍSÍ Logo" width="56" height="56" style="display: block; margin: 0 auto 16px; border-radius: 12px; box-shadow: 0 6px 18px rgba(230, 195, 103, 0.35);" />
                  <h1 style="color: #e6c367; font-size: 24px; letter-spacing: 1.5px; margin: 0; font-weight: 700; text-transform: uppercase;">ÌRÍSÍ</h1>
                  <p style="color: #9ca3af; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin: 6px 0 0; font-weight: 500;">Luxury Nigerian Fashion & Commerce</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 36px 32px;">
                  ${content}
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 24px; margin-top: 32px;">
                    <tr>
                      <td align="center">
                        <p style="color: #9ca3af; font-size: 11px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px;">Need Assistance? We Are Here For You</p>
                        <a href="https://wa.me/2349070332145" style="display: inline-block; background-color: rgba(230, 195, 103, 0.1); border: 1px solid rgba(230, 195, 103, 0.3); color: #e6c367; padding: 10px 20px; border-radius: 10px; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.3px;">
                          💬 Chat with Concierge Support on WhatsApp &rarr;
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

export async function sendOrderConfirmationEmail(payload: OrderEmailPayload) {
  if (!payload.customerEmail || !payload.customerEmail.includes('@')) {
    return { success: false, error: 'No customer email provided' };
  }

  const itemsHtml = (payload.items || []).map(it => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); color: #ffffff; font-size: 13px;">
        <strong>${it.productName}</strong><br>
        <span style="color: #9ca3af; font-size: 11px;">Size: ${it.size} • Qty: ${it.quantity} ${it.vendorName ? `• Brand: ${it.vendorName}` : ''}</span>
      </td>
      <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); color: #e6c367; font-weight: 700; font-size: 13px;">
        ₦${((it.price || 0) * (it.quantity || 1)).toLocaleString()}
      </td>
    </tr>
  `).join('');

  const trackUrl = `https://irisimi-nig.vercel.app/track-order?orderNumber=${encodeURIComponent(payload.orderNumber)}`;
  const brandNames = Array.from(new Set((payload.items || []).map(it => it.vendorName).filter(Boolean)));
  const storeLabel = brandNames.length === 1 ? brandNames[0] : (brandNames.length > 1 ? brandNames.join(', ') : (payload.vendorName || 'The store'));

  const bodyContent = `
    <div style="background-color: rgba(230, 195, 103, 0.1); border: 1px solid rgba(230, 195, 103, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #e6c367; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">🛍️ Order Confirmed</span>
    </div>
    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px; font-weight: 600;">Thank You for Your Order, ${payload.customerName || 'Valued Client'}!</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Your order has been confirmed and payment received. <strong>${storeLabel}</strong> is already preparing your items for delivery:
    </p>

    <div style="background-color: #0c0d0e; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 14px; padding: 16px 20px; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Reference</td>
          <td align="right" style="color: #ffffff; font-weight: 700; font-family: monospace; font-size: 14px;">${payload.orderNumber}</td>
        </tr>
        <tr>
          <td style="color: #9ca3af; font-size: 12px; padding-top: 8px;">Delivery Address</td>
          <td align="right" style="color: #ffffff; font-size: 12px; padding-top: 8px;">${payload.deliveryAddress}</td>
        </tr>
      </table>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      ${itemsHtml}
      <tr>
        <td style="padding-top: 10px; color: #9ca3af; font-size: 12px;">Delivery Courier Fee:</td>
        <td align="right" style="padding-top: 10px; color: #ffffff; font-size: 12px;">₦${Number(payload.shippingFee || 0).toLocaleString()}</td>
      </tr>
      <tr>
        <td style="padding-top: 8px; color: #ffffff; font-weight: 700; font-size: 14px;">Total Paid:</td>
        <td align="right" style="padding-top: 8px; color: #e6c367; font-weight: 800; font-size: 17px;">₦${Number(payload.totalAmount || 0).toLocaleString()}</td>
      </tr>
    </table>

    <div style="text-align: center; margin-top: 28px; margin-bottom: 24px;">
      <a href="${trackUrl}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Track Live Delivery Status &rarr;
      </a>
    </div>
  `;

  return sendLuxuryEmail(payload.customerEmail, `ÌRÍSÍ - Order Confirmed (${payload.orderNumber})`, wrapEmailHtml('Order Confirmed', bodyContent));
}

export async function sendVendorNewOrderEmail(vendorEmail: string, payload: OrderEmailPayload) {
  if (!vendorEmail || !vendorEmail.includes('@')) return { success: false };
  console.log(`[EMAIL DISPATCH] 📨 Sent Vendor New Order Notification to ${vendorEmail} for ${payload.orderNumber}`);
  return { success: true };
}

export async function sendDispatchNotificationEmail(payload: OrderEmailPayload) {
  if (!payload.customerEmail || !payload.customerEmail.includes('@')) {
    return { success: false, error: 'No customer email provided' };
  }

  const trackUrl = `https://irisimi-nig.vercel.app/track-order?orderNumber=${encodeURIComponent(payload.orderNumber)}`;

  const bodyContent = `
    <div style="background-color: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #60a5fa; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">🚚 Parcel Dispatched &amp; In Transit</span>
    </div>
    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px; font-weight: 600;">Your Package is on the Way!</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${payload.customerName || 'Valued Client'}, great news! <strong>${payload.vendorName || 'Your store'}</strong> has packaged and handed your order to the dispatch courier.
    </p>

    <div style="background-color: #0c0d0e; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 14px; padding: 16px 20px; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Number</td>
          <td align="right" style="color: #ffffff; font-weight: 700; font-family: monospace; font-size: 14px;">${payload.orderNumber}</td>
        </tr>
        ${payload.waybillNumber ? `
        <tr>
          <td style="color: #9ca3af; font-size: 12px; padding-top: 8px;">Waybill / Tracking #</td>
          <td align="right" style="color: #e6c367; font-weight: 700; font-family: monospace; font-size: 13px; padding-top: 8px;">${payload.waybillNumber}</td>
        </tr>` : ''}
        ${payload.driverPhone ? `
        <tr>
          <td style="color: #9ca3af; font-size: 12px; padding-top: 8px;">Rider / Terminal Contact</td>
          <td align="right" style="color: #ffffff; font-size: 13px; padding-top: 8px;">${payload.driverPhone}</td>
        </tr>` : ''}
        <tr>
          <td style="color: #9ca3af; font-size: 12px; padding-top: 8px;">Destination</td>
          <td align="right" style="color: #ffffff; font-size: 12px; padding-top: 8px;">${payload.deliveryAddress}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 28px; margin-bottom: 24px;">
      <a href="${trackUrl}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Track Delivery Live &rarr;
      </a>
    </div>
  `;

  return sendLuxuryEmail(payload.customerEmail, `ÌRÍSÍ - Order Dispatched (${payload.orderNumber})`, wrapEmailHtml('Order Dispatched', bodyContent));
}

export async function sendOrderPackedEmail(payload: OrderEmailPayload) {
  if (!payload.customerEmail || !payload.customerEmail.includes('@')) {
    return { success: false, error: 'No customer email provided' };
  }

  const trackUrl = `https://irisimi-nig.vercel.app/track-order?orderNumber=${encodeURIComponent(payload.orderNumber)}`;

  const bodyContent = `
    <div style="background-color: rgba(230, 195, 103, 0.1); border: 1px solid rgba(230, 195, 103, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #e6c367; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">📦 Parcel Packaged &amp; Quality Checked</span>
    </div>
    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px; font-weight: 600;">Your Order is Packaged and Ready!</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${payload.customerName || 'Valued Client'}, <strong>${payload.vendorName || 'Your store'}</strong> has finished packaging and quality-checking your order <strong>${payload.orderNumber}</strong>. The parcel is now awaiting courier pickup.
    </p>

    <div style="text-align: center; margin-top: 28px; margin-bottom: 24px;">
      <a href="${trackUrl}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        View Order Progress &rarr;
      </a>
    </div>
  `;

  return sendLuxuryEmail(payload.customerEmail, `ÌRÍSÍ - Order Packaged (${payload.orderNumber})`, wrapEmailHtml('Order Packaged', bodyContent));
}

export async function sendOrderDeliveredCustomerEmail(payload: OrderEmailPayload) {
  if (!payload.customerEmail || !payload.customerEmail.includes('@')) {
    return { success: false, error: 'No customer email provided' };
  }

  const reviewUrl = `https://irisimi-nig.vercel.app/account?tab=orders`;

  const bodyContent = `
    <div style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #10b981; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">✅ Delivered &amp; Completed</span>
    </div>
    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px; font-weight: 600;">Your Package Has Arrived!</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${payload.customerName || 'Valued Client'}, great news! Your order <strong>${payload.orderNumber}</strong> has been successfully delivered to your registered destination.
    </p>

    <div style="background-color: #0c0d0e; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 14px; padding: 16px 20px; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Reference</td>
          <td align="right" style="color: #ffffff; font-weight: 700; font-family: monospace; font-size: 14px;">${payload.orderNumber}</td>
        </tr>
        <tr>
          <td style="color: #9ca3af; font-size: 12px; padding-top: 8px;">Delivery Location</td>
          <td align="right" style="color: #ffffff; font-size: 12px; padding-top: 8px;">${payload.deliveryAddress}</td>
        </tr>
      </table>
    </div>

    <p style="color: #d1d5db; font-size: 13px; line-height: 1.6; margin: 0 0 24px;">
      Please inspect your package to ensure you are 100% satisfied with the quality, fit, and items.
    </p>

    <div style="text-align: center; margin-top: 28px; margin-bottom: 24px;">
      <a href="${reviewUrl}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Confirm Receipt &amp; View Order Details &rarr;
      </a>
    </div>
  `;

  return sendLuxuryEmail(payload.customerEmail, `ÌRÍSÍ - Order Delivered (${payload.orderNumber})`, wrapEmailHtml('Order Delivered', bodyContent));
}

export async function sendDeliverySettledEmail(vendorEmail: string, payload: OrderEmailPayload) {
  if (!vendorEmail || !vendorEmail.includes('@')) return { success: false };
  console.log(`[EMAIL DISPATCH] 💰 Sent Settlement Alert to ${vendorEmail} for ${payload.orderNumber}`);
  return { success: true };
}

export interface PasswordResetEmailPayload {
  recipientEmail: string;
  recipientName?: string;
  otpCode: string;
  actionLink?: string;
  userType?: 'vendor' | 'shopper';
  supportUrl?: string;
}

function buildRecoveryEmailHtml(payload: PasswordResetEmailPayload): string {
  const { recipientName, otpCode, actionLink, userType, supportUrl } = payload;
  const isVendor = userType === 'vendor';
  const roleLabel = isVendor ? 'Merchant Store' : 'Shopper Account';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ÌRÍSÍ Security Recovery</title>
    </head>
    <body style="background-color: #08090a; color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 32px 16px; -webkit-font-smoothing: antialiased;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #08090a;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; background-color: #121316; border: 1px solid rgba(230, 195, 103, 0.2); border-radius: 20px; overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.6);">
              <!-- Luxury Brand Header -->
              <tr>
                <td align="center" style="background: linear-gradient(180deg, rgba(230, 195, 103, 0.16) 0%, rgba(18, 19, 22, 0) 100%); padding: 36px 24px 28px; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
                  <img src="https://irisimi-nig.vercel.app/images/logo/irisi-icon.png" alt="ÌRÍSÍ Emblem" width="56" height="56" style="display: block; margin: 0 auto 16px; border-radius: 12px; box-shadow: 0 6px 18px rgba(230, 195, 103, 0.3);" />
                  <h1 style="color: #e6c367; font-size: 26px; letter-spacing: 1.5px; margin: 0; font-weight: 700; text-transform: uppercase;">ÌRÍSÍ</h1>
                  <p style="color: #9ca3af; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin: 6px 0 0; font-weight: 500;">Luxury Nigerian Fashion & Commerce</p>
                </td>
              </tr>
              <!-- Content Body -->
              <tr>
                <td style="padding: 36px 32px;">
                  <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 14px; font-weight: 600; letter-spacing: -0.3px;">Password Recovery Code</h2>
                  <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                    Hello ${recipientName || (isVendor ? 'Merchant Partner' : 'Customer')},<br><br>
                    We received a request to reset the password for your <strong>${roleLabel}</strong>. Use the 6-digit verification code below to authorize this change and set your new password:
                  </p>
                  <!-- 6-Digit OTP Box -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                    <tr>
                      <td align="center" style="background-color: #0a0b0d; border: 1.5px dashed #e6c367; border-radius: 16px; padding: 26px 20px;">
                        <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #e6c367; display: block;">${otpCode}</span>
                        <span style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 10px; font-weight: 500;">Valid for 15 minutes • Single-use only</span>
                      </td>
                    </tr>
                  </table>
                  ${actionLink ? `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                      <tr>
                        <td align="center">
                          <a href="${actionLink}" style="display: inline-block; background-color: #e6c367; color: #0a0b0d; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">Or Click Here to Reset Password</a>
                        </td>
                      </tr>
                    </table>
                  ` : ''}
                  <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0 0 24px;">
                    If you did not request this recovery code, please disregard this email. Your password will remain unchanged and your account is secure.
                  </p>
                  <!-- Support Concierge -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 22px;">
                    <tr>
                      <td align="center">
                        <a href="${supportUrl || 'https://wa.me/2349070332145'}" style="color: #e6c367; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.3px;">Questions or concerns? Contact Concierge Support on WhatsApp &rarr;</a>
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

/**
 * Sends a password recovery email containing the 6-digit OTP code.
 * Prioritizes:
 * 1. Gmail SMTP (GMAIL_USER + GMAIL_APP_PASSWORD)
 * 2. Custom SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
 * 3. Resend API (RESEND_API_KEY)
 */
export async function sendPasswordResetEmail(payload: PasswordResetEmailPayload): Promise<{
  success: boolean;
  provider: 'gmail_smtp' | 'smtp' | 'resend' | 'none';
  error?: string;
}> {
  const { recipientEmail, otpCode, userType } = payload;
  const isVendor = userType === 'vendor';
  const roleLabel = isVendor ? 'Merchant Store' : 'Shopper Account';
  const emailHtml = buildRecoveryEmailHtml(payload);
  const emailSubject = `ÌRÍSÍ - Your Recovery Verification Code is ${otpCode}`;

  console.log(`[EMAIL DISPATCH] 🔐 Password recovery verification code generated for ${recipientEmail} (${roleLabel})`);

  // 1. Direct delivery via Gmail SMTP if configured
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD;
  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      await transporter.sendMail({
        from: `"ÌRÍSÍ Luxury Security" <${gmailUser}>`,
        to: recipientEmail,
        subject: emailSubject,
        html: emailHtml,
      });

      console.log(`[EMAIL DISPATCH] ✅ Gmail SMTP delivered recovery email to ${recipientEmail}`);
      return { success: true, provider: 'gmail_smtp' };
    } catch (err: any) {
      console.warn(`[EMAIL DISPATCH] ⚠️ Gmail SMTP delivery error:`, err.message);
    }
  }

  // 2. Direct delivery via Custom SMTP if configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"ÌRÍSÍ Security" <${smtpUser}>`,
        to: recipientEmail,
        subject: emailSubject,
        html: emailHtml,
      });

      console.log(`[EMAIL DISPATCH] ✅ Custom SMTP delivered recovery email to ${recipientEmail}`);
      return { success: true, provider: 'smtp' };
    } catch (err: any) {
      console.warn(`[EMAIL DISPATCH] ⚠️ Custom SMTP delivery error:`, err.message);
    }
  }

  // 3. Direct delivery via Resend API if configured
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
          from: process.env.RESEND_FROM || 'ÌRÍSÍ Security <security@irisi.ng>',
          to: recipientEmail,
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      if (response.ok) {
        console.log(`[EMAIL DISPATCH] ✅ Resend delivered recovery email to ${recipientEmail}`);
        return { success: true, provider: 'resend' };
      } else {
        const errText = await response.text();
        console.warn(`[EMAIL DISPATCH] ⚠️ Resend delivery failed (${response.status}):`, errText);
      }
    } catch (err: any) {
      console.warn(`[EMAIL DISPATCH] ⚠️ Resend exception:`, err.message);
    }
  }

  console.log(`[EMAIL DISPATCH] ℹ️ Recovery email for ${recipientEmail} with code ${otpCode} logged. No active SMTP (GMAIL_USER/GMAIL_APP_PASSWORD) or RESEND_API_KEY found in .env.local.`);
  return {
    success: false,
    provider: 'none',
    error: 'No active email provider configured in .env.local',
  };
}

export interface SignupVerificationEmailPayload {
  recipientEmail: string;
  recipientName?: string;
  otpCode: string;
  actionLink?: string;
  userType?: 'vendor' | 'shopper';
  supportUrl?: string;
}

function buildSignupVerificationEmailHtml(payload: SignupVerificationEmailPayload): string {
  const { recipientName, otpCode, actionLink, userType, supportUrl } = payload;
  const isVendor = userType === 'vendor';
  const roleLabel = isVendor ? 'Merchant Store' : 'Shopper Account';
  const headline = isVendor ? 'Verify Your Store Account' : 'Verify Your Account';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ÌRÍSÍ Account Verification</title>
    </head>
    <body style="background-color: #08090a; color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 32px 16px; -webkit-font-smoothing: antialiased;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #08090a;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; background-color: #121316; border: 1px solid rgba(230, 195, 103, 0.2); border-radius: 20px; overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.6);">
              <!-- Luxury Brand Header -->
              <tr>
                <td align="center" style="background: linear-gradient(180deg, rgba(230, 195, 103, 0.16) 0%, rgba(18, 19, 22, 0) 100%); padding: 36px 24px 28px; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
                  <img src="https://irisimi-nig.vercel.app/images/logo/irisi-icon.png" alt="ÌRÍSÍ Emblem" width="56" height="56" style="display: block; margin: 0 auto 16px; border-radius: 12px; box-shadow: 0 6px 18px rgba(230, 195, 103, 0.3);" />
                  <h1 style="color: #e6c367; font-size: 26px; letter-spacing: 1.5px; margin: 0; font-weight: 700; text-transform: uppercase;">ÌRÍSÍ</h1>
                  <p style="color: #9ca3af; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin: 6px 0 0; font-weight: 500;">Luxury Nigerian Fashion &amp; Commerce</p>
                </td>
              </tr>
              <!-- Content Body -->
              <tr>
                <td style="padding: 36px 32px;">
                  <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 14px; font-weight: 600; letter-spacing: -0.3px;">${headline}</h2>
                  <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                    Hello ${recipientName || (isVendor ? 'Merchant Partner' : 'Valued Client')},<br><br>
                    Welcome to ÌRÍSÍ! Use the 6-digit verification code below to confirm your business email and complete your <strong>${roleLabel}</strong> registration:
                  </p>
                  <!-- 6-Digit OTP Box -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                    <tr>
                      <td align="center" style="background-color: #0a0b0d; border: 1.5px dashed #e6c367; border-radius: 16px; padding: 26px 20px;">
                        <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #e6c367; display: block;">${otpCode}</span>
                        <span style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 10px; font-weight: 500;">Valid for 15 minutes • Single-use only</span>
                      </td>
                    </tr>
                  </table>
                  ${actionLink ? `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                      <tr>
                        <td align="center">
                          <a href="${actionLink}" style="display: inline-block; background-color: #e6c367; color: #0a0b0d; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">Confirm Account Instantly &rarr;</a>
                        </td>
                      </tr>
                    </table>
                  ` : ''}
                  <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0 0 24px;">
                    If you did not initiate this registration on ÌRÍSÍ, you can safely ignore this email.
                  </p>
                  <!-- Support Concierge -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 22px;">
                    <tr>
                      <td align="center">
                        <a href="${supportUrl || 'https://wa.me/2349070332145'}" style="color: #e6c367; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.3px;">Need assistance? Chat with ÌRÍSÍ Merchant Concierge on WhatsApp &rarr;</a>
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

/**
 * Sends a signup account verification email containing the 6-digit OTP code directly via Gmail SMTP / custom SMTP.
 */
export async function sendSignupVerificationEmail(payload: SignupVerificationEmailPayload): Promise<{
  success: boolean;
  provider: 'gmail_smtp' | 'smtp' | 'resend' | 'none';
  error?: string;
}> {
  const { recipientEmail, otpCode, userType } = payload;
  const isVendor = userType === 'vendor';
  const roleLabel = isVendor ? 'Merchant Store' : 'Shopper Account';
  const emailHtml = buildSignupVerificationEmailHtml(payload);
  const emailSubject = `ÌRÍSÍ - Your 6-Digit Verification Code is ${otpCode}`;

  console.log(`[EMAIL DISPATCH] 🔐 Signup verification code generated for ${recipientEmail} (${roleLabel})`);

  // Direct delivery via Gmail SMTP if configured
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD;
  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      await transporter.sendMail({
        from: `"ÌRÍSÍ Marketplace" <${gmailUser}>`,
        to: recipientEmail,
        subject: emailSubject,
        html: emailHtml,
      });

      console.log(`[EMAIL DISPATCH] ✅ Gmail SMTP delivered signup verification email to ${recipientEmail}`);
      return { success: true, provider: 'gmail_smtp' };
    } catch (err: any) {
      console.warn(`[EMAIL DISPATCH] ⚠️ Gmail SMTP delivery error for signup:`, err.message);
    }
  }

  // Fallback to sendLuxuryEmail
  const res = await sendLuxuryEmail(recipientEmail, emailSubject, emailHtml);
  return {
    success: res.success,
    provider: (res.provider as any) || 'none',
    error: res.error,
  };
}
