'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin, Sparkles, ChevronLeft, ChevronRight, Store } from 'lucide-react';

export interface AtelierData {
  id: string;
  slug: string;
  name: string;
  location: string;
  focus: string;
  desc: string;
  images: string[];
  tag: string;
  heroPieces: string;
  rating: string;
  productCount: number;
}

function AtelierSkeleton() {
  return (
    <div className="rounded-3xl surface-card overflow-hidden border border-[var(--border-subtle)] animate-pulse flex flex-col justify-between h-[450px]">
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

function AtelierCardSlider({ atelier }: { atelier: AtelierData }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const hasMultipleImages = Array.isArray(atelier.images) && atelier.images.length > 1;

  // Auto-slide animation every 3.5 seconds (pauses on user hover)
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

  const currentImage = atelier.images[currentIdx] || atelier.images[0] || '/images/products/BlackTrapStarHoodie.jpg';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-3xl surface-card overflow-hidden flex flex-col justify-between hover:shadow-2xl hover:border-[var(--gold-accent)]/50 transition-all duration-500 border border-[var(--border-subtle)]"
    >
      {/* Animated Sliding Image Container */}
      <Link href={`/brand/${atelier.slug}`} className="relative h-72 w-full bg-[var(--bg-secondary)] overflow-hidden block">
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
              className="object-cover object-center brightness-95 group-hover:brightness-100 transition-all"
            />
          </div>
        ))}

        {/* Top Origin Tag */}
        <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-black/85 backdrop-blur-md text-[10px] font-mono-luxury uppercase tracking-wider text-white font-bold border border-white/10">
            {atelier.tag}
          </span>
        </div>

        {/* Location Pill */}
        <div className="absolute bottom-3.5 left-3.5 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/85 backdrop-blur-md text-[10px] font-mono-luxury text-[var(--gold-accent)] border border-white/10 font-semibold">
          <MapPin className="h-3 w-3" />
          <span>{atelier.location}</span>
        </div>

        {/* Slide Indicator Dots (Only if multiple real product photos exist) */}
        {hasMultipleImages && (
          <div className="absolute bottom-3.5 right-3.5 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full">
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

        {/* Interactive Hover Arrows */}
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous product image"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next product image"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </Link>

      {/* Atelier Details */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Link href={`/brand/${atelier.slug}`} className="hover:text-[var(--gold-accent)] transition-colors">
              <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
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
          <span className="text-[11px] font-mono-luxury text-emerald-500 font-bold">
            {atelier.rating}
          </span>

          <Link
            href={`/brand/${atelier.slug}`}
            className="text-xs font-mono-luxury uppercase tracking-wider text-[var(--gold-accent)] font-bold hover:underline inline-flex items-center gap-1"
          >
            <span>Shop Brand</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CuratedAteliers() {
  const [ateliers, setAteliers] = useState<AtelierData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <section className="py-20 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--badge-bg)] border border-[var(--border-subtle)] text-[var(--gold-accent)] text-xs font-mono-luxury uppercase tracking-widest font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>THE DESIGN HOUSES</span>
            </div>

            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-normal text-[var(--text-primary)]">
              Featured Nigerian Designers
            </h2>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              Discover verified independent Nigerian fashion ateliers, bespoke couturiers, and streetwear boutiques with live inventory.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all self-start md:self-auto"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Dynamic Atelier Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <AtelierSkeleton key={n} />
            ))}
          </div>
        ) : ateliers.length === 0 ? (
          <div className="p-12 rounded-3xl surface-card border border-[var(--border-subtle)] text-center space-y-3">
            <Store className="h-10 w-10 text-[var(--text-muted)] mx-auto opacity-50" />
            <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
              New Atelier Collections Dropping Soon
            </h3>
            <p className="text-xs font-mono-luxury text-[var(--text-secondary)]">
              Verified designer storefronts are currently in preparation. Check our shop catalog in the meantime.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ateliers.map((atelier) => (
              <AtelierCardSlider key={atelier.id} atelier={atelier} />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
