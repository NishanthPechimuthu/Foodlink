import React from 'react';

export default function ReceiverCharacter({ className = 'w-60 h-72' }) {
  return (
    <svg
      viewBox="0 0 240 290"
      className={`drop-shadow-2xl overflow-visible select-none ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Receiver Skin Gradient */}
        <linearGradient id="rcSkinGrad" x1="100%" y1="0%" x2="0%" y2="50%">
          <stop offset="0%" stopColor="#F7CEAC" />
          <stop offset="65%" stopColor="#EBB589" />
          <stop offset="100%" stopColor="#D99763" />
        </linearGradient>
        {/* Hair Gradient */}
        <linearGradient id="rcHairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5D4037" />
          <stop offset="100%" stopColor="#3E2723" />
        </linearGradient>
        {/* Sweater Gradient - Community Forest Green / Warm Sage */}
        <linearGradient id="rcSweaterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2E7D32" />
          <stop offset="100%" stopColor="#1B5E20" />
        </linearGradient>
      </defs>

      {/* --- Torso & Cozy Community Sweater (Receiver Body) --- */}
      <path
        d="M40 290 L60 160 C64 148, 80 140, 96 140 H144 C160 140, 176 148, 180 160 L200 290 Z"
        fill="url(#rcSweaterGrad)"
        stroke="#1B5E20"
        strokeWidth="2.5"
      />
      {/* Knit Ribbed Collar */}
      <path
        d="M96 140 C108 148, 132 148, 144 140"
        stroke="#81C784"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* --- Arms Reaching Forward with Open Cupped Hands --- */}
      {/* Arms extending toward center to receive */}
      <path
        d="M182 152 C195 170, 192 200, 170 215 C150 225, 110 220, 70 215"
        stroke="#1B5E20"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d="M182 152 C195 170, 192 200, 170 215 C150 225, 110 220, 70 215"
        stroke="#2E7D32"
        strokeWidth="11"
        strokeLinecap="round"
      />

      {/* Open Cupped Hands (Poised Beneath Food) */}
      <path
        d="M70 215 C55 210, 35 205, 22 212 C16 216, 18 224, 25 228 C36 233, 55 230, 68 225 Z"
        fill="url(#rcSkinGrad)"
      />
      {/* Open thumb welcoming */}
      <path
        d="M55 204 C48 196, 36 195, 28 202 C30 208, 38 210, 45 212 Z"
        fill="url(#rcSkinGrad)"
      />

      {/* --- Neck --- */}
      <path d="M106 112 L106 142 H134 L134 112 Z" fill="url(#rcSkinGrad)" />
      <path d="M102 136 C110 144, 130 144, 138 136" stroke="#D99763" strokeWidth="2.5" strokeLinecap="round" />

      {/* --- Head & Grateful Smiling Face --- */}
      <ellipse cx="120" cy="85" rx="34" ry="40" fill="url(#rcSkinGrad)" />
      {/* Ears */}
      <circle cx="86" cy="88" r="8" fill="url(#rcSkinGrad)" />
      <circle cx="154" cy="88" r="8" fill="url(#rcSkinGrad)" />

      {/* Flowing Soft Hair */}
      <path
        d="M82 86 C80 50, 96 38, 120 38 C144 38, 158 50, 158 86 C158 108, 152 118, 148 124 C144 114, 144 94, 144 80 C138 66, 102 66, 96 80 C96 94, 96 114, 92 124 C88 118, 82 108, 82 86 Z"
        fill="url(#rcHairGrad)"
      />

      {/* Eyebrows */}
      <path d="M102 70 C106 67, 114 68, 116 70" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M124 70 C126 68, 134 67, 138 70" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round" />

      {/* Eyes (Warm happy crescents) */}
      <path d="M102 79 C106 84, 112 84, 116 79" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M124 79 C128 84, 134 84, 138 79" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Rosy Cheeks */}
      <circle cx="98" cy="89" r="6" fill="#FF8A80" opacity="0.45" />
      <circle cx="142" cy="89" r="6" fill="#FF8A80" opacity="0.45" />

      {/* Nose */}
      <path d="M120 80 L122 88 H117" stroke="#D99763" strokeWidth="2.2" strokeLinecap="round" />

      {/* Happy Grateful Smile */}
      <path
        d="M108 97 C114 107, 126 107, 132 97"
        stroke="#3E2723"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="#FFF"
      />
    </svg>
  );
}
