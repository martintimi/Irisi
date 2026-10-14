'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import AntigravityDotField from '@/components/landing/AntigravityDotField';
import {
  ArrowRight,
  CheckCircle2,
  Volume2,
  VolumeX,
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

// Dynamic App Features for the rotating subtitle (Fade In / Fade Out)
const APP_FEATURES = [
  'Shop directly from top verified Nigerian fashion brands and designers in one app.',
  'Order bespoke native fits, Agbada, and tailored 2-pieces crafted to your exact body measurements.',
  'Nationwide doorstep delivery across Nigeria, plus reliable worldwide shipping for the diaspora.',
  'Secure escrow payments with buyer protection — pay safely with zero fraud or failed orders.',
  'Exclusive streetwear drops, limited capsule collections, and ready-to-wear pieces released daily.',
];

// Department Category Tracks for the 3 Fanning Cards (Every category image + text telling the category)
const DEPARTMENT_CARD_TRACKS = [
  // Card 1: Native & Cultural Wear (Left Card)
  {
    department: 'NATIVE BESPOKE',
    categories: [
      {
        id: 'senator',
        name: 'Senator & Kaftan Sets',
        image: '/images/uploaded/senatorformen.jpeg',
      },
      {
        id: 'agbada',
        name: 'Grand Agbada 3-Piece',
        image: '/images/uploaded/agbadaformen.jpeg',
      },
      {
        id: 'boubou',
        name: 'Boubou & Kaftans',
        image: '/images/editorial/nigerian_female_couture.jpg',
      },
      {
        id: 'jalabiya',
        name: 'Jalabiya & Robes',
        image: '/images/uploaded/jalabmen.jpeg',
      },
      {
        id: 'lace-ankara',
        name: 'Lace & Ankara Sets',
        image: '/images/editorial/nigerian_female_model.jpg',
      },
      {
        id: 'fila',
        name: 'Aso-Oke Fila & Caps',
        image: '/images/products/Cap1.png',
      },
      {
        id: 'abaya',
        name: 'Abaya & Modest Kimonos',
        image: '/images/editorial/female_dress.jpg',
      },
      {
        id: 'executive-senator',
        name: 'Executive Senator Fits',
        image: '/images/editorial/male_senator.jpg',
      },
    ],
  },

  // Card 2: Nigerian Streetwear & Contemporary Drops (Center Elevated Card)
  {
    department: 'STREET CULTURE',
    categories: [
      {
        id: 'hoodies',
        name: 'Hoodies & Sweatshirts',
        image: '/images/uploaded/prod-1788316482065-1-489.jpg',
      },
      {
        id: 'tshirts',
        name: 'T-Shirts & Graphic Tees',
        image: '/images/uploaded/t-shirtsandgraphic.jpeg',
      },
      {
        id: 'jeans',
        name: 'Baggy Jeans & Denim',
        image: '/images/products/BaggyJean.jpg',
      },
      {
        id: 'women-tops',
        name: 'Tops & Corsets',
        image: '/images/uploaded/Streetwear&topsWomen.jpeg',
      },
      {
        id: 'cargo',
        name: 'Utility Cargo Sets',
        image: '/images/uploaded/pantsandcargo.jpeg',
      },
      {
        id: 'coord',
        name: 'Two-Piece Matching Sets',
        image: '/images/categories/women_coord.jpg',
      },
      {
        id: 'jackets',
        name: 'Jackets & Street Outerwear',
        image: '/images/editorial/modern_male_streetwear.jpg',
      },
      {
        id: 'polos',
        name: 'Polos & Casual Shirts',
        image: '/images/uploaded/poloandshirt.jpeg',
      },
      {
        id: 'dresses',
        name: 'Dresses & Evening Gowns',
        image: '/images/categories/dressesforwomen.jpeg',
      },
      {
        id: 'skirts',
        name: 'Skirts & Mini Skirts',
        image: '/images/categories/skirtandminishirts.jpeg',
      },
      {
        id: 'loungewear',
        name: 'Loungewear & Sleepwear',
        image: '/images/products/women_loungewear_luxury.jpg',
      },
    ],
  },

  // Card 3: Footwear, Bags & Accessories (Right Card)
  {
    department: 'FOOTWEAR & ACCESSORIES',
    categories: [
      {
        id: 'slides',
        name: 'Slides, Palms & Slippers',
        image: '/images/uploaded/sides_palm.jpeg',
      },
      {
        id: 'shoes',
        name: 'Sneakers & Casual Shoes',
        image: '/images/uploaded/shoefootwareformen.jpeg',
      },
      {
        id: 'heels',
        name: 'Designer Heels & Pumps',
        image: '/images/categories/women_heels.jpg',
      },
      {
        id: 'crocs',
        name: 'Crocs & Foam Clogs',
        image: '/images/uploaded/crocsformen.jpeg',
      },
      {
        id: 'women-bags',
        name: 'Handbags & Leather Totes',
        image: '/images/uploaded/LeaderbagsWomen.jpeg',
      },
      {
        id: 'men-bags',
        name: 'Backpacks & Travel Bags',
        image: '/images/uploaded/leaderBags.jpeg',
      },
      {
        id: 'jewelry',
        name: 'Cuban Chains & Jewelry',
        image: '/images/uploaded/WomenJewelry.jpeg',
      },
      {
        id: 'watches',
        name: 'Luxury Watches',
        image: '/images/uploaded/luxerywatches.jpeg',
      },
      {
        id: 'sunglasses',
        name: 'Sunglasses & Eyewear',
        image: '/images/uploaded/sunglassesandeyewear.jpeg',
      },
      {
        id: 'caps',
        name: 'Caps, Hats & Beanies',
        image: '/images/uploaded/capshatbeanies.jpeg',
      },
    ],
  },
];

export default function ComingSoonPage() {
  // ── States ─────────────────────────────────────────────────────────────
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [waitlistError, setWaitlistError] = useState('');
  const [passNumber, setPassNumber] = useState('00742');

  // Dynamic App Feature Ticker (Changes every 3.8s with fade in / fade out)
  const [featureIndex, setFeatureIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setFeatureIndex((prev) => (prev + 1) % APP_FEATURES.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  // Dynamic Category Carousel for the 3 Department Cards (Changes every 3.0s with crossfade)
  const [cardCategoryIndex, setCardCategoryIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCardCategoryIndex((prev) => prev + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Screen width tracking for responsive layout
  const [screenWidth, setScreenWidth] = useState<number>(1200);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setScreenWidth(window.innerWidth);
      const handleResize = () => setScreenWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
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

  // 3D Merch Mouse Tilt State & Colorway Switcher
  const [merchTilt, setMerchTilt] = useState({ x: 0, y: 0 });
  const [selectedMerchColor, setSelectedMerchColor] = useState<'black' | 'white'>('black');

  // Auto-cycle Merch Tee Colorway (Black <-> White every 3.8s) so visitors see both editions
  useEffect(() => {
    const timer = setInterval(() => {
      setSelectedMerchColor((prev) => (prev === 'black' ? 'white' : 'black'));
    }, 3800);
    return () => clearInterval(timer);
  }, []);

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

  // Card deck fanning translations based on scroll physics (Revolut-style expansion)
  const isMobile = screenWidth < 640;
  const isTablet = screenWidth >= 640 && screenWidth < 1024;

  const card1X = useTransform(
    smoothProgress,
    [0, 0.25],
    isMobile ? [-65, -125] : isTablet ? [-110, -220] : [-135, -310]
  );
  const card1Rotate = useTransform(smoothProgress, [0, 0.25], [-11, -5]);

  const card2Y = useTransform(smoothProgress, [0, 0.25], [0, -28]);
  const card2Scale = useTransform(smoothProgress, [0, 0.25], isMobile ? [1.01, 1.05] : [1.02, 1.08]);

  const card3X = useTransform(
    smoothProgress,
    [0, 0.25],
    isMobile ? [65, 125] : isTablet ? [110, 220] : [135, 310]
  );
  const card3Rotate = useTransform(smoothProgress, [0, 0.25], [11, 5]);

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
      {/* ── FLOATING NAVIGATION ────────────────────────────────────────── */}
      <header className="fixed top-3 sm:top-6 inset-x-0 z-50 max-w-7xl mx-auto px-3 sm:px-8 pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-between px-3.5 sm:px-6 py-2 sm:py-3.5 rounded-full bg-white/90 dark:bg-black/90 border border-black/10 dark:border-white/15 backdrop-blur-xl shadow-lg shadow-black/5">
          {/* Logo & Brand Wordmark */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-black/15 dark:border-white/20 bg-black flex items-center justify-center shadow-sm shrink-0">
              <Image
                src="/images/logo/irisi-icon.png"
                alt="ÌRÍSÍ Emblem"
                width={44}
                height={44}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <span className="font-editorial text-xl sm:text-3xl tracking-[0.25em] font-normal uppercase text-zinc-950 dark:text-white select-none">
              ÌRÍSÍ
            </span>
          </div>

          {/* Action Button */}
          <button
            onClick={() => setIsVendorModalOpen(true)}
            className="px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-medium text-[11px] sm:text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all shrink-0"
          >
            Apply As Brand
          </button>
        </div>
      </header>

      {/* ── INTERACTIVE ANTIGRAVITY CELESTIAL DOT FIELD ───────────────────── */}
      <div className="absolute top-0 inset-x-0 h-[115vh] overflow-hidden pointer-events-none z-0">
        <AntigravityDotField />
      </div>

      {/* ── SECTION 1: LUMINOUS REVOLUT HERO ─────────────────────────────── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-4 pt-28 sm:pt-32 pb-16 z-10 w-full max-w-7xl mx-auto sm:px-8 lg:px-12">
        {/* Simple, Clean Early Access Pill (Fits on mobile without wrapping) */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-black/10 dark:border-white/15 bg-black/[0.04] dark:bg-white/[0.06] text-[10px] font-mono font-medium tracking-[0.16em] uppercase text-zinc-700 dark:text-zinc-300 mb-6 z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B89035] animate-ping" />
          <span>COMING SOON · EARLY ACCESS PASS</span>
        </div>

        {/* Stadium-Scale Editorial Headline (Zero Bold, Matching Platform) */}
        <div className="relative group mb-6 max-w-5xl z-10">
          <motion.h1
            style={{ color: textColor }}
            className="font-editorial text-4xl sm:text-6xl md:text-7xl lg:text-[5.25rem] font-normal tracking-tight leading-[1.08] select-none"
          >
            {/* Line 1: THE COMPLETE with refined spring hover */}
            <span className="inline-flex flex-wrap justify-center gap-x-3 sm:gap-x-5">
              <motion.span
                className="inline-block cursor-default"
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              >
                THE
              </motion.span>
              <motion.span
                className="inline-block cursor-default"
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              >
                COMPLETE
              </motion.span>
            </span>
            <br />

            {/* Line 2: NIGERIAN FIT. in graceful editorial italic gold */}
            <span className="relative inline-block mt-1 sm:mt-2">
              <motion.span
                className="inline-block italic font-normal text-[#B89035] dark:text-[#E6C367] cursor-default"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              >
                NIGERIAN FIT.
              </motion.span>

              {/* Minimalist luxury gold hairline */}
              <span className="block mt-2 sm:mt-2.5 mx-auto w-24 sm:w-36 h-[1.5px] rounded-full bg-gradient-to-r from-transparent via-[#D4AF37]/70 to-transparent" />
            </span>
          </motion.h1>
        </div>

        {/* Dynamic App Feature Subtitle with Smooth Fade In / Fade Out */}
        <div className="w-full max-w-3xl mx-auto min-h-[58px] sm:min-h-[48px] flex items-center justify-center mb-8 px-4 z-10">
          <AnimatePresence mode="wait">
            <motion.p
              key={featureIndex}
              initial={{ opacity: 0, y: 7 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -7 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base md:text-lg font-normal leading-relaxed text-center"
            >
              {APP_FEATURES[featureIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Priority Waitlist Input Box */}
        <div className="w-full max-w-md mx-auto mb-16" id="waitlist">
          {waitlistStatus === 'success' ? (
            /* Digital VIP Member Card */
            <div className="p-6 rounded-2xl border border-[#B89035]/40 bg-white dark:bg-zinc-900 shadow-2xl text-left">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono tracking-widest text-[#B89035] font-medium">
                  SOVEREIGN PASS #{passNumber}
                </span>
                <Award className="w-5 h-5 text-[#B89035]" />
              </div>
              <h3 className="font-editorial text-2xl font-normal text-zinc-950 dark:text-white mb-1">
                Priority Access Confirmed!
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Invitation sent to <strong className="text-zinc-950 dark:text-white font-medium">{waitlistEmail}</strong>. Includes ₦5,000 launch credit.
              </p>
              <a
                href="https://www.tiktok.com/@irisiming"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-[#B89035] inline-flex items-center gap-1.5 hover:underline"
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
                  className="w-full bg-transparent px-4 py-3 text-sm text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none font-normal"
                />
                <button
                  type="submit"
                  disabled={waitlistStatus === 'loading'}
                  className="w-full sm:w-auto shrink-0 px-6 py-3 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
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
                <span className="text-[#B89035] font-medium">₦5,000 Launch Voucher</span>
              </div>
            </form>
          )}
        </div>

        {/* ── 3D FANNING DEPARTMENT CATEGORY CAROUSEL ─────────────────── */}
        {(() => {
          const nativeTrack = DEPARTMENT_CARD_TRACKS[0];
          const streetTrack = DEPARTMENT_CARD_TRACKS[1];
          const womenTrack = DEPARTMENT_CARD_TRACKS[2];

          const currentNative = nativeTrack.categories[cardCategoryIndex % nativeTrack.categories.length];
          const currentStreet = streetTrack.categories[cardCategoryIndex % streetTrack.categories.length];
          const currentWomen = womenTrack.categories[cardCategoryIndex % womenTrack.categories.length];

          return (
            <div className="relative w-full max-w-6xl h-[360px] sm:h-[510px] md:h-[560px] lg:h-[590px] flex items-center justify-center mt-6 mb-2">
              {/* Card 1: Native & Cultural Wear (Left Fanned Card - Expands On Scroll) */}
              <motion.div
                style={{ x: card1X, rotate: card1Rotate }}
                className="absolute w-[190px] sm:w-[330px] md:w-[370px] lg:w-[390px] h-[290px] sm:h-[460px] md:h-[510px] lg:h-[540px] rounded-2xl sm:rounded-3xl overflow-hidden border border-black/10 dark:border-white/20 bg-zinc-950 shadow-2xl select-none"
              >
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={currentNative.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="absolute inset-0 flex flex-col justify-end p-4 sm:p-7 select-none"
                  >
                    <Image
                      src={currentNative.image}
                      alt={currentNative.name}
                      fill
                      sizes="(max-width: 640px) 190px, (max-width: 1024px) 370px, 390px"
                      className="object-cover brightness-[0.78]"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/10 pointer-events-none" />

                    {/* Just the image and the text telling the category */}
                    <div className="relative z-10 text-left text-white">
                      <h3 className="font-editorial text-lg sm:text-3xl font-normal leading-tight drop-shadow-md">
                        {currentNative.name}
                      </h3>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* Card 2: Nigerian Streetwear & Drops (Center Card - Elevated On Scroll) */}
              <motion.div
                style={{ y: card2Y, scale: card2Scale }}
                className="absolute w-[210px] sm:w-[350px] md:w-[390px] lg:w-[410px] h-[315px] sm:h-[480px] md:h-[530px] lg:h-[560px] rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-black/20 dark:border-white/30 bg-zinc-950 shadow-2xl z-20 select-none"
              >
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={currentStreet.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="absolute inset-0 flex flex-col justify-end p-4 sm:p-8 select-none"
                  >
                    <Image
                      src={currentStreet.image}
                      alt={currentStreet.name}
                      fill
                      sizes="(max-width: 640px) 210px, (max-width: 1024px) 390px, 410px"
                      className="object-cover brightness-[0.8]"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/10 pointer-events-none" />

                    {/* Just the image and the text telling the category */}
                    <div className="relative z-10 text-left text-white">
                      <h3 className="font-editorial text-xl sm:text-3xl font-normal leading-tight drop-shadow-md">
                        {currentStreet.name}
                      </h3>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* Card 3: Footwear, Bags & Accessories (Right Fanned Card - Expands On Scroll) */}
              <motion.div
                style={{ x: card3X, rotate: card3Rotate }}
                className="absolute w-[190px] sm:w-[330px] md:w-[370px] lg:w-[390px] h-[290px] sm:h-[460px] md:h-[510px] lg:h-[540px] rounded-2xl sm:rounded-3xl overflow-hidden border border-black/10 dark:border-white/20 bg-zinc-950 shadow-2xl select-none"
              >
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={currentWomen.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="absolute inset-0 flex flex-col justify-end p-4 sm:p-7 select-none"
                  >
                    <Image
                      src={currentWomen.image}
                      alt={currentWomen.name}
                      fill
                      sizes="(max-width: 640px) 190px, (max-width: 1024px) 370px, 390px"
                      className="object-cover brightness-[0.78]"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/10 pointer-events-none" />

                    {/* Just the image and the text telling the category */}
                    <div className="relative z-10 text-left text-white">
                      <h3 className="font-editorial text-lg sm:text-3xl font-normal leading-tight drop-shadow-md">
                        {currentWomen.name}
                      </h3>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          );
        })()}

        <div className="mt-8 text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
          ↓ SCROLL DOWN TO EXPLORE THE RUNWAY
        </div>
      </section>

      {/* ── SECTION 2: OFFICIAL COMPANY MERCH SPOTLIGHT ─────────────────── */}
      <section className="relative z-10 py-16 sm:py-24 px-1.5 sm:px-8 lg:px-12 w-full max-w-7xl mx-auto">
        <div className="rounded-2xl sm:rounded-3xl border border-white/15 bg-black/80 text-white p-3 sm:p-14 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
            {/* 3D Product Interactive Card with Black & White Colorway Switcher */}
            <div
              className="lg:col-span-7 relative w-full h-[450px] sm:h-[510px] rounded-xl sm:rounded-2xl border border-white/15 bg-zinc-950 flex items-center justify-center p-2 sm:p-6 cursor-crosshair group overflow-hidden"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                setMerchTilt({ x: x * 16, y: y * -16 });
              }}
              onMouseLeave={() => setMerchTilt({ x: 0, y: 0 })}
              style={{ perspective: '1000px' }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedMerchColor}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
                  style={{
                    transform: `rotateX(${merchTilt.y}deg) rotateY(${merchTilt.x}deg)`,
                  }}
                >
                  <Image
                    src={selectedMerchColor === 'black' ? '/images/merch/irisi-merch-tee-black.png' : '/images/merch/irisi-merch-tee.png'}
                    alt={`ÌRÍSÍ Official Company Merch Tee - ${selectedMerchColor === 'black' ? 'Onyx Black' : 'Bone White'} Edition`}
                    fill
                    className="object-contain p-2 group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* Top-Left Edition Tag (Hidden on mobile to eliminate overlap with colorway toggle) */}
              <div className="hidden sm:flex absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-[10px] font-mono font-medium tracking-widest uppercase items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B89035] animate-pulse" />
                <span>OFFICIAL APPAREL · {selectedMerchColor === 'black' ? 'ONYX BLACK' : 'BONE WHITE'}</span>
              </div>

              {/* Colorway Switcher Buttons (Black / White) */}
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/15 rounded-full p-1 z-20">
                <button
                  type="button"
                  onClick={() => setSelectedMerchColor('black')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    selectedMerchColor === 'black'
                      ? 'bg-zinc-800 text-white border border-white/30 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-black border border-white/40 inline-block" />
                  <span>Black</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMerchColor('white')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    selectedMerchColor === 'white'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white border border-black/20 inline-block" />
                  <span>White</span>
                </button>
              </div>

              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 text-[8px] sm:text-[9px] font-mono text-zinc-400">
                MOVE CURSOR TO TILT IN 3D · AUTO-CYCLES BLACK & WHITE EDITIONS
              </div>
            </div>

            {/* Mature, Elevated Official Merch Editorial */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <span className="text-[10px] font-mono font-medium tracking-[0.3em] uppercase text-[#B89035] block mb-2">
                OFFICIAL APPAREL PREVIEW
              </span>
              <h2 className="font-editorial text-3xl sm:text-5xl font-normal leading-tight mb-4 tracking-tight">
                The Ìrísí Signature Tee: <br />
                <span className="italic text-[#B89035] dark:text-[#E6C367]">
                  First Look
                </span>
              </h2>

              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-4 font-light">
                Alongside collections from Nigeria’s premier fashion houses, ÌRÍSÍ will present our own official label merchandise.
              </p>

              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6 font-light">
                Currently in development, this preview introduces the silhouette and graphic identity. Release timing and private allocations will be shared first with members on the priority waitlist.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8 text-xs">
                <div className="p-3.5 rounded-xl border border-white/10 bg-white/5">
                  <span className="text-[9px] font-mono text-zinc-400 block mb-0.5">LABEL</span>
                  <span className="font-medium text-white">ÌRÍSÍ Official</span>
                </div>
                <div className="p-3.5 rounded-xl border border-white/10 bg-white/5">
                  <span className="text-[9px] font-mono text-zinc-400 block mb-0.5">PALETTE</span>
                  <span className="font-medium text-white">Onyx Black & Bone White</span>
                </div>
                <div className="p-3.5 rounded-xl border border-white/10 bg-white/5">
                  <span className="text-[9px] font-mono text-zinc-400 block mb-0.5">PHASE</span>
                  <span className="font-medium text-[#B89035]">In Development</span>
                </div>
                <div className="p-3.5 rounded-xl border border-white/10 bg-white/5">
                  <span className="text-[9px] font-mono text-zinc-400 block mb-0.5">ACCESS</span>
                  <span className="font-medium text-white">Priority Waitlist First</span>
                </div>
              </div>

              <a
                href="#waitlist"
                className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-xl bg-white text-black font-medium text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-xl"
              >
                <span>Join Priority Waitlist</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: DESIGNER ONBOARDING (Revolut B2B Architecture) ─────── */}
      <section className="relative z-10 py-24 px-4 sm:px-8 lg:px-12 w-full max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14 text-white">
          <span className="text-[10px] font-mono font-medium tracking-[0.3em] uppercase text-[#B89035] block mb-2">
            FOUNDING MERCHANT INVITATION
          </span>
          <h2 className="font-editorial text-3xl sm:text-5xl font-normal tracking-tight mb-4">
            Are You Shaping Nigerian Style?
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
              desc: 'Automated waybills with doorstep pickups across Nigeria and worldwide shipping.',
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
                <h3 className="font-editorial text-xl sm:text-2xl font-normal mb-2">{item.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">{item.desc}</p>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 mt-6 block uppercase tracking-wider">
                PILLAR 0{i + 1}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center flex justify-center">
          <button
            onClick={() => setIsVendorModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 sm:px-8 sm:py-4 rounded-xl bg-white text-black font-medium text-xs sm:text-sm uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-xl w-auto max-w-fit mx-auto"
          >
            <Store className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Apply As A Founding Fashion House</span>
            <span className="sm:hidden">Apply As Founder</span>
          </button>
        </div>
      </section>

      {/* ── FOOTER & FOUNDER KEY ─────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/10 py-8 px-6 sm:px-8 lg:px-12 w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
        <div>
          © 2026 ÌRÍSÍ TECHNOLOGIES LTD. ALL RIGHTS RESERVED.
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

            <h3 className="font-editorial text-2xl font-normal mb-1">Founder Preview Unlock</h3>
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
                className="w-full py-2.5 rounded-xl bg-white text-black font-medium text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all"
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
                <h3 className="font-editorial text-3xl font-normal mb-2">Application Received!</h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6 max-w-md mx-auto">
                  {vendorMessage ||
                    'Thank you. Our curatorial council will review your catalog and reach out via WhatsApp within 48 hours.'}
                </p>
                <button
                  onClick={() => setIsVendorModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs tracking-wider"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <div>
                <span className="text-[10px] font-mono font-medium tracking-[0.25em] text-[#B89035] uppercase block mb-1">
                  EXCLUSIVE ONBOARDING
                </span>
                <h3 className="font-editorial text-2xl sm:text-3xl font-normal mb-1">Apply As A Founding Brand</h3>
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
                        placeholder="e.g. Veyra Atelier"
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
                      className="w-full py-3.5 rounded-xl bg-white text-black font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-xl"
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
