import express from 'express';
import {
  sendListingOtp,
  verifyListingOtp,
  resendListingOtp,
  regenerateDonationCode,
} from '../controllers/otp.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All OTP listing publication routes require authenticated Donor role
router.use(protect);
router.use(authorize('Donor'));

router.post('/send', sendListingOtp);
router.post('/verify', verifyListingOtp);
router.post('/resend', resendListingOtp);
router.post('/donation-code/regenerate', regenerateDonationCode);

export default router;
