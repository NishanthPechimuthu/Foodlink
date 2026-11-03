import mongoose from 'mongoose';
import FoodListing from '../models/foodListing.model.js';
import FoodRequest from '../models/foodRequest.model.js';
import ActivityLog from '../models/activityLog.model.js';

/**
 * Helper to escape regex special characters for safe keyword searching
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * GET /api/food
 * Public / Receiver Explore endpoint with search, filters, pagination, and sorting
 */
export const getAvailableFoodListings = async (req, res, next) => {
  try {
    const {
      search,
      category,
      isVegetarian,
      city,
      minQuantity,
      sort,
      sortBy,
      page = 1,
      limit = 12,
    } = req.query;

    const query = {
      status: 'Available',
      expiresAt: { $gt: new Date() },
      availableQuantity: { $gt: 0 },
    };

    // Keyword search across title, description, and category
    if (search && typeof search === 'string' && search.trim()) {
      const escapedSearch = escapeRegex(search.trim());
      query.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { category: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Dietary filter (vegetarian)
    if (isVegetarian !== undefined && isVegetarian !== '' && isVegetarian !== 'all') {
      query.isVegetarian = isVegetarian === 'true' || isVegetarian === true;
    }

    // City / Location filter
    if (city && city.trim() && city !== 'All') {
      query['pickupAddress.city'] = { $regex: escapeRegex(city.trim()), $options: 'i' };
    }

    // Minimum quantity
    if (minQuantity && !isNaN(minQuantity)) {
      query.availableQuantity = { $gte: Number(minQuantity) };
    }

    // Sorting (supports both sort and sortBy query parameters)
    const effectiveSort = (sort || sortBy || 'newest').toLowerCase();
    let sortOption = { createdAt: -1 }; // newest first default
    if (effectiveSort === 'expiry' || effectiveSort === 'expiring_soon' || effectiveSort === 'expiringsoon') {
      sortOption = { expiresAt: 1 }; // expiring soonest first
    } else if (effectiveSort === 'quantity') {
      sortOption = { availableQuantity: -1 };
    } else if (effectiveSort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [listings, total] = await Promise.all([
      FoodListing.find(query)
        .populate('donor', 'fullName organizationName profileImage phone')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      FoodListing.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      listings: listings || [],
      pagination: {
        total: total || 0,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil((total || 0) / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/food/my-listings
 * Retrieve all listings for authenticated donor
 */
export const getMyListings = async (req, res, next) => {
  try {
    const donorId = req.user._id || req.user.id;
    const { status, search } = req.query;

    const query = { donor: donorId };

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    const listings = await FoodListing.find(query).sort({ createdAt: -1 }).lean();

    // Attach request counts for each listing
    const listingIds = listings.map((l) => l._id);
    const requestsCount = await FoodRequest.aggregate([
      { $match: { listing: { $in: listingIds } } },
      { $group: { _id: '$listing', totalRequests: { $sum: 1 }, pendingRequests: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } } } },
    ]);

    const countMap = {};
    requestsCount.forEach((c) => {
      countMap[c._id.toString()] = { total: c.totalRequests, pending: c.pendingRequests };
    });

    const listingsWithStats = listings.map((item) => ({
      ...item,
      requestStats: countMap[item._id.toString()] || { total: 0, pending: 0 },
    }));

    return res.status(200).json({
      success: true,
      listings: listingsWithStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/food/:id
 * Retrieve single listing detail
 */
export const getFoodListingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid listing ID format' });
    }

    const listing = await FoodListing.findById(id)
      .populate('donor', 'fullName organizationName profileImage phone email location')
      .lean();

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Food listing not found' });
    }

    return res.status(200).json({
      success: true,
      listing,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/food
 * Create a listing directly if donor is authorized & OTP already verified
 */
export const createFoodListing = async (req, res, next) => {
  try {
    const donorId = req.user._id || req.user.id;
    const {
      title,
      category,
      description,
      quantity,
      quantityUnit,
      preparedAt,
      expiresAt,
      condition,
      isVegetarian,
      storageRequirements,
      pickupAddress,
      location,
      images,
      pickupInstructions,
      isOtpVerified = true,
    } = req.body;

    // Validate dates
    if (new Date(expiresAt) <= new Date(preparedAt)) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date and time must be after preparation date and time',
      });
    }

    if (new Date(expiresAt) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot publish expired food. Expiry date must be in the future.',
      });
    }

    const listing = new FoodListing({
      donor: donorId,
      title: title.trim(),
      category,
      description: description ? description.trim() : '',
      quantity: Number(quantity),
      availableQuantity: Number(quantity),
      reservedQuantity: 0,
      quantityUnit: quantityUnit || 'kg',
      preparedAt: new Date(preparedAt),
      expiresAt: new Date(expiresAt),
      condition: condition || 'Freshly Prepared',
      isVegetarian: isVegetarian !== undefined ? isVegetarian : true,
      storageRequirements: storageRequirements || 'Room Temperature',
      pickupAddress: pickupAddress || req.user.address || {},
      location: location || req.user.location || { type: 'Point', coordinates: [77.2090, 28.6139] },
      images: images || [],
      pickupInstructions: pickupInstructions ? pickupInstructions.trim() : '',
      status: 'Available',
      isOtpVerified,
    });

    await listing.save();

    await ActivityLog.create({
      user: donorId,
      action: 'LISTING_PUBLISHED',
      details: `Published "${listing.title}" (${listing.quantity} ${listing.quantityUnit})`,
      targetType: 'FoodListing',
      targetId: listing._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Food listing published successfully!',
      listing,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/food/:id
 * Update listing details (only owner donor can edit)
 */
export const updateFoodListing = async (req, res, next) => {
  try {
    const donorId = req.user._id || req.user.id;
    const { id } = req.params;

    const listing = await FoodListing.findById(id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.donor.toString() !== donorId.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this listing' });
    }

    if (['Completed', 'Cancelled'].includes(listing.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit listing with status "${listing.status}"`,
      });
    }

    const {
      title,
      category,
      description,
      condition,
      isVegetarian,
      storageRequirements,
      pickupAddress,
      pickupInstructions,
      images,
    } = req.body;

    if (title) listing.title = title.trim();
    if (category) listing.category = category;
    if (description !== undefined) listing.description = description.trim();
    if (condition) listing.condition = condition;
    if (isVegetarian !== undefined) listing.isVegetarian = isVegetarian;
    if (storageRequirements) listing.storageRequirements = storageRequirements;
    if (pickupAddress) listing.pickupAddress = pickupAddress;
    if (pickupInstructions !== undefined) listing.pickupInstructions = pickupInstructions.trim();
    if (images) listing.images = images;

    await listing.save();

    return res.status(200).json({
      success: true,
      message: 'Food listing updated successfully',
      listing,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/food/:id
 * Cancel / delete listing (only owner donor or admin)
 */
export const deleteFoodListing = async (req, res, next) => {
  try {
    const donorId = req.user._id || req.user.id;
    const { id } = req.params;

    const listing = await FoodListing.findById(id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.donor.toString() !== donorId.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to cancel this listing' });
    }

    // Check if there are active approved requests
    const activeRequests = await FoodRequest.countDocuments({
      listing: id,
      status: { $in: ['Approved', 'Ready for Pickup'] },
    });

    if (activeRequests > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel listing with approved requests in progress. Please resolve requests first.',
      });
    }

    listing.status = 'Cancelled';
    await listing.save();

    // Reject all pending requests
    await FoodRequest.updateMany(
      { listing: id, status: 'Pending' },
      { status: 'Rejected', rejectionReason: 'Listing was cancelled by donor' }
    );

    return res.status(200).json({
      success: true,
      message: 'Food listing cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};
