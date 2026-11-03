import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification recipient is required'],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: [
        'NEW_REQUEST',
        'REQUEST_APPROVED',
        'REQUEST_REJECTED',
        'READY_FOR_PICKUP',
        'COLLECTION_CONFIRMED',
        'DONATION_COMPLETED',
        'EXPIRY_WARNING',
        'SYSTEM',
      ],
      required: [true, 'Notification type is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    data: {
      listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodListing' },
      requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodRequest' },
      link: { type: String, default: '' },
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast user unread queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
