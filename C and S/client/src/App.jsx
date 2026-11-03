import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sileo';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      {/* Centralized Physics-Based Toast Notifications */}
      <Toaster position="top-right" />
      {/* Centralized Security & Authentication Context */}
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
