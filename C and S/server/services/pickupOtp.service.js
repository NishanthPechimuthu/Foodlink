import PickupVerification from '../models/pickupVerification.model.js';
import smsService from './sms.service.js';
import { generateNumericCode, hashCode } from '../utils/codes.js';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const isDevMode = () => process.env.OTP_DEV_MODE === 'true' || smsService.isDevMode;

const hash = (otp, requestId) => hashCode(otp, `pickup:${requestId}`);

export const pickupOtpService = {
  /**
   * Issue a fresh pickup OTP for a request and send it to the receiver's phone.
   */
  async issue({ requestId, receiverId, phone, listingTitle }) {
    const existing = await PickupVerification.findOne({
      request: requestId,
      receiver: receiverId,
      isVerified: false,
      expiresAt: { $gt: new Date() },
    });

    if (existing && existing.resendCooldownUntil > new Date()) {
      const waitSeconds = Math.ceil((existing.resendCooldownUntil - new Date()) / 1000);
      throw new Error(`Please wait ${waitSeconds} seconds before requesting a new code.`);
    }

    const otp = generateNumericCode(6);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);
    const resendCooldownUntil = new Date(now.getTime() + RESEND_COOLDOWN_MS);

    await PickupVerification.deleteMany({ request: requestId, isVerified: false });

    const record = new PickupVerification({
      request: requestId,
      receiver: receiverId,
      phone,
      hashedOtp: hash(otp, requestId),
      expiresAt,
      resendCooldownUntil,
      attempts: 0,
      isVerified: false,
    });

    await record.save();

    const message = `Food Link: your pickup code for "${listingTitle}" is ${otp}. Valid for 10 minutes. You will also need the donor's 6-digit handover code. Never share this code before receiving the food.`;

    const result = await smsService.sendSms(phone, message);
    if (!result.success) {
      await PickupVerification.deleteOne({ _id: record._id });
      throw new Error(
        'We could not send the pickup verification SMS. Check the receiver phone number and try again.'
      );
    }

    return {
      verificationId: record._id,
      expiresAt,
      cooldownSeconds: 60,
      code: otp, // server-side only — used for the email fallback
      devOtp: isDevMode() ? otp : undefined,
    };
  },

  /**
   * Verify a receiver's pickup OTP.
   */
  async verify({ requestId, receiverId, otp }) {
    const record = await PickupVerification.findOne({
      request: requestId,
      receiver: receiverId,
      isVerified: false,
    }).sort({ createdAt: -1 });

    if (!record) {
      throw new Error('Pickup verification not found. Ask the donor to mark the food ready again.');
    }

    if (new Date() > record.expiresAt) {
      throw new Error('The pickup code has expired. Tap "Resend code" to get a new one.');
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      throw new Error('Too many incorrect pickup codes. Request a new code to continue.');
    }

    if (hash(otp, requestId) !== record.hashedOtp) {
      record.attempts += 1;
      await record.save();
      const remaining = MAX_ATTEMPTS - record.attempts;
      throw new Error(
        `Incorrect pickup code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`
      );
    }

    record.isVerified = true;
    record.verifiedAt = new Date();
    await record.save();

    return { success: true, verifiedAt: record.verifiedAt };
  },

  async findVerified({ requestId, receiverId }) {
    return PickupVerification.findOne({
      request: requestId,
      receiver: receiverId,
      isVerified: true,
    }).lean();
  },
};

export default pickupOtpService;
