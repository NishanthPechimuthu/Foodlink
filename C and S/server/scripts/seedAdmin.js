import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/user.model.js';
import { userService } from '../services/user.service.js';

const seedAdmin = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || process.argv[2] || 'admin@foodlink.org').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || process.argv[3] || 'FoodLinkAdmin@2026!';
  const adminName = process.env.ADMIN_NAME || process.argv[4] || 'Food Link Administrator';
  const adminPhone = process.env.ADMIN_PHONE || process.argv[5] || '+91 99999 88888';

  console.log('====================================================');
  console.log('🛡️  FOOD LINK — SECURE ADMIN PROVISIONING');
  console.log('====================================================');
  console.log(`Target Email: ${adminEmail}`);
  console.log(`Target Name:  ${adminName}`);

  // Connect to DB
  await connectDB();

  // Check if admin already exists
  const existing = await userService.findByEmail(adminEmail);
  if (existing) {
    console.log(`[Admin Notice] User with email ${adminEmail} already exists (Role: ${existing.role}).`);
    if (existing.role !== 'Admin') {
      console.log(`[Admin Update] Elevating user ${adminEmail} to Admin role...`);
      existing.role = 'Admin';
      if (typeof existing.save === 'function') await existing.save();
      console.log('✅ User successfully elevated to Admin.');
    } else {
      console.log('✅ Admin account is already configured and active.');
    }
    process.exit(0);
  }

  // Create new Admin
  console.log('Creating new administrative account...');
  const adminUser = await userService.create({
    fullName: adminName,
    email: adminEmail,
    phone: adminPhone,
    password: adminPassword,
    role: 'Admin',
    organizationName: 'Food Link Platform Authority',
    isVerified: true,
  });

  console.log('====================================================');
  console.log('✅ ADMIN ACCOUNT PROVISIONED SUCCESSFULLY:');
  console.log(`   ID:    ${adminUser._id || adminUser.id}`);
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   Role:  ${adminUser.role}`);
  console.log('====================================================');

  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error('❌ Failed to provision admin:', err);
  process.exit(1);
});
