import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Truck,
  CreditCard,
  Heart,
  ArrowRight,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Star,
  Clock,
  MapPin,
  X,
  MessageSquare,
  Package,
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

import orderService from '../services/orderService';
import negotiationService from '../services/negotiationService';
import reviewService from '../services/reviewService';
import analyticsService from '../services/analyticsService';

export const BuyerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'orders' | 'negotiations' | 'favorites' | 'reviews'

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [negotiations, setNegotiations] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Loading & Alert states
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const location = useLocation();

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [negToConvert, setNegToConvert] = useState(null);
  const [deliveryForm, setDeliveryForm] = useState({
    delivery_address: '',
    delivery_city: 'Pune',
    delivery_state: 'Maharashtra',
    delivery_pincode: '411001',
    contact_phone: '+919876543202',
    payment_method: 'cod',
    notes: '',
  });

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [orderToReview, setOrderToReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Sync tab with URL hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['overview', 'orders', 'negotiations', 'favorites'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Load all buyer data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [analyticsData, ordersRes, negRes, favRes, revRes] = await Promise.all([
        analyticsService.getBuyerAnalytics().catch(() => null),
        orderService.getOrders().catch(() => ({ results: [] })),
        negotiationService.getNegotiations().catch(() => ({ results: [] })),
        reviewService.getFavorites().catch(() => []),
        reviewService.getReviews().catch(() => []),
      ]);

      setAnalytics(analyticsData);
      setOrders(ordersRes.results || (Array.isArray(ordersRes) ? ordersRes : []));
      setNegotiations(negRes.results || (Array.isArray(negRes) ? negRes : []));
      setFavorites(Array.isArray(favRes) ? favRes : []);
      setReviews(Array.isArray(revRes) ? revRes : []);
    } catch (err) {
      console.error('Failed to load buyer dashboard:', err);
      setError('Unable to load some procurement data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle incoming order notification when redirected from checkout
  useEffect(() => {
    if (location.state?.newOrderPlaced) {
      setSuccessMsg(
        `Order #${location.state.orderNumber || ''} placed successfully! Tracking and procurement records updated.`
      );
      setActiveTab('orders');
      window.history.replaceState({}, document.title);
      loadDashboardData();
    }
  }, [location.state, loadDashboardData]);

  // Interactive Data Synchronization
  const handleSyncData = async () => {
    setSyncing(true);
    await loadDashboardData();
    setSyncing(false);
    setSuccessMsg('Procurement records synchronized with live database.');
  };

  // Cancel Order
  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return;
    setActionLoading(true);
    try {
      await orderService.cancelOrder(orderToCancel.id, cancelReason);
      setSuccessMsg(`Order #${orderToCancel.order_number} cancelled. Stock restored.`);
      setCancelModalOpen(false);
      setOrderToCancel(null);
      setCancelReason('');
      loadDashboardData();
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setError(err.response?.data?.detail || 'Failed to cancel order.');
    } finally {
      setActionLoading(false);
    }
  };

  // Negotiation Actions
  const handleAcceptCounter = async (negId) => {
    try {
      await negotiationService.acceptCounter(negId);
      setSuccessMsg('Farmer counter-offer accepted! You can now convert it to an order.');
      loadDashboardData();
    } catch (err) {
      console.error('Failed to accept counter:', err);
      setError(err.response?.data?.detail || 'Failed to accept counter-offer.');
    }
  };

  const handleOpenConvertModal = (neg) => {
    setNegToConvert(neg);
    setDeliveryForm({
      delivery_address: neg.delivery_address || 'Central APMC Warehouse #4',
      delivery_city: neg.delivery_city || 'Pune',
      delivery_state: neg.delivery_state || 'Maharashtra',
      delivery_pincode: '411001',
      contact_phone: '+919876543202',
      payment_method: 'cod',
      notes: '',
    });
    setConvertModalOpen(true);
  };

  const handleConfirmConvertToOrder = async (e) => {
    e.preventDefault();
    if (!negToConvert) return;
    setActionLoading(true);
    try {
      const order = await negotiationService.convertToOrder(negToConvert.id, deliveryForm);
      setSuccessMsg(`Negotiation converted! Order #${order.order_number || ''} placed successfully.`);
      setConvertModalOpen(false);
      setNegToConvert(null);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to convert to order:', err);
      setError(err.response?.data?.detail || 'Failed to convert offer to order.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Favorite
  const handleRemoveFavorite = async (cropId) => {
    try {
      await reviewService.toggleFavorite(cropId);
      setSuccessMsg('Crop removed from your bookmarked favorites.');
      loadDashboardData();
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      setError('Could not update favorites.');
    }
  };

  // Submit Review
  const handleOpenReviewModal = (order) => {
    setOrderToReview(order);
    setReviewRating(5);
    setReviewComment('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!orderToReview) return;
    setActionLoading(true);
    try {
      await reviewService.createReview({
        order: orderToReview.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      setSuccessMsg(`Review submitted for Order #${orderToReview.order_number}!`);
      setReviewModalOpen(false);
      setOrderToReview(null);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to submit review.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Loading text="Loading Buyer Procurement Portal & Live Orders..." />
      </div>
    );
  }

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
      header: 'Produce Ordered',
      render: (row) => {
        const item = row.items?.[0] || {};
        return (
          <div className="flex items-center gap-3">
            <img
              src={getCropImageUrl({ crop_name: item.crop_title })}
              alt={item.crop_title || 'Produce'}
              onError={(e) => handleCropImageError(e, { crop_name: item.crop_title })}
              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
            />
            <div>
              <p className="font-semibold text-slate-900 line-clamp-1">{item.crop_title || 'Agricultural Produce'}</p>
              <p className="text-xs text-slate-500">
                {item.quantity
                  ? `${parseFloat(item.quantity)} ${item.unit || 'kg'} @ ₹${parseFloat(item.unit_price || item.agreed_price_per_unit || 0)}`
                  : `${row.items_count || 1} crop item(s)`}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Supplier Farmer',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.farmer_name || `Farmer #${row.farmer}`}</p>
          <p className="text-xs text-slate-500">Destination: {row.delivery_city}</p>
        </div>
      ),
    },
    {
      header: 'Total Cost',
      render: (row) => (
        <div>
          <span className="font-bold text-primary-700">{formatCurrency(row.total_amount)}</span>
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

          {['pending', 'confirmed'].includes(row.status) && (
            <Button
              variant="outline"
              size="xs"
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
              onClick={() => {
                setOrderToCancel(row);
                setCancelReason('');
                setCancelModalOpen(true);
              }}
            >
              Cancel
            </Button>
          )}

          {row.status === 'delivered' && (
            <Button
              variant="outline"
              size="xs"
              className="text-amber-700 border-amber-300 hover:bg-amber-50"
              icon={Star}
              onClick={() => handleOpenReviewModal(row)}
            >
              Review
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Negotiations table columns
  const negotiationColumns = [
    {
      header: 'Produce Listing',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.crop_name}</p>
          <p className="text-xs text-slate-500">Listed: ₹{row.original_listed_price}/{row.unit}</p>
        </div>
      ),
    },
    {
      header: 'Requested Batch',
      render: (row) => (
        <span className="font-semibold text-slate-800">
          {parseFloat(row.requested_quantity)} {row.unit || 'quintal'}
        </span>
      ),
    },
    {
      header: 'Your Proposed Bid',
      render: (row) => (
        <div>
          <span className="font-bold text-primary-700">{formatCurrency(row.offered_price_per_unit)}</span>
          {row.counter_price_per_unit && (
            <p className="text-xs font-semibold text-amber-700 mt-0.5">
              Farmer Counter: ₹{row.counter_price_per_unit}
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
          {row.status === 'countered' && (
            <Button
              variant="primary"
              size="xs"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => handleAcceptCounter(row.id)}
            >
              Accept Counter
            </Button>
          )}

          {row.status === 'accepted' && (
            <Button
              variant="primary"
              size="xs"
              onClick={() => handleOpenConvertModal(row)}
            >
              Checkout / Order
            </Button>
          )}

          {['pending', 'rejected', 'converted'].includes(row.status) && (
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
        title="Buyer Procurement & Order Hub"
        subtitle="Track your agricultural purchases, monitor live shipment deliveries, and manage price negotiations."
        badge="Live Buyer Portal"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={handleSyncData}
              disabled={syncing}
              className={syncing ? 'opacity-70 animate-pulse' : ''}
            >
              {syncing ? 'Syncing...' : 'Sync Data'}
            </Button>
            <Link to="/marketplace">
              <Button variant="primary" size="sm" icon={ShoppingBag}>
                Browse Harvests
              </Button>
            </Link>
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
          title="Total Orders Placed"
          value={Math.max(analytics?.orders_summary?.total_placed || 0, orders.length)}
          subtitle={`${orders.filter((o) => o.status === 'delivered').length} Delivered • ${orders.filter((o) => ['pending', 'confirmed'].includes(o.status)).length} Pending/Confirmed`}
          icon={ShoppingBag}
          color="primary"
        />

        <StatCard
          title="Active Shipments"
          value={orders.filter((o) => ['pending', 'confirmed', 'processing', 'dispatched', 'in_transit'].includes(o.status)).length}
          subtitle="In transit, packed, or pending dispatch"
          icon={Truck}
          color="amber"
        />

        <StatCard
          title="Total Spend"
          value={formatCurrency(
            Math.max(
              parseFloat(analytics?.expenditure?.total_spent || 0) ||
                (parseFloat(analytics?.expenditure?.completed_purchases_total || 0) +
                  parseFloat(analytics?.expenditure?.active_orders_value || 0)),
              orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
            )
          )}
          subtitle="Gross agricultural purchases"
          icon={CreditCard}
          color="emerald"
        />

        <StatCard
          title="Saved Crops"
          value={`${favorites.length} Saved`}
          subtitle="Monitored in your watchlist"
          icon={Heart}
          color="purple"
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
          Procurement Overview
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
          Order History ({orders.length})
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

        <button
          type="button"
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'favorites'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Saved Watchlist ({favorites.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Recent Orders Preview */}
          <Card>
            <CardHeader
              title="Recent Agricultural Orders"
              subtitle="Direct harvest purchases and shipment tracking"
              action={
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('orders')}>
                  View All Orders →
                </Button>
              }
            />
            <DataTable
              columns={orderColumns}
              data={orders.slice(0, 5)}
              emptyTitle="No Orders Placed Yet"
              emptyDescription="Explore our marketplace to source fresh produce directly from verified farmers."
            />
          </Card>

          {/* Quick Active Negotiations */}
          {negotiations.length > 0 && (
            <Card>
              <CardHeader
                title="Active Price Negotiations"
                subtitle="Wholesale price bids proposed to regional farmers"
                action={
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('negotiations')}>
                    View Negotiations →
                  </Button>
                }
              />
              <DataTable
                columns={negotiationColumns}
                data={negotiations.slice(0, 4)}
              />
            </Card>
          )}
        </div>
      )}

      {/* Tab 2: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Your Order History</h3>
              <p className="text-xs text-slate-500">Track shipments, view farmer receipts, and manage pending cancellations.</p>
            </div>
            <Link to="/marketplace">
              <Button variant="primary" size="sm" icon={ShoppingBag}>
                New Order
              </Button>
            </Link>
          </div>

          <DataTable
            columns={orderColumns}
            data={orders}
            emptyTitle="No Orders Found"
            emptyDescription="You have not placed any orders yet. Visit the marketplace to source produce."
          />
        </div>
      )}

      {/* Tab 3: Negotiations */}
      {activeTab === 'negotiations' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Price Negotiation Bids</h3>
            <p className="text-xs text-slate-500">Review status of your custom wholesale offers and farmer counter-proposals.</p>
          </div>

          <DataTable
            columns={negotiationColumns}
            data={negotiations}
            emptyTitle="No Price Negotiations"
            emptyDescription="You can submit custom price offers from any crop listing page in the marketplace."
          />
        </div>
      )}

      {/* Tab 4: Favorites */}
      {activeTab === 'favorites' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Bookmarked Crops Watchlist</h3>
            <p className="text-xs text-slate-500">Produce you have saved to monitor price changes and harvest availability.</p>
          </div>

          {favorites.length === 0 ? (
            <Card className="p-8 text-center">
              <EmptyState
                icon={Heart}
                title="No Saved Crops"
                description="Click the favorite heart icon on any crop listing in the marketplace to add it here."
                actionLabel="Explore Marketplace"
                onAction={() => window.location.href = '/marketplace'}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((fav) => {
                const c = fav.crop || {};
                return (
                  <Card key={fav.id} className="space-y-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={getCropImageUrl(c)}
                          alt={c.crop_name}
                          onError={(e) => handleCropImageError(e, c)}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 text-base line-clamp-1">{c.crop_name}</h4>
                          <p className="text-xs text-slate-500">{c.variety || 'Standard Regional'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFavorite(c.id)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                        title="Remove from favorites"
                      >
                        <Heart className="w-5 h-5 fill-rose-500" />
                      </button>
                    </div>

                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-xs text-slate-400">Farmer Price:</span>
                        <p className="text-lg font-bold text-primary-700">
                          {formatCurrency(c.price_per_unit)}
                          <span className="text-xs font-normal text-slate-500"> /{c.unit}</span>
                        </p>
                      </div>
                      <Link to={`/crops/${c.id}`}>
                        <Button variant="outline" size="xs" icon={ArrowRight}>
                          View Produce
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

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
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Supplier Farmer</span>
                <p className="font-bold text-slate-900">{selectedOrder.farmer_name || `Farmer #${selectedOrder.farmer}`}</p>
                <p className="text-slate-600">
                  Delivery Destination: {selectedOrder.delivery_address}, {selectedOrder.delivery_city}, {selectedOrder.delivery_state} ({selectedOrder.delivery_pincode})
                </p>
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

              {selectedOrder.transport_snapshot && (
                <div className="p-3 bg-amber-50 rounded-xl text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-1 font-semibold">
                    <Truck className="w-4 h-4 text-amber-600" />
                    <span>Logistics Dispatch Status:</span>
                    <span className="capitalize">{selectedOrder.transport_snapshot.status}</span>
                  </div>
                  {selectedOrder.transport_snapshot.tracking_notes && (
                    <p className="text-slate-600 mt-1 whitespace-pre-line text-[11px]">
                      {selectedOrder.transport_snapshot.tracking_notes}
                    </p>
                  )}
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

      {/* CANCEL ORDER MODAL */}
      <ConfirmationModal
        isOpen={cancelModalOpen}
        title="Cancel Purchase Order"
        message={`Are you sure you want to cancel Order #${orderToCancel?.order_number}? This releases the reserved stock back to the farmer's public inventory.`}
        confirmText="Confirm Cancellation"
        confirmVariant="danger"
        loading={actionLoading}
        onConfirm={handleConfirmCancelOrder}
        onClose={() => setCancelModalOpen(false)}
      >
        <div className="mt-3">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Cancellation (Optional)</label>
          <textarea
            rows="2"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="e.g. Schedule adjustment, duplicate order..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </div>
      </ConfirmationModal>

      {/* CONVERT NEGOTIATION TO ORDER MODAL */}
      {convertModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Checkout Negotiated Batch</h3>
              <button type="button" onClick={() => setConvertModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmConvertToOrder} className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-900 space-y-1">
                <p><strong>Crop:</strong> {negToConvert?.crop_name}</p>
                <p><strong>Agreed Quantity:</strong> {negToConvert?.requested_quantity} {negToConvert?.unit}</p>
                <p><strong>Agreed Price:</strong> ₹{negToConvert?.counter_price_per_unit || negToConvert?.offered_price_per_unit}/{negToConvert?.unit}</p>
                <p className="font-bold pt-1 border-t border-emerald-200">
                  Total Order Amount: ₹{(parseFloat(negToConvert?.requested_quantity || 1) * parseFloat(negToConvert?.counter_price_per_unit || negToConvert?.offered_price_per_unit || 0)).toFixed(2)}
                </p>
              </div>

              <Input
                label="Delivery Address *"
                placeholder="Warehouse or shop address"
                value={deliveryForm.delivery_address}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, delivery_address: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="City *"
                  value={deliveryForm.delivery_city}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, delivery_city: e.target.value })}
                  required
                />
                <Input
                  label="PIN Code *"
                  value={deliveryForm.delivery_pincode}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, delivery_pincode: e.target.value })}
                  required
                />
              </div>

              <Input
                label="Contact Phone *"
                value={deliveryForm.contact_phone}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, contact_phone: e.target.value })}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={deliveryForm.payment_method}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, payment_method: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="cod">Cash on Delivery / Direct Settlement</option>
                  <option value="bank_transfer">Direct Bank NEFT / RTGS</option>
                  <option value="other">Other Offline Settlement</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setConvertModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={actionLoading}>
                  Confirm & Place Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMIT REVIEW MODAL */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="text-base font-bold text-slate-900">Review Harvest & Farmer</h3>
              </div>
              <button type="button" onClick={() => setReviewModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <p><strong>Order:</strong> #{orderToReview?.order_number}</p>
                <p><strong>Farmer:</strong> {orderToReview?.farmer_name}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rating (1 to 5 Stars) *</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{reviewRating} of 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Written Feedback *</label>
                <textarea
                  rows="3"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Share feedback on grain quality, packaging, moisture, and overall satisfaction..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setReviewModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={actionLoading}>
                  Submit Review
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;
