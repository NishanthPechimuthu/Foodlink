import '../config/env.js';
import nodemailer from 'nodemailer';
import emailTemplates from '../utils/emailTemplates.js';

/**
 * Transactional email service with two delivery backends:
 *
 *   Primary:   Resend HTTPS API (port 443) — works on Render Free.
 *   Fallback:  Gmail SMTP (ports 465/587) — local / paid Render instances.
 *
 * EMAIL_PROVIDER:
 *   resend (default) = Resend primary, Gmail SMTP fallback
 *   auto             = Resend when RESEND_API_KEY is set, else Gmail SMTP
 *   smtp             = Gmail SMTP only
 *
 * If Resend is configured but fails, delivery automatically retries via SMTP
 * when SMTP credentials are present.
 *
 * Gmail SMTP requires an App Password (not your normal account password):
 *   1. Enable 2-Step Verification on the Google account.
 *   2. Google Account → Security → App passwords → create one for "Mail".
 *   3. Use the 16-character password as SMTP_PASS.
 *
 * Gmail SMTP environment:
 *   SMTP_USER      you@gmail.com
 *   SMTP_PASS      16-character Gmail App Password
 *   SMTP_HOST      default smtp.gmail.com
 *   SMTP_PORT      default 587 (use 465 with SMTP_SECURE=true)
 *   SMTP_SECURE    "true" for implicit TLS on port 465
 *
 * Resend environment:
 *   RESEND_API_KEY re_...
 *   RESEND_FROM    optional; falls back to EMAIL_FROM
 *                  For testing, use "Food Link <onboarding@resend.dev>",
 *                  which can only send to the Resend account owner.
 *                  For real recipients, verify a domain in Resend and use
 *                  "Food Link <no-reply@yourdomain.com>".
 *
 * Shared:
 *   EMAIL_FROM      optional SMTP sender; defaults to SMTP_USER
 *   EMAIL_DEV_MODE  "true" logs emails instead of sending; "false" forces real
 *                   delivery even when NODE_ENV is not "production"
 *
 * IMPORTANT — Render Free plan:
 *   Render blocks outbound traffic on ports 25, 465, and 587 for Free web
 *   services. Resend works because it uses HTTPS (port 443).
 */

const clean = (value) => String(value || '').trim();
const stripQuotes = (value) => clean(value).replace(/^['"]|['"]$/g, '');

// Gmail App Passwords are often displayed in four groups of four characters.
// Gmail ignores the spaces, but copying them into an env var can cause auth
// failures in some environments, so normalise them away.
const normalizeAppPassword = (value) => stripQuotes(value).replace(/\s+/g, '');

const smtpHost = clean(process.env.SMTP_HOST) || 'smtp.gmail.com';
const smtpPort = Number(clean(process.env.SMTP_PORT)) || 587;
const smtpSecureEnv = clean(process.env.SMTP_SECURE).toLowerCase();

// Gmail: 465 = implicit TLS, 587 = STARTTLS. Never use secure=true on 587.
const smtpSecure =
  smtpPort === 465 ? true : smtpPort === 587 ? false : smtpSecureEnv === 'true';

const smtpUser = stripQuotes(process.env.SMTP_USER);
const smtpPass = normalizeAppPassword(process.env.SMTP_PASS);
const hasSmtpCredentials = Boolean(smtpUser && smtpPass);

const resendApiKey = stripQuotes(process.env.RESEND_API_KEY);
const hasResendKey = Boolean(resendApiKey);

const emailProviderEnv = clean(process.env.EMAIL_PROVIDER).toLowerCase();
const requestedProvider = ['smtp', 'resend', 'auto'].includes(emailProviderEnv)
  ? emailProviderEnv
  : 'resend';

// Resend is always the primary provider when configured. SMTP is kept as a
// fallback so a Resend outage, bad key, or unverified sender does not take email
// delivery down on a paid/local deployment.
const providerChain = [];
if (requestedProvider === 'smtp') {
  if (hasSmtpCredentials) providerChain.push('smtp');
} else {
  if (hasResendKey) providerChain.push('resend');
  if (hasSmtpCredentials) providerChain.push('smtp');
}
const provider = providerChain[0] || 'missing';

const emailDevMode = clean(process.env.EMAIL_DEV_MODE).toLowerCase();

// EMAIL_DEV_MODE is authoritative when explicitly set. This prevents a missing
// NODE_ENV (common when a Render service is created without the Blueprint) from
// silently turning real delivery into console-only "dev" mode.
const isDevMode =
  emailDevMode === 'true' ||
  (emailDevMode !== 'false' && process.env.NODE_ENV !== 'production');

const smtpFromAddress =
  stripQuotes(process.env.EMAIL_FROM) ||
  (smtpUser ? `Food Link <${smtpUser}>` : 'Food Link <no-reply@localhost>');

const resendFromAddress =
  stripQuotes(process.env.RESEND_FROM) ||
  stripQuotes(process.env.EMAIL_FROM) ||
  'Food Link <onboarding@resend.dev>';

const fromAddress = provider === 'resend' ? resendFromAddress : smtpFromAddress;

const maskEmail = (email) => {
  const value = clean(email);
  if (!value) return 'unset';

  const [name, domain] = value.split('@');
  if (!domain) return '***';
  return `${name.slice(0, 2)}***@${domain}`;
};

const describeConfig = () => ({
  mode: isDevMode ? 'development (email not sent)' : provider,
  requestedProvider,
  provider,
  fallback: providerChain.slice(1),
  providerChain,
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  smtpUser: smtpUser ? maskEmail(smtpUser) : 'unset',
  smtpCredentials: hasSmtpCredentials ? 'set' : 'missing',
  resendKey: hasResendKey ? 'set' : 'missing',
  from: fromAddress,
  smtpFrom: smtpFromAddress,
  resendFrom: resendFromAddress,
  emailDevMode: emailDevMode || 'unset',
  nodeEnv: process.env.NODE_ENV || 'unset',
});

let transporter = null;
if (providerChain.includes('smtp')) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    requireTLS: smtpPort === 587,
    auth: {
      user: smtpUser,
      pass: smtpPass,
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
  `[Email Service] ${configSummary.mode} | provider=${configSummary.provider} fallback=${
    configSummary.fallback.join(',') || 'none'
  } smtp=${configSummary.smtpUser} resendKey=${configSummary.resendKey} from=${
    configSummary.from
  } emailDevMode=${configSummary.emailDevMode} nodeEnv=${configSummary.nodeEnv}`
);

if (process.env.RENDER && !isDevMode && configSummary.provider === 'smtp') {
  console.warn(
    '[Email Service] Reminder: Render Free web services block outbound SMTP ports 25/465/587. ' +
      'Set RESEND_API_KEY so Resend can be used, or upgrade the API service to a paid instance.'
  );
}

if (providerChain.includes('resend') && !isDevMode && /@gmail\.com/i.test(resendFromAddress)) {
  console.warn(
    '[Email Service] Resend cannot send from an @gmail.com address unless that domain is verified. ' +
      'Set RESEND_FROM to a verified Resend sender/domain.'
  );
}

const sendViaResend = async ({ to, subject, html, text }) => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendFromAddress,
        to: [to],
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[Email Service] Resend API error:', {
        status: response.status,
        message: payload.message || payload.error || 'Unknown Resend error',
      });
      return {
        success: false,
        mode: 'resend',
        status: response.status,
        error: payload.message || payload.error || `Resend API returned ${response.status}`,
      };
    }

    return { success: true, mode: 'resend', id: payload.id };
  } catch (err) {
    console.error('[Email Service] Resend request failed:', {
      message: err.message,
      name: err.name,
    });
    return { success: false, mode: 'resend', error: err.message };
  }
};

const sendViaSmtp = async ({ to, subject, html, text }) => {
  if (!transporter) {
    return { success: false, mode: 'smtp', error: 'SMTP transport is not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: smtpFromAddress,
      to,
      subject,
      html,
      text,
    });

    return { success: true, mode: 'smtp', id: info.messageId };
  } catch (err) {
    console.error('[Email Service] SMTP send error:', {
      message: err.message,
      code: err.code,
      command: err.command,
      response: err.response,
    });
    return { success: false, mode: 'smtp', error: err.message };
  }
};

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

  if (providerChain.length === 0) {
    console.error(
      '[Email Service] No email provider is configured. Set RESEND_API_KEY, ' +
        'SMTP_USER/SMTP_PASS, or EMAIL_DEV_MODE=true for a demo.'
    );
    return {
      success: false,
      mode: 'missing',
      error: 'Email provider is not configured',
    };
  }

  const attempts = [];

  for (const mode of providerChain) {
    const result =
      mode === 'resend'
        ? await sendViaResend({ to, subject, html, text })
        : await sendViaSmtp({ to, subject, html, text });

    if (result.success) {
      if (attempts.length > 0) {
        console.warn(
          `[Email Service] ${attempts.map((attempt) => attempt.mode).join(', ')} failed; delivered via ${mode}.`
        );
        return { ...result, fallbackFrom: attempts[0].mode };
      }
      return result;
    }

    attempts.push(result);

    if (attempts.length < providerChain.length) {
      console.warn(`[Email Service] ${mode} delivery failed; trying fallback...`);
    }
  }

  const lastAttempt = attempts[attempts.length - 1];
  return { ...lastAttempt, attempts };
};

export const emailService = {
  isDevMode,
  fromAddress,
  describeConfig,

  send,

  /**
   * Check the primary provider. For SMTP this opens a real connection and
   * authenticates. For Resend it validates that the API key is present;
   * `npm run test:email` then sends a real message to confirm delivery and
   * exercise the SMTP fallback if needed.
   */
  async verify() {
    if (isDevMode) {
      return {
        success: true,
        mode: 'development',
        message: 'EMAIL_DEV_MODE is active, so emails are logged instead of sent.',
      };
    }

    if (provider === 'resend') {
      if (!hasResendKey) {
        return { success: false, mode: 'resend', error: 'RESEND_API_KEY is missing.' };
      }
      return {
        success: true,
        mode: 'resend',
        fallback: providerChain.slice(1),
        message: 'RESEND_API_KEY is set. Run the test email to confirm delivery.',
      };
    }

    if (provider === 'smtp') {
      if (!transporter) {
        return { success: false, mode: 'smtp', error: 'SMTP transport is not configured.' };
      }

      try {
        await transporter.verify();
        return { success: true, mode: 'smtp', message: 'SMTP connection and authentication succeeded.' };
      } catch (err) {
        console.error('[Email Service] SMTP verify error:', {
          message: err.message,
          code: err.code,
          command: err.command,
          response: err.response,
        });
        return {
          success: false,
          mode: 'smtp',
          error: err.message,
          code: err.code,
          response: err.response,
        };
      }
    }

    return {
      success: false,
      mode: 'missing',
      error: 'No email provider is configured. Set RESEND_API_KEY or SMTP credentials.',
    };
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
