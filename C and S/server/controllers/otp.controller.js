import otpService from '../services/otp.service.js';
import FoodListing from '../models/foodListing.model.js';
import ActivityLog from '../models/activityLog.model.js';

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

    const contactPhone = phone || req.user.phone || '+91 98765 43210';

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

    // Publish listing to MongoDB
    const listing = new FoodListing({
      ...draft,
      donor: donorId,
      availableQuantity: Number(draft.quantity),
      reservedQuantity: 0,
      status: 'Available',
      isOtpVerified: true,
    });

    await listing.save();

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
      message: 'OTP verified successfully! Your food listing is now live and available for community requests.',
      listing,
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
