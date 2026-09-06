'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, MapPin, Sparkles, ChevronLeft, ChevronRight,
  Store, Heart, ShieldCheck, Truck, Crown, Check
} from 'lucide-react';
import { useStore } from '@/lib/store/useStore';

export interface DynamicAtelier {
  id: string;
  slug: string;
  name: string;
  location: string;
  city: string;
  state: string;
  focus: string;
  desc: string;
  images: string[];
  tag: string;
  categoryKey: 'streetwear' | 'native' | 'jewelry' | 'footwear' | 'all';
  heroPieces: string;
  rating: string;
  productCount: number;
  minPrice: number;
}

function AtelierSkeleton() {
  return (
    <div className="w-[320px] sm:w-[350px] shrink-0 rounded-3xl surface-card overflow-hidden border border-[var(--border-subtle)] animate-pulse flex flex-col justify-between h-[520px]">
      <div className="h-72 w-full bg-[var(--bg-secondary)]" />
      <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          <div className="h-6 w-3/4 bg-[var(--border-subtle)] rounded-md" />
          <div className="h-3 w-full bg-[var(--border-subtle)] rounded-md" />
          <div className="h-3 w-2/3 bg-[var(--border-subtle)] rounded-md" />
        </div>
        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <div className="h-3 w-16 bg-[var(--border-subtle)] rounded-md" />
          <div className="h-3 w-20 bg-[var(--border-subtle)] rounded-md" />
        </div>
      </div>
    </div>
  );
}

function AtelierCardSlider({ atelier }: { atelier: DynamicAtelier }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { isFollowingVendor, toggleFollowVendor } = useStore();
  const isFollowed = isFollowingVendor(atelier.id);

  const hasMultipleImages = Array.isArray(atelier.images) && atelier.images.length > 1;

  // Auto-slide images every 3.5 seconds (pauses on user hover)
  useEffect(() => {
    if (isHovered || !hasMultipleImages) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % atelier.images.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [atelier.images.length, hasMultipleImages, isHovered]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === 0 ? atelier.images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx((prev) => (prev + 1) % atelier.images.length);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-[320px] sm:w-[350px] shrink-0 group relative rounded-3xl surface-card overflow-hidden flex flex-col justify-between hover:shadow-2xl hover:border-[var(--gold-accent)]/50 transition-all duration-500 border border-[var(--border-subtle)]"
    >
      {/* 1. Sliding Image Lookbook */}
      <Link
        href={`/brand/${atelier.slug}`}
        className="relative h-72 w-full bg-[var(--bg-secondary)] overflow-hidden block"
      >
        {atelier.images.map((imgSrc, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              idx === currentIdx
                ? 'opacity-100 scale-100 z-10'
                : 'opacity-0 scale-105 pointer-events-none z-0'
            }`}
          >
            <Image
              src={imgSrc}
              alt={`${atelier.name} drop ${idx + 1}`}
              fill
              unoptimized
              className="object-cover object-center brightness-95 group-hover:brightness-100 group-hover:scale-105 transition-all duration-700"
            />
          </div>
        ))}

        {/* Top-Left Craft Origin Tag */}
        <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-black/85 backdrop-blur-md text-[10px] font-mono-luxury uppercase tracking-wider text-white font-bold border border-white/10 shadow-sm">
            {atelier.tag}
          </span>
        </div>

        {/* Top-Right Follow Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFollowVendor(atelier.id);
          }}
          className={`absolute top-3.5 right-3.5 z-20 h-8 w-8 rounded-full flex items-center justify-center transition-all backdrop-blur-md border ${
            isFollowed
              ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)] shadow-md'
              : 'bg-black/70 text-white border-white/10 hover:text-rose-400 hover:scale-105'
          }`}
          title={isFollowed ? 'Following Atelier' : 'Follow Atelier'}
        >
          <Heart className={`h-3.5 w-3.5 ${isFollowed ? 'fill-current' : ''}`} />
        </button>

        {/* Bottom-Left Location Pill */}
        <div className="absolute bottom-3.5 left-3.5 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/85 backdrop-blur-md text-[10px] font-mono-luxury text-[var(--gold-accent)] border border-white/10 font-semibold shadow-sm">
          <MapPin className="h-3 w-3" />
          <span className="truncate max-w-[170px]">{atelier.location}</span>
        </div>

        {/* Bottom-Right Slide Indicator Dots */}
        {hasMultipleImages && (
          <div className="absolute bottom-3.5 right-3.5 z-20 flex items-center gap-1.5 bg-black/75 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
            {atelier.images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIdx ? 'w-4 bg-[var(--gold-accent)]' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Hover Arrow Controls */}
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous product photo"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black cursor-pointer shadow-md"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next product photo"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black cursor-pointer shadow-md"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </Link>

      {/* 2. Atelier Details & Actions */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Link href={`/brand/${atelier.slug}`} className="hover:text-[var(--gold-accent)] transition-colors">
              <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)] leading-snug">
                {atelier.name}
              </h3>
            </Link>
          </div>

          <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed line-clamp-2">
            {atelier.desc}
          </p>

          <div className="pt-2">
            <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase tracking-wider block">
              Signature Drops:
            </span>
            <span className="text-xs font-mono-luxury text-[var(--text-primary)] font-bold line-clamp-1">
              {atelier.heroPieces}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase">
              {atelier.rating}
            </span>
            {atelier.minPrice > 0 && (
              <span className="text-xs font-mono-luxury text-[var(--gold-accent)] font-bold">
                From ₦{Number(atelier.minPrice).toLocaleString()}
              </span>
            )}
          </div>

          <Link
            href={`/brand/${atelier.slug}`}
            className="text-xs font-mono-luxury uppercase tracking-wider text-[var(--gold-accent)] font-bold hover:underline inline-flex items-center gap-1 group/btn"
          >
            <span>Shop Brand</span>
            <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function JoinCollectiveCard() {
  return (
    <div className="w-[320px] sm:w-[350px] shrink-0 rounded-3xl p-6 sm:p-7 surface-card border-2 border-[var(--gold-accent)]/35 flex flex-col justify-between space-y-6 relative overflow-hidden bg-gradient-to-br from-[var(--bg-secondary)] via-[var(--bg-surface)] to-[var(--gold-subtle)]/20 shadow-xl group hover:border-[var(--gold-accent)] transition-all duration-300">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/40 text-[var(--gold-accent)] text-[10px] font-mono-luxury uppercase font-bold tracking-wider">
            <Crown className="h-3 w-3" />
            <span>JOIN THE COLLECTIVE</span>
          </div>
          <Sparkles className="h-4 w-4 text-[var(--gold-accent)] animate-pulse" />
        </div>

        <div>
          <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)] leading-tight">
            Are You a Nigerian Designer or Boutique?
          </h3>
          <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed mt-2.5">
            Open your sovereign digital storefront on Ìrísí. Access verified customer escrow, nationwide doorstep logistics, and reach thousands of diaspora clients.
          </p>
        </div>

        <ul className="space-y-2 pt-1 text-[11px] font-mono-luxury text-[var(--text-primary)]">
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>100% Escrow Protection via Paystack</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Doorstep Logistics Across 36 States</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Zero Setup or Listing Fees</span>
          </li>
        </ul>
      </div>

      <div className="pt-4 border-t border-[var(--border-subtle)]">
        <Link
          href="/vendors"
          className="w-full py-3 px-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-wider font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md group-hover:scale-[1.02]"
        >
          <span>Apply for Verification</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function CuratedAteliers() {
  const [ateliers, setAteliers] = useState<DynamicAtelier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFeaturedAteliers() {
      try {
        const res = await fetch('/api/vendors/featured');
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.ateliers)) {
          setAteliers(data.ateliers);
        }
      } catch (err) {
        console.error('Failed to load featured ateliers:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadFeaturedAteliers();
    return () => { isMounted = false; };
  }, []);

  const updateScrollButtons = () => {
    if (!trackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [ateliers, activeTab]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!trackRef.current) return;
    const scrollAmount = 370;
    trackRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Filtered ateliers
  const filteredAteliers = activeTab === 'all'
    ? ateliers
    : ateliers.filter(a => a.categoryKey === activeTab);

  // Tabs with live counts
  const tabs = [
    { id: 'all', label: 'All Houses', count: ateliers.length },
    { id: 'streetwear', label: 'Streetwear & Drops', count: ateliers.filter(a => a.categoryKey === 'streetwear').length },
    { id: 'native', label: 'Bespoke Tailoring', count: ateliers.filter(a => a.categoryKey === 'native').length },
    { id: 'jewelry', label: 'Artisanal Jewelry', count: ateliers.filter(a => a.categoryKey === 'jewelry').length },
  ].filter(t => t.id === 'all' || t.count > 0);

  return (
    <section className="py-20 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Header with Provenance Pill & Carousel Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--badge-bg)] border border-[var(--border-subtle)] text-[var(--gold-accent)] text-xs font-mono-luxury uppercase tracking-widest font-bold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>THE DESIGN HOUSES</span>
              </div>
              <span className="text-[10px] font-mono-luxury px-3 py-1 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-muted)] font-semibold">
                Lagos · Ogun · Oyo
              </span>
            </div>

            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-normal text-[var(--text-primary)] leading-tight">
              Featured Nigerian Designers
            </h2>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              Explore verified sovereign ateliers pushing contemporary African menswear, bespoke native cuts, streetwear drops, and artisanal jewelry forward.
            </p>
          </div>

          {/* Controls: Browse Catalog + Carousel Chevron Buttons */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all font-semibold"
            >
              <span>Browse Catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className={`h-10 w-10 rounded-full border border-[var(--border-subtle)] flex items-center justify-center transition-all cursor-pointer ${
                  canScrollLeft
                    ? 'surface-card text-[var(--text-primary)] hover:border-[var(--gold-accent)] hover:text-[var(--gold-accent)] shadow-sm'
                    : 'opacity-30 text-[var(--text-muted)] cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className={`h-10 w-10 rounded-full border border-[var(--border-subtle)] flex items-center justify-center transition-all cursor-pointer ${
                  canScrollRight
                    ? 'surface-card text-[var(--text-primary)] hover:border-[var(--gold-accent)] hover:text-[var(--gold-accent)] shadow-sm'
                    : 'opacity-30 text-[var(--text-muted)] cursor-not-allowed'
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        {!isLoading && tabs.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-mono-luxury uppercase tracking-wider font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
                    : 'surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`ml-1.5 text-[10px] ${activeTab === tab.id ? 'opacity-80' : 'text-[var(--gold-accent)]'}`}>
                  ({tab.count})
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Horizontal Carousel Track */}
        {isLoading ? (
          <div className="flex items-stretch gap-6 overflow-x-hidden pb-4">
            {[1, 2, 3, 4].map((n) => (
              <AtelierSkeleton key={n} />
            ))}
          </div>
        ) : filteredAteliers.length === 0 ? (
          <div className="p-12 rounded-3xl surface-card border border-[var(--border-subtle)] text-center space-y-3">
            <Store className="h-10 w-10 text-[var(--text-muted)] mx-auto opacity-50" />
            <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
              No Ateliers in this Category Yet
            </h3>
            <p className="text-xs font-mono-luxury text-[var(--text-secondary)]">
              Switch back to All Houses to view all live verified Nigerian design houses.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className="px-5 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase font-bold"
            >
              Show All Houses
            </button>
          </div>
        ) : (
          <div
            ref={trackRef}
            className="flex items-stretch gap-6 overflow-x-auto scrollbar-none pb-4 pt-1 scroll-smooth snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Live Platform Ateliers */}
            {filteredAteliers.map((atelier) => (
              <div key={atelier.id} className="snap-start">
                <AtelierCardSlider atelier={atelier} />
              </div>
            ))}

            {/* "+ Join as a Verified Designer" Card always seamlessly completes the track */}
            <div className="snap-start">
              <JoinCollectiveCard />
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
