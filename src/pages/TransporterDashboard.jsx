import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  MapPin,
  CheckCircle,
  Clock,
  Navigation,
  DollarSign,
  ArrowRight,
  Eye,
  RefreshCw,
  AlertTriangle,
  Layers,
  ShieldCheck,
  X,
  FileText,
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

import logisticsService from '../services/logisticsService';
import analyticsService from '../services/analyticsService';

export const TransporterDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'available' | 'active' | 'history'

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);

  // Loading & Alert states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [selectedJob, setSelectedJob] = useState(null);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [jobToClaim, setJobToClaim] = useState(null);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [jobToUpdate, setJobToUpdate] = useState(null);
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: '',
    tracking_notes: '',
    current_location: '',
    final_charge: '',
  });

  // Sync tab with URL hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['overview', 'available', 'active', 'history'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Load all transporter data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [analyticsData, availRes, myRes] = await Promise.all([
        analyticsService.getTransporterAnalytics().catch(() => null),
        logisticsService.getAvailableJobs().catch(() => ({ results: [] })),
        logisticsService.getTransportRequests({ mode: 'my_jobs' }).catch(() => ({ results: [] })),
      ]);

      setAnalytics(analyticsData);
      setAvailableJobs(availRes.results || (Array.isArray(availRes) ? availRes : []));
      setMyJobs(myRes.results || (Array.isArray(myRes) ? myRes : []));
    } catch (err) {
      console.error('Failed to load transporter dashboard:', err);
      setError('Unable to load logistics dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Claim Available Job
  const handleConfirmClaimJob = async () => {
    if (!jobToClaim) return;
    setActionLoading(true);
    try {
      await logisticsService.acceptJob(jobToClaim.id);
      setSuccessMsg(`Shipment job #${jobToClaim.id} claimed successfully! Moved to your active deliveries.`);
      setClaimModalOpen(false);
      setJobToClaim(null);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to claim job:', err);
      setError(err.response?.data?.detail || 'Failed to claim transport job.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Status Update Modal
  const handleOpenStatusModal = (job) => {
    setJobToUpdate(job);

    // Determine next sequential status
    let nextStatus = 'picked_up';
    if (job.status === 'accepted') nextStatus = 'picked_up';
    else if (job.status === 'picked_up') nextStatus = 'in_transit';
    else if (job.status === 'in_transit') nextStatus = 'delivered';

    setStatusUpdateForm({
      status: nextStatus,
      tracking_notes: '',
      current_location: `${job.pickup_city || 'Regional Hub'} Checkpoint`,
      final_charge: job.final_charge || job.estimated_cost || '',
    });
    setStatusModalOpen(true);
  };

  // Submit Status Update
  const handleSubmitStatusUpdate = async (e) => {
    e.preventDefault();
    if (!jobToUpdate) return;
    setActionLoading(true);
    try {
      const payload = {
        status: statusUpdateForm.status,
        tracking_notes: statusUpdateForm.tracking_notes,
        current_location: statusUpdateForm.current_location,
      };
      if (statusUpdateForm.status === 'delivered' && statusUpdateForm.final_charge) {
        payload.final_charge = parseFloat(statusUpdateForm.final_charge);
      }

      await logisticsService.updateStatus(jobToUpdate.id, payload);
      setSuccessMsg(`Shipment #${jobToUpdate.id} status updated to '${statusUpdateForm.status}'.`);
      setStatusModalOpen(false);
      setJobToUpdate(null);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to update shipment status:', err);
      setError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Loading text="Loading Transporter Freight Hub & Route Data..." />
      </div>
    );
  }

  const activeDeliveries = myJobs.filter((j) => ['accepted', 'picked_up', 'in_transit'].includes(j.status));
  const completedDeliveries = myJobs.filter((j) => j.status === 'delivered');

  // Available Jobs Columns
  const availableColumns = [
    {
      header: 'Shipment Route',
      render: (row) => (
        <div>
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <span>{row.pickup_city}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span>{row.drop_city}</span>
          </div>
          <p className="text-xs text-slate-500">Order #{row.order_number}</p>
        </div>
      ),
    },
    {
      header: 'Cargo Specs',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800">
            {parseFloat(row.weight_tons) ? `${parseFloat(row.weight_tons)} Metric Tons` : 'Bulk Cargo'}
          </span>
          <p className="text-xs text-slate-400 capitalize">{row.vehicle_type_needed?.replace('_', ' ') || 'Any Truck'}</p>
        </div>
      ),
    },
    {
      header: 'Distance & Rate',
      render: (row) => (
        <div>
          <span className="font-bold text-primary-700">{formatCurrency(row.estimated_cost)}</span>
          <p className="text-xs text-slate-500">{parseFloat(row.estimated_distance_km)} km estimated</p>
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
            variant="outline"
            size="xs"
            icon={Eye}
            onClick={() => setSelectedJob(row)}
          >
            Route Info
          </Button>
          <Button
            variant="primary"
            size="xs"
            className="bg-emerald-600 hover:bg-emerald-700"
            icon={Truck}
            onClick={() => {
              setJobToClaim(row);
              setClaimModalOpen(true);
            }}
          >
            Claim Job
          </Button>
        </div>
      ),
    },
  ];

  // My Jobs Columns
  const myJobColumns = [
    {
      header: 'Shipment #',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900">#{row.id}</span>
          <p className="text-xs text-slate-500">Order #{row.order_number}</p>
        </div>
      ),
    },
    {
      header: 'Route Details',
      render: (row) => (
        <div>
          <div className="flex items-center gap-1 font-semibold text-slate-800">
            <span>{row.pickup_city}</span>
            <span className="text-slate-400">→</span>
            <span>{row.drop_city}</span>
          </div>
          <p className="text-xs text-slate-400">
            {parseFloat(row.weight_tons) ? `${parseFloat(row.weight_tons)} MT Cargo` : 'Bulk Cargo'}
          </p>
        </div>
      ),
    },
    {
      header: 'Freight Payout',
      render: (row) => (
        <div>
          <span className="font-bold text-emerald-700">
            {formatCurrency(row.final_charge || row.estimated_cost)}
          </span>
          <p className="text-[11px] text-slate-400">Settled upon delivery</p>
        </div>
      ),
    },
    {
      header: 'Current Status',
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
            onClick={() => setSelectedJob(row)}
          >
            Details
          </Button>

          {row.status !== 'delivered' && (
            <Button
              variant="primary"
              size="xs"
              onClick={() => handleOpenStatusModal(row)}
            >
              Update Status
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Transporter Logistics & Freight Hub"
        subtitle="Claim open dispatch deliveries, update transit checkpoints, and track commercial freight earnings."
        badge="Live Transporter Portal"
        action={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadDashboardData}>
            Sync Logistics
          </Button>
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
          title="Assigned Active Deliveries"
          value={activeDeliveries.length}
          subtitle="Currently assigned to your fleet"
          icon={Truck}
          color="amber"
        />

        <StatCard
          title="Completed Deliveries"
          value={completedDeliveries.length}
          subtitle="Successfully delivered shipments"
          icon={CheckCircle}
          color="emerald"
        />

        <StatCard
          title="Freight Earnings"
          value={formatCurrency(
            completedDeliveries.reduce((sum, j) => sum + parseFloat(j.final_charge || j.estimated_cost || 0), 0)
          )}
          subtitle="Settled transportation revenue"
          icon={DollarSign}
          color="primary"
        />

        <StatCard
          title="Available Open Shipments"
          value={`${availableJobs.length} Jobs`}
          subtitle="Awaiting transporter pickup"
          icon={Navigation}
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
          Fleet Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'available'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Available Open Shipments ({availableJobs.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'active'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Active Shipments ({activeDeliveries.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Delivery History ({completedDeliveries.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Quick Active Deliveries */}
          <Card>
            <CardHeader
              title="Active In-Transit Shipments"
              subtitle="Current cargo shipments assigned to your driver account"
              action={
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('active')}>
                  View Active Shipments →
                </Button>
              }
            />
            <DataTable
              columns={myJobColumns}
              data={activeDeliveries}
              emptyTitle="No Active Shipments"
              emptyDescription="You have no shipments currently in transit. Check the Available Jobs pool to claim shipments."
            />
          </Card>

          {/* Quick Available Jobs */}
          <Card>
            <CardHeader
              title="Open Market Freight Requests"
              subtitle="Agricultural orders ready for transportation and route assignment"
              action={
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('available')}>
                  View All Open Jobs →
                </Button>
              }
            />
            <DataTable
              columns={availableColumns}
              data={availableJobs.slice(0, 4)}
              emptyTitle="No Open Freight Jobs"
              emptyDescription="There are currently no new transport requests waiting for assignment."
            />
          </Card>
        </div>
      )}

      {/* Tab 2: Available Jobs */}
      {activeTab === 'available' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Available Cargo Shipments</h3>
            <p className="text-xs text-slate-500">Claim regional transport jobs for verified farmer harvests.</p>
          </div>

          <DataTable
            columns={availableColumns}
            data={availableJobs}
            emptyTitle="No Available Jobs"
            emptyDescription="All current farm shipments have been claimed. Check back shortly for new orders."
          />
        </div>
      )}

      {/* Tab 3: Active Jobs */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Assigned In-Transit Deliveries</h3>
            <p className="text-xs text-slate-500">Update transit status as you pick up produce, reach checkpoints, and deliver.</p>
          </div>

          <DataTable
            columns={myJobColumns}
            data={activeDeliveries}
            emptyTitle="No Active Deliveries"
            emptyDescription="You have no shipments in transit right now. Visit 'Available Jobs' to accept open delivery requests."
          />
        </div>
      )}

      {/* Tab 4: History */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Completed Delivery History</h3>
            <p className="text-xs text-slate-500">Record of verified cargo deliveries and settled freight revenues.</p>
          </div>

          <DataTable
            columns={myJobColumns}
            data={completedDeliveries}
            emptyTitle="No Completed Deliveries Yet"
            emptyDescription="When you finish delivering cargo and mark it complete, your shipment history will appear here."
          />
        </div>
      )}

      {/* CLAIM JOB CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={claimModalOpen}
        title="Claim Transport Shipment"
        message={`Are you sure you want to accept shipment for Order #${jobToClaim?.order_number}? Route: ${jobToClaim?.pickup_city} → ${jobToClaim?.drop_city} (${parseFloat(jobToClaim?.weight_tons) ? `${parseFloat(jobToClaim?.weight_tons)} MT` : 'Bulk Cargo'}).`}
        confirmText="Confirm & Claim Job"
        confirmVariant="primary"
        loading={actionLoading}
        onConfirm={handleConfirmClaimJob}
        onClose={() => setClaimModalOpen(false)}
      />

      {/* UPDATE STATUS MODAL */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Update Shipment Progress</h3>
              <button type="button" onClick={() => setStatusModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStatusUpdate} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <p><strong>Shipment ID:</strong> #{jobToUpdate?.id}</p>
                <p><strong>Order #:</strong> #{jobToUpdate?.order_number}</p>
                <p><strong>Route:</strong> {jobToUpdate?.pickup_city} → {jobToUpdate?.drop_city}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Shipment Status *</label>
                <select
                  value={statusUpdateForm.status}
                  onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="picked_up">Cargo Picked Up from Farmer</option>
                  <option value="in_transit">In Transit on Highway</option>
                  <option value="delivered">Delivered to Buyer Destination</option>
                </select>
              </div>

              <Input
                label="Current Transit Location / Checkpoint"
                placeholder="e.g. Pune Highway Toll Plaza, Highway NH-60"
                value={statusUpdateForm.current_location}
                onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, current_location: e.target.value })}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tracking Notes & Updates</label>
                <textarea
                  rows="2"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Cargo loaded securely, vehicle inspected, estimated arrival 4:00 PM..."
                  value={statusUpdateForm.tracking_notes}
                  onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, tracking_notes: e.target.value })}
                />
              </div>

              {statusUpdateForm.status === 'delivered' && (
                <Input
                  label="Final Settled Freight Charge (₹) *"
                  type="number"
                  step="0.01"
                  value={statusUpdateForm.final_charge}
                  onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, final_charge: e.target.value })}
                  required
                />
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setStatusModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={actionLoading}>
                  Update Shipment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHIPMENT DETAILS MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Shipment #{selectedJob.id}</h3>
                <p className="text-xs text-slate-400">Linked to Order #{selectedJob.order_number}</p>
              </div>
              <StatusBadge status={selectedJob.status} />
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Pickup Location (Farmer)</span>
                <p className="font-bold text-slate-900">{selectedJob.pickup_address}</p>
                <p className="text-slate-600">{selectedJob.pickup_city}, {selectedJob.pickup_state} ({selectedJob.pickup_pincode})</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Delivery Destination (Buyer)</span>
                <p className="font-bold text-slate-900">{selectedJob.drop_address}</p>
                <p className="text-slate-600">{selectedJob.drop_city}, {selectedJob.drop_state} ({selectedJob.drop_pincode})</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-[11px] text-slate-400">Cargo Weight:</span>
                  <p className="font-bold text-slate-900">
                    {parseFloat(selectedJob.weight_tons) ? `${parseFloat(selectedJob.weight_tons)} Metric Tons` : 'Bulk Commercial Freight'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Vehicle Class:</span>
                  <p className="font-bold text-slate-900 capitalize">{selectedJob.vehicle_type_needed?.replace('_', ' ') || 'Any'}</p>
                </div>
              </div>

              {selectedJob.tracking_notes && (
                <div className="p-3 bg-amber-50 rounded-xl text-amber-900 text-xs">
                  <span className="font-semibold">Logistics Notes:</span>
                  <p className="mt-1 whitespace-pre-line text-slate-700">{selectedJob.tracking_notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransporterDashboard;
