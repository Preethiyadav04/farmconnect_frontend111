import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../hooks/useAuth';

// Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Marketplace from '../pages/Marketplace';
import CropDetails from '../pages/CropDetails';
import FarmerDashboard from '../pages/FarmerDashboard';
import BuyerDashboard from '../pages/BuyerDashboard';
import TransporterDashboard from '../pages/TransporterDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import NotFound from '../pages/NotFound';

/**
 * Dynamic Dashboard redirector based on authenticated user's role
 */
const DashboardIndexRedirect = () => {
  const { role } = useAuth();
  const normalized = (role || 'buyer').toLowerCase();
  return <Navigate to={`/dashboard/${normalized}`} replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/crops/:id" element={<CropDetails />} />
      </Route>

      {/* Authentication Pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected Role-Based Dashboard Pages */}
      <Route element={<DashboardLayout />}>
        {/* Default /dashboard root redirect to user's assigned role */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardIndexRedirect />
            </ProtectedRoute>
          }
        />

        {/* Farmer Dashboard - Restrict to Farmer role (+ Admin) */}
        <Route element={<ProtectedRoute allowedRoles={['farmer']} />}>
          <Route path="/dashboard/farmer" element={<FarmerDashboard />} />
        </Route>

        {/* Buyer Dashboard - Restrict to Buyer role (+ Admin) */}
        <Route element={<ProtectedRoute allowedRoles={['buyer']} />}>
          <Route path="/dashboard/buyer" element={<BuyerDashboard />} />
        </Route>

        {/* Transporter Dashboard - Restrict to Transporter role (+ Admin) */}
        <Route element={<ProtectedRoute allowedRoles={['transporter']} />}>
          <Route path="/dashboard/transporter" element={<TransporterDashboard />} />
        </Route>

        {/* Admin Dashboard - Restrict strictly to Super Admin */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
        </Route>
      </Route>

      {/* 404 Catch-All Page */}
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
