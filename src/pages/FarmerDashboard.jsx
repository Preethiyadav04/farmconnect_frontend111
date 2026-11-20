import React, { useState, useEffect, useCallback } from 'react';
import {
  Sprout,
  ShoppingBag,
  TrendingUp,
  Star,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  Scale,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  Upload,
  Image as ImageIcon,
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
import { getCropImageUrl, handleCropImageError } from '../utils/cropImageHelper';

import cropService from '../services/cropService';
import orderService from '../services/orderService';
import negotiationService from '../services/negotiationService';
import analyticsService from '../services/analyticsService';

export const FarmerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'crops' | 'orders' | 'negotiations'

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [myCrops, setMyCrops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [negotiations, setNegotiations] = useState([]);
  const [categories, setCategories] = useState([]);

  // Loading & Error states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [deleteCropModalOpen, setDeleteCropModalOpen] = useState(false);
  const [cropToDelete, setCropToDelete] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderActionModal, setOrderActionModal] = useState({ open: false, type: '', order: null, reason: '' });

  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [selectedNegotiation, setSelectedNegotiation] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterNotes, setCounterNotes] = useState('');

  // Crop form state
  const initialCropForm = {
    category: '',
    crop_name: '',
    variety: '',
    grade_quality: 'Grade A',
    price_per_unit: '',
    unit: 'quintal',
    quantity_available: '',
    minimum_order_quantity: '1.00',
    location_city: 'Nashik',
    location_state: 'Maharashtra',
    harvest_date: '',
    expiry_date: '',
    description: '',
  };
  const [cropForm, setCropForm] = useState(initialCropForm);
  const [cropFormErrors, setCropFormErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Sync tab with URL hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['overview', 'crops', 'orders', 'negotiations'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Fetch all farmer data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [analyticsData, cropsRes, ordersRes, negRes, catRes] = await Promise.all([
        analyticsService.getFarmerAnalytics().catch(() => null),
        cropService.getMyCrops().catch(() => ({ results: [] })),
        orderService.getOrders().catch(() => ({ results: [] })),
        negotiationService.getNegotiations().catch(() => ({ results: [] })),
        cropService.getCategories().catch(() => []),
      ]);

      setAnalytics(analyticsData);
      setMyCrops(cropsRes.results || (Array.isArray(cropsRes) ? cropsRes : []));
      setOrders(ordersRes.results || (Array.isArray(ordersRes) ? ordersRes : []));
      setNegotiations(negRes.results || (Array.isArray(negRes) ? negRes : []));
      setCategories(Array.isArray(catRes) ? catRes : []);
    } catch (err) {
      console.error('Failed to load farmer dashboard:', err);
      setError('Unable to load some dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Open Crop Add Modal
  const handleOpenAddCrop = () => {
    setEditingCrop(null);
    setImageFile(null);
    setImagePreview(null);
    setCropForm({
      ...initialCropForm,
      category: categories[0]?.id || '',
    });
    setCropFormErrors({});
    setCropModalOpen(true);
  };

  // Open Crop Edit Modal
  const handleOpenEditCrop = (crop) => {
    setEditingCrop(crop);
    setImageFile(null);
    setImagePreview(crop.image ? getCropImageUrl(crop) : null);
    setCropForm({
      category: crop.category?.id || crop.category || categories[0]?.id || '',
      crop_name: crop.crop_name || '',
      variety: crop.variety || '',
      grade_quality: crop.grade_quality || 'Grade A',
      price_per_unit: crop.price_per_unit || '',
      unit: crop.unit || 'quintal',
      quantity_available: crop.quantity_available || '',
      minimum_order_quantity: crop.minimum_order_quantity || '1.00',
      location_city: crop.location_city || 'Nashik',
      location_state: crop.location_state || 'Maharashtra',
      harvest_date: crop.harvest_date || '',
      expiry_date: crop.expiry_date || '',
      description: crop.description || '',
    });
    setCropFormErrors({});
    setCropModalOpen(true);
  };

  // Save Crop (Create or Update)
  const handleSaveCrop = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setCropFormErrors({});

    try {
      if (imageFile) {
        // Construct FormData for multipart image upload
        const formData = new FormData();
        formData.append('category', parseInt(cropForm.category, 10));
        formData.append('crop_name', cropForm.crop_name.trim());
        if (cropForm.variety) formData.append('variety', cropForm.variety.trim());
        formData.append('grade_quality', cropForm.grade_quality);
        formData.append('price_per_unit', parseFloat(cropForm.price_per_unit));
        formData.append('unit', cropForm.unit);
        formData.append('quantity_available', parseFloat(cropForm.quantity_available));
        formData.append('minimum_order_quantity', parseFloat(cropForm.minimum_order_quantity || 1.0));
        formData.append('location_city', cropForm.location_city.trim());
        formData.append('location_state', cropForm.location_state.trim());
        if (cropForm.harvest_date) formData.append('harvest_date', cropForm.harvest_date);
        if (cropForm.expiry_date) formData.append('expiry_date', cropForm.expiry_date);
        if (cropForm.description) formData.append('description', cropForm.description.trim());
        formData.append('image', imageFile);

        if (editingCrop) {
          await cropService.updateCrop(editingCrop.id, formData);
          setSuccessMsg(`Crop '${cropForm.crop_name}' updated successfully.`);
        } else {
          await cropService.createCrop(formData);
          setSuccessMsg(`New crop '${cropForm.crop_name}' listed successfully with harvest photo.`);
        }
      } else {
        const payload = {
          ...cropForm,
          category: parseInt(cropForm.category, 10),
          price_per_unit: parseFloat(cropForm.price_per_unit),
          quantity_available: parseFloat(cropForm.quantity_available),
          minimum_order_quantity: parseFloat(cropForm.minimum_order_quantity || 1.0),
        };

        if (editingCrop) {
          await cropService.updateCrop(editingCrop.id, payload);
          setSuccessMsg(`Crop '${cropForm.crop_name}' updated successfully.`);
        } else {
          await cropService.createCrop(payload);
          setSuccessMsg(`New crop '${cropForm.crop_name}' listed successfully.`);
        }
      }

      setCropModalOpen(false);
      setImageFile(null);
      setImagePreview(null);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to save crop:', err);
      if (err.response?.data) {
        setCropFormErrors(err.response.data);
      } else {
        setCropFormErrors({ non_field_errors: ['Failed to save crop. Please verify inputs.'] });
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Crop Availability
  const handleToggleCropAvailability = async (cropId) => {
    try {
      await cropService.toggleAvailability(cropId);
      setSuccessMsg('Crop availability status updated.');
      loadDashboardData();
    } catch (err) {
      console.error('Failed to toggle crop:', err);
      setError('Could not update crop status.');
    }
  };

  // Delete Crop
  const handleConfirmDeleteCrop = async () => {
    if (!cropToDelete) return;
    setActionLoading(true);
    try {
      await cropService.deleteCrop(cropToDelete.id);
      setSuccessMsg(`Crop listing '${cropToDelete.crop_name}' removed.`);
      setDeleteCropModalOpen(false);
      setCropToDelete(null);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to delete crop:', err);
      setError('Failed to delete crop listing.');
    } finally {
      setActionLoading(false);
    }
  };

  // Order Actions (Accept / Reject)
  const handleOrderAction = async () => {
    const { type, order, reason } = orderActionModal;
    if (!order) return;
    setActionLoading(true);

    try {
      if (type === 'accept') {
        await orderService.acceptOrder(order.id);
        setSuccessMsg(`Order #${order.order_number} confirmed successfully.`);
      } else if (type === 'reject') {
        await orderService.rejectOrder(order.id, reason);
        setSuccessMsg(`Order #${order.order_number} rejected. Stock restored.`);
      }
      setOrderActionModal({ open: false, type: '', order: null, reason: '' });
      loadDashboardData();
    } catch (err) {
      console.error('Order action failed:', err);
      setError(err.response?.data?.detail || 'Failed to update order.');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark Payment Received
  const handleMarkPaymentReceived = async (orderId) => {
    try {
      await orderService.updatePaymentStatus(orderId, 'completed', 'VERIFIED_OFFLINE_SETTLEMENT');
      setSuccessMsg('Payment verified and marked completed.');
      loadDashboardData();
    } catch (err) {
      console.error('Failed to update payment:', err);
      setError('Unable to update payment status.');
    }
  };

  // Negotiation Actions (Accept, Reject, Counter)
  const handleAcceptNegotiation = async (offerId) => {
    try {
      await negotiationService.acceptOffer(offerId, 'Agreed to requested terms.');
      setSuccessMsg('Buyer price offer accepted. Waiting for buyer to convert to order.');
      loadDashboardData();
    } catch (err) {
      console.error('Failed to accept offer:', err);
      setError(err.response?.data?.detail || 'Failed to accept offer.');
    }
  };

  const handleRejectNegotiation = async (offerId) => {
    try {
      await negotiationService.rejectOffer(offerId, 'Offer below minimum threshold.');
      setSuccessMsg('Offer rejected.');
      loadDashboardData();
    } catch (err) {
      console.error('Failed to reject offer:', err);
      setError(err.response?.data?.detail || 'Failed to reject offer.');
    }
  };

  const handleOpenCounterModal = (neg) => {
    setSelectedNegotiation(neg);
    setCounterPrice(neg.counter_price_per_unit || neg.offered_price_per_unit || '');
    setCounterNotes('');
    setCounterModalOpen(true);
  };

  const handleSubmitCounter = async (e) => {
    e.preventDefault();
    if (!selectedNegotiation || !counterPrice) return;
    setActionLoading(true);
    try {
      await negotiationService.counterOffer(selectedNegotiation.id, counterPrice, counterNotes);
      setSuccessMsg('Counter-offer proposed to buyer.');
      setCounterModalOpen(false);
      setSelectedNegotiation(null);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to submit counter:', err);
      setError(err.response?.data?.detail || 'Failed to propose counter-offer.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Loading text="Loading Farmer Operations & Live Database Hub..." />
      </div>
    );
  }

  // Crop table columns
  const cropColumns = [
    {
      header: 'Crop & Variety',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={getCropImageUrl(row)}
            alt={row.crop_name}
            onError={(e) => handleCropImageError(e, row)}
            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
          />
          <div>
            <p className="font-bold text-slate-900">{row.crop_name}</p>
            <p className="text-xs text-slate-500">{row.variety ? `Variety: ${row.variety}` : row.category_name}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Quality',
      render: (row) => <span className="font-semibold text-slate-700">{row.grade_quality}</span>,
    },
    {
      header: 'Selling Price',
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
        <div>
          <span className="font-bold text-slate-900">{parseFloat(row.quantity_available).toLocaleString()}</span>
          <span className="text-xs text-slate-500"> {row.unit}</span>
          <p className="text-[11px] text-slate-400">Min: {parseFloat(row.minimum_order_quantity)} {row.unit}</p>
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
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => handleToggleCropAvailability(row.id)}
            title={row.status === 'active' ? 'Mark Unavailable' : 'Mark Available'}
          >
            {row.status === 'active' ? 'Pause' : 'Activate'}
          </Button>
          <Button
            variant="outline"
            size="xs"
            icon={Edit2}
            onClick={() => handleOpenEditCrop(row)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50"
            icon={Trash2}
            onClick={() => {
              setCropToDelete(row);
              setDeleteCropModalOpen(true);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Orders table columns
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
      header: 'Buyer Details',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.buyer_name || `Buyer #${row.buyer}`}</p>
          <p className="text-xs text-slate-500">{row.delivery_city}, {row.delivery_state}</p>
        </div>
      ),
    },
    {
      header: 'Produce Ordered',
      render: (row) => {
        const item = row.items?.[0] || {};
        return (
          <div>
            <p className="font-medium text-slate-900 line-clamp-1">{item.crop_title || 'Agricultural Produce'}</p>
            <p className="text-xs text-slate-500">{item.quantity} {item.unit} @ ₹{item.agreed_price_per_unit}</p>
          </div>
        );
      },
    },
    {
      header: 'Total Payout',
      render: (row) => (
        <div>
          <span className="font-bold text-emerald-700">{formatCurrency(row.total_amount)}</span>
          <p className="text-[11px] text-slate-400 capitalize">{row.payment?.payment_status || 'Pending'}</p>
        </div>
      ),
    },
    {
      header: 'Order Status',
      render: (row) => <StatusBadge status={row.status} size="xs" />,
    },
    {
      header: 'Actions',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="xs"
            icon={Eye}
            onClick={() => setSelectedOrder(row)}
          >
            Details
          </Button>
          {row.status === 'pending' && (
            <>
              <Button
                variant="primary"
                size="xs"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setOrderActionModal({ open: true, type: 'accept', order: row, reason: '' })}
              >
                Accept
              </Button>
              <Button
                variant="outline"
                size="xs"
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => setOrderActionModal({ open: true, type: 'reject', order: row, reason: '' })}
              >
                Reject
              </Button>
            </>
          )}
          {row.status === 'delivered' && row.payment?.payment_status !== 'completed' && (
            <Button
              variant="outline"
              size="xs"
              className="text-emerald-700 border-emerald-300"
              icon={CreditCard}
              onClick={() => handleMarkPaymentReceived(row.id)}
            >
              Verify Pay
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Negotiations table columns
  const negotiationColumns = [
    {
      header: 'Crop Listing',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.crop_name}</p>
          <p className="text-xs text-slate-500">By {row.buyer_name || 'Commercial Buyer'}</p>
        </div>
      ),
    },
    {
      header: 'Requested Quantity',
      render: (row) => (
        <span className="font-semibold text-slate-800">
          {parseFloat(row.requested_quantity)} {row.unit || 'quintal'}
        </span>
      ),
    },
    {
      header: 'Proposed Price',
      render: (row) => (
        <div>
          <span className="font-bold text-primary-700">{formatCurrency(row.offered_price_per_unit)}</span>
          <span className="text-xs text-slate-400"> (Listed: ₹{row.original_listed_price})</span>
          {row.counter_price_per_unit && (
            <p className="text-xs text-amber-700 font-semibold mt-0.5">
              Counter: ₹{row.counter_price_per_unit}
            </p>
          )}
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
        <div className="flex items-center justify-end gap-1.5">
          {row.status === 'pending' && (
            <>
              <Button
                variant="primary"
                size="xs"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleAcceptNegotiation(row.id)}
              >
                Accept
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleOpenCounterModal(row)}
              >
                Counter
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className="text-rose-600 hover:bg-rose-50"
                onClick={() => handleRejectNegotiation(row.id)}
              >
                Decline
              </Button>
            </>
          )}
          {row.status !== 'pending' && (
            <span className="text-xs text-slate-400 capitalize">{row.status}</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Farmer Harvest & Sales Hub"
        subtitle="Manage crop listings, monitor incoming orders, review buyer negotiation bids, and track sales revenue."
        badge="Live Farmer Portal"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadDashboardData}>
              Sync Data
            </Button>
            <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAddCrop}>
              List New Crop
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
          title="Total Crops Listed"
          value={analytics?.crop_listings?.total || myCrops.length}
          subtitle={`${analytics?.crop_listings?.active || myCrops.filter((c) => c.status === 'active').length} Active • ${analytics?.crop_listings?.sold_out || myCrops.filter((c) => c.status === 'sold_out').length} Sold Out`}
          icon={Sprout}
          color="primary"
        />

        <StatCard
          title="Incoming Orders"
          value={analytics?.orders_summary?.total_received || orders.length}
          subtitle={`${analytics?.orders_summary?.pending || orders.filter((o) => o.status === 'pending').length} Pending Confirmation`}
          icon={ShoppingBag}
          color="emerald"
        />

        <StatCard
          title="Completed Sales"
          value={formatCurrency(analytics?.revenue?.completed_orders_total || 0)}
          subtitle={`Verified: ${formatCurrency(analytics?.revenue?.verified_payments_received || 0)}`}
          icon={TrendingUp}
          color="amber"
        />

        <StatCard
          title="Reputation Rating"
          value={`${analytics?.reputation?.average_rating || 5.0} ★`}
          subtitle={`Based on ${analytics?.reputation?.total_reviews || 0} verified reviews`}
          icon={Star}
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
          Operations Overview
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
          My Crop Inventory ({myCrops.length})
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
          Incoming Orders ({orders.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('negotiations')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'negotiations'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Price Negotiations ({negotiations.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Pending Orders Action Card */}
          {orders.filter((o) => o.status === 'pending').length > 0 && (
            <Card className="border-l-4 border-l-amber-500 bg-amber-50/40">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {orders.filter((o) => o.status === 'pending').length} Pending Order(s) Awaiting Confirmation
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Review incoming purchase requests promptly to hold inventory and prepare transport logistics.
                    </p>
                  </div>
                </div>
                <Button variant="primary" size="sm" onClick={() => setActiveTab('orders')}>
                  Review Orders
                </Button>
              </div>
            </Card>
          )}

          {/* Recent Orders Table */}
          <Card>
            <CardHeader
              title="Recent Customer Orders"
              subtitle="Incoming purchase orders placed by verified buyers"
              action={
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('orders')}>
                  View All Orders →
                </Button>
              }
            />
            <DataTable
              columns={orderColumns}
              data={orders.slice(0, 5)}
              emptyTitle="No Orders Received Yet"
              emptyDescription="When commercial buyers place orders for your listed produce, they will appear here."
            />
          </Card>

          {/* Quick Active Crops Snapshot */}
          <Card>
            <CardHeader
              title="Active Produce Listings"
              subtitle="Harvest inventory currently live in the public marketplace"
              action={
                <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAddCrop}>
                  Add Harvest
                </Button>
              }
            />
            <DataTable
              columns={cropColumns}
              data={myCrops.slice(0, 5)}
              emptyTitle="No Crops Listed Yet"
              emptyDescription="List your farm harvest to start receiving orders and price bids from regional buyers."
            />
          </Card>
        </div>
      )}

      {/* Tab 2: My Crops */}
      {activeTab === 'crops' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Produce Inventory Catalog</h3>
              <p className="text-xs text-slate-500">Manage crop listings, update stock levels, and toggle availability.</p>
            </div>
            <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAddCrop}>
              List New Crop
            </Button>
          </div>

          <DataTable
            columns={cropColumns}
            data={myCrops}
            emptyTitle="No Crops In Inventory"
            emptyDescription="You have not listed any crops yet. Click 'List New Crop' to publish your first harvest."
          />
        </div>
      )}

      {/* Tab 3: Incoming Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Incoming Harvest Orders</h3>
            <p className="text-xs text-slate-500">Confirm orders, coordinate shipping, and verify payments.</p>
          </div>

          <DataTable
            columns={orderColumns}
            data={orders}
            emptyTitle="No Incoming Orders"
            emptyDescription="There are currently no orders placed for your farm produce."
          />
        </div>
      )}

      {/* Tab 4: Price Negotiations */}
      {activeTab === 'negotiations' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Buyer Price Offers & Negotiations</h3>
            <p className="text-xs text-slate-500">Review buyer price bids, accept favorable offers, or propose counter-offers.</p>
          </div>

          <DataTable
            columns={negotiationColumns}
            data={negotiations}
            emptyTitle="No Active Negotiations"
            emptyDescription="When buyers propose custom wholesale bids on your listings, they will appear here."
          />
        </div>
      )}

      {/* ADD / EDIT CROP MODAL */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-primary-700" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingCrop ? 'Edit Crop Listing' : 'Publish New Harvest Listing'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCrop} className="space-y-4">
              {cropFormErrors.non_field_errors && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs">
                  {cropFormErrors.non_field_errors.join(' ')}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Crop Category *</label>
                  <select
                    value={cropForm.category}
                    onChange={(e) => setCropForm({ ...cropForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Crop Name *"
                  placeholder="e.g. Sharbati Golden Wheat"
                  value={cropForm.crop_name}
                  onChange={(e) => setCropForm({ ...cropForm, crop_name: e.target.value })}
                  error={cropFormErrors.crop_name?.[0]}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Variety / Cultivar"
                  placeholder="e.g. Lokwan C-306"
                  value={cropForm.variety}
                  onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })}
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade / Quality</label>
                  <select
                    value={cropForm.grade_quality}
                    onChange={(e) => setCropForm({ ...cropForm, grade_quality: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Grade A">Grade A (Premium Export)</option>
                    <option value="Grade B">Grade B (Standard Commercial)</option>
                    <option value="Grade C">Grade C (Bulk / Processing)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Measurement Unit</label>
                  <select
                    value={cropForm.unit}
                    onChange={(e) => setCropForm({ ...cropForm, unit: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="quintal">Quintal (100 kg)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="ton">Metric Ton (1000 kg)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label={`Price per ${cropForm.unit} (₹) *`}
                  type="number"
                  step="0.01"
                  placeholder="e.g. 3200.00"
                  value={cropForm.price_per_unit}
                  onChange={(e) => setCropForm({ ...cropForm, price_per_unit: e.target.value })}
                  error={cropFormErrors.price_per_unit?.[0]}
                  required
                />

                <Input
                  label={`Quantity Available (${cropForm.unit}) *`}
                  type="number"
                  step="0.01"
                  placeholder="e.g. 50"
                  value={cropForm.quantity_available}
                  onChange={(e) => setCropForm({ ...cropForm, quantity_available: e.target.value })}
                  error={cropFormErrors.quantity_available?.[0]}
                  required
                />

                <Input
                  label={`Minimum Order (${cropForm.unit}) *`}
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1"
                  value={cropForm.minimum_order_quantity}
                  onChange={(e) => setCropForm({ ...cropForm, minimum_order_quantity: e.target.value })}
                  error={cropFormErrors.minimum_order_quantity?.[0]}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Harvest City / Taluka *"
                  value={cropForm.location_city}
                  onChange={(e) => setCropForm({ ...cropForm, location_city: e.target.value })}
                  required
                />
                <Input
                  label="State *"
                  value={cropForm.location_state}
                  onChange={(e) => setCropForm({ ...cropForm, location_state: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Harvest Date"
                  type="date"
                  value={cropForm.harvest_date}
                  onChange={(e) => setCropForm({ ...cropForm, harvest_date: e.target.value })}
                />
                <Input
                  label="Best Before / Shelf Life"
                  type="date"
                  value={cropForm.expiry_date}
                  onChange={(e) => setCropForm({ ...cropForm, expiry_date: e.target.value })}
                />
              </div>

              {/* Harvest Photograph Upload */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Harvest Photograph (Optional)</label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 shadow-xs">
                      <img src={imagePreview} alt="Harvest Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black/90 rounded-full text-white transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-white border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
                      <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                      <span className="text-[10px]">No Photo</span>
                    </div>
                  )}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition-colors shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-primary-600" />
                      <span>{imagePreview ? 'Replace Harvest Photo' : 'Upload Harvest Photo'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImageFile(file);
                            setImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      JPG, PNG, or WEBP (Max 5MB). When left unattached, an authentic high-resolution agricultural catalog reference image is automatically mapped.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Harvest Notes & Farming Details</label>
                <textarea
                  rows="3"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe crop quality, organic methods, moisture content, packaging type..."
                  value={cropForm.description}
                  onChange={(e) => setCropForm({ ...cropForm, description: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setCropModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={actionLoading}>
                  {editingCrop ? 'Save Changes' : 'Publish Crop'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CROP CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={deleteCropModalOpen}
        title="Delete Crop Listing"
        message={`Are you sure you want to delete '${cropToDelete?.crop_name}'? This action removes the listing from the public marketplace.`}
        confirmText="Delete Listing"
        confirmVariant="danger"
        loading={actionLoading}
        onConfirm={handleConfirmDeleteCrop}
        onClose={() => setDeleteCropModalOpen(false)}
      />

      {/* ORDER ACTION MODAL (Accept / Reject) */}
      <ConfirmationModal
        isOpen={orderActionModal.open}
        title={orderActionModal.type === 'accept' ? 'Confirm Customer Order' : 'Reject Customer Order'}
        message={
          orderActionModal.type === 'accept'
            ? `Accept order #${orderActionModal.order?.order_number}? This commits the harvest stock and alerts the buyer and logistics coordinators.`
            : `Reject order #${orderActionModal.order?.order_number}? This will automatically return the produce quantity back to your available inventory stock.`
        }
        confirmText={orderActionModal.type === 'accept' ? 'Confirm Order' : 'Reject Order'}
        confirmVariant={orderActionModal.type === 'accept' ? 'primary' : 'danger'}
        loading={actionLoading}
        onConfirm={handleOrderAction}
        onClose={() => setOrderActionModal({ open: false, type: '', order: null, reason: '' })}
      >
        {orderActionModal.type === 'reject' && (
          <div className="mt-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Rejection (Optional)</label>
            <textarea
              rows="2"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Stock reserved for local mandi, weather delay..."
              value={orderActionModal.reason}
              onChange={(e) => setOrderActionModal({ ...orderActionModal, reason: e.target.value })}
            />
          </div>
        )}
      </ConfirmationModal>

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Order #{selectedOrder.order_number}</h3>
                <p className="text-xs text-slate-400">Placed on {new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Buyer Contact</span>
                <p className="font-bold text-slate-900">{selectedOrder.buyer_name || 'Commercial Buyer'}</p>
                {selectedOrder.contact_phone && <p className="text-slate-600">Phone: {selectedOrder.contact_phone}</p>}
                <p className="text-slate-600">
                  Delivery Destination: {selectedOrder.delivery_address}, {selectedOrder.delivery_city}, {selectedOrder.delivery_state} ({selectedOrder.delivery_pincode})
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Items Ordered</span>
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

              {selectedOrder.notes && (
                <div className="p-3 bg-amber-50 rounded-xl text-amber-900 text-xs">
                  <span className="font-semibold">Order Notes:</span> {selectedOrder.notes}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* COUNTER-OFFER MODAL */}
      {counterModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Propose Counter-Offer</h3>
              <button type="button" onClick={() => setCounterModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCounter} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <p><strong>Crop:</strong> {selectedNegotiation?.crop_name}</p>
                <p><strong>Original Listed Price:</strong> ₹{selectedNegotiation?.original_listed_price}</p>
                <p><strong>Buyer Bid:</strong> ₹{selectedNegotiation?.offered_price_per_unit}</p>
              </div>

              <Input
                label="Your Counter Price per Unit (₹) *"
                type="number"
                step="0.01"
                placeholder="e.g. 3100.00"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes for Buyer</label>
                <textarea
                  rows="2"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Premium Grade A certified quality, this is my best price..."
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setCounterModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={actionLoading}>
                  Submit Counter-Offer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;
