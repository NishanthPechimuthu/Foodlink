import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  googleAuth,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateGoogleAuth,
} from '../middleware/validator.middleware.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// Public Authentication Endpoints
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/logout', logout);
router.post('/google', authLimiter, validateGoogleAuth, googleAuth);
router.post('/forgot-password', passwordResetLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

// Protected Session Endpoint
router.get('/me', protect, getMe);

// Role-Based Protected Verification Endpoints (Used for unit testing & backend permission verification)
router.get('/donor-only', protect, authorize('Donor'), (req, res) => {
  res.json({ success: true, message: 'Access granted to Donor portal.', user: req.user });
});

router.get('/receiver-only', protect, authorize('Receiver'), (req, res) => {
  res.json({ success: true, message: 'Access granted to Receiver portal.', user: req.user });
});

router.get('/admin-only', protect, authorize('Admin'), (req, res) => {
  res.json({ success: true, message: 'Access granted to Admin command center.', user: req.user });
});

export default router;
