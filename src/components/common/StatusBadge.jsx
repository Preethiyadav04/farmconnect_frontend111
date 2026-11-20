import React from 'react';

/**
 * Reusable StatusBadge component for uniform status styling across all workflows.
 */
export const StatusBadge = ({ status, size = 'sm', className = '' }) => {
  const norm = (status || '').toLowerCase().trim();

  // Status mapping
  const styles = {
    // Green / Success
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Active / Available' },
    delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Delivered & Complete' },
    confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Confirmed' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Completed' },
    accepted: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Accepted' },
    converted: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Converted to Order' },

    // Amber / Pending / Waiting
    pending: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', label: 'Pending Confirmation' },
    requested: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', label: 'Requested' },
    countered: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', label: 'Counter-Offer Proposed' },

    // Blue / In Progress
    processing: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Processing & Packing' },
    picked_up: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Cargo Picked Up' },
    in_transit: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'In Transit' },
    dispatched: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Dispatched / In Transit' },

    // Slate / Neutral
    unavailable: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: 'Paused / Unavailable' },
    draft: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: 'Draft' },

    // Red / Failure / Cancelled
    sold_out: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Sold Out' },
    cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Cancelled' },
    rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Rejected' },
    failed: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Payment Failed' },
    refunded: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Refunded' },
  };

  const current = styles[norm] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    label: status || 'Unknown',
  };

  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border ${current.bg} ${current.text} ${current.border} ${sizeClasses[size] || sizeClasses.sm} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      <span className="capitalize">{current.label}</span>
    </span>
  );
};

export default StatusBadge;
