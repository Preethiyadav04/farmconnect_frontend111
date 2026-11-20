import React from 'react';

export const PageHeader = ({
  title,
  subtitle,
  badge,
  action,
  className = '',
}) => {
  return (
    <div className={`mb-6 sm:mb-8 pb-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          {badge && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0 flex items-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
