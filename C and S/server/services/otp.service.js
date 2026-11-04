import OTPVerification from '../models/otpVerification.model.js';
import smsService from './sms.service.js';
import { generateNumericCode, hashCode } from '../utils/codes.js';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;

const isDevMode = () =>
  process.env.OTP_DEV_MODE === 'true' || smsService.isDevMode;

export const otpService = {
  /**
   * Generate a 6-digit numerical OTP
   */
  generateOtp() {
    return generateNumericCode(6);
  },

  /**
   * Hash OTP using SHA-256
   */
  hashOtp(otp, scope = 'publish-food') {
    return hashCode(otp, scope);
  },

  /**
   * Send SMS via Twilio (falls back to console in dev / when unconfigured)
   */
  async sendSmsOtp(phone, otp, purpose = 'verification') {
    const message =
      purpose === 'pickup'
        ? `Food Link: your pickup confirmation code is ${otp}. It expires in 5 minutes. Never share it before receiving the food.`
        : `Food Link: your food listing verification code is ${otp}. It expires in 5 minutes. Do not share this code.`;

    const result = await smsService.sendSms(phone, message);

    if (!result.success) {
      throw new Error(
        'We could not send the SMS verification code. Please check the phone number and try again.'
      );
    }

    return {
      success: true,
      mode: result.mode,
      devOtp: isDevMode() ? otp : undefined,
    };
  },

  /**
   * Create or update pending OTP verification record for publishing a listing
   */
  async createVerification({ donorId, phone, listingDraft }) {
    const existing = await OTPVerification.findOne({
      donor: donorId,
      action: 'PUBLISH_FOOD',
      isVerified: false,
      expiresAt: { $gt: new Date() },
    });

    if (existing && existing.resendCooldownUntil > new Date()) {
      const waitSeconds = Math.ceil((existing.resendCooldownUntil - new Date()) / 1000);
      throw new Error(`Please wait ${waitSeconds} seconds before requesting a new OTP.`);
    }

    const rawOtp = this.generateOtp();
    const hashedOtp = this.hashOtp(rawOtp, 'publish-food');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);
    const resendCooldownUntil = new Date(now.getTime() + RESEND_COOLDOWN_MS);

    // Clean up any older pending verifications for this donor
    await OTPVerification.deleteMany({ donor: donorId, isVerified: false });

    const verificationRecord = new OTPVerification({
      donor: donorId,
      phone,
      hashedOtp,
      action: 'PUBLISH_FOOD',
      listingDraft,
      expiresAt,
      resendCooldownUntil,
      attempts: 0,
      isVerified: false,
    });

    await verificationRecord.save();

    // Dispatch SMS (throws with a user-friendly message when delivery fails)
    let dispatchResult;
    try {
      dispatchResult = await this.sendSmsOtp(phone, rawOtp, 'listing');
    } catch (dispatchError) {
      await OTPVerification.deleteOne({ _id: verificationRecord._id });
      throw dispatchError;
    }

    return {
      verificationId: verificationRecord._id,
      expiresAt,
      cooldownSeconds: 60,
      devOtp: dispatchResult.devOtp,
    };
  },

  /**
   * Verify candidate OTP
   */
  async verifyOtp({ donorId, verificationId, otp }) {
    const record = await OTPVerification.findOne({
      _id: verificationId,
      donor: donorId,
      isVerified: false,
    });

    if (!record) {
      throw new Error('Verification session not found or already verified. Please request a new OTP.');
    }

    if (new Date() > record.expiresAt) {
      throw new Error('OTP has expired. Please request a new OTP.');
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      throw new Error('Maximum verification attempts exceeded. Please request a new OTP.');
    }

    const candidateHash = this.hashOtp(otp, 'publish-food');
    if (candidateHash !== record.hashedOtp) {
      record.attempts += 1;
      await record.save();
      const remaining = MAX_ATTEMPTS - record.attempts;
      throw new Error(
        `Invalid OTP. You have ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`
      );
    }

    record.isVerified = true;
    record.verifiedAt = new Date();
    await record.save();

    return {
      success: true,
      listingDraft: record.listingDraft,
    };
  },

  /**
   * Resend OTP respecting cooldown
   */
  async resendOtp({ donorId, verificationId }) {
    const record = await OTPVerification.findOne({
      _id: verificationId,
      donor: donorId,
      isVerified: false,
    });

    if (!record) {
      throw new Error('Verification session not found. Please start over.');
    }

    if (new Date() < record.resendCooldownUntil) {
      const waitSeconds = Math.ceil((record.resendCooldownUntil - new Date()) / 1000);
      throw new Error(`Please wait ${waitSeconds} seconds before requesting a new OTP.`);
    }

    const rawOtp = this.generateOtp();
    record.hashedOtp = this.hashOtp(rawOtp, 'publish-food');
    const now = new Date();
    record.expiresAt = new Date(now.getTime() + OTP_TTL_MS);
    record.resendCooldownUntil = new Date(now.getTime() + RESEND_COOLDOWN_MS);
    record.attempts = 0;
    await record.save();

    const dispatchResult = await this.sendSmsOtp(record.phone, rawOtp, 'listing');

    return {
      success: true,
      expiresAt: record.expiresAt,
      cooldownSeconds: 60,
      devOtp: dispatchResult.devOtp,
    };
  },
};

export default otpService;
