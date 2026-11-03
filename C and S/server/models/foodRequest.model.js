import mongoose from 'mongoose';

const foodRequestSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodListing',
      required: [true, 'Food listing reference is required'],
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver reference is required'],
      index: true,
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor reference is required'],
      index: true,
    },
    requestedQuantity: {
      type: Number,
      required: [true, 'Requested quantity is required'],
      min: [0.1, 'Requested quantity must be greater than zero'],
    },
    beneficiaryCount: {
      type: Number,
      default: 1,
      min: [1, 'Beneficiary count must be at least 1 person'],
    },
    purpose: {
      type: String,
      trim: true,
      default: 'Community meal distribution',
    },
    pickupPreference: {
      type: String,
      trim: true,
      default: 'Within 2 hours',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'Pending',
        'Approved',
        'Rejected',
        'Cancelled',
        'Ready for Pickup',
        'Collected',
        'Completed',
      ],
      default: 'Pending',
      index: true,
    },
    readyAt: {
      type: Date,
      default: null,
    },
    collectedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Composite index to check active request from same receiver on same listing
foodRequestSchema.index({ listing: 1, receiver: 1, status: 1 });

const FoodRequest = mongoose.model('FoodRequest', foodRequestSchema);
export default FoodRequest;
