'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Truck, PackageCheck, CheckCircle2, Sparkles, ShieldCheck,
  Store, CreditCard, SearchCheck, ArrowUpRight
} from 'lucide-react';

// ============================================================================
// SYNTHETIC WEB AUDIO ENGINE (WHOOSHES & POPS)
// ============================================================================
function useMotionSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return null;
    if (!ctxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) ctxRef.current = new AudioCtx();
    }
    if (ctxRef.current && ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, [enabled]);

  const playPop = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.055);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.065);
    } catch {}
  }, [getCtx]);

  const playWhip = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(340, ctx.currentTime + 0.11);
      osc.frequency.exponentialRampToValueAtTime(75, ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.26);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch {}
  }, [getCtx]);

  return { playPop, playWhip };
}

// ============================================================================
// SIGNATURE DOTTED GRID + ROTATING DASHED CORNER ARCS + SOFT GLOW
// ============================================================================
function DanushkBackdrop({ beat }: { beat: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#F6F5F0]">
      {/* Softened Architectural Dot Grid — very subtle so it never clashes with text */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: 'radial-gradient(#a89f91 1.1px, transparent 1.1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Pure Luxury Center Stage Clear Field — ensures 100% text contrast and readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(246, 245, 240, 0.98) 20%, rgba(246, 245, 240, 0.82) 65%, transparent 100%)',
        }}
      />

      {/* Soft Radial Champagne Glow in Center */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#c4972e]/10 blur-[100px] will-change-transform"
      />

      {/* Soft Radial Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 55%, rgba(232, 227, 217, 0.45) 100%)',
        }}
      />

      {/* Top-Left Animated Dashed Orbit Curve — GPU hardware-accelerated CSS transform */}
      <div
        style={{
          transform: `translate3d(${beat % 2 === 0 ? '-15px' : '15px'}, ${beat % 2 === 0 ? '-10px' : '15px'}, 0) rotate(${beat * 35}deg)`,
          transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="absolute -top-64 -left-64 w-[540px] h-[540px] rounded-full border-[2.5px] border-dashed border-zinc-300/40 will-change-transform"
      />

      {/* Bottom-Right Animated Dashed Orbit Curve — GPU hardware-accelerated CSS transform */}
      <div
        style={{
          transform: `translate3d(${beat % 2 === 0 ? '15px' : '-15px'}, ${beat % 2 === 0 ? '15px' : '-10px'}, 0) rotate(${-beat * 40}deg)`,
          transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="absolute -bottom-64 -right-64 w-[560px] h-[560px] rounded-full border-[2.5px] border-dashed border-[#c4972e]/30 will-change-transform"
      />

      {/* Subtle Floating Plus Accents */}
      <div className="absolute top-[16%] right-[18%] text-[#c4972e]/30 text-2xl font-light select-none">
        +
      </div>
      <div className="absolute bottom-[18%] left-[16%] text-zinc-300/40 text-2xl font-light select-none">
        +
      </div>
    </div>
  );
}

// ============================================================================
// GLOSSY 3D PILL COMPONENT
// ============================================================================
function Glossy3DPill({
  children,
  variant = 'dark',
  tilt = 0,
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'dark' | 'gold' | 'emerald';
  tilt?: number;
  className?: string;
}) {
  const styles = {
    dark: 'bg-gradient-to-b from-zinc-800 via-zinc-900 to-black text-white border-t-2 border-white/40 shadow-[0_26px_48px_rgba(0,0,0,0.28),inset_0_2px_6px_rgba(255,255,255,0.35)]',
    gold: 'bg-gradient-to-b from-[#d9ad42] via-[#c4972e] to-[#967015] text-white border-t-2 border-white/50 shadow-[0_26px_48px_rgba(196,151,46,0.35),inset_0_2px_6px_rgba(255,255,255,0.45)]',
    emerald:
      'bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-800 text-white border-t-2 border-white/45 shadow-[0_26px_48px_rgba(16,185,129,0.32),inset_0_2px_6px_rgba(255,255,255,0.4)]',
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 1, y: 8, rotate: tilt - 2 }}
      animate={{ scale: 1, opacity: 1, y: 0, rotate: tilt }}
      exit={{ scale: 0.85, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 230, damping: 18 }}
      className={`inline-flex items-center justify-center px-9 py-3.5 rounded-full ${styles[variant]} ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// CATEGORY TIMELINE DATA (SHOWS DEPARTMENT NAME ON LEFT OF HERO CARD!)
// ============================================================================
const SHOPPER_TREE_NODES = [
  {
    deptTitle: 'Native Wear',
    label: 'senator, agbada & silk boubou',
    tag: 'Native & Couture',
    sub: "Men's & Women's Bespoke Native Wear",
    imgA: '/images/uploaded/agbadaformen.jpeg',
    labelA: 'Grand Agbada',
    imgB: '/images/editorial/nigerian_female_couture.jpg',
    labelB: 'Silk Boubou',
  },
  {
    deptTitle: "Women's Wear",
    label: 'tops, corsets & evening dresses',
    tag: "Women's Apparel",
    sub: 'Sculpted Corsets · Two-Piece Sets · Gowns',
    imgA: '/images/uploaded/Streetwear&topsWomen.jpeg',
    labelA: 'Tops & Corset',
    imgB: '/images/categories/dressesforwomen.jpeg',
    labelB: 'Dresses & Gowns',
  },
  {
    deptTitle: 'Streetwear',
    label: "men's hoodies, graphic tees & cargos",
    tag: "Men's Streetwear",
    sub: 'Heavyweight Hoodies · Tees · Polos · Denim',
    imgA: '/images/uploaded/prod-1788316482065-1-489.jpg',
    labelA: 'Streetwear Hoodies',
    imgB: '/images/uploaded/t-shirtsandgraphic.jpeg',
    labelB: 'Graphic Tees',
  },
  {
    deptTitle: 'Hair & Wigs',
    label: 'bone straight & braided wigs',
    tag: 'Hair & Wigs Studio',
    sub: 'Raw Bone Straight · Braided & Curly Wigs',
    imgA: '/images/categories/bone_straight.jpg',
    labelA: 'Bone Straight',
    imgB: '/images/categories/braided_wigs.jpg',
    labelB: 'Braided Wigs',
  },
  {
    deptTitle: 'Footwear',
    label: 'sneakers, crocs, heels & slides',
    tag: 'Footwear',
    sub: 'Street Sneakers · Foam Crocs · Luxury Heels',
    imgA: '/images/uploaded/shoefootwareformen.jpeg',
    labelA: 'Street Sneakers',
    imgB: '/images/uploaded/crocsformen.jpeg',
    labelB: 'Crocs & Clogs',
  },
  {
    deptTitle: 'Bags & Luxury',
    label: 'bags, caps, jewelry & perfumes',
    tag: 'Bags & Accessories',
    sub: 'Leather Bags · Caps · Watches · Oud',
    imgA: '/images/uploaded/leaderBags.jpeg',
    labelA: 'Bags & Totes',
    imgB: '/images/uploaded/WomenJewelry.jpeg',
    labelB: 'Fine Jewelry',
  },
];

// ============================================================================
// MAIN KINETIC MOTION REEL FOR ÌRÍSÍ (38.5s BALANCED PACING · ZERO REPETITION)
// ============================================================================
export default function IrisiDanushkMotionReel() {
  const TOTAL_SEC = 38.5;
  const [sec, setSec] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(true);
  const [sound, setSound] = useState<boolean>(false);

  const lastPopRef = useRef<number>(-1);
  const { playPop, playWhip } = useMotionSound(sound);

  // Warm up category thumbnails in browser memory cache so category transitions never freeze/hang
  useEffect(() => {
    if (typeof window !== 'undefined') {
      SHOPPER_TREE_NODES.forEach((node) => {
        const a = new window.Image();
        a.src = node.imgA;
        const b = new window.Image();
        b.src = node.imgB;
      });
    }
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setSec((prev) => {
        const next = prev + 0.1;
        return next >= TOTAL_SEC ? 0 : Number(next.toFixed(1));
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    const tick = Math.floor(sec * 2);
    if (tick === lastPopRef.current) return;
    lastPopRef.current = tick;

    if ([0, 6, 12, 32, 47, 54, 68, 72].includes(tick)) playWhip();
    if ([2, 13, 16, 19, 22, 25, 28, 34, 39, 44, 55, 60, 65].includes(tick)) {
      playPop();
    }
  }, [sec, playPop, playWhip]);

  // Silent Keyboard Shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === 'r' || e.key === 'R') {
        setSec(0);
        setPlaying(true);
      } else if (e.key === 'm' || e.key === 'M') {
        setSound((s) => !s);
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.key === '1') setSec(0);
      else if (e.key === '2') setSec(6.2);
      else if (e.key === '3') setSec(15.8);
      else if (e.key === '4') setSec(23.3);
      else if (e.key === '5') setSec(34.0);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // 5 Non-Repetitive, Story-Driven Beats (38.5s Total):
  // Beat 1 (0.0 - 6.2s)  : Part A (0-3.1s) "are you tired of 'what I ordered' vs. 'what I got'?" -> Part B (3.1-6.2s) Clean Brand Reveal "That's where ÌRÍSÍ comes in." (NO cropped floating category cards!)
  // Beat 2 (6.2 - 15.8s) : Department Hero Card + 6-Node Category Tree (Shown ONCE! 1.6s per node)
  // Beat 3 (15.8 - 23.3s): Escrow Buyer Protection Card + 3-Node Tree (2.5s per step)
  // Beat 4 (23.3 - 34.0s): Part A (23.3-27.1s) Vendor Hook ("tired of sending pics of pieces every time a customer wants to shop?") -> Part B (27.1-34.0s) "That's where ÌRÍSÍ comes in" Vendor Storefront Card + 3-Node Solution Tree
  // Beat 5 (34.0 - 38.5s): Official ÌRÍSÍ Emblem Bar -> "shoppers & vendors / join the waitlist [irisimi.ng]"
  const beat =
    sec < 6.2
      ? 1
      : sec < 15.8
      ? 2
      : sec < 23.3
      ? 3
      : sec < 34.0
      ? 4
      : 5;

  // ============================================================================
  // BEAT 1 (0.0 - 6.2s): 100% CONTROLLABLE SHOPPER PAIN HOOK -> CLEAN BRAND REVEAL
  // ============================================================================
  const renderBeat1Hook = () => {
    const showSolution = sec >= 3.1;

    const topBubbles = [
      {
        emoji: '😩',
        text: '“Why is everything always ‘Check DM for price’?”',
        tailEmoji: '🙄',
        delay: 0.08,
      },
      {
        emoji: '💔',
        text: '“Paying into random accounts with zero protection”',
        tailEmoji: '🚫',
        delay: 0.2,
      },
    ];

    const bottomBubbles = [
      {
        emoji: '😤',
        text: '“Jumping across 10 pages just to find one full outfit”',
        tailEmoji: '😮‍💨',
        delay: 0.32,
      },
      {
        emoji: '🥺',
        text: '“I need outfits, wigs, shoes & bags in one place”',
        tailEmoji: '🛍️',
        delay: 0.44,
      },
    ];

    return (
      <motion.div
        key="beat1"
        initial={false}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -160 }}
        transition={{ type: 'spring', stiffness: 175, damping: 20 }}
        className="relative w-full h-full flex items-center justify-center px-3 sm:px-6"
      >
        <AnimatePresence mode="wait">
          {!showSolution ? (
            /* PART A (0.0 - 3.1s): 4-Corner Floating Chat Layout (Top-Left, Top-Right, Bottom-Left, Bottom-Right) */
            <motion.div
              key="hook-text"
              initial={false}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.05, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              className="relative w-full max-w-[355px] sm:max-w-[780px] flex flex-col items-center justify-center text-center"
            >
              {/* Top-Left & Top-Right Floating Chat Bubbles */}
              <div className="w-full grid grid-cols-2 items-start gap-2.5 sm:gap-6">
                {topBubbles.map((b, idx) => (
                  <motion.div
                    key={b.text}
                    initial={false}
                    animate={{ opacity: 1, scale: 1, y: [0, -3.5, 0] }}
                    transition={{
                      y: { delay: b.delay + 0.3, duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-2 sm:px-3.5 sm:py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-zinc-200/90 shadow-[0_10px_24px_rgba(0,0,0,0.06)] text-[9.5px] sm:text-xs text-zinc-700 font-light leading-tight text-left max-w-full ${
                      idx === 0
                        ? 'justify-self-start -translate-y-1.5 sm:-translate-y-2.5'
                        : 'justify-self-end translate-y-2.5 sm:translate-y-3'
                    }`}
                  >
                    <span className="text-xs sm:text-base leading-none shrink-0">{b.emoji}</span>
                    <span className="whitespace-normal">{b.text}</span>
                    <span className="text-xs sm:text-sm leading-none shrink-0">{b.tailEmoji}</span>
                  </motion.div>
                ))}
              </div>

              {/* Center Hook Lockup */}
              <div className="flex flex-col items-center my-6 sm:my-8">
                <motion.span
                  initial={false}
                  animate={{ y: 0, opacity: 1 }}
                  className="font-editorial text-xl sm:text-4xl text-zinc-700 tracking-tight mb-1"
                >
                  are you tired of
                </motion.span>

                <Glossy3DPill variant="dark" className="px-5 py-1.5 sm:px-7 sm:py-2">
                  <span className="font-editorial italic text-2xl sm:text-4xl md:text-5xl tracking-tight px-1">
                    &ldquo;DM for price&rdquo;
                  </span>
                </Glossy3DPill>

                <motion.span
                  initial={false}
                  animate={{ y: 0, opacity: 1 }}
                  className="font-editorial italic text-lg sm:text-3xl md:text-4xl text-[#c4972e] tracking-tight mt-1.5"
                >
                  &amp; jumping across 10 pages to shop?
                </motion.span>
              </div>

              {/* Bottom-Left & Bottom-Right Floating Chat Bubbles */}
              <div className="w-full grid grid-cols-2 items-end gap-2.5 sm:gap-6">
                {bottomBubbles.map((b, idx) => (
                  <motion.div
                    key={b.text}
                    initial={false}
                    animate={{ opacity: 1, scale: 1, y: [0, -3.5, 0] }}
                    transition={{
                      y: { delay: b.delay + 0.3, duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-2 sm:px-3.5 sm:py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-zinc-200/90 shadow-[0_10px_24px_rgba(0,0,0,0.06)] text-[9.5px] sm:text-xs text-zinc-700 font-light leading-tight text-left max-w-full ${
                      idx === 0
                        ? 'justify-self-start translate-y-2 sm:translate-y-2.5'
                        : 'justify-self-end -translate-y-2 sm:-translate-y-2.5'
                    }`}
                  >
                    <span className="text-xs sm:text-base leading-none shrink-0">{b.emoji}</span>
                    <span className="whitespace-normal">{b.text}</span>
                    <span className="text-xs sm:text-sm leading-none shrink-0">{b.tailEmoji}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* PART B (3.1 - 6.2s): Pure Open-Canvas Light Reveal — Compact & Balanced */
            <motion.div
              key="hook-solution"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ x: -160, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 190, damping: 18 }}
              className="relative w-full max-w-[325px] sm:max-w-[520px] flex flex-col items-center justify-center text-center"
            >
              {/* Soft Golden Aura Behind Open-Canvas Reveal */}
              <motion.div
                animate={{ scale: [0.95, 1.15, 0.95], opacity: [0.5, 0.85, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute w-[240px] sm:w-[380px] h-[160px] sm:h-[200px] rounded-full bg-[#c4972e]/20 blur-[65px]"
              />

              {/* Top Question */}
              <motion.span
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative z-10 font-editorial text-lg sm:text-3xl text-zinc-600 mb-2 sm:mb-3"
              >
                wished one trusted marketplace <span className="italic text-zinc-900">had it all?</span>
              </motion.span>

              {/* Center Clean White & Gold Lockup */}
              <div className="relative z-10 w-full flex items-center justify-center gap-2.5 sm:gap-4 px-3.5 py-3 sm:px-6 sm:py-4 rounded-[20px] sm:rounded-[28px] bg-white/95 backdrop-blur-xl border-2 border-[#c4972e]/35 shadow-[0_18px_45px_rgba(196,151,46,0.16)]">
                <motion.div
                  initial={{ scale: 0.5, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 230, damping: 15 }}
                  className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden bg-white border-2 border-[#c4972e]/50 shadow-sm shrink-0"
                >
                  <Image
                    src="/images/logo/irisi-mark-light.jpg"
                    alt="ÌRÍSÍ Official Logo"
                    fill
                    className="object-contain p-1"
                    unoptimized
                  />
                </motion.div>

                <div className="text-left min-w-0">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 border border-[#c4972e]/30 text-[8px] sm:text-[9px] font-mono-luxury uppercase tracking-[0.14em] text-[#c4972e] mb-0.5">
                    Nigeria&apos;s Fashion Marketplace
                  </span>
                  <div className="flex flex-wrap items-baseline gap-1 sm:gap-2 leading-none">
                    <span className="font-editorial italic text-lg sm:text-2xl text-zinc-600">
                      That&apos;s where
                    </span>
                    <span className="font-editorial text-2xl sm:text-4xl text-zinc-950 tracking-[0.08em]">
                      ÌRÍSÍ
                    </span>
                    <span className="font-editorial italic text-lg sm:text-2xl text-[#c4972e]">
                      comes in.
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Crisp Feature Pills Below */}
              <div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-2.5 sm:mt-3.5">
                {[
                  '✨ 32+ Fashion Categories',
                  '🔒 100% Escrow Protected',
                  '🇳🇬 Verified Nigerian Brands',
                ].map((pill, idx) => (
                  <motion.span
                    key={pill}
                    initial={{ opacity: 0, y: 10, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.14 + idx * 0.1, type: 'spring', stiffness: 210 }}
                    className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-white border border-zinc-200/90 shadow-xs text-[8px] sm:text-[10px] font-mono-luxury uppercase tracking-wider text-zinc-700"
                  >
                    {pill}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // ============================================================================
  // BEAT 2 (6.2 - 15.8s): DEPARTMENT HERO CARD + 6-NODE CATEGORY TREE (COMPACT!)
  // ============================================================================
  const renderBeat2CategoryTree = () => {
    const localT = sec - 6.2; // 0.0 -> 9.6s (1.6s per category node!)
    const visibleCount = Math.min(
      SHOPPER_TREE_NODES.length,
      Math.max(1, Math.floor(localT / 1.6) + 1)
    );
    const activeNodeIdx = visibleCount - 1;
    const activeNode = SHOPPER_TREE_NODES[activeNodeIdx];

    return (
      <motion.div
        key="beat2"
        initial={{ opacity: 0, x: 140 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -160 }}
        transition={{ type: 'spring', stiffness: 180, damping: 20 }}
        className="relative w-full h-full flex flex-col items-center justify-center px-3 sm:px-6"
      >
        <div className="w-full max-w-[325px] sm:max-w-[540px] flex flex-col items-start">
          {/* Top Hero Card: Compact & Proportional on Mobile & Desktop */}
          <motion.div
            initial={{ scale: 0.92, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 190, damping: 18 }}
            className="relative w-full rounded-[20px] sm:rounded-[28px] overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-black border-2 border-white shadow-[0_18px_42px_rgba(0,0,0,0.2)] p-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-4"
          >
            <div className="absolute -top-16 -left-16 w-40 h-40 rounded-full bg-[#c4972e]/25 blur-3xl" />

            {/* Left Dynamic Department Heading Inside Card */}
            <div className="relative z-10 flex flex-col justify-between min-w-0 flex-1 space-y-1.5 sm:space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 w-fit">
                <div className="relative w-3.5 h-3.5 rounded-full overflow-hidden bg-white shrink-0">
                  <Image
                    src="/images/logo/irisi-mark-light.jpg"
                    alt="ÌRÍSÍ"
                    fill
                    className="object-contain p-0.5"
                    unoptimized
                  />
                </div>
                <span className="text-[8px] sm:text-[9px] font-mono-luxury uppercase tracking-widest text-[#e6c367]">
                  ÌRÍSÍ · 0{activeNodeIdx + 1} / 06
                </span>
              </div>

              <div>
                <motion.h2
                  key={activeNode.deptTitle}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="font-editorial text-lg sm:text-3xl text-white tracking-tight leading-none"
                >
                  {activeNode.deptTitle}
                </motion.h2>
                <p className="text-[9px] sm:text-xs text-zinc-300 font-light mt-1 line-clamp-2">
                  {activeNode.sub}
                </p>
              </div>

              <span className="px-2 py-0.5 sm:px-3 sm:py-0.5 rounded-full bg-[#c4972e] text-white text-[8px] sm:text-[9px] font-mono-luxury uppercase tracking-wider w-fit shadow-sm">
                {activeNode.tag}
              </span>
            </div>

            {/* Right Dual Category Photo Previews */}
            <div className="relative z-10 flex items-center gap-1.5 sm:gap-2 shrink-0">
              {SHOPPER_TREE_NODES.map((node, idx) => {
                const isCurrent = idx === activeNodeIdx;
                return (
                  <div
                    key={node.label}
                    className={`flex items-center gap-1.5 sm:gap-2 transition-opacity duration-400 ${
                      isCurrent
                        ? 'opacity-100 relative z-10'
                        : 'opacity-0 absolute right-0 pointer-events-none z-0'
                    }`}
                  >
                    <div className="relative w-[64px] sm:w-[120px] h-[88px] sm:h-[155px] rounded-lg sm:rounded-xl overflow-hidden border border-white/90 shadow-md bg-[#F5F2EB]">
                      <Image
                        src={node.imgA}
                        alt={node.labelA}
                        fill
                        className="object-cover object-top"
                        sizes="130px"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                      <span className="absolute bottom-1 sm:bottom-1.5 left-1.5 right-1.5 text-white font-editorial text-[9px] sm:text-xs leading-tight">
                        {node.labelA}
                      </span>
                    </div>

                    <div className="relative w-[64px] sm:w-[120px] h-[88px] sm:h-[155px] rounded-lg sm:rounded-xl overflow-hidden border border-[#c4972e] shadow-md bg-[#F5F2EB]">
                      <Image
                        src={node.imgB}
                        alt={node.labelB}
                        fill
                        className="object-cover object-top"
                        sizes="130px"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                      <span className="absolute bottom-1 sm:bottom-1.5 left-1.5 right-1.5 text-[#e6c367] font-editorial text-[9px] sm:text-xs leading-tight">
                        {node.labelB}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Connected Vertical Timeline Tree Below Card */}
          <div className="relative pl-4 sm:pl-7 pt-2.5 sm:pt-3.5 space-y-1 sm:space-y-1.5 w-full">
            <div className="absolute left-[9px] sm:left-[22px] top-2.5 bottom-2.5 w-[2px] bg-zinc-700/80 rounded-full" />

            {SHOPPER_TREE_NODES.slice(0, visibleCount).map((node, idx) => {
              const isLatest = idx === activeNodeIdx;
              return (
                <div
                  key={node.label}
                  className="relative flex items-center justify-between gap-2 sm:gap-3 py-0.5 pr-1 transition-all duration-300"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span
                      className={`relative z-10 -ml-[12px] w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-[2px] border-[#F6F5F0] shrink-0 transition-transform duration-300 ${
                        isLatest
                          ? 'bg-[#c4972e] scale-125 shadow-[0_0_12px_rgba(196,151,46,0.8)]'
                          : 'bg-zinc-700'
                      }`}
                    />
                    <span
                      className={`font-editorial text-sm sm:text-xl md:text-2xl tracking-tight truncate transition-all duration-300 px-2.5 py-0.5 rounded-lg ${
                        isLatest
                          ? 'text-zinc-950 font-semibold italic bg-white/95 border border-zinc-200/90 shadow-xs'
                          : 'text-zinc-700 bg-white/55 backdrop-blur-xs'
                      }`}
                    >
                      {node.label}
                    </span>
                  </div>

                  {isLatest && (
                    <span
                      className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-white border border-zinc-200 text-[9px] font-mono-luxury uppercase tracking-wider text-zinc-700 shadow-xs shrink-0 animate-in fade-in duration-200"
                    >
                      {node.deptTitle}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  };

  // ============================================================================
  // BEAT 3 (15.8 - 23.3s): ESCROW CARD (COMPACT & PROPORTIONAL!)
  // ============================================================================
  const renderBeat3Escrow = () => {
    const localT = sec - 15.8; // 0.0 -> 7.5s (2.5s per step!)
    const activeStep = localT < 2.5 ? 1 : localT < 5.0 ? 2 : 3;

    return (
      <motion.div
        key="beat3-escrow"
        initial={{ opacity: 0, x: 140 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -160 }}
        transition={{ type: 'spring', stiffness: 180, damping: 20 }}
        className="relative w-full h-full flex flex-col items-center justify-center px-3 sm:px-6"
      >
        <div className="w-full max-w-[325px] sm:max-w-[540px] flex flex-col items-start">
          {/* Top Escrow Card — Compact on Mobile & Desktop */}
          <div className="relative w-full rounded-[20px] sm:rounded-[28px] bg-white border-2 border-zinc-200/90 shadow-[0_18px_42px_rgba(0,0,0,0.1)] p-3.5 sm:p-4 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <div className="relative z-20 flex items-center justify-between gap-2 border-b border-zinc-100 pb-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 text-[8px] sm:text-[10px] font-mono-luxury uppercase tracking-wider text-zinc-600">
                <ShieldCheck className="w-3.5 h-3.5 text-[#c4972e] shrink-0" />
                <span>100% Escrow Buyer Protection</span>
              </span>
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full bg-amber-50 text-[#c4972e] border border-[#c4972e]/30 text-[8px] sm:text-[10px] font-mono-luxury uppercase tracking-wider shrink-0">
                Step 0{activeStep} / 03
              </span>
            </div>

            {/* Compact Stage Area Below Header */}
            <div className="relative w-full min-h-[135px] sm:min-h-[145px] flex items-center">
              {/* STEP 1 LAYER: SECURE PAYMENT VAULT LOCK */}
              <div
                className={`w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 transition-all duration-400 ${
                  activeStep === 1
                    ? 'opacity-100 scale-100 relative z-10'
                    : 'opacity-0 scale-95 absolute inset-0 pointer-events-none z-0'
                }`}
              >
                <div className="space-y-0.5 sm:space-y-1 max-w-full sm:max-w-[270px]">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-[#c4972e] text-[8px] sm:text-[9px] font-mono-luxury uppercase tracking-widest">
                    Step 01 · Secure Escrow Payment
                  </span>
                  <h3 className="font-editorial text-lg sm:text-2xl text-zinc-900 leading-tight">
                    Your Money Stays Locked Safely
                  </h3>
                  <p className="text-[10px] sm:text-xs text-zinc-500 font-light leading-snug">
                    When you pay on ÌRÍSÍ, your funds are held safely in our vault until your order arrives.
                  </p>
                </div>

                <div className="w-full sm:w-auto flex items-center sm:flex-col justify-between sm:justify-center bg-[#F6F5F0] sm:bg-transparent p-2 sm:p-0 rounded-xl sm:pr-2 shrink-0">
                  <div className="flex items-center gap-2 sm:flex-col">
                    <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#c4972e] to-[#967015] text-white flex items-center justify-center shadow-md">
                      <Lock className="w-4 h-4 sm:w-7 sm:h-7" />
                    </div>
                    <div className="sm:-mt-2 px-2 py-0.5 rounded-full bg-zinc-900 text-white text-[8px] sm:text-[9px] font-mono-luxury flex items-center gap-1 shadow-sm">
                      <CreditCard className="w-3 h-3 text-[#e6c367]" />
                      <span>Protected in Vault</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2 LAYER: VENDOR SHIPS YOUR ORDER */}
              <div
                className={`w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 transition-all duration-400 ${
                  activeStep === 2
                    ? 'opacity-100 scale-100 relative z-10'
                    : 'opacity-0 scale-95 absolute inset-0 pointer-events-none z-0'
                }`}
              >
                <div className="space-y-0.5 sm:space-y-1 max-w-full sm:max-w-[255px]">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-[#c4972e] text-[8px] sm:text-[9px] font-mono-luxury uppercase tracking-widest">
                    Step 02 · Live Order Dispatch
                  </span>
                  <h3 className="font-editorial text-lg sm:text-2xl text-zinc-900 leading-tight">
                    Vendor Ships Your Order
                  </h3>
                  <p className="text-[10px] sm:text-xs text-zinc-500 font-light leading-snug">
                    The vendor packs your exact outfit, wig, or shoes and sends it straight to your doorstep.
                  </p>
                </div>

                {/* Right Animated Delivery Route Box */}
                <div className="w-full sm:w-[215px] flex flex-col justify-center shrink-0">
                  <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono-luxury uppercase tracking-wider text-zinc-600 mb-1 px-1">
                    <span className="px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-900">
                      🏪 Vendor
                    </span>
                    <span className="text-[#c4972e]">On The Way →</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      🏠 You
                    </span>
                  </div>

                  <div className="relative w-full h-10 sm:h-14 rounded-xl bg-[#F6F5F0] border border-zinc-200 flex items-center px-2 overflow-hidden">
                    <div className="w-full border-b-2 border-dashed border-[#c4972e]/60" />
                    <motion.div
                      animate={{ left: activeStep === 2 ? ['4%', '48%'] : '4%' }}
                      transition={{ duration: 1.75, ease: 'easeInOut' }}
                      className="absolute flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-900 text-[#e6c367] border border-[#c4972e] shadow-md"
                    >
                      <Truck className="w-3.5 h-3.5 shrink-0" />
                      <div>
                        <span className="text-[7px] font-mono-luxury uppercase text-white block leading-none">
                          Dispatched
                        </span>
                        <span className="text-[6px] text-[#e6c367] font-mono-luxury">
                          Fast Delivery
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* STEP 3 LAYER: YOU INSPECT & APPROVE FIRST */}
              <div
                className={`w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 transition-all duration-400 ${
                  activeStep === 3
                    ? 'opacity-100 scale-100 relative z-10'
                    : 'opacity-0 scale-95 absolute inset-0 pointer-events-none z-0'
                }`}
              >
                <div className="space-y-0.5 sm:space-y-1 max-w-full sm:max-w-[270px]">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[8px] sm:text-[9px] font-mono-luxury uppercase tracking-widest">
                    Step 03 · Quality Verified by You
                  </span>
                  <h3 className="font-editorial text-lg sm:text-2xl text-zinc-900 leading-tight">
                    You Inspect &amp; Approve First
                  </h3>
                  <p className="text-[10px] sm:text-xs text-zinc-500 font-light leading-snug">
                    Once you check your order and confirm it matches what you ordered, the vendor gets paid!
                  </p>
                </div>

                <div className="w-full sm:w-auto flex items-center sm:flex-col justify-between sm:justify-center bg-emerald-50/60 sm:bg-transparent p-2 sm:p-0 rounded-xl sm:pr-2 shrink-0">
                  <div className="flex items-center gap-2 sm:flex-col">
                    <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-md">
                      <PackageCheck className="w-4 h-4 sm:w-7 sm:h-7" />
                    </div>
                    <div className="sm:-mt-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[8px] sm:text-[9px] font-mono-luxury flex items-center gap-1 shadow-sm uppercase">
                      <SearchCheck className="w-3 h-3" />
                      <span>✓ Approved &amp; Released</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Vertical Timeline Tree Below Card */}
          <div className="relative pl-4 sm:pl-7 pt-2.5 sm:pt-3.5 space-y-1.5 sm:space-y-2.5 w-full">
            <div className="absolute left-[9px] sm:left-[22px] top-3 bottom-3 w-[2px] bg-zinc-800 rounded-full" />

            {[
              {
                id: 1,
                title: '01. secure escrow payment',
                sub: 'Your money is held safely in the ÌRÍSÍ vault when you order',
              },
              {
                id: 2,
                title: '02. vendor ships your order',
                sub: 'The vendor packs your exact item and dispatches it to you',
              },
              {
                id: 3,
                title: '03. you inspect & approve first',
                sub: 'You check your delivery first before the vendor gets paid',
              },
            ]
              .slice(0, activeStep)
              .map((step) => {
                const isCurrent = step.id === activeStep;
                return (
                  <div
                    key={step.id}
                    className="relative flex items-start sm:items-center gap-2 sm:gap-3 transition-all duration-300"
                  >
                    <span
                      className={`relative z-10 -ml-[12px] mt-1 sm:mt-0 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-[2px] border-[#F6F5F0] shrink-0 transition-transform duration-300 ${
                        isCurrent
                          ? 'bg-[#c4972e] scale-125 shadow-[0_0_12px_rgba(196,151,46,0.8)]'
                          : 'bg-emerald-600'
                      }`}
                    />
                    <div className={`min-w-0 px-2.5 py-1 rounded-xl transition-all duration-300 ${
                      isCurrent
                        ? 'bg-white/95 border border-zinc-200/90 shadow-xs'
                        : 'bg-white/55 backdrop-blur-xs'
                    }`}>
                      <span
                        className={`font-editorial text-base sm:text-2xl leading-tight block ${
                          isCurrent ? 'text-zinc-950 italic font-semibold' : 'text-zinc-700'
                        }`}
                      >
                        {step.title}
                      </span>
                      <span className="text-[9.5px] sm:text-[11.5px] text-zinc-600 font-light mt-0.5 block">
                        {step.sub}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </motion.div>
    );
  };

  // ============================================================================
  // BEAT 4 (23.3 - 34.0s): VENDOR DM PAIN HOOK -> "THAT'S WHERE ÌRÍSÍ COMES IN" STOREFRONT SOLUTION
  // ============================================================================
  const renderBeat4Vendors = () => {
    const localT = sec - 23.3; // 0.0 -> 10.7s
    const showVendorSolution = localT >= 3.8;
    const solutionT = Math.max(0, localT - 3.8);
    const activeVendorStep = solutionT < 2.3 ? 1 : solutionT < 4.6 ? 2 : 3;

    const topVendorBubbles = [
      {
        emoji: '📸',
        text: '“Abeg send pictures of all the pieces you have”',
        tailEmoji: '😩',
        delay: 0.08,
      },
      {
        emoji: '💔',
        text: '“Sent 30 photos on WhatsApp... and got ghosted”',
        tailEmoji: '🚫',
        delay: 0.2,
      },
    ];

    const bottomVendorBubbles = [
      {
        emoji: '💬',
        text: '“How much is this one? Is size M still available?”',
        tailEmoji: '😮‍💨',
        delay: 0.32,
      },
      {
        emoji: '⏳',
        text: '“Spending all day replying DMs instead of selling”',
        tailEmoji: '😭',
        delay: 0.44,
      },
    ];

    return (
      <motion.div
        key="beat4-vendors"
        initial={{ opacity: 0, x: 180, filter: 'blur(10px)' }}
        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, x: -200, filter: 'blur(12px)' }}
        transition={{ type: 'spring', stiffness: 180, damping: 20 }}
        className="relative w-full h-full flex flex-col items-center justify-center px-3 sm:px-6"
      >
        <AnimatePresence mode="wait">
          {!showVendorSolution ? (
            /* PART A (23.3 - 27.1s): 4-Corner Floating Vendor DM Pain Hook (Top-Left, Top-Right, Bottom-Left, Bottom-Right) */
            <motion.div
              key="vendor-hook-pain"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.08, opacity: 0, filter: 'blur(10px)' }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              className="relative w-full max-w-[355px] sm:max-w-[780px] flex flex-col items-center justify-center text-center"
            >
              {/* Top-Left & Top-Right Vendor Chat Bubbles */}
              <div className="w-full grid grid-cols-2 items-start gap-2.5 sm:gap-6">
                {topVendorBubbles.map((b, idx) => (
                  <motion.div
                    key={b.text}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: [0, -3.5, 0] }}
                    transition={{
                      opacity: { delay: b.delay, duration: 0.28 },
                      scale: { delay: b.delay, type: 'spring', stiffness: 210 },
                      y: { delay: b.delay + 0.3, duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-2 sm:px-3.5 sm:py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-zinc-200/90 shadow-[0_10px_24px_rgba(0,0,0,0.06)] text-[9.5px] sm:text-xs text-zinc-700 font-light leading-tight text-left max-w-full ${
                      idx === 0
                        ? 'justify-self-start -translate-y-1.5 sm:-translate-y-2.5'
                        : 'justify-self-end translate-y-2.5 sm:translate-y-3'
                    }`}
                  >
                    <span className="text-xs sm:text-base leading-none shrink-0">{b.emoji}</span>
                    <span className="whitespace-normal">{b.text}</span>
                    <span className="text-xs sm:text-sm leading-none shrink-0">{b.tailEmoji}</span>
                  </motion.div>
                ))}
              </div>

              {/* Center Vendor Hook Lockup */}
              <div className="flex flex-col items-center my-6 sm:my-8">
                <span className="mb-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-[#c4972e]/35 text-[8px] sm:text-[10px] font-mono-luxury uppercase tracking-widest text-[#c4972e]">
                  <Store className="w-3 h-3" />
                  For Fashion Vendors &amp; Brands
                </span>

                <motion.span
                  initial={{ y: 10, opacity: 0, filter: 'blur(6px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  className="font-editorial text-xl sm:text-4xl text-zinc-700 tracking-tight mb-1"
                >
                  as a vendor, are you tired of
                </motion.span>

                <Glossy3DPill variant="dark" className="px-5 py-1.5 sm:px-7 sm:py-2">
                  <span className="font-editorial italic text-2xl sm:text-4xl md:text-5xl tracking-tight px-1">
                    &ldquo;sending pics of pieces&rdquo;
                  </span>
                </Glossy3DPill>

                <motion.span
                  initial={{ y: 10, opacity: 0, filter: 'blur(6px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  transition={{ delay: 0.14 }}
                  className="font-editorial italic text-lg sm:text-3xl md:text-4xl text-[#c4972e] tracking-tight mt-1.5"
                >
                  every time a customer wants to shop?
                </motion.span>
              </div>

              {/* Bottom-Left & Bottom-Right Vendor Chat Bubbles */}
              <div className="w-full grid grid-cols-2 items-end gap-2.5 sm:gap-6">
                {bottomVendorBubbles.map((b, idx) => (
                  <motion.div
                    key={b.text}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: [0, -3.5, 0] }}
                    transition={{
                      opacity: { delay: b.delay, duration: 0.28 },
                      scale: { delay: b.delay, type: 'spring', stiffness: 210 },
                      y: { delay: b.delay + 0.3, duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-2 sm:px-3.5 sm:py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-zinc-200/90 shadow-[0_10px_24px_rgba(0,0,0,0.06)] text-[9.5px] sm:text-xs text-zinc-700 font-light leading-tight text-left max-w-full ${
                      idx === 0
                        ? 'justify-self-start translate-y-2 sm:translate-y-2.5'
                        : 'justify-self-end -translate-y-2 sm:-translate-y-2.5'
                    }`}
                  >
                    <span className="text-xs sm:text-base leading-none shrink-0">{b.emoji}</span>
                    <span className="whitespace-normal">{b.text}</span>
                    <span className="text-xs sm:text-sm leading-none shrink-0">{b.tailEmoji}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* PART B (27.1 - 34.0s): Compact Vendor Storefront Card + 3-Step Tree */
            <motion.div
              key="vendor-solution-tree"
              initial={{ scale: 0.92, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ x: -200, opacity: 0, filter: 'blur(12px)' }}
              transition={{ type: 'spring', stiffness: 190, damping: 18 }}
              className="w-full max-w-[325px] sm:max-w-[540px] flex flex-col items-start"
            >
              {/* Top Vendor Solution Card */}
              <div className="relative w-full rounded-[20px] sm:rounded-[28px] bg-white border-2 border-zinc-200/90 shadow-[0_18px_42px_rgba(0,0,0,0.1)] p-3.5 sm:p-5 flex flex-col overflow-hidden">
                {/* Top Header Bar */}
                <div className="relative z-20 flex items-center justify-between gap-2 border-b border-zinc-100 pb-2 mb-2.5">
                  <span className="inline-flex items-center gap-1.5 text-[8px] sm:text-[10px] font-mono-luxury uppercase tracking-wider text-[#c4972e]">
                    <Store className="w-3.5 h-3.5 text-[#c4972e] shrink-0" />
                    <span>That&apos;s Where ÌRÍSÍ Comes In</span>
                  </span>
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] sm:text-[10px] font-mono-luxury uppercase tracking-wider shrink-0">
                    0% Fee at Launch
                  </span>
                </div>

                {/* 3 Responsive Vendor Solution Layers */}
                <div className="relative w-full min-h-[135px] sm:min-h-[145px] flex items-center">
                  {/* VENDOR STEP 1: YOUR OWN 24/7 DIGITAL STOREFRONT */}
                  <div
                    className={`w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 transition-all duration-400 ${
                      activeVendorStep === 1
                        ? 'opacity-100 scale-100 relative z-10'
                        : 'opacity-0 scale-95 absolute inset-0 pointer-events-none z-0'
                    }`}
                  >
                    <div className="space-y-0.5 sm:space-y-1 max-w-full sm:max-w-[270px]">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-[#c4972e] text-[8px] sm:text-[9px] font-mono-luxury uppercase tracking-widest">
                        Step 01 · Stop Sending Photos in DMs
                      </span>
                      <h3 className="font-editorial text-lg sm:text-2xl text-zinc-900 leading-tight">
                        Your Own 24/7 Storefront
                      </h3>
                      <p className="text-[10px] sm:text-xs text-zinc-500 font-light leading-snug">
                        Upload your pieces once. Customers browse your catalog, sizes &amp; stock anytime without DMing you for pictures.
                      </p>
                    </div>

                    <div className="w-full sm:w-[195px] rounded-xl bg-[#F6F5F0] border border-zinc-200 p-2 sm:p-3 flex flex-col items-center text-center shadow-inner shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-[#e6c367] text-[8px] sm:text-[9px] font-mono-luxury tracking-wider mb-1">
                        irisimi.ng/your-brand
                      </span>
                      <span className="font-editorial text-base sm:text-lg text-zinc-900">
                        Live Catalog Ready
                      </span>
                      <span className="text-[8px] sm:text-[9px] text-emerald-700 font-mono-luxury mt-0.5">
                        ✓ Photos · Sizes · Stock Live
                      </span>
                    </div>
                  </div>

                  {/* VENDOR STEP 2: AUTOMATED CHECKOUT & ORDERS */}
                  <div
                    className={`w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 transition-all duration-400 ${
                      activeVendorStep === 2
                        ? 'opacity-100 scale-100 relative z-10'
                        : 'opacity-0 scale-95 absolute inset-0 pointer-events-none z-0'
                    }`}
                  >
                    <div className="space-y-0.5 sm:space-y-1 max-w-full sm:max-w-[270px]">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-[#c4972e] text-[8px] sm:text-[9px] font-mono-luxury uppercase tracking-widest">
                        Step 02 · Zero WhatsApp DM Stress
                      </span>
                      <h3 className="font-editorial text-lg sm:text-2xl text-zinc-900 leading-tight">
                        Automated Checkout &amp; Orders
                      </h3>
                      <p className="text-[10px] sm:text-xs text-zinc-500 font-light leading-snug">
                        Customers pick their exact size and pay directly on your page — no more chasing bank transfers in DMs.
                      </p>
                    </div>

                    <div className="w-full sm:w-[195px] rounded-xl bg-zinc-900 text-white p-2 sm:p-3 flex flex-col items-center text-center shadow-lg shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[8px] sm:text-[9px] font-mono-luxury uppercase mb-1">
                        ⚡ Instant Order Alert
                      </span>
                      <span className="font-editorial text-base sm:text-lg text-white">
                        New Order Paid
                      </span>
                      <span className="text-[8px] sm:text-[9px] text-[#e6c367] font-mono-luxury mt-0.5">
                        Ready to Pack &amp; Dispatch
                      </span>
                    </div>
                  </div>

                  {/* VENDOR STEP 3: 0% COMMISSION FOR FOUNDING VENDORS */}
                  <div
                    className={`w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 transition-all duration-400 ${
                      activeVendorStep === 3
                        ? 'opacity-100 scale-100 relative z-10'
                        : 'opacity-0 scale-95 absolute inset-0 pointer-events-none z-0'
                    }`}
                  >
                    <div className="space-y-0.5 sm:space-y-1 max-w-full sm:max-w-[270px]">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[8px] sm:text-[9px] font-mono-luxury uppercase tracking-widest">
                        Step 03 · Founding Vendor Benefit
                      </span>
                      <h3 className="font-editorial text-lg sm:text-2xl text-zinc-900 leading-tight">
                        0% Commission at Launch
                      </h3>
                      <p className="text-[10px] sm:text-xs text-zinc-500 font-light leading-snug">
                        Join the vendor waitlist early and keep 100% of your sales when ÌRÍSÍ launches.
                      </p>
                    </div>

                    <div className="w-full sm:w-[195px] rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-2 sm:p-3 flex flex-col items-center text-center shadow-lg shrink-0">
                      <span className="font-editorial text-2xl sm:text-3xl text-white leading-none">
                        0% Fee
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-mono-luxury uppercase tracking-widest text-emerald-100 mt-1">
                        Keep 100% of Your Sales
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connected Vertical 3-Node Vendor Solution Tree Below Card */}
              <div className="relative pl-4 sm:pl-7 pt-2.5 sm:pt-3.5 space-y-1.5 sm:space-y-2.5 w-full">
                <div className="absolute left-[9px] sm:left-[22px] top-3 bottom-3 w-[2px] bg-zinc-800 rounded-full" />

                {[
                  {
                    id: 1,
                    title: '01. upload once — stop sending pics in DMs',
                    sub: 'Customers browse all your pieces, photos & sizes 24/7 on your link',
                  },
                  {
                    id: 2,
                    title: '02. customers shop & pay automatically',
                    sub: 'Receive instant paid orders without endless WhatsApp or IG chats',
                  },
                  {
                    id: 3,
                    title: '03. enjoy 0% commission fee at launch',
                    sub: 'Keep 100% of your revenue as an early founding vendor on ÌRÍSÍ',
                  },
                ]
                  .slice(0, activeVendorStep)
                  .map((step) => {
                    const isCurrent = step.id === activeVendorStep;
                    return (
                      <div
                        key={step.id}
                        className="relative flex items-start sm:items-center gap-2 sm:gap-3 transition-all duration-300"
                      >
                        <span
                          className={`relative z-10 -ml-[12px] mt-1 sm:mt-0 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-[2px] border-[#F6F5F0] shrink-0 transition-transform duration-300 ${
                            isCurrent
                              ? 'bg-[#c4972e] scale-125 shadow-[0_0_12px_rgba(196,151,46,0.8)]'
                              : 'bg-emerald-600'
                          }`}
                        />
                        <div className={`min-w-0 px-2.5 py-1 rounded-xl transition-all duration-300 ${
                          isCurrent
                            ? 'bg-white/95 border border-zinc-200/90 shadow-xs'
                            : 'bg-white/55 backdrop-blur-xs'
                        }`}>
                          <span
                            className={`font-editorial text-base sm:text-2xl leading-tight block ${
                              isCurrent ? 'text-zinc-950 italic font-semibold' : 'text-zinc-700'
                            }`}
                          >
                            {step.title}
                          </span>
                          <span className="text-[9.5px] sm:text-[11.5px] text-zinc-600 font-light mt-0.5 block">
                            {step.sub}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // ============================================================================
  // BEAT 5 (34.0 - 38.5s): COMPACT FINALE LOCKUP
  // ============================================================================
  const renderBeat5Finale = () => {
    const localT = sec - 34.0; // 0.0 -> 4.5s
    const showFinalCTA = localT >= 1.9;

    return (
      <motion.div
        key="beat5-finale"
        initial={{ opacity: 0, x: 140 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 185, damping: 20 }}
        className="relative w-full h-full flex items-center justify-center px-3 sm:px-6"
      >
        <AnimatePresence mode="wait">
          {!showFinalCTA ? (
            <motion.div
              key="finale-part1"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ x: -160, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              className="w-full max-w-[260px] sm:max-w-[340px] flex flex-col items-center"
            >
              <div className="relative w-full h-[72px] sm:h-[90px] rounded-[22px] sm:rounded-[28px] bg-gradient-to-b from-zinc-800 via-zinc-900 to-black border-t-2 border-white/35 shadow-[0_20px_45px_rgba(0,0,0,0.25)] flex items-center justify-center mb-5 sm:mb-6 mt-8">
                <motion.div
                  initial={{ y: 28, scale: 0.7 }}
                  animate={{ y: -22, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[20px] sm:rounded-[26px] overflow-hidden bg-white border-4 border-white shadow-[0_16px_36px_rgba(0,0,0,0.25)] flex items-center justify-center shrink-0"
                >
                  <Image
                    src="/images/logo/irisi-mark-light.jpg"
                    alt="ÌRÍSÍ Official Logo"
                    fill
                    className="object-contain p-1.5"
                    unoptimized
                  />
                </motion.div>
              </div>

              <div className="flex flex-col items-center leading-none">
                <span className="font-editorial text-xl sm:text-3xl text-zinc-700">
                  welcome to
                </span>
                <span className="font-editorial text-4xl sm:text-6xl text-zinc-950 tracking-[0.14em] mt-1.5">
                  ÌRÍSÍ
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="finale-part2"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 210, damping: 18 }}
              className="flex flex-col items-center text-center"
            >
              <div className="flex flex-col items-start">
                <span className="font-editorial text-xl sm:text-3xl text-zinc-700 ml-1 -mb-1">
                  shoppers &amp; vendors
                </span>

                <span className="font-editorial italic text-4xl sm:text-6xl md:text-7xl text-zinc-950 tracking-tight leading-none">
                  join the waitlist
                </span>
              </div>

              <div className="mt-2 sm:mt-3 self-end mr-1">
                <Glossy3DPill variant="gold" tilt={-3} className="px-5 py-1.5 sm:px-7 sm:py-2">
                  <span className="font-mono-luxury text-sm sm:text-xl uppercase tracking-widest">
                    irisimi.ng
                  </span>
                </Glossy3DPill>
              </div>

              <div className="mt-5 sm:mt-7 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white border border-zinc-200 shadow-xs text-[10px] sm:text-xs font-mono-luxury text-zinc-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Shoppers: Join VIP Waitlist</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-zinc-900 text-white shadow-xs text-[10px] sm:text-xs font-mono-luxury">
                  <Sparkles className="w-3.5 h-3.5 text-[#e6c367] shrink-0" />
                  <span>Vendors: Apply for 0% Launch Fee</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#e6c367] shrink-0" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="relative w-full h-screen h-[100dvh] overflow-hidden flex items-center justify-center select-none bg-[#F6F5F0] text-zinc-900">
      {/* Full-Screen Dotted Grid + Corner Dashed Arcs */}
      <DanushkBackdrop beat={beat} />

      {/* Proportionally Scaled Center Stage So Nothing Feels Too Big on Mobile or Desktop */}
      <div className="relative z-10 w-full h-full flex items-center justify-center scale-[0.88] sm:scale-[0.94] md:scale-100 origin-center">
        <AnimatePresence mode="wait">
          {beat === 1 && renderBeat1Hook()}
          {beat === 2 && renderBeat2CategoryTree()}
          {beat === 3 && renderBeat3Escrow()}
          {beat === 4 && renderBeat4Vendors()}
          {beat === 5 && renderBeat5Finale()}
        </AnimatePresence>
      </div>
    </div>
  );
}
