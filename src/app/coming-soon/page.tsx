'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import AntigravityParticleCanvas from '@/components/common/AntigravityParticleCanvas';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Unlock,
  Store,
  Send,
  Loader2,
  X,
  Zap,
  Layers,
  Sparkles,
  Award,
} from 'lucide-react';

// The 3 Premier Fashion Disciplines for the 3D Fanning Deck
const HERO_CARDS = [
  {
    id: 'native',
    title: 'Agbada Architecture',
    subtitle: 'Heritage Couture',
    image: '/images/editorial/nigerian_male_couture.jpg',
    tag: 'SOVEREIGN NATIVE',
    badge: '4 Brands Confirmed',
    accent: '#d4af37',
  },
  {
    id: 'streetwear',
    title: 'Neo-Lagos Streetwear',
    subtitle: 'Underground Luxury',
    image: '/images/editorial/modern_male_streetwear.jpg',
    tag: 'LAGOS SUB-CULTURE',
    badge: '6 Brands Confirmed',
    accent: '#0a0a0a',
  },
  {
    id: 'eveningwear',
    title: 'Avant-Garde Silks',
    subtitle: 'High-Society Atelier',
    image: '/images/editorial/nigerian_female_couture.jpg',
    tag: 'CONTEMPORARY LUXE',
    badge: '3 Brands Confirmed',
    accent: '#8b5cf6',
  },
];

export default function ComingSoonPage() {
  // ── States ─────────────────────────────────────────────────────────────
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [waitlistError, setWaitlistError] = useState('');
  const [passNumber, setPassNumber] = useState('00742');

  // Kinetic Headline Word Highlight State (0: THE, 1: COMPLETE, 2: NIGERIAN, 3: FIT.)
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);

  useEffect(() => {
    const wordTimer = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % 4);
    }, 1800);
    return () => clearInterval(wordTimer);
  }, []);

  // Vendor Application Modal
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    brandName: '',
    instagramHandle: '',
    category: 'Streetwear & Ready-to-Wear',
    priceRange: '₦30,000 – ₦80,000',
    founderPhone: '',
    founderEmail: '',
    lookbookUrl: '',
  });
  const [vendorStatus, setVendorStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [vendorMessage, setVendorMessage] = useState('');

  // Founder Secret Unlock Modal
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [unlockStatus, setUnlockStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  // 3D Merch Mouse Tilt State
  const [merchTilt, setMerchTilt] = useState({ x: 0, y: 0 });

  // ── Ambient Polyphonic Audio Engine ────────────────────────────────────
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioIntervalRef = useRef<any>(null);

  const toggleAudio = () => {
    if (isPlayingAudio) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      setIsPlayingAudio(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.04, ctx.currentTime);
      masterGain.connect(ctx.destination);

      // Warm Fashion Lounge Chords (Dmaj9 -> Bm9 -> Gmaj7 -> A9)
      const chords = [
        [146.83, 220.0, 277.18, 329.63],
        [123.47, 185.0, 220.0, 293.66],
        [98.0, 146.83, 196.0, 246.94],
        [110.0, 164.81, 220.0, 277.18],
      ];
      let step = 0;

      const playChord = () => {
        if (ctx.state === 'suspended') ctx.resume();
        const chord = chords[step % chords.length];
        step++;

        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4.6);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start();
          osc.stop(ctx.currentTime + 4.8);
        });
      };

      playChord();
      audioIntervalRef.current = setInterval(playChord, 4600);
      setIsPlayingAudio(true);
    } catch (e) {
      console.warn('Audio not allowed', e);
    }
  };

  // ── Scroll Physics (Revolut-Style Dynamic Background Morph) ─────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Smooth springs for scroll transitions
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 20 });

  // Dynamically morph background from Crisp Porcelain (#FAF9F6) to Deep Onyx Slate (#0A0C10)
  const bgColor = useTransform(
    smoothProgress,
    [0, 0.35, 0.7, 1],
    ['#FAF9F6', '#14161B', '#0A0C10', '#060709']
  );

  // Dynamic text color transition
  const textColor = useTransform(
    smoothProgress,
    [0, 0.25],
    ['#0A0B0D', '#FFFFFF']
  );

  // Card deck fanning translations based on scroll
  const card1X = useTransform(smoothProgress, [0, 0.25], [-120, -280]);
  const card1Rotate = useTransform(smoothProgress, [0, 0.25], [-12, -6]);

  const card2Y = useTransform(smoothProgress, [0, 0.25], [0, -30]);
  const card2Scale = useTransform(smoothProgress, [0, 0.25], [1.02, 1.08]);

  const card3X = useTransform(smoothProgress, [0, 0.25], [120, 280]);
  const card3Rotate = useTransform(smoothProgress, [0, 0.25], [12, 6]);

  // ── Waitlist Submit ────────────────────────────────────────────────────
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes('@')) return;

    setWaitlistStatus('loading');
    setWaitlistError('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join waitlist');

      if (data.passNumber) setPassNumber(data.passNumber);
      setWaitlistStatus('success');
    } catch (err: any) {
      setWaitlistStatus('error');
      setWaitlistError(err.message || 'Error occurred. Please try again.');
    }
  };

  // ── Vendor Application Submit ──────────────────────────────────────────
  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.brandName || !vendorForm.founderPhone || !vendorForm.founderEmail) {
      setVendorMessage('Please provide brand name, phone, and email.');
      setVendorStatus('error');
      return;
    }

    setVendorStatus('loading');
    setVendorMessage('');

    try {
      const res = await fetch('/api/vendor-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Application failed');

      setVendorStatus('success');
      setVendorMessage(data.message || 'Application submitted successfully.');
    } catch (err: any) {
      setVendorStatus('error');
      setVendorMessage(err.message || 'Submission error. Try again.');
    }
  };

  // ── Founder Unlock ─────────────────────────────────────────────────────
  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockStatus('loading');

    try {
      const res = await fetch('/api/preview-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid passcode');

      window.location.href = '/?unlocked=1';
    } catch (err: any) {
      setUnlockStatus('error');
    }
  };

  return (
    <motion.div
      ref={containerRef}
      style={{ backgroundColor: bgColor }}
      className="min-h-screen font-sans selection:bg-[#0A0B0D] selection:text-white transition-colors duration-300 relative overflow-x-hidden"
    >
      {/* ── FLOATING PILL DOCK (Revolut Style) ───────────────────────────── */}
      <header className="fixed top-6 inset-x-0 z-50 max-w-5xl mx-auto px-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-between px-5 py-3 rounded-full bg-white/80 dark:bg-black/80 border border-black/10 dark:border-white/15 backdrop-blur-xl shadow-xl shadow-black/5">
          {/* Logo & Brand Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-black/10 dark:border-white/20 bg-black flex items-center justify-center">
              <Image
                src="/images/logo/irisi-icon.png"
                alt="ÌRÍSÍ Emblem"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <span className="font-bold text-base tracking-[0.2em] text-zinc-950 dark:text-white">
              ÌRÍSÍ
            </span>
            <span className="hidden sm:inline-block text-[9px] uppercase tracking-widest font-mono text-zinc-500">
              LAGOS · RUNWAY
            </span>
          </div>

          {/* Action Capsule */}
          <div className="flex items-center gap-3">
            {/* Brand Application CTA */}
            <button
              onClick={() => setIsVendorModalOpen(true)}
              className="px-4 py-1.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              Apply As Brand
            </button>
          </div>
        </div>
      </header>

      {/* ── SECTION 1: LUMINOUS REVOLUT HERO ─────────────────────────────── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-4 pt-32 pb-16 z-10 max-w-6xl mx-auto overflow-hidden">
        {/* Antigravity Interactive Particle Canvas */}
        <AntigravityParticleCanvas />

        {/* Status Pill */}
        <div className="relative z-10 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-black/10 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.05] text-[10px] font-mono font-bold tracking-[0.25em] uppercase text-zinc-700 dark:text-zinc-300 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B89035] animate-ping" />
          <span>DEBUT RUNWAY · FOUNDING MEMBERS ONLY</span>
        </div>

        {/* Stadium-Scale Kinetic Headline with Word Inversion Highlights */}
        <div className="relative z-10 flex flex-col items-center justify-center mb-8 max-w-5xl select-none">
          {/* Line 1: THE COMPLETE */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-[-0.04em] leading-[1.05]">
            <span
              onMouseEnter={() => setHoveredWordIndex(0)}
              onMouseLeave={() => setHoveredWordIndex(null)}
              className={`transition-all duration-300 cursor-pointer ${
                (hoveredWordIndex !== null ? hoveredWordIndex === 0 : activeWordIndex === 0)
                  ? 'bg-zinc-950 text-white px-3 sm:px-6 py-0.5 sm:py-1 rounded-xl sm:rounded-2xl shadow-2xl scale-[1.03]'
                  : 'text-zinc-950 dark:text-white px-2 py-0.5'
              }`}
            >
              THE
            </span>
            <span
              onMouseEnter={() => setHoveredWordIndex(1)}
              onMouseLeave={() => setHoveredWordIndex(null)}
              className={`transition-all duration-300 cursor-pointer ${
                (hoveredWordIndex !== null ? hoveredWordIndex === 1 : activeWordIndex === 1)
                  ? 'bg-zinc-950 text-white px-3 sm:px-6 py-0.5 sm:py-1 rounded-xl sm:rounded-2xl shadow-2xl scale-[1.03]'
                  : 'text-zinc-950 dark:text-white px-2 py-0.5'
              }`}
            >
              COMPLETE
            </span>
          </div>

          {/* Line 2: NIGERIAN FIT. */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-[-0.04em] leading-[1.05] mt-1 sm:mt-3">
            <span
              onMouseEnter={() => setHoveredWordIndex(2)}
              onMouseLeave={() => setHoveredWordIndex(null)}
              className={`transition-all duration-300 cursor-pointer ${
                (hoveredWordIndex !== null ? hoveredWordIndex === 2 : activeWordIndex === 2)
                  ? 'bg-zinc-950 text-[#B89035] px-3 sm:px-6 py-0.5 sm:py-1 rounded-xl sm:rounded-2xl shadow-2xl scale-[1.03]'
                  : 'text-[#B89035] px-2 py-0.5'
              }`}
            >
              NIGERIAN
            </span>
            <span
              onMouseEnter={() => setHoveredWordIndex(3)}
              onMouseLeave={() => setHoveredWordIndex(null)}
              className={`transition-all duration-300 cursor-pointer ${
                (hoveredWordIndex !== null ? hoveredWordIndex === 3 : activeWordIndex === 3)
                  ? 'bg-zinc-950 text-white px-3 sm:px-6 py-0.5 sm:py-1 rounded-xl sm:rounded-2xl shadow-2xl scale-[1.03]'
                  : 'text-[#B89035] px-2 py-0.5'
              }`}
            >
              FIT.
            </span>
          </div>
        </div>

        <p className="text-zinc-600 dark:text-zinc-300 text-base sm:text-xl font-normal max-w-2xl mx-auto leading-relaxed mb-10">
          Uniting Nigeria’s most sovereign fashion houses, native ateliers, and luxury streetwear creators
          on a single high-performance digital runway.
        </p>

        {/* Priority Waitlist Input Box */}
        <div className="w-full max-w-md mx-auto mb-16" id="waitlist">
          {waitlistStatus === 'success' ? (
            /* Digital VIP Member Card */
            <div className="p-6 rounded-2xl border border-[#B89035]/40 bg-white dark:bg-zinc-900 shadow-2xl text-left">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono tracking-widest text-[#B89035] font-bold">
                  SOVEREIGN PASS #{passNumber}
                </span>
                <Award className="w-5 h-5 text-[#B89035]" />
              </div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white mb-1">
                Priority Access Confirmed!
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Invitation sent to <strong className="text-zinc-950 dark:text-white">{waitlistEmail}</strong>. Includes ₦5,000 launch credit.
              </p>
              <a
                href="https://www.tiktok.com/@irisiming"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#B89035] inline-flex items-center gap-1.5 hover:underline"
              >
                <span>Follow Previews on TikTok</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-2.5">
              <div className="relative flex flex-col sm:flex-row items-center gap-2 p-1.5 rounded-2xl border border-black/15 dark:border-white/20 bg-white dark:bg-zinc-900 shadow-xl focus-within:border-zinc-900 dark:focus-within:border-white transition-all">
                <input
                  type="email"
                  required
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="Enter email for priority pass"
                  className="w-full bg-transparent px-4 py-3 text-sm text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none font-medium"
                />
                <button
                  type="submit"
                  disabled={waitlistStatus === 'loading'}
                  className="w-full sm:w-auto shrink-0 px-6 py-3 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  {waitlistStatus === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Get VIP Pass</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
              {waitlistError && (
                <p className="text-xs text-rose-500 font-medium text-left px-2">{waitlistError}</p>
              )}
              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono px-2">
                <span>⚡ 740+ Insiders in Queue</span>
                <span className="text-[#B89035] font-semibold">₦5,000 Launch Voucher</span>
              </div>
            </form>
          )}
        </div>

        {/* ── REVOLUT-STYLE 3D FANNING CARD DECK ────────────────────────── */}
        <div className="relative w-full max-w-4xl h-[400px] sm:h-[460px] flex items-center justify-center mt-4">
          {/* Card 1: Native Couture (Left Tilt) */}
          <motion.div
            style={{ x: card1X, rotate: card1Rotate }}
            className="absolute w-[260px] sm:w-[300px] h-[360px] sm:h-[420px] rounded-3xl overflow-hidden border border-black/10 dark:border-white/20 bg-white dark:bg-zinc-900 shadow-2xl p-5 flex flex-col justify-between"
          >
            <Image
              src={HERO_CARDS[0].image}
              alt={HERO_CARDS[0].title}
              fill
              className="object-cover brightness-[0.7]"
            />
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase bg-black/70 text-white">
                {HERO_CARDS[0].tag}
              </span>
              <span className="text-[10px] font-mono text-[#d4af37] bg-black/60 px-2 py-0.5 rounded">
                01
              </span>
            </div>
            <div className="relative z-10 text-left text-white">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#d4af37] block mb-0.5">
                {HERO_CARDS[0].subtitle}
              </span>
              <h3 className="text-xl font-bold leading-tight">{HERO_CARDS[0].title}</h3>
            </div>
          </motion.div>

          {/* Card 2: Neo-Lagos Streetwear (Center Elevated) */}
          <motion.div
            style={{ y: card2Y, scale: card2Scale }}
            className="absolute w-[280px] sm:w-[320px] h-[380px] sm:h-[440px] rounded-3xl overflow-hidden border-2 border-black/20 dark:border-white/30 bg-black shadow-2xl p-6 flex flex-col justify-between z-20"
          >
            <Image
              src={HERO_CARDS[1].image}
              alt={HERO_CARDS[1].title}
              fill
              className="object-cover brightness-[0.75]"
            />
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-[9px] font-mono font-bold uppercase bg-white text-black">
                {HERO_CARDS[1].tag}
              </span>
              <span className="text-[10px] font-mono text-white bg-black/70 px-2 py-0.5 rounded">
                02
              </span>
            </div>
            <div className="relative z-10 text-left text-white">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-300 block mb-0.5">
                {HERO_CARDS[1].subtitle}
              </span>
              <h3 className="text-2xl font-black leading-tight">{HERO_CARDS[1].title}</h3>
            </div>
          </motion.div>

          {/* Card 3: Avant-Garde Silks (Right Tilt) */}
          <motion.div
            style={{ x: card3X, rotate: card3Rotate }}
            className="absolute w-[260px] sm:w-[300px] h-[360px] sm:h-[420px] rounded-3xl overflow-hidden border border-black/10 dark:border-white/20 bg-white dark:bg-zinc-900 shadow-2xl p-5 flex flex-col justify-between"
          >
            <Image
              src={HERO_CARDS[2].image}
              alt={HERO_CARDS[2].title}
              fill
              className="object-cover brightness-[0.7]"
            />
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase bg-black/70 text-white">
                {HERO_CARDS[2].tag}
              </span>
              <span className="text-[10px] font-mono text-[#8b5cf6] bg-black/60 px-2 py-0.5 rounded">
                03
              </span>
            </div>
            <div className="relative z-10 text-left text-white">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8b5cf6] block mb-0.5">
                {HERO_CARDS[2].subtitle}
              </span>
              <h3 className="text-xl font-bold leading-tight">{HERO_CARDS[2].title}</h3>
            </div>
          </motion.div>
        </div>

        <div className="mt-8 text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
          ↓ SCROLL DOWN TO EXPLORE THE RUNWAY
        </div>
      </section>

      {/* ── SECTION 2: THE FOUNDING TEE SPOTLIGHT (Revolut Product Card) ─── */}
      <section className="relative z-10 py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="rounded-3xl border border-white/15 bg-black/80 text-white p-8 sm:p-14 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* 3D Product Interactive Card */}
            <div
              className="lg:col-span-7 relative h-[420px] sm:h-[500px] rounded-2xl border border-white/15 bg-zinc-950 flex items-center justify-center p-6 cursor-crosshair group overflow-hidden"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                setMerchTilt({ x: x * 16, y: y * -16 });
              }}
              onMouseLeave={() => setMerchTilt({ x: 0, y: 0 })}
              style={{ perspective: '1000px' }}
            >
              <div
                className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
                style={{
                  transform: `rotateX(${merchTilt.y}deg) rotateY(${merchTilt.x}deg)`,
                }}
              >
                <Image
                  src="/images/merch/irisi-merch-tee.png"
                  alt="ÌRÍSÍ The Complete Nigerian Fit Tee"
                  fill
                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
                />
              </div>

              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white text-black text-[10px] font-mono font-bold tracking-widest uppercase">
                ITEM 001 · FOUNDING GARMENT
              </div>
              <div className="absolute bottom-4 left-4 text-[9px] font-mono text-zinc-400">
                MOVE CURSOR TO TILT IN 3D
              </div>
            </div>

            {/* Technical Specs & Reservation */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <span className="text-[10px] font-mono font-bold tracking-[0.3em] uppercase text-[#B89035] block mb-2">
                IN-HOUSE ATELIER DROP 001
              </span>
              <h2 className="text-3xl sm:text-5xl font-black leading-tight mb-4">
                THE FOUNDING TEE: <br />
                <span className="text-[#B89035]">
                  THE COMPLETE NIGERIAN FIT
                </span>
              </h2>

              <p className="text-zinc-300 text-sm leading-relaxed mb-6 font-light">
                Constructed in Lagos from 300 GSM Heavyweight French Terry cotton.
                Featuring a dropped-shoulder boxy cut and hand-distressed sovereign back insignia.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8 text-xs">
                <div className="p-3.5 rounded-xl border border-white/10 bg-white/5">
                  <span className="text-[9px] font-mono text-zinc-400 block mb-0.5">TEXTILE</span>
                  <span className="font-bold text-white">300 GSM French Terry</span>
                </div>
                <div className="p-3.5 rounded-xl border border-white/10 bg-white/5">
                  <span className="text-[9px] font-mono text-zinc-400 block mb-0.5">SILHOUETTE</span>
                  <span className="font-bold text-white">Lagos Boxy Cut</span>
                </div>
                <div className="p-3.5 rounded-xl border border-white/10 bg-white/5">
                  <span className="text-[9px] font-mono text-zinc-400 block mb-0.5">PRINT</span>
                  <span className="font-bold text-white">Distressed Sovereign Ink</span>
                </div>
                <div className="p-3.5 rounded-xl border border-white/10 bg-white/5">
                  <span className="text-[9px] font-mono text-zinc-400 block mb-0.5">ALLOCATION</span>
                  <span className="font-bold text-[#B89035]">100 Units Only</span>
                </div>
              </div>

              <a
                href="#waitlist"
                className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-xl"
              >
                <span>Reserve On Waitlist</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: DESIGNER ONBOARDING (Revolut B2B Architecture) ─────── */}
      <section className="relative z-10 py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14 text-white">
          <span className="text-[10px] font-mono font-bold tracking-[0.3em] uppercase text-[#B89035] block mb-2">
            FOUNDING MERCHANT INVITATION
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            ARE YOU SHAPING NIGERIAN STYLE?
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Eliminate chaotic Instagram DMs, fake bank transfer screenshots, and manual waybills.
            Partner with ÌRÍSÍ as a Founding Fashion House.
          </p>
        </div>

        {/* 4 Feature Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            {
              icon: ShieldCheck,
              title: 'Automated Escrow',
              desc: 'Paystack card, USSD, and transfer settlements. Zero chargeback risks.',
            },
            {
              icon: Zap,
              title: 'Nationwide Logistics',
              desc: 'Automated waybills with doorstep pickups in Lagos, Abuja, and worldwide.',
            },
            {
              icon: Layers,
              title: 'Sovereign Atelier',
              desc: 'Your brand receives an editorial luxury storefront, not a generic commodity grid.',
            },
            {
              icon: Sparkles,
              title: '0% Platform Fee',
              desc: 'Founding merchant privilege: 0% marketplace commission for the first 25 approved brands.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md flex flex-col justify-between text-white"
            >
              <div>
                <item.icon className="w-6 h-6 text-[#B89035] mb-4" />
                <h3 className="font-bold text-base mb-2">{item.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">{item.desc}</p>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 mt-6 block uppercase tracking-wider">
                PILLAR 0{i + 1}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => setIsVendorModalOpen(true)}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-black font-bold text-sm uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-xl"
          >
            <Store className="w-4 h-4" />
            <span>Apply As A Founding Fashion House</span>
          </button>
        </div>
      </section>

      {/* ── FOOTER & FOUNDER KEY ─────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/10 py-8 px-6 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
        <div>
          © 2026 ÌRÍSÍ TECHNOLOGIES LTD · LAGOS, NIGERIA. ALL RIGHTS RESERVED.
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://www.tiktok.com/@irisiming"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            TIKTOK
          </a>
          <button
            onClick={() => setIsVendorModalOpen(true)}
            className="hover:text-white transition-colors"
          >
            MERCHANT ADMISSION
          </button>
          <button
            onClick={() => setIsUnlockModalOpen(true)}
            className="hover:text-white transition-colors flex items-center gap-1 text-[10px]"
            title="Founder Gate Unlock"
          >
            <Lock className="w-3 h-3" />
            <span>FOUNDER KEY</span>
          </button>
        </div>
      </footer>

      {/* ── MODAL 1: FOUNDER UNLOCK PASSCODE ─────────────────────────────── */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-zinc-950 border border-white/20 rounded-2xl p-6 text-center text-white shadow-2xl">
            <button
              onClick={() => setIsUnlockModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3 text-[#B89035]">
              <Unlock className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-bold mb-1">Founder Preview Unlock</h3>
            <p className="text-xs text-zinc-400 mb-4 font-light">
              Enter passcode to bypass coming-soon mode and inspect the full store.
            </p>

            <form onSubmit={handleUnlockSubmit} className="space-y-3">
              <input
                type="password"
                required
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Passcode (e.g. irisi2026)"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white text-center tracking-widest focus:outline-none focus:border-white"
              />
              {unlockStatus === 'error' && (
                <p className="text-xs text-rose-400">Incorrect passcode.</p>
              )}
              <button
                type="submit"
                disabled={unlockStatus === 'loading'}
                className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all"
              >
                {unlockStatus === 'loading' ? 'Verifying...' : 'Unlock Full Store'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: VENDOR APPLICATION MODAL ────────────────────────────── */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-white/20 rounded-3xl p-6 sm:p-8 text-left text-white shadow-2xl my-8">
            <button
              onClick={() => setIsVendorModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {vendorStatus === 'success' ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-[#B89035] text-black flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Application Received!</h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6 max-w-md mx-auto">
                  {vendorMessage ||
                    'Thank you. Our curatorial council will review your catalog and reach out via WhatsApp within 48 hours.'}
                </p>
                <button
                  onClick={() => setIsVendorModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs tracking-wider"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <div>
                <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-[#B89035] uppercase block mb-1">
                  EXCLUSIVE ONBOARDING
                </span>
                <h3 className="text-2xl font-black mb-1">Apply As A Founding Brand</h3>
                <p className="text-xs text-zinc-400 mb-6 font-light">
                  Tell us about your brand. We are onboarding 25 founding designers for Drop 001.
                </p>

                <form onSubmit={handleVendorSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                        Brand Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={vendorForm.brandName}
                        onChange={(e) => setVendorForm({ ...vendorForm, brandName: e.target.value })}
                        placeholder="e.g. Lagos Atelier"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                        Instagram Handle *
                      </label>
                      <input
                        type="text"
                        required
                        value={vendorForm.instagramHandle}
                        onChange={(e) => setVendorForm({ ...vendorForm, instagramHandle: e.target.value })}
                        placeholder="@yourbrand"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                        Discipline
                      </label>
                      <select
                        value={vendorForm.category}
                        onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm text-white focus:outline-none focus:border-white"
                      >
                        <option>Streetwear & Ready-to-Wear</option>
                        <option>Agbada & Native Couture</option>
                        <option>Avant-Garde & Eveningwear</option>
                        <option>Footwear & Leather Goods</option>
                        <option>Bags & Accessories</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                        Price Bracket
                      </label>
                      <select
                        value={vendorForm.priceRange}
                        onChange={(e) => setVendorForm({ ...vendorForm, priceRange: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm text-white focus:outline-none focus:border-white"
                      >
                        <option>₦20,000 – ₦50,000</option>
                        <option>₦50,000 – ₦150,000</option>
                        <option>₦150,000 – ₦350,000</option>
                        <option>₦350,000+</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                        WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={vendorForm.founderPhone}
                        onChange={(e) => setVendorForm({ ...vendorForm, founderPhone: e.target.value })}
                        placeholder="080 1234 5678"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={vendorForm.founderEmail}
                        onChange={(e) => setVendorForm({ ...vendorForm, founderEmail: e.target.value })}
                        placeholder="founder@brand.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                      Lookbook Link (Drive, Web, or Dropbox)
                    </label>
                    <input
                      type="url"
                      value={vendorForm.lookbookUrl}
                      onChange={(e) => setVendorForm({ ...vendorForm, lookbookUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white"
                    />
                  </div>

                  {vendorMessage && (
                    <p className="text-xs text-rose-400 font-medium">{vendorMessage}</p>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={vendorStatus === 'loading'}
                      className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-xl"
                    >
                      {vendorStatus === 'loading' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Submit Application</span>
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
