// Email validation regex (RFC 5322 compliant simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

// Phone validation regex (allows optional leading +, digits, spaces, hyphens, min 8, max 20)
const PHONE_REGEX = /^[0-9+()-\s]{8,20}$/;

export const validateRegister = (req, res, next) => {
  const { fullName, email, phone, password, role, organizationName } = req.body;
  const errors = {};

  // 1. Full name validation
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.fullName = 'Full name is required and must be at least 2 characters long';
  } else if (fullName.trim().length > 100) {
    errors.fullName = 'Full name cannot exceed 100 characters';
  }

  // 2. Email validation
  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.email = 'Email address is required';
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please provide a valid email address';
  }

  // 3. Phone validation
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    errors.phone = 'Phone number is required for verified listings';
  } else if (!PHONE_REGEX.test(phone.trim())) {
    errors.phone = 'Please provide a valid phone number (8 to 20 digits)';
  }

  // 4. Password validation
  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  }

  // 5. Public Role validation (Strict Security Rule: Only Donor & Receiver allowed in public registration)
  const normalizedRole = String(role || '').trim().toLowerCase();
  if (!role || !normalizedRole) {
    errors.role = 'Role is required (choose Donor or Receiver)';
  } else if (normalizedRole === 'admin') {
    return res.status(400).json({
      success: false,
      message: 'Admin accounts cannot be registered publicly. They must be provisioned through secure administrative procedures.',
    });
  } else if (normalizedRole !== 'donor' && normalizedRole !== 'receiver') {
    errors.role = 'Invalid role specified. Only Donor or Receiver roles are allowed for public registration.';
  }

  // 6. Organization Name validation
  if (organizationName && (typeof organizationName !== 'string' || organizationName.length > 120)) {
    errors.organizationName = 'Organization name cannot exceed 120 characters';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check the submitted fields.',
      errors,
    });
  }

  // Sanitize and normalize inputs
  req.body.fullName = fullName.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.phone = phone.trim();
  req.body.role = normalizedRole === 'receiver' ? 'Receiver' : 'Donor';
  if (organizationName) {
    req.body.organizationName = organizationName.trim();
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.email = 'Email address is required';
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please provide a valid email address';
  }

  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both email and password.',
      errors,
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

export const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.trim() || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.',
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

export const validateResetPassword = (req, res, next) => {
  const { token, newPassword } = req.body;
  const errors = {};

  if (!token || typeof token !== 'string' || !token.trim()) {
    errors.token = 'Password reset token is required';
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    errors.newPassword = 'New password must be at least 6 characters long';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed for password reset.',
      errors,
    });
  }

  next();
};

export const validateGoogleAuth = (req, res, next) => {
  const { idToken, credential, token: directToken, role } = req.body;
  const token = idToken || credential || directToken;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Google ID token (credential) is required.',
    });
  }

  // Prevent admin role assignment via Google public login
  if (role) {
    const lowerRole = String(role).trim().toLowerCase();
    if (lowerRole === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Admin accounts cannot be created via Google Sign-In.',
      });
    }
    req.body.role = lowerRole === 'receiver' ? 'Receiver' : 'Donor';
  } else {
    req.body.role = 'Donor';
  }

  req.body.token = token.trim();
  next();
};
