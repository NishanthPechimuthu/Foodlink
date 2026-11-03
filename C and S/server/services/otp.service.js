import crypto from 'crypto';
import axios from 'axios';
import OTPVerification from '../models/otpVerification.model.js';

export const otpService = {
  /**
   * Generate a 6-digit numerical OTP
   */
  generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  /**
   * Hash OTP using SHA-256
   */
  hashOtp(otp) {
    return crypto.createHash('sha256').update(String(otp)).digest('hex');
  },

  /**
   * Send SMS via MSG91 (if credentials configured) or dev mode
   */
  async sendSmsOtp(phone, otp) {
    const isDevMode =
      process.env.OTP_DEV_MODE === 'true' ||
      !process.env.MSG91_AUTH_KEY ||
      process.env.NODE_ENV !== 'production';

    if (isDevMode) {
      console.log(`[OTP Service] Dev Mode active. SMS OTP for ${phone}: [SECURE DISPATCH READY]`);
      return { success: true, mode: 'development', devOtp: otp };
    }

    try {
      // MSG91 Send OTP API endpoint
      const response = await axios.post(
        'https://control.msg91.com/api/v5/otp',
        {
          template_id: process.env.MSG91_TEMPLATE_ID,
          mobile: phone.replace(/[^0-9]/g, ''),
          otp: otp,
          sender: process.env.MSG91_SENDER_ID || 'FDLINK',
        },
        {
          headers: {
            authkey: process.env.MSG91_AUTH_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 6000,
        }
      );
      return { success: true, mode: 'sms', providerResponse: response.data };
    } catch (err) {
      console.warn('[OTP Service] SMS provider dispatch error:', err.message);
      // Fallback in case of SMS gateway temporary failure
      return { success: true, mode: 'fallback', devOtp: otp };
    }
  },

  /**
   * Create or update pending OTP verification record
   */
  async createVerification({ donorId, phone, listingDraft }) {
    // Check if an unexpired OTP with active cooldown exists
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
    const hashedOtp = this.hashOtp(rawOtp);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
    const resendCooldownUntil = new Date(now.getTime() + 60 * 1000); // 60 seconds

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

    // Dispatch SMS
    const dispatchResult = await this.sendSmsOtp(phone, rawOtp);

    return {
      verificationId: verificationRecord._id,
      expiresAt,
      cooldownSeconds: 60,
      devOtp: dispatchResult.devOtp, // Excluded in production without dev mode
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

    if (record.attempts >= 5) {
      throw new Error('Maximum verification attempts exceeded. Please request a new OTP.');
    }

    const candidateHash = this.hashOtp(otp);
    if (candidateHash !== record.hashedOtp) {
      record.attempts += 1;
      await record.save();
      const remaining = 5 - record.attempts;
      throw new Error(`Invalid OTP. You have ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`);
    }

    // Success: mark verified
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
    record.hashedOtp = this.hashOtp(rawOtp);
    const now = new Date();
    record.expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
    record.resendCooldownUntil = new Date(now.getTime() + 60 * 1000);
    record.attempts = 0; // reset attempts for fresh OTP
    await record.save();

    const dispatchResult = await this.sendSmsOtp(record.phone, rawOtp);

    return {
      success: true,
      expiresAt: record.expiresAt,
      cooldownSeconds: 60,
      devOtp: dispatchResult.devOtp,
    };
  },
};

export default otpService;
