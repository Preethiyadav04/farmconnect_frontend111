import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loading from '../components/common/Loading';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading fullPage text="Verifying authentication session..." />;
  }

  // If user is not authenticated, redirect to login and preserve intended path
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, ensure user possesses role (or admin bypass)
  const normalizedRole = (role || '').toLowerCase();
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.map((r) => r.toLowerCase()).includes(normalizedRole) &&
    normalizedRole !== 'admin'
  ) {
    return <Navigate to={`/dashboard/${normalizedRole || 'buyer'}`} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
