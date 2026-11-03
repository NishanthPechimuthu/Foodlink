import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Heart, LogIn, User, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react';
import Logo from '../common/Logo';
import Button from '../common/Button';
import NotificationBell from '../notifications/NotificationBell';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout, getDashboardPath } = useAuth();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Track window scroll for sticky visual elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Explore Food', path: '/explore' },
    { label: 'Impact', path: '/impact' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'About', path: '/about' },
  ];

  const dashboardPath = getDashboardPath(user?.role);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-cream/95 backdrop-blur-md shadow-sm border-b border-chocolate/10 py-3'
          : 'bg-cream/80 backdrop-blur-sm border-b border-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Logo size="md" showTagline={false} />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-3 bg-white/70 px-4 py-1.5 rounded-full border border-chocolate/10 shadow-sm backdrop-blur-md">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-full text-sm font-heading font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-burntOrange text-white shadow-sm'
                    : 'text-chocolate/80 hover:text-chocolate hover:bg-chocolate/5'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link to={dashboardPath}>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-chocolate/15 shadow-sm hover:border-burntOrange transition-all cursor-pointer">
                  <div className="w-7 h-7 rounded-lg bg-burntOrange/10 text-burntOrange flex items-center justify-center font-bold text-xs font-heading">
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold font-heading text-chocolate leading-tight truncate max-w-[120px]">
                      {user?.fullName?.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-chocolate/60 font-semibold leading-tight">
                      {user?.role}
                    </span>
                  </div>
                </div>
              </Link>
              <Link to={dashboardPath}>
                <Button variant="primary" size="sm" leftIcon={<LayoutDashboard className="w-3.5 h-3.5" />}>
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
                className="text-chocolate/70 hover:text-softRed"
                title="Sign Out"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm" leftIcon={<LogIn className="w-4 h-4" />}>
                  Login
                </Button>
              </Link>
              <Link to="/register?role=donor">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Heart className="w-4 h-4 fill-white/20" />}
                >
                  Share Food
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Hamburger Button */}
        <div className="md:hidden flex items-center gap-2">
          {isAuthenticated && <NotificationBell />}
          {isAuthenticated ? (
            <Link to={dashboardPath} className="p-2 text-burntOrange font-bold text-xs flex items-center gap-1">
              <LayoutDashboard className="w-5 h-5" />
            </Link>
          ) : (
            <Link to="/login" className="p-2 text-chocolate hover:text-burntOrange">
              <LogIn className="w-5 h-5" />
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="p-2 rounded-xl bg-white border border-chocolate/10 text-chocolate hover:bg-cream-200 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-cream border-b border-chocolate/10 shadow-lg"
          >
            <div className="px-5 pt-3 pb-6 space-y-3">
              <div className="flex flex-col space-y-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.path === '/'}
                    className={({ isActive }) =>
                      `px-4 py-2.5 rounded-xl text-base font-heading font-semibold transition-colors ${
                        isActive
                          ? 'bg-burntOrange text-white'
                          : 'text-chocolate hover:bg-white/80'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>

              <div className="pt-3 border-t border-chocolate/10 flex flex-col gap-2.5">
                {isAuthenticated ? (
                  <>
                    <div className="p-3 rounded-xl bg-white border border-chocolate/10 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold font-heading text-chocolate">
                          {user?.fullName}
                        </p>
                        <p className="text-xs text-chocolate/60">
                          {user?.role} • {user?.email}
                        </p>
                      </div>
                    </div>
                    <Link to={dashboardPath} className="w-full">
                      <Button variant="primary" size="md" className="w-full justify-center" leftIcon={<LayoutDashboard className="w-4 h-4" />}>
                        Go to Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={logout}
                      className="w-full justify-center text-softRed border-softRed/30 hover:bg-softRed/10"
                      leftIcon={<LogOut className="w-4 h-4" />}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="w-full">
                      <Button variant="outline" size="md" className="w-full justify-center">
                        Login to Account
                      </Button>
                    </Link>
                    <Link to="/register" className="w-full">
                      <Button variant="primary" size="md" className="w-full justify-center" leftIcon={<Heart className="w-4 h-4" />}>
                        Join Food Link
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
