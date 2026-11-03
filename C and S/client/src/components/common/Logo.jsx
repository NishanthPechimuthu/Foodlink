import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ size = 'md', showTagline = false, className = '' }) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group transition-transform duration-200 active:scale-95 ${className}`}>
      {/* Brand Icon SVG */}
      <div className={`${iconSizes[size]} rounded-xl bg-burntOrange flex items-center justify-center text-white shadow-clay-btn transition-transform duration-200 group-hover:scale-105 shrink-0`}>
        <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Stem & Leaf */}
          <path d="M20 7C23 4 27 6 27 9C24 10 21 9 20 7Z" fill="#2E7D32" />
          <path d="M20 7C18 10 17 12 17 14" stroke="#FFF" strokeWidth="1.8" strokeLinecap="round" />
          {/* Apple/Bowl Silhouette */}
          <path d="M20 14C13 14 9 18 9 25C9 32 16 35 20 35C24 35 31 32 31 25C31 18 27 14 20 14Z" fill="#F8F4E7" />
          {/* Community Heart */}
          <path d="M20 22C18.5 19.5 15.5 19.5 14 21.5C12.5 23.5 15 26.5 20 29.5C25 26.5 27.5 23.5 26 21.5C24.5 19.5 21.5 19.5 20 22Z" fill="#CC5500" />
        </svg>
      </div>

      <div>
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-heading font-extrabold ${textSizes[size]} tracking-tight text-chocolate`}>
            Food<span className="text-burntOrange">Link</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-burntOrange animate-pulse" />
        </div>
        {showTagline && (
          <span className="block text-xs text-chocolate/70 font-medium tracking-tight mt-0.5">
            Good food deserves another chance
          </span>
        )}
      </div>
    </Link>
  );
}
