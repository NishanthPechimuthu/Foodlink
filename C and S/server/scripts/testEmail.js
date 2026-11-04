import '../config/env.js';
import emailService from '../services/email.service.js';

/**
 * Diagnose Brevo SMTP configuration and send a real test email.
 *
 * Usage:
 *   npm run test:email -- you@example.com
 *
 * This uses exactly the same env vars and email service as registration,
 * password reset, and OTP delivery.
 */

const to = process.argv[2];

if (!to || !/^\S+@\S+\.\S+$/.test(to)) {
  console.error('Usage: npm run test:email -- recipient@example.com');
  process.exit(1);
}

console.log('[Email Test] Effective configuration:', emailService.describeConfig());

const verifyResult = await emailService.verify();
console.log('[Email Test] Brevo SMTP verify:', verifyResult);

if (!verifyResult.success) {
  console.error('[Email Test] Brevo SMTP connection/authentication failed. The test email was not sent.');
  process.exit(1);
}

const sendResult = await emailService.send({
  to,
  subject: 'Food Link Brevo SMTP test',
  text: 'This is a test email from Food Link. If you received it, Brevo SMTP delivery is working.',
  html: `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="color:#4E342E;">Food Link Brevo SMTP test</h2>
      <p>This is a test email from your Food Link server.</p>
      <p>If you received it, the configured Brevo SMTP settings are working.</p>
    </div>
  `,
});

console.log('[Email Test] Send result:', sendResult);

if (!sendResult.success) {
  console.error('[Email Test] The test email could not be sent.');
  process.exit(1);
}

console.log(`[Email Test] Test email accepted for delivery to ${to}.`);
