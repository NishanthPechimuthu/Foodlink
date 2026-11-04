import './env.js';
import mongoose from 'mongoose';
import User from '../models/user.model.js';

// Helper to mask credentials in connection URI for safe logging
export const sanitizeUri = (uri) => {
  if (!uri) return 'undefined';
  return uri.replace(/\/\/(.*?)@/, '//***:***@');
};

/**
 * Older versions of the app may have created a unique index on users.phone.
 * MongoDB keeps indexes even after the Mongoose schema stops declaring them,
 * so a stale `phone_1` index can make manual registration fail with E11000
 * when two accounts share a contact number. Phone numbers are intentionally
 * NOT unique in this app, so remove any legacy unique phone index on startup.
 */
export const dropLegacyPhoneUniqueIndex = async () => {
  try {
    const indexes = await User.collection.indexes();
    const legacyIndex = indexes.find(
      (index) => index.unique && index.key && index.key.phone === 1
    );

    if (!legacyIndex) return false;

    await User.collection.dropIndex(legacyIndex.name);
    console.log(
      `[Database] Dropped legacy unique index "${legacyIndex.name}" on users.phone (phone numbers are not unique).`
    );
    return true;
  } catch (error) {
    // The users collection may not exist yet on a brand-new database.
    if (error.code === 26 || error.codeName === 'NamespaceNotFound') return false;

    console.warn(
      `[Database Warning] Could not remove a legacy unique users.phone index: ${error.message}`
    );
    return false;
  }
};

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food-link';
  const sanitized = sanitizeUri(uri);

  try {
    // If already connected, return existing connection
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    // Connection options for modern Mongoose 8
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: process.env.NODE_ENV !== 'production',
    });

    console.log(`[Database] MongoDB Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);

    // Remove stale unique phone indexes left behind by older schema versions.
    await dropLegacyPhoneUniqueIndex();

    return conn;
  } catch (error) {
    console.warn(`[Database Warning] Could not connect to MongoDB at "${sanitized}".`);
    console.warn(`[Database Warning] Reason: ${error.message}`);
    return null;
  }
};

// Event listeners for connection lifecycle
mongoose.connection.on('disconnected', () => {
  console.log('[Database Event] MongoDB connection lost / disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[Database Event] MongoDB reconnected successfully.');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database Error]', err.message);
});

// Helper to check connection status
export const getDBStatus = () => {
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  const stateCode = mongoose.connection.readyState;
  return {
    state: states[stateCode] || 'Unknown',
    isConnected: stateCode === 1,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
};
