import React from 'react';

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`inline-block ${sizeMap[size] || sizeMap.md} rounded-full border-burntOrange/30 border-t-burntOrange animate-spin ${className}`} role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );
}
