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
    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px; font-weight: 600;">Thank You for Your Order! 🙌</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${payload.customerName || 'there'}, thank you for shopping on ÌRÍSÍ! Your payment is safely locked in Escrow, and <strong>${storeLabel}</strong> has received your order to begin preparation. No wahala — your money remains 100% protected until you receive your order and love your fit!
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
      <span style="color: #60a5fa; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">🚚 Dispatched · On The Way</span>
    </div>
    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px; font-weight: 600;">Your Package is on the Road! 🚀</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${payload.customerName || 'there'}, exciting news! <strong>${payload.vendorName || 'Your designer'}</strong> has packaged and dispatched your order. Your package is officially moving to your destination:
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
      Your driver or courier rider will contact you as soon as the package reaches your location. Track your delivery live below anytime!
    </p>

    <div style="text-align: center; margin-top: 24px; margin-bottom: 24px;">
      <a href="${trackUrl}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Track Live Delivery &rarr;
      </a>
    </div>
  `;

  return sendLuxuryEmail(payload.customerEmail, `ÌRÍSÍ - Your Order is on the Road! Dispatched (${payload.orderNumber})`, wrapEmailHtml('Order Dispatched', bodyContent));
}

export async function sendOrderPackedEmail(payload: OrderEmailPayload) {
  if (!payload.customerEmail || !payload.customerEmail.includes('@')) {
    return { success: false, error: 'No customer email provided' };
  }

  const trackUrl = `https://irisimi-nig.vercel.app/track-order?orderNumber=${encodeURIComponent(payload.orderNumber)}`;

  const bodyContent = `
    <div style="background-color: rgba(230, 195, 103, 0.1); border: 1px solid rgba(230, 195, 103, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #e6c367; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">📦 Quality Checked &amp; Sealed</span>
    </div>
    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px; font-weight: 600;">Your Package is Boxed &amp; Ready! ✨</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${payload.customerName || 'there'}, great news! <strong>${payload.vendorName || 'Your designer'}</strong> has finished inspecting and carefully packaging order <strong>${payload.orderNumber}</strong>. Your pieces are sealed and waiting for courier / motor park transit. We'll update you the moment the driver departs!
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
      <span style="color: #10b981; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">🎉 Delivered · Time to Try on Your Fit</span>
    </div>
    <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 12px; font-weight: 600;">Your Package Has Arrived! 🙌</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${payload.customerName || 'there'}, your order <strong>${payload.orderNumber}</strong> has been successfully delivered! Please open your package, inspect your pieces, and try them on to ensure you are 100% happy with the fit and quality.
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
      Once you confirm that everything is top-tier, tap below to confirm receipt so the designer can receive their settlement, and leave a review for other shoppers!
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
      <span style="color: #e6c367; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">🥂 Welcome to ÌRÍSÍ</span>
    </div>
    <h2 style="color: #ffffff; font-size: 21px; margin: 0 0 14px; font-weight: 700;">Welcome to the ÌRÍSÍ Collective, ${displayName} ✨</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Oshey! We are thrilled to welcome you. <strong>ÌRÍSÍ</strong> is Nigeria's premium fashion destination connecting you directly with verified fashion houses, bespoke tailors, and luxury accessories. Pure style, genuine craftsmanship, and zero stories.
    </p>

    <div style="background-color: #0c0d0e; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <strong style="color: #e6c367; font-size: 14px;">🛡️ 100% Escrow Protection (No Wahala)</strong><br>
            <span style="color: #9ca3af; font-size: 12px; line-height: 1.4; display: block; margin-top: 4px;">
              Your payment stays completely secure in Escrow until your parcel arrives and you confirm that you love the fit.
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <strong style="color: #e6c367; font-size: 14px;">✂️ Direct From Verified Fashion Houses</strong><br>
            <span style="color: #9ca3af; font-size: 12px; line-height: 1.4; display: block; margin-top: 4px;">
              Shop directly from top designers and master tailors across Lagos, Abuja, Ibadan, Port Harcourt, and nationwide.
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <strong style="color: #e6c367; font-size: 14px;">🚚 Doorstep Courier &amp; Interstate Waybills</strong><br>
            <span style="color: #9ca3af; font-size: 12px; line-height: 1.4; display: block; margin-top: 4px;">
              Fast delivery nationwide, whether by doorstep courier or motor park bus hub directly to your city.
            </span>
          </td>
        </tr>
      </table>
    </div>

    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
      Ready to upgrade your wardrobe with authentic Nigerian pieces?
    </p>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="https://irisimi-nig.vercel.app/shop" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 34px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Explore Collections &amp; Fresh Drops &rarr;
      </a>
    </div>
  `;

  return sendLuxuryEmail(customerEmail, `Welcome to ÌRÍSÍ ✨ Your Journey into Nigerian Luxury Starts Here`, wrapEmailHtml('Welcome to ÌRÍSÍ', bodyContent));
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
      <span style="color: #f87171; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">🔥 FRESH COLLECTION DROP</span>
    </div>
    <h2 style="color: #ffffff; font-size: 21px; margin: 0 0 12px; font-weight: 700;">${vendorName} Just Released a New Drop!</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${customerName || 'there'}, exciting news! <strong>${vendorName}</strong> has just added a new piece to their exclusive collection on ÌRÍSÍ. Check it out before limited stock runs out:
    </p>

    <div style="background-color: #0c0d0e; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 18px; padding: 18px; margin-bottom: 24px; text-align: center;">
      ${product.imageUrl ? `
        <img src="${product.imageUrl}" alt="${product.name}" style="width: 100%; max-height: 320px; object-fit: cover; border-radius: 14px; margin-bottom: 16px;" />
      ` : ''}
      <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 6px; font-weight: 700;">${product.name}</h3>
      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">Atelier: ${vendorName} • 100% Escrow Protected</p>
      <div style="color: #e6c367; font-size: 22px; font-weight: 800; font-family: monospace;">₦${Number(product.price || 0).toLocaleString()}</div>
    </div>

    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0 0 24px; text-align: center;">
      Boutique pieces sell out fast. Grab yours now while sizes and colors remain in stock!
    </p>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${productUrl}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 34px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        View Piece &amp; Shop Now &rarr;
      </a>
    </div>
  `;

  return sendLuxuryEmail(customerEmail, `Fresh Drop Alert! 🔥 ${vendorName} Just Added New Pieces on ÌRÍSÍ`, wrapEmailHtml('New Drop Alert', bodyContent));
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

/**
 * 4. ABANDONED CART RECOVERY EMAIL
 * Re-engages shoppers who left pieces in cart (clothing, accessories, bags, watches, footwear)
 * with a high-converting, friendly Nigerian luxury reminder.
 */
export async function sendAbandonedCartEmail(payload: AbandonedCartPayload) {
  const { customerEmail, customerName, items, totalAmount } = payload;
  if (!customerEmail || !customerEmail.includes('@')) {
    return { success: false, error: 'Invalid customer email' };
  }

  const displayName = customerName || 'there';
  const checkoutUrl = payload.checkoutUrl || 'https://irisimi-nig.vercel.app/checkout';

  // Check if cart contains accessories (bags, watches, sunglasses, jewelry, belts, etc.)
  const hasAccessories = items.some(it => {
    const cat = (it.category || '').toLowerCase();
    const nm = (it.name || '').toLowerCase();
    return cat.includes('access') || nm.includes('bag') || nm.includes('watch') ||
      nm.includes('glass') || nm.includes('shade') || nm.includes('belt') ||
      nm.includes('chain') || nm.includes('ring') || nm.includes('shoe');
  });

  const subject = hasAccessories
    ? `Still eyeing this piece? 👀 Your cart is waiting on ÌRÍSÍ`
    : `Still thinking about this fit? 👀 Your pieces are waiting on ÌRÍSÍ`;

  const itemsHtml = items.map(it => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.08); vertical-align: middle;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            ${it.imageUrl ? `
              <td width="56" style="vertical-align: middle; padding-right: 12px;">
                <img src="${it.imageUrl}" alt="${it.name}" width="52" height="52" style="border-radius: 10px; object-fit: cover; display: block; border: 1px solid rgba(255,255,255,0.1);" />
              </td>
            ` : ''}
            <td style="vertical-align: middle;">
              <strong style="color: #ffffff; font-size: 13px; display: block;">${it.name}</strong>
              <span style="color: #9ca3af; font-size: 11px; display: block; margin-top: 2px;">
                ${it.size && it.size !== 'One Size' ? `Size: ${it.size} • ` : ''}${it.color ? `Color: ${it.color} • ` : ''}Qty: ${it.quantity || 1}
                ${it.vendorName ? ` • By: ${it.vendorName}` : ''}
              </span>
            </td>
            <td align="right" style="vertical-align: middle; color: #e6c367; font-weight: 700; font-size: 13px; font-family: monospace;">
              ₦${Number(it.price || 0).toLocaleString()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const bodyContent = `
    <div style="background-color: rgba(230, 195, 103, 0.1); border: 1px solid rgba(230, 195, 103, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
      <span style="color: #e6c367; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
        ✨ YOUR BAG IS RESERVED
      </span>
    </div>

    <h2 style="color: #ffffff; font-size: 21px; margin: 0 0 12px; font-weight: 700;">
      You Left Something Special in Your Cart! 👀
    </h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
      Hello ${displayName}, we noticed you left pieces in your cart on ÌRÍSÍ. Whether it's a handcrafted statement accessory, luxury timepiece, or tailored designer fit, boutique stocks move quickly across Nigeria.
    </p>

    <!-- Cart Items Table -->
    <div style="background-color: #0c0d0e; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 16px 20px; margin-bottom: 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${itemsHtml}
        <tr>
          <td style="padding-top: 14px; color: #9ca3af; font-size: 12px; font-weight: 600;">
            Estimated Subtotal:
          </td>
          <td align="right" style="padding-top: 14px; color: #e6c367; font-weight: 800; font-size: 16px; font-family: monospace;">
            ₦${Number(totalAmount || 0).toLocaleString()}
          </td>
        </tr>
      </table>
    </div>

    <!-- Escrow Protection Guarantee -->
    <div style="background-color: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 14px; padding: 14px 16px; margin-bottom: 24px; text-align: center;">
      <strong style="color: #10b981; font-size: 13px; display: block; margin-bottom: 4px;">🛡️ 100% Escrow Protection Guaranteed</strong>
      <span style="color: #9ca3af; font-size: 12px; line-height: 1.4; display: block;">
        No wahala! Your funds stay securely held in escrow until your package reaches you and you confirm your satisfaction.
      </span>
    </div>

    <!-- Call to Action -->
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${checkoutUrl}" style="display: inline-block; background-color: #e6c367; color: #08090a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 36px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(230, 195, 103, 0.3);">
        Complete Your Order with Escrow &rarr;
      </a>
    </div>

    <p style="color: #6b7280; font-size: 11px; text-align: center; margin: 0;">
      Need help with sizing or delivery options? Tap WhatsApp VIP Concierge below anytime.
    </p>
  `;

  return sendLuxuryEmail(customerEmail, subject, wrapEmailHtml('Cart Reminder', bodyContent));
}
