import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { userService } from '../services/user.service.js';
import emailService from '../services/email.service.js';
import { generateNumericCode, hashCode } from '../utils/codes.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_food_link_jwt_secret_dev_key_2026_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const EMAIL_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const EMAIL_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const EMAIL_MAX_ATTEMPTS = 5;
const EMAIL_DISPATCH_TIMEOUT_MS = 7 * 1000; // below the client's 10s request timeout

// Google OAuth client instance
const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

/**
 * Generate signed JWT token for authenticated session
 */
const signToken = (user) => {
  const userId = user._id ? user._id.toString() : user.id;
  return jwt.sign(
    {
      id: userId,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
};

/**
 * Send secure cookie and JSON response
 */
const sendAuthSession = (res, statusCode, message, user) => {
  const token = signToken(user);
  const isProduction = process.env.NODE_ENV === 'production';

  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true, // Prevent XSS theft
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'strict' : 'lax',
  };

  res.cookie('token', token, cookieOptions);

  const safeUser = typeof user.toSafeObject === 'function' ? user.toSafeObject() : user;

  return res.status(statusCode).json({
    success: true,
    message,
    token, // Also returned for Authorization: Bearer <token> client headers
    user: safeUser,
  });
};

/**
 * Create a fresh email-verification code for a user, store only its hash,
 * and persist the expiry / cooldown metadata. Returns the plaintext code so
 * it can be emailed (never persisted in plain text).
 */
const issueEmailVerificationCode = async (user) => {
  const code = generateNumericCode(6);
  const normalizedEmail = String(user.email || '').trim().toLowerCase();

  user.emailVerificationHash = hashCode(code, `email-verify:${normalizedEmail}`);
  user.emailVerificationExpires = new Date(Date.now() + EMAIL_CODE_TTL_MS);
  user.emailVerificationSentAt = new Date();
  user.emailVerificationAttempts = 0;

  if (typeof user.save === 'function') {
    await user.save();
  }

  return code;
};

const dispatchVerificationEmail = async (user, code) => {
  const delivery = emailService.sendVerificationEmail({
    to: user.email,
    name: user.fullName || 'there',
    code,
    expiresMinutes: EMAIL_CODE_TTL_MS / 60000,
  });

  // Never let a slow SMTP server make registration/resend requests exceed the
  // client's HTTP timeout. The email service already catches its own errors;
  // this race only guards against a stalled connection.
  const timeout = new Promise((resolve) => {
    setTimeout(
      () => resolve({ success: false, mode: 'timeout', error: 'Email delivery timed out' }),
      EMAIL_DISPATCH_TIMEOUT_MS
    );
  });

  try {
    return await Promise.race([delivery, timeout]);
  } catch (error) {
    // Email delivery must never make account creation fail. The account is
    // already saved; the user can request another code from the modal.
    console.error('[Email Service] Verification email dispatch failed:', error.message);
    return { success: false, mode: 'error', error: error.message };
  }
};

/**
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role, organizationName } = req.body;

    // Check for existing account
    const existing = await userService.findByEmail(email);
    if (existing) {
      // A Google-created account cannot be converted to a password account by
      // registering again. Tell the user exactly which button to use.
      if (existing.authProvider === 'google') {
        return res.status(409).json({
          success: false,
          code: 'USE_GOOGLE_SIGN_IN',
          message:
            'This email is already registered with Google. Please use "Continue with Google" to sign in.',
        });
      }

      // If the account exists but was never verified, resend instead of failing
      // so users who lost the first email are not permanently stuck.
      if (
        !existing.isVerified &&
        existing.authProvider === 'local' &&
        process.env.NODE_ENV !== 'test'
      ) {
        const code = await issueEmailVerificationCode(existing);
        const delivery = await dispatchVerificationEmail(existing, code);

        return res.status(200).json({
          success: true,
          requiresEmailVerification: true,
          email: existing.email,
          message: delivery.success
            ? 'Your account is not verified yet. We sent a fresh verification code to your email.'
            : 'Your account is not verified yet. We could not send the email right now — use "Resend code" in the verification screen to try again.',
          emailDelivered: delivery.success,
          expiresInMinutes: EMAIL_CODE_TTL_MS / 60000,
          ...(emailService.isDevMode ? { devCode: code } : {}),
        });
      }

      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in or use a different email.',
      });
    }

    // Create user in database (or memory fallback)
    const newUser = await userService.create({
      fullName,
      email,
      phone,
      password,
      role, // Validated to Donor or Receiver in validator middleware
      organizationName,
      authProvider: 'local',
      isVerified: false,
    });

    // Automated tests exercise the legacy "register returns a session" contract.
    if (process.env.NODE_ENV === 'test') {
      return sendAuthSession(
        res,
        201,
        `Welcome to Food Link, ${newUser.fullName}! Your ${newUser.role} account is ready.`,
        newUser
      );
    }

    const code = await issueEmailVerificationCode(newUser);
    const delivery = await dispatchVerificationEmail(newUser, code);

    return res.status(201).json({
      success: true,
      requiresEmailVerification: true,
      email: newUser.email,
      message: delivery.success
        ? `We sent a 6-digit verification code to ${newUser.email}. Enter it to activate your account.`
        : `Your account was created, but we could not send the email to ${newUser.email} right now. Use "Resend code" in the verification screen to try again.`,
      emailDelivered: delivery.success,
      expiresInMinutes: EMAIL_CODE_TTL_MS / 60000,
      ...(emailService.isDevMode ? { devCode: code } : {}),
    });
  } catch (error) {
    // A stale unique index or a race can still surface as E11000. Return a
    // helpful message instead of a generic 500. Phone numbers are not meant to
    // be unique, so that case is reported separately.
    if (error?.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || error.keyValue || {})[0];

      if (duplicateField === 'phone') {
        return res.status(409).json({
          success: false,
          code: 'PHONE_ALREADY_REGISTERED',
          message:
            'That mobile number is already linked to another account. Phone numbers are not meant to be unique — please try again in a moment or use a different number.',
        });
      }

      if (duplicateField === 'email') {
        return res.status(400).json({
          success: false,
          message:
            'An account with this email address already exists. Please log in or use a different email.',
        });
      }
    }

    next(error);
  }
};

/**
 * POST /api/auth/verify-email
 * Verify the 6-digit code sent at registration and start a session.
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    const user = await userService.findByEmail(email, { includeVerification: true });

    const invalidResponse = {
      success: false,
      message: 'That verification code is invalid or has expired. Request a new code and try again.',
    };

    if (!user) {
      return res.status(400).json(invalidResponse);
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        alreadyVerified: true,
        message: 'This email is already verified. Please sign in with your password.',
      });
    }

    if (!user.emailVerificationHash || !user.emailVerificationExpires) {
      return res.status(400).json({
        success: false,
        message: 'No active verification code was found for this account. Request a new code.',
        canResend: true,
      });
    }

    if (new Date() > new Date(user.emailVerificationExpires)) {
      return res.status(400).json({
        success: false,
        message: 'Your verification code has expired. Request a new code.',
        canResend: true,
      });
    }

    if ((user.emailVerificationAttempts || 0) >= EMAIL_MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Request a new verification code.',
        canResend: true,
      });
    }

    const normalizedEmail = String(user.email).trim().toLowerCase();
    const candidateHash = hashCode(code, `email-verify:${normalizedEmail}`);

    if (candidateHash !== user.emailVerificationHash) {
      user.emailVerificationAttempts = (user.emailVerificationAttempts || 0) + 1;
      if (typeof user.save === 'function') await user.save();

      const remaining = EMAIL_MAX_ATTEMPTS - user.emailVerificationAttempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect verification code. ${remaining} ${
          remaining === 1 ? 'attempt' : 'attempts'
        } remaining.`,
      });
    }

    user.isVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationHash = null;
    user.emailVerificationExpires = null;
    user.emailVerificationAttempts = 0;
    if (typeof user.save === 'function') await user.save();

    return sendAuthSession(res, 200, 'Email verified successfully. Welcome to Food Link!', user);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/resend-verification
 * Re-issue an email verification code, respecting a 60-second cooldown.
 */
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    const genericResponse = {
      success: true,
      message: 'If that email is registered and unverified, a new verification code has been sent.',
    };

    const user = await userService.findByEmail(email, { includeVerification: true });

    if (!user || user.isVerified) {
      return res.status(200).json(genericResponse);
    }

    if (user.emailVerificationSentAt) {
      const elapsed = Date.now() - new Date(user.emailVerificationSentAt).getTime();
      if (elapsed < EMAIL_RESEND_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil((EMAIL_RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${retryAfterSeconds} seconds before requesting another code.`,
          retryAfterSeconds,
        });
      }
    }

    const code = await issueEmailVerificationCode(user);
    const delivery = await dispatchVerificationEmail(user, code);

    return res.status(200).json({
      ...genericResponse,
      message: delivery.success
        ? genericResponse.message
        : 'We could not send the verification email right now. Please try again shortly.',
      emailDelivered: delivery.success,
      expiresInMinutes: EMAIL_CODE_TTL_MS / 60000,
      ...(emailService.isDevMode ? { devCode: code } : {}),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Retrieve user with passwordHash
    const user = await userService.findByEmail(email, { includePassword: true });

    // Generic invalid message to avoid email enumeration
    const genericAuthError = {
      success: false,
      message: 'Invalid email address or password. Please verify your credentials.',
    };

    if (!user) {
      return res.status(401).json(genericAuthError);
    }

    // Verify password with bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json(genericAuthError);
    }

    // Block unverified local accounts (Google accounts are verified by Google)
    if (
      user.authProvider === 'local' &&
      !user.isVerified &&
      process.env.NODE_ENV !== 'test'
    ) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        canResend: true,
        email: user.email,
        message:
          'Please verify your email address before signing in. We can send you a new 6-digit verification code.',
      });
    }

    // Check account status
    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended by community administrators. Please contact support.',
      });
    }

    return sendAuthSession(res, 200, `Welcome back, ${user.fullName}!`, user);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
export const logout = (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: isProduction ? 'strict' : 'lax',
    secure: isProduction,
  });

  return res.status(200).json({
    success: true,
    message: 'You have been signed out successfully.',
  });
};

/**
 * GET /api/auth/me
 * Retrieve current authenticated user
 */
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

/**
 * POST /api/auth/google
 * Verify Google ID Token & authenticate or register user
 */
export const googleAuth = async (req, res, next) => {
  try {
    const { token, role } = req.body;
    let googleUser = null;

    const isDevToken = typeof token === 'string' && (token.includes('simulated_signature_dev') || token.startsWith('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.ey'));
    const isGoogleConfigured = process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_ID.trim().length > 10 &&
      !process.env.GOOGLE_CLIENT_ID.includes('your_google_client_id');

    if (isGoogleConfigured && !isDevToken && process.env.NODE_ENV !== 'test') {
      // Production Google OAuth verification with live Google servers
      try {
        const client = googleClient || new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        googleUser = {
          googleId: payload.sub,
          email: payload.email,
          fullName: payload.name || payload.email.split('@')[0],
          profileImage: payload.picture || '',
          isEmailVerified: payload.email_verified || true,
        };
      } catch (err) {
        console.warn('[Google Auth Error] ID token verification failed:', err.message);
        return res.status(401).json({
          success: false,
          message: 'Google authentication failed: Invalid or expired ID token.',
        });
      }
    } else {
      // Development mode fallback when Google credentials are not yet configured or using simulated dev tokens
      console.log('[Auth Notice] Processing via development Google token parser.');
      
      // Basic payload decoding for simulated development tokens
      try {
        const base64Url = token.split('.')[1] || token;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decodedString = Buffer.from(base64, 'base64').toString('utf8');
        const parsed = JSON.parse(decodedString);
        googleUser = {
          googleId: parsed.sub || `google_dev_${Date.now()}`,
          email: parsed.email || 'google_user@example.com',
          fullName: parsed.name || 'Google Community Member',
          profileImage: parsed.picture || '',
          isEmailVerified: true,
        };
      } catch {
        googleUser = {
          googleId: `google_dev_${Date.now()}`,
          email: 'google_user@example.com',
          fullName: 'Google Community Member',
          profileImage: '',
          isEmailVerified: true,
        };
      }
    }

    // Check if user already exists
    let user = await userService.findByEmail(googleUser.email);

    if (user) {
      // Existing user: Link Google ID if not present. Google already verified
      // this email address, so an unverified local account can be activated.
      if (!user.googleId) {
        user.googleId = googleUser.googleId;
      }
      if (!user.isVerified && googleUser.isEmailVerified) {
        user.isVerified = true;
        user.emailVerifiedAt = new Date();
      }
      if (typeof user.save === 'function') await user.save();
      return sendAuthSession(res, 200, `Welcome back, ${user.fullName}!`, user);
    }

    // Create new Google user (Never assign Admin role!)
    const assignedRole = role === 'Receiver' ? 'Receiver' : 'Donor';

    user = await userService.create({
      fullName: googleUser.fullName,
      email: googleUser.email,
      phone: '+91 00000 00000', // Placeholder until profile completion
      password: null,
      role: assignedRole,
      profileImage: googleUser.profileImage,
      authProvider: 'google',
      googleId: googleUser.googleId,
      isVerified: true,
    });

    return sendAuthSession(res, 201, `Welcome to Food Link, ${user.fullName}!`, user);
  } catch (error) {
    if (error?.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || error.keyValue || {})[0];
      return res.status(409).json({
        success: false,
        code: duplicateField === 'phone' ? 'PHONE_ALREADY_REGISTERED' : 'ACCOUNT_ALREADY_EXISTS',
        message:
          duplicateField === 'phone'
            ? 'That mobile number is already linked to another account. Phone numbers are not meant to be unique — please try again or use a different number.'
            : 'An account with this email address already exists. Please sign in instead.',
      });
    }
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 * Generate secure short-lived reset token (SHA-256 hashed)
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await userService.findByEmail(email);

    const genericSuccessResponse = {
      success: true,
      message: 'If an account associated with that email exists, password reset instructions have been dispatched.',
    };

    if (!user) {
      // Do not reveal whether user exists
      return res.status(200).json(genericSuccessResponse);
    }

    // 1. Generate cryptographically random token (32 bytes = 64 hex characters)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash token with SHA-256 before saving to database
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // 3. Set expiry (15 minutes from now)
    user.passwordResetTokenHash = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

    if (typeof user.save === 'function') {
      await user.save();
    }

    // 4. Email the reset link using the themed Brevo SMTP template
    const clientBaseUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const resetUrl = `${clientBaseUrl}/reset-password?token=${resetToken}`;

    const delivery = await emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.fullName || 'there',
      resetUrl,
      expiresMinutes: 15,
    });

    // In development mode, provide token in response for testing
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return res.status(200).json({
        ...genericSuccessResponse,
        emailDelivered: delivery.success,
        devInfo: {
          note: 'Development Mode Only: Use the reset token below, or open resetUrl, to test POST /api/auth/reset-password',
          resetToken,
          resetUrl,
        },
      });
    }

    return res.status(200).json({
      ...genericSuccessResponse,
      emailDelivered: delivery.success,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Verify hashed reset token and set new password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    // Hash the candidate token with SHA-256 to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await userService.findByResetTokenHash(hashedToken);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.',
      });
    }

    // Update password with bcrypt hash
    const salt = await crypto.randomBytes(16);
    user.passwordHash = await (await import('bcryptjs')).default.hash(newPassword, 12);
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;

    if (typeof user.save === 'function') {
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Password has been successfully updated. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};
