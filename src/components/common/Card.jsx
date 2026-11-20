import React from 'react';

export const Card = ({
  children,
  className = '',
  hover = false,
  padding = true,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 shadow-sm ${
        hover ? 'transition-all duration-200 hover:shadow-md hover:border-slate-300' : ''
      } ${padding ? 'p-5 sm:p-6' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, action, className = '' }) => (
  <div className={`flex items-start justify-between pb-4 mb-4 border-b border-slate-100 ${className}`}>
    <div>
      {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0 ml-4">{action}</div>}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`pt-4 mt-4 border-t border-slate-100 flex items-center justify-between ${className}`}>
    {children}
  </div>
);

export default Card;
