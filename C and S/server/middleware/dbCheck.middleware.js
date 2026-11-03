import mongoose from 'mongoose';

/**
 * Database readiness middleware.
 * Verifies that MongoDB has an active connection (readyState === 1)
 * before attempting database-dependent operations.
 * If disconnected, immediately returns 503 Service Unavailable with a helpful message,
 * preventing Mongoose bufferCommands from hanging for 10s and triggering an unhandled 500 error.
 */
export const requireDB = (req, res, next) => {
  // During unit test runs where mock/in-memory services are used, allow pass-through
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState !== 1) {
    const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
    const currentState = states[mongoose.connection.readyState] || 'Unknown';

    return res.status(503).json({
      success: false,
      message: 'Database service is currently connecting or unavailable. Please retry shortly.',
      databaseStatus: currentState,
    });
  }
  next();
};

export default requireDB;
