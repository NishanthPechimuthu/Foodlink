import React from 'react';
import { motion } from 'motion/react';

export default function DonationBasket({
  filled = false,
  className = 'w-64 h-52 sm:w-80 sm:h-64',
  bounce = false,
}) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Dynamic Celebration Ripples when basket reaches capacity */}
      {filled && (
        <>
          <motion.div
            initial={{ scale: 0.7, opacity: 0.8 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
            className="absolute inset-[-12px] rounded-full border-2 border-burntOrange pointer-events-none"
          />
          <motion.div
            initial={{ scale: 0.85, opacity: 0.5 }}
            animate={{ scale: 1.85, opacity: 0 }}
            transition={{ duration: 1.8, delay: 0.35, repeat: Infinity, ease: 'easeOut' }}
            className="absolute inset-[-24px] rounded-full border border-burntOrange/60 pointer-events-none"
          />
        </>
      )}

      {/* Large Scaled Donation Basket SVG */}
      <motion.svg
        viewBox="0 0 240 190"
        className="w-full h-full drop-shadow-2xl overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={
          bounce
            ? {
                scale: [1, 1.1, 0.94, 1.04, 1],
                y: [0, -8, 3, -1, 0],
              }
            : {}
        }
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <defs>
          <linearGradient id="lrgHandleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8D5524" />
            <stop offset="60%" stopColor="#5D3A1A" />
            <stop offset="100%" stopColor="#3E240F" />
          </linearGradient>
          <linearGradient id="lrgWickerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D49B5E" />
            <stop offset="40%" stopColor="#B3773B" />
            <stop offset="100%" stopColor="#754419" />
          </linearGradient>
          <radialGradient id="lrgInnerShadow" cx="50%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#4A2A11" />
            <stop offset="100%" stopColor="#2A1507" />
          </radialGradient>
        </defs>

        {/* --- High Sturdy Arching Handle --- */}
        <path
          d="M50 95 C50 20, 190 20, 190 95"
          stroke="url(#lrgHandleGrad)"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M50 95 C50 26, 190 26, 190 95"
          stroke="#FCE3C8"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.4"
        />

        {/* --- Deep Hollow Interior Rim (Shows empty depth) --- */}
        <ellipse cx="120" cy="96" rx="82" ry="24" fill="url(#lrgInnerShadow)" />

        {/* --- Overflowing Food Abundance (Filled State) --- */}
        {filled && (
          <g id="lrgOverflowingHarvest">
            {/* Background aura */}
            <ellipse cx="120" cy="74" rx="72" ry="28" fill="#FFB74D" opacity="0.25" />

            {/* Fresh Leafy Greens & Cabbage */}
            <path
              d="M54 75 C48 60, 65 50, 78 60 C84 50, 100 52, 98 68 Z"
              fill="#2E7D32"
            />
            <path d="M60 66 C68 58, 80 62, 78 70" stroke="#81C784" strokeWidth="2" strokeLinecap="round" />

            {/* Artisanal Sourdough Loaf */}
            <ellipse cx="118" cy="62" rx="38" ry="19" fill="#D7A15C" />
            <path d="M96 58 C100 64, 104 70, 104 76" stroke="#F5D0A9" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M118 55 C118 63, 118 72, 118 78" stroke="#F5D0A9" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M140 58 C136 64, 132 70, 132 76" stroke="#F5D0A9" strokeWidth="3.5" strokeLinecap="round" />

            {/* Crunchy Orange Carrots */}
            <path d="M152 68 L174 44" stroke="#E65100" strokeWidth="9" strokeLinecap="round" />
            <path d="M174 44 L188 32 M174 44 L190 40 M174 44 L178 28" stroke="#388E3C" strokeWidth="3.5" strokeLinecap="round" />

            {/* Bananas nestled */}
            <path d="M72 74 C86 64, 104 70, 110 82" stroke="#FDD835" strokeWidth="7" strokeLinecap="round" />
            <path d="M110 82 L114 85" stroke="#795548" strokeWidth="3" strokeLinecap="round" />

            {/* Juicy Red Tomatoes */}
            <circle cx="82" cy="78" r="20" fill="#CC5500" />
            <ellipse cx="76" cy="70" rx="6" ry="3" fill="#FFF" opacity="0.45" transform="rotate(-20 76 70)" />
            <path d="M82 61 C82 56, 86 54, 89 54" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" />

            {/* Fresh Green Apple */}
            <circle cx="158" cy="78" r="20" fill="#388E3C" />
            <ellipse cx="152" cy="70" rx="6" ry="3" fill="#FFF" opacity="0.45" transform="rotate(-25 152 70)" />
            <path d="M158 61 C158 56, 162 55, 165 55" stroke="#4E342E" strokeWidth="2.5" strokeLinecap="round" />

            {/* Bright Sweet Orange in Center */}
            <circle cx="120" cy="85" r="18" fill="#FFA726" />
            <ellipse cx="114" cy="79" rx="5" ry="2.5" fill="#FFF" opacity="0.45" transform="rotate(-15 114 79)" />
          </g>
        )}

        {/* --- Front Basket Braided Rim --- */}
        <ellipse cx="120" cy="96" rx="82" ry="18" fill="#8D5524" />
        <ellipse cx="120" cy="94" rx="80" ry="14" fill="#D49B5E" />

        {/* --- Deep Woven Basket Base --- */}
        <path
          d="M36 96 L54 168 C56 174, 62 180, 70 180 H170 C178 180, 184 174, 186 168 L204 96 C204 96, 184 116, 120 116 C56 116, 36 96, 36 96 Z"
          fill="url(#lrgWickerGrad)"
        />

        {/* --- High Definition Wicker Cross-Hatch Pattern --- */}
        <g opacity="0.55" stroke="#FCE3C8" strokeWidth="2.4" strokeLinecap="round">
          {/* Diagonal Left-to-Right */}
          <path d="M50 108 L72 176" />
          <path d="M72 109 L94 178" />
          <path d="M96 111 L116 179" />
          <path d="M120 111 L140 179" />
          <path d="M144 110 L164 178" />
          <path d="M168 108 L184 162" />

          {/* Diagonal Right-to-Left */}
          <path d="M190 108 L168 176" />
          <path d="M168 109 L146 178" />
          <path d="M144 111 L124 179" />
          <path d="M120 111 L100 179" />
          <path d="M96 110 L76 178" />
          <path d="M72 108 L56 162" />
        </g>

        {/* Sturdy Bottom Base Edge */}
        <path
          d="M62 176 C80 182, 160 182, 178 176"
          stroke="#4A2A11"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </motion.svg>
    </div>
  );
}
