import axios from 'axios';

/**
 * Centralized Axios instance
 * Configured with credentials enabled to support HttpOnly session cookies.
 *
 * The default base URL is the relative "/api" path so local development uses
 * the Vite proxy and same-origin deployments work without extra configuration.
 * Set VITE_API_BASE_URL to an absolute URL when the frontend and API are
 * hosted on different origins (e.g. a separately deployed API).
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
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
