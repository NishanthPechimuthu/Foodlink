import React from 'react';
import { motion } from 'motion/react';
import { TomatoIcon, AppleIcon, BasketIcon } from './FoodIcons';

export default function FoodLoader({
  size = 'md',
  message = 'Preparing something fresh...',
  fullScreen = false,
  className = '',
}) {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  if (isSmall) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <motion.div
          animate={{ rotate: 360, x: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        >
          <TomatoIcon className="w-4 h-4" />
        </motion.div>
        {message && <span className="text-xs font-semibold text-chocolate/80">{message}</span>}
      </div>
    );
  }

  const containerContent = (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Rolling track */}
      <div className="relative w-64 h-24 flex items-center justify-between px-4 overflow-hidden">
        {/* Track floor line */}
        <div className="absolute bottom-4 left-4 right-16 h-1 bg-chocolate/10 rounded-full" />

        {/* Lead Tomato Rolling */}
        <motion.div
          className="absolute bottom-4 left-2 z-10"
          animate={{
            x: [0, 160],
            y: [0, -4, 0, -2, 0, 12],
            rotate: [0, 720],
            opacity: [1, 1, 1, 1, 0.9, 0],
            scale: [1, 1, 1, 1, 0.9, 0.6],
          }}
          transition={{
            repeat: Infinity,
            duration: 2.2,
            times: [0, 0.7, 0.75, 0.82, 0.9, 1],
            ease: 'easeInOut',
          }}
        >
          <TomatoIcon className={isLarge ? 'w-10 h-10' : 'w-8 h-8'} />
        </motion.div>

        {/* Following Apple */}
        <motion.div
          className="absolute bottom-4 left-2 z-10"
          animate={{
            x: [-40, 160],
            y: [0, -3, 0, -2, 0, 12],
            rotate: [0, 600],
            opacity: [0, 1, 1, 1, 0.8, 0],
            scale: [0.8, 1, 1, 1, 0.8, 0.5],
          }}
          transition={{
            repeat: Infinity,
            duration: 2.2,
            delay: 0.35,
            times: [0, 0.7, 0.75, 0.82, 0.9, 1],
            ease: 'easeInOut',
          }}
        >
          <AppleIcon className={isLarge ? 'w-8 h-8' : 'w-6 h-6'} />
        </motion.div>

        {/* Target Donation Basket */}
        <motion.div
          className="absolute right-3 bottom-1.5 z-20"
          animate={{
            scale: [1, 1, 1.15, 0.95, 1],
            y: [0, 0, -2, 2, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 2.2,
            times: [0, 0.7, 0.85, 0.92, 1],
            ease: 'easeInOut',
          }}
        >
          <BasketIcon className={isLarge ? 'w-16 h-16' : 'w-12 h-12'} filled={true} />
        </motion.div>
      </div>

      {/* Message */}
      {message && (
        <motion.p
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className={`mt-2 font-heading font-semibold text-chocolate/80 text-center ${
            isLarge ? 'text-base sm:text-lg' : 'text-sm'
          }`}
        >
          {message}
        </motion.p>
      )}

      {/* Subtle loader indicator dots */}
      <div className="flex items-center gap-1.5 mt-2">
        <span className="w-1.5 h-1.5 rounded-full bg-burntOrange animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-burntOrange animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-burntOrange animate-bounce" />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream/95 backdrop-blur-md">
        {containerContent}
      </div>
    );
  }

  return containerContent;
}
