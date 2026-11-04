import otpService from '../services/otp.service.js';
import { userService } from '../services/user.service.js';
import FoodListing from '../models/foodListing.model.js';
import FoodRequest from '../models/foodRequest.model.js';
import ActivityLog from '../models/activityLog.model.js';
import emailService from '../services/email.service.js';
import { normalizePhoneNumber } from '../services/sms.service.js';
import { generateNumericCode, hashCode } from '../utils/codes.js';

const DONATION_CODE_SCOPE = 'donation-handover';
const donationCodeHash = (code) => hashCode(code, DONATION_CODE_SCOPE);

/**
 * Returns true when a phone number can actually receive an SMS.
 * Google OAuth accounts get `+91 00000 00000` as a placeholder, and some
 * older records may have an empty or all-zero number. Those must prompt the
 * donor for a real number before an OTP is requested.
 */
export const isUsablePhone = (phone) => {
  const digits = normalizePhoneNumber(phone).replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return false;

  const local = digits.startsWith('91') ? digits.slice(2) : digits;
  return Boolean(local) && !/^0+$/.test(local);
};

const quantityLabel = (listing) =>
  `${listing.quantity} ${listing.quantityUnit}`.trim();

const stripDonationHash = (listing) => {
  const payload =
    typeof listing.toObject === 'function' ? listing.toObject() : { ...listing };
  delete payload.donationCodeHash;
  return payload;
};

export const sendListingOtp = async (req, res, next) => {
  try {
    const donorId = req.user._id || req.user.id;
    const { phone, listingData } = req.body;

    if (!listingData || !listingData.title || !listingData.category || !listingData.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Incomplete food listing information provided. Title, category, and quantity are required.',
      });
    }

    // Validate dates
    if (new Date(listingData.expiresAt) <= new Date(listingData.preparedAt)) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date and time must be after preparation date and time.',
      });
    }

    if (new Date(listingData.expiresAt) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot publish expired food. Expiry date must be in the future.',
      });
    }

    const contactPhone = [phone, req.user.phone]
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .find(isUsablePhone);

    if (!contactPhone) {
      return res.status(400).json({
        success: false,
        code: 'PHONE_REQUIRED',
        message:
          'Add a mobile number to receive your SMS verification code. We will save it to your profile so receivers can contact you.',
      });
    }

    // If the account had no real phone yet (for example a Google sign-up with
    // the placeholder number), save the number the donor just provided.
    let phoneSaved = false;
    if (!isUsablePhone(req.user.phone) && isUsablePhone(contactPhone)) {
      try {
        const updatedUser = await userService.updatePhone(donorId, contactPhone);
        phoneSaved = Boolean(updatedUser);
      } catch (saveError) {
        console.warn('[OTP] Could not save the donor phone number:', saveError.message);
      }
    }

    const result = await otpService.createVerification({
      donorId,
      phone: contactPhone,
      listingDraft: {
        ...listingData,
        donor: donorId,
        availableQuantity: Number(listingData.quantity),
        reservedQuantity: 0,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${contactPhone}. Please enter it to publish your listing.`,
      phone: contactPhone,
      phoneSaved,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to initiate OTP verification.',
    });
  }
};

export const verifyListingOtp = async (req, res, next) => {
  try {
    const donorId = req.user._id || req.user.id;
    const { verificationId, otp } = req.body;

    if (!verificationId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Both verification ID and 6-digit OTP code are required.',
      });
    }

    // Verify OTP
    const verifyResult = await otpService.verifyOtp({
      donorId,
      verificationId,
      otp: String(otp).trim(),
    });

    const draft = verifyResult.listingDraft;

    // Generate the unique handover code the donor must share with the receiver.
    const donationCode = generateNumericCode(6);

    // Publish listing to MongoDB
    const listing = new FoodListing({
      ...draft,
      donor: donorId,
      availableQuantity: Number(draft.quantity),
      reservedQuantity: 0,
      status: 'Available',
      isOtpVerified: true,
      donationCodeHash: donationCodeHash(donationCode),
      donationCodeIssuedAt: new Date(),
    });

    await listing.save();

    // Email the themed handover-code receipt to the donor
    let emailDelivered = false;
    if (req.user?.email) {
      const delivery = await emailService.sendDonationCodeEmail({
        to: req.user.email,
        name: req.user.fullName || 'there',
        listingTitle: listing.title,
        donationCode,
        quantityLabel: quantityLabel(listing),
        expiresAt: listing.expiresAt,
      });
      emailDelivered = delivery.success;
    }

    // Log Activity
    await ActivityLog.create({
      user: donorId,
      action: 'LISTING_PUBLISHED',
      details: `Published "${listing.title}" (${listing.quantity} ${listing.quantityUnit})`,
      targetType: 'FoodListing',
      targetId: listing._id,
      metadata: {
        category: listing.category,
        quantity: listing.quantity,
        unit: listing.quantityUnit,
      },
    });

    return res.status(201).json({
      success: true,
      message:
        'OTP verified successfully! Your food listing is now live. Save the handover code below — the receiver must enter it at collection.',
      listing: stripDonationHash(listing),
      donationCode,
      donationCodeEmailSent: emailDelivered,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'OTP verification failed.',
    });
  }
};

export const resendListingOtp = async (req, res, next) => {
  try {
    const donorId = req.user._id || req.user.id;
    const { verificationId } = req.body;

    if (!verificationId) {
      return res.status(400).json({
        success: false,
        message: 'Verification ID is required to resend OTP.',
      });
    }

    const result = await otpService.resendOtp({
      donorId,
      verificationId,
    });

    return res.status(200).json({
      success: true,
      message: 'A fresh OTP verification code has been dispatched.',
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to resend OTP.',
    });
  }
};

/**
 * POST /api/otp/donation-code/regenerate
 * Donor requests a fresh handover code for one of their listings.
 * Used when the original code is lost, or for listings created before
 * handover codes existed.
 */
export const regenerateDonationCode = async (req, res) => {
  try {
    const donorId = req.user._id || req.user.id;
    const { listingId } = req.body;

    if (!listingId) {
      return res.status(400).json({
        success: false,
        message: 'A listing ID is required to generate a handover code.',
      });
    }

    const listing = await FoodListing.findOne({ _id: listingId, donor: donorId });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Food listing not found or does not belong to you.',
      });
    }

    if (['Completed', 'Expired', 'Cancelled'].includes(listing.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot issue a handover code for a listing that is ${listing.status.toLowerCase()}.`,
      });
    }

    const donationCode = generateNumericCode(6);

    listing.donationCodeHash = donationCodeHash(donationCode);
    listing.donationCodeIssuedAt = new Date();
    listing.donationCodeVerifiedAt = null;
    await listing.save();

    // A fresh handover code also resets failed-attempt counters on active requests
    await FoodRequest.updateMany(
      { listing: listing._id, status: { $in: ['Approved', 'Ready for Pickup'] } },
      { $set: { donationCodeAttempts: 0 } }
    );

    let emailDelivered = false;
    if (req.user?.email) {
      const delivery = await emailService.sendDonationCodeEmail({
        to: req.user.email,
        name: req.user.fullName || 'there',
        listingTitle: listing.title,
        donationCode,
        quantityLabel: quantityLabel(listing),
        expiresAt: listing.expiresAt,
      });
      emailDelivered = delivery.success;
    }

    await ActivityLog.create({
      user: donorId,
      action: 'DONATION_CODE_REGENERATED',
      details: `Generated a new handover code for "${listing.title}"`,
      targetType: 'FoodListing',
      targetId: listing._id,
    });

    return res.status(200).json({
      success: true,
      message: 'A new handover code has been generated. The previous code no longer works.',
      donationCode,
      donationCodeEmailSent: emailDelivered,
      listing: stripDonationHash(listing),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Could not generate a handover code.',
    });
  }
};
