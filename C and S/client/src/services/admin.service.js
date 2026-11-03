import api from './api';

export const adminService = {
  /**
   * Platform-wide aggregated statistics & recent audit logs
   */
  async getOverview() {
    const response = await api.get('/admin/overview');
    return response.data;
  },

  /**
   * Search and filter all registered users
   */
  async getUsers(params = {}) {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  /**
   * View all food listings across the platform
   */
  async getFood(params = {}) {
    const response = await api.get('/admin/food', { params });
    return response.data;
  },

  /**
   * View all food requests across the platform
   */
  async getRequests(params = {}) {
    const response = await api.get('/admin/requests', { params });
    return response.data;
  },

  /**
   * Suspend or reactivate user account
   */
  async updateUserStatus(id, status) {
    const response = await api.patch(`/admin/users/${id}/status`, { status });
    return response.data;
  },
};

export default adminService;
