import React from 'react';

export default function DonorHand({ className = 'w-64 h-36' }) {
  return (
    <svg
      viewBox="0 0 240 130"
      className={`drop-shadow-xl overflow-visible select-none ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Donor Skin Gradient */}
        <linearGradient id="donorSkinGrad" x1="0%" y1="0%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#F5C396" />
          <stop offset="65%" stopColor="#EAAC77" />
          <stop offset="100%" stopColor="#D98E54" />
        </linearGradient>
        {/* Palm Shadow */}
        <radialGradient id="donorPalmShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C97A40" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#C97A40" stopOpacity="0" />
        </radialGradient>
        {/* Sleeve Gradient - Chocolate/Terracotta */}
        <linearGradient id="donorSleeveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3E2723" />
          <stop offset="70%" stopColor="#4E342E" />
          <stop offset="100%" stopColor="#6D4C41" />
        </linearGradient>
      </defs>

      {/* --- Forearm & Sleeve (Left Side) --- */}
      <path
        d="M0 45 L70 42 C76 42, 80 46, 82 52 L86 78 C88 84, 82 90, 75 90 L0 88 Z"
        fill="url(#donorSleeveGrad)"
      />
      {/* Sleeve Cuff Fold */}
      <ellipse cx="76" cy="66" rx="8" ry="24" fill="#CC5500" opacity="0.9" />
      <ellipse cx="78" cy="66" rx="6" ry="22" fill="#FAF7EE" />

      {/* --- Wrist & Base of Palm --- */}
      <path
        d="M78 52 C90 52, 106 50, 120 54 C132 58, 142 66, 150 74 C140 86, 120 90, 100 86 C88 84, 80 80, 78 78 Z"
        fill="url(#donorSkinGrad)"
      />

      {/* --- Thumb (Upper graceful curve supporting food) --- */}
      <path
        d="M106 52 C114 42, 128 32, 146 34 C152 35, 156 40, 153 45 C149 50, 138 52, 128 58 C120 62, 114 62, 108 58 Z"
        fill="url(#donorSkinGrad)"
      />
      {/* Thumb nail */}
      <ellipse cx="147" cy="38" rx="3.5" ry="2.2" fill="#FFF" opacity="0.45" transform="rotate(10 147 38)" />
      {/* Thumb crease */}
      <path d="M122 47 C125 49, 128 50, 131 49" stroke="#B86E38" strokeWidth="1.2" strokeLinecap="round" />

      {/* --- Palm Soft Shading --- */}
      <ellipse cx="126" cy="70" rx="16" ry="10" fill="url(#donorPalmShadow)" />

      {/* --- Fingers Extending to Present/Give Food --- */}
      {/* Index Finger */}
      <path
        d="M138 58 C152 54, 178 48, 198 52 C204 53, 206 59, 201 64 C194 70, 176 72, 160 70 L146 68 Z"
        fill="url(#donorSkinGrad)"
      />
      <ellipse cx="196" cy="56" rx="4" ry="2.5" fill="#FFF" opacity="0.4" transform="rotate(5 196 56)" />
      {/* Joint crease */}
      <path d="M166 58 C168 62, 168 65, 166 68" stroke="#B86E38" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

      {/* Middle Finger (Longest, gently curled) */}
      <path
        d="M142 66 C158 64, 185 60, 206 66 C212 68, 212 75, 206 79 C198 83, 176 83, 158 79 L142 76 Z"
        fill="url(#donorSkinGrad)"
      />
      <ellipse cx="204" cy="71" rx="4.2" ry="2.6" fill="#FFF" opacity="0.4" transform="rotate(8 204 71)" />
      <path d="M174 68 C176 72, 176 76, 174 80" stroke="#B86E38" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

      {/* Ring Finger */}
      <path
        d="M138 74 C152 74, 176 72, 195 78 C201 80, 200 87, 194 90 C184 94, 166 93, 150 88 L136 84 Z"
        fill="url(#donorSkinGrad)"
      />
      <ellipse cx="192" cy="83" rx="3.8" ry="2.3" fill="#FFF" opacity="0.35" transform="rotate(10 192 83)" />

      {/* Little Finger (Pinky) */}
      <path
        d="M130 82 C142 82, 162 82, 178 88 C184 90, 182 96, 176 98 C168 101, 152 99, 140 94 L126 88 Z"
        fill="url(#donorSkinGrad)"
      />
      <ellipse cx="174" cy="92" rx="3.2" ry="2" fill="#FFF" opacity="0.3" transform="rotate(12 174 92)" />

      {/* Wrist Tendon / Natural Line */}
      <path d="M92 64 C104 65, 114 67, 122 71" stroke="#DE9E6E" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
