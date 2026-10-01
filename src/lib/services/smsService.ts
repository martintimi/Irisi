// Automated SMS Notification Service for ÌRÍSÍ Marketplace
// Supports Termii (Primary Nigerian SMS Gateway) and Twilio (Global SMS Gateway)

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

/**
 * Normalizes any Nigerian or international phone number to standard international format (e.g. 2348012345678)
 */
export function normalizePhoneNumber(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('234') && digits.length >= 12) {
    return digits;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return '234' + digits.slice(1);
  }
  if (digits.length === 10) {
    return '234' + digits;
  }
  return digits;
}

/**
 * Dispatches an SMS message using Termii (Nigeria's leading SMS provider)
 */
async function sendViaTermii(phone: string, text: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.TERMII_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'TERMII_API_KEY is not configured in .env.local' };
  }

  const senderId = process.env.TERMII_SENDER_ID || 'IRISI';
  const formattedPhone = normalizePhoneNumber(phone);

  try {
    const response = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        from: senderId,
        sms: text,
        type: 'plain',
        channel: 'generic',
        api_key: apiKey,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok && (data.message === 'Successfully Sent' || data.code === 'ok' || data.message_id)) {
      console.log(`[SMS DISPATCH] ✅ Termii SMS successfully delivered to ${formattedPhone}`);
      return { success: true };
    }

    console.warn(`[SMS DISPATCH] ⚠️ Termii returned response:`, data);
    return { success: false, error: data.message || 'Termii delivery failed' };
  } catch (err: any) {
    console.error(`[SMS DISPATCH] ❌ Termii network error:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Dispatches an SMS message using Twilio
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
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    const data = await response.json().catch(() => ({}));
    if (response.ok && data.sid) {
      console.log(`[SMS DISPATCH] ✅ Twilio SMS successfully delivered to ${formattedPhone}`);
      return { success: true };
    }

    console.warn(`[SMS DISPATCH] ⚠️ Twilio returned error:`, data);
    return { success: false, error: data.message || 'Twilio delivery failed' };
  } catch (err: any) {
    console.error(`[SMS DISPATCH] ❌ Twilio network error:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Dispatches a password recovery 6-digit OTP code to the user's mobile phone via SMS
 */
export async function sendPasswordResetSms(payload: PasswordResetSmsPayload): Promise<{
  success: boolean;
  provider: 'termii' | 'twilio' | 'none';
  error?: string;
}> {
  const { phone, otpCode } = payload;
  if (!phone || !otpCode) {
    return { success: false, provider: 'none', error: 'Missing phone number or OTP code' };
  }

  const smsText = `ÌRÍSÍ Security: Your password recovery verification code is ${otpCode}. Valid for 15 minutes. Never share this code with anyone.`;

  // 1. Try Termii first (optimal for Nigerian networks: MTN, Airtel, Glo, 9mobile)
  if (process.env.TERMII_API_KEY) {
    const termiiRes = await sendViaTermii(phone, smsText);
    if (termiiRes.success) {
      return { success: true, provider: 'termii' };
    }
  }

  // 2. Try Twilio if configured
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilioRes = await sendViaTwilio(phone, smsText);
    if (twilioRes.success) {
      return { success: true, provider: 'twilio' };
    }
  }

  console.log(`[SMS DISPATCH] ℹ️ SMS requested for ${phone} with code ${otpCode}, but no SMS gateway API keys (TERMII_API_KEY or TWILIO) configured in .env.local.`);
  return {
    success: false,
    provider: 'none',
    error: 'No SMS gateway configured in .env.local',
  };
}
