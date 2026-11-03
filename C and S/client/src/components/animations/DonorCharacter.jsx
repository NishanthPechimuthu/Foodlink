import React from 'react';

export default function DonorCharacter({ className = 'w-60 h-72' }) {
  return (
    <svg
      viewBox="0 0 240 290"
      className={`drop-shadow-2xl overflow-visible select-none ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Donor Skin Gradient */}
        <linearGradient id="dcSkinGrad" x1="0%" y1="0%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#F5C396" />
          <stop offset="65%" stopColor="#EAAC77" />
          <stop offset="100%" stopColor="#D98E54" />
        </linearGradient>
        {/* Hair Gradient */}
        <linearGradient id="dcHairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4E342E" />
          <stop offset="100%" stopColor="#2E1C18" />
        </linearGradient>
        {/* Apron / Outfit Gradient */}
        <linearGradient id="dcApronGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CC5500" />
          <stop offset="100%" stopColor="#A03E00" />
        </linearGradient>
      </defs>

      {/* --- Torso & Chef Apron (Donor Body) --- */}
      <path
        d="M40 290 L60 160 C64 148, 80 140, 96 140 H144 C160 140, 176 148, 180 160 L200 290 Z"
        fill="#FAF7EE"
        stroke="#4E342E"
        strokeWidth="2.5"
      />

      {/* Apron Front */}
      <path
        d="M80 160 L86 290 H154 L160 160 C150 156, 90 156, 80 160 Z"
        fill="url(#dcApronGrad)"
      />
      {/* Apron Straps */}
      <path d="M88 160 L78 120 M152 160 L162 120" stroke="#CC5500" strokeWidth="5" strokeLinecap="round" />
      {/* Apron Front Pocket */}
      <rect x="100" y="210" width="40" height="30" rx="6" fill="#A03E00" stroke="#FFF" strokeWidth="1.2" opacity="0.8" />
      {/* Sprout motif on pocket */}
      <path d="M120 220 C122 216, 126 217, 126 221 C124 222, 121 221, 120 220 Z" fill="#FFF" />
      <path d="M120 220 L120 226" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />

      {/* --- Arms Reaching Forward with Meal --- */}
      {/* Left Back Arm */}
      <path
        d="M58 152 C45 170, 48 200, 70 215 C90 225, 130 220, 170 215"
        stroke="#4E342E"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d="M58 152 C45 170, 48 200, 70 215 C90 225, 130 220, 170 215"
        stroke="#FAF7EE"
        strokeWidth="11"
        strokeLinecap="round"
      />

      {/* Hands Extending Forward (Warm Giving Hands) */}
      <path
        d="M170 215 C185 210, 205 205, 218 212 C224 216, 222 224, 215 228 C204 233, 185 230, 172 225 Z"
        fill="url(#dcSkinGrad)"
      />
      {/* Thumb supporting package */}
      <path
        d="M185 204 C192 196, 204 195, 212 202 C210 208, 202 210, 195 212 Z"
        fill="url(#dcSkinGrad)"
      />

      {/* --- Neck & Collar --- */}
      <path d="M106 112 L106 142 H134 L134 112 Z" fill="url(#dcSkinGrad)" />
      <path d="M102 136 C110 144, 130 144, 138 136" stroke="#DE9E6E" strokeWidth="2.5" strokeLinecap="round" />

      {/* --- Head & Friendly Smiling Face --- */}
      {/* Head shape */}
      <ellipse cx="120" cy="85" rx="34" ry="40" fill="url(#dcSkinGrad)" />
      {/* Ears */}
      <circle cx="86" cy="88" r="8" fill="url(#dcSkinGrad)" />
      <circle cx="154" cy="88" r="8" fill="url(#dcSkinGrad)" />

      {/* Stylized Modern Haircut */}
      <path
        d="M84 76 C84 46, 102 38, 120 38 C142 38, 156 48, 156 74 C156 82, 150 78, 144 72 C132 60, 108 60, 96 72 C90 78, 84 82, 84 76 Z"
        fill="url(#dcHairGrad)"
      />

      {/* Eyebrows (Warm, Friendly) */}
      <path d="M102 70 C106 67, 114 68, 116 70" stroke="#4E342E" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M124 70 C126 68, 134 67, 138 70" stroke="#4E342E" strokeWidth="2.5" strokeLinecap="round" />

      {/* Eyes (Happy, expressive curved crescents) */}
      <path d="M102 79 C106 84, 112 84, 116 79" stroke="#4E342E" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M124 79 C128 84, 134 84, 138 79" stroke="#4E342E" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Rosy Cheeks */}
      <circle cx="98" cy="89" r="6" fill="#FF8A80" opacity="0.45" />
      <circle cx="142" cy="89" r="6" fill="#FF8A80" opacity="0.45" />

      {/* Nose */}
      <path d="M120 80 L118 88 H123" stroke="#DE9E6E" strokeWidth="2.2" strokeLinecap="round" />

      {/* Warm Genuine Smile */}
      <path
        d="M108 97 C114 107, 126 107, 132 97"
        stroke="#4E342E"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="#FFF"
      />
    </svg>
  );
}
