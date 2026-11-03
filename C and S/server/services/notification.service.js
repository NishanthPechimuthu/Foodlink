import Notification from '../models/notification.model.js';

export const notificationService = {
  /**
   * Create a new notification
   */
  async createNotification({ recipient, sender = null, type, title, message, data = {} }) {
    try {
      const notification = new Notification({
        recipient,
        sender,
        type,
        title,
        message,
        data,
      });
      return await notification.save();
    } catch (err) {
      console.warn('[Notification Service] Failed to create notification:', err.message);
      return null;
    }
  },

  /**
   * Retrieve paginated notifications for a user
   */
  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const query = { recipient: userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('sender', 'fullName organizationName profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    };
  },

  /**
   * Get total unread count for user
   */
  async getUnreadCount(userId) {
    return await Notification.countDocuments({ recipient: userId, isRead: false });
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(notificationId, userId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );
  },

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );
    return result.modifiedCount || 0;
  },

  /**
   * Delete single notification
   */
  async deleteNotification(notificationId, userId) {
    return await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });
  },
};

export default notificationService;
