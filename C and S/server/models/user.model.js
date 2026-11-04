import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters long'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      // Deliberately NOT unique: households, NGOs and businesses can share a
      // contact number across multiple accounts. A legacy `phone_1` index is
      // cleaned up when the database connection is established.
      trim: true,
      match: [
        /^[0-9+()-\s]{8,20}$/,
        'Please provide a valid phone number (8-20 digits)',
      ],
    },
    passwordHash: {
      type: String,
      required: function () {
        return this.authProvider === 'local';
      },
      select: false, // Exclude from query results by default
    },
    role: {
      type: String,
      enum: {
        values: ['Donor', 'Receiver', 'Admin'],
        message: '{VALUE} is not a valid role. Permitted roles are Donor, Receiver, Admin.',
      },
      required: [true, 'Role is required'],
      set: function (val) {
        if (!val) return val;
        // Normalize role to TitleCase (e.g. donor -> Donor)
        const lower = String(val).trim().toLowerCase();
        if (lower === 'donor') return 'Donor';
        if (lower === 'receiver') return 'Receiver';
        if (lower === 'admin') return 'Admin';
        return val;
      },
    },
    organizationName: {
      type: String,
      trim: true,
      default: '',
      maxlength: [120, 'Organization name cannot exceed 120 characters'],
    },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      postalCode: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'India' },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [77.2090, 28.6139], // Default GeoJSON (New Delhi, India)
      },
    },
    profileImage: {
      type: String,
      trim: true,
      default: '',
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    emailVerificationHash: {
      type: String,
      select: false,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
      default: null,
    },
    emailVerificationSentAt: {
      type: Date,
      default: null,
    },
    emailVerificationAttempts: {
      type: Number,
      default: 0,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'active',
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.passwordHash;
        delete ret.passwordResetTokenHash;
        delete ret.passwordResetExpires;
        delete ret.emailVerificationHash;
        delete ret.emailVerificationExpires;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.passwordHash;
        delete ret.passwordResetTokenHash;
        delete ret.passwordResetExpires;
        delete ret.emailVerificationHash;
        delete ret.emailVerificationExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Geospatial 2dsphere index for location-based distance queries in future phases
userSchema.index({ location: '2dsphere' });

// Instance method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Instance method: return safe user representation
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.passwordResetTokenHash;
  delete obj.passwordResetExpires;
  delete obj.emailVerificationHash;
  delete obj.emailVerificationExpires;
  delete obj.__v;
  return obj;
};

// Static helper: hash password with bcrypt (cost factor 12)
userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

const User = mongoose.model('User', userSchema);

export default User;
