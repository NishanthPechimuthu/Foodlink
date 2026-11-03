import './env.js';
import mongoose from 'mongoose';

// Helper to mask credentials in connection URI for safe logging
export const sanitizeUri = (uri) => {
  if (!uri) return 'undefined';
  return uri.replace(/\/\/(.*?)@/, '//***:***@');
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
