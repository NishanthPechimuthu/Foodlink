import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShieldCheck, Mail, MapPin, ExternalLink } from 'lucide-react';
import Logo from '../common/Logo';

export default function Footer() {
  return (
    <footer className="bg-chocolate text-cream-100 pt-16 pb-12 border-t-4 border-burntOrange">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-cream/10">
          {/* Column 1: Brand & Mission (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="inline-block bg-cream-50 p-2 rounded-2xl">
              <Logo size="md" showTagline={false} />
            </div>

            <p className="text-sm text-cream/75 leading-relaxed max-w-sm">
              <strong className="text-cream">Good food deserves another chance.</strong> Food Link is a community-driven surplus food rescue platform connecting restaurants, grocery stores, and households with local shelters and NGOs.
            </p>

            <div className="pt-2 flex items-center gap-3 text-xs text-cream/60">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream/10 border border-cream/15 text-cream/90">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Community Network
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-burntOrange-200 mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm text-cream/75">
              <li>
                <Link to="/" className="hover:text-burntOrange-300 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-burntOrange-300 transition-colors">
                  Available Food
                </Link>
              </li>
              <li>
                <Link to="/impact" className="hover:text-burntOrange-300 transition-colors">
                  Live Impact & Transparency
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-burntOrange-300 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-burntOrange-300 transition-colors">
                  About Our Mission
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Roles & Participation */}
          <div>
            <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-burntOrange-200 mb-4">
              Get Involved
            </h4>
            <ul className="space-y-2.5 text-sm text-cream/75">
              <li>
                <Link to="/register?role=donor" className="hover:text-burntOrange-300 transition-colors flex items-center gap-1">
                  <span>Donate as Business</span>
                </Link>
              </li>
              <li>
                <Link to="/register?role=donor" className="hover:text-burntOrange-300 transition-colors">
                  Donate as Household
                </Link>
              </li>
              <li>
                <Link to="/register?role=receiver" className="hover:text-burntOrange-300 transition-colors">
                  Register as NGO / Shelter
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-burntOrange-300 transition-colors">
                  Food Safety Guidelines
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Community & Trust */}
          <div>
            <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-burntOrange-200 mb-4">
              Community & Safety
            </h4>
            <ul className="space-y-2.5 text-sm text-cream/75">
              <li>
                <span className="text-cream/90 font-medium">Community Guidelines</span>
              </li>
              <li>
                <span className="text-cream/90 font-medium">Food Safety Protocols</span>
              </li>
              <li>
                <span className="text-cream/90 font-medium">Privacy Policy</span>
              </li>
              <li>
                <span className="text-cream/90 font-medium">Terms of Service</span>
              </li>
            </ul>

            <div className="mt-4 pt-3 border-t border-cream/10 text-xs text-cream/60">
              <p>Platform Support:</p>
              <p className="text-cream/80 font-mono text-[11px] mt-0.5">community@foodlink.org</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-cream/60 gap-4">
          <p>© 2026 Food Link Platform. Good food deserves another chance.</p>
          <div className="flex items-center gap-6">
            <span>Non-profit Community Initiative</span>
            <span>Zero Food Waste</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
