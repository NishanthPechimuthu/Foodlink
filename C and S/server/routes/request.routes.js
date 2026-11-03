import express from 'express';
import {
  createFoodRequest,
  getMyRequests,
  getIncomingRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  markReadyForPickup,
  confirmCollection,
  cancelFoodRequest,
} from '../controllers/request.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

// Receiver specific routes
router.post('/', authorize('Receiver'), createFoodRequest);
router.get('/my-requests', authorize('Receiver'), getMyRequests);
router.patch('/:id/collect', authorize('Receiver'), confirmCollection);
router.patch('/:id/cancel', authorize('Receiver'), cancelFoodRequest);

// Donor specific routes
router.get('/incoming', authorize('Donor'), getIncomingRequests);
router.patch('/:id/approve', authorize('Donor'), approveRequest);
router.patch('/:id/reject', authorize('Donor'), rejectRequest);
router.patch('/:id/ready', authorize('Donor'), markReadyForPickup);

// Shared / Detail route
router.get('/:id', getRequestById);

export default router;
