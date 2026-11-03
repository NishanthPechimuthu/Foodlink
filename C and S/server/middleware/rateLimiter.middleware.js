import rateLimit from 'express-rate-limit';

// Rate limiter for authentication attempts (Registration & Login)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please wait 15 minutes before trying again.',
  },
  skip: () => process.env.NODE_ENV === 'test', // Skip in automated tests
});

// Stricter rate limiter for password reset requests
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8, // Limit each IP to 8 password reset requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests from this IP. Please wait 15 minutes before trying again.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});
