import mongoose from 'mongoose';

/**
 * Short-lived SMS OTP that the *receiver* must enter when collecting food.
 *
 * Pairing this with the donor's handover code gives two-party confirmation:
 *   - pickup OTP proves the assigned receiver is present
 *   - donation code proves the donor actually handed the food over
 */
const pickupVerificationSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodRequest',
      required: [true, 'Request reference is required'],
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver reference is required'],
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
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '15m' },
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
  { timestamps: true }
);

pickupVerificationSchema.index({ request: 1, receiver: 1, isVerified: 1 });

const PickupVerification = mongoose.model('PickupVerification', pickupVerificationSchema);
export default PickupVerification;
