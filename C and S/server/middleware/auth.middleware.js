import jwt from 'jsonwebtoken';
import { userService } from '../services/user.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_food_link_jwt_secret_dev_key_2026_change_in_production';

/**
 * Authentication Middleware
 * Validates JWT from HttpOnly Cookie or Authorization Bearer header
 */
export const protect = async (req, res, next) => {
  let token = null;

  // 1. Check for token in Signed / Plain Cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.signedCookies && req.signedCookies.token) {
    token = req.signedCookies.token;
  }
  // 2. Fallback to Authorization Header (Bearer <token>)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to access this resource.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user existence in database
    const user = await userService.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The account associated with this session no longer exists.',
      });
    }

    // Verify account status
    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact community support.',
      });
    }

    // Attach user to request object
    req.user = typeof user.toSafeObject === 'function' ? user.toSafeObject() : user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid session authentication. Please log in again.',
    });
  }
};

/**
 * Role Authorization Middleware
 * Enforces role-based permissions on backend endpoints
 * Example usage: authorize('Donor') or authorize('Receiver') or authorize('Admin')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking permissions.',
      });
    }

    const userRole = String(req.user.role || '').toLowerCase();
    const allowed = roles.map((r) => String(r).toLowerCase());

    if (!allowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires ${roles.join(' or ')} privileges.`,
      });
    }

    next();
  };
};

export const requireAuth = protect;
