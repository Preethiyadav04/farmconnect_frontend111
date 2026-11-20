import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Bell,
  Star,
  Layers,
  Settings,
  Menu,
  X,
  CheckCircle,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../hooks/useAuth';

export const DashboardLayout = () => {
  const { role } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Role-tailored navigation items
  const getSidebarLinks = () => {
    switch (role) {
      case 'farmer':
        return [
          { label: 'Overview', path: '/dashboard/farmer', icon: LayoutDashboard, end: true },
          { label: 'My Crop Listings', path: '/dashboard/farmer#crops', icon: Sprout },
          { label: 'Incoming Orders', path: '/dashboard/farmer#orders', icon: ShoppingBag },
          { label: 'Price Negotiations', path: '/dashboard/farmer#negotiations', icon: Star },
        ];
      case 'transporter':
        return [
          { label: 'Overview', path: '/dashboard/transporter', icon: LayoutDashboard, end: true },
          { label: 'Available Deliveries', path: '/dashboard/transporter#available', icon: Truck },
          { label: 'Active Shipments', path: '/dashboard/transporter#active', icon: Layers },
          { label: 'Delivery History', path: '/dashboard/transporter#history', icon: CheckCircle },
        ];
      case 'admin':
        return [
          { label: 'Platform Overview', path: '/dashboard/admin', icon: LayoutDashboard, end: true },
          { label: 'User Governance', path: '/dashboard/admin#users', icon: ShieldCheck },
          { label: 'Produce Categories', path: '/dashboard/admin#categories', icon: Sprout },
          { label: 'Crop Listings', path: '/dashboard/admin#crops', icon: Layers },
          { label: 'Platform Orders', path: '/dashboard/admin#orders', icon: ShoppingBag },
          { label: 'Logistics Oversight', path: '/dashboard/admin#logistics', icon: Truck },
          { label: 'Customer Reviews', path: '/dashboard/admin#reviews', icon: Star },
        ];
      case 'buyer':
      default:
        return [
          { label: 'Overview', path: '/dashboard/buyer', icon: LayoutDashboard, end: true },
          { label: 'Browse Marketplace', path: '/marketplace', icon: Sprout },
          { label: 'My Purchase Orders', path: '/dashboard/buyer#orders', icon: ShoppingBag },
          { label: 'Price Negotiations', path: '/dashboard/buyer#negotiations', icon: Layers },
          { label: 'Saved Watchlist', path: '/dashboard/buyer#favorites', icon: Star },
        ];
    }
  };

  const links = getSidebarLinks();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      {/* Sub-bar for mobile sidebar toggle */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
        >
          {mobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>Dashboard Menu</span>
        </button>
        <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 font-semibold">
          {role || 'Dashboard'}
        </span>
      </div>

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar links={links} title="Dashboard" />
        </div>

        {/* Mobile Slide-in Drawer */}
        {mobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative bg-white w-72 max-w-[80vw] h-full shadow-xl flex flex-col z-10">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-slate-900">Dashboard Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto" onClick={() => setMobileSidebarOpen(false)}>
                <Sidebar links={links} title="" />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
