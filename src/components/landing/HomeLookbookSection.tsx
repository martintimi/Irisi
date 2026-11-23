'use client';

import React, { useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/lib/store/useStore';
import { ArrowUpRight, ChevronRight, Sparkles } from 'lucide-react';

interface HomeLookbookSectionProps {
  variant?: 'mobile' | 'desktop';
  products?: any[];
}

/**
 * "In Motion · Live Lookbook" Editorial Reel Section
 * Automatically plays real vendor product videos silently (Adidas/Zara style — zero controls/mute/pause)
 * and pairs them with smooth CSS Ken Burns slow-motion cards for top curated pieces.
 */
export default function HomeLookbookSection({
  variant = 'desktop',
  products: propProducts,
}: HomeLookbookSectionProps) {
  const { allProducts, fetchProductsFromDb } = useStore();

  useEffect(() => {
    if ((!propProducts || propProducts.length === 0) && (!allProducts || allProducts.length === 0)) {
      fetchProductsFromDb();
    }
  }, [propProducts, allProducts, fetchProductsFromDb]);

  const sourceProducts = propProducts && propProducts.length > 0 ? propProducts : allProducts || [];

  // Prioritize real products with uploaded videos first, then fill with visually diverse fresh drops
  const lookbookItems = useMemo(() => {
    const valid = sourceProducts.filter(
      (p) => p && p.id && (p.videoUrl || (p.imageUrl && p.imageUrl !== '/images/no-product.svg'))
    );
    const withVideo = valid.filter((p) => Boolean(p.videoUrl));
    const withoutVideo = valid.filter((p) => !p.videoUrl);

    // Ensure brand diversity across the reel so shoppers discover multiple brands
    const picked: any[] = [];
    const vendorCounts: Record<string, number> = {};

    for (const item of [...withVideo, ...withoutVideo]) {
      const vKey = (item.vendorId || item.vendorName || 'brand').toLowerCase();
      if ((vendorCounts[vKey] || 0) >= 2 && picked.length < 6) continue;
      picked.push(item);
      vendorCounts[vKey] = (vendorCounts[vKey] || 0) + 1;
      if (picked.length >= 6) break;
    }

    if (picked.length < 4) {
      for (const item of valid) {
        if (!picked.some((x) => x.id === item.id)) {
          picked.push(item);
          if (picked.length >= 4) break;
        }
      }
    }

    return picked;
  }, [sourceProducts]);

  if (lookbookItems.length === 0) return null;

  const hasAnyVideo = lookbookItems.some((p) => Boolean(p.videoUrl));

  if (variant === 'mobile') {
    return (
      <section className="pt-10 space-y-3.5">
        <div className="px-4 pb-2 border-b border-neutral-200 dark:border-neutral-800 flex items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono-luxury uppercase tracking-[0.2em] text-[var(--gold-accent)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold-accent)] animate-pulse" />
              <span>{hasAnyVideo ? 'In Motion · Live Reel' : 'Curated Lookbook'}</span>
            </div>
            <h2 className="font-editorial text-xl font-normal text-black dark:text-white leading-tight mt-0.5">
              See It In Motion
            </h2>
          </div>

          <Link
            href="/shop"
            className="text-[11px] font-mono-luxury uppercase tracking-wider text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white flex items-center gap-0.5 shrink-0"
          >
            <span>Explore</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex items-stretch gap-3 overflow-x-auto px-4 no-scrollbar pb-2 snap-x snap-mandatory">
          {lookbookItems.map((item, idx) => {
            const imgSrc =
              item.imageUrl ||
              (Array.isArray(item.images) && item.images[0]) ||
              '/images/no-product.svg';

            return (
              <Link
                key={`lookbook-m-${item.id}`}
                href={`/shop/${item.id}`}
                className="relative w-[228px] aspect-[3/4.3] rounded-[22px] overflow-hidden bg-[#0D0D10] border border-neutral-200/80 dark:border-white/10 shrink-0 snap-start group"
              >
                {item.videoUrl ? (
                  <>
                    <Image
                      src={imgSrc}
                      alt={item.name}
                      fill
                      unoptimized
                      className="object-cover pointer-events-none"
                    />
                    <video
                      src={item.videoUrl}
                      poster={imgSrc}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls={false}
                      disablePictureInPicture
                      controlsList="nodownload noplaybackrate noremoteplayback"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                  </>
                ) : (
                  <Image
                    src={imgSrc}
                    alt={item.name}
                    fill
                    unoptimized
                    className={`object-cover irisi-ken-burns ${
                      idx % 2 === 1 ? 'irisi-ken-burns-alt' : ''
                    }`}
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />

                {/* Top Editorial Tag */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[9px] font-mono-luxury uppercase tracking-wider text-white/90 truncate max-w-[145px]">
                    {item.vendorName || 'Featured Brand'}
                  </span>
                  {item.videoUrl && (
                    <span className="h-2 w-2 rounded-full bg-[#E6C367] shadow-[0_0_8px_rgba(230,195,103,0.9)] shrink-0" />
                  )}
                </div>

                {/* Bottom Shop Overlay */}
                <div className="absolute bottom-3.5 inset-x-3.5 z-10 space-y-1.5">
                  <h3 className="font-editorial text-lg font-normal text-white leading-snug line-clamp-2 drop-shadow-sm">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-xs font-mono-luxury text-[#E6C367]">
                      ₦{Number(item.price || 0).toLocaleString()}
                    </span>
                    <span className="h-7 px-2.5 rounded-full bg-white text-black text-[10px] font-mono-luxury uppercase tracking-wider inline-flex items-center gap-1">
                      <span>Shop</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  /* ── DESKTOP EDITORIAL LOOKBOOK SECTION ─────────────────────────────── */
  return (
    <section className="py-20 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-[var(--border-subtle)]">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--badge-bg)] border border-[var(--border-subtle)] text-[var(--gold-accent)] text-[11px] font-mono-luxury uppercase tracking-[0.2em]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{hasAnyVideo ? 'In Motion · Live Lookbook' : 'The Lookbook Edit'}</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-normal text-[var(--text-primary)] leading-tight">
              See Every Piece In Motion
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              Real movement, drape, and craftsmanship directly from independent brands on ÌRÍSÍ — tap any look to shop immediately.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-primary)] hover:border-[var(--gold-accent)] hover:text-[var(--gold-accent)] transition-all self-start md:self-auto"
          >
            <span>Shop Live Catalog</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {lookbookItems.slice(0, 4).map((item, idx) => {
            const imgSrc =
              item.imageUrl ||
              (Array.isArray(item.images) && item.images[0]) ||
              '/images/no-product.svg';

            return (
              <Link
                key={`lookbook-d-${item.id}`}
                href={`/shop/${item.id}`}
                className="group relative aspect-[3/4.4] rounded-[26px] overflow-hidden bg-[#0D0D10] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/60 transition-all shadow-lg"
              >
                {item.videoUrl ? (
                  <>
                    <Image
                      src={imgSrc}
                      alt={item.name}
                      fill
                      unoptimized
                      className="object-cover pointer-events-none"
                    />
                    <video
                      src={item.videoUrl}
                      poster={imgSrc}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls={false}
                      disablePictureInPicture
                      controlsList="nodownload noplaybackrate noremoteplayback"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                  </>
                ) : (
                  <Image
                    src={imgSrc}
                    alt={item.name}
                    fill
                    unoptimized
                    className={`object-cover irisi-ken-burns ${
                      idx % 2 === 1 ? 'irisi-ken-burns-alt' : ''
                    } group-hover:scale-105 transition-transform duration-700`}
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
                  <span className="px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[10px] font-mono-luxury uppercase tracking-wider text-white truncate">
                    {item.vendorName || 'Featured Brand'}
                  </span>
                  {item.videoUrl && (
                    <span className="px-2 py-0.5 rounded-full bg-[#E6C367]/20 border border-[#E6C367]/40 text-[#E6C367] text-[9px] font-mono-luxury uppercase tracking-wider shrink-0">
                      Film
                    </span>
                  )}
                </div>

                <div className="absolute bottom-5 inset-x-5 z-10 space-y-2">
                  <h3 className="font-editorial text-xl font-normal text-white leading-snug line-clamp-2">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-mono-luxury text-[#E6C367]">
                      ₦{Number(item.price || 0).toLocaleString()}
                    </span>
                    <span className="h-8 px-3.5 rounded-full bg-white text-black text-[10px] font-mono-luxury uppercase tracking-wider inline-flex items-center gap-1 group-hover:bg-[#E6C367] transition-colors">
                      <span>Shop</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
