'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, Layers, ShoppingBag,
  Pause, Play, Scissors, ChevronLeft, ChevronRight
} from 'lucide-react';

interface CategoryShowcaseItem {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  department: string;
  badge: string;
  desc: string;
  image: string;
}

// ─── EXACT CATEGORY IMAGES (Matching Mobile) ───────────────────────────────

const menCategoryShowcase: CategoryShowcaseItem[] = [
  {
    id: 'men-senator',
    slug: 'senator',
    name: 'Senator Sets & Kaftans',
    shortName: 'SENATOR',
    department: "Men's Native Wear",
    badge: 'Bespoke Native',
    desc: 'Tailored 2-piece native suits & bespoke Italian wool cuts',
    image: '/images/uploaded/senatorformen.jpeg'
  },
  {
    id: 'men-agbada',
    slug: 'agbada',
    name: 'Grand Agbada 3-Piece',
    shortName: 'AGBADA',
    department: 'Ceremonial Native',
    badge: 'Royal Bespoke',
    desc: 'Embroidered 3-piece ceremonial robes & cashmere silk',
    image: '/images/uploaded/agbadaformen.jpeg'
  },
  {
    id: 'men-hoodie',
    slug: 'hoodies',
    name: 'Hoodies & Sweats',
    shortName: 'HOODIES',
    department: 'Urban Streetwear',
    badge: 'Streetwear Drop',
    desc: 'Heavyweight boxy fleece hoodies & dropped shoulder cuts',
    image: '/images/uploaded/prod-1788316482065-1-489.jpg'
  },
  {
    id: 'men-denim',
    slug: 'jeans',
    name: 'Jeans & Denim',
    shortName: 'DENIM',
    department: 'Streetwear Denim',
    badge: 'Ready to Wear',
    desc: 'Baggy wide-leg jeans, cargo pants & raw denim',
    image: '/images/uploaded/pantsandcargo.jpeg'
  },
  {
    id: 'men-slides',
    slug: 'slides',
    name: 'Slides, Palms & Slippers',
    shortName: 'SLIDES',
    department: 'Artisan Footwear',
    badge: 'Handmade Leather',
    desc: 'Handcrafted leather slides & casual comfort slippers',
    image: '/images/uploaded/sides_palm.jpeg'
  },
  {
    id: 'men-sneakers',
    slug: 'sneakers',
    name: 'Street Shoes & Sneakers',
    shortName: 'SNEAKERS',
    department: 'Designer Footwear',
    badge: 'Casual & Drops',
    desc: 'Retro trainers, low-tops & urban street shoes',
    image: '/images/uploaded/shoefootwareformen.jpeg'
  },
  {
    id: 'men-clogs',
    slug: 'clogs',
    name: 'Crocs & Foam Clogs',
    shortName: 'CLOGS',
    department: 'Comfort Footwear',
    badge: 'Everyday Ease',
    desc: 'Platform foam slip-ons, classic clogs & cushioned mules',
    image: '/images/uploaded/crocsformen.jpeg'
  },
  {
    id: 'men-tees',
    slug: 'tshirts',
    name: 'Graphic Tees & Tops',
    shortName: 'TEES',
    department: 'Streetwear Apparel',
    badge: 'Graphic Drop',
    desc: 'Oversized street prints & heavyweight 240gsm cotton tees',
    image: '/images/uploaded/t-shirtsandgraphic.jpeg'
  },
  {
    id: 'men-caps',
    slug: 'caps',
    name: 'Caps & Beanies',
    shortName: 'CAPS',
    department: 'Accessories',
    badge: 'Street Headwear',
    desc: 'Designer baseball caps, trucker hats & street beanies',
    image: '/images/uploaded/capshatbeanies.jpeg'
  },
  {
    id: 'men-bags',
    slug: 'backpacks',
    name: 'Bags & Accessories',
    shortName: 'BAGS',
    department: 'Bags & Luggage',
    badge: 'Everyday Carry',
    desc: 'Crossbodies, chest bags & weekend leather travel bags',
    image: '/images/uploaded/leaderBags.jpeg'
  }
];

const womenCategoryShowcase: CategoryShowcaseItem[] = [
  {
    id: 'women-dresses',
    slug: 'dresses',
    name: 'Dresses & Gowns',
    shortName: 'DRESSES',
    department: "Women's Apparel",
    badge: 'Evening Gowns',
    desc: 'Evening gowns, bodycons & elegant cocktail dresses',
    image: '/images/categories/dressesforwomen.jpeg'
  },
  {
    id: 'women-coord',
    slug: 'two-piece',
    name: 'Two-Piece Sets',
    shortName: 'CO-ORD',
    department: 'Contemporary Sets',
    badge: 'Ready to Wear',
    desc: 'Matching resort sets, tailored blazer co-ords & chic pant sets',
    image: '/images/categories/women_coord.jpg'
  },
  {
    id: 'women-tops',
    slug: 'tops',
    name: 'Tops & Corset',
    shortName: 'TOPS',
    department: "Women's Apparel",
    badge: 'Statement Fit',
    desc: 'Structured corsets, chic crop tops & elegant blouses',
    image: '/images/uploaded/Streetwear&topsWomen.jpeg'
  },
  {
    id: 'women-heels',
    slug: 'heels',
    name: 'Shoes & Heels',
    shortName: 'HEELS',
    department: 'Designer Footwear',
    badge: 'Head-to-Toe Glam',
    desc: 'Stiletto heels, strappy dress sandals & elegant mules',
    image: '/images/categories/women_heels.jpg'
  },
  {
    id: 'women-denim',
    slug: 'women-jeans',
    name: 'Jeans & Cargo Pants',
    shortName: 'DENIM',
    department: 'Streetwear Denim',
    badge: 'Flattering Cut',
    desc: 'High-waisted denim, wide-leg jeans & utility cargo pants',
    image: '/images/categories/jeanforwomen.jpeg'
  },
  {
    id: 'women-skirts',
    slug: 'skirts',
    name: 'Skirts & Mini Skirts',
    shortName: 'SKIRTS',
    department: "Women's Apparel",
    badge: 'Curated Drop',
    desc: 'Structured mini skirts, pleated midis & satin slip skirts',
    image: '/images/categories/skirtandminishirts.jpeg'
  },
  {
    id: 'women-bags',
    slug: 'handbags',
    name: 'Handbags & Totes',
    shortName: 'BAGS',
    department: 'Luxury Leather',
    badge: 'Designer Leather',
    desc: 'Shoulder bags, leather totes & evening clutches',
    image: '/images/uploaded/LeaderbagsWomen.jpeg'
  },
  {
    id: 'women-jewelry',
    slug: 'jewelry',
    name: 'Jewelry & Watches',
    shortName: 'JEWELRY',
    department: 'Fine Jewelry',
    badge: 'Elegant Accents',
    desc: 'Necklaces, earrings, signet rings & luxury timepieces',
    image: '/images/uploaded/WomenJewelry.jpeg'
  },
  {
    id: 'women-slides',
    slug: 'women-slides',
    name: 'Slides & Flat Slippers',
    shortName: 'SLIDES',
    department: 'Artisan Footwear',
    badge: 'Everyday Comfort',
    desc: 'Casual leather slides, flat slippers & slip-ons',
    image: '/images/uploaded/footwear&slideswomen.jpeg'
  },
  {
    id: 'women-clogs',
    slug: 'clogs',
    name: 'Crocs & Foam Clogs',
    shortName: 'CLOGS',
    department: 'Comfort Footwear',
    badge: 'Everyday Ease',
    desc: 'Platform foam slip-ons & cushioned mules',
    image: '/images/categories/crocs_women.jpg'
  }
];

export default function HeroSection() {
  const [genderTab, setGenderTab] = useState<'men' | 'women'>('men');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const activeCategories = genderTab === 'men' ? menCategoryShowcase : womenCategoryShowcase;
  const currentCategory = activeCategories[activeIndex] || activeCategories[0];

  // Auto-cycle categories
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % activeCategories.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, activeCategories.length]);

  const handleGenderSwitch = (tab: 'men' | 'women') => {
    setGenderTab(tab);
    setActiveIndex(0);
  };

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev === 0 ? activeCategories.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev + 1) % activeCategories.length);
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-[var(--border-subtle)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Column: Value proposition & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">

            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--badge-bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs font-mono-luxury tracking-wider uppercase">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Doorstep &amp; Hub Delivery · Top Nigerian Designers</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[var(--text-primary)] leading-[1.1]">
              Shop Top Nigerian Brands.<br />
              <span className="italic font-normal shimmer-gold">Curated Luxury Pieces.</span><br />
              100% Escrow Secured.
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
              Discover Nigeria&apos;s premier multi-brand fashion marketplace. Shop bespoke native wear, streetwear drops, handcrafted footwear, and fine jewelry from verified independent designers. Each brand dispatches directly to your doorstep with 100% escrow payment protection.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-semibold text-xs tracking-widest uppercase hover:opacity-90 transition-all shadow-lg group"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Explore Marketplace</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/category"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium text-xs tracking-widest uppercase hover:border-[var(--border-hover)] transition-all"
              >
                <Layers className="h-4 w-4 text-[var(--gold-accent)]" />
                <span>Browse All Categories</span>
              </Link>
            </div>

            {/* Proof Points */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[var(--border-subtle)] max-w-md mx-auto lg:mx-0 text-left">
              <div>
                <div className="text-xl sm:text-2xl font-editorial font-medium text-[var(--text-primary)]">100% Quality</div>
                <div className="text-[11px] text-[var(--text-muted)] font-mono-luxury uppercase mt-0.5">Verified Designers</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-editorial font-medium text-emerald-500">Fast Dispatch</div>
                <div className="text-[11px] text-[var(--text-muted)] font-mono-luxury uppercase mt-0.5">Doorstep Delivery</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-editorial font-medium text-[var(--text-primary)]">1 Checkout</div>
                <div className="text-[11px] text-[var(--text-muted)] font-mono-luxury uppercase mt-0.5">Unified Package</div>
              </div>
            </div>

          </div>

          {/* Right Column: Real Category Showcase Slideshow Card */}
          <div className="lg:col-span-6 flex justify-center">
            <div
              className="relative w-full max-w-[490px] rounded-3xl surface-card p-4 sm:p-5 shadow-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >

              {/* Header Status Bar & Gender Switch */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center text-[var(--gold-accent)]">
                    <Scissors className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-mono-luxury font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      Explore Categories
                    </span>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono-luxury">
                      {genderTab === 'men' ? "Men's Collections" : "Women's Collections"}
                    </div>
                  </div>
                </div>

                {/* Gender Tabs & Auto-Play Controls */}
                <div className="flex items-center gap-1.5">
                  <div className="flex rounded-full p-0.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[10px] font-mono-luxury font-bold uppercase">
                    <button
                      onClick={() => handleGenderSwitch('men')}
                      className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                        genderTab === 'men'
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Men
                    </button>
                    <button
                      onClick={() => handleGenderSwitch('women')}
                      className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                        genderTab === 'women'
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Women
                    </button>
                  </div>

                  <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className="p-1.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    title={isAutoPlaying ? 'Pause Slideshow' : 'Resume Slideshow'}
                  >
                    {isAutoPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {/* MAIN EXPANDED SPOTLIGHT STAGE */}
              <div className="relative h-[290px] sm:h-[310px] w-full rounded-2xl my-3 bg-black overflow-hidden group">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentCategory.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.04 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full h-full"
                  >
                    <Image
                      src={currentCategory.image}
                      alt={currentCategory.name}
                      fill
                      unoptimized
                      priority
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

                    {/* Top Origin Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 font-bold shadow-md">
                        {currentCategory.badge}
                      </span>
                    </div>

                    {/* Top Right Curated Category Tag */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono-luxury text-white border border-white/20 flex items-center gap-1.5 shadow-md">
                        <Sparkles className="h-3 w-3 text-[var(--gold-accent)]" />
                        <span>Curated Category</span>
                      </span>
                    </div>

                    {/* Bottom Details Bar */}
                    <div className="absolute bottom-3 left-3 right-3 z-10 p-3 rounded-xl bg-black/85 backdrop-blur-md border border-white/15 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono-luxury uppercase text-zinc-300 font-bold tracking-wider">
                          {currentCategory.department}
                        </span>
                        <span className="text-[10px] font-mono-luxury text-[var(--gold-accent)] font-bold uppercase tracking-wider">
                          Explore Drop →
                        </span>
                      </div>

                      <h4 className="text-base sm:text-lg font-editorial font-bold text-white truncate">
                        {currentCategory.name}
                      </h4>

                      <p className="text-[10px] text-zinc-300 font-mono-luxury truncate">
                        {currentCategory.desc}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* INTERACTIVE CATEGORY THUMBNAIL STRIP */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold px-1">
                  <span>Categories:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--gold-accent)]">
                      {activeIndex + 1} of {activeCategories.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handlePrev}
                        className="p-1 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                        title="Previous category"
                      >
                        <ChevronLeft className="h-2.5 w-2.5" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="p-1 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                        title="Next category"
                      >
                        <ChevronRight className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 6-Thumbnail Strip with Real Images Matching Mobile */}
                <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                  {activeCategories.slice(0, 6).map((item, idx) => {
                    const isSelected = activeIndex === idx;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveIndex(idx);
                          setIsAutoPlaying(false);
                        }}
                        className={`group relative h-16 sm:h-18 rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? 'border-[var(--gold-accent)] ring-2 ring-[var(--gold-accent)]/40 shadow-lg scale-105 z-10'
                            : 'border-[var(--border-subtle)] opacity-70 hover:opacity-100 hover:border-[var(--border-hover)]'
                        }`}
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          unoptimized
                          className="object-cover object-center group-hover:scale-110 transition-transform duration-500"
                        />

                        {/* Active Shimmer Glow */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-gradient-to-t from-[var(--gold-accent)]/30 to-transparent pointer-events-none" />
                        )}

                        {/* Bottom Label Overlay */}
                        <div className="absolute bottom-0 inset-x-0 bg-black/85 text-[7px] sm:text-[8px] font-mono-luxury text-white text-center py-0.5 truncate uppercase tracking-wider font-bold">
                          {item.shortName}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direct Link to Category & All Categories */}
              <div className="pt-3.5 flex items-center justify-between border-t border-[var(--border-subtle)] mt-3">
                <Link
                  href="/category"
                  className="text-[11px] font-mono-luxury text-[var(--text-secondary)] hover:text-[var(--gold-accent)] transition-colors flex items-center gap-1"
                >
                  <span>All Categories</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>

                <Link
                  href={`/category/${currentCategory.slug}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase tracking-wider text-[10px] font-bold hover:opacity-90 transition-all shadow-md group"
                >
                  <span>Explore {currentCategory.shortName}</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
