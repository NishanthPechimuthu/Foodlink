import DonationRecord from '../models/donationRecord.model.js';
import User from '../models/user.model.js';
import FoodListing from '../models/foodListing.model.js';

/**
 * GET /api/impact
 * Public platform impact metrics and statistics calculated from real MongoDB data
 */
export const getPlatformImpact = async (req, res, next) => {
  try {
    // 1. Aggregated totals from confirmed donation records
    const impactAgg = await DonationRecord.aggregate([
      {
        $group: {
          _id: null,
          totalRescuedKg: { $sum: '$weightInKg' },
          totalBeneficiaries: { $sum: '$beneficiariesFed' },
          totalDonationsCount: { $sum: 1 },
          distinctDonors: { $addToSet: '$donor' },
          distinctReceivers: { $addToSet: '$receiver' },
        },
      },
      {
        $project: {
          _id: 0,
          totalRescuedKg: { $round: ['$totalRescuedKg', 1] },
          totalBeneficiaries: 1,
          totalDonationsCount: 1,
          activeDonorsCount: { $size: '$distinctDonors' },
          activeReceiversCount: { $size: '$distinctReceivers' },
        },
      },
    ]);

    const summary = impactAgg[0] || {
      totalRescuedKg: 0,
      totalBeneficiaries: 0,
      totalDonationsCount: 0,
      activeDonorsCount: 0,
      activeReceiversCount: 0,
    };

    // Calculate CO2 emissions saved: ~2.5 kg CO2 per 1 kg food rescued
    const co2SavedKg = Math.round(summary.totalRescuedKg * 2.5 * 10) / 10;
    // Water conserved: ~1000 liters per kg of food
    const waterSavedLiters = Math.round(summary.totalRescuedKg * 1000);

    // 2. Category distribution
    const categoryBreakdown = await DonationRecord.aggregate([
      {
        $group: {
          _id: '$category',
          rescuedKg: { $sum: '$weightInKg' },
          count: { $sum: 1 },
          beneficiaries: { $sum: '$beneficiariesFed' },
        },
      },
      { $sort: { rescuedKg: -1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          rescuedKg: { $round: ['$rescuedKg', 1] },
          count: 1,
          beneficiaries: 1,
        },
      },
    ]);

    // 3. Monthly rescue trends (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTrends = await DonationRecord.aggregate([
      {
        $match: {
          completedAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$completedAt' },
            month: { $month: '$completedAt' },
          },
          rescuedKg: { $sum: '$weightInKg' },
          donationsCount: { $sum: 1 },
          beneficiaries: { $sum: '$beneficiariesFed' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          monthLabel: {
            $concat: [
              {
                $arrayElemAt: [
                  [
                    '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                  ],
                  '$_id.month'
                ]
              },
              ' ',
              { $substr: ['$_id.year', 2, 2] }
            ]
          },
          rescuedKg: { $round: ['$rescuedKg', 1] },
          donationsCount: 1,
          beneficiaries: 1,
        },
      },
    ]);

    // 4. Platform community size (Registered verified users)
    const [donorUserCount, receiverUserCount, totalListingsCount] = await Promise.all([
      User.countDocuments({ role: 'Donor' }),
      User.countDocuments({ role: 'Receiver' }),
      FoodListing.countDocuments(),
    ]);

    // 5. Recent rescue highlights (anonymized/safe)
    const recentRescues = await DonationRecord.find()
      .populate('donor', 'organizationName fullName')
      .populate('receiver', 'organizationName fullName')
      .sort({ completedAt: -1 })
      .limit(6)
      .lean();

    const highlights = recentRescues.map((r) => ({
      id: r._id,
      foodTitle: r.foodTitle,
      category: r.category,
      weightInKg: r.weightInKg,
      beneficiariesFed: r.beneficiariesFed,
      donorName: r.donor?.organizationName || r.donor?.fullName || 'Community Donor',
      receiverName: r.receiver?.organizationName || r.receiver?.fullName || 'Community Partner',
      completedAt: r.completedAt,
    }));

    return res.status(200).json({
      success: true,
      impact: {
        totalRescuedKg: summary.totalRescuedKg,
        totalBeneficiaries: summary.totalBeneficiaries,
        totalDonationsCount: summary.totalDonationsCount,
        co2SavedKg,
        waterSavedLiters,
        activeDonorsCount: Math.max(summary.activeDonorsCount, donorUserCount),
        activeReceiversCount: Math.max(summary.activeReceiversCount, receiverUserCount),
        totalListingsCount,
        categoryBreakdown,
        monthlyTrends,
        highlights,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};
