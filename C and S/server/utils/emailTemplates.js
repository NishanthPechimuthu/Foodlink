/**
 * Food Link transactional email templates.
 *
 * Colours mirror the client Tailwind theme (client/tailwind.config.js):
 *   cream      #F8F4E7 / #FDFBF7
 *   chocolate  #4E342E
 *   burntOrange#CC5500
 *   mutedGreen #2E7D32
 *   softRed    #D32F2F
 *
 * Written with table-based layout and inline styles for broad email
 * client support (Gmail, Outlook, Apple Mail, mobile clients).
 */

const BRAND = {
  cream: '#F8F4E7',
  creamLight: '#FDFBF7',
  white: '#FFFFFF',
  chocolate: '#4E342E',
  chocolateSoft: '#6D4C41',
  chocolateMuted: '#8D6E63',
  orange: '#CC5500',
  orangeSoft: '#FFF3E8',
  green: '#2E7D32',
  greenSoft: '#E8F5E9',
  red: '#D32F2F',
  border: '#E8DBC0',
};

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });

const layout = ({ preheader = '', eyebrow = '', heading, intro = '', content = '', footerNote = '' }) => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${BRAND.cream};font-family:'Nunito Sans',Arial,Helvetica,sans-serif;color:${BRAND.chocolate};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.cream};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:${BRAND.white};border:1px solid ${BRAND.border};border-radius:24px;overflow:hidden;">
            <!-- Brand header -->
            <tr>
              <td style="background-color:${BRAND.chocolate};padding:26px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:${BRAND.creamLight};letter-spacing:-0.3px;">
                      🍲 Food Link
                    </td>
                    <td align="right" style="font-size:11px;color:${BRAND.border};letter-spacing:1.4px;text-transform:uppercase;">
                      Good food deserves another chance
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:36px 32px 12px 32px;">
                ${
                  eyebrow
                    ? `<p style="margin:0 0 10px 0;font-size:11px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:${BRAND.orange};">${escapeHtml(
                        eyebrow
                      )}</p>`
                    : ''
                }
                <h1 style="margin:0 0 14px 0;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:26px;line-height:34px;font-weight:800;color:${BRAND.chocolate};letter-spacing:-0.4px;">
                  ${escapeHtml(heading)}
                </h1>
                ${
                  intro
                    ? `<p style="margin:0 0 22px 0;font-size:15px;line-height:24px;color:${BRAND.chocolateSoft};">${intro}</p>`
                    : ''
                }
                ${content}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:24px 32px 32px 32px;">
                <div style="height:1px;background-color:${BRAND.border};margin-bottom:20px;"></div>
                <p style="margin:0 0 10px 0;font-size:12px;line-height:19px;color:${BRAND.chocolateMuted};">
                  ${footerNote || 'You are receiving this email because of activity on your Food Link account.'}
                </p>
                <p style="margin:0;font-size:12px;line-height:19px;color:${BRAND.chocolateMuted};">
                  Need help? Reply to this email or contact the Food Link community team.
                </p>
                <p style="margin:16px 0 0 0;font-size:11px;color:${BRAND.chocolateMuted};">
                  © ${new Date().getFullYear()} Food Link · Community Food Rescue Platform
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const codeBox = (code, { label = 'Your verification code', tone = 'orange' } = {}) => {
  const colors =
    tone === 'green'
      ? { bg: BRAND.greenSoft, border: BRAND.green, text: BRAND.green }
      : { bg: BRAND.orangeSoft, border: BRAND.orange, text: BRAND.orange };

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;">
    <tr>
      <td align="center" style="background-color:${colors.bg};border:1px dashed ${colors.border};border-radius:18px;padding:22px 16px;">
        <p style="margin:0 0 8px 0;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:${colors.text};">
          ${escapeHtml(label)}
        </p>
        <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:38px;line-height:44px;font-weight:700;letter-spacing:10px;color:${BRAND.chocolate};">
          ${escapeHtml(code)}
        </p>
      </td>
    </tr>
  </table>`;
};

const button = (href, label) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;">
    <tr>
      <td align="center" style="background-color:${BRAND.orange};border-radius:14px;">
        <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"
           style="display:inline-block;padding:15px 30px;font-family:'Poppins',Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:${BRAND.white};text-decoration:none;border-radius:14px;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;

const note = (text, tone = 'neutral') => {
  const colors =
    tone === 'green'
      ? { bg: BRAND.greenSoft, border: BRAND.green, text: BRAND.green }
      : tone === 'red'
        ? { bg: '#FFEBEE', border: BRAND.red, text: BRAND.red }
        : { bg: BRAND.cream, border: BRAND.border, text: BRAND.chocolateSoft };

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
    <tr>
      <td style="background-color:${colors.bg};border-left:4px solid ${colors.border};border-radius:10px;padding:14px 16px;">
        <p style="margin:0;font-size:13px;line-height:20px;color:${colors.text};">${text}</p>
      </td>
    </tr>
  </table>`;
};

export const emailTemplates = {
  verifyEmail({ name, code, expiresMinutes = 10 }) {
    return {
      subject: `Your Food Link verification code: ${code}`,
      html: layout({
        preheader: `Use code ${code} to activate your Food Link account.`,
        eyebrow: 'Account verification',
        heading: `Welcome, ${name} 👋`,
        intro:
          'You are one step away from joining the community that rescues surplus food. Enter the code below to activate your Food Link account.',
        content: `
          ${codeBox(code)}
          ${note(
            `This code expires in <strong>${expiresMinutes} minutes</strong> and can only be used once. If you did not create a Food Link account, you can safely ignore this email.`,
            'neutral'
          )}
        `,
        footerNote:
          'For your security, Food Link will never ask you to share this code over the phone or in chat.',
      }),
    };
  },

  passwordReset({ name, resetUrl, expiresMinutes = 15 }) {
    return {
      subject: 'Reset your Food Link password',
      html: layout({
        preheader: 'Use the secure link inside to choose a new password.',
        eyebrow: 'Password reset',
        heading: 'Reset your password',
        intro: `Hi ${name}, we received a request to reset the password for your Food Link account. Choose a new password using the button below.`,
        content: `
          ${button(resetUrl, 'Choose a new password')}
          ${note(
            `This link expires in <strong>${expiresMinutes} minutes</strong> and can only be used once.`,
            'neutral'
          )}
          <p style="margin:0 0 8px 0;font-size:12px;line-height:19px;color:${BRAND.chocolateMuted};">
            If the button does not work, copy and paste this link into your browser:
          </p>
          <p style="margin:0 0 20px 0;font-size:12px;line-height:19px;word-break:break-all;color:${BRAND.orange};">
            ${escapeHtml(resetUrl)}
          </p>
          ${note(
            'If you did not request a password reset, no action is needed. Your current password will remain active.',
            'red'
          )}
        `,
        footerNote: 'For your security, this link can only be used once.',
      }),
    };
  },

  donationCode({ name, listingTitle, donationCode, quantityLabel, expiresAt }) {
    const expiry = expiresAt
      ? new Date(expiresAt).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : null;

    return {
      subject: `Your donation handover code for "${listingTitle}"`,
      html: layout({
        preheader: `Handover code ${donationCode} for ${listingTitle}.`,
        eyebrow: 'Donation handover',
        heading: 'Your donation code is ready',
        intro: `Hi ${name}, your listing <strong>${escapeHtml(
          listingTitle
        )}</strong> has passed SMS verification and is now live. Keep this code safe — the receiver must enter it at handover to complete the collection.`,
        content: `
          ${codeBox(donationCode, { label: 'Donation handover code', tone: 'green' })}
          ${note(
            `<strong>Share this code only with the receiver, in person, at the moment of handover.</strong> It proves the food was genuinely handed over and protects you from fake collection records.`,
            'green'
          )}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-size:13px;color:${BRAND.chocolateMuted};">Listing</td>
              <td align="right" style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-size:13px;font-weight:700;color:${BRAND.chocolate};">${escapeHtml(
                listingTitle
              )}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-size:13px;color:${BRAND.chocolateMuted};">Quantity</td>
              <td align="right" style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-size:13px;font-weight:700;color:${BRAND.chocolate};">${escapeHtml(
                quantityLabel || '—'
              )}</td>
            </tr>
            ${
              expiry
                ? `<tr>
                    <td style="padding:10px 0;font-size:13px;color:${BRAND.chocolateMuted};">Best before</td>
                    <td align="right" style="padding:10px 0;font-size:13px;font-weight:700;color:${BRAND.chocolate};">${escapeHtml(
                      expiry
                    )}</td>
                  </tr>`
                : ''
            }
          </table>
          ${note(
            'Lost the code? Open your donor dashboard and choose <strong>Show donation code</strong> to generate a fresh one. The previous code stops working immediately.',
            'neutral'
          )}
        `,
        footerNote: 'Never share this code before the food is physically handed over.',
      }),
    };
  },

  collectionOtp({ name, listingTitle, code, expiresMinutes = 10 }) {
    return {
      subject: `Food Link pickup code: ${code}`,
      html: layout({
        preheader: `Pickup code ${code} for ${listingTitle}.`,
        eyebrow: 'Collection verification',
        heading: 'Your pickup code is here',
        intro: `Hi ${name}, the donor has marked <strong>${escapeHtml(
          listingTitle
        )}</strong> ready for pickup. Share this code with the delivery confirmation screen after you receive the food.`,
        content: `
          ${codeBox(code)}
          ${note(
            `This code expires in <strong>${expiresMinutes} minutes</strong>. You will also need the donor's 6-digit handover code to complete the collection.`,
            'neutral'
          )}
        `,
        footerNote: 'This code confirms that you, the assigned receiver, collected the food.',
      }),
    };
  },
};

export default emailTemplates;
