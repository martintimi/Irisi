'use client';

import React from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export default function KineticMarquee() {
  const { scrollYProgress } = useScroll();
  
  const smoothScroll = useSpring(scrollYProgress, { damping: 25, stiffness: 100 });
  const x1 = useTransform(smoothScroll, [0, 1], ['0%', '-30%']);
  const x2 = useTransform(smoothScroll, [0, 1], ['-30%', '0%']);

  const row1 = [
    'BESPOKE NIGERIAN TAILORING',
    'VERIFIED INDEPENDENT BRANDS',
    'SENATOR & NATIVE SETS',
    'HAND-DYED ADIRE SILK',
    'CONTEMPORARY NIGERIAN STREETWEAR',
    'HANDCRAFTED NIGERIAN LEATHER'
  ];

  const row2 = [
    '100% ESCROW PROTECTED',
    'DOORSTEP & HUB DELIVERY',
    'VERIFIED ATELIER QUALITY',
    'AUTOMATED ESCROW SETTLEMENTS',
    'DIRECT WORKSHOP DISPATCH',
    'DIRECT COURIER DISPATCH'
  ];

  return (
    <div className="py-12 border-y border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden space-y-4 select-none">
      
      {/* Row 1: Leftward Parallax */}
      <motion.div style={{ x: x1 }} className="flex whitespace-nowrap gap-8 items-center text-[var(--text-primary)]">
        {[...row1, ...row1, ...row1].map((item, idx) => (
          <div key={idx} className="flex items-center gap-6">
            <span className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight uppercase">
              {item}
            </span>
            <span className="text-[var(--gold-accent)] text-xl">✦</span>
          </div>
        ))}
      </motion.div>

      {/* Row 2: Rightward Parallax with Serif Outline */}
      <motion.div style={{ x: x2 }} className="flex whitespace-nowrap gap-8 items-center text-[var(--gold-accent)]">
        {[...row2, ...row2, ...row2].map((item, idx) => (
          <div key={idx} className="flex items-center gap-6">
            <span className="font-mono-luxury text-sm sm:text-base font-bold uppercase tracking-[0.25em] opacity-80">
              {item}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]" />
          </div>
        ))}
      </motion.div>

    </div>
  );
}
