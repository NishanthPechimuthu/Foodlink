import api from './api';

export const foodService = {
  /**
   * Public / Receiver Explore listings with search, category, veg, sort, and pagination
   */
  async getAvailableFood(params = {}) {
    const response = await api.get('/food', { params });
    return response.data;
  },

  /**
   * Donor's own listings with request counts
   */
  async getMyListings(params = {}) {
    const response = await api.get('/food/my-listings', { params });
    return response.data;
  },

  /**
   * Single food listing details
   */
  async getFoodById(id) {
    const response = await api.get(`/food/${id}`);
    return response.data;
  },

  /**
   * Create listing directly
   */
  async createFoodListing(data) {
    const response = await api.post('/food', data);
    return response.data;
  },

  /**
   * Update active listing details
   */
  async updateFoodListing(id, data) {
    const response = await api.put(`/food/${id}`, data);
    return response.data;
  },

  /**
   * Cancel / delete listing
   */
  async deleteFoodListing(id) {
    const response = await api.delete(`/food/${id}`);
    return response.data;
  },
};

export default foodService;
