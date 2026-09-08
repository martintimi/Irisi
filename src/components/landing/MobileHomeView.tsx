'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/lib/store/useStore';
import {
  Search, Camera, Sparkles, ArrowRight, Heart, ShieldCheck,
  ChevronRight, Lock, Truck, Crown
} from 'lucide-react';
import MobileQuickBuyDrawer from '@/components/mobile/MobileQuickBuyDrawer';

export default function MobileHomeView() {
  const {
    allProducts,
    vault,
    toggleVaultItem,
    isInVault,
    fetchProductsFromDb,
  } = useStore();

  useEffect(() => {
    fetchProductsFromDb();
  }, [fetchProductsFromDb]);

  // Division Tabs (Fashion Nova: MEN, WOMEN, STREETWEAR, NATIVE, FOOTWEAR)
  const [activeTab, setActiveTab] = useState<'men' | 'women' | 'streetwear' | 'native' | 'footwear'>('men');

  // Search input query
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Buy Modal
  const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);

  // Curated Visual Category Portals
  const categories = [
    {
      id: 'native',
      title: 'Native & Agbada',
      subtitle: 'Senators & 3-Piece Sets',
      image: '/images/products/BlackAgbada.jpg',
      link: '/category/native',
    },
    {
      id: 'streetwear',
      title: 'Streetwear Sets',
      subtitle: '480GSM Heavy Hoodies',
      image: '/images/products/BlackTrapStarHoodie.jpg',
      link: '/category/streetwear',
    },
    {
      id: 'footwear',
      title: 'Leather Footwear',
      subtitle: 'Handcrafted Slides & Mules',
      image: '/images/products/UnisexSlides.jpg',
      link: '/category/footwear',
    },
    {
      id: 'trousers',
      title: 'Pants & Denim',
      subtitle: 'Bespoke Trousers & Cargo',
      image: '/images/products/BaggyJean.jpg',
      link: '/category/trousers',
    },
    {
      id: 'caps',
      title: 'Caps & Fila',
      subtitle: 'Aso-Oke & Streetwear Caps',
      image: '/images/products/Cap1.png',
      link: '/category/accessories',
    },
    {
      id: 'accessories',
      title: 'Bags & Jewelry',
      subtitle: 'Crossbodies & Accents',
      image: '/images/editorial/female_dress.jpg',
      link: '/category/accessories',
    },
  ];

  // Hero Campaign based on activeTab
  const heroCampaign = useMemo(() => {
    switch (activeTab) {
      case 'native':
        return {
          title: 'IMPERIAL NATIVE',
          subtitle: 'BESPOKE SENATORS & GRAND AGBADA',
          code: '100% ESCROW PROTECTED',
          image: '/images/editorial/nigerian_male_couture.jpg',
          link: '/category/native',
        };
      case 'streetwear':
        return {
          title: 'STREET ARCHIVE',
          subtitle: '480GSM HEAVYWEIGHT HOODIES',
          code: 'LIMITED WORKSHOP DROPS',
          image: '/images/editorial/modern_male_streetwear.jpg',
          link: '/category/streetwear',
        };
      case 'footwear':
        return {
          title: 'ARTISANAL LEATHER',
          subtitle: 'HAND-BURNISHED SLIDES & MULES',
          code: 'GENUINE CALFSKIN',
          image: '/images/products/UnisexSlides.jpg',
          link: '/category/footwear',
        };
      case 'women':
        return {
          title: 'ATELIER FEMME',
          subtitle: 'CONTEMPORARY NIGERIAN SILHOUETTES',
          code: 'CURATED LUXURY',
          image: '/images/editorial/female_dress.jpg',
          link: '/shop',
        };
      case 'men':
      default:
        return {
          title: 'THE NEW DROP',
          subtitle: 'VERIFIED INDEPENDENT ATELIERS',
          code: '100% BUYER ESCROW SECURITY',
          image: '/images/editorial/modern_male_streetwear.jpg',
          link: '/shop',
        };
    }
  }, [activeTab]);

  // Reactive product filter
  const productsList = useMemo(() => {
    let list = allProducts && allProducts.length > 0 ? [...allProducts] : [];

    // Fallback seed pieces if DB products not loaded yet
    if (list.length === 0) {
      list = [
        {
          id: 'p-1',
          name: 'Imperial Obsidian Grand Agbada',
          price: 95000,
          vendorName: 'Atelier Sovereign',
          category: 'tops',
          imageUrl: '/images/products/BlackAgbada.jpg',
          stockQuantity: 5,
        } as any,
        {
          id: 'p-2',
          name: '480GSM TrapStar Heavyweight Hoodie',
          price: 42000,
          vendorName: 'Urban Archive',
          category: 'outerwear',
          imageUrl: '/images/products/BlackTrapStarHoodie.jpg',
          stockQuantity: 12,
        } as any,
        {
          id: 'p-3',
          name: 'Handcrafted Double-Strap Leather Slides',
          price: 32000,
          vendorName: 'Artisan Craft',
          category: 'footwear',
          imageUrl: '/images/products/UnisexSlides.jpg',
          stockQuantity: 8,
        } as any,
        {
          id: 'p-4',
          name: 'Midnight Senator Native 2-Piece Suit',
          price: 68000,
          vendorName: 'Atelier Sovereign',
          category: 'tops',
          imageUrl: '/images/products/BlackSenator.jpg',
          stockQuantity: 6,
        } as any,
        {
          id: 'p-5',
          name: 'Relaxed Wide-Leg Baggy Denim Jeans',
          price: 29000,
          vendorName: 'Denim Lab',
          category: 'bottoms',
          imageUrl: '/images/products/BaggyJean.jpg',
          stockQuantity: 15,
        } as any,
        {
          id: 'p-6',
          name: 'Hand-Embroidered Velvet Fila Cap',
          price: 18000,
          vendorName: 'Heritage Ateliers',
          category: 'accessories',
          imageUrl: '/images/products/Cap1.png',
          stockQuantity: 20,
        } as any,
      ];
    }

    // Filter by active tab
    if (activeTab === 'native') {
      list = list.filter(p => {
        const n = (p.name || '').toLowerCase();
        return (p.category as string) === 'native' || n.includes('agbada') || n.includes('senator') || n.includes('native');
      });
    } else if (activeTab === 'streetwear') {
      list = list.filter(p => {
        const n = (p.name || '').toLowerCase();
        return (p.category as string) === 'outerwear' || (p.category as string) === 'streetwear' || n.includes('hoodie') || n.includes('trapstar');
      });
    } else if (activeTab === 'footwear') {
      list = list.filter(p => (p.category as string) === 'footwear');
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.vendorName?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allProducts, activeTab, searchQuery]);

  return (
    <div className="md:hidden pb-24 bg-white dark:bg-[#0A0A0C] text-black dark:text-white min-h-screen">

      {/* ── 1. HEADER (FASHION NOVA STYLE: LOGO + FOR YOU) ──── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#0A0A0C] border-b border-neutral-200 dark:border-neutral-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="font-sans font-black text-2xl tracking-tighter uppercase text-black dark:text-white">
              ÌRÍSÍ
            </span>
          </Link>

          {/* "✨ For You" Pill (Exact Fashion Nova style) */}
          <Link
            href="/shop"
            className="flex items-center gap-1 px-3 py-1 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>For You</span>
          </Link>
        </div>

        {/* ── 2. DIVISION TABS (MEN, WOMEN, STREETWEAR, NATIVE...) ── */}
        <nav className="flex items-center justify-between px-4 border-t border-neutral-100 dark:border-neutral-900 overflow-x-auto no-scrollbar">
          {[
            { id: 'men', label: 'MEN' },
            { id: 'streetwear', label: 'STREETWEAR' },
            { id: 'native', label: 'NATIVE' },
            { id: 'footwear', label: 'FOOTWEAR' },
            { id: 'women', label: 'WOMEN' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-2 text-[12px] font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-neutral-500 hover:text-black dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* ── 3. SEARCH BAR (PILL SHAPE WITH ICONS) ────────────── */}
        <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder={`Search within ${activeTab.toUpperCase()} clothing...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-xs text-black dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-black dark:focus:border-white shadow-sm"
            />
            <div className="absolute right-3 text-neutral-400">
              <Camera className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      {/* ── 4. FULL-BLEED EDGE-TO-EDGE HERO BANNER ───────────── */}
      <section className="relative w-full aspect-[4/5] max-h-[520px] bg-black overflow-hidden">
        <Image
          src={heroCampaign.image}
          alt={heroCampaign.title}
          fill
          unoptimized
          priority
          className="object-cover opacity-85"
        />
        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />

        {/* Big Bold Headline (Fashion Nova Typography) */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 px-4 text-center z-10 space-y-2">
          <span className="text-[11px] font-mono tracking-widest text-neutral-300 uppercase font-semibold">
            {heroCampaign.subtitle}
          </span>

          <h1 className="text-4xl font-black text-white uppercase tracking-tight leading-none drop-shadow-md">
            {heroCampaign.title}
          </h1>

          <p className="text-xs font-mono font-bold tracking-widest text-amber-300 uppercase">
            {heroCampaign.code}
          </p>

          <div className="pt-2">
            <Link
              href={heroCampaign.link}
              className="inline-block text-xs font-black uppercase text-white tracking-widest underline underline-offset-4 decoration-2 hover:text-amber-300 transition-colors"
            >
              SHOP NOW
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. SECONDARY HIGH-CONTRAST TICKER (FASHION NOVA BAR) ── */}
      <section className="bg-black text-white px-4 py-3 border-y border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <div className="text-left">
            <span className="text-[11px] font-black uppercase tracking-wider block leading-none">
              100% ESCROW PROTECTED
            </span>
            <span className="text-[9px] text-neutral-400 tracking-tight">
              Funds held securely until delivery
            </span>
          </div>
        </div>

        <Link
          href="/shop"
          className="flex items-center gap-0.5 text-[11px] font-black uppercase tracking-wider text-white hover:text-amber-300 transition-colors"
        >
          <span>SHOP NOW</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      {/* ── 6. SHOP BY CATEGORY (SERIOUS, HIGH-IMPACT TILES) ─── */}
      <section className="px-4 pt-8 space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <h2 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
            Shop by Category
          </h2>
          <Link
            href="/shop"
            className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase hover:text-black dark:hover:text-white"
          >
            View All
          </Link>
        </div>

        {/* High-Impact 2-Column Category Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.link}
              className="relative aspect-[4/5] rounded-xl overflow-hidden bg-black group border border-neutral-200 dark:border-neutral-800"
            >
              <Image
                src={cat.image}
                alt={cat.title}
                fill
                unoptimized
                className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

              <div className="absolute bottom-3 inset-x-3 text-left z-10">
                <h3 className="text-xs font-black uppercase text-white leading-tight drop-shadow-sm">
                  {cat.title}
                </h3>
                <span className="text-[9px] font-medium text-neutral-300 block truncate drop-shadow-sm mt-0.5">
                  {cat.subtitle}
                </span>
                <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider block mt-1">
                  Shop Now →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 7. TRENDING DROPS FEED (2-COLUMN PRODUCT GRID) ───── */}
      <section className="px-4 pt-10 space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
              Trending Drops
            </h2>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
              Verified Atelier Pieces
            </span>
          </div>
          <span className="text-[11px] font-bold text-neutral-500">
            {productsList.length} items
          </span>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {productsList.map((product) => {
            const isFav = isInVault(product.id);
            const imageSrc = product.imageUrl || (Array.isArray(product.images) && product.images[0]) || '/images/products/BlackTrapStarHoodie.jpg';

            return (
              <div
                key={product.id}
                className="flex flex-col group border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-[#111113]"
              >
                {/* Product Image (Portrait 3:4) */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                  <Link href={`/shop/${product.id}`} className="block h-full w-full relative">
                    <Image
                      src={imageSrc}
                      alt={product.name}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Wishlist Heart Top-Right */}
                  <button
                    type="button"
                    onClick={() => toggleVaultItem(product)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm text-black dark:text-white hover:opacity-80 active:scale-90 transition-all cursor-pointer z-10"
                    aria-label="Wishlist"
                  >
                    <Heart
                      strokeWidth={1.5}
                      className={`h-4 w-4 ${
                        isFav ? 'fill-rose-500 text-rose-500' : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    />
                  </button>

                  {/* 1-Tap Quick Add */}
                  <button
                    type="button"
                    onClick={() => setQuickBuyProduct(product)}
                    className="absolute bottom-2 inset-x-2 py-1.5 rounded bg-black/90 dark:bg-white/90 text-white dark:text-black text-[10px] font-bold uppercase tracking-wider text-center opacity-90 hover:opacity-100 active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    Quick Add +
                  </button>
                </div>

                {/* Meta */}
                <Link href={`/shop/${product.id}`} className="p-2.5 flex flex-col flex-1 justify-between gap-1">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block truncate">
                      {product.vendorName || 'Atelier'}
                    </span>
                    <h3 className="text-xs font-semibold text-black dark:text-white line-clamp-1 mt-0.5">
                      {product.name}
                    </h3>
                  </div>

                  <div className="pt-1 flex items-baseline justify-between">
                    <span className="text-xs font-black text-black dark:text-white">
                      ₦{Number(product.price || 0).toLocaleString()}
                    </span>
                    <span className="text-[8px] font-bold text-emerald-500 uppercase">
                      Escrow
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 8. TRUST STRIP ───────────────────────────────────── */}
      <section className="px-4 py-10 mt-8 border-t border-neutral-200 dark:border-neutral-800 space-y-3 text-center">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center gap-1.5">
            <Lock className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase leading-tight">100% Escrow</span>
            <span className="text-[8px] text-neutral-400">Zero Risk Payment</span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center gap-1.5">
            <Crown className="h-4 w-4 text-amber-500" />
            <span className="text-[10px] font-bold uppercase leading-tight">Verified Brands</span>
            <span className="text-[8px] text-neutral-400">Authentic Pieces</span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center gap-1.5">
            <Truck className="h-4 w-4 text-cyan-500" />
            <span className="text-[10px] font-bold uppercase leading-tight">Fast Dispatch</span>
            <span className="text-[8px] text-neutral-400">Doorstep & Hub</span>
          </div>
        </div>
      </section>

      {/* Quick Buy Drawer */}
      {quickBuyProduct && (
        <MobileQuickBuyDrawer
          product={quickBuyProduct}
          onClose={() => setQuickBuyProduct(null)}
        />
      )}

    </div>
  );
}
