import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor reference is required'],
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    hashedOtp: {
      type: String,
      required: [true, 'Hashed OTP is required'],
    },
    action: {
      type: String,
      enum: ['PUBLISH_FOOD', 'PHONE_VERIFY'],
      default: 'PUBLISH_FOOD',
    },
    listingDraft: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '10m' }, // Auto-delete document after 10 mins
    },
    resendCooldownUntil: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: [5, 'Maximum verification attempts exceeded'],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const OTPVerification = mongoose.model('OTPVerification', otpVerificationSchema);
export default OTPVerification;
