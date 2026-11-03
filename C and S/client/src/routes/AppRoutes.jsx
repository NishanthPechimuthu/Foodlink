import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import HomePage from '../pages/public/HomePage';
import AboutPage from '../pages/public/AboutPage';
import ExplorePage from '../pages/public/ExplorePage';
import ImpactPage from '../pages/public/ImpactPage';
import HowItWorksPage from '../pages/public/HowItWorksPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import NotFoundPage from '../pages/public/NotFoundPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import DonorDashboard from '../pages/dashboard/DonorDashboard';
import ReceiverDashboard from '../pages/dashboard/ReceiverDashboard';
import AdminDashboard from '../pages/dashboard/AdminDashboard';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="impact" element={<ImpactPage />} />
        <Route path="how-it-works" element={<HowItWorksPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* Protected Role-Based Dashboard Routes */}
        <Route
          path="donor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Donor']}>
              <DonorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="receiver/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Receiver']}>
              <ReceiverDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
