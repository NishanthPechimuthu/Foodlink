import express from 'express';
import { getDBStatus } from '../config/db.js';

const router = express.Router();

router.get('/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.status(200).json({
    status: 'healthy',
    application: 'Food Link API',
    tagline: 'Good food deserves another chance.',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

export default router;
