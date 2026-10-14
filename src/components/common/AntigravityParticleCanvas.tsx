'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  size: number;
  length: number;
  angle: number;
  color: string;
  alpha: number;
}

export default function AntigravityParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // High DPI scaling
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Antigravity & Nigerian Luxury Palette (from reference screenshot)
    const colors = [
      '#F43F5E', // Warm Coral
      '#FB923C', // Sunburst Orange
      '#FBBF24', // Amber Gold
      '#D4AF37', // 24K Luxury Gold
      '#818CF8', // Soft Indigo
      '#A78BFA', // Violet
      '#38BDF8', // Cyan
      '#1E293B', // Deep Slate
    ];

    const particles: Particle[] = [];
    const numParticles = Math.min(Math.floor((width * height) / 4800), 280);

    // Arrange particles in an expansive, organic spiral/orbital field (like Google Antigravity)
    const centerX = width * 0.55;
    const centerY = height * 0.45;

    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * Math.PI * 14;
      const radius = 40 + Math.pow(i / numParticles, 0.75) * (Math.max(width, height) * 0.65);
      const scatter = (Math.random() - 0.5) * 45;

      const homeX = centerX + Math.cos(angle) * (radius + scatter);
      const homeY = centerY + Math.sin(angle) * (radius + scatter);

      particles.push({
        x: homeX,
        y: homeY,
        homeX,
        homeY,
        vx: 0,
        vy: 0,
        size: 2.2 + Math.random() * 2.0,
        length: 3.5 + Math.random() * 5.0,
        angle: angle + Math.PI / 2 + (Math.random() - 0.5) * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.35 + Math.random() * 0.45,
      });
    }

    // Mouse Tracking
    const mouse = {
      x: -9999,
      y: -9999,
      prevX: -9999,
      prevY: -9999,
      vx: 0,
      vy: 0,
      radius: 140, // Interaction zone
      isHovered: false,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      mouse.vx = currentX - mouse.prevX;
      mouse.vy = currentY - mouse.prevY;
      mouse.prevX = mouse.x = currentX;
      mouse.prevY = mouse.y = currentY;
      mouse.isHovered = true;
    };

    const handleMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
      mouse.isHovered = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop with Spring Physics
    let time = 0;
    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 1. Mouse Interaction (Repulsion / Follow dynamic)
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius && mouse.isHovered) {
          const force = (1 - dist / mouse.radius);
          // Push away from cursor with kinetic burst
          const pushX = (dx / dist) * -force * 22;
          const pushY = (dy / dist) * -force * 22;

          p.vx += pushX;
          p.vy += pushY;

          // Drag along with cursor velocity
          p.vx += mouse.vx * 0.04;
          p.vy += mouse.vy * 0.04;
        }

        // 2. Idle Organic Floating Drift
        const idleX = Math.sin(time + i * 0.3) * 0.6;
        const idleY = Math.cos(time + i * 0.25) * 0.6;

        // 3. Spring Return to Home Position
        const homeDx = p.homeX + idleX - p.x;
        const homeDy = p.homeY + idleY - p.y;

        p.vx += homeDx * 0.045; // Spring stiffness
        p.vy += homeDy * 0.045;

        // 4. Damping / Friction
        p.vx *= 0.84;
        p.vy *= 0.84;

        p.x += p.vx;
        p.y += p.vy;

        // 5. Render Capsule / Dash Dot (Antigravity Style)
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;

        // Rounded pill dash
        ctx.beginPath();
        const w = p.size;
        const h = p.length;
        ctx.roundRect(-w / 2, -h / 2, w, h, w / 2);
        ctx.fill();

        ctx.restore();
      }

      // Smooth mouse velocity decay
      mouse.vx *= 0.8;
      mouse.vy *= 0.8;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 w-full h-full"
      style={{ opacity: 0.85 }}
    />
  );
}
