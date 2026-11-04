import mongoose from 'mongoose';
import FoodRequest from '../models/foodRequest.model.js';
import FoodListing from '../models/foodListing.model.js';
import DonationRecord from '../models/donationRecord.model.js';
import ActivityLog from '../models/activityLog.model.js';
import notificationService from '../services/notification.service.js';
import pickupOtpService from '../services/pickupOtp.service.js';
import emailService from '../services/email.service.js';
import { generateNumericCode, hashCode } from '../utils/codes.js';

const DONATION_CODE_SCOPE = 'donation-handover';
const donationCodeHash = (code) => hashCode(code, DONATION_CODE_SCOPE);
const MAX_DONATION_CODE_ATTEMPTS = 5;

/**
 * Ensure a listing has a handover code. Legacy/seeded listings created before
 * handover codes existed get one on first "ready for pickup".
 * Returns the plaintext code when a new one was created, otherwise null.
 */
const ensureDonationCode = async (listing, donorUser) => {
  if (!listing || listing.donationCodeHash) return null;

  const code = generateNumericCode(6);
  listing.donationCodeHash = donationCodeHash(code);
  listing.donationCodeIssuedAt = new Date();
  listing.donationCodeVerifiedAt = null;
  await listing.save();

  const emailTo = donorUser?.email;
  if (emailTo) {
    await emailService.sendDonationCodeEmail({
      to: emailTo,
      name: donorUser.fullName || 'there',
      listingTitle: listing.title,
      donationCode: code,
      quantityLabel: `${listing.quantity} ${listing.quantityUnit}`,
      expiresAt: listing.expiresAt,
    });
  }

  return code;
};

/**
 * Helper to convert food quantity to normalized weight in Kilograms
 */
const normalizeWeightToKg = (quantity, unit) => {
  const q = Number(quantity);
  switch (unit) {
    case 'kg':
      return q;
    case 'grams':
      return q / 1000;
    case 'litres':
      return q;
    case 'meals':
      return Math.round(q * 0.4 * 10) / 10; // ~400g per standard meal
    case 'packets':
      return Math.round(q * 0.5 * 10) / 10; // ~500g per packet
    default:
      return q;
  }
};

/**
 * POST /api/requests
 * Receiver submits a request for available food
 */
export const createFoodRequest = async (req, res, next) => {
  try {
    const receiverId = req.user._id || req.user.id;
    const {
      listingId,
      requestedQuantity,
      beneficiaryCount = 1,
      purpose,
      pickupPreference,
      notes,
    } = req.body;

    if (!listingId || !requestedQuantity) {
      return res.status(400).json({
        success: false,
        message: 'Listing ID and requested quantity are required.',
      });
    }

    const qty = Number(requestedQuantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Requested quantity must be greater than zero.',
      });
    }

    const listing = await FoodListing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Food listing not found.' });
    }

    if (listing.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: `This food listing is currently ${listing.status.toLowerCase()} and cannot accept new requests.`,
      });
    }

    if (new Date() > new Date(listing.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'This food listing has expired.',
      });
    }

    // Check available quantity
    if (qty > listing.availableQuantity) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${qty} ${listing.quantityUnit}) exceeds currently available quantity (${listing.availableQuantity} ${listing.quantityUnit}).`,
      });
    }

    // Prevent duplicate active request
    const existingActiveRequest = await FoodRequest.findOne({
      listing: listingId,
      receiver: receiverId,
      status: { $in: ['Pending', 'Approved', 'Ready for Pickup'] },
    });

    if (existingActiveRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active request for this food listing.',
      });
    }

    const foodRequest = new FoodRequest({
      listing: listingId,
      donor: listing.donor,
      receiver: receiverId,
      requestedQuantity: qty,
      beneficiaryCount: Math.max(1, Number(beneficiaryCount) || 1),
      purpose: purpose ? purpose.trim() : 'Community distribution',
      pickupPreference: pickupPreference ? pickupPreference.trim() : 'Within 2 hours',
      notes: notes ? notes.trim() : '',
      status: 'Pending',
    });

    await foodRequest.save();

    await ActivityLog.create({
      user: receiverId,
      action: 'REQUEST_SUBMITTED',
      details: `Requested ${qty} ${listing.quantityUnit} of "${listing.title}"`,
      targetType: 'FoodRequest',
      targetId: foodRequest._id,
      metadata: { listingId, requestedQuantity: qty },
    });

    // Notify donor of incoming request
    await notificationService.createNotification({
      recipient: listing.donor,
      sender: receiverId,
      type: 'NEW_REQUEST',
      title: 'New Food Request',
      message: `A receiver has requested ${qty} ${listing.quantityUnit} of "${listing.title}".`,
      data: { listingId: listing._id, requestId: foodRequest._id, link: '/donor/dashboard' },
    });

    return res.status(201).json({
      success: true,
      message: 'Your food request has been submitted to the donor for approval.',
      request: foodRequest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/requests/my-requests
 * Retrieve all requests submitted by the authenticated Receiver
 */
export const getMyRequests = async (req, res, next) => {
  try {
    const receiverId = req.user._id || req.user.id;
    const { status } = req.query;

    const query = { receiver: receiverId };
    if (status && status !== 'All') {
      query.status = status;
    }

    const requests = await FoodRequest.find(query)
      .populate('listing', 'title category quantity quantityUnit availableQuantity pickupAddress expiresAt images status')
      .populate('donor', 'fullName organizationName phone email')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/requests/incoming
 * Retrieve all incoming requests for the authenticated Donor's listings
 */
export const getIncomingRequests = async (req, res, next) => {
  try {
    const donorId = req.user._id || req.user.id;
    const { status, listingId } = req.query;

    const query = { donor: donorId };
    if (status && status !== 'All') {
      query.status = status;
    }
    if (listingId && mongoose.Types.ObjectId.isValid(listingId)) {
      query.listing = listingId;
    }

    const requests = await FoodRequest.find(query)
      .populate('listing', 'title category quantity quantityUnit availableQuantity reservedQuantity status')
      .populate('receiver', 'fullName organizationName phone email address')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/requests/:id
 * Retrieve request detail
 */
export const getRequestById = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const request = await FoodRequest.findById(id)
      .populate('listing')
      .populate('donor', 'fullName organizationName phone email')
      .populate('receiver', 'fullName organizationName phone email address');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const isAuthorized =
      request.donor._id.toString() === userId.toString() ||
      request.receiver._id.toString() === userId.toString() ||
      req.user.role === 'Admin';

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.status(200).json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/requests/:id/approve
 * Donor approves request and reserves quantity
 */
export const approveRequest = async (req, res, next) => {
  try {
    const donorId = req.user._id || req.user.id;
    const { id } = req.params;

    const request = await FoodRequest.findById(id).populate('listing');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.donor.toString() !== donorId.toString()) {
      return res.status(403).json({ success: false, message: 'Only the listing donor can approve this request.' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve request with current status "${request.status}".`,
      });
    }

    const listing = await FoodListing.findById(request.listing._id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Associated listing not found.' });
    }

    // Check availability again
    if (listing.availableQuantity < request.requestedQuantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient quantity available. Remaining: ${listing.availableQuantity} ${listing.quantityUnit}, Requested: ${request.requestedQuantity} ${listing.quantityUnit}.`,
      });
    }

    // Reserve quantity
    listing.availableQuantity -= request.requestedQuantity;
    listing.reservedQuantity += request.requestedQuantity;

    if (listing.availableQuantity === 0) {
      listing.status = 'Fully Requested';
    }

    await listing.save();

    request.status = 'Approved';
    await request.save();

    await ActivityLog.create({
      user: donorId,
      action: 'REQUEST_APPROVED',
      details: `Approved request for ${request.requestedQuantity} ${listing.quantityUnit} of "${listing.title}"`,
      targetType: 'FoodRequest',
      targetId: request._id,
    });

    // Notify receiver that request is approved
    await notificationService.createNotification({
      recipient: request.receiver,
      sender: donorId,
      type: 'REQUEST_APPROVED',
      title: 'Request Approved! 🎉',
      message: `Your request for ${request.requestedQuantity} ${listing.quantityUnit} of "${listing.title}" has been approved by the donor.`,
      data: { listingId: listing._id, requestId: request._id, link: '/receiver/dashboard' },
    });

    return res.status(200).json({
      success: true,
      message: 'Request approved successfully. The requested quantity has been reserved.',
      request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/requests/:id/reject
 * Donor rejects request with optional reason
 */
export const rejectRequest = async (req, res, next) => {
  try {
    const donorId = req.user._id || req.user.id;
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const request = await FoodRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.donor.toString() !== donorId.toString()) {
      return res.status(403).json({ success: false, message: 'Only the listing donor can reject this request.' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with current status "${request.status}".`,
      });
    }

    request.status = 'Rejected';
    request.rejectionReason = rejectionReason ? rejectionReason.trim() : 'Declined by donor';
    await request.save();

    await ActivityLog.create({
      user: donorId,
      action: 'REQUEST_REJECTED',
      details: `Rejected request #${request._id}: ${request.rejectionReason}`,
      targetType: 'FoodRequest',
      targetId: request._id,
    });

    // Notify receiver that request was rejected
    await notificationService.createNotification({
      recipient: request.receiver,
      sender: donorId,
      type: 'REQUEST_REJECTED',
      title: 'Request Declined',
      message: `Your food request was declined: ${request.rejectionReason}`,
      data: { listingId: request.listing, requestId: request._id, link: '/receiver/dashboard' },
    });

    return res.status(200).json({
      success: true,
      message: 'Request declined.',
      request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/requests/:id/ready
 * Donor marks approved request as Ready for Pickup
 */
export const markReadyForPickup = async (req, res, next) => {
  try {
    const donorId = req.user._id || req.user.id;
    const { id } = req.params;

    const request = await FoodRequest.findById(id)
      .populate('listing')
      .populate('receiver', 'fullName phone email');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.donor.toString() !== donorId.toString()) {
      return res.status(403).json({ success: false, message: 'Only the listing donor can mark this ready.' });
    }

    if (request.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved requests can be marked as Ready for Pickup.',
      });
    }

    request.status = 'Ready for Pickup';
    request.readyAt = new Date();
    await request.save();

    // Guarantee the donor has a handover code (legacy listings included)
    const listingWithCode = await FoodListing.findById(request.listing._id).select(
      '+donationCodeHash'
    );
    let newDonationCode = null;
    if (listingWithCode && !listingWithCode.donationCodeHash) {
      newDonationCode = await ensureDonationCode(listingWithCode, req.user);
    }

    // Issue the receiver's pickup OTP and deliver it by SMS (and email fallback)
    let pickupOtpSent = false;
    let pickupDevOtp = null;
    let pickupCodeForEmail = null;
    let pickupWarning = null;

    const receiverPhone = request.receiver?.phone || req.user.phone;
    if (receiverPhone) {
      try {
        const issued = await pickupOtpService.issue({
          requestId: request._id,
          receiverId: request.receiver?._id || request.receiver,
          phone: receiverPhone,
          listingTitle: request.listing.title,
        });
        pickupOtpSent = true;
        pickupDevOtp = issued.devOtp || null;
        pickupCodeForEmail = issued.code || null;
      } catch (otpError) {
        console.warn('[Pickup OTP] Could not dispatch SMS:', otpError.message);
        pickupWarning = otpError.message;
      }
    } else {
      pickupWarning = 'The receiver has no phone number on file, so no pickup SMS was sent.';
    }

    if (request.receiver?.email && pickupCodeForEmail) {
      await emailService.sendCollectionOtpEmail({
        to: request.receiver.email,
        name: request.receiver.fullName || 'there',
        listingTitle: request.listing.title,
        code: pickupCodeForEmail,
        expiresMinutes: 10,
      }).catch(() => {});
    }

    await ActivityLog.create({
      user: donorId,
      action: 'READY_FOR_PICKUP',
      details: `Marked request for "${request.listing.title}" as ready for pickup`,
      targetType: 'FoodRequest',
      targetId: request._id,
    });

    // Notify receiver that food is ready for pickup
    await notificationService.createNotification({
      recipient: request.receiver?._id || request.receiver,
      sender: donorId,
      type: 'READY_FOR_PICKUP',
      title: 'Ready for Pickup! 🍲',
      message: `"${request.listing.title}" is packed and ready for your collection! Enter the pickup code sent to your phone plus the donor's handover code to confirm.`,
      data: { listingId: request.listing._id, requestId: request._id, link: '/receiver/dashboard' },
    });

    return res.status(200).json({
      success: true,
      message: pickupOtpSent
        ? 'Donation is marked Ready for Pickup! The receiver has been sent a pickup code.'
        : 'Donation is marked Ready for Pickup, but the pickup SMS could not be sent. Ask the receiver to tap "Resend code".',
      request,
      pickupOtpSent,
      pickupWarning,
      ...(pickupDevOtp ? { devPickupOtp: pickupDevOtp } : {}),
      ...(newDonationCode ? { donationCode: newDonationCode } : {}),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/requests/:id/collect
 * Receiver confirms collection -> Marks Completed & Creates Impact Record
 */
export const confirmCollection = async (req, res, next) => {
  try {
    const receiverId = req.user._id || req.user.id;
    const { id } = req.params;
    const pickupOtp = String(req.body?.pickupOtp || '').trim();
    const donationCode = String(req.body?.donationCode || '').trim();

    const request = await FoodRequest.findById(id).populate('listing');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.receiver.toString() !== receiverId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned receiver can confirm food collection.',
      });
    }

    if (request.status !== 'Ready for Pickup') {
      return res.status(400).json({
        success: false,
        message: 'Only requests marked "Ready for Pickup" can be confirmed as collected.',
      });
    }

    if (!/^[0-9]{6}$/.test(pickupOtp) || !/^[0-9]{6}$/.test(donationCode)) {
      return res.status(400).json({
        success: false,
        message:
          'Both the 6-digit pickup code (sent to your phone) and the donor\'s 6-digit handover code are required.',
      });
    }

    const listing = await FoodListing.findById(request.listing._id).select('+donationCodeHash');

    // ---- Step 1: donor's handover code (proves the donor released the food) ----
    if (!listing || !listing.donationCodeHash) {
      return res.status(400).json({
        success: false,
        message:
          'This listing has no handover code yet. Ask the donor to open their dashboard and tap "Show donation code".',
      });
    }

    if ((request.donationCodeAttempts || 0) >= MAX_DONATION_CODE_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message:
          'Too many incorrect handover codes for this request. Ask the donor to generate a new code.',
      });
    }

    if (donationCodeHash(donationCode) !== listing.donationCodeHash) {
      request.donationCodeAttempts = (request.donationCodeAttempts || 0) + 1;
      await request.save();
      const remaining = MAX_DONATION_CODE_ATTEMPTS - request.donationCodeAttempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect donor handover code. ${remaining} ${
          remaining === 1 ? 'attempt' : 'attempts'
        } remaining.`,
      });
    }

    // ---- Step 2: receiver's SMS pickup OTP (proves the receiver is present) ----
    let pickupResult;
    try {
      pickupResult = await pickupOtpService.verify({
        requestId: request._id,
        receiverId,
        otp: pickupOtp,
      });
    } catch (otpError) {
      return res.status(400).json({ success: false, message: otpError.message });
    }

    // ---- Both factors verified: complete the donation ----
    const now = new Date();

    request.status = 'Completed';
    request.collectedAt = now;
    request.completedAt = now;
    request.pickupOtpVerifiedAt = pickupResult.verifiedAt || now;
    request.donationCodeVerifiedAt = now;
    request.collectionVerifiedAt = now;
    await request.save();

    listing.donationCodeVerifiedAt = now;

    // Release from reserved quantity
    listing.reservedQuantity = Math.max(0, listing.reservedQuantity - request.requestedQuantity);
    if (listing.availableQuantity === 0 && listing.reservedQuantity === 0) {
      listing.status = 'Completed';
    }
    await listing.save();

    // Create Impact Record
    const weightInKg = normalizeWeightToKg(request.requestedQuantity, listing.quantityUnit);

    const impactRecord = new DonationRecord({
      listing: request.listing._id,
      request: request._id,
      donor: request.donor,
      receiver: receiverId,
      foodTitle: listing.title || 'Food Donation',
      category: listing.category || 'Cooked Meals',
      quantityRescued: request.requestedQuantity,
      quantityUnit: listing.quantityUnit,
      weightInKg,
      beneficiariesFed: request.beneficiaryCount || 1,
      completedAt: now,
    });

    await impactRecord.save();

    await ActivityLog.create({
      user: receiverId,
      action: 'COLLECTION_CONFIRMED',
      details: `Collected ${request.requestedQuantity} ${listing.quantityUnit} of "${listing.title}" with two-party verification. ${weightInKg} kg food rescued!`,
      targetType: 'FoodRequest',
      targetId: request._id,
      metadata: {
        weightInKg,
        beneficiaries: request.beneficiaryCount,
        pickupOtpVerified: true,
        donationCodeVerified: true,
      },
    });

    // Notify donor that collection is confirmed
    await notificationService.createNotification({
      recipient: request.donor,
      sender: receiverId,
      type: 'DONATION_COMPLETED',
      title: 'Donation Completed! 🎉',
      message: `Your donation of "${listing.title}" was collected and verified with your handover code. Rescued ${weightInKg} kg!`,
      data: { listingId: request.listing?._id || request.listing, requestId: request._id, link: '/donor/dashboard' },
    });

    return res.status(200).json({
      success: true,
      message: `Collection verified by SMS code and donor handover code. Thank you for rescuing ${weightInKg} kg of surplus food!`,
      request,
      impact: impactRecord,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/requests/:id/collection-otp
 * Receiver requests a fresh pickup SMS code (respects a 60s cooldown).
 */
export const resendCollectionOtp = async (req, res, next) => {
  try {
    const receiverId = req.user._id || req.user.id;
    const { id } = req.params;

    const request = await FoodRequest.findById(id).populate('listing');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.receiver.toString() !== receiverId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned receiver can request a pickup code.',
      });
    }

    if (request.status !== 'Ready for Pickup') {
      return res.status(400).json({
        success: false,
        message: 'Pickup codes are only available once the donor marks the food ready.',
      });
    }

    const phone = req.user.phone;
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Add a phone number to your profile before requesting a pickup code.',
      });
    }

    const issued = await pickupOtpService.issue({
      requestId: request._id,
      receiverId,
      phone,
      listingTitle: request.listing?.title || 'your food donation',
    });

    if (req.user.email) {
      await emailService.sendCollectionOtpEmail({
        to: req.user.email,
        name: req.user.fullName || 'there',
        listingTitle: request.listing?.title || 'your food donation',
        code: issued.code,
        expiresMinutes: 10,
      }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: 'A fresh pickup code has been sent to your phone and email.',
      expiresAt: issued.expiresAt,
      cooldownSeconds: issued.cooldownSeconds,
      ...(issued.devOtp ? { devOtp: issued.devOtp } : {}),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Could not send a pickup code.',
    });
  }
};

/**
 * PATCH /api/requests/:id/cancel
 * Receiver cancels pending or approved request
 */
export const cancelFoodRequest = async (req, res, next) => {
  try {
    const receiverId = req.user._id || req.user.id;
    const { id } = req.params;

    const request = await FoodRequest.findById(id).populate('listing');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.receiver.toString() !== receiverId.toString()) {
      return res.status(403).json({ success: false, message: 'Only the receiver can cancel their request.' });
    }

    if (['Completed', 'Collected', 'Cancelled', 'Rejected'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel request with status "${request.status}".`,
      });
    }

    // If request was approved or ready, return reserved quantity back to available
    if (['Approved', 'Ready for Pickup'].includes(request.status)) {
      const listing = await FoodListing.findById(request.listing._id);
      if (listing) {
        listing.reservedQuantity = Math.max(0, listing.reservedQuantity - request.requestedQuantity);
        listing.availableQuantity += request.requestedQuantity;
        if (listing.status === 'Fully Requested' && listing.availableQuantity > 0) {
          listing.status = 'Available';
        }
        await listing.save();
      }
    }

    request.status = 'Cancelled';
    await request.save();

    // Notify donor of cancellation
    await notificationService.createNotification({
      recipient: request.donor,
      sender: receiverId,
      type: 'SYSTEM',
      title: 'Request Cancelled',
      message: `A request for "${request.listing?.title || 'food'}" was cancelled by the receiver.`,
      data: { listingId: request.listing?._id || request.listing, requestId: request._id, link: '/donor/dashboard' },
    });

    return res.status(200).json({
      success: true,
      message: 'Request cancelled successfully.',
      request,
    });
  } catch (error) {
    next(error);
  }
};
