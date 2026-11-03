import express from 'express';
import { getPlatformImpact } from '../controllers/impact.controller.js';

const router = express.Router();

// Public endpoint for impact metrics
router.get('/', getPlatformImpact);

export default router;
