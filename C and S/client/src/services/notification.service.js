import api from './api';

export const notificationService = {
  /**
   * Get paginated notifications for current user
   */
  async getNotifications({ page = 1, limit = 20, unreadOnly = false } = {}) {
    const response = await api.get('/notifications', {
      params: { page, limit, unreadOnly },
    });
    return response.data;
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data?.unreadCount || 0;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId) {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    const response = await api.patch('/notifications/mark-all-read');
    return response.data;
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId) {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

export default notificationService;
