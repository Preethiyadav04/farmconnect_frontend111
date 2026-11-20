import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loading = ({ text = 'Loading...', size = 'md', fullPage = false }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <Loader2 className={`${sizeMap[size] || sizeMap.md} animate-spin text-primary-600`} />
      {text && <p className="text-sm font-medium text-slate-500">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export const Skeleton = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-slate-200 rounded-md ${className}`}
        />
      ))}
    </>
  );
};

export default Loading;
