import nodemailer from 'nodemailer';
import {
  sendLuxuryEmail,
  sendVendorNewOrderNotification,
  sendVendorSettlementNotification
} from '@/lib/services/vendorNotificationService';

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
                        <p style="color: #9ca3af; font-size: 11px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px;">Questions, Sizing or Delivery Help? We Dey For You</p>
                        <a href="https://wa.me/2349070332145" style="display: inline-block; background-color: rgba(230, 195, 103, 0.1); border: 1px solid rgba(230, 195, 103, 0.3); color: #e6c367; padding: 10px 20px; border-radius: 10px; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.3px;">
                          💬 Chat with Concierge on WhatsApp &rarr;
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
      <span style="color: #e6c367; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">🛍️ Order Confirmed · Escrow Secured</span>
    </div>
    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px; font-weight: 600;">We Don Carry Your Matter for Head! 🙌</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${payload.customerName || 'Boss'}, thank you for shopping on ÌRÍSÍ! Your payment is confirmed and locked 100% safe in Escrow. <strong>${storeLabel}</strong> is already preparing your package. No shaking, your money is completely safe until you receive your order!
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

  return sendLuxuryEmail(payload.customerEmail, `ÌRÍSÍ - Order Confirmed & Escrow Secured (${payload.orderNumber})`, wrapEmailHtml('Order Confirmed', bodyContent));
}

export async function sendVendorNewOrderEmail(vendorEmail: string, payload: OrderEmailPayload) {
  if (!vendorEmail || !vendorEmail.includes('@')) return { success: false, error: 'Invalid vendor email' };
  console.log(`[EMAIL DISPATCH] 📨 Dispatching Vendor New Order Notification to ${vendorEmail} for ${payload.orderNumber}`);
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
    deliveryCity: 'Lagos',
    deliveryState: 'Lagos',
    deliveryMethod: 'doorstep',
    items: (payload.items || []).map(i => ({
      productName: i.productName,
      size: i.size || 'M',
      color: i.color || 'Standard',
      quantity: Number(i.quantity || 1),
      price: Number(i.price || 0),
      vendorPayout: Number(i.price || 0),
    })),
    totalPayout: Number(payload.subtotal ?? (payload.items || []).reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 1)), 0)),
  });
}

export async function sendDispatchNotificationEmail(payload: OrderEmailPayload) {
  if (!payload.customerEmail || !payload.customerEmail.includes('@')) {
    return { success: false, error: 'No customer email provided' };
  }

  const trackUrl = `https://irisimi-nig.vercel.app/track-order?orderNumber=${encodeURIComponent(payload.orderNumber)}`;

  const bodyContent = `
    <div style="background-color: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #60a5fa; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">🚚 Your Drip is on the Road!</span>
    </div>
    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px; font-weight: 600;">Package Dispatched &amp; Moving! 🚀</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${payload.customerName || 'Boss'}, great news! <strong>${payload.vendorName || 'Your fashion designer'}</strong> has packaged and handed your order to the transporter. Your piece is on its way to you:
    </p>

    <div style="background-color: #0c0d0e; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 14px; padding: 16px 20px; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Reference</td>
          <td align="right" style="color: #ffffff; font-weight: 700; font-family: monospace; font-size: 14px;">${payload.orderNumber}</td>
        </tr>
        ${payload.waybillNumber ? `
        <tr>
          <td style="color: #9ca3af; font-size: 12px; padding-top: 8px;">Waybill / Tracking #</td>
          <td align="right" style="color: #e6c367; font-weight: 700; font-family: monospace; font-size: 13px; padding-top: 8px;">${payload.waybillNumber}</td>
        </tr>` : ''}
        ${payload.driverPhone ? `
        <tr>
          <td style="color: #9ca3af; font-size: 12px; padding-top: 8px;">Driver / Rider Contact</td>
          <td align="right" style="color: #ffffff; font-size: 13px; padding-top: 8px;">
            <a href="tel:${payload.driverPhone}" style="color: #e6c367; text-decoration: none; font-weight: 700;">${payload.driverPhone}</a>
          </td>
        </tr>` : ''}
        <tr>
          <td style="color: #9ca3af; font-size: 12px; padding-top: 8px;">Destination</td>
          <td align="right" style="color: #ffffff; font-size: 12px; padding-top: 8px;">${payload.deliveryAddress}</td>
        </tr>
      </table>
    </div>

    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0 0 20px; text-align: center;">
      Driver or dispatch rider will contact you once the parcel is arriving. You can track live below anytime!
    </p>

    <div style="text-align: center; margin-top: 24px; margin-bottom: 24px;">
      <a href="${trackUrl}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Track Live Status &rarr;
      </a>
    </div>
  `;

  return sendLuxuryEmail(payload.customerEmail, `ÌRÍSÍ - Your Drip is on the Road! Dispatched (${payload.orderNumber})`, wrapEmailHtml('Order Dispatched', bodyContent));
}

export async function sendOrderPackedEmail(payload: OrderEmailPayload) {
  if (!payload.customerEmail || !payload.customerEmail.includes('@')) {
    return { success: false, error: 'No customer email provided' };
  }

  const trackUrl = `https://irisimi-nig.vercel.app/track-order?orderNumber=${encodeURIComponent(payload.orderNumber)}`;

  const bodyContent = `
    <div style="background-color: rgba(230, 195, 103, 0.1); border: 1px solid rgba(230, 195, 103, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #e6c367; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">📦 Package Inspected &amp; Ready</span>
    </div>
    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px; font-weight: 600;">Your Package is Packed &amp; Looking Clean! ✨</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${payload.customerName || 'Boss'}, great news! <strong>${payload.vendorName || 'Your fashion designer'}</strong> has finished packing and quality-checking your order <strong>${payload.orderNumber}</strong>. The parcel is sealed and waiting for courier / motor park dispatch!
    </p>

    <div style="text-align: center; margin-top: 28px; margin-bottom: 24px;">
      <a href="${trackUrl}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        View Order Progress &rarr;
      </a>
    </div>
  `;

  return sendLuxuryEmail(payload.customerEmail, `ÌRÍSÍ - Your Order is Packed & Ready (${payload.orderNumber})`, wrapEmailHtml('Order Packaged', bodyContent));
}

export async function sendOrderDeliveredCustomerEmail(payload: OrderEmailPayload) {
  if (!payload.customerEmail || !payload.customerEmail.includes('@')) {
    return { success: false, error: 'No customer email provided' };
  }

  const reviewUrl = `https://irisimi-nig.vercel.app/profile?tab=orders`;

  const bodyContent = `
    <div style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #10b981; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">🎉 Delivered · Time to Check Your Drip</span>
    </div>
    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px; font-weight: 600;">Your Package Has Landed! 🙌</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${payload.customerName || 'Boss'}, your order <strong>${payload.orderNumber}</strong> has arrived at your destination! Please open your package, check your pieces, and ensure you love the quality.
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
      Once you confirm say the fit set, tap the button below to confirm receipt so the designer can receive their settlement, and leave a review for other shoppers!
    </p>

    <div style="text-align: center; margin-top: 28px; margin-bottom: 24px;">
      <a href="${reviewUrl}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Confirm Receipt &amp; Leave Review &rarr;
      </a>
    </div>
  `;

  return sendLuxuryEmail(payload.customerEmail, `ÌRÍSÍ - Package Delivered! How Does It Fit? (${payload.orderNumber})`, wrapEmailHtml('Order Delivered', bodyContent));
}

/**
 * 1. SHOPPER WELCOME ONBOARDING EMAIL
 * Warm, fun, stylish Nigerian welcome highlighting verified brands & 100% Escrow protection
 */
export async function sendShopperWelcomeEmail(payload: {
  customerEmail: string;
  customerName?: string;
}) {
  const { customerEmail, customerName } = payload;
  if (!customerEmail || !customerEmail.includes('@')) return { success: false, error: 'Invalid email' };

  const displayName = customerName || 'Boss';
  const bodyContent = `
    <div style="background-color: rgba(230, 195, 103, 0.1); border: 1px solid rgba(230, 195, 103, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #e6c367; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">🥂 Welcome to ÌRÍSÍ!</span>
    </div>
    <h2 style="color: #ffffff; font-size: 21px; margin: 0 0 14px; font-weight: 700;">Oshey! Welcome to the Family, ${displayName} ✨</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      You don reach the right plug! <strong>ÌRÍSÍ</strong> is where verified Nigerian fashion houses, custom bespoke tailors, luxury Senator sets, and hot accessories meet. Pure luxury, zero stress, and zero stories.
    </p>

    <div style="background-color: #0c0d0e; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <strong style="color: #e6c367; font-size: 14px;">🛡️ 100% Escrow Protected (No Shaking)</strong><br>
            <span style="color: #9ca3af; font-size: 12px; line-height: 1.4; display: block; margin-top: 4px;">
              Your money is safe with us until your package reaches your hands and you confirm say the fit set!
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <strong style="color: #e6c367; font-size: 14px;">✂️ Direct From Verified Fashion Houses</strong><br>
            <span style="color: #9ca3af; font-size: 12px; line-height: 1.4; display: block; margin-top: 4px;">
              Buy directly from top fashion houses and designers across Lagos, Abuja, Ibadan, Port Harcourt, and nationwide.
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <strong style="color: #e6c367; font-size: 14px;">🚚 Doorstep Courier &amp; Interstate Motor Park Waybills</strong><br>
            <span style="color: #9ca3af; font-size: 12px; line-height: 1.4; display: block; margin-top: 4px;">
              Fast delivery whether doorstep courier or motor park bus waybill right to your city.
            </span>
          </td>
        </tr>
      </table>
    </div>

    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
      Ready to upgrade your wardrobe with premium Nigerian pieces?
    </p>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="https://irisimi-nig.vercel.app/shop" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 34px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Explore Fresh Drops &amp; Senator Fits &rarr;
      </a>
    </div>
  `;

  return sendLuxuryEmail(customerEmail, `Oshey! Welcome to ÌRÍSÍ ✨ Your Drip Starts Here`, wrapEmailHtml('Welcome to ÌRÍSÍ', bodyContent));
}

/**
 * 2. NEW DROP NOTIFICATION EMAIL
 * Triggered when a verified vendor releases a fresh product or collection drop
 */
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

  const productUrl = `https://irisimi-nig.vercel.app/shop/${product.id}`;
  const bodyContent = `
    <div style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #f87171; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">🔥 HOT NEW DROP ALERT</span>
    </div>
    <h2 style="color: #ffffff; font-size: 21px; margin: 0 0 12px; font-weight: 700;">${vendorName} Just Dropped Fresh Heat!</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${customerName || 'Boss'}, oya come see this one! <strong>${vendorName}</strong> just added a brand new piece to their collection on ÌRÍSÍ. Check am out before limited sizes finish:
    </p>

    <div style="background-color: #0c0d0e; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 18px; padding: 18px; margin-bottom: 24px; text-align: center;">
      ${product.imageUrl ? `
        <img src="${product.imageUrl}" alt="${product.name}" style="width: 100%; max-height: 320px; object-fit: cover; border-radius: 14px; margin-bottom: 16px;" />
      ` : ''}
      <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 6px; font-weight: 700;">${product.name}</h3>
      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">Brand: ${vendorName} • 100% Escrow Protected</p>
      <div style="color: #e6c367; font-size: 22px; font-weight: 800; font-family: monospace;">₦${Number(product.price || 0).toLocaleString()}</div>
    </div>

    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0 0 24px; text-align: center;">
      You know say hot styles no dey last for shelf. Grab yours now while sizes still complete!
    </p>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${productUrl}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 34px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Check Am Out / Shop Drop &rarr;
      </a>
    </div>
  `;

  return sendLuxuryEmail(customerEmail, `Hot New Drop Alert! 🔥 ${vendorName} Just Added Fresh Heat on ÌRÍSÍ`, wrapEmailHtml('New Drop Alert', bodyContent));
}

/**
 * 3. CUSTOM ADMIN SHOPPER EMAIL (1-on-1 or Broadcast)
 * Complete flexibility for Admin with luxury ÌRÍSÍ styling & WhatsApp Concierge
 */
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
  const { recipientEmail, recipientName, subject, headline, badgeText, bodyText, buttonLabel, buttonUrl } = payload;
  if (!recipientEmail || !recipientEmail.includes('@')) return { success: false, error: 'Invalid recipient email' };

  // Convert plain text newlines into formatted paragraphs
  const paragraphs = bodyText
    .split('\n\n')
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p style="color: #d1d5db; font-size: 14px; line-height: 1.7; margin: 0 0 16px;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  const bodyContent = `
    <div style="background-color: rgba(230, 195, 103, 0.1); border: 1px solid rgba(230, 195, 103, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #e6c367; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
        ${badgeText || '👑 VIP SHOPPER DISPATCH'}
      </span>
    </div>
    <h2 style="color: #ffffff; font-size: 21px; margin: 0 0 16px; font-weight: 700;">${headline}</h2>
    
    <div style="margin-bottom: 24px;">
      ${paragraphs}
    </div>

    ${buttonLabel && buttonUrl ? `
      <div style="text-align: center; margin-top: 28px; margin-bottom: 24px;">
        <a href="${buttonUrl}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 34px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
          ${buttonLabel} &rarr;
        </a>
      </div>
    ` : ''}
  `;

  return sendLuxuryEmail(recipientEmail, subject, wrapEmailHtml(headline, bodyContent));
}

export async function sendDeliverySettledEmail(vendorEmail: string, payload: OrderEmailPayload) {
  if (!vendorEmail || !vendorEmail.includes('@')) return { success: false, error: 'Invalid vendor email' };
  console.log(`[EMAIL DISPATCH] 💰 Dispatching Settlement Alert to ${vendorEmail} for ${payload.orderNumber}`);
  const vBrand = payload.vendorName || 'Store Merchant';
  const vId = vBrand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return sendVendorSettlementNotification({
    vendor: {
      id: vId,
      brandName: vBrand,
      email: vendorEmail,
    },
    orderNumber: payload.orderNumber,
    payoutAmount: Number(payload.subtotal ?? (payload.items || []).reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 1)), 0)),
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

  const res = await sendLuxuryEmail(recipientEmail, emailSubject, emailHtml, { fromName: 'ÌRÍSÍ Luxury Security' });
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

  const res = await sendLuxuryEmail(recipientEmail, emailSubject, emailHtml, { fromName: 'ÌRÍSÍ Luxury Security' });
  return {
    success: res.success,
    provider: (res.provider as any) || 'none',
    error: res.error,
  };
}
