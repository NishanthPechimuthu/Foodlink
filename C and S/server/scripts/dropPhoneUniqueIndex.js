import '../config/env.js';
import mongoose from 'mongoose';
import User from '../models/user.model.js';

/**
 * One-off maintenance script.
 *
 * Removes a legacy unique index on `users.phone` if one still exists in the
 * connected MongoDB database. The application also performs this cleanup on
 * startup, but this script is useful when running migrations separately.
 *
 * Usage:
 *   npm run migrate:drop-phone-index
 */

const run = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food-link';

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  console.log('[Migration] Connected to MongoDB.');

  const indexes = await User.collection.indexes();
  const phoneIndexes = indexes.filter((index) => index.key && index.key.phone !== undefined);

  if (phoneIndexes.length === 0) {
    console.log('[Migration] No phone index exists on the users collection.');
  }

  for (const index of phoneIndexes) {
    if (!index.unique) {
      console.log(`[Migration] Leaving non-unique index "${index.name}" in place.`);
      continue;
    }

    await User.collection.dropIndex(index.name);
    console.log(`[Migration] Dropped legacy unique index "${index.name}".`);
  }

  console.log('[Migration] Done. Phone numbers are not unique.');
};

run()
  .catch((error) => {
    console.error('[Migration] Failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
