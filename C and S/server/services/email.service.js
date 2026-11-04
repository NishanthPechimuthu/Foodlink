import '../config/env.js';
import nodemailer from 'nodemailer';
import emailTemplates from '../utils/emailTemplates.js';

/**
 * Brevo SMTP transactional email service.
 *
 * Brevo (formerly Sendinblue) is the only email provider used by this app.
 *
 * Brevo SMTP settings:
 *   Host: smtp-relay.brevo.com
 *   Port: 2525 (STARTTLS; works on Render Free), 587 (STARTTLS), or 465 (TLS)
 *   User: the SMTP login shown in Brevo → Settings → SMTP & API → SMTP
 *         (your Brevo account email or an [ID]@smtp-brevo.com address)
 *   Pass: an SMTP key — NOT a Brevo API key
 *
 * Environment:
 *   BREVO_SMTP_HOST   default smtp-relay.brevo.com
 *   BREVO_SMTP_PORT   default 2525 (Render Free blocks 25/465/587)
 *   BREVO_SMTP_SECURE "true" only for port 465
 *   BREVO_SMTP_USER   Brevo SMTP login
 *   BREVO_SMTP_PASS   Brevo SMTP key
 *   BREVO_FROM        verified sender, e.g. "Food Link <no-reply@yourdomain.com>"
 *   EMAIL_DEV_MODE    "true" logs emails instead of sending; "false" forces real
 *                     delivery even when NODE_ENV is not "production"
 *
 * Render Free:
 *   Port 2525 is the recommended choice because Render Free blocks outbound
 *   traffic on ports 25, 465, and 587. Twilio SMS is unaffected because it uses
 *   HTTPS (port 443).
 */

const clean = (value) => String(value || '').trim();
const stripQuotes = (value) => clean(value).replace(/^['"]|['"]$/g, '');

const brevoHost = clean(process.env.BREVO_SMTP_HOST) || 'smtp-relay.brevo.com';
const brevoPort = Number(clean(process.env.BREVO_SMTP_PORT)) || 2525;
const brevoSecureEnv = clean(process.env.BREVO_SMTP_SECURE).toLowerCase();

// Brevo: 465 = implicit TLS; 2525 and 587 use STARTTLS.
const brevoSecure =
  brevoPort === 465 ? true : [2525, 587].includes(brevoPort) ? false : brevoSecureEnv === 'true';

const brevoUser = stripQuotes(process.env.BREVO_SMTP_USER);
const brevoPass = stripQuotes(process.env.BREVO_SMTP_PASS);
const hasCredentials = Boolean(brevoUser && brevoPass);

const emailDevMode = clean(process.env.EMAIL_DEV_MODE).toLowerCase();

// EMAIL_DEV_MODE is authoritative when explicitly set. This prevents a missing
// NODE_ENV (common when a Render service is created without the Blueprint) from
// silently turning real delivery into console-only "dev" mode.
const isDevMode =
  emailDevMode === 'true' ||
  (emailDevMode !== 'false' && process.env.NODE_ENV !== 'production');

const fromAddress =
  stripQuotes(process.env.BREVO_FROM) ||
  (brevoUser ? `Food Link <${brevoUser}>` : 'Food Link <no-reply@localhost>');

const maskEmail = (email) => {
  const value = clean(email);
  if (!value) return 'unset';

  const [name, domain] = value.split('@');
  if (!domain) return '***';
  return `${name.slice(0, 2)}***@${domain}`;
};

const describeConfig = () => ({
  mode: isDevMode ? 'development (email not sent)' : 'brevo-smtp',
  provider: 'brevo-smtp',
  host: brevoHost,
  port: brevoPort,
  secure: brevoSecure,
  user: brevoUser ? maskEmail(brevoUser) : 'unset',
  credentials: hasCredentials ? 'set' : 'missing',
  from: fromAddress,
  emailDevMode: emailDevMode || 'unset',
  nodeEnv: process.env.NODE_ENV || 'unset',
});

let transporter = null;
if (hasCredentials) {
  transporter = nodemailer.createTransport({
    host: brevoHost,
    port: brevoPort,
    secure: brevoSecure,
    requireTLS: [2525, 587].includes(brevoPort),
    auth: {
      user: brevoUser,
      pass: brevoPass,
    },
    // Fail reasonably fast instead of hanging a request for minutes. The API
    // client times out after 10 seconds, so stay comfortably below that.
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 8_000,
  });
}

const configSummary = describeConfig();
console.log(
  `[Email Service] ${configSummary.mode} | host=${configSummary.host}:${configSummary.port} secure=${configSummary.secure} user=${configSummary.user} credentials=${configSummary.credentials} from=${configSummary.from} emailDevMode=${configSummary.emailDevMode} nodeEnv=${configSummary.nodeEnv}`
);

if (process.env.RENDER && !isDevMode && [25, 465, 587].includes(brevoPort)) {
  console.warn(
    `[Email Service] Render Free blocks outbound SMTP ports 25/465/587. ` +
      `Set BREVO_SMTP_PORT=2525 instead of ${brevoPort}.`
  );
}

if (!isDevMode && !clean(process.env.BREVO_FROM)) {
  console.warn(
    '[Email Service] BREVO_FROM is not set. Brevo requires a verified sender address or domain.'
  );
}

if (brevoPass.startsWith('xkeysib-')) {
  console.warn(
    '[Email Service] BREVO_SMTP_PASS looks like a Brevo API key. Use the SMTP key from ' +
      'Brevo → Settings → SMTP & API → SMTP.'
  );
}

const send = async ({ to, subject, html, text }) => {
  if (!to) return { success: false, mode: 'invalid', error: 'Recipient email is required' };

  if (isDevMode) {
    console.log('────────────────────────────────────────────────────');
    console.log('[Email Service] DEV MODE — email not actually sent');
    console.log(`  To      : ${to}`);
    console.log(`  Subject : ${subject}`);
    console.log('────────────────────────────────────────────────────');
    return { success: true, mode: 'development' };
  }

  if (!transporter) {
    console.error(
      '[Email Service] BREVO_SMTP_USER / BREVO_SMTP_PASS are missing; email not sent. ' +
        'Set the Brevo SMTP credentials, or set EMAIL_DEV_MODE=true for a demo.'
    );
    return {
      success: false,
      mode: 'brevo-smtp',
      error: 'Brevo SMTP is not configured',
    };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      text,
    });

    return { success: true, mode: 'brevo-smtp', id: info.messageId };
  } catch (err) {
    console.error('[Email Service] Brevo SMTP send error:', {
      message: err.message,
      code: err.code,
      command: err.command,
      response: err.response,
    });
    return { success: false, mode: 'brevo-smtp', error: err.message };
  }
};

export const emailService = {
  isDevMode,
  fromAddress,
  describeConfig,

  send,

  /**
   * Open a real Brevo SMTP connection and authenticate. Used by
   * `npm run test:email -- you@example.com` to diagnose delivery problems.
   */
  async verify() {
    if (isDevMode) {
      return {
        success: true,
        mode: 'development',
        message: 'EMAIL_DEV_MODE is active, so emails are logged instead of sent.',
      };
    }

    if (!transporter) {
      return {
        success: false,
        mode: 'brevo-smtp',
        error: 'BREVO_SMTP_USER / BREVO_SMTP_PASS are missing.',
      };
    }

    try {
      await transporter.verify();
      return {
        success: true,
        mode: 'brevo-smtp',
        message: 'Brevo SMTP connection and authentication succeeded.',
      };
    } catch (err) {
      console.error('[Email Service] Brevo SMTP verify error:', {
        message: err.message,
        code: err.code,
        command: err.command,
        response: err.response,
      });
      return {
        success: false,
        mode: 'brevo-smtp',
        error: err.message,
        code: err.code,
        response: err.response,
      };
    }
  },

  async sendVerificationEmail({ to, name, code, expiresMinutes = 10 }) {
    const { subject, html } = emailTemplates.verifyEmail({ name, code, expiresMinutes });
    return send({ to, subject, html });
  },

  async sendPasswordResetEmail({ to, name, resetUrl, expiresMinutes = 15 }) {
    const { subject, html } = emailTemplates.passwordReset({ name, resetUrl, expiresMinutes });
    return send({ to, subject, html });
  },

  async sendDonationCodeEmail({ to, name, listingTitle, donationCode, quantityLabel, expiresAt }) {
    const { subject, html } = emailTemplates.donationCode({
      name,
      listingTitle,
      donationCode,
      quantityLabel,
      expiresAt,
    });
    return send({ to, subject, html });
  },

  async sendCollectionOtpEmail({ to, name, listingTitle, code, expiresMinutes = 10 }) {
    const { subject, html } = emailTemplates.collectionOtp({ name, listingTitle, code, expiresMinutes });
    return send({ to, subject, html });
  },
};

export default emailService;
