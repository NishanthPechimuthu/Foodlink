import express from 'express';
import {
  getAvailableFoodListings,
  getMyListings,
  getFoodListingById,
  createFoodListing,
  updateFoodListing,
  deleteFoodListing,
} from '../controllers/food.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public explore listings
router.get('/', getAvailableFoodListings);

// Donor specific listings
router.get('/my-listings', protect, authorize('Donor'), getMyListings);

// Single listing details
router.get('/:id', getFoodListingById);

// Donor modification routes
router.post('/', protect, authorize('Donor'), createFoodListing);
router.put('/:id', protect, authorize('Donor'), updateFoodListing);
router.delete('/:id', protect, authorize('Donor'), deleteFoodListing);

export default router;
