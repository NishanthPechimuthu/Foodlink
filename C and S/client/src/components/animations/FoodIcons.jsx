import React from 'react';

export function TomatoIcon({ className = 'w-10 h-10' }) {
  return (
    <svg viewBox="0 0 48 48" className={`drop-shadow-md select-none ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="flTomatoGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FF7A45" />
          <stop offset="60%" stopColor="#CC5500" />
          <stop offset="100%" stopColor="#9E3A00" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="27" r="18" fill="url(#flTomatoGrad)" />
      <ellipse cx="18" cy="20" rx="5" ry="3" fill="#FFFFFF" opacity="0.4" transform="rotate(-20 18 20)" />
      <path d="M24 10C24 6 25 4 27 3" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 11C20 9 14 10 13 14C17 14 21 13 24 11Z" fill="#388E3C" />
      <path d="M24 11C28 9 34 10 35 14C31 14 27 13 24 11Z" fill="#2E7D32" />
      <path d="M24 11C23 15 22 17 24 19C25 17 25 15 24 11Z" fill="#1B5E20" />
    </svg>
  );
}

export function AppleIcon({ className = 'w-10 h-10' }) {
  return (
    <svg viewBox="0 0 48 48" className={`drop-shadow-md select-none ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="flAppleGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#81C784" />
          <stop offset="70%" stopColor="#2E7D32" />
          <stop offset="100%" stopColor="#1B5E20" />
        </radialGradient>
      </defs>
      <path
        d="M24 14C20 10 12 12 10 20C8 28 14 42 22 43C23.5 43 24.5 42 24.5 42C24.5 42 25.5 43 27 43C35 42 41 28 39 20C37 12 29 10 24 14Z"
        fill="url(#flAppleGrad)"
      />
      <ellipse cx="16" cy="22" rx="4" ry="2.5" fill="#FFFFFF" opacity="0.4" transform="rotate(-30 16 22)" />
      <path d="M24 14C24 9 26 6 29 5" stroke="#4E342E" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M25 9C29 7 34 8 36 11C32 12 28 11 25 9Z" fill="#4CAF50" />
    </svg>
  );
}

export function CarrotIcon({ className = 'w-10 h-10' }) {
  return (
    <svg viewBox="0 0 48 48" className={`drop-shadow-md select-none ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="flCarrotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFA726" />
          <stop offset="100%" stopColor="#E65100" />
        </linearGradient>
      </defs>
      <path
        d="M20 14C24 14 34 16 34 18C34 20 22 42 16 45C15 45.5 14 44.5 14.5 43.5C18 36 20 18 20 14Z"
        fill="url(#flCarrotGrad)"
      />
      <path d="M21 21C24 22 26 22.5 28 23" stroke="#D84315" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M19 28C22 29 23.5 29.5 25 30" stroke="#D84315" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M28 16C31 12 36 9 39 8" stroke="#388E3C" strokeWidth="2" strokeLinecap="round" />
      <path d="M30 15C34 14 39 13 42 14" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 17C30 14 33 11 36 10" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function BreadIcon({ className = 'w-10 h-10' }) {
  return (
    <svg viewBox="0 0 48 48" className={`drop-shadow-md select-none ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="flBreadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D7A15C" />
          <stop offset="60%" stopColor="#A86A2B" />
          <stop offset="100%" stopColor="#7E4717" />
        </linearGradient>
      </defs>
      <path
        d="M8 26C8 18 14 14 24 14C34 14 40 18 40 26C40 33 34 35 24 35C14 35 8 33 8 26Z"
        fill="url(#flBreadGrad)"
      />
      <path d="M16 20C17 24 18 27 18 29" stroke="#F5D0A9" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 19C24 24 24 27 24 30" stroke="#F5D0A9" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 20C31 24 30 27 30 29" stroke="#F5D0A9" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function BananaIcon({ className = 'w-10 h-10' }) {
  return (
    <svg viewBox="0 0 48 48" className={`drop-shadow-md select-none ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="flBananaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFEE58" />
          <stop offset="70%" stopColor="#FDD835" />
          <stop offset="100%" stopColor="#F57F17" />
        </linearGradient>
      </defs>
      <path
        d="M10 36 C18 40, 32 36, 40 18 C42 14, 40 10, 36 12 C30 16, 18 24, 10 36 Z"
        fill="url(#flBananaGrad)"
      />
      <path d="M38 12 L42 8" stroke="#4E342E" strokeWidth="3" strokeLinecap="round" />
      <path d="M10 36 L7 39" stroke="#8D6E63" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 34 C22 35, 30 30, 36 17" stroke="#FFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function CabbageIcon({ className = 'w-10 h-10' }) {
  return (
    <svg viewBox="0 0 48 48" className={`drop-shadow-md select-none ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="flCabbageGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C8E6C9" />
          <stop offset="60%" stopColor="#66BB6A" />
          <stop offset="100%" stopColor="#2E7D32" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="17" fill="url(#flCabbageGrad)" />
      <path d="M14 18 C18 12, 30 12, 34 18" stroke="#A5D6A7" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M12 28 C18 34, 30 34, 36 28" stroke="#A5D6A7" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M10 24 C10 18, 16 14, 24 16" stroke="#81C784" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M38 24 C38 18, 32 14, 24 16" stroke="#81C784" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="24" cy="24" r="6" fill="#C8E6C9" opacity="0.6" />
    </svg>
  );
}

export function MilkCartonIcon({ className = 'w-10 h-10' }) {
  return (
    <svg viewBox="0 0 48 48" className={`drop-shadow-md select-none ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="16" width="20" height="24" rx="4" fill="#FFFFFF" stroke="#4E342E" strokeWidth="1.5" />
      <path d="M14 16 L24 9 L34 16 Z" fill="#E0F2FE" stroke="#4E342E" strokeWidth="1.5" />
      <rect x="21" y="6" width="6" height="4" rx="1" fill="#0284C7" />
      <rect x="17" y="22" width="14" height="12" rx="2" fill="#BAE6FD" />
      <path d="M24 25 C26 27, 27 29, 27 30 C27 32, 25.5 33, 24 33 C22.5 33, 21 32, 21 30 C21 29, 22 27, 24 25 Z" fill="#0284C7" />
    </svg>
  );
}

export function BentoBoxIcon({ className = 'w-10 h-10' }) {
  return (
    <svg viewBox="0 0 48 48" className={`drop-shadow-md select-none ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="14" width="32" height="24" rx="5" fill="#4E342E" />
      <rect x="10" y="16" width="28" height="20" rx="4" fill="#F8F4E7" />
      <line x1="24" y1="16" x2="24" y2="36" stroke="#4E342E" strokeWidth="2" />
      <line x1="24" y1="26" x2="38" y2="26" stroke="#4E342E" strokeWidth="2" />
      <circle cx="17" cy="26" r="4.5" fill="#E65100" />
      <circle cx="31" cy="21" r="3" fill="#2E7D32" />
      <rect x="28" y="29" width="7" height="4" rx="2" fill="#D7A15C" />
    </svg>
  );
}

export function OrangeIcon({ className = 'w-10 h-10' }) {
  return (
    <svg viewBox="0 0 48 48" className={`drop-shadow-md select-none ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="flOrangeGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FFA726" />
          <stop offset="70%" stopColor="#FB8C00" />
          <stop offset="100%" stopColor="#E65100" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="26" r="17" fill="url(#flOrangeGrad)" />
      <circle cx="20" cy="20" r="1" fill="#FFFFFF" opacity="0.5" />
      <circle cx="28" cy="24" r="1" fill="#E65100" opacity="0.4" />
      <circle cx="22" cy="30" r="1" fill="#E65100" opacity="0.4" />
      <path d="M24 9C24 6 26 4 28 3" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 9C27 7 32 7 34 10C30 11 26 10 24 9Z" fill="#388E3C" />
    </svg>
  );
}

export function BasketIcon({ className = 'w-16 h-16', filled = false }) {
  return (
    <svg viewBox="0 0 64 64" className={`drop-shadow-lg select-none ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="flBasketGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C48E58" />
          <stop offset="100%" stopColor="#7E4717" />
        </linearGradient>
      </defs>
      <path d="M18 30C18 14 46 14 46 30" stroke="#7E4717" strokeWidth="4" strokeLinecap="round" />
      {filled && (
        <g id="basketFoodFilled">
          <circle cx="25" cy="24" r="8" fill="#2E7D32" />
          <path d="M25 16C25 14 27 12 29 11" stroke="#4E342E" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="39" cy="23" r="9" fill="#CC5500" />
          <path d="M39 14C39 12 40 11 41 10" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M32 18L35 12" stroke="#E65100" strokeWidth="3" strokeLinecap="round" />
          <path d="M35 12L38 9M35 12L34 8" stroke="#388E3C" strokeWidth="1.5" strokeLinecap="round" />
          <ellipse cx="32" cy="22" rx="10" ry="5.5" fill="#D7A15C" />
        </g>
      )}
      <ellipse cx="32" cy="30" rx="24" ry="7" fill="#8D5524" />
      <ellipse cx="32" cy="29" rx="23" ry="5.5" fill="#D7A15C" />
      <path
        d="M10 30L16 53C16.5 55 18.5 56.5 21 56.5H43C45.5 56.5 47.5 55 48 53L54 30C54 30 48 37 32 37C16 37 10 30 10 30Z"
        fill="url(#flBasketGrad)"
      />
      <path d="M18 35L23 55M26 36L30 55M34 36L37 55M42 35L44 55" stroke="#F5D0A9" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M46 35L41 55M38 36L34 55M30 36L27 55M22 35L20 55" stroke="#F5D0A9" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
