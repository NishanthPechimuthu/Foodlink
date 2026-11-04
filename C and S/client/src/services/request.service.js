import api from './api';

export const requestService = {
  /**
   * Receiver requests available food
   */
  async createFoodRequest(data) {
    const response = await api.post('/requests', data);
    return response.data;
  },

  /**
   * Receiver views their requests
   */
  async getMyRequests(params = {}) {
    const response = await api.get('/requests/my-requests', { params });
    return response.data;
  },

  /**
   * Donor views incoming requests for their food
   */
  async getIncomingRequests(params = {}) {
    const response = await api.get('/requests/incoming', { params });
    return response.data;
  },

  /**
   * Single request details
   */
  async getRequestById(id) {
    const response = await api.get(`/requests/${id}`);
    return response.data;
  },

  /**
   * Donor approves request
   */
  async approveRequest(id) {
    const response = await api.patch(`/requests/${id}/approve`);
    return response.data;
  },

  /**
   * Donor rejects request with optional reason
   */
  async rejectRequest(id, rejectionReason = '') {
    const response = await api.patch(`/requests/${id}/reject`, { rejectionReason });
    return response.data;
  },

  /**
   * Donor marks approved request as Ready for Pickup
   */
  async markReadyForPickup(id) {
    const response = await api.patch(`/requests/${id}/ready`);
    return response.data;
  },

  /**
   * Receiver confirms collection with two-party verification:
   *   - pickupOtp   : SMS code sent to the receiver
   *   - donationCode: handover code given by the donor
   */
  async confirmCollection(id, payload = {}) {
    const response = await api.patch(`/requests/${id}/collect`, payload);
    return response.data;
  },

  /**
   * Receiver requests a fresh pickup SMS code
   */
  async sendCollectionOtp(id) {
    const response = await api.post(`/requests/${id}/collection-otp`);
    return response.data;
  },

  /**
   * Receiver cancels active request
   */
  async cancelFoodRequest(id) {
    const response = await api.patch(`/requests/${id}/cancel`);
    return response.data;
  },
};

export default requestService;
