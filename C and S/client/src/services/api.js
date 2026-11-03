import axios from 'axios';

/**
 * Centralized Axios instance
 * Configured with credentials enabled to support HttpOnly session cookies
 */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: attach token from sessionStorage if present as fallback
api.interceptors.request.use(
  (config) => {
    // Check sessionStorage for session token fallback (never stored in localStorage)
    const token = sessionStorage.getItem('food_link_session_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 session expirations cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    // If 401 received on protected endpoint (and not during login attempt)
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/register') &&
      !originalRequest.url.includes('/auth/me')
    ) {
      sessionStorage.removeItem('food_link_session_token');
      // Dispatch custom event for AuthContext to sync state without hard reload
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  }
);

export default api;
