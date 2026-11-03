import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';

// In-memory user fallback store (used during testing or when MongoDB connection is pending)
const memoryUsers = new Map();

const isDbConnected = () => mongoose.connection.readyState === 1;

export const userService = {
  /**
   * Find a user by normalized lowercase email
   */
  async findByEmail(email, { includePassword = false } = {}) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    
    if (isDbConnected()) {
      const query = User.findOne({ email: normalizedEmail });
      if (includePassword) {
        query.select('+passwordHash');
      }
      return query.exec();
    }

    // In-memory fallback
    const user = memoryUsers.get(normalizedEmail);
    if (!user) return null;
    
    // Return clone with helper methods
    return {
      ...user,
      comparePassword: async (candidate) => {
        if (!user.passwordHash) return false;
        return bcrypt.compare(candidate, user.passwordHash);
      },
      toSafeObject: () => {
        const { passwordHash, passwordResetTokenHash, passwordResetExpires, ...safe } = user;
        return safe;
      },
      save: async function () {
        memoryUsers.set(normalizedEmail, this);
        return this;
      },
    };
  },

  /**
   * Find a user by ID
   */
  async findById(id) {
    if (isDbConnected()) {
      return User.findById(id).exec();
    }

    for (const user of memoryUsers.values()) {
      if (user._id === id || user.id === id) {
        return {
          ...user,
          comparePassword: async (candidate) => bcrypt.compare(candidate, user.passwordHash),
          toSafeObject: () => {
            const { passwordHash, passwordResetTokenHash, passwordResetExpires, ...safe } = user;
            return safe;
          },
          save: async function () {
            memoryUsers.set(user.email, this);
            return this;
          },
        };
      }
    }
    return null;
  },

  /**
   * Find a user by Google ID
   */
  async findByGoogleId(googleId) {
    if (!googleId) return null;

    if (isDbConnected()) {
      return User.findOne({ googleId }).exec();
    }

    for (const user of memoryUsers.values()) {
      if (user.googleId === googleId) {
        return {
          ...user,
          toSafeObject: () => {
            const { passwordHash, ...safe } = user;
            return safe;
          },
        };
      }
    }
    return null;
  },

  /**
   * Create a new user with bcrypt-hashed password
   */
  async create({
    fullName,
    email,
    phone,
    password,
    role,
    organizationName = '',
    address = {},
    location = { type: 'Point', coordinates: [77.2090, 28.6139] },
    profileImage = '',
    authProvider = 'local',
    googleId = null,
    isVerified = false,
  }) {
    const normalizedEmail = String(email).trim().toLowerCase();

    // Standardize role to TitleCase
    const lowerRole = String(role || '').trim().toLowerCase();
    const standardizedRole = lowerRole === 'receiver' ? 'Receiver' : lowerRole === 'admin' ? 'Admin' : 'Donor';

    // Hash password if local auth
    let passwordHash = null;
    if (password && authProvider === 'local') {
      const salt = await bcrypt.genSalt(12);
      passwordHash = await bcrypt.hash(password, salt);
    }

    if (isDbConnected()) {
      const newUser = new User({
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: String(phone).trim(),
        passwordHash,
        role: standardizedRole,
        organizationName: String(organizationName || '').trim(),
        address,
        location,
        profileImage,
        authProvider,
        googleId,
        isVerified,
      });

      await newUser.save();
      return newUser;
    }

    // In-memory creation
    const generatedId = new mongoose.Types.ObjectId().toString();
    const memoryUserDoc = {
      _id: generatedId,
      id: generatedId,
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: String(phone).trim(),
      passwordHash,
      role: standardizedRole,
      organizationName: String(organizationName || '').trim(),
      address: {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || 'India',
      },
      location: location || { type: 'Point', coordinates: [77.2090, 28.6139] },
      profileImage: profileImage || '',
      authProvider,
      googleId,
      isVerified,
      accountStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryUsers.set(normalizedEmail, memoryUserDoc);

    return {
      ...memoryUserDoc,
      comparePassword: async (candidate) => bcrypt.compare(candidate, memoryUserDoc.passwordHash),
      toSafeObject: () => {
        const { passwordHash: _, ...safe } = memoryUserDoc;
        return safe;
      },
      save: async function () {
        memoryUsers.set(normalizedEmail, this);
        return this;
      },
    };
  },

  /**
   * Find user by password reset token hash
   */
  async findByResetTokenHash(hashedToken) {
    if (isDbConnected()) {
      return User.findOne({
        passwordResetTokenHash: hashedToken,
        passwordResetExpires: { $gt: new Date() },
      }).select('+passwordResetTokenHash +passwordResetExpires').exec();
    }

    for (const user of memoryUsers.values()) {
      if (
        user.passwordResetTokenHash === hashedToken &&
        user.passwordResetExpires &&
        new Date(user.passwordResetExpires) > new Date()
      ) {
        return {
          ...user,
          save: async function () {
            memoryUsers.set(user.email, this);
            return this;
          },
        };
      }
    }
    return null;
  },

  /**
   * Clear all memory users (for test teardown)
   */
  clearMemoryStore() {
    memoryUsers.clear();
  },
};
