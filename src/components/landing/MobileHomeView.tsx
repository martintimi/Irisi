'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/lib/store/useStore';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, ArrowUpRight, Plus, Check,
  ShieldCheck, Truck, Lock, Sun, Moon, Search,
  Crown, Flame
} from 'lucide-react';
import MobileStoriesRow from '@/components/mobile/MobileStoriesRow';
import MobileQuickBuyDrawer from '@/components/mobile/MobileQuickBuyDrawer';

// Reusable animate-on-scroll wrapper
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Auto-transitioning category card that displays image based on synchronized sequence
function AnimatedCategoryCard({
  dept,
  idx,
  currentImgIdx,
}: {
  dept: { title: string; sub: string; slug: string; images: string[] };
  idx: number;
  currentImgIdx: number;
}) {
  const activeImage = dept.images[currentImgIdx % dept.images.length];

  return (
    <FadeUp delay={idx * 0.05}>
      <Link
        href={`/category/${dept.slug}`}
        className="relative h-48 rounded-2xl overflow-hidden border border-[var(--border-subtle)] shadow-sm group block bg-black active:scale-[0.98] transition-transform"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeImage}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={activeImage}
              alt={dept.title}
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </motion.div>
        </AnimatePresence>

        {/* Gradient Overlay for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent pointer-events-none" />

        {/* Shimmer / Dots indicator top-right */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-full">
          {dept.images.slice(0, 4).map((_, dotIdx) => (
            <span
              key={dotIdx}
              className={`h-1 rounded-full transition-all duration-300 ${
                dotIdx === (currentImgIdx % 4) ? 'w-2.5 bg-[var(--gold-accent)]' : 'w-1 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Card Titles */}
        <div className="absolute bottom-3 inset-x-3 z-10">
          <span className="text-[9px] font-mono-luxury text-zinc-300 uppercase font-bold block drop-shadow-sm">
            {dept.sub}
          </span>
          <span className="font-editorial text-sm font-bold text-white flex items-center justify-between">
            <span>{dept.title}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-80 text-[var(--gold-accent)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>
      </Link>
    </FadeUp>
  );
}

export default function MobileHomeView() {
  const {
    allProducts,
    followedVendors,
    toggleFollowVendor,
    setOutfitItem,
    theme,
    toggleTheme,
    fetchProductsFromDb,
  } = useStore();

  useEffect(() => { fetchProductsFromDb(); }, [fetchProductsFromDb]);

  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);

  const heroSlides = [
    {
      title: 'Nigerian Craft.\nEscrow Secured.',
      tagline: 'CURATED READY-TO-WEAR',
      image: '/images/products/BlackAgbada.jpg',
      badge: 'Lagos Couture Drop',
      cta: '/shop',
    },
    {
      title: 'Streetwear Sets\n480GSM Heavyweight',
      tagline: 'URBAN LAGOS ATELIERS',
      image: '/images/products/BlackTrapStarHoodie.jpg',
      badge: 'New Drop',
      cta: '/shop',
    },
    {
      title: 'Handcrafted\nLeather Footwear',
      tagline: 'ARTISANAL SLIDES & MULES',
      image: '/images/products/UnisexSlides.jpg',
      badge: 'Footwear Drop',
      cta: '/shop',
    },
  ];

  useEffect(() => {
    const t = setInterval(() => setActiveHeroIndex(p => (p + 1) % heroSlides.length), 5000);
    return () => clearInterval(t);
  }, [heroSlides.length]);

  const safeFollowed = Array.isArray(followedVendors) ? followedVendors : [];
  const editorsPicks = (allProducts || []).slice(0, 3);

  const [liveAteliers, setLiveAteliers] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/vendors/featured')
      .then((r) => r.json())
      .then((d) => {
        if (isMounted && d.success && Array.isArray(d.ateliers) && d.ateliers.length > 0) {
          setLiveAteliers(
            d.ateliers.map((a: any) => ({
              id: a.id,
              name: a.name,
              origin: a.location,
              tagline: a.focus,
              image: a.images?.[0] || '/images/products/BlackTrapStarHoodie.jpg',
              dispatch: '24–48h'
            }))
          );
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const featuredAteliers = liveAteliers.length > 0 ? liveAteliers : [];

  const departments = [
    {
      title: 'Shirts & Tops',
      sub: 'Casual & Button-Downs',
      slug: 'shirts',
      cat: 'tops',
      images: [
        '/images/editorial/male_shirt.jpg',
        '/images/editorial/female_shirt.jpg',
        '/images/products/CasualPoshMark.jpg',
      ]
    },
    {
      title: 'Streetwear Drops',
      sub: 'Hoodies & Urban Sets',
      slug: 'streetwear',
      cat: 'outerwear',
      images: [
        '/images/products/BlackTrapStarHoodie.jpg',
        '/images/products/BlueAndWhiteLosAngelisHoddie.jpg',
        '/images/products/BrownHoodie.jpg',
        '/images/products/LVhoodie.jpg',
        '/images/products/WhiteNdBrownHoodie.jpg',
      ]
    },
    {
      title: 'Native & Agbada',
      sub: 'Senator Sets & Agbada',
      slug: 'native',
      cat: 'tops',
      images: [
        '/images/products/BlackAgbada.jpg',
        '/images/products/BlackSenator.jpg',
        '/images/products/PurpleAgbada.jpg',
        '/images/products/SenatorBrown.jpg',
        '/images/products/SecondAgbada.jpg',
        '/images/products/BlueSenator.png',
      ]
    },
    {
      title: 'Handcrafted Footwear',
      sub: 'Leather Slides & Palms',
      slug: 'footwear',
      cat: 'footwear',
      images: [
        '/images/products/UnisexSlides.jpg',
        '/images/products/AdiletteAquaSlides.jpg',
        '/images/products/BlackSmartShoes.jpg',
        '/images/products/AdiletteAquaSlides2.jpg',
        '/images/products/ShoeUnisex2.jpg',
      ]
    },
    {
      title: 'Trousers & Sets',
      sub: 'Bespoke Pants & Denim',
      slug: 'trousers',
      cat: 'bottoms',
      images: [
        '/images/products/BaggyJean.jpg',
        '/images/products/GreyCargoPantsHollister.jpg',
        '/images/products/MenCasualJoggers.jpg',
        '/images/products/MenVintageCasualJean.jpg',
        '/images/products/TeryWidePant.jpg',
      ]
    },
    {
      title: 'Caps & Accessories',
      sub: 'Fila Caps & Streetwear',
      slug: 'accessories',
      cat: 'accessories',
      images: [
        '/images/products/Cap1.png',
        '/images/products/GucciCap.jpg',
        '/images/products/NYCap.jpg',
        '/images/products/CarmoCap.jpg',
        '/images/products/PoloCap.jpg',
      ]
    },
  ];

  // Synchronized sequential image rotation: 1 card changes at a time in sequence (0 -> 1 -> 2 -> 3 -> 0...)
  const [cardImageIndices, setCardImageIndices] = useState([0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      const targetCard = step % departments.length;
      setCardImageIndices((prev) => {
        const next = [...prev];
        next[targetCard] = (next[targetCard] + 1) % departments[targetCard].images.length;
        return next;
      });
      step++;
    }, 2400);
    return () => clearInterval(interval);
  }, [departments.length]);

  const marqueeItems = [
    '100% Escrow via Paystack',
    'Doorstep Nationwide Delivery',
    'Verified Nigerian Designers',
    'Verified Custom Sizing',
    'Fast Dispatch Logistics',
    'Bespoke Handmade Pieces',
  ];

  return (
    <div className="md:hidden pb-28 bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-x-hidden">

      {/* ── 1. STICKY BRAND APP BAR ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-xl sticky top-0 z-30"
      >
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-8 w-8 rounded-xl overflow-hidden shadow-sm border border-black/15 dark:border-white/15 group-hover:scale-105 transition-transform">
            <Image
              src="/images/logo/irisi-icon.png"
              alt="ÌRÍSÍ"
              width={32}
              height={32}
              priority
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-editorial text-lg font-bold tracking-[0.2em] text-[var(--text-primary)]">
            Ì R Í S Í
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/shop" className="p-2 rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer">
            <Search className="h-4 w-4" />
          </Link>
          <button type="button" onClick={toggleTheme} className="p-2 rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer">
            {theme === 'dark' ? <Sun className="h-4 w-4 text-[var(--gold-accent)]" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>

      {/* ── 2. STORIES ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="pt-4 pb-3 border-b border-[var(--border-subtle)]"
      >
        <MobileStoriesRow onOpenQuickBuy={(p) => setQuickBuyProduct(p)} />
      </motion.div>

      {/* ── 3. CINEMATIC HERO ────────────────────────────────── */}
      <div className="px-4 pt-5">
        <div className="relative h-[440px] rounded-3xl overflow-hidden bg-black shadow-2xl">
          {/* Slides */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeHeroIndex}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={heroSlides[activeHeroIndex].image}
                alt={heroSlides[activeHeroIndex].title}
                fill unoptimized priority
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Badge top-left */}
          <div className="absolute top-4 left-4 z-20">
            <motion.span
              key={`badge-${activeHeroIndex}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[var(--gold-accent)]/40 text-[10px] font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold"
            >
              <Flame className="h-3 w-3 fill-current" />
              {heroSlides[activeHeroIndex].badge}
            </motion.span>
          </div>

          {/* Dots top-right */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 rounded-full bg-black/40 backdrop-blur-sm">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveHeroIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-400 cursor-pointer ${i === activeHeroIndex ? 'w-5 bg-[var(--gold-accent)]' : 'w-1.5 bg-white/40'}`}
              />
            ))}
          </div>

          {/* Hero text */}
          <div className="absolute bottom-0 inset-x-0 p-5 z-20 space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${activeHeroIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="space-y-1"
              >
                <span className="text-[10px] font-mono-luxury text-zinc-300 uppercase tracking-widest font-bold block">
                  {heroSlides[activeHeroIndex].tagline}
                </span>
                <h2 className="font-editorial text-3xl font-bold text-white whitespace-pre-line leading-tight">
                  {heroSlides[activeHeroIndex].title}
                </h2>
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center gap-2.5 pt-1">
              <Link
                href="/shop"
                className="flex-1 py-3 rounded-full bg-white text-black font-mono-luxury uppercase text-xs font-bold text-center shadow-xl active:scale-95 transition-transform"
              >
                Shop Drops
              </Link>
              <Link
                href="/brands"
                className="flex-1 py-3 rounded-full bg-black/60 backdrop-blur-md border border-[var(--gold-accent)]/50 text-[var(--gold-accent)] font-mono-luxury uppercase text-xs font-bold text-center active:scale-95 transition-transform"
              >
                Top Ateliers
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. MARQUEE TICKER ────────────────────────────────── */}
      <div className="py-3 mt-5 bg-[var(--bg-secondary)] border-y border-[var(--border-subtle)] overflow-hidden">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="flex items-center gap-8 whitespace-nowrap"
        >
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="flex items-center gap-2 text-[10px] font-mono-luxury uppercase font-bold text-[var(--text-secondary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold-accent)] shrink-0" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── 5. DEPARTMENTS GRID ──────────────────────────────── */}
      <div className="px-4 pt-8 space-y-4">
        <FadeUp>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">Shop by Category</h3>
              <span className="text-xs text-[var(--text-secondary)]">Explore specialized departments</span>
            </div>
            <Link href="/shop" className="text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold flex items-center gap-1">
              All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </FadeUp>

        <div className="grid grid-cols-2 gap-3">
          {departments.map((dept, idx) => (
            <AnimatedCategoryCard
              key={dept.title}
              dept={dept}
              idx={idx}
              currentImgIdx={cardImageIndices[idx] ?? 0}
            />
          ))}
        </div>
      </div>

      {/* ── 6. FEATURED ATELIERS (Slow continuous auto-sliding slideshow) ── */}
      {featuredAteliers.length > 0 && (
        <div className="pt-10 space-y-4">
        <FadeUp className="px-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">Featured Brands</h3>
              <span className="text-xs text-[var(--text-secondary)]">Verified Nigerian fashion houses</span>
            </div>
            <span className="text-xs font-mono-luxury text-[var(--gold-accent)] font-bold">Verified ({featuredAteliers.length})</span>
          </div>
        </FadeUp>

        <div className="overflow-hidden py-1">
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            className="flex items-stretch gap-3 w-max px-4"
          >
            {[...featuredAteliers, ...featuredAteliers].map((atelier, idx) => {
              const isFollowed = safeFollowed.includes(atelier.id.toLowerCase());
              return (
                <div
                  key={`${atelier.id}-${idx}`}
                  className="w-64 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 shrink-0 space-y-3 shadow-sm hover:border-[var(--gold-accent)]/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative h-10 w-10 rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-black shrink-0">
                        <Image src={atelier.image} alt={atelier.name} fill unoptimized className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1 truncate">
                          {atelier.name}
                          <ShieldCheck className="h-3 w-3 text-[var(--gold-accent)] shrink-0" />
                        </h4>
                        <span className="text-[10px] text-[var(--text-secondary)] block truncate">{atelier.origin}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFollowVendor(atelier.id)}
                      className={`p-1.5 rounded-full transition-all cursor-pointer border shrink-0 ${isFollowed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'border-[var(--border-subtle)] text-[var(--text-primary)]'}`}
                      aria-label="Follow brand"
                    >
                      {isFollowed ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">{atelier.tagline}</p>
                  <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-2 text-[10px] font-mono-luxury">
                    <span className="text-emerald-500 font-bold">{atelier.dispatch}</span>
                    <Link href={`/brand/${atelier.id}`} className="text-[var(--gold-accent)] font-bold uppercase flex items-center gap-0.5 hover:underline">
                      Store <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
      )}

      {/* ── 7. EDITOR'S WEEKLY PICKS ─────────────────────────── */}
      {editorsPicks.length > 0 && (
        <div className="px-4 pt-10 space-y-4">
          <FadeUp>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">Editor&apos;s Picks</h3>
                <span className="text-xs text-[var(--text-secondary)]">Handpicked pieces in stock now</span>
              </div>
              <Link href="/shop" className="text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold flex items-center gap-1">
                All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </FadeUp>

          <div className="space-y-3">
            {editorsPicks.map((item, i) => (
              <FadeUp key={item.id || i} delay={i * 0.08}>
                <div className="p-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-black shrink-0 border border-[var(--border-subtle)]">
                      <Image src={item.imageUrl || '/images/products/BlackTrapStarHoodie.jpg'} alt={item.name} fill unoptimized className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono-luxury text-[var(--gold-accent)] uppercase font-bold block">{item.vendorName || 'Atelier'}</span>
                      <h4 className="font-bold text-xs text-[var(--text-primary)] truncate">{item.name}</h4>
                      <span className="font-mono-luxury text-xs font-bold text-[var(--text-primary)] block mt-0.5">
                        ₦{Number(item.price || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuickBuyProduct(item)}
                      className="px-3 py-1.5 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] font-mono-luxury uppercase font-bold active:scale-95 transition-transform cursor-pointer"
                    >
                      Quick Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutfitItem(item)}
                      className="text-[9px] font-mono-luxury text-[var(--gold-accent)] uppercase font-bold"
                    >
                      3D Fit
                    </button>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      )}

      {/* ── 8. TRUST PILLARS ─────────────────────────────────── */}
      <div className="px-4 pt-10 space-y-3">
        <FadeUp>
          <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">The Ìrísí Standard</h3>
        </FadeUp>
        {[
          { icon: Lock, label: 'Paystack Escrow Security', desc: 'Funds held safely. Released only after delivery confirmation.', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { icon: Sparkles, label: 'Custom Sizing Guarantee', desc: 'Input measurements once. Eliminate size guesswork forever.', color: 'text-[var(--gold-accent)]', bg: 'bg-[var(--gold-subtle)] border-[var(--gold-accent)]/30' },
          { icon: Truck, label: 'Nationwide Express Delivery', desc: 'Fast doorstep delivery across all 36 Nigerian states.', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
        ].map((p, idx) => (
          <FadeUp key={idx} delay={idx * 0.08}>
            <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex items-start gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 border ${p.bg}`}>
                <p.icon className={`h-4 w-4 ${p.color}`} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-[var(--text-primary)] mb-0.5">{p.label}</h4>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{p.desc}</p>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>

      {/* ── 9. JOIN CTA ───────────────────────────────────────── */}
      <FadeUp className="px-4 pt-10 pb-4">
        <div className="p-6 rounded-3xl border border-[var(--gold-accent)]/30 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] text-center space-y-3">
          <div className="inline-flex p-2.5 rounded-2xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30">
            <Crown className="h-5 w-5 text-[var(--gold-accent)]" />
          </div>
          <div>
            <h4 className="font-editorial text-xl font-bold text-[var(--text-primary)]">Join the Ìrísí Collective</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xs mx-auto leading-relaxed">
              Discover verified Nigerian designers, unlock exclusive drops, track orders, and shop bespoke custom fits.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-block px-6 py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase font-bold shadow-lg active:scale-95 transition-transform"
          >
            Explore Collections
          </Link>
        </div>
      </FadeUp>

      {/* QUICK BUY DRAWER */}
      {quickBuyProduct && (
        <MobileQuickBuyDrawer product={quickBuyProduct} onClose={() => setQuickBuyProduct(null)} />
      )}
    </div>
  );
}
