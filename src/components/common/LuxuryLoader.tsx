'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

interface LuxuryLoaderProps {
  fullScreen?: boolean;
  label?: string;
  sublabel?: string;
  autoHideMs?: number;
}

export default function LuxuryLoader({
  fullScreen = true,
  autoHideMs,
}: LuxuryLoaderProps) {
  const pathname = usePathname();
  // If fullScreen (app splash screen), default to auto-hiding after 850ms
  const effectiveAutoHide = autoHideMs !== undefined ? autoHideMs : (fullScreen ? 850 : undefined);
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (!effectiveAutoHide) return;

    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, Math.max(100, effectiveAutoHide - 250));

    const removeTimer = setTimeout(() => {
      setVisible(false);
    }, effectiveAutoHide);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [effectiveAutoHide]);

  if (!visible || pathname?.startsWith('/reel')) return null;

  // Couture Floating Pearl / Liquid Fashion Bubbles
  const bubbles = [
    { size: 10, delay: 0, bounceY: -14, duration: 1.15 },
    { size: 18, delay: 0.16, bounceY: -20, duration: 1.15 },
    { size: 24, delay: 0.32, bounceY: -24, duration: 1.15 },
    { size: 16, delay: 0.48, bounceY: -18, duration: 1.15 },
    { size: 10, delay: 0.64, bounceY: -12, duration: 1.15 },
  ];

  // Effervescent Floating Micro-Bubbles (Champagne / Fragrance ambiance)
  const floatingParticles = [
    { x: -32, y: -16, delay: 0.1, size: 4, duration: 2.2 },
    { x: 28, y: -22, delay: 0.5, size: 5, duration: 2.6 },
    { x: -16, y: -32, delay: 0.9, size: 3.5, duration: 2.0 },
    { x: 14, y: -28, delay: 1.3, size: 4.5, duration: 2.4 },
    { x: -6, y: -40, delay: 1.7, size: 3, duration: 2.1 },
  ];

  const content = (
    <div className="relative flex flex-col items-center justify-center select-none py-8">
      {/* Soft Ambient Couture Glow Aura */}
      <div className="absolute w-36 h-36 rounded-full bg-[var(--gold-accent)]/15 blur-2xl pointer-events-none animate-pulse" />

      {/* Floating Effervescent Micro-Bubbles */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {floatingParticles.map((p, i) => (
          <motion.div
            key={`particle-${i}`}
            animate={{
              y: [0, p.y - 18, p.y - 42],
              x: [p.x, p.x + (i % 2 === 0 ? 5 : -5), p.x],
              opacity: [0, 0.75, 0],
              scale: [0.5, 1.2, 0.3],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: 'easeOut',
              delay: p.delay,
            }}
            style={{ width: p.size, height: p.size }}
            className="absolute rounded-full bg-gradient-to-tr from-[var(--gold-accent)] to-white shadow-sm shadow-[var(--gold-accent)]/40"
          >
            <div className="absolute top-[1px] left-[1px] w-[1.5px] h-[1.5px] rounded-full bg-white" />
          </motion.div>
        ))}
      </div>

      {/* Main Rhythmic Fashion Bubbles Row */}
      <div className="flex items-center gap-2 sm:gap-3 relative z-10 py-4">
        {bubbles.map((b, index) => (
          <motion.div
            key={index}
            animate={{
              y: [0, b.bounceY, 0],
              scale: [1, 1.15, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: b.duration,
              repeat: Infinity,
              ease: [0.33, 1, 0.68, 1],
              delay: b.delay,
            }}
            style={{ width: b.size, height: b.size }}
            className="relative rounded-full bg-gradient-to-tr from-[#b88924] via-[var(--gold-accent)] to-amber-100 shadow-lg shadow-[var(--gold-accent)]/30 border border-white/50 backdrop-blur-md flex items-center justify-center"
          >
            {/* Glossy Spherical Specular Reflection Highlight */}
            <div className="absolute top-[16%] left-[20%] w-[32%] h-[32%] rounded-full bg-white/90 blur-[0.3px]" />
          </motion.div>
        ))}
      </div>

      {/* Delicate Breathing Light Ripple Beneath */}
      <motion.div
        animate={{
          scale: [0.8, 1.35, 0.8],
          opacity: [0.35, 0.1, 0.35],
        }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-24 h-2 rounded-full bg-gradient-to-r from-transparent via-[var(--gold-accent)]/35 to-transparent blur-[2px]"
      />
    </div>
  );

  if (!fullScreen) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-8 transition-opacity duration-300">
        {content}
      </div>
    );
  }

  return (
    <div
      style={{ animation: 'irisiSplashAutoHide 0.35s ease 0.9s forwards' }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--bg-primary)] transition-opacity duration-300 pointer-events-none ${fadingOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes irisiSplashAutoHide {
          0% { opacity: 1; visibility: visible; }
          100% { opacity: 0; visibility: hidden; pointer-events: none; }
        }
        @keyframes irisiBubblePulse {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.75; }
          50% { transform: translateY(-16px) scale(1.12); opacity: 1; }
        }
      `}} />
      {content}
    </div>
  );
}
