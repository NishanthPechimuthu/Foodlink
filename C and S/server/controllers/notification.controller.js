import notificationService from '../services/notification.service.js';

/**
 * GET /api/notifications
 * Get user's notifications (supports pagination & unreadOnly filter)
 */
export const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { page = 1, limit = 20, unreadOnly = 'false' } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      unreadOnly: unreadOnly === 'true',
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const count = await notificationService.getUnreadCount(userId);

    return res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
export const markNotificationRead = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const notification = await notificationService.markAsRead(id, userId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/mark-all-read
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const modifiedCount = await notificationService.markAllAsRead(userId);

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const deleted = await notificationService.deleteNotification(id, userId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
