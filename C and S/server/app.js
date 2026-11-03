import './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import foodRoutes from './routes/food.routes.js';
import otpRoutes from './routes/otp.routes.js';
import requestRoutes from './routes/request.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import impactRoutes from './routes/impact.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { requireDB } from './middleware/dbCheck.middleware.js';

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Request Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'food_link_cookie_secret_dev'));

// Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health & Root API Routes (Non-blocking, always available for monitoring)
app.use('/api', healthRoutes);

// Authentication & Session Routes (Requires database)
app.use('/api/auth', requireDB, authRoutes);

// Core Food Donation, Listing & OTP Routes (Requires database)
app.use('/api/food', requireDB, foodRoutes);
app.use('/api/otp', requireDB, otpRoutes);

// Request & Donation Lifecycle Routes (Requires database)
app.use('/api/requests', requireDB, requestRoutes);

// Platform Administration & Analytics Routes (Requires database)
app.use('/api/admin', requireDB, adminRoutes);

// User Notifications Routes (Requires database)
app.use('/api/notifications', requireDB, notificationRoutes);

// Public Platform Impact Routes (Requires database)
app.use('/api/impact', requireDB, impactRoutes);

// Image Upload Routes
app.use('/api/upload', requireDB, uploadRoutes);

// Fallback for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Root welcome
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Food Link API — Good food deserves another chance.',
    healthCheck: '/api/health',
  });
});

// Global Centralized Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  console.error(`[Error] ${err.message}`, err.stack);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
