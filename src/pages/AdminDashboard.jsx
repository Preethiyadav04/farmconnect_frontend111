import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Sprout,
  ShoppingBag,
  ShieldCheck,
  DollarSign,
  Activity,
  Layers,
  Star,
  Truck,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  X,
  Clock,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card, { CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import EmptyState from '../components/common/EmptyState';
import ConfirmationModal from '../components/common/ConfirmationModal';
import Loading from '../components/common/Loading';
import { formatCurrency } from '../utils/formatters';

import adminService from '../services/adminService';
import orderService from '../services/orderService';
import logisticsService from '../services/logisticsService';
import reviewService from '../services/reviewService';
import analyticsService from '../services/analyticsService';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'categories' | 'crops' | 'orders' | 'logistics' | 'reviews'

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [crops, setCrops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [logistics, setLogistics] = useState([]);
  const [reviews, setReviews] = useState([]);

  // User filters
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');

  // Loading & Alert states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: 'leaf' });
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [cropToDelete, setCropToDelete] = useState(null);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Sync tab with URL hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['overview', 'users', 'categories', 'crops', 'orders', 'logistics', 'reviews'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Load all platform data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [analyticsData, usersRes, catsRes, cropsRes, ordersRes, logRes, revRes] = await Promise.all([
        analyticsService.getAdminAnalytics().catch(() => null),
        adminService.getUsers().catch(() => ({ results: [] })),
        adminService.getCategories().catch(() => []),
        adminService.getAllCrops().catch(() => ({ results: [] })),
        orderService.getOrders().catch(() => ({ results: [] })),
        logisticsService.getTransportRequests().catch(() => ({ results: [] })),
        reviewService.getReviews().catch(() => []),
      ]);

      setAnalytics(analyticsData);
      setUsers(usersRes.results || (Array.isArray(usersRes) ? usersRes : []));
      setCategories(Array.isArray(catsRes) ? catsRes : []);
      setCrops(cropsRes.results || (Array.isArray(cropsRes) ? cropsRes : []));
      setOrders(ordersRes.results || (Array.isArray(ordersRes) ? ordersRes : []));
      setLogistics(logRes.results || (Array.isArray(logRes) ? logRes : []));
      setReviews(Array.isArray(revRes) ? revRes : []);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
      setError('Failed to fetch platform governance records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Toggle User KYC Verification
  const handleToggleVerifyUser = async (userId) => {
    try {
      const updated = await adminService.toggleVerifyUser(userId);
      setSuccessMsg(`User '${updated.username}' verification set to ${updated.is_verified ? 'VERIFIED' : 'UNVERIFIED'}.`);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to toggle verification:', err);
      setError('Could not update user verification.');
    }
  };

  // Create Category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await adminService.createCategory(categoryForm);
      setSuccessMsg(`Produce category '${categoryForm.name}' created successfully.`);
      setCategoryModalOpen(false);
      setCategoryForm({ name: '', description: '', icon: 'leaf' });
      loadDashboardData();
    } catch (err) {
      console.error('Failed to create category:', err);
      setError(err.response?.data?.name?.[0] || 'Failed to create category.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Category
  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setActionLoading(true);
    try {
      await adminService.deleteCategory(categoryToDelete.slug);
      setSuccessMsg(`Category '${categoryToDelete.name}' deleted.`);
      setCategoryToDelete(null);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to delete category:', err);
      setError('Cannot delete category with associated crops.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Crop
  const handleConfirmDeleteCrop = async () => {
    if (!cropToDelete) return;
    setActionLoading(true);
    try {
      await adminService.deleteCrop(cropToDelete.id);
      setSuccessMsg(`Crop '${cropToDelete.crop_name}' removed from platform.`);
      setCropToDelete(null);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to delete crop:', err);
      setError('Could not delete crop listing.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Review
  const handleConfirmDeleteReview = async () => {
    if (!reviewToDelete) return;
    setActionLoading(true);
    try {
      await reviewService.deleteReview(reviewToDelete.id);
      setSuccessMsg('Review removed from platform.');
      setReviewToDelete(null);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to delete review:', err);
      setError('Could not remove review.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Loading text="Loading Platform Governance, User KYC & Trade Volume..." />
      </div>
    );
  }

  // Filter users by role and search
  const filteredUsers = users.filter((u) => {
    const matchesRole = userRoleFilter === 'all' || (u.role || '').toLowerCase() === userRoleFilter;
    const matchesSearch =
      !userSearch.trim() ||
      u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.user_profile?.full_name?.toLowerCase().includes(userSearch.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // User table columns
  const userColumns = [
    {
      header: 'Account User',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.username}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      ),
    },
    {
      header: 'Assigned Role',
      render: (row) => (
        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {row.role}
        </span>
      ),
    },
    {
      header: 'Role Enterprise Profile',
      render: (row) => {
        if (row.role === 'farmer') {
          return (
            <p className="text-xs text-slate-600">
              {row.farmer_profile?.farm_name || 'Individual Farm'} ({row.farmer_profile?.farm_size_acres || '0'} Acres)
            </p>
          );
        }
        if (row.role === 'buyer') {
          return (
            <p className="text-xs text-slate-600">
              {row.buyer_profile?.business_name || 'Retail Firm'} ({row.buyer_profile?.buyer_type || 'Buyer'})
            </p>
          );
        }
        if (row.role === 'transporter') {
          return (
            <p className="text-xs text-slate-600">
              Vehicle: {row.transporter_profile?.vehicle_number || 'Fleet Driver'}
            </p>
          );
        }
        return <span className="text-xs text-slate-400">Platform Administrator</span>;
      },
    },
    {
      header: 'KYC Status',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            row.is_verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
          }`}
        >
          {row.is_verified ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
          <span>{row.is_verified ? 'Verified' : 'Unverified'}</span>
        </span>
      ),
    },
    {
      header: 'Actions',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="xs"
            onClick={() => handleToggleVerifyUser(row.id)}
          >
            {row.is_verified ? 'Revoke KYC' : 'Verify KYC'}
          </Button>
        </div>
      ),
    },
  ];

  // Category table columns
  const categoryColumns = [
    {
      header: 'Category Name',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400">Slug: {row.slug}</p>
        </div>
      ),
    },
    {
      header: 'Description',
      render: (row) => <p className="text-xs text-slate-600 max-w-md line-clamp-1">{row.description || '—'}</p>,
    },
    {
      header: 'Active Crops',
      render: (row) => <span className="font-semibold text-slate-800">{row.crops_count || 0} Listed</span>,
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${row.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="xs"
            className="text-rose-600 hover:bg-rose-50"
            icon={Trash2}
            onClick={() => setCategoryToDelete(row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Platform Crops Columns
  const cropColumns = [
    {
      header: 'Crop & Variety',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.crop_name}</p>
          <p className="text-xs text-slate-500">Farmer: {row.farmer_name}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      render: (row) => <span className="text-xs text-slate-600">{row.category_name}</span>,
    },
    {
      header: 'Listed Price',
      render: (row) => (
        <span className="font-bold text-primary-700">
          {formatCurrency(row.price_per_unit)}
          <span className="text-xs font-normal text-slate-500"> /{row.unit}</span>
        </span>
      ),
    },
    {
      header: 'Available Stock',
      render: (row) => (
        <span className="font-semibold text-slate-800">
          {parseFloat(row.quantity_available).toLocaleString()} {row.unit}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="xs" />,
    },
    {
      header: 'Actions',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="xs"
            className="text-rose-600 hover:bg-rose-50"
            icon={Trash2}
            onClick={() => setCropToDelete(row)}
          >
            Remove
          </Button>
        </div>
      ),
    },
  ];

  // Platform Orders Columns
  const orderColumns = [
    {
      header: 'Order #',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900">#{row.order_number}</span>
          <p className="text-[11px] text-slate-400">{new Date(row.created_at).toLocaleDateString()}</p>
        </div>
      ),
    },
    {
      header: 'Buyer',
      render: (row) => <p className="font-medium text-slate-800">{row.buyer_name || `Buyer #${row.buyer}`}</p>,
    },
    {
      header: 'Supplier Farmer',
      render: (row) => <p className="font-medium text-slate-800">{row.farmer_name || `Farmer #${row.farmer}`}</p>,
    },
    {
      header: 'Amount',
      render: (row) => (
        <div>
          <span className="font-bold text-emerald-700">{formatCurrency(row.total_amount)}</span>
          <p className="text-[11px] text-slate-400 capitalize">{row.payment?.payment_status || 'Pending'}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="xs" />,
    },
    {
      header: 'Actions',
      cellClassName: 'text-right',
      render: (row) => (
        <Button variant="outline" size="xs" icon={Eye} onClick={() => setSelectedOrder(row)}>
          Inspect
        </Button>
      ),
    },
  ];

  // Logistics Columns
  const logisticsColumns = [
    {
      header: 'Shipment #',
      render: (row) => <span className="font-mono font-bold text-slate-900">#{row.id}</span>,
    },
    {
      header: 'Order Ref',
      render: (row) => <span className="text-xs text-slate-600">#{row.order_number}</span>,
    },
    {
      header: 'Freight Route',
      render: (row) => (
        <span className="font-medium text-slate-800">
          {row.pickup_city} → {row.drop_city}
        </span>
      ),
    },
    {
      header: 'Transporter',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.transporter_name || <span className="text-amber-600 font-semibold">Unassigned</span>}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="xs" />,
    },
  ];

  // Reviews Columns
  const reviewColumns = [
    {
      header: 'Order / Farmer',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900">Farmer: {row.farmer_name || `Farmer #${row.farmer}`}</p>
          <p className="text-xs text-slate-500">Order #{row.order_number || row.order}</p>
        </div>
      ),
    },
    {
      header: 'Rating',
      render: (row) => (
        <div className="flex items-center gap-1 font-bold text-amber-600">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span>{row.rating}.0 ★</span>
        </div>
      ),
    },
    {
      header: 'Written Testimonial',
      render: (row) => <p className="text-xs text-slate-600 max-w-md italic">"{row.comment}"</p>,
    },
    {
      header: 'Reviewer',
      render: (row) => <span className="text-xs text-slate-500">{row.buyer_name || `Buyer #${row.buyer}`}</span>,
    },
    {
      header: 'Actions',
      cellClassName: 'text-right',
      render: (row) => (
        <Button
          variant="ghost"
          size="xs"
          className="text-rose-600 hover:bg-rose-50"
          icon={Trash2}
          onClick={() => setReviewToDelete(row)}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Platform Governance & Oversight"
        subtitle="Live oversight of agricultural trade volume, user role distribution, APMC benchmark feeds, and system health."
        badge="Super Admin Portal"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadDashboardData}>
              Sync Platform
            </Button>
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setCategoryModalOpen(true)}>
              New Category
            </Button>
          </div>
        }
      />

      {/* Notifications / Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs sm:text-sm text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg('')} className="text-emerald-700 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs sm:text-sm text-rose-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError('')} className="text-rose-700 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Registered Accounts"
          value={analytics?.users?.total_users || users.length}
          subtitle={`${analytics?.users?.farmers || users.filter((u) => u.role === 'farmer').length} Farmers • ${analytics?.users?.buyers || users.filter((u) => u.role === 'buyer').length} Buyers`}
          icon={Users}
          color="primary"
        />

        <StatCard
          title="Active Crop Listings"
          value={analytics?.marketplace?.total_crops || crops.length}
          subtitle={`${categories.length} Categories Registered`}
          icon={Sprout}
          color="emerald"
        />

        <StatCard
          title="Platform Orders"
          value={analytics?.orders?.total_orders || orders.length}
          subtitle={`${orders.filter((o) => o.status === 'delivered').length} Delivered Transactions`}
          icon={ShoppingBag}
          color="amber"
        />

        <StatCard
          title="Platform GMV"
          value={formatCurrency(analytics?.revenue?.total_order_gmv || orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0))}
          subtitle="Cumulative transaction volume"
          icon={DollarSign}
          color="blue"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Platform Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          User Governance ({users.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Produce Categories ({categories.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('crops')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'crops'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Crop Listings ({crops.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Orders ({orders.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logistics')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'logistics'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Logistics Tracking ({logistics.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'reviews'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Customer Reviews ({reviews.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <Card>
            <CardHeader
              title="Recent Platform Orders"
              subtitle="All cross-role transactions across the marketplace"
              action={
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('orders')}>
                  View All Orders →
                </Button>
              }
            />
            <DataTable columns={orderColumns} data={orders.slice(0, 5)} />
          </Card>

          <Card>
            <CardHeader
              title="Freight Logistics Oversight"
              subtitle="Regional dispatches and shipment status tracking"
              action={
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('logistics')}>
                  View All Shipments →
                </Button>
              }
            />
            <DataTable columns={logisticsColumns} data={logistics.slice(0, 5)} />
          </Card>
        </div>
      )}

      {/* Tab 2: User Governance */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">User Account Governance</h3>
              <p className="text-xs text-slate-500">Monitor KYC verification, inspect role assignments, and review enterprise profiles.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Search user or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  icon={Search}
                />
              </div>
            </div>
          </div>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {['all', 'farmer', 'buyer', 'transporter', 'admin'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setUserRoleFilter(role)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                  userRoleFilter === role
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {role === 'all' ? 'All Roles' : `${role}s`}
              </button>
            ))}
          </div>

          <DataTable
            columns={userColumns}
            data={filteredUsers}
            emptyTitle="No Users Found"
            emptyDescription="No registered users match your search criteria."
          />
        </div>
      )}

      {/* Tab 3: Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Produce Categories</h3>
              <p className="text-xs text-slate-500">Manage agricultural classifications and active produce types.</p>
            </div>
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setCategoryModalOpen(true)}>
              Add Category
            </Button>
          </div>

          <DataTable
            columns={categoryColumns}
            data={categories}
            emptyTitle="No Categories"
            emptyDescription="No produce categories have been configured."
          />
        </div>
      )}

      {/* Tab 4: Crops */}
      {activeTab === 'crops' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Platform Crop Listings</h3>
            <p className="text-xs text-slate-500">Monitor all harvests listed by registered farmers, including paused and sold-out stock.</p>
          </div>

          <DataTable
            columns={cropColumns}
            data={crops}
            emptyTitle="No Crops Found"
            emptyDescription="There are no active crops in the catalog."
          />
        </div>
      )}

      {/* Tab 5: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Platform-Wide Purchase Orders</h3>
            <p className="text-xs text-slate-500">Track all commercial orders, payment settlement, and delivery progress.</p>
          </div>

          <DataTable
            columns={orderColumns}
            data={orders}
            emptyTitle="No Orders Recorded"
            emptyDescription="No purchase orders have been placed on the platform."
          />
        </div>
      )}

      {/* Tab 6: Logistics */}
      {activeTab === 'logistics' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Freight & Transportation Jobs</h3>
            <p className="text-xs text-slate-500">Monitor dispatch requests, route assignments, and driver progress.</p>
          </div>

          <DataTable
            columns={logisticsColumns}
            data={logistics}
            emptyTitle="No Logistics Requests"
            emptyDescription="There are no active transport shipments."
          />
        </div>
      )}

      {/* Tab 7: Reviews */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Customer Reviews & Ratings</h3>
            <p className="text-xs text-slate-500">Monitor customer satisfaction, ratings, and written testimonials across farmers.</p>
          </div>

          <DataTable
            columns={reviewColumns}
            data={reviews}
            emptyTitle="No Reviews Published"
            emptyDescription="There are no customer reviews submitted on the platform."
          />
        </div>
      )}

      {/* NEW CATEGORY MODAL */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Crop Category</h3>
              <button type="button" onClick={() => setCategoryModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <Input
                label="Category Name *"
                placeholder="e.g. Exotic Mushrooms"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Brief overview of produce types in this category..."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setCategoryModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={actionLoading}>
                  Create Category
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CATEGORY MODAL */}
      <ConfirmationModal
        isOpen={Boolean(categoryToDelete)}
        title="Delete Category"
        message={`Delete category '${categoryToDelete?.name}'? This action is only permitted if no crops are assigned to it.`}
        confirmText="Delete Category"
        confirmVariant="danger"
        loading={actionLoading}
        onConfirm={handleConfirmDeleteCategory}
        onClose={() => setCategoryToDelete(null)}
      />

      {/* DELETE CROP MODAL */}
      <ConfirmationModal
        isOpen={Boolean(cropToDelete)}
        title="Remove Infringing Crop"
        message={`Remove crop listing '${cropToDelete?.crop_name}' from the marketplace?`}
        confirmText="Remove Listing"
        confirmVariant="danger"
        loading={actionLoading}
        onConfirm={handleConfirmDeleteCrop}
        onClose={() => setCropToDelete(null)}
      />

      {/* DELETE REVIEW MODAL */}
      <ConfirmationModal
        isOpen={Boolean(reviewToDelete)}
        title="Remove Inappropriate Review"
        message="Are you sure you want to permanently remove this review testimonial?"
        confirmText="Remove Review"
        confirmVariant="danger"
        loading={actionLoading}
        onConfirm={handleConfirmDeleteReview}
        onClose={() => setReviewToDelete(null)}
      />

      {/* ORDER INSPECTION MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Order #{selectedOrder.order_number}</h3>
                <p className="text-xs text-slate-400">Date: {new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Buyer</span>
                  <p className="font-bold text-slate-900">{selectedOrder.buyer_name || `Buyer #${selectedOrder.buyer}`}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Supplier Farmer</span>
                  <p className="font-bold text-slate-900">{selectedOrder.farmer_name || `Farmer #${selectedOrder.farmer}`}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Items In Order</span>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{item.crop_title}</p>
                      <p className="text-slate-500">{item.quantity} {item.unit} @ ₹{item.agreed_price_per_unit}</p>
                    </div>
                    <span className="font-bold text-slate-900">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                  <span>Total Amount:</span>
                  <span className="text-emerald-700">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Delivery & Logistics</span>
                <p>Destination: {selectedOrder.delivery_address}, {selectedOrder.delivery_city}, {selectedOrder.delivery_state}</p>
                <p>Payment: {selectedOrder.payment?.payment_status || 'Pending'} ({selectedOrder.payment?.payment_method || 'COD'})</p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
