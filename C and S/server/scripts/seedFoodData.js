import '../config/env.js';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/user.model.js';
import FoodListing from '../models/foodListing.model.js';
import FoodRequest from '../models/foodRequest.model.js';
import DonationRecord from '../models/donationRecord.model.js';
import ActivityLog from '../models/activityLog.model.js';

const seedData = async () => {
  console.log('====================================================');
  console.log('🌱 FOOD LINK — SEEDING INITIAL MONGODB ATLAS DATA');
  console.log('====================================================');

  await connectDB();

  // 1. Ensure Verified Demo Donor exists
  let demoDonor = await User.findOne({ email: 'donor@foodlink.org' });
  if (!demoDonor) {
    const salt = await (await import('bcryptjs')).default.genSalt(12);
    const passwordHash = await (await import('bcryptjs')).default.hash('DonorPassword@123', salt);
    demoDonor = new User({
      fullName: 'Aarav Patel (The Green Kitchen)',
      email: 'donor@foodlink.org',
      phone: '+91 98765 43210',
      passwordHash,
      role: 'Donor',
      organizationName: 'The Green Kitchen & Bakery',
      address: {
        street: '42 Connaught Place, Block C',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'India',
      },
      location: { type: 'Point', coordinates: [77.2185, 28.6328] },
      isVerified: true,
      accountStatus: 'active',
    });
    await demoDonor.save();
    console.log('✅ Demo Donor created: donor@foodlink.org / DonorPassword@123');
  } else {
    console.log('ℹ️ Demo Donor already exists: donor@foodlink.org');
  }

  // 2. Ensure Verified Demo Receiver exists
  let demoReceiver = await User.findOne({ email: 'receiver@foodlink.org' });
  if (!demoReceiver) {
    const salt = await (await import('bcryptjs')).default.genSalt(12);
    const passwordHash = await (await import('bcryptjs')).default.hash('ReceiverPassword@123', salt);
    demoReceiver = new User({
      fullName: 'Sunita Rao (Hope Community Shelter)',
      email: 'receiver@foodlink.org',
      phone: '+91 98111 22334',
      passwordHash,
      role: 'Receiver',
      organizationName: 'Hope Community Care Foundation',
      address: {
        street: '15 Lodhi Road, Near Community Hall',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110003',
        country: 'India',
      },
      location: { type: 'Point', coordinates: [77.2250, 28.5890] },
      isVerified: true,
      accountStatus: 'active',
    });
    await demoReceiver.save();
    console.log('✅ Demo Receiver created: receiver@foodlink.org / ReceiverPassword@123');
  } else {
    console.log('ℹ️ Demo Receiver already exists: receiver@foodlink.org');
  }

  // 3. Clear older demo listings and reseed fresh active listings
  await FoodListing.deleteMany({ donor: demoDonor._id });

  const now = new Date();
  const sampleListings = [
    {
      donor: demoDonor._id,
      title: 'Fresh Paneer Tikka & Basmati Pulao',
      category: 'Cooked Meals',
      description: 'Surplus buffet preparation from corporate catering lunch. Packaged in sanitized food-grade stainless containers. Warm and freshly prepared.',
      quantity: 25,
      availableQuantity: 20,
      reservedQuantity: 5,
      quantityUnit: 'meals',
      preparedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48 hours from now
      condition: 'Freshly Prepared',
      isVegetarian: true,
      storageRequirements: 'Room Temperature',
      pickupAddress: {
        street: '42 Connaught Place, Block C',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
      },
      location: { type: 'Point', coordinates: [77.2185, 28.6328] },
      images: [
        'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
      ],
      pickupInstructions: 'Enter via rear kitchen entrance. Ask for Chef Rajesh.',
      status: 'Available',
      isOtpVerified: true,
    },
    {
      donor: demoDonor._id,
      title: 'Steamed Rice, Yellow Dal & Mixed Veg Sabzi',
      category: 'Cooked Meals',
      description: 'Nutritious wholesome community feast leftovers with fragrant basmati steamed rice. Kept in insulated thermal dispensers. Completely vegetarian and hygienic.',
      quantity: 40,
      availableQuantity: 40,
      reservedQuantity: 0,
      quantityUnit: 'meals',
      preparedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48 hours
      condition: 'Freshly Prepared',
      isVegetarian: true,
      storageRequirements: 'Room Temperature',
      pickupAddress: {
        street: 'Community Center, Sector 4, R.K. Puram',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110022',
      },
      location: { type: 'Point', coordinates: [77.1780, 28.5600] },
      images: [
        'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
      ],
      pickupInstructions: 'Please bring clean containers for transfer.',
      status: 'Available',
      isOtpVerified: true,
    },
    {
      donor: demoDonor._id,
      title: 'Fresh Pasteurized Milk & Curd Packets',
      category: 'Dairy Products',
      description: 'Chilled surplus crates of whole cream pasteurized cow milk pouches (500ml) and set curd pots from local dairy cooperative. Fresh and sealed.',
      quantity: 30,
      availableQuantity: 30,
      reservedQuantity: 0,
      quantityUnit: 'litres',
      preparedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48 hours
      condition: 'Packaged Unopened',
      isVegetarian: true,
      storageRequirements: 'Refrigerated',
      pickupAddress: {
        street: 'Mother Dairy Booth 112, Defence Colony',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110024',
      },
      location: { type: 'Point', coordinates: [77.2300, 28.5700] },
      images: [
        'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80',
      ],
      pickupInstructions: 'Collect from refrigerated holding room.',
      status: 'Available',
      isOtpVerified: true,
    },
    {
      donor: demoDonor._id,
      title: 'Artisanal Whole Wheat Loaves & Croissants',
      category: 'Bakery',
      description: 'End-of-day fresh artisanal loaves, sourdough batards, and butter croissants baked this morning. Sealed in bakery paper bags.',
      quantity: 18,
      availableQuantity: 18,
      reservedQuantity: 0,
      quantityUnit: 'kg',
      preparedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48 hours
      condition: 'Good Condition',
      isVegetarian: true,
      storageRequirements: 'Cool & Dry',
      pickupAddress: {
        street: 'Shop 14, Khan Market',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110003',
      },
      location: { type: 'Point', coordinates: [77.2310, 28.6000] },
      images: [
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
      ],
      pickupInstructions: 'Pick up before 9 PM from the front counter.',
      status: 'Available',
      isOtpVerified: true,
    },
    {
      donor: demoDonor._id,
      title: 'Organic Farm Apples & Valencia Oranges',
      category: 'Fruits',
      description: 'Surplus fresh harvest crates from local organic farm delivery. Crisp Himachal apples and sweet juicy oranges.',
      quantity: 35,
      availableQuantity: 35,
      reservedQuantity: 0,
      quantityUnit: 'kg',
      preparedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 72 * 60 * 60 * 1000), // 72 hours
      condition: 'Surplus Harvest',
      isVegetarian: true,
      storageRequirements: 'Cool & Dry',
      pickupAddress: {
        street: 'Azadpur Mandi Gate 2',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110033',
      },
      location: { type: 'Point', coordinates: [77.1700, 28.7100] },
      images: [
        'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&auto=format&fit=crop&q=80',
      ],
      pickupInstructions: 'Crates ready for loading at Stall 42B.',
      status: 'Available',
      isOtpVerified: true,
    },
  ];

  const createdListings = await FoodListing.insertMany(sampleListings);
  console.log(`✅ Seeded ${createdListings.length} active food listings into MongoDB Atlas.`);

  // 4. Create a sample request between demoReceiver and first listing
  await FoodRequest.deleteMany({ receiver: demoReceiver._id });
  const sampleRequest = new FoodRequest({
    listing: createdListings[0]._id,
    donor: demoDonor._id,
    receiver: demoReceiver._id,
    requestedQuantity: 5,
    beneficiaryCount: 8,
    purpose: 'Evening dinner for homeless shelter residents',
    pickupPreference: 'Around 5:30 PM',
    notes: 'Volunteer van will arrive for pickup.',
    status: 'Approved',
  });
  await sampleRequest.save();
  console.log('✅ Seeded active sample request: 5 meals approved for Hope Community Shelter.');

  // 5. Seed historical impact records
  await DonationRecord.deleteMany({ donor: demoDonor._id });
  const sampleImpact = new DonationRecord({
    listing: createdListings[0]._id,
    request: sampleRequest._id,
    donor: demoDonor._id,
    receiver: demoReceiver._id,
    foodTitle: 'Dal Makhani & Roti Combo',
    category: 'Cooked Meals',
    quantityRescued: 30,
    quantityUnit: 'meals',
    weightInKg: 12,
    beneficiariesFed: 24,
    completedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
  });
  await sampleImpact.save();

  // Additional historical record: Fresh Produce
  const dummyReqId2 = new mongoose.Types.ObjectId();
  const sampleImpact2 = new DonationRecord({
    listing: createdListings[4]._id,
    request: dummyReqId2,
    donor: demoDonor._id,
    receiver: demoReceiver._id,
    foodTitle: 'Farm Fresh Organic Spinach & Greens',
    category: 'Fresh Produce',
    quantityRescued: 25,
    quantityUnit: 'kg',
    weightInKg: 25,
    beneficiariesFed: 45,
    completedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
  });
  await sampleImpact2.save();

  // Additional historical record: Dairy
  const dummyReqId3 = new mongoose.Types.ObjectId();
  const sampleImpact3 = new DonationRecord({
    listing: createdListings[1]._id,
    request: dummyReqId3,
    donor: demoDonor._id,
    receiver: demoReceiver._id,
    foodTitle: 'Fresh Whole Cow Milk (Pasteurized)',
    category: 'Dairy & Milk',
    quantityRescued: 20,
    quantityUnit: 'litres',
    weightInKg: 20,
    beneficiariesFed: 35,
    completedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
  });
  await sampleImpact3.save();

  console.log('✅ Seeded 3 historical donation impact records: 57 kg rescued, 104 people fed.');

  // 6. Seed sample notifications
  const Notification = (await import('../models/notification.model.js')).default;
  await Notification.deleteMany({ recipient: { $in: [demoDonor._id, demoReceiver._id] } });

  await Notification.create([
    {
      recipient: demoDonor._id,
      sender: demoReceiver._id,
      type: 'NEW_REQUEST',
      title: 'New Food Request',
      message: 'Hope Community Care Foundation requested 5 meals of "Dal Makhani & Roti Combo".',
      data: { listingId: createdListings[0]._id, requestId: sampleRequest._id, link: '/donor/dashboard' },
      isRead: false,
    },
    {
      recipient: demoDonor._id,
      sender: null,
      type: 'SYSTEM',
      title: 'Welcome to Food Link!',
      message: 'Thank you for joining our mission to rescue surplus food and feed local communities.',
      isRead: true,
    },
    {
      recipient: demoReceiver._id,
      sender: demoDonor._id,
      type: 'REQUEST_APPROVED',
      title: 'Request Approved! 🎉',
      message: 'The Green Kitchen & Bakery approved your request for 5 meals of "Dal Makhani & Roti Combo".',
      data: { listingId: createdListings[0]._id, requestId: sampleRequest._id, link: '/receiver/dashboard' },
      isRead: false,
    },
    {
      recipient: demoReceiver._id,
      sender: null,
      type: 'SYSTEM',
      title: 'Account Ready',
      message: 'Your Hope Community Care Foundation account is active. Browse listings and submit requests anytime!',
      isRead: true,
    },
  ]);
  console.log('✅ Seeded sample notifications for Demo Donor and Demo Receiver.');

  console.log('====================================================');
  console.log('🎉 ATLAS SEEDING COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
  process.exit(0);
};

seedData().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
