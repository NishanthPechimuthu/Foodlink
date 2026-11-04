/**
 * Returns true when a phone number is usable for SMS delivery.
 * Google OAuth accounts are created with the placeholder `+91 00000 00000`,
 * which must be treated as "no phone number" until the user provides one.
 */
export const isUsablePhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return false;

  const local = digits.startsWith('91') ? digits.slice(2) : digits;
  return Boolean(local) && !/^0+$/.test(local);
};

export default isUsablePhone;
