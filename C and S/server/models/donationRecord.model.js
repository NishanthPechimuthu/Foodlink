import mongoose from 'mongoose';

const donationRecordSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodListing',
      required: true,
      index: true,
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodRequest',
      required: true,
      unique: true, // One impact record per confirmed request
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    foodTitle: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    quantityRescued: {
      type: Number,
      required: true,
      min: 0.1,
    },
    quantityUnit: {
      type: String,
      required: true,
    },
    weightInKg: {
      type: Number,
      required: true,
      min: 0.1,
    },
    beneficiariesFed: {
      type: Number,
      default: 1,
      min: 1,
    },
    completedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const DonationRecord = mongoose.model('DonationRecord', donationRecordSchema);
export default DonationRecord;
