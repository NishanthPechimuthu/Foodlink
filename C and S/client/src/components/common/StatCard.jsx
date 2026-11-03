import React from 'react';
import { motion } from 'motion/react';

export default function StatCard({
  icon: Icon,
  value,
  label,
  subtitle,
  isDemo = false,
  className = '',
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`clay-card p-6 sm:p-7 relative overflow-hidden bg-white/90 backdrop-blur-sm group border border-chocolate/10 ${className}`}
    >
      {/* Background accent glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-burntOrange/5 rounded-full blur-2xl group-hover:bg-burntOrange/10 transition-colors pointer-events-none" />

      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-2xl bg-cream-200/80 border border-chocolate/10 flex items-center justify-center text-burntOrange group-hover:scale-110 transition-transform duration-200 shadow-sm">
          {Icon && <Icon className="w-6 h-6 stroke-[2.2]" />}
        </div>
        {isDemo && (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amberPending-light text-amberPending-dark border border-amberPending/20">
            Preview Target
          </span>
        )}
      </div>

      <div className="mt-5">
        <div className="text-3xl sm:text-4xl font-extrabold font-heading text-chocolate tracking-tight">
          {value}
        </div>
        <div className="mt-1 text-sm sm:text-base font-bold text-chocolate/90 font-heading">
          {label}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-chocolate/60">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}
