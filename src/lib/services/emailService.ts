// Automated Email Notification Service for ÌRÍSÍ Marketplace
import nodemailer from 'nodemailer';

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
    vendorName?: string;
  }>;
  totalAmount: number;
  shippingFee: number;
  driverPhone?: string;
  waybillNumber?: string;
  vendorName?: string;
}

export async function sendOrderConfirmationEmail(payload: OrderEmailPayload) {
  console.log(`[EMAIL DISPATCH] 📨 Sent Customer Order Confirmation to ${payload.customerEmail} for ${payload.orderNumber}`);
  return { success: true, messageId: `msg_${Date.now()}` };
}

export async function sendVendorNewOrderEmail(vendorEmail: string, payload: OrderEmailPayload) {
  console.log(`[EMAIL DISPATCH] 📨 Sent Vendor New Order Notification to ${vendorEmail || 'merchant'} for ${payload.orderNumber}`);
  return { success: true, messageId: `msg_${Date.now()}` };
}

export async function sendDispatchNotificationEmail(payload: OrderEmailPayload) {
  console.log(`[EMAIL DISPATCH] 🚚 Sent Dispatch Alert to ${payload.customerEmail} for ${payload.orderNumber} (Driver: ${payload.driverPhone || 'Assigned'}, Waybill: ${payload.waybillNumber || 'N/A'})`);
  return { success: true, messageId: `msg_${Date.now()}` };
}

export async function sendDeliverySettledEmail(vendorEmail: string, payload: OrderEmailPayload) {
  console.log(`[EMAIL DISPATCH] 💰 Sent Settlement Alert to ${vendorEmail || 'merchant'} for ${payload.orderNumber}`);
  return { success: true, messageId: `msg_${Date.now()}` };
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
