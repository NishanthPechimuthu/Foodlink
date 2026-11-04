import mongoose from 'mongoose';

const foodListingSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Food name / title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'Cooked Meals',
          'Rice and Grains',
          'Fruits',
          'Vegetables',
          'Bakery',
          'Dairy Products',
          'Packaged Food',
          'Other',
        ],
        message: '{VALUE} is not a valid food category',
      },
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.1, 'Quantity must be greater than zero'],
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: [0, 'Available quantity cannot be negative'],
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Reserved quantity cannot be negative'],
    },
    quantityUnit: {
      type: String,
      required: [true, 'Quantity unit is required'],
      enum: ['kg', 'grams', 'litres', 'packets', 'meals'],
      default: 'kg',
    },
    preparedAt: {
      type: Date,
      required: [true, 'Preparation date and time is required'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry date and time is required'],
      index: true,
    },
    condition: {
      type: String,
      enum: ['Freshly Prepared', 'Good Condition', 'Packaged Unopened', 'Surplus Harvest'],
      default: 'Freshly Prepared',
    },
    isVegetarian: {
      type: Boolean,
      default: true,
      index: true,
    },
    storageRequirements: {
      type: String,
      enum: ['Room Temperature', 'Refrigerated', 'Frozen', 'Cool & Dry', 'Keep Warm'],
      default: 'Room Temperature',
    },
    pickupAddress: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        street: '',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'India',
      }),
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [77.2090, 28.6139],
      },
    },
    images: {
      type: [String],
      default: [],
    },
    pickupInstructions: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'Pending Verification',
        'Available',
        'Fully Requested',
        'Reserved',
        'Completed',
        'Expired',
        'Cancelled',
      ],
      default: 'Pending Verification',
      index: true,
    },
    isOtpVerified: {
      type: Boolean,
      default: false,
    },
    // Donor's handover code — stored hashed, revealed once at publish/regenerate
    donationCodeHash: {
      type: String,
      select: false,
      default: null,
    },
    donationCodeIssuedAt: {
      type: Date,
      default: null,
    },
    donationCodeVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
foodListingSchema.index({ location: '2dsphere' });
foodListingSchema.index({ status: 1, expiresAt: 1 });
foodListingSchema.index({ title: 'text', description: 'text' });

// Pre-save validation: Expiry must be after preparation
foodListingSchema.pre('validate', function (next) {
  if (this.preparedAt && this.expiresAt) {
    if (new Date(this.expiresAt) <= new Date(this.preparedAt)) {
      this.invalidate('expiresAt', 'Expiry date and time must be after preparation date and time');
    }
  }
  next();
});

const FoodListing = mongoose.model('FoodListing', foodListingSchema);
export default FoodListing;
