'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/lib/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, ArrowUpRight, Plus, Check,
  ShieldCheck, Truck, Lock, Sun, Moon, Search,
  Crown, Flame, Heart, ShoppingBag, X, Zap, SlidersHorizontal,
  CheckCircle2, Compass, Eye, MapPin
} from 'lucide-react';
import MobileQuickBuyDrawer from '@/components/mobile/MobileQuickBuyDrawer';

// Interactive Styled Look Definition (The Lagos Fit Archive)
interface FitPiece {
  id: string;
  name: string;
  category: string;
  price: number;
  atelier: string;
  image: string;
  topPct: number;  // % from top of image
  leftPct: number; // % from left of image
}

interface StyledLook {
  id: string;
  title: string;
  tagline: string;
  subtitle: string;
  occasion: string;
  modelImage: string;
  pieces: FitPiece[];
}

const STYLED_LOOKS: StyledLook[] = [
  {
    id: 'look-owambe',
    title: 'The Owambe Sovereign',
    tagline: 'CEREMONIAL LUXURY · LAGOS RUNWAY',
    subtitle: 'Geometric collar grand agbada tailored with artisanal calfskin slides & aso-oke cap.',
    occasion: 'Weddings & Royal Galas',
    modelImage: '/images/editorial/nigerian_male_couture.jpg',
    pieces: [
      {
        id: 'owambe-fila',
        name: 'Embroidered Aso-Oke Fila',
        category: 'accessories',
        price: 18000,
        atelier: 'Ilu Ateliers',
        image: '/images/products/Cap1.png',
        topPct: 18,
        leftPct: 54,
      },
      {
        id: 'owambe-agbada',
        name: 'Obsidian Grand Agbada 3-Piece',
        category: 'native',
        price: 110000,
        atelier: 'Lagos Couture House',
        image: '/images/products/BlackAgbada.jpg',
        topPct: 44,
        leftPct: 48,
      },
      {
        id: 'owambe-slides',
        name: 'Artisanal Double-Strap Slides',
        category: 'footwear',
        price: 35000,
        atelier: 'Kano Leather Craft',
        image: '/images/products/UnisexSlides.jpg',
        topPct: 86,
        leftPct: 52,
      },
    ],
  },
  {
    id: 'look-streetwear',
    title: 'Midnight Yaba District',
    tagline: 'STREETWEAR ARCHIVE · 480GSM',
    subtitle: 'Drop-shoulder heavyweight hoodie paired with relaxed vintage denim & slip-on mules.',
    occasion: 'Lagos Underground & Raves',
    modelImage: '/images/editorial/modern_male_streetwear.jpg',
    pieces: [
      {
        id: 'street-hoodie',
        name: '480GSM TrapStar Graphic Hoodie',
        category: 'streetwear',
        price: 45000,
        atelier: 'Urban Lagos Lab',
        image: '/images/products/BlackTrapStarHoodie.jpg',
        topPct: 36,
        leftPct: 52,
      },
      {
        id: 'street-pants',
        name: 'Wide-Leg Relaxed Denim',
        category: 'trousers',
        price: 32000,
        atelier: 'Indigo Atelier',
        image: '/images/products/BaggyJean.jpg',
        topPct: 65,
        leftPct: 46,
      },
      {
        id: 'street-shoes',
        name: 'Hand-Finished Unisex Slides',
        category: 'footwear',
        price: 28000,
        atelier: 'Kano Leather Craft',
        image: '/images/products/AdiletteAquaSlides.jpg',
        topPct: 88,
        leftPct: 50,
      },
    ],
  },
];

export default function MobileHomeView() {
  const {
    allProducts,
    cart,
    vault,
    toggleVaultItem,
    isInVault,
    setIsCartOpen,
    setIsVaultOpen,
    theme,
    toggleTheme,
    fetchProductsFromDb,
  } = useStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    fetchProductsFromDb();
  }, [fetchProductsFromDb]);

  // Active Department (Farfetch style: All, Native, Streetwear, Footwear, Accessories)
  const [activeDepartment, setActiveDepartment] = useState<'all' | 'native' | 'streetwear' | 'footwear' | 'accessories'>('all');

  // Active Story Filter (Fashion Nova style bubbles)
  const [activeStoryFilter, setActiveStoryFilter] = useState<string>('all');

  // Active Filter Chip (Speed chips: Trending, Ready to Ship, Under 35k, etc.)
  const [activeChip, setActiveChip] = useState<'all' | 'trending' | 'ready_to_ship' | 'under_35k' | 'bespoke'>('all');

  // Search input toggle
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Buy Modal
  const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);

  // Cinematic Hero Carousel State
  const [activeHeroIdx, setActiveHeroIdx] = useState(0);
  const heroSlides = useMemo(() => [
    {
      id: 'slide-1',
      tag: 'LAGOS COUTURE DROP · 001',
      title: 'Imperial Agbada\n& Regal Senators',
      sub: 'Hand-tailored native sets by Nigeria’s master couturiers.',
      image: '/images/editorial/nigerian_male_couture.jpg',
      badge: 'Bespoke Craft',
      link: '/shop?category=native',
      department: 'native',
    },
    {
      id: 'slide-2',
      tag: 'HEAVYWEIGHT STREET ARCHIVE',
      title: 'Lagos Underground\n480GSM Hoodies',
      sub: 'Boxy drop-shoulder cuts, raw distressing, and streetwear sets.',
      image: '/images/editorial/modern_male_streetwear.jpg',
      badge: 'High Demand Drop',
      link: '/shop?category=streetwear',
      department: 'streetwear',
    },
    {
      id: 'slide-3',
      tag: 'ARTISANAL FOOTWEAR & LEATHER',
      title: 'Handcrafted\nCalfskin Slides & Bags',
      sub: 'Full-grain genuine leather handmade in Lagos & Kano ateliers.',
      image: '/images/products/UnisexSlides.jpg',
      badge: 'Limited Handcraft',
      link: '/shop?category=footwear',
      department: 'footwear',
    },
  ], []);

  // Filter hero based on active department if not 'all'
  const visibleHeroSlides = useMemo(() => {
    if (activeDepartment === 'all') return heroSlides;
    const match = heroSlides.filter(s => s.department === activeDepartment);
    return match.length > 0 ? match : heroSlides;
  }, [activeDepartment, heroSlides]);

  useEffect(() => {
    setActiveHeroIdx(0);
  }, [activeDepartment]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroIdx(prev => (prev + 1) % visibleHeroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [visibleHeroSlides.length]);

  // "The Lagos Fit Archive" Interactive Look State
  const [activeLookIdx, setActiveLookIdx] = useState(0);
  const [selectedHotspot, setSelectedHotspot] = useState<FitPiece | null>(STYLED_LOOKS[0].pieces[1]);

  const activeLook = STYLED_LOOKS[activeLookIdx] || STYLED_LOOKS[0];

  // Story Category Bubbles (Fashion Nova inspiration elevated with luxury gold rings)
  const storyBubbles = [
    { id: 'all', label: 'All Drops', badge: '✦ ALL', image: '/images/products/BlackAgbada.jpg' },
    { id: 'native', label: 'Agbada & Sets', badge: 'ROYAL', image: '/images/products/BlackSenator.jpg' },
    { id: 'streetwear', label: 'Streetwear', badge: '🔥 HOT', image: '/images/products/BlackTrapStarHoodie.jpg' },
    { id: 'footwear', label: 'Leather Slides', badge: 'CRAFT', image: '/images/products/UnisexSlides.jpg' },
    { id: 'trousers', label: 'Pants & Cargo', badge: 'NEW', image: '/images/products/BaggyJean.jpg' },
    { id: 'caps', label: 'Fila & Caps', badge: 'DROP', image: '/images/products/Cap1.png' },
    { id: 'jewelry', label: 'Fine Jewelry', badge: 'GOLD', image: '/images/editorial/nigerian_female_couture.jpg' },
  ];

  // Filter products reactively
  const filteredProducts = useMemo(() => {
    let list = allProducts && allProducts.length > 0 ? [...allProducts] : [];

    // Fallback seed pieces if DB products not loaded yet
    if (list.length === 0) {
      list = [
        {
          id: 'fb-1',
          name: 'Imperial Obsidian Grand Agbada',
          price: 95000,
          vendorName: 'Lagos Couture House',
          category: 'native',
          imageUrl: '/images/products/BlackAgbada.jpg',
          dispatchTime: '24–48h',
          stockQuantity: 5,
        } as any,
        {
          id: 'fb-2',
          name: '480GSM TrapStar Heavy Hoodie',
          price: 42000,
          vendorName: 'Urban Lagos Lab',
          category: 'streetwear',
          imageUrl: '/images/products/BlackTrapStarHoodie.jpg',
          dispatchTime: 'Same Day',
          stockQuantity: 12,
        } as any,
        {
          id: 'fb-3',
          name: 'Handcrafted Unisex Leather Slides',
          price: 32000,
          vendorName: 'Kano Leather Craft',
          category: 'footwear',
          imageUrl: '/images/products/UnisexSlides.jpg',
          dispatchTime: '24–48h',
          stockQuantity: 8,
        } as any,
        {
          id: 'fb-4',
          name: 'Midnight Senator Native Suit',
          price: 68000,
          vendorName: 'Atelier Lekki',
          category: 'native',
          imageUrl: '/images/products/BlackSenator.jpg',
          dispatchTime: '24–48h',
          stockQuantity: 6,
        } as any,
        {
          id: 'fb-5',
          name: 'Vintage Baggy Denim Jeans',
          price: 29000,
          vendorName: 'Indigo Street Lab',
          category: 'trousers',
          imageUrl: '/images/products/BaggyJean.jpg',
          dispatchTime: 'Same Day',
          stockQuantity: 15,
        } as any,
        {
          id: 'fb-6',
          name: 'Hand-Embroidered Velvet Fila Cap',
          price: 18000,
          vendorName: 'Ilu Traditional',
          category: 'accessories',
          imageUrl: '/images/products/Cap1.png',
          dispatchTime: '24h',
          stockQuantity: 20,
        } as any,
      ];
    }

    // 1. Department Filter
    if (activeDepartment !== 'all') {
      if (activeDepartment === 'native') {
        list = list.filter(p => {
          const cat = p.category as string;
          const name = (p.name || '').toLowerCase();
          return cat === 'native' || cat === 'tops' || name.includes('agbada') || name.includes('senator');
        });
      } else if (activeDepartment === 'streetwear') {
        list = list.filter(p => {
          const cat = p.category as string;
          const name = (p.name || '').toLowerCase();
          return cat === 'streetwear' || cat === 'outerwear' || name.includes('hoodie') || name.includes('trapstar');
        });
      } else if (activeDepartment === 'footwear') {
        list = list.filter(p => (p.category as string) === 'footwear');
      } else if (activeDepartment === 'accessories') {
        list = list.filter(p => (p.category as string) === 'accessories');
      }
    }

    // 2. Story Bubble Filter
    if (activeStoryFilter !== 'all') {
      if (activeStoryFilter === 'native') {
        list = list.filter(p => {
          const cat = p.category as string;
          const name = (p.name || '').toLowerCase();
          return cat === 'native' || name.includes('agbada') || name.includes('senator');
        });
      } else if (activeStoryFilter === 'streetwear') {
        list = list.filter(p => {
          const cat = p.category as string;
          const name = (p.name || '').toLowerCase();
          return cat === 'streetwear' || name.includes('hoodie') || name.includes('trapstar') || cat === 'outerwear';
        });
      } else if (activeStoryFilter === 'footwear') {
        list = list.filter(p => (p.category as string) === 'footwear');
      } else if (activeStoryFilter === 'trousers') {
        list = list.filter(p => (p.category as string) === 'bottoms' || (p.category as string) === 'trousers' || (p.name || '').toLowerCase().includes('jean'));
      } else if (activeStoryFilter === 'caps' || activeStoryFilter === 'jewelry') {
        list = list.filter(p => (p.category as string) === 'accessories');
      }
    }

    // 3. Chip Filter
    if (activeChip === 'under_35k') {
      list = list.filter(p => Number(p.price || 0) <= 35000);
    } else if (activeChip === 'bespoke') {
      list = list.filter(p => (p.category as string) === 'native' || Number(p.price || 0) >= 50000 || (p.name || '').toLowerCase().includes('agbada'));
    }

    // 4. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.vendorName?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allProducts, activeDepartment, activeStoryFilter, activeChip, searchQuery]);

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="md:hidden pb-32 bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen overflow-x-hidden selection:bg-[var(--gold-accent)] selection:text-black">

      {/* ── 1. STICKY CINEMATIC TOP APP BAR ────────────────────── */}
      <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-[var(--border-subtle)] transition-all">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Logo & Luxury Dot */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-8 w-8 rounded-xl overflow-hidden shadow-sm border border-[var(--border-subtle)] group-active:scale-95 transition-transform bg-black">
              <Image
                src="/images/logo/irisi-icon.png"
                alt="ÌRÍSÍ"
                width={32}
                height={32}
                priority
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-editorial text-lg font-bold tracking-[0.25em] text-[var(--text-primary)] leading-none">
                Ì R Í S Í
              </span>
              <span className="text-[8px] font-mono-luxury tracking-widest text-[var(--gold-accent)] uppercase mt-0.5">
                LAGOS · COUTURE
              </span>
            </div>
          </Link>

          {/* Quick Action Icons */}
          <div className="flex items-center gap-2">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                isSearchOpen
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              aria-label="Toggle search"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Wishlist Heart with Badge */}
            <button
              type="button"
              onClick={() => setIsVaultOpen(true)}
              className="relative p-2 rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              aria-label="Open Wishlist"
            >
              <Heart className="h-4 w-4" />
              {vault.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[var(--gold-accent)] text-black text-[9px] font-mono-luxury font-bold flex items-center justify-center animate-scaleUp">
                  {vault.length}
                </span>
              )}
            </button>

            {/* Cart Bag with Badge */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm cursor-pointer active:scale-95 transition-transform"
              aria-label="Open Cart"
            >
              <ShoppingBag className="h-4 w-4" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 text-black text-[9px] font-mono-luxury font-bold flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              suppressHydrationWarning
              className="p-2 rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] cursor-pointer"
              aria-label="Toggle theme"
            >
              {mounted && theme === 'dark' ? (
                <Sun className="h-4 w-4 text-[var(--gold-accent)]" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Instant Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-3 overflow-hidden border-t border-[var(--border-subtle)] pt-2"
            >
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search Agbada, Hoodies, Slides, Crossbody..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury focus:outline-none focus:border-[var(--gold-accent)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 2. FARFETCH-STYLE SEGMENTED DEPARTMENT BAR ─────── */}
        <div className="px-4 pb-2 pt-0.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Edits' },
            { id: 'native', label: 'Native Couture' },
            { id: 'streetwear', label: 'Streetwear' },
            { id: 'footwear', label: 'Footwear & Leather' },
            { id: 'accessories', label: 'Accessories' },
          ].map((dept) => {
            const isActive = activeDepartment === dept.id;
            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => {
                  setActiveDepartment(dept.id as any);
                  setActiveStoryFilter('all');
                }}
                className={`relative px-3.5 py-1.5 rounded-full text-[11px] font-mono-luxury font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'text-black font-extrabold shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeDeptPill"
                    className="absolute inset-0 rounded-full bg-[var(--gold-accent)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{dept.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ── 3. FASHION NOVA-STYLE INTERACTIVE STORY BUBBLES ──── */}
      <section className="pt-4 pb-3 border-b border-[var(--border-subtle)] select-none">
        <div className="flex items-center justify-between px-4 mb-2.5">
          <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            <span>Curated Discovery Portals</span>
          </span>
          <span className="text-[10px] font-mono-luxury text-[var(--text-muted)]">
            Swipe to explore
          </span>
        </div>

        <div className="flex items-start gap-3.5 overflow-x-auto px-4 no-scrollbar overscroll-x-contain">
          {storyBubbles.map((bubble) => {
            const isSelected = activeStoryFilter === bubble.id;
            return (
              <button
                key={bubble.id}
                type="button"
                onClick={() => {
                  setActiveStoryFilter(bubble.id);
                  if (bubble.id !== 'all') {
                    // Scroll to product grid smoothly
                    document.getElementById('catalog-grid-anchor')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer active:scale-95 transition-transform"
              >
                {/* Glowing Gold Ring Capsule */}
                <div
                  className={`p-[2px] rounded-full transition-all duration-300 ${
                    isSelected
                      ? 'bg-gradient-to-tr from-[var(--gold-accent)] via-amber-300 to-yellow-500 ring-2 ring-[var(--gold-accent)]/50 scale-105'
                      : 'bg-gradient-to-tr from-[var(--border-subtle)] via-zinc-700 to-[var(--border-subtle)] group-hover:from-[var(--gold-accent)]/80'
                  }`}
                >
                  <div className="p-[2px] rounded-full bg-[var(--bg-primary)]">
                    <div className="relative h-[62px] w-[62px] rounded-full overflow-hidden bg-black">
                      <Image
                        src={bubble.image}
                        alt={bubble.label}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {/* Gradient rim */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {/* Micro Badge */}
                      <span className="absolute bottom-0.5 inset-x-0 text-center text-[7px] font-mono-luxury uppercase font-black text-amber-300 tracking-tighter drop-shadow-md">
                        {bubble.badge}
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono-luxury max-w-[68px] truncate text-center leading-tight transition-colors ${
                    isSelected ? 'text-[var(--gold-accent)] font-bold' : 'text-[var(--text-secondary)] font-medium'
                  }`}
                >
                  {bubble.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 4. CINEMATIC FULL-BLEED HERO RUNWAY ──────────────── */}
      <section className="px-4 pt-5">
        <div className="relative h-[480px] rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10 group">
          <AnimatePresence mode="wait">
            <motion.div
              key={visibleHeroSlides[activeHeroIdx]?.id || activeHeroIdx}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={visibleHeroSlides[activeHeroIdx]?.image || '/images/editorial/nigerian_male_couture.jpg'}
                alt="Ìrísí Editorial"
                fill
                unoptimized
                priority
                className="object-cover opacity-85"
              />
              {/* Luxury Vignette & Dark Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20 pointer-events-none" />
            </motion.div>
          </AnimatePresence>

          {/* Top Pill Badges */}
          <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[var(--gold-accent)]/40 text-[9px] font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold">
              <Crown className="h-3 w-3" />
              <span>{visibleHeroSlides[activeHeroIdx]?.badge}</span>
            </span>

            {/* Active Slides Indicator */}
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
              {visibleHeroSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveHeroIdx(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === activeHeroIdx ? 'w-5 bg-[var(--gold-accent)]' : 'w-1.5 bg-white/40'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Hero Bottom Content */}
          <div className="absolute bottom-0 inset-x-0 p-6 z-20 space-y-3.5">
            <span className="text-[10px] font-mono-luxury text-amber-300 uppercase tracking-widest font-bold block drop-shadow-sm">
              {visibleHeroSlides[activeHeroIdx]?.tag}
            </span>

            <h2 className="font-editorial text-3xl font-bold text-white leading-[1.1] whitespace-pre-line drop-shadow-md">
              {visibleHeroSlides[activeHeroIdx]?.title}
            </h2>

            <p className="text-xs text-zinc-300 font-light leading-relaxed max-w-xs drop-shadow-sm">
              {visibleHeroSlides[activeHeroIdx]?.sub}
            </p>

            {/* Quick Action CTAs */}
            <div className="flex items-center gap-2.5 pt-1">
              <Link
                href={visibleHeroSlides[activeHeroIdx]?.link || '/shop'}
                className="flex-1 py-3.5 rounded-full bg-[var(--gold-accent)] text-black font-mono-luxury uppercase text-xs font-bold text-center shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5"
              >
                <span>Shop This Drop</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/shop"
                className="py-3.5 px-5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-mono-luxury uppercase text-xs font-bold text-center active:scale-95 transition-transform"
              >
                Catalog
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. THE FUN FACTOR: "THE LAGOS FIT ARCHIVE" ────────── */}
      {/* Interactive Look with Clickable Hotspots */}
      <section className="px-4 pt-10 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[9px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold mb-1">
              <Sparkles className="h-3 w-3" />
              <span>Interactive Outfit Hotspots</span>
            </div>
            <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">The Lagos Fit Archive</h3>
            <p className="text-[11px] text-[var(--text-secondary)] font-light">
              Tap the glowing gold pins on the model to inspect & shop each piece.
            </p>
          </div>

          {/* Look Switcher Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] shrink-0">
            {STYLED_LOOKS.map((look, i) => (
              <button
                key={look.id}
                type="button"
                onClick={() => {
                  setActiveLookIdx(i);
                  setSelectedHotspot(look.pieces[0]);
                }}
                className={`px-2.5 py-1 rounded-full text-[9px] font-mono-luxury font-bold uppercase transition-all cursor-pointer ${
                  i === activeLookIdx
                    ? 'bg-[var(--gold-accent)] text-black shadow-sm'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                Fit 0{i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* The Interactive Look Card with Pins */}
        <div className="relative h-[520px] rounded-3xl overflow-hidden bg-black border border-[var(--border-subtle)] shadow-2xl">
          <Image
            src={activeLook.modelImage}
            alt={activeLook.title}
            fill
            unoptimized
            className="object-cover opacity-90 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />

          {/* Look Header Badge */}
          <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 space-y-0.5">
            <span className="text-[8px] font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold block">
              {activeLook.tagline}
            </span>
            <h4 className="font-editorial text-base font-bold text-white">{activeLook.title}</h4>
          </div>

          {/* PULSING INTERACTIVE HOTSPOT PINS */}
          {activeLook.pieces.map((piece) => {
            const isSelected = selectedHotspot?.id === piece.id;
            return (
              <div
                key={piece.id}
                style={{ top: `${piece.topPct}%`, left: `${piece.leftPct}%` }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              >
                <button
                  type="button"
                  onClick={() => setSelectedHotspot(piece)}
                  className="relative flex items-center justify-center p-2 group cursor-pointer active:scale-90 transition-transform"
                  aria-label={`Inspect ${piece.name}`}
                >
                  {/* Radar pulse animation */}
                  <span className="absolute h-8 w-8 rounded-full bg-[var(--gold-accent)]/30 animate-ping" />
                  <span
                    className={`relative flex items-center justify-center h-7 w-7 rounded-full border shadow-xl transition-all ${
                      isSelected
                        ? 'bg-[var(--gold-accent)] text-black border-white scale-110 ring-4 ring-[var(--gold-accent)]/40'
                        : 'bg-black/80 backdrop-blur-md text-white border-[var(--gold-accent)]'
                    }`}
                  >
                    <Plus className={`h-3.5 w-3.5 ${isSelected ? 'rotate-45' : ''} transition-transform duration-300`} />
                  </span>
                </button>
              </div>
            );
          })}

          {/* ACTIVE HOTSPOT SLIDE-UP MICRO CARD */}
          {selectedHotspot && (
            <motion.div
              key={selectedHotspot.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute bottom-4 inset-x-4 z-30 p-3.5 rounded-2xl bg-black/90 backdrop-blur-xl border border-[var(--gold-accent)]/40 shadow-2xl space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                  <Image
                    src={selectedHotspot.image}
                    alt={selectedHotspot.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold">
                      {selectedHotspot.atelier}
                    </span>
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  </div>
                  <h5 className="font-bold text-xs text-white truncate">{selectedHotspot.name}</h5>
                  <span className="font-editorial text-sm font-bold text-[var(--gold-accent)] block mt-0.5">
                    ₦{selectedHotspot.price.toLocaleString()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickBuyProduct({
                    ...selectedHotspot,
                    imageUrl: selectedHotspot.image,
                    vendorName: selectedHotspot.atelier,
                    stockQuantity: 10,
                  })}
                  className="px-3.5 py-2 rounded-xl bg-[var(--gold-accent)] text-black font-mono-luxury uppercase text-[10px] font-bold shrink-0 shadow-lg active:scale-95 transition-transform cursor-pointer"
                >
                  Quick Add +
                </button>
              </div>

              {/* Add entire look button */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono-luxury">
                <span className="text-zinc-400">Complete 3-Piece Fit:</span>
                <Link
                  href="/shop"
                  className="text-[var(--gold-accent)] font-bold uppercase hover:underline flex items-center gap-1"
                >
                  <span>Explore Full Collection</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── 6. INSTANT FILTER CHIPS (FASHION NOVA SPEED) ────── */}
      <section id="catalog-grid-anchor" className="px-4 pt-10 space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold">
              ATELIER RUNWAY CATALOG
            </span>
            <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">Featured Pieces</h3>
          </div>
          <span className="text-xs font-mono-luxury text-[var(--text-secondary)]">
            ({filteredProducts.length} items)
          </span>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'All Pieces' },
            { id: 'trending', label: '🔥 Trending' },
            { id: 'ready_to_ship', label: '⚡ 24h Dispatch' },
            { id: 'under_35k', label: '₦ Under 35k' },
            { id: 'bespoke', label: '👑 Bespoke' },
          ].map((chip) => {
            const isChipActive = activeChip === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveChip(chip.id as any)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-mono-luxury font-bold uppercase whitespace-nowrap transition-all cursor-pointer border ${
                  isChipActive
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)] shadow-sm'
                    : 'border-[var(--border-subtle)] text-[var(--text-secondary)] bg-[var(--bg-secondary)]'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* ── 7. FARFETCH X FASHION NOVA 2-COLUMN LUXURY GRID ─── */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {filteredProducts.map((product, idx) => {
            const isFav = isInVault(product.id);
            const imageSrc = product.imageUrl || (Array.isArray(product.images) && product.images[0]) || '/images/products/BlackTrapStarHoodie.jpg';

            return (
              <motion.div
                key={product.id || idx}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(idx * 0.04, 0.3) }}
                className="group flex flex-col rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-secondary)] shadow-sm hover:border-[var(--gold-accent)]/50 transition-all"
              >
                {/* 3:4 Tall Portrait Image Container */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
                  <Image
                    src={imageSrc}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                  {/* Wishlist Heart Top-Right */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleVaultItem(product);
                    }}
                    className="absolute top-2.5 right-2.5 z-10 p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:text-[var(--gold-accent)] active:scale-75 transition-all cursor-pointer"
                    aria-label="Save to wishlist"
                  >
                    <Heart
                      className={`h-3.5 w-3.5 transition-colors ${
                        isFav ? 'fill-rose-500 text-rose-500' : 'text-white'
                      }`}
                    />
                  </button>

                  {/* Top-Left Atelier Badge */}
                  <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[8px] font-mono-luxury uppercase text-amber-300 font-bold">
                    {product.vendorName || 'Atelier'}
                  </span>

                  {/* Quick Add Floating Button at Bottom of Image */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setQuickBuyProduct(product);
                    }}
                    className="absolute bottom-2.5 inset-x-2.5 z-10 py-2 rounded-xl bg-white/90 backdrop-blur-md hover:bg-white text-black font-mono-luxury uppercase text-[10px] font-bold text-center shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Quick Add</span>
                  </button>
                </div>

                {/* Product Meta Details */}
                <Link href={`/shop/${product.id}`} className="p-3 flex flex-col flex-1 justify-between gap-1.5">
                  <div>
                    <h4 className="font-bold text-xs text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--gold-accent)] transition-colors">
                      {product.name}
                    </h4>
                    <span className="text-[9px] font-mono-luxury text-[var(--text-muted)] uppercase tracking-wider block mt-0.5">
                      {product.category || 'Atelier Drop'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
                    <span className="font-editorial text-sm font-bold text-[var(--text-primary)]">
                      ₦{Number(product.price || 0).toLocaleString()}
                    </span>
                    <span className="text-[8px] font-mono-luxury text-emerald-400 font-bold uppercase">
                      Escrow Safe
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── 8. ATELIER SPOTLIGHT (MAGAZINE EDITORIAL) ────────── */}
      <section className="px-4 pt-12 space-y-4">
        <div className="p-6 rounded-3xl border border-[var(--gold-accent)]/30 bg-gradient-to-br from-[var(--bg-secondary)] via-black to-[var(--bg-primary)] space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold flex items-center gap-1.5">
              <Crown className="h-3 w-3" />
              <span>Atelier Spotlight of the Week</span>
            </span>
            <span className="text-[8px] font-mono-luxury text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Verified Atelier
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-black border border-[var(--gold-accent)]/40 shrink-0">
              <Image
                src="/images/editorial/male_senator.jpg"
                alt="Lagos Couture House"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div>
              <h4 className="font-editorial text-xl font-bold text-white">Lagos Couture House</h4>
              <p className="text-[11px] text-zinc-300 font-light mt-0.5">
                Surulere, Lagos · Tailoring bespoke ceremonial native wear & senators.
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-400 font-light italic leading-relaxed border-l-2 border-[var(--gold-accent)] pl-3">
            &ldquo;Every seam is finished by hand. We don&apos;t do mass fashion; we create generational pieces for the modern Nigerian.&rdquo;
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs font-mono-luxury">
            <span className="text-emerald-400 font-bold">⏱ 24–48h Dispatch Speed</span>
            <Link
              href="/shop"
              className="text-[var(--gold-accent)] font-bold uppercase flex items-center gap-1 hover:underline"
            >
              <span>Visit Atelier</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. THE ÌRÍSÍ ESCROW TRUST PILLARS ─────────────────── */}
      <section className="px-4 pt-10 space-y-3">
        <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex items-start gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-[var(--text-primary)]">100% Escrow Protection</h4>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mt-0.5">
              Your money is locked safely. Designers only get paid after you receive and inspect your pieces.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex items-start gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] shrink-0">
            <Crown className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-[var(--text-primary)]">Verified Independent Designers</h4>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mt-0.5">
              Bespoke native wear, heavyweight street hoodies, handcrafted leather slides, bags & fine jewelry.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex items-start gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
            <Truck className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-[var(--text-primary)]">Doorstep & Hub Delivery</h4>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mt-0.5">
              Fast courier dispatch and interstate motor park pickups with real-time tracking numbers.
            </p>
          </div>
        </div>
      </section>

      {/* ── 10. QUICK BUY BOTTOM SHEET MODAL ──────────────────── */}
      {quickBuyProduct && (
        <MobileQuickBuyDrawer
          product={quickBuyProduct}
          onClose={() => setQuickBuyProduct(null)}
        />
      )}

    </div>
  );
}
