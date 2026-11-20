import React from 'react';
import Button from './Button';

/**
 * Reusable EmptyState component for clean zero-data displays.
 */
export const EmptyState = ({
  icon: Icon,
  title = 'No records found',
  description = 'There are currently no items to display in this view.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200/80 space-y-4 max-w-md mx-auto ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
