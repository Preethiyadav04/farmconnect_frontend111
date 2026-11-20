import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Scale,
  Star,
  ShoppingBag,
  MessageSquare,
  Truck,
  AlertTriangle,
  Info,
  Calendar,
  CheckCircle,
  Package,
  X,
  CreditCard,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Loading from '../components/common/Loading';
import { formatCurrency } from '../utils/formatters';
import cropService from '../services/cropService';
import mandiService from '../services/mandiService';
import orderService from '../services/orderService';
import { useAuth } from '../hooks/useAuth';
import { getCropImageUrl, handleCropImageError, hasFarmerUploadedImage } from '../utils/cropImageHelper';

export const CropDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [crop, setCrop] = useState(null);
  const [mandiBenchmarks, setMandiBenchmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [phaseNotice, setPhaseNotice] = useState(null);

  // Direct Checkout Order Modal State
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderQty, setOrderQty] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');

  const handleOpenOrderModal = () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (user.role && user.role.toLowerCase() !== 'buyer' && !user.is_admin_user && !user.is_superuser) {
      setPhaseNotice(`Only registered buyers can place purchase orders. You are currently logged in as a ${user.role}.`);
      return;
    }
    const minQty = parseFloat(crop?.minimum_order_quantity) || 1;
    setOrderQty(String(minQty));
    setDeliveryAddress(user.user_profile?.address || user.address || '');
    setDeliveryCity(crop?.location_city || user.user_profile?.city || user.city || 'Pune');
    setDeliveryState(crop?.location_state || user.user_profile?.state || user.state || 'Maharashtra');
    setDeliveryPincode(user.user_profile?.pincode || user.pincode || '411001');
    setContactPhone(user.phone || '+919876543202');
    setPaymentMethod('cod');
    setOrderNotes('');
    setOrderError('');
    setOrderModalOpen(true);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setOrderError('');
    const qty = parseFloat(orderQty);
    if (isNaN(qty) || qty <= 0) {
      setOrderError('Please enter a valid order quantity.');
      return;
    }
    if (crop?.minimum_order_quantity && qty < parseFloat(crop.minimum_order_quantity)) {
      setOrderError(`Minimum order quantity for this crop is ${crop.minimum_order_quantity} ${crop.unit}.`);
      return;
    }
    if (crop?.quantity_available && qty > parseFloat(crop.quantity_available)) {
      setOrderError(`Order quantity exceeds available harvest stock (${crop.quantity_available} ${crop.unit}).`);
      return;
    }
    if (!deliveryAddress.trim() || !deliveryCity.trim() || !contactPhone.trim()) {
      setOrderError('Please provide delivery address, city, and contact phone.');
      return;
    }

    setOrderSubmitting(true);
    try {
      const res = await orderService.createOrder({
        crop_id: crop.id,
        quantity: qty,
        delivery_address: deliveryAddress.trim(),
        delivery_city: deliveryCity.trim(),
        delivery_state: deliveryState.trim() || 'Maharashtra',
        delivery_pincode: deliveryPincode.trim(),
        contact_phone: contactPhone.trim(),
        payment_method: paymentMethod,
        notes: orderNotes.trim(),
      });
      setOrderModalOpen(false);
      navigate('/dashboard/buyer#orders', {
        state: {
          newOrderPlaced: true,
          orderNumber: res.order_number,
          totalAmount: res.total_amount,
        },
      });
    } catch (err) {
      console.error('Failed to place order:', err);
      const errorDetail =
        err.response?.data?.detail ||
        (err.response?.data && typeof err.response.data === 'object' && Object.values(err.response.data).flat().join(' ')) ||
        'Failed to place purchase order. Please check inputs and stock availability.';
      setOrderError(errorDetail);
    } finally {
      setOrderSubmitting(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadCropData = async () => {
      setLoading(true);
      setError('');
      try {
        const cropData = await cropService.getCropById(id);
        if (!isMounted) return;
        setCrop(cropData);

        // Fetch related regional mandi price benchmarks
        const commodity = (cropData.crop_name || '').split(' ')[0];
        try {
          const mandiData = await mandiService.getMandiPrices({ crop: commodity });
          if (isMounted) {
            setMandiBenchmarks(mandiData.results || cropData.mandi_benchmark || []);
          }
        } catch (mandiErr) {
          console.warn('Could not fetch external mandi rates:', mandiErr);
          if (isMounted && cropData.mandi_benchmark) {
            setMandiBenchmarks(cropData.mandi_benchmark);
          }
        }
      } catch (err) {
        console.error('Failed to load crop details:', err);
        if (!isMounted) return;
        if (err.response?.status === 404) {
          setError('Crop listing not found. It may have been sold out, unlisted by the farmer, or removed.');
        } else if (err.code === 'ERR_NETWORK') {
          setError('Cannot connect to FarmConnect API (127.0.0.1:8000). Please check backend server status.');
        } else {
          setError('Failed to retrieve crop details. Please try again later.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) {
      loadCropData();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Loading fullPage={false} text="Loading crop specifications and APMC market benchmarks..." />
      </div>
    );
  }

  if (error || !crop) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Crop Listing Unavailable</h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto">{error || 'The requested crop could not be found.'}</p>
        <div>
          <Link to="/marketplace">
            <Button variant="primary" icon={ArrowLeft}>
              Return to Harvest Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const categoryName = crop.category?.name || crop.category_name || 'Produce';
  const farmer = crop.farmer_info || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button and Live Database Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace Catalog</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-primary-800 bg-primary-50 border border-primary-200 px-3 py-1 rounded-full flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-primary-600" />
            <span>Live Listing (ID: #{crop.id})</span>
          </span>
          {crop.is_featured && (
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              ★ Featured
            </span>
          )}
        </div>
      </div>

      {/* Phase 8 Modal Notice */}
      {phaseNotice && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start justify-between gap-3 text-xs sm:text-sm text-blue-900">
          <div className="flex items-start gap-2.5">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Workflow Scheduling Notice (Phase 7)</p>
              <p className="text-blue-700 mt-0.5">{phaseNotice}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPhaseNotice(null)}
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details (Col 1 & 2) */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding={false} className="overflow-hidden">
            {/* Header Image Banner */}
            <div className="h-72 sm:h-96 bg-slate-900 flex flex-col justify-between p-6 text-white relative overflow-hidden">
              <img
                src={getCropImageUrl(crop)}
                alt={crop.crop_name}
                onError={(e) => handleCropImageError(e, crop)}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-black/35 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="self-start text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-900/70 backdrop-blur-xs text-white border border-white/10">
                    {categoryName} {farmer.organic_certified ? '• Organic Certified' : ''}
                  </span>
                  {!hasFarmerUploadedImage(crop) && (
                    <span className="text-[11px] text-slate-300 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs border border-white/10" title="High-resolution harvest catalog reference image">
                      Catalog Reference Photo
                    </span>
                  )}
                </div>
                <span className="text-xs text-primary-200 bg-black/40 border border-white/10 px-2.5 py-1 rounded-full backdrop-blur-xs">
                  {crop.views_count || 1} Views
                </span>
              </div>
              <div className="relative z-10">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {crop.crop_name}
                </h1>
                <div className="flex items-center gap-2 text-sm text-primary-200 mt-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>{crop.location || `${crop.location_city}, ${crop.location_state}`}</span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Harvest Description</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {crop.description || 'No detailed description provided by the farmer.'}
                </p>
              </div>

              {/* Crop Specifications Table */}
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-3">Crop Specifications</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400">Crop Variety</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{crop.variety || 'Standard Regional'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400">Grade / Quality</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{crop.grade_quality || 'Grade A'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400">Min Order Qty</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {parseFloat(crop.minimum_order_quantity)} {crop.unit}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400">Available Stock</span>
                    <p className="font-semibold text-primary-700 mt-0.5">
                      {parseFloat(crop.quantity_available).toLocaleString()} {crop.unit}
                    </p>
                  </div>
                </div>

                {/* Harvest and Expiry dates if present */}
                {(crop.harvest_date || crop.expiry_date) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
                    {crop.harvest_date && (
                      <div className="p-2.5 bg-slate-50 rounded-lg flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>Harvest Date: <strong>{crop.harvest_date}</strong></span>
                      </div>
                    )}
                    {crop.expiry_date && (
                      <div className="p-2.5 bg-slate-50 rounded-lg flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>Best Before: <strong>{crop.expiry_date}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mandi Benchmark Compare Card (PART E) */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-amber-900 font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-600" />
                    <span>Regional APMC Mandi Benchmark Rates</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-200/70 px-2.5 py-0.5 rounded">
                    Mandi Price Reference
                  </span>
                </div>

                {mandiBenchmarks.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {mandiBenchmarks.slice(0, 3).map((bench, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-lg border border-amber-200/60 space-y-1">
                          <p className="font-bold text-slate-800 truncate">{bench.market_name}</p>
                          <p className="text-[11px] text-slate-500">
                            {bench.district ? `${bench.district}, ` : ''}{bench.state}
                          </p>
                          <div className="pt-1 border-t border-slate-100 flex items-baseline justify-between">
                            <span className="text-[10px] text-slate-400">Modal Price:</span>
                            <span className="font-extrabold text-amber-900">
                              {formatCurrency(bench.modal_price)}
                              <span className="text-[10px] font-normal text-slate-500">/{crop.unit}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-amber-800/80 italic pt-1">
                      Data Source: {mandiBenchmarks[0]?.data_source || 'Agmarknet / Mandi Benchmark (Sample Market Data)'}. Genuine external live government API feeds will connect in future phases.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-amber-800/90 italic">
                    No matching regional APMC mandi benchmark recorded for this commodity. Data Source: Sample Database Benchmark.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Action Sidebar (Col 3) */}
        <div className="space-y-6">
          <Card className="space-y-6 border-t-4 border-t-primary-600">
            <div>
              <span className="text-xs text-slate-500 font-medium">Listed Farmer Price</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-primary-700">
                  {formatCurrency(crop.price_per_unit)}
                </span>
                <span className="text-sm font-medium text-slate-500">/{crop.unit}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Min. order: {parseFloat(crop.minimum_order_quantity)} {crop.unit}
              </p>
            </div>

            {/* Farmer / Supplier Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Farmer / Producer</span>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {farmer.farm_name || farmer.full_name || 'Verified Regional Farmer'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {farmer.full_name ? `Contact: ${farmer.full_name}` : `@${farmer.username || 'farmer'}`}
                  </p>
                  {farmer.farm_size_acres > 0 && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Farm Area: {farmer.farm_size_acres} Acres
                    </p>
                  )}
                </div>
                {farmer.is_verified && (
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified</span>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2.5">
              <Button
                variant="primary"
                size="lg"
                icon={ShoppingBag}
                className="w-full"
                onClick={handleOpenOrderModal}
              >
                Place Purchase Order
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon={MessageSquare}
                className="w-full"
                onClick={() =>
                  setPhaseNotice(
                    'Live Price Negotiation & Offer Countering workflows will be connected in Phase 8.'
                  )
                }
              >
                Propose Price Negotiation Bid
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pessimistic stock locking prevents overselling</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Integrated transport dispatch available upon checkout</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Direct Order Checkout Modal */}
      {orderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-100 my-8">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary-600" />
                  <span>Direct Purchase Order</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ordering from: <strong>{farmer.farm_name || farmer.full_name || farmer.username || 'Supplier Farmer'}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderError && (
              <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{orderError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              {/* Crop & Rate Banner */}
              <div className="p-3 bg-primary-50/70 border border-primary-100 rounded-xl flex items-center gap-3 text-xs">
                <img
                  src={getCropImageUrl(crop)}
                  alt={crop.crop_name}
                  onError={(e) => handleCropImageError(e, crop)}
                  className="w-12 h-12 rounded-lg object-cover border border-primary-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-primary-900 text-sm block truncate">{crop.crop_name}</span>
                  <span className="text-primary-700 font-medium">Rate: {formatCurrency(crop.price_per_unit)} / {crop.unit}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-slate-500 block">Available Stock</span>
                  <span className="font-semibold text-slate-800">{parseFloat(crop.quantity_available)} {crop.unit}</span>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity to Order ({crop.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min={crop.minimum_order_quantity || 1}
                  max={crop.quantity_available}
                  required
                  value={orderQty}
                  onChange={(e) => setOrderQty(e.target.value)}
                  placeholder={`Min ${crop.minimum_order_quantity} ${crop.unit}`}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Min order: {parseFloat(crop.minimum_order_quantity)} {crop.unit} • Max available: {parseFloat(crop.quantity_available)} {crop.unit}
                </span>
              </div>

              {/* Live Cost Summary */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Calculated Purchase Total:</span>
                <span className="text-lg font-extrabold text-primary-700">
                  {formatCurrency((parseFloat(orderQty || 0) * parseFloat(crop.price_per_unit || 0)).toFixed(2))}
                </span>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Address *</label>
                <textarea
                  rows="2"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street / Warehouse / APMC plot address"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              {/* City, State & Pincode */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={deliveryState}
                    onChange={(e) => setDeliveryState(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={deliveryPincode}
                    onChange={(e) => setDeliveryPincode(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Contact Phone & Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    <option value="cod">Cash on Delivery (Safe Offline)</option>
                    <option value="bank_transfer">Direct Bank Transfer / NEFT</option>
                  </select>
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Notes (Optional)</label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Call before dispatch, morning delivery preferred"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOrderModalOpen(false)}
                  disabled={orderSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={ShoppingBag}
                  disabled={orderSubmitting}
                >
                  {orderSubmitting ? 'Submitting Order...' : 'Confirm & Place Order'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropDetails;
