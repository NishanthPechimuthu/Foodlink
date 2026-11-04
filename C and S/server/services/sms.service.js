import twilio from 'twilio';

/**
 * Twilio SMS service.
 *
 * Required production env (either a phone number or a messaging service SID):
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_PHONE_NUMBER          e.g. +12025550123
 *   TWILIO_MESSAGING_SERVICE_SID (optional, preferred when set)
 *
 * Dev / test behaviour:
 *   When credentials are missing, or SMS_DEV_MODE=true, or NODE_ENV is not
 *   "production", messages are logged instead of sent.
 */

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim();
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();

const hasCredentials = Boolean(accountSid && authToken && (fromNumber || messagingServiceSid));

const isDevMode =
  process.env.SMS_DEV_MODE === 'true' ||
  process.env.NODE_ENV !== 'production';

let twilioClient = null;
if (hasCredentials) {
  twilioClient = twilio(accountSid, authToken);
}

/**
 * Convert common Indian / international formats to E.164.
 * Twilio rejects numbers without a country code.
 */
export const normalizePhoneNumber = (phone) => {
  const raw = String(phone || '').trim();
  if (!raw) return '';

  if (raw.startsWith('+')) {
    return `+${raw.slice(1).replace(/\D/g, '')}`;
  }

  const digits = raw.replace(/\D/g, '');

  // 10-digit local Indian mobile number
  if (digits.length === 10) return `+91${digits}`;
  // 91XXXXXXXXXX
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  // 0XXXXXXXXXX (trunk prefix)
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;

  return `+${digits}`;
};

const sendSms = async (to, body) => {
  const normalized = normalizePhoneNumber(to);
  if (!normalized) {
    return { success: false, mode: 'invalid', error: 'A phone number is required' };
  }

  if (isDevMode) {
    console.log('────────────────────────────────────────────────────');
    console.log('[SMS Service] DEV MODE — SMS not actually sent');
    console.log(`  To   : ${normalized}`);
    console.log(`  Body : ${body}`);
    console.log('────────────────────────────────────────────────────');
    return { success: true, mode: 'development', to: normalized };
  }

  if (!twilioClient) {
    console.error('[SMS Service] Twilio credentials are missing in production; SMS not sent.');
    return { success: false, mode: 'twilio', error: 'SMS provider is not configured' };
  }

  try {
    const payload = { to: normalized, body };
    if (messagingServiceSid) {
      payload.messagingServiceSid = messagingServiceSid;
    } else {
      payload.from = fromNumber;
    }

    const message = await twilioClient.messages.create(payload);
    return { success: true, mode: 'twilio', to: normalized, sid: message.sid };
  } catch (err) {
    console.error('[SMS Service] Twilio send error:', err.message);
    return { success: false, mode: 'twilio', error: err.message };
  }
};

export const smsService = {
  isDevMode,
  normalizePhoneNumber,
  sendSms,
};

export default smsService;
