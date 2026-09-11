'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store/useStore';
import {
  Sparkles, ArrowRight, Layers, ShoppingBag, ShieldCheck,
  Pause, Play, Scissors, Check, Eye
} from 'lucide-react';

interface GalleryItem {
  id: string;
  name: string;
  category: string;
  designer: string;
  price: number;
  image: string;
  fitScore: number;
  specs: string;
  badge: string;
}

const flipGalleryItems: GalleryItem[] = [
  {
    id: 'senator',
    name: 'Onyx Wool Senator Kaftan',
    category: 'Handmade Native Top',
    designer: 'Sartorial Lagos',
    price: 65000,
    image: '/images/products/BlackSenator.jpg',
    fitScore: 99.4,
    specs: 'Italian Merino Wool · Broad Shoulder Drape',
    badge: 'Bespoke Handmade'
  },
  {
    id: 'agbada',
    name: 'Midnight Black Embroidered Agbada',
    category: 'Occasion Ceremonial Robe',
    designer: 'Sartorial Lagos',
    price: 98000,
    image: '/images/products/BlackAgbada.jpg',
    fitScore: 99.8,
    specs: 'Cashmere-Silk · Geometric Gold Chest Plate',
    badge: 'Royal Bespoke'
  },
  {
    id: 'hoodie',
    name: 'Trapstar Cyber Heavyweight Hoodie',
    category: 'Ready-to-Wear Streetwear',
    designer: 'Moji Wears',
    price: 48000,
    image: '/images/products/BlackTrapStarHoodie.jpg',
    fitScore: 97.8,
    specs: '450gsm Cotton Fleece · Dropped Shoulders',
    badge: 'Ready to Wear'
  },
  {
    id: 'denim',
    name: 'Wide-Leg Baggy Denim Jeans',
    category: 'Streetwear Denim',
    designer: 'Moji Wears',
    price: 38000,
    image: '/images/products/BaggyJean.jpg',
    fitScore: 98.2,
    specs: '14oz Raw Selvedge Denim · Relaxed Cut',
    badge: 'Ready to Wear'
  },
  {
    id: 'slides',
    name: 'Handcrafted Cowhide Leather Slides',
    category: 'Handcrafted Footwear',
    designer: 'Kano Artisan Footwear',
    price: 35000,
    image: '/images/products/UnisexSlides.jpg',
    fitScore: 99.1,
    specs: '100% Full-Grain Hide · Anatomical Footbed',
    badge: 'Handmade Leather'
  },
  {
    id: 'jewelry',
    name: '18K Cuban Chain & Luxury Watch',
    category: 'Fine Jewelry & Luxury Accessories',
    designer: 'Vee Collection Luxury',
    price: 85000,
    image: '/images/products/GucciCap.jpg',
    fitScore: 100,
    specs: 'Double-Micro Gold Plated · Pave Accents',
    badge: 'Luxury Jewelry'
  }
];

export default function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Automated auto-flip cycling through the items
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % flipGalleryItems.length);
    }, 3600);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const activeItem = flipGalleryItems[activeIndex];

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-[var(--border-subtle)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Value proposition & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--badge-bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs font-mono-luxury tracking-wider uppercase">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Doorstep & Hub Delivery · Top Nigerian Designers</span>
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
                href="/vendors"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium text-xs tracking-widest uppercase hover:border-[var(--border-hover)] transition-all"
              >
                <Layers className="h-4 w-4 text-[var(--gold-accent)]" />
                <span>Browse All Brands</span>
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

          {/* Right Column: Automated Morphing FLIP Gallery Showcase */}
          <div className="lg:col-span-6 flex justify-center">
            <div
              className="relative w-full max-w-[490px] rounded-3xl surface-card p-4 sm:p-5 shadow-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              
              {/* Header Status Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center text-[var(--gold-accent)]">
                    <Scissors className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-mono-luxury font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      Curated Lookbook
                    </span>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono-luxury">
                      {activeItem.designer}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-mono-luxury font-bold uppercase tracking-wider">
                    Verified Quality
                  </span>

                  <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className="p-1.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    title={isAutoPlaying ? 'Pause Rotation' : 'Resume Rotation'}
                  >
                    {isAutoPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {/* MAIN EXPANDED SPOTLIGHT STAGE */}
              <div className="relative h-[290px] sm:h-[310px] w-full rounded-2xl my-3 bg-black overflow-hidden group">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeItem.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.04 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full h-full"
                  >
                    <Image
                      src={activeItem.image}
                      alt={activeItem.name}
                      fill
                      unoptimized
                      priority
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />

                    {/* Top Origin Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 font-bold">
                        {activeItem.badge}
                      </span>
                    </div>

                    {/* Live Tailoring Tag Overlay */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono-luxury text-white border border-white/20 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-[var(--gold-accent)]" />
                        <span>Curated Drop</span>
                      </span>
                    </div>

                    {/* Bottom Details Bar */}
                    <div className="absolute bottom-3 left-3 right-3 z-10 p-3 rounded-xl bg-black/85 backdrop-blur-md border border-white/15 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono-luxury uppercase text-zinc-300 font-bold">
                          {activeItem.category}
                        </span>
                        <span className="text-sm font-editorial font-bold text-[var(--gold-accent)]">
                          ₦{activeItem.price.toLocaleString()}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white truncate">
                        {activeItem.name}
                      </h4>

                      <p className="text-[10px] text-zinc-300 font-mono-luxury truncate">
                        {activeItem.specs}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* 6-BOX INTERACTIVE FLIP GALLERY GRID STRIP */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold px-1">
                  <span>Rotating Wardrobe Collection:</span>
                  <span className="text-[var(--gold-accent)]">
                    {activeIndex + 1} of {flipGalleryItems.length}
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {flipGalleryItems.map((item, idx) => {
                    const isSelected = activeIndex === idx;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveIndex(idx);
                          setIsAutoPlaying(false);
                        }}
                        className={`group relative h-16 sm:h-18 rounded-xl overflow-hidden border transition-all duration-300 ${
                          isSelected
                            ? 'border-[var(--gold-accent)] ring-2 ring-[var(--gold-accent)]/40 shadow-lg scale-105'
                            : 'border-[var(--border-subtle)] opacity-65 hover:opacity-100 hover:border-[var(--border-hover)]'
                        }`}
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          unoptimized
                          className="object-cover object-center"
                        />

                        {/* Active Shimmer Line */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-gradient-to-t from-[var(--gold-accent)]/30 to-transparent pointer-events-none" />
                        )}

                        <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[7px] font-mono-luxury text-white text-center py-0.5 truncate uppercase">
                          {item.id}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direct Link to Shop */}
              <div className="pt-3.5 flex items-center justify-between border-t border-[var(--border-subtle)] mt-3">
                <div className="text-[11px] font-mono-luxury text-[var(--text-secondary)]">
                  Handcrafted & Ready to Wear
                </div>

                <Link
                  href="/shop"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase tracking-wider text-[10px] font-bold hover:opacity-90 transition-all shadow-md group"
                >
                  <span>Explore Drops</span>
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
