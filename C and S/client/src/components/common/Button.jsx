import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  leftIcon = null,
  rightIcon = null,
  ...props
}) {
  const sizeStyles = {
    sm: 'px-3.5 py-1.5 text-xs font-semibold gap-1.5 rounded-lg',
    md: 'px-5 py-2.5 text-sm font-semibold gap-2 rounded-xl',
    lg: 'px-7 py-3.5 text-base font-bold gap-2.5 rounded-xl',
  };

  const variantStyles = {
    // 15% Subtle Claymorphism on Primary CTA
    primary:
      'bg-burntOrange text-white shadow-clay-btn hover:shadow-clay-btn-hover active:translate-y-0.5 active:scale-[0.98] border border-burntOrange-600/30',
    // 85% Solid Modern UI
    secondary:
      'bg-chocolate text-white hover:bg-chocolate-600 active:translate-y-0.5 active:scale-[0.98] shadow-sm',
    outline:
      'bg-transparent text-chocolate border-2 border-chocolate/20 hover:border-chocolate hover:bg-chocolate/5 active:scale-[0.98]',
    outlineOrange:
      'bg-transparent text-burntOrange border-2 border-burntOrange/30 hover:border-burntOrange hover:bg-burntOrange/5 active:scale-[0.98]',
    ghost:
      'bg-transparent text-chocolate/80 hover:text-chocolate hover:bg-chocolate/10 active:scale-[0.98]',
    danger:
      'bg-softRed text-white hover:bg-softRed-dark active:scale-[0.98] shadow-sm',
    cream:
      'bg-cream-100 text-chocolate border border-chocolate/15 hover:bg-cream-200 active:scale-[0.98]',
  };

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={!disabled && !loading ? { y: -2 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98, y: 0 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`inline-flex items-center justify-center font-heading transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
}
