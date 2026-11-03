import express from 'express';
import {
  getAdminOverview,
  getAdminUsers,
  getAdminFood,
  getAdminRequests,
  updateUserStatus,
} from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All Admin routes require authenticated user with Admin role
router.use(protect);
router.use(authorize('Admin'));

router.get('/overview', getAdminOverview);
router.get('/users', getAdminUsers);
router.get('/food', getAdminFood);
router.get('/requests', getAdminRequests);
router.patch('/users/:id/status', updateUserStatus);

export default router;
