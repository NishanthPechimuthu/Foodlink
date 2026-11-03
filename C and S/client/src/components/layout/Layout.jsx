import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollToTop from '../common/ScrollToTop';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-chocolate selection:bg-burntOrange/20 selection:text-burntOrange-600">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
