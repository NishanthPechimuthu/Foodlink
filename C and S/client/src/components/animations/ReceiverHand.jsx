import React from 'react';

export default function ReceiverHand({ className = 'w-64 h-36' }) {
  return (
    <svg
      viewBox="0 0 240 130"
      className={`drop-shadow-xl overflow-visible select-none ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Receiver Skin Gradient */}
        <linearGradient id="receiverSkinGrad" x1="100%" y1="0%" x2="0%" y2="50%">
          <stop offset="0%" stopColor="#F7CEAC" />
          <stop offset="65%" stopColor="#EBB589" />
          <stop offset="100%" stopColor="#D99763" />
        </linearGradient>
        {/* Palm Inner Cup Shadow */}
        <radialGradient id="receiverPalmShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C47E45" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#C47E45" stopOpacity="0" />
        </radialGradient>
        {/* Sleeve Gradient - Community Forest Green / Warm Olive */}
        <linearGradient id="receiverSleeveGrad" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#1B5E20" />
          <stop offset="70%" stopColor="#2E7D32" />
          <stop offset="100%" stopColor="#388E3C" />
        </linearGradient>
      </defs>

      {/* --- Forearm & Sleeve (Right Side) --- */}
      <path
        d="M240 45 L170 42 C164 42, 160 46, 158 52 L154 78 C152 84, 158 90, 165 90 L240 88 Z"
        fill="url(#receiverSleeveGrad)"
      />
      {/* Sleeve Folded Cuff */}
      <ellipse cx="164" cy="66" rx="8" ry="24" fill="#81C784" opacity="0.9" />
      <ellipse cx="162" cy="66" rx="6" ry="22" fill="#FAF7EE" />

      {/* --- Wrist & Cupping Palm (Open to receive) --- */}
      <path
        d="M162 52 C150 52, 134 52, 120 56 C108 60, 96 70, 88 80 C98 90, 120 94, 140 88 C152 84, 160 80, 162 78 Z"
        fill="url(#receiverSkinGrad)"
      />

      {/* --- Thumb (Open outwards welcomingly) --- */}
      <path
        d="M134 52 C126 42, 112 34, 94 36 C88 37, 84 42, 87 47 C91 52, 102 54, 112 60 C120 64, 126 64, 132 60 Z"
        fill="url(#receiverSkinGrad)"
      />
      {/* Thumb nail */}
      <ellipse cx="93" cy="40" rx="3.5" ry="2.2" fill="#FFF" opacity="0.45" transform="rotate(-10 93 40)" />
      {/* Thumb crease */}
      <path d="M118 48 C115 50, 112 51, 109 50" stroke="#B86E38" strokeWidth="1.2" strokeLinecap="round" />

      {/* --- Cupped Palm Center (Gentle concave shadow) --- */}
      <ellipse cx="114" cy="74" rx="18" ry="12" fill="url(#receiverPalmShadow)" />

      {/* --- Cupped Fingers Poised Beneath Food to Receive --- */}
      {/* Index Finger (Curving upward to catch/support) */}
      <path
        d="M102 60 C88 56, 62 54, 42 62 C36 64, 35 71, 41 75 C48 80, 66 79, 82 76 L96 72 Z"
        fill="url(#receiverSkinGrad)"
      />
      <ellipse cx="44" cy="67" rx="4" ry="2.5" fill="#FFF" opacity="0.4" transform="rotate(-12 44 67)" />
      {/* Joint crease */}
      <path d="M72 62 C70 66, 70 70, 72 74" stroke="#B86E38" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

      {/* Middle Finger (Open, supporting palm base) */}
      <path
        d="M98 68 C82 66, 55 68, 34 76 C28 78, 28 85, 34 89 C42 93, 64 91, 82 85 L98 80 Z"
        fill="url(#receiverSkinGrad)"
      />
      <ellipse cx="36" cy="82" rx="4.2" ry="2.6" fill="#FFF" opacity="0.4" transform="rotate(-8 36 82)" />
      <path d="M66 74 C64 78, 64 82, 66 86" stroke="#B86E38" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

      {/* Ring Finger */}
      <path
        d="M102 76 C88 76, 64 78, 45 86 C39 88, 40 95, 46 98 C56 102, 74 99, 90 92 L104 86 Z"
        fill="url(#receiverSkinGrad)"
      />
      <ellipse cx="48" cy="92" rx="3.8" ry="2.3" fill="#FFF" opacity="0.35" transform="rotate(-5 48 92)" />

      {/* Little Finger (Pinky) */}
      <path
        d="M110 84 C98 84, 78 86, 62 94 C56 96, 58 102, 64 104 C72 107, 88 103, 100 96 L114 90 Z"
        fill="url(#receiverSkinGrad)"
      />
      <ellipse cx="66" cy="99" rx="3.2" ry="2" fill="#FFF" opacity="0.3" />

      {/* Palm Life Line / Natural Crease */}
      <path d="M148 64 C136 66, 126 70, 118 76" stroke="#DE9E6E" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
