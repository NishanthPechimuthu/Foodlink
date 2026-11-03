import React from 'react';
import { motion } from 'motion/react';

export default function SectionHeading({
  badge,
  title,
  highlight,
  description,
  align = 'center',
  className = '',
}) {
  const isCenter = align === 'center';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`max-w-3xl mb-12 md:mb-16 ${isCenter ? 'mx-auto text-center' : 'text-left'} ${className}`}
    >
      {badge && (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-burntOrange/10 text-burntOrange border border-burntOrange/20 mb-3.5 shadow-sm">
          {badge}
        </span>
      )}

      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-chocolate tracking-tight leading-tight">
        {title}{' '}
        {highlight && (
          <span className="text-burntOrange underline decoration-burntOrange/30 decoration-wavy underline-offset-8">
            {highlight}
          </span>
        )}
      </h2>

      {description && (
        <p className="mt-4 text-base sm:text-lg text-chocolate/75 font-normal leading-relaxed">
          {description}
        </p>
      )}
    </motion.div>
  );
}
