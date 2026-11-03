import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, ArrowRight, Users, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';

export default function CommunityScene() {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center select-none text-center px-4">
      {/* Community Illustration (People sharing a table with fresh rescued food) */}
      <div className="w-full max-w-lg mb-4">
        <svg
          viewBox="0 0 380 140"
          className="w-full h-auto drop-shadow-lg overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="commTableGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#C89255" />
              <stop offset="100%" stopColor="#8D5524" />
            </linearGradient>
            <radialGradient id="commGlowGrad" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#FFA726" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FFA726" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Warm Background Table Aura */}
          <ellipse cx="190" cy="80" rx="170" ry="55" fill="url(#commGlowGrad)" />

          {/* Communal Wooden Dining Table */}
          <rect x="25" y="85" width="330" height="18" rx="6" fill="url(#commTableGrad)" stroke="#6D4C41" strokeWidth="2" />
          {/* Table Legs */}
          <rect x="65" y="103" width="16" height="34" rx="3" fill="#6D4C41" />
          <rect x="299" y="103" width="16" height="34" rx="3" fill="#6D4C41" />

          {/* People Gathering Behind Table */}
          {/* Person 1 (Left - Community Volunteer) */}
          <g id="commPerson1">
            <ellipse cx="90" cy="42" rx="16" ry="18" fill="#F5C396" />
            <path d="M74 38 C74 24, 84 18, 96 18 C108 18, 110 26, 108 38 Z" fill="#4E342E" />
            <path d="M84 46 C87 49, 93 49, 96 46" stroke="#4E342E" strokeWidth="2" strokeLinecap="round" />
            <path d="M68 85 L76 60 C80 56, 100 56, 104 60 L112 85 Z" fill="#2E7D32" />
          </g>

          {/* Person 2 (Center - Grateful Elder / Shelter Guest) */}
          <g id="commPerson2">
            <ellipse cx="190" cy="38" rx="17" ry="19" fill="#EAAC77" />
            <path d="M172 32 C172 20, 185 16, 195 16 C206 16, 210 22, 208 32 Z" fill="#9E9E9E" />
            <path d="M184 43 C187 47, 193 47, 196 43" stroke="#4E342E" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M166 85 L174 58 C180 54, 200 54, 206 58 L214 85 Z" fill="#CC5500" />
          </g>

          {/* Person 3 (Right - Child / Youth Member) */}
          <g id="commPerson3">
            <ellipse cx="290" cy="45" rx="15" ry="17" fill="#F7CEAC" />
            <path d="M276 40 C274 28, 285 22, 295 22 C306 22, 308 30, 306 40 Z" fill="#3E2723" />
            <path d="M285 50 C288 53, 293 53, 296 50" stroke="#4E342E" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M270 85 L278 63 C282 60, 298 60, 302 63 L310 85 Z" fill="#0284C7" />
          </g>

          {/* Fresh Rescued Food on Table */}
          {/* Central Bread Basket */}
          <ellipse cx="190" cy="85" rx="36" ry="10" fill="#A86E35" />
          <ellipse cx="190" cy="81" rx="26" ry="9" fill="#D7A15C" />
          <path d="M176 80 L178 85 M190 78 L190 85 M204 80 L202 85" stroke="#F5D0A9" strokeWidth="2" strokeLinecap="round" />

          {/* Red Apple Bowl on Left */}
          <ellipse cx="115" cy="86" rx="20" ry="7" fill="#8D5524" />
          <circle cx="110" cy="80" r="8" fill="#CC5500" />
          <circle cx="120" cy="80" r="7" fill="#2E7D32" />

          {/* Fresh Oranges on Right */}
          <ellipse cx="265" cy="86" rx="20" ry="7" fill="#8D5524" />
          <circle cx="260" cy="80" r="7.5" fill="#FFA726" />
          <circle cx="270" cy="80" r="7" fill="#FB8C00" />

          {/* Warm Floating Heart Sparkles */}
          <g opacity="0.85">
            <circle cx="150" cy="30" r="4" fill="#FFC107" />
            <circle cx="230" cy="28" r="3.5" fill="#FFC107" />
            <path d="M190 12 C188 8, 184 8, 182 11 C180 14, 185 18, 190 21 C195 18, 200 14, 198 11 C196 8, 192 8, 190 12 Z" fill="#CC5500" />
          </g>
        </svg>
      </div>

      {/* Impact Story Card */}
      <div className="clay-card p-6 sm:p-8 bg-white/95 border-2 border-burntOrange/30 shadow-2xl backdrop-blur-md w-full">
        {/* Verification Pill */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Community Impact Verified</span>
        </div>

        {/* Headline required by user */}
        <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-chocolate tracking-tight">
          One small act. One more meal.
        </h3>

        {/* Supporting text required by user */}
        <p className="mt-2 text-sm sm:text-base text-chocolate/80 max-w-md mx-auto leading-relaxed">
          Together, we can make sure good food reaches someone who needs it.
        </p>

        {/* Primary CTA required by user: "Join the Food Link Community" */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Heart className="w-4 h-4 fill-white/20" />}
              className="w-full sm:w-auto text-sm px-6 py-3"
            >
              Join the Food Link Community
            </Button>
          </Link>
          <Link to="/explore">
            <Button
              variant="outline"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto text-sm px-5 py-3"
            >
              Explore Available Food
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
