'use client';

import React, { useEffect } from 'react';

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let lenis: any = null;

    const initLenis = async () => {
      try {
        const Lenis = (await import('lenis')).default;
        lenis = new Lenis({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          touchMultiplier: 1.5,
          prevent: (node: HTMLElement) => {
            if (!node) return false;
            let el: HTMLElement | null = node;
            while (el && el !== document.body && el !== document.documentElement) {
              if (
                el.hasAttribute?.('data-lenis-prevent') ||
                el.getAttribute?.('role') === 'dialog'
              ) {
                return true;
              }
              const style = window.getComputedStyle(el);
              const overflowY = style.overflowY;
              if (
                (overflowY === 'auto' || overflowY === 'scroll') &&
                el.scrollHeight > el.clientHeight
              ) {
                return true;
              }
              el = el.parentElement;
            }
            return false;
          },
        });

        function raf(time: number) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);
      } catch (e) {
        // Fallback to standard smooth scrolling if lenis is compiling
        console.log('Lenis initializing...');
      }
    };

    initLenis();

    return () => {
      if (lenis) {
        lenis.destroy();
      }
    };
  }, []);

  return <>{children}</>;
}
