import User from '../models/user.model.js';
import FoodListing from '../models/foodListing.model.js';
import FoodRequest from '../models/foodRequest.model.js';
import DonationRecord from '../models/donationRecord.model.js';
import ActivityLog from '../models/activityLog.model.js';

/**
 * GET /api/admin/overview
 * Platform-wide aggregation statistics
 */
export const getAdminOverview = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalDonors,
      totalReceivers,
      totalListings,
      activeListings,
      completedListings,
      totalRequests,
      pendingRequests,
      approvedRequests,
      completedDonations,
      impactAggregation,
      recentActivities,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'Donor' }),
      User.countDocuments({ role: 'Receiver' }),
      FoodListing.countDocuments(),
      FoodListing.countDocuments({ status: 'Available' }),
      FoodListing.countDocuments({ status: 'Completed' }),
      FoodRequest.countDocuments(),
      FoodRequest.countDocuments({ status: 'Pending' }),
      FoodRequest.countDocuments({ status: { $in: ['Approved', 'Ready for Pickup'] } }),
      DonationRecord.countDocuments(),
      DonationRecord.aggregate([
        {
          $group: {
            _id: null,
            totalKgRescued: { $sum: '$weightInKg' },
            totalBeneficiaries: { $sum: '$beneficiariesFed' },
          },
        },
      ]),
      ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate('user', 'fullName email role').lean(),
    ]);

    const impact = impactAggregation[0] || { totalKgRescued: 0, totalBeneficiaries: 0 };

    return res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          donors: totalDonors,
          receivers: totalReceivers,
        },
        listings: {
          total: totalListings,
          active: activeListings,
          completed: completedListings,
        },
        requests: {
          total: totalRequests,
          pending: pendingRequests,
          inProgress: approvedRequests,
          completed: completedDonations,
        },
        impact: {
          totalKgRescued: Math.round(impact.totalKgRescued * 10) / 10,
          totalBeneficiariesFed: impact.totalBeneficiaries,
        },
      },
      recentActivities,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users
 * Search and manage registered platform members
 */
export const getAdminUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role && role !== 'All') {
      query.role = role;
    }

    if (status && status !== 'All') {
      query.accountStatus = status;
    }

    if (search && search.trim()) {
      query.$or = [
        { fullName: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { organizationName: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const take = Math.min(100, Math.max(1, Number(limit)));

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(take).lean(),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page: Number(page),
        limit: take,
        pages: Math.ceil(total / take) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/food
 * List all food listings across the entire system
 */
export const getAdminFood = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'All') query.status = status;
    if (category && category !== 'All') query.category = category;

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const take = Math.min(100, Math.max(1, Number(limit)));

    const [listings, total] = await Promise.all([
      FoodListing.find(query)
        .populate('donor', 'fullName organizationName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      FoodListing.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      listings,
      pagination: {
        total,
        page: Number(page),
        limit: take,
        pages: Math.ceil(total / take) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/requests
 * View all food requests across the system
 */
export const getAdminRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== 'All') query.status = status;

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const take = Math.min(100, Math.max(1, Number(limit)));

    const [requests, total] = await Promise.all([
      FoodRequest.find(query)
        .populate('listing', 'title category quantity quantityUnit status')
        .populate('donor', 'fullName organizationName email')
        .populate('receiver', 'fullName organizationName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      FoodRequest.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      requests,
      pagination: {
        total,
        page: Number(page),
        limit: take,
        pages: Math.ceil(total / take) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:id/status
 * Suspend or reactivate user account
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const adminId = req.user._id || req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "active", "suspended", or "pending".',
      });
    }

    if (id.toString() === adminId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot alter their own account status.',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.accountStatus = status;
    await user.save();

    await ActivityLog.create({
      user: adminId,
      action: 'USER_STATUS_UPDATED',
      details: `Admin changed status of ${user.email} (${user.role}) to "${status}"`,
      targetType: 'User',
      targetId: user._id,
      metadata: { newStatus: status, userRole: user.role },
    });

    return res.status(200).json({
      success: true,
      message: `User account status has been updated to "${status}".`,
      user: typeof user.toSafeObject === 'function' ? user.toSafeObject() : user,
    });
  } catch (error) {
    next(error);
  }
};
