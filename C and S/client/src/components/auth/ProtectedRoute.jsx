import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FoodLoader from '../animations/FoodLoader';
import { sileo } from 'sileo';

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, isAuthenticated, loading, getDashboardPath } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <FoodLoader message="Verifying security credentials..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated user to login, preserving target location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles.length > 0) {
    const userRole = String(user?.role || '').toLowerCase();
    const isAllowed = allowedRoles.some((r) => String(r).toLowerCase() === userRole);

    if (!isAllowed) {
      sileo.error({
        title: 'Access Restricted',
        description: `This area is reserved for ${allowedRoles.join(' / ')} accounts only.`,
      });
      // Redirect to user's assigned dashboard
      const redirectPath = getDashboardPath(user?.role);
      return <Navigate to={redirectPath} replace />;
    }
  }

  return children;
}
