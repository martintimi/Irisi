// Automated Transactional SMS Notification Service for ÌRÍSÍ Marketplace
// Supports Termii (DND Transactional Route for Nigeria/West Africa) and Twilio (Global & Pan-African Gateway)

export interface SmsPayload {
  to: string;
  message: string;
  channel?: 'generic' | 'dnd' | 'whatsapp';
}

export interface PasswordResetSmsPayload {
  phone: string;
  otpCode: string;
  accountName?: string;
}

export interface SmsDispatchResult {
  success: boolean;
  provider: 'termii' | 'twilio' | 'none';
  error?: string;
}

// Known African & international country dial codes (without leading +)
const KNOWN_COUNTRY_CODES = [
  '234', '233', '254', '27', '250', '221', '225', '255', '256', '237',
  '20', '251', '212', '229', '228', '260', '263', '267', '264', '244',
  '243', '230', '232', '231', '220', '44', '1',
];

/**
 * Normalizes any African or international phone number to E.164 digits without leading '+'
 * Preserves existing country codes (+233, +254, +27, +250, +44, +1, etc.).
 * Only defaults local 0-prefixed 11-digit numbers to 234 when no explicit dial code is given.
 */
export function normalizePhoneNumber(rawPhone: string, defaultDialCode = '234'): string {
  const trimmed = (rawPhone || '').trim();
  if (!trimmed) return '';

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';

  // Explicit international prefix (+ or 00)
  if (hasPlus) return digits;
  if (digits.startsWith('00') && digits.length >= 11) return digits.slice(2);

  // Already starts with a known country dial code & has realistic length
  for (const cc of KNOWN_COUNTRY_CODES) {
    if (digits.startsWith(cc) && digits.length >= cc.length + 7 && digits.length <= cc.length + 11) {
      return digits;
    }
  }

  const cleanDefault = defaultDialCode.replace(/\D/g, '') || '234';

  // Local leading 0 (e.g. 08012345678 -> 2348012345678, or 0241234567 with default 233 -> 233241234567)
  if (digits.startsWith('0') && digits.length >= 9 && digits.length <= 11) {
    return cleanDefault + digits.slice(1);
  }

  // 10-digit local number without leading 0
  if (digits.length === 10) {
    return cleanDefault + digits;
  }

  return digits;
}

/**
 * Dispatches an SMS via Termii using the DND transactional channel first (to bypass Nigerian DND blocks),
 * with an automatic fallback to 'generic' if the DND Sender ID is still pending approval.
 */
async function sendViaTermii(
  phone: string,
  text: string,
  preferredChannel?: 'generic' | 'dnd' | 'whatsapp'
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.TERMII_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'TERMII_API_KEY is not configured' };
  }

  const senderId = process.env.TERMII_SENDER_ID || 'IRISI';
  const configuredChannel = (process.env.TERMII_CHANNEL as 'dnd' | 'generic' | undefined) || preferredChannel || 'dnd';
  const formattedPhone = normalizePhoneNumber(phone);
  if (!formattedPhone) {
    return { success: false, error: 'Invalid phone number' };
  }

  const attemptSend = async (channel: 'dnd' | 'generic' | 'whatsapp') => {
    const response = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: formattedPhone,
        from: senderId,
        sms: text,
        type: 'plain',
        channel,
        api_key: apiKey,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok && (data.message === 'Successfully Sent' || data.code === 'ok' || data.message_id)) {
      console.log(`[SMS DISPATCH] ✅ Termii (${channel}) delivered to ${formattedPhone}`);
      return { success: true as const };
    }
    return { success: false as const, error: data.message || `Termii ${channel} failed` };
  };

  try {
    const primary = await attemptSend(configuredChannel);
    if (primary.success) return primary;

    // If DND failed (e.g. Sender ID still awaiting NCC DND approval), fallback to generic channel
    if (configuredChannel === 'dnd') {
      console.warn(`[SMS DISPATCH] ⚠️ Termii DND failed (${primary.error}), retrying generic channel...`);
      const fallback = await attemptSend('generic');
      if (fallback.success) return fallback;
      return fallback;
    }

    return primary;
  } catch (err: any) {
    console.error('[SMS DISPATCH] ❌ Termii network error:', err?.message);
    return { success: false, error: err?.message || 'Termii network error' };
  }
}

/**
 * Dispatches an SMS via Twilio (Global & Pan-African backup / primary for non-NG numbers)
 */
async function sendViaTwilio(phone: string, text: string): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: 'Twilio credentials not configured' };
  }

  const formattedPhone = '+' + normalizePhoneNumber(phone);

  try {
    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const params = new URLSearchParams();
    params.append('To', formattedPhone);
    params.append('From', fromNumber);
    params.append('Body', text);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    const data = await response.json().catch(() => ({}));
    if (response.ok && data.sid) {
      console.log(`[SMS DISPATCH] ✅ Twilio delivered to ${formattedPhone}`);
      return { success: true };
    }

    console.warn('[SMS DISPATCH] ⚠️ Twilio returned error:', data);
    return { success: false, error: data.message || 'Twilio delivery failed' };
  } catch (err: any) {
    console.error('[SMS DISPATCH] ❌ Twilio network error:', err?.message);
    return { success: false, error: err?.message || 'Twilio network error' };
  }
}

/**
 * Core resilient transactional SMS router:
 * - Uses Termii (DND -> generic fallback) first for Nigerian/West African numbers when configured.
 * - Uses Twilio automatically for other international numbers or as seamless fallback.
 */
export async function sendTransactionalSms(payload: SmsPayload): Promise<SmsDispatchResult> {
  const { to, message, channel } = payload;
  if (!to || !message) {
    return { success: false, provider: 'none', error: 'Missing recipient phone or message' };
  }

  const normalized = normalizePhoneNumber(to);
  if (!normalized || normalized.length < 9) {
    return { success: false, provider: 'none', error: 'Invalid phone number format' };
  }

  const preferTermii = normalized.startsWith('234') || normalized.startsWith('233') || normalized.startsWith('254');

  if (preferTermii && process.env.TERMII_API_KEY) {
    const termiiRes = await sendViaTermii(normalized, message, channel || 'dnd');
    if (termiiRes.success) return { success: true, provider: 'termii' };
  }

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    const twilioRes = await sendViaTwilio(normalized, message);
    if (twilioRes.success) return { success: true, provider: 'twilio' };
  }

  // Fallback to Termii for international if Twilio isn't configured
  if (!preferTermii && process.env.TERMII_API_KEY) {
    const termiiRes = await sendViaTermii(normalized, message, channel || 'generic');
    if (termiiRes.success) return { success: true, provider: 'termii' };
  }

  return {
    success: false,
    provider: 'none',
    error: 'No SMS gateway credentials configured (add TERMII_API_KEY or TWILIO_* in env)',
  };
}

/**
 * 1. Password Reset / Auth 6-Digit OTP SMS
 */
export async function sendPasswordResetSms(payload: PasswordResetSmsPayload): Promise<SmsDispatchResult> {
  const { phone, otpCode } = payload;
  if (!phone || !otpCode) {
    return { success: false, provider: 'none', error: 'Missing phone number or OTP code' };
  }
  return sendTransactionalSms({
    to: phone,
    channel: 'dnd',
    message: `IRISI Security: Your verification code is ${otpCode}. Valid for 15 minutes. Never share this code.`,
  });
}

/**
 * 2. Vendor: New Paid Order Received (High-Priority!)
 */
export async function sendVendorNewOrderSms(params: {
  phone: string;
  brandName: string;
  orderNumber: string;
  amountNgn: number;
  itemCount: number;
  dispatchNote?: string;
}): Promise<SmsDispatchResult> {
  const { phone, brandName, orderNumber, amountNgn, itemCount, dispatchNote } = params;
  const amt = Math.round(amountNgn).toLocaleString();
  const suffix = dispatchNote ? ` ${dispatchNote}.` : ' Open your Vendor Portal to pack & dispatch.';
  return sendTransactionalSms({
    to: phone,
    channel: 'dnd',
    message: `IRISI PAID ORDER: ${brandName}, new order #${orderNumber} (${itemCount} item${itemCount > 1 ? 's' : ''}, NGN ${amt}) is escrow-secured.${suffix} irisimi.ng/vendor-portal/orders`,
  });
}

/**
 * 3. Buyer: Order Paid & Escrow Locked Confirmation
 */
export async function sendBuyerOrderConfirmedSms(params: {
  phone: string;
  customerName: string;
  orderNumber: string;
  amountNgn: number;
}): Promise<SmsDispatchResult> {
  const { phone, customerName, orderNumber, amountNgn } = params;
  const firstName = (customerName || 'Shopper').split(' ')[0];
  const amt = Math.round(amountNgn).toLocaleString();
  return sendTransactionalSms({
    to: phone,
    channel: 'dnd',
    message: `IRISI: Hi ${firstName}, order #${orderNumber} (NGN ${amt}) is confirmed & 100% escrow-protected. Track live at irisimi.ng/track-order`,
  });
}

/**
 * 4. Buyer: Order Dispatched / Waybill Ready
 */
export async function sendBuyerOrderDispatchedSms(params: {
  phone: string;
  customerName: string;
  orderNumber: string;
  waybillInfo?: string;
}): Promise<SmsDispatchResult> {
  const { phone, customerName, orderNumber, waybillInfo } = params;
  const firstName = (customerName || 'Shopper').split(' ')[0];
  const tracking = waybillInfo ? ` (${waybillInfo})` : '';
  return sendTransactionalSms({
    to: phone,
    channel: 'dnd',
    message: `IRISI Dispatch: Hi ${firstName}, your order #${orderNumber} is on its way${tracking}. Track live: irisimi.ng/track-order`,
  });
}

/**
 * 5. Buyer: Order Delivered — 48h Escrow Inspection Prompt
 */
export async function sendBuyerOrderDeliveredSms(params: {
  phone: string;
  customerName: string;
  orderNumber: string;
}): Promise<SmsDispatchResult> {
  const { phone, customerName, orderNumber } = params;
  const firstName = (customerName || 'Shopper').split(' ')[0];
  return sendTransactionalSms({
    to: phone,
    channel: 'dnd',
    message: `IRISI Delivered: Hi ${firstName}, order #${orderNumber} has arrived! Inspect within 48h & approve release (or report an issue) at irisimi.ng/track-order`,
  });
}

/**
 * 6. Vendor: Escrow Payout Released
 */
export async function sendVendorPayoutReleasedSms(params: {
  phone: string;
  brandName: string;
  orderNumber: string;
  payoutAmountNgn: number;
}): Promise<SmsDispatchResult> {
  const { phone, brandName, orderNumber, payoutAmountNgn } = params;
  const amt = Math.round(payoutAmountNgn).toLocaleString();
  return sendTransactionalSms({
    to: phone,
    channel: 'dnd',
    message: `IRISI Payout: ${brandName}, buyer approved order #${orderNumber}! NGN ${amt} has been released to your settlement treasury.`,
  });
}
