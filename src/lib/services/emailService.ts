import {
  sendLuxuryEmail,
  sendVendorNewOrderNotification,
  sendVendorSettlementNotification,
} from '@/lib/services/vendorNotificationService';
import {
  buildIrisiEmailShell,
  buildDetailPanel,
  EMAIL_LOGO_URL,
  EMAIL_CONCIERGE_WHATSAPP,
} from '@/lib/services/emailTheme';
import { getBaseUrl } from '@/lib/utils/url';

export const BRAND_LOGO_URL = EMAIL_LOGO_URL;
export const BRAND_WORDMARK_URL =
  'https://res.cloudinary.com/dvnj8idde/image/upload/v1793703378/brand_assets/irisi_wordmark_logo.png';

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
  subtotal?: number;
  shippingFee: number;
  driverPhone?: string;
  waybillNumber?: string;
  vendorName?: string;
}

export async function sendOrderConfirmationEmail(payload: OrderEmailPayload) {
  if (!payload.customerEmail || !payload.customerEmail.includes('@')) {
    return { success: false, error: 'No customer email provided' };
  }

  const itemsHtml = (payload.items || [])
    .map(
      (it) => `
      <tr>
        <td class="irisi-ink irisi-divider" style="padding:12px 0; border-bottom:1px solid #ECEAE4; color:#111114; font-size:13.5px; vertical-align:top;">
          <div style="font-weight:600; color:#111114;" class="irisi-ink">${it.productName}</div>
          <div style="color:#71717A; font-size:11.5px; margin-top:3px;" class="irisi-muted">
            Size: ${it.size} &middot; Qty: ${it.quantity}${it.vendorName ? ` &middot; ${it.vendorName}` : ''}
          </div>
        </td>
        <td align="right" class="irisi-ink irisi-divider" style="padding:12px 0; border-bottom:1px solid #ECEAE4; color:#111114; font-weight:600; font-size:13.5px; white-space:nowrap; vertical-align:top;">
          ₦${((it.price || 0) * (it.quantity || 1)).toLocaleString()}
        </td>
      </tr>`
    )
    .join('');

  const trackUrl = `${getBaseUrl()}/track-order?orderNumber=${encodeURIComponent(payload.orderNumber)}`;
  const brandNames = Array.from(new Set((payload.items || []).map((it) => it.vendorName).filter(Boolean)));
  const storeLabel =
    brandNames.length === 1
      ? brandNames[0]
      : brandNames.length > 1
      ? brandNames.join(', ')
      : payload.vendorName || 'Your brand';

  const bodyHtml = `
    <p class="irisi-text" style="color:#3F3F46; font-size:14.5px; line-height:1.68; margin:0 0 18px;">
      Hello ${payload.customerName || 'there'},<br><br>
      Thank you for ordering on <strong>ÌRÍSÍ</strong>. Your payment is safely secured in Escrow, and <strong>${storeLabel}</strong> has been notified to prepare your pieces. Your funds stay 100% protected until your order arrives and you confirm everything is right.
    </p>

    ${buildDetailPanel([
      { label: 'Order Reference', value: payload.orderNumber },
      { label: 'Fulfilling Brand', value: String(storeLabel) },
      { label: 'Delivery Destination', value: payload.deliveryAddress },
    ])}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; margin:10px 0 8px;">
      ${itemsHtml}
      <tr>
        <td class="irisi-muted" style="padding-top:12px; color:#71717A; font-size:12.5px;">Delivery Fee</td>
        <td align="right" class="irisi-ink" style="padding-top:12px; color:#111114; font-size:12.5px;">₦${Number(payload.shippingFee || 0).toLocaleString()}</td>
      </tr>
      <tr>
        <td class="irisi-ink" style="padding-top:10px; color:#111114; font-weight:700; font-size:14.5px;">Total Paid (Escrow Secured)</td>
        <td align="right" style="padding-top:10px; color:#9E7724; font-weight:700; font-size:18px; font-family:Georgia, serif;">₦${Number(payload.totalAmount || 0).toLocaleString()}</td>
      </tr>
    </table>
  `;

  const html = buildIrisiEmailShell({
    title: 'Order Confirmed',
    eyebrow: 'ESCROW PROTECTED ORDER',
    preheader: `Order ${payload.orderNumber} is confirmed and secured in Escrow.`,
    badge: 'Order Confirmed · Escrow Secured',
    badgeTone: 'gold',
    headline: 'Your Order Is Confirmed',
    bodyHtml,
    ctaLabel: 'Track Live Delivery',
    ctaUrl: trackUrl,
    ctaStyle: 'obsidian',
  });

  return sendLuxuryEmail(
    payload.customerEmail,
    `ÌRÍSÍ — Order Confirmed & Escrow Secured (${payload.orderNumber})`,
    html
  );
}

export async function sendVendorNewOrderEmail(vendorEmail: string, payload: OrderEmailPayload) {
  if (!vendorEmail || !vendorEmail.includes('@')) return { success: false, error: 'Invalid vendor email' };
  const vBrand = payload.vendorName || 'Store Merchant';
  const vId = vBrand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return sendVendorNewOrderNotification({
    vendor: {
      id: vId,
      brandName: vBrand,
      email: vendorEmail,
    },
    orderNumber: payload.orderNumber,
    customerName: payload.customerName,
    deliveryCity: payload.deliveryAddress || 'Destination',
    deliveryState: '',
    deliveryMethod: 'doorstep',
    items: (payload.items || []).map((i) => ({
      productName: i.productName,
      size: i.size || 'M',
      color: i.color || 'Standard',
      quantity: Number(i.quantity || 1),
      price: Number(i.price || 0),
      vendorPayout: Number(i.price || 0),
    })),
    totalPayout: Number(
      payload.subtotal ??
        (payload.items || []).reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || 1), 0)
    ),
  });
}

export async function sendDispatchNotificationEmail(payload: OrderEmailPayload) {
  if (!payload.customerEmail || !payload.customerEmail.includes('@')) {
    return { success: false, error: 'No customer email provided' };
  }

  const trackUrl = `${getBaseUrl()}/track-order?orderNumber=${encodeURIComponent(payload.orderNumber)}`;

  const detailRows: Array<{ label: string; value: string; highlight?: string }> = [
    { label: 'Order Reference', value: payload.orderNumber },
  ];
  if (payload.waybillNumber) {
    detailRows.push({ label: 'Waybill / Tracking #', value: payload.waybillNumber, highlight: '#9E7724' });
  }
  if (payload.driverPhone) {
    detailRows.push({
      label: 'Rider / Driver Contact',
      value: `<a href="tel:${payload.driverPhone}" style="color:#9E7724; text-decoration:underline;">${payload.driverPhone}</a>`,
    });
  }
  detailRows.push({ label: 'Destination', value: payload.deliveryAddress });

  const bodyHtml = `
    <p class="irisi-text" style="color:#3F3F46; font-size:14.5px; line-height:1.68; margin:0 0 18px;">
      Hello ${payload.customerName || 'there'},<br><br>
      Great news — <strong>${payload.vendorName || 'your designer'}</strong> has carefully packed and handed off your order for delivery. Your parcel is officially on the move.
    </p>
    ${buildDetailPanel(detailRows)}
    <p class="irisi-muted" style="color:#71717A; font-size:12.5px; line-height:1.6; margin:0;">
      Your courier rider or transport driver will contact you as soon as the package approaches your destination.
    </p>
  `;

  const html = buildIrisiEmailShell({
    title: 'Order Dispatched',
    eyebrow: 'LIVE DELIVERY UPDATE',
    preheader: `Order ${payload.orderNumber} is now in transit.`,
    badge: 'Dispatched · In Transit',
    badgeTone: 'blue',
    headline: 'Your Order Is On The Way',
    bodyHtml,
    ctaLabel: 'Track Live Delivery',
    ctaUrl: trackUrl,
    ctaStyle: 'obsidian',
  });

  return sendLuxuryEmail(
    payload.customerEmail,
    `ÌRÍSÍ — Your Order Is In Transit (${payload.orderNumber})`,
    html
  );
}

export async function sendOrderPackedEmail(payload: OrderEmailPayload) {
  if (!payload.customerEmail || !payload.customerEmail.includes('@')) {
    return { success: false, error: 'No customer email provided' };
  }

  const trackUrl = `${getBaseUrl()}/track-order?orderNumber=${encodeURIComponent(payload.orderNumber)}`;

  const bodyHtml = `
    <p class="irisi-text" style="color:#3F3F46; font-size:14.5px; line-height:1.68; margin:0 0 18px;">
      Hello ${payload.customerName || 'there'},<br><br>
      <strong>${payload.vendorName || 'Your designer'}</strong> has inspected and sealed order <strong>${payload.orderNumber}</strong>. Your pieces are boxed and awaiting dispatch handoff — we will notify you the moment the rider departs.
    </p>
    ${buildDetailPanel([
      { label: 'Order Reference', value: payload.orderNumber },
      { label: 'Current Stage', value: 'Quality Checked & Sealed', highlight: '#9E7724' },
    ])}
  `;

  const html = buildIrisiEmailShell({
    title: 'Order Packed',
    eyebrow: 'FULFILLMENT UPDATE',
    preheader: `Order ${payload.orderNumber} has been packed and sealed.`,
    badge: 'Quality Checked · Sealed',
    badgeTone: 'gold',
    headline: 'Your Package Is Boxed & Ready',
    bodyHtml,
    ctaLabel: 'View Order Progress',
    ctaUrl: trackUrl,
    ctaStyle: 'obsidian',
  });

  return sendLuxuryEmail(
    payload.customerEmail,
    `ÌRÍSÍ — Your Order Is Packed & Ready (${payload.orderNumber})`,
    html
  );
}

export async function sendOrderDeliveredCustomerEmail(payload: OrderEmailPayload) {
  if (!payload.customerEmail || !payload.customerEmail.includes('@')) {
    return { success: false, error: 'No customer email provided' };
  }

  const reviewUrl = `${getBaseUrl()}/profile?tab=orders`;

  const bodyHtml = `
    <p class="irisi-text" style="color:#3F3F46; font-size:14.5px; line-height:1.68; margin:0 0 18px;">
      Hello ${payload.customerName || 'there'},<br><br>
      Your order <strong>${payload.orderNumber}</strong> has arrived. Open your package, inspect your pieces, and try them on to make sure you love the fit and finish.
    </p>
    ${buildDetailPanel([
      { label: 'Order Reference', value: payload.orderNumber },
      { label: 'Delivered To', value: payload.deliveryAddress },
      { label: 'Inspection Window', value: '48 Hours Escrow Protection', highlight: '#059669' },
    ])}
    <p class="irisi-text" style="color:#3F3F46; font-size:13.5px; line-height:1.6; margin:0;">
      Once you confirm everything meets your standards, tap below to approve delivery so the brand receives their payout, and leave a quick review.
    </p>
  `;

  const html = buildIrisiEmailShell({
    title: 'Order Delivered',
    eyebrow: 'DELIVERY COMPLETED',
    preheader: `Order ${payload.orderNumber} has been delivered — inspect & confirm receipt.`,
    badge: 'Delivered · 48h Inspection',
    badgeTone: 'emerald',
    headline: 'Your Package Has Arrived',
    bodyHtml,
    ctaLabel: 'Confirm Receipt & Review',
    ctaUrl: reviewUrl,
    ctaStyle: 'obsidian',
  });

  return sendLuxuryEmail(
    payload.customerEmail,
    `ÌRÍSÍ — Package Delivered (${payload.orderNumber})`,
    html
  );
}

export async function sendShopperWelcomeEmail(payload: {
  customerEmail: string;
  customerName?: string;
}) {
  const { customerEmail, customerName } = payload;
  if (!customerEmail || !customerEmail.includes('@')) return { success: false, error: 'Invalid email' };

  const displayName = customerName || 'there';

  const bodyHtml = `
    <p class="irisi-text" style="color:#3F3F46; font-size:14.5px; line-height:1.7; margin:0 0 20px;">
      Welcome, ${displayName}. <strong>ÌRÍSÍ</strong> connects you directly with verified independent fashion houses, bespoke tailors, shoemakers, and luxury accessory studios — every single order protected by Escrow from checkout to delivery.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="irisi-panel" style="width:100%; background-color:#F7F6F3; border:1px solid #E7E5DF; border-radius:14px; margin:18px 0 22px;">
      <tr>
        <td style="padding:18px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
            <tr>
              <td class="irisi-divider" style="padding:0 0 12px; border-bottom:1px solid #EAE8E2;">
                <div class="irisi-ink" style="color:#111114; font-size:13.5px; font-weight:600;">01 · 100% Escrow Protection</div>
                <div class="irisi-muted" style="color:#71717A; font-size:12.5px; line-height:1.5; margin-top:3px;">
                  Your payment stays locked in escrow until your order arrives and you approve the quality and fit.
                </div>
              </td>
            </tr>
            <tr>
              <td class="irisi-divider" style="padding:12px 0; border-bottom:1px solid #EAE8E2;">
                <div class="irisi-ink" style="color:#111114; font-size:13.5px; font-weight:600;">02 · Curated Independent Brands</div>
                <div class="irisi-muted" style="color:#71717A; font-size:12.5px; line-height:1.5; margin-top:3px;">
                  Follow your favorite brands on Shop for live 24-hour Lookbook Stories and instant drop notifications.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 0 0;">
                <div class="irisi-ink" style="color:#111114; font-size:13.5px; font-weight:600;">03 · Tracked Doorstep &amp; Hub Delivery</div>
                <div class="irisi-muted" style="color:#71717A; font-size:12.5px; line-height:1.5; margin-top:3px;">
                  Transparent delivery rates with live waybill tracking right to your door or preferred pickup hub.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const html = buildIrisiEmailShell({
    title: 'Welcome to ÌRÍSÍ',
    eyebrow: 'PRIVATE CLIENT WELCOME',
    preheader: 'Welcome to ÌRÍSÍ — curated fashion houses with 100% escrow protection.',
    badge: 'Welcome to ÌRÍSÍ',
    badgeTone: 'gold',
    headline: `Welcome to the Collective, ${displayName}`,
    bodyHtml,
    ctaLabel: 'Explore Live Shop',
    ctaUrl: `${getBaseUrl()}/shop`,
    ctaStyle: 'obsidian',
  });

  return sendLuxuryEmail(customerEmail, `Welcome to ÌRÍSÍ — Curated Luxury Fashion`, html);
}

export async function sendNewDropNotificationEmail(payload: {
  customerEmail: string;
  customerName?: string;
  vendorName: string;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    category?: string;
  };
}) {
  const { customerEmail, customerName, vendorName, product } = payload;
  if (!customerEmail || !customerEmail.includes('@')) return { success: false, error: 'Invalid email' };

  const productUrl = product.id
    ? `${getBaseUrl()}/shop/${encodeURIComponent(product.id)}`
    : `${getBaseUrl()}/shop`;

  const bodyHtml = `
    <p class="irisi-text" style="color:#3F3F46; font-size:14.5px; line-height:1.68; margin:0 0 18px;">
      Hello ${customerName || 'there'},<br><br>
      <strong>${vendorName}</strong> — a brand you follow on ÌRÍSÍ — just published something new. Be among the first to see it while sizes remain available.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="irisi-panel" style="width:100%; background-color:#F7F6F3; border:1px solid #E7E5DF; border-radius:16px; overflow:hidden; margin:16px 0 20px;">
      ${
        product.imageUrl
          ? `<tr>
              <td align="center" style="padding:14px 14px 0;">
                <img src="${product.imageUrl}" alt="${product.name}" width="500" style="display:block; width:100%; max-width:500px; max-height:320px; object-fit:cover; border-radius:12px;" />
              </td>
            </tr>`
          : ''
      }
      <tr>
        <td align="center" style="padding:18px 20px 20px;">
          <div style="font-size:10.5px; letter-spacing:0.18em; text-transform:uppercase; color:#9E7724; font-weight:600; margin-bottom:6px;">
            ${vendorName} &middot; Escrow Protected
          </div>
          <div class="irisi-ink" style="font-family:Georgia, serif; font-size:21px; font-weight:400; color:#111114; margin:0 0 8px;">
            ${product.name}
          </div>
          ${
            Number(product.price || 0) > 0
              ? `<div style="font-size:18px; font-weight:700; color:#9E7724; font-family:Georgia, serif;">
                  ₦${Number(product.price).toLocaleString()}
                </div>`
              : ''
          }
        </td>
      </tr>
    </table>
  `;

  const html = buildIrisiEmailShell({
    title: 'New Drop Alert',
    eyebrow: 'FOLLOWED BRAND ALERT',
    preheader: `${vendorName} just dropped "${product.name}" on ÌRÍSÍ.`,
    badge: 'New Drop Live',
    badgeTone: 'gold',
    headline: `${vendorName} Just Dropped`,
    bodyHtml,
    ctaLabel: 'View on Shop',
    ctaUrl: productUrl,
    ctaStyle: 'obsidian',
  });

  return sendLuxuryEmail(
    customerEmail,
    `ÌRÍSÍ — ${vendorName} Just Dropped "${product.name}"`,
    html
  );
}

export async function sendCustomShopperEmail(payload: {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  headline: string;
  badgeText?: string;
  bodyText: string;
  buttonLabel?: string;
  buttonUrl?: string;
}) {
  const { recipientEmail, subject, headline, badgeText, bodyText, buttonLabel, buttonUrl } = payload;
  if (!recipientEmail || !recipientEmail.includes('@')) {
    return { success: false, error: 'Invalid recipient email' };
  }

  const paragraphs = bodyText
    .split('\n\n')
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p class="irisi-text" style="color:#3F3F46; font-size:14.5px; line-height:1.72; margin:0 0 16px;">${p.replace(
          /\n/g,
          '<br>'
        )}</p>`
    )
    .join('');

  const html = buildIrisiEmailShell({
    title: headline,
    eyebrow: 'ÌRÍSÍ EDITORIAL DISPATCH',
    preheader: headline,
    badge: badgeText || 'Private Client Dispatch',
    badgeTone: 'gold',
    headline,
    bodyHtml: paragraphs,
    ctaLabel: buttonLabel,
    ctaUrl: buttonUrl,
    ctaStyle: 'obsidian',
  });

  return sendLuxuryEmail(recipientEmail, subject, html);
}

export async function sendDeliverySettledEmail(vendorEmail: string, payload: OrderEmailPayload) {
  if (!vendorEmail || !vendorEmail.includes('@')) return { success: false, error: 'Invalid vendor email' };
  const vBrand = payload.vendorName || 'Store Merchant';
  const vId = vBrand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return sendVendorSettlementNotification({
    vendor: {
      id: vId,
      brandName: vBrand,
      email: vendorEmail,
    },
    orderNumber: payload.orderNumber,
    payoutAmount: Number(
      payload.subtotal ??
        (payload.items || []).reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || 1), 0)
    ),
    customerName: payload.customerName,
  });
}

export interface PasswordResetEmailPayload {
  recipientEmail: string;
  recipientName?: string;
  otpCode: string;
  actionLink?: string;
  userType?: 'vendor' | 'shopper';
  supportUrl?: string;
}

function buildOtpBoxHtml(otpCode: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="irisi-panel" style="width:100%; background-color:#F7F6F3; border:1.5px dashed #CBB67E; border-radius:16px; margin:20px 0 22px;">
      <tr>
        <td align="center" style="padding:26px 18px;">
          <div style="font-size:10px; letter-spacing:0.22em; text-transform:uppercase; color:#9E7724; font-weight:600; margin-bottom:10px;">
            Single-Use Verification Code
          </div>
          <div class="irisi-ink" style="font-family:'Courier New', Courier, monospace; font-size:36px; font-weight:700; letter-spacing:10px; color:#111114; padding-left:10px;">
            ${otpCode}
          </div>
          <div class="irisi-muted" style="font-size:11.5px; color:#71717A; margin-top:10px;">
            Expires in 15 minutes &middot; Never share this code
          </div>
        </td>
      </tr>
    </table>`;
}

export async function sendPasswordResetEmail(payload: PasswordResetEmailPayload): Promise<{
  success: boolean;
  provider: 'gmail_smtp' | 'smtp' | 'resend' | 'none';
  error?: string;
}> {
  const { recipientEmail, recipientName, otpCode, actionLink, userType, supportUrl } = payload;
  const isVendor = userType === 'vendor';
  const roleLabel = isVendor ? 'Merchant Studio' : 'Shopper Account';

  const bodyHtml = `
    <p class="irisi-text" style="color:#3F3F46; font-size:14.5px; line-height:1.68; margin:0 0 16px;">
      Hello ${recipientName || (isVendor ? 'Merchant Partner' : 'Valued Client')},<br><br>
      We received a request to reset the password for your <strong>${roleLabel}</strong>. Enter the 6-digit verification code below to authorize this reset:
    </p>
    ${buildOtpBoxHtml(otpCode)}
    <p class="irisi-muted" style="color:#71717A; font-size:12.5px; line-height:1.6; margin:0;">
      If you did not request a password reset, you can safely ignore this message — your account remains secure.
    </p>
  `;

  const html = buildIrisiEmailShell({
    title: 'ÌRÍSÍ Security Recovery',
    eyebrow: 'ACCOUNT SECURITY',
    preheader: `Your ÌRÍSÍ password recovery code is ${otpCode}.`,
    badge: 'Password Recovery',
    badgeTone: 'neutral',
    headline: 'Reset Your Password',
    bodyHtml,
    ctaLabel: actionLink ? 'Reset Password Directly' : undefined,
    ctaUrl: actionLink,
    ctaStyle: 'obsidian',
    supportUrl: supportUrl || EMAIL_CONCIERGE_WHATSAPP,
  });

  const res = await sendLuxuryEmail(recipientEmail, `ÌRÍSÍ — Your Recovery Code is ${otpCode}`, html, {
    fromName: 'ÌRÍSÍ Security',
  });
  return {
    success: res.success,
    provider: (res.provider as any) || 'none',
    error: res.error,
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

export async function sendSignupVerificationEmail(payload: SignupVerificationEmailPayload): Promise<{
  success: boolean;
  provider: 'gmail_smtp' | 'smtp' | 'resend' | 'none';
  error?: string;
}> {
  const { recipientEmail, recipientName, otpCode, actionLink, userType, supportUrl } = payload;
  const isVendor = userType === 'vendor';
  const roleLabel = isVendor ? 'Merchant Storefront' : 'Shopper Account';

  const bodyHtml = `
    <p class="irisi-text" style="color:#3F3F46; font-size:14.5px; line-height:1.68; margin:0 0 16px;">
      Hello ${recipientName || (isVendor ? 'Merchant Partner' : 'Valued Client')},<br><br>
      Welcome to <strong>ÌRÍSÍ</strong>. Enter the 6-digit verification code below to confirm your email and activate your <strong>${roleLabel}</strong>:
    </p>
    ${buildOtpBoxHtml(otpCode)}
    <p class="irisi-muted" style="color:#71717A; font-size:12.5px; line-height:1.6; margin:0;">
      If you did not initiate this registration on ÌRÍSÍ, you may safely disregard this email.
    </p>
  `;

  const html = buildIrisiEmailShell({
    title: 'ÌRÍSÍ Account Verification',
    eyebrow: 'EMAIL VERIFICATION',
    preheader: `Your 6-digit ÌRÍSÍ verification code is ${otpCode}.`,
    badge: isVendor ? 'Merchant Verification' : 'Account Verification',
    badgeTone: 'gold',
    headline: isVendor ? 'Verify Your Store Account' : 'Verify Your Account',
    bodyHtml,
    ctaLabel: actionLink ? 'Confirm Account Instantly' : undefined,
    ctaUrl: actionLink,
    ctaStyle: 'obsidian',
    supportUrl: supportUrl || EMAIL_CONCIERGE_WHATSAPP,
  });

  const res = await sendLuxuryEmail(recipientEmail, `ÌRÍSÍ — Your Verification Code is ${otpCode}`, html, {
    fromName: 'ÌRÍSÍ Security',
  });
  return {
    success: res.success,
    provider: (res.provider as any) || 'none',
    error: res.error,
  };
}

export interface AbandonedCartItem {
  id?: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity?: number;
  size?: string;
  color?: string;
  category?: string;
  vendorName?: string;
}

export interface AbandonedCartPayload {
  customerEmail: string;
  customerName?: string;
  items: AbandonedCartItem[];
  totalAmount: number;
  checkoutUrl?: string;
}

export async function sendAbandonedCartEmail(payload: AbandonedCartPayload) {
  const { customerEmail, customerName, items, totalAmount } = payload;
  if (!customerEmail || !customerEmail.includes('@')) {
    return { success: false, error: 'Invalid customer email' };
  }

  const displayName = customerName || 'there';
  const checkoutUrl = payload.checkoutUrl || `${getBaseUrl()}/checkout`;

  const itemsHtml = items
    .map(
      (it) => `
      <tr>
        <td class="irisi-divider" style="padding:12px 0; border-bottom:1px solid #EAE8E2; vertical-align:middle;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;">
            <tr>
              ${
                it.imageUrl
                  ? `<td width="58" style="vertical-align:middle; padding-right:12px;">
                      <img src="${it.imageUrl}" alt="${it.name}" width="52" height="52" style="width:52px; height:52px; border-radius:10px; object-fit:cover; display:block; border:1px solid #E4E4E7;" />
                    </td>`
                  : ''
              }
              <td style="vertical-align:middle;">
                <div class="irisi-ink" style="color:#111114; font-size:13.5px; font-weight:600;">${it.name}</div>
                <div class="irisi-muted" style="color:#71717A; font-size:11.5px; margin-top:2px;">
                  ${it.size && it.size !== 'One Size' ? `Size: ${it.size} &middot; ` : ''}${it.color ? `${it.color} &middot; ` : ''}Qty: ${it.quantity || 1}${it.vendorName ? ` &middot; ${it.vendorName}` : ''}
                </div>
              </td>
              <td align="right" style="vertical-align:middle; color:#9E7724; font-weight:700; font-size:13.5px; white-space:nowrap;">
                ₦${Number(it.price || 0).toLocaleString()}
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join('');

  const bodyHtml = `
    <p class="irisi-text" style="color:#3F3F46; font-size:14.5px; line-height:1.68; margin:0 0 18px;">
      Hello ${displayName},<br><br>
      You left a few curated pieces waiting in your bag on <strong>ÌRÍSÍ</strong>. Independent brand runs are limited — complete checkout whenever you are ready with 100% Escrow protection.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="irisi-panel" style="width:100%; background-color:#F7F6F3; border:1px solid #E7E5DF; border-radius:14px; margin:16px 0 20px;">
      <tr>
        <td style="padding:8px 18px 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
            ${itemsHtml}
            <tr>
              <td style="padding-top:14px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr>
                    <td class="irisi-muted" style="color:#71717A; font-size:12.5px; font-weight:600;">Bag Subtotal</td>
                    <td align="right" style="color:#9E7724; font-weight:700; font-size:17px; font-family:Georgia, serif;">
                      ₦${Number(totalAmount || 0).toLocaleString()}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const html = buildIrisiEmailShell({
    title: 'Your Bag Is Reserved',
    eyebrow: 'CURATED BAG REMINDER',
    preheader: 'Your selected pieces are still waiting in your ÌRÍSÍ bag.',
    badge: 'Bag Reserved',
    badgeTone: 'gold',
    headline: 'Still Thinking About These Pieces?',
    bodyHtml,
    ctaLabel: 'Complete Order with Escrow',
    ctaUrl: checkoutUrl,
    ctaStyle: 'obsidian',
  });

  return sendLuxuryEmail(customerEmail, `Still eyeing your picks? Your bag is waiting on ÌRÍSÍ`, html);
}
