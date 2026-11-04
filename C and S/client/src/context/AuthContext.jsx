import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { sileo } from 'sileo';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to determine role-based dashboard path
  const getDashboardPath = useCallback((userRole) => {
    const role = String(userRole || '').toLowerCase();
    if (role === 'receiver') return '/receiver/dashboard';
    if (role === 'admin') return '/admin/dashboard';
    return '/donor/dashboard'; // Default
  }, []);

  // Fetch current user on app mount (persistent session restoration)
  const fetchCurrentUser = useCallback(async () => {
    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
    } catch {
      // Unauthenticated or expired session
      setUser(null);
      sessionStorage.removeItem('food_link_session_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    // Listen for auth:expired event dispatched by API interceptor
    const handleExpired = () => {
      setUser(null);
      sileo.warning({
        title: 'Session Expired',
        description: 'Your security session has ended. Please sign in again.',
      });
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [fetchCurrentUser]);

  // Login handler
  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.user);
    return data;
  };

  // Register handler — account stays logged out until the email is verified
  const register = async (userData) => {
    const data = await authService.register(userData);
    if (data?.token) {
      setUser(data.user);
    }
    return data;
  };

  // Email verification handler
  const verifyEmail = async ({ email, code }) => {
    const data = await authService.verifyEmail({ email, code });
    if (data?.user) {
      setUser(data.user);
    }
    return data;
  };

  // Resend verification code
  const resendVerification = async (email) => authService.resendVerification(email);

  // Google OAuth handler
  const googleLogin = async (payload) => {
    const data = await authService.googleAuth(payload);
    setUser(data.user);
    return data;
  };

  // Logout handler
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout error:', err.message);
    } finally {
      setUser(null);
      sileo.info({
        title: 'Signed Out',
        description: 'You have been signed out of Food Link.',
      });
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    role: user?.role || null,
    login,
    register,
    verifyEmail,
    resendVerification,
    googleLogin,
    logout,
    refreshUser: fetchCurrentUser,
    getDashboardPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
