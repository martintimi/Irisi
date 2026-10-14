'use client';

import React, { useEffect, useRef } from 'react';

interface Dot {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  baseOpacity: number;
  currentOpacity: number;
  scale: number;
  targetScale: number;
  phase: number;
  phaseSpeed: number;
}

// Sophisticated monochromatic luxury grey palette (delicate, barely-there tones)
const GREY_PALETTE = [
  '#94A3B8', // Slate grey
  '#A1A1AA', // Neutral zinc
  '#CBD5E1', // Whispering light grey
  '#71717A', // Muted stone
];

export default function AntigravityDotField({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let dots: Dot[] = [];
    let width = 0;
    let height = 0;

    const initDots = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      dots = [];

      // Grid spacing for a clean, sophisticated, architectural dot matrix
      const spacingX = Math.max(34, width / 36);
      const spacingY = Math.max(34, height / 24);

      for (let x = spacingX * 0.5; x < width; x += spacingX) {
        for (let y = spacingY * 0.5; y < height; y += spacingY) {
          // Subtle organic offset so it feels alive rather than sterile
          const jitterX = (Math.random() - 0.5) * 8;
          const jitterY = (Math.random() - 0.5) * 8;

          const baseX = x + jitterX;
          const baseY = y + jitterY;

          // Subtle grey tone
          const color = GREY_PALETTE[Math.floor(Math.random() * GREY_PALETTE.length)];

          // Delicate micro-dot radius (1.2px to 2.0px)
          const radius = 1.3 + Math.random() * 0.7;

          // "Barely show" base opacity: 0.08 to 0.16
          const baseOpacity = 0.09 + Math.random() * 0.08;

          dots.push({
            baseX,
            baseY,
            x: baseX,
            y: baseY,
            vx: 0,
            vy: 0,
            radius,
            color,
            baseOpacity,
            currentOpacity: baseOpacity,
            scale: 1,
            targetScale: 1,
            phase: Math.random() * Math.PI * 2,
            phaseSpeed: 0.001 + Math.random() * 0.0012,
          });
        }
      }
    };

    initDots();

    const resizeObserver = new ResizeObserver(() => {
      initDots();
    });
    resizeObserver.observe(container);

    const handlePointerMove = (e: MouseEvent | Touch) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const onMouseMove = (e: MouseEvent) => handlePointerMove(e);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handlePointerMove(e.touches[0]);
    };

    const onPointerLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave);

    // Physics parameters for subtle avatar follower reaction
    const INTERACTION_RADIUS = 160;
    const SPRING_STIFFNESS = 0.08;
    const DAMPING = 0.84;

    let startTime = performance.now();

    const render = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // 1. Subtle, gentle idle wave
        const idleWave = Math.sin(elapsed * dot.phaseSpeed + dot.phase);
        const idleCos = Math.cos(elapsed * dot.phaseSpeed * 0.8 + dot.phase);
        const idleX = dot.baseX + idleWave * 2;
        const idleY = dot.baseY + idleCos * 1.6;

        let targetX = idleX;
        let targetY = idleY;
        let targetOpacity = dot.baseOpacity;
        let targetScale = 1.0;

        // 2. Avatar reaction / Magnetic cursor follow
        if (mouse.active) {
          const dx = mouse.x - dot.x;
          const dy = mouse.y - dot.y;
          const dist = Math.hypot(dx, dy);

          if (dist < INTERACTION_RADIUS) {
            const ratio = 1 - dist / INTERACTION_RADIUS;
            const force = ratio * ratio * (3 - 2 * ratio);

            // Subtle magnetic pull towards the cursor ("follow me")
            const maxPull = 26;
            const angleToMouse = Math.atan2(dy, dx);
            targetX = idleX + Math.cos(angleToMouse) * force * maxPull;
            targetY = idleY + Math.sin(angleToMouse) * force * maxPull;

            // Subtle pop: scales up gently
            targetScale = 1.0 + force * 0.55;

            // Subtle opacity increase from ~0.12 up to ~0.38 (understated grey)
            targetOpacity = dot.baseOpacity + force * (0.38 - dot.baseOpacity);
          }
        }

        // 3. Spring physics integration
        const ax = (targetX - dot.x) * SPRING_STIFFNESS;
        const ay = (targetY - dot.y) * SPRING_STIFFNESS;

        dot.vx = (dot.vx + ax) * DAMPING;
        dot.vy = (dot.vy + ay) * DAMPING;

        dot.x += dot.vx;
        dot.y += dot.vy;

        dot.currentOpacity += (targetOpacity - dot.currentOpacity) * 0.14;
        dot.scale += (targetScale - dot.scale) * 0.16;

        // 4. Draw delicate circular grey dot
        ctx.save();
        ctx.translate(dot.x, dot.y);
        ctx.scale(dot.scale, dot.scale);

        ctx.globalAlpha = Math.max(0, Math.min(1, dot.currentOpacity));
        ctx.fillStyle = dot.color;

        ctx.beginPath();
        ctx.arc(0, 0, dot.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('mouseleave', onPointerLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

