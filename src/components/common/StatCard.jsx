import React from 'react';

/**
 * Reusable StatCard component for displaying key metric summaries.
 */
export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary', // 'primary' | 'emerald' | 'amber' | 'blue' | 'purple' | 'slate'
  trend,
  className = '',
}) => {
  const colorMap = {
    primary: {
      bg: 'bg-primary-50',
      text: 'text-primary-700',
      border: 'border-primary-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
    },
    blue: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-100',
    },
    slate: {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200',
    },
  };

  const scheme = colorMap[color] || colorMap.primary;

  return (
    <div className={`bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start justify-between gap-4 ${className}`}>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        {trend && (
          <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 pt-1">
            <span>{trend}</span>
          </p>
        )}
      </div>
      {Icon && (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${scheme.bg} ${scheme.text} ${scheme.border} border`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
};

export default StatCard;
