import nodemailer from 'nodemailer';
import emailTemplates from '../utils/emailTemplates.js';

/**
 * Gmail SMTP-backed transactional email service.
 *
 * Gmail requires an App Password (not your normal account password):
 *   1. Enable 2-Step Verification on the Google account.
 *   2. Google Account → Security → App passwords → create one for "Mail".
 *   3. Use the 16-character password as SMTP_PASS.
 *
 * Dev / test behaviour:
 *   When SMTP_USER / SMTP_PASS are missing, or EMAIL_DEV_MODE=true, or
 *   NODE_ENV is not "production", emails are logged to the console instead of
 *   being sent. This lets the whole verification flow be tested locally.
 *
 * Required production env:
 *   SMTP_USER     you@gmail.com
 *   SMTP_PASS     16-character Gmail App Password
 *   EMAIL_FROM    optional, defaults to "Food Link <SMTP_USER>"; must be the
 *                 Gmail address or a verified "Send mail as" alias
 *
 * Optional env:
 *   SMTP_HOST     default smtp.gmail.com
 *   SMTP_PORT     default 587 (use 465 with SMTP_SECURE=true)
 *   SMTP_SECURE   "true" for implicit TLS on port 465
 */

const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS?.trim();
const hasCredentials = Boolean(smtpUser && smtpPass);

const fromAddress =
  process.env.EMAIL_FROM?.trim() ||
  (smtpUser ? `Food Link <${smtpUser}>` : 'Food Link <no-reply@localhost>');

const isDevMode =
  process.env.EMAIL_DEV_MODE === 'true' ||
  process.env.NODE_ENV !== 'production';

let transporter = null;
if (hasCredentials) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
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
    console.error('[Email Service] SMTP_USER / SMTP_PASS are missing in production; email not sent.');
    return { success: false, mode: 'smtp', error: 'Email provider is not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      text,
    });

    return { success: true, mode: 'smtp', id: info.messageId };
  } catch (err) {
    console.error('[Email Service] SMTP send error:', err.message);
    return { success: false, mode: 'smtp', error: err.message };
  }
};

export const emailService = {
  isDevMode,
  fromAddress,

  send,

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
