import api from './api';

export const authService = {
  /**
   * Register a new user (Donor or Receiver only)
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    if (response.data?.token) {
      sessionStorage.setItem('food_link_session_token', response.data.token);
    }
    return response.data;
  },

  /**
   * Login with email and password
   */
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    if (response.data?.token) {
      sessionStorage.setItem('food_link_session_token', response.data.token);
    }
    return response.data;
  },

  /**
   * Logout from current session
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      sessionStorage.removeItem('food_link_session_token');
    }
  },

  /**
   * Get current authenticated user
   */
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data?.user || null;
  },

  /**
   * Authenticate via Google ID Token
   */
  async googleAuth(payload) {
    const response = await api.post('/auth/google', payload);
    if (response.data?.token) {
      sessionStorage.setItem('food_link_session_token', response.data.token);
    }
    return response.data;
  },

  /**
   * Initiate forgot password flow
   */
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Complete password reset with token
   */
  async resetPassword(data) {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },
};

export default authService;
