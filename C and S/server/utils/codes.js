import crypto from 'crypto';

/**
 * Shared helpers for one-time codes (email verification, donation handover,
 * pickup confirmation). Codes are always stored hashed — never in plain text.
 */

export const generateNumericCode = (length = 6) => {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(crypto.randomInt(min, max + 1));
};

export const hashCode = (code, scope = '') =>
  crypto
    .createHash('sha256')
    .update(`${String(scope)}:${String(code).trim()}`)
    .digest('hex');

export default { generateNumericCode, hashCode };
