import express from 'express';
import {
  sendListingOtp,
  verifyListingOtp,
  resendListingOtp,
} from '../controllers/otp.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All OTP listing publication routes require authenticated Donor role
router.use(protect);
router.use(authorize('Donor'));

router.post('/send', sendListingOtp);
router.post('/verify', verifyListingOtp);
router.post('/resend', resendListingOtp);

export default router;
