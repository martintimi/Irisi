'use client';

import React, { useState, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface MediaSlide {
  type: 'image' | 'video';
  url: string;
  colorName?: string;
  colorHex?: string;
}

interface MobileProductSliderProps {
  product: any;
  priority?: boolean;
  aspectRatioClass?: string;
  idx?: number;
  children?: React.ReactNode;
}

export default function MobileProductSlider({
  product,
  priority = false,
  aspectRatioClass = 'aspect-[3/4]',
  idx = 0,
  children,
}: MobileProductSliderProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);


  // Gather all unique images & video for this product
  const slides = useMemo<MediaSlide[]>(() => {
    const list: MediaSlide[] = [];
    const seenUrls = new Set<string>();

    const addImage = (url: string, colorName?: string, colorHex?: string) => {
      if (!url || seenUrls.has(url)) return;
      seenUrls.add(url);
      list.push({ type: 'image', url, colorName, colorHex });
    };

    // 1. Cover / Primary Image
    if (product.imageUrl) {
      const matchColor = Array.isArray(product.colors)
        ? product.colors.find((c: any) => c?.imageUrl === product.imageUrl)
        : undefined;
      addImage(product.imageUrl, matchColor?.name, matchColor?.hex);
    }

    // 2. Gallery images from product.images
    if (Array.isArray(product.images)) {
      product.images.forEach((item: any) => {
        const url = typeof item === 'string' ? item : item?.url;
        const colorName = typeof item === 'object' ? item?.colorName : undefined;
        const colorHex = typeof item === 'object' ? item?.colorHex : undefined;
        if (url) addImage(url, colorName, colorHex);
      });
    }

    // 3. Colorways with linked images
    if (Array.isArray(product.colors)) {
      product.colors.forEach((c: any) => {
        if (c && typeof c === 'object' && c.imageUrl) {
          addImage(c.imageUrl, c.name, c.hex);
        }
      });
    }

    // 4. Catwalk micro-video if present
    if (product.videoUrl) {
      list.push({ type: 'video', url: product.videoUrl });
    }

    return list.length > 0 ? list : [{ type: 'image', url: '/images/products/BlackTrapStarHoodie.jpg' }];
  }, [product.imageUrl, product.images, product.colors, product.videoUrl]);

  const hasMultiple = slides.length > 1;

  // Touch tracking to distinguish horizontal swipe vs intentional click vs vertical page scroll
  const touchStartPos = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDragging = useRef(false);
  const justNavigated = useRef(false);

  const navigateToProduct = useCallback(() => {
    if (isDragging.current || justNavigated.current) return;
    justNavigated.current = true;
    router.push(`/shop/${product.id}`);
    setTimeout(() => {
      justNavigated.current = false;
    }, 1000);
  }, [product.id, router]);

  // Handle slide index update on horizontal scroll
  const handleScroll = useCallback(() => {
    isDragging.current = true;
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const currentIdx = Math.round(el.scrollLeft / el.clientWidth);
    if (currentIdx !== activeIndex && currentIdx >= 0 && currentIdx < slides.length) {
      setActiveIndex(currentIdx);
    }
  }, [activeIndex, slides.length]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartPos.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - touchStartPos.current.x);
    const dy = Math.abs(t.clientY - touchStartPos.current.y);

    // If finger moved in either horizontal or vertical direction, it's a drag/scroll, not a tap
    if (dx > 8 || dy > 8) {
      isDragging.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartPos.current) return;
    const dt = Date.now() - touchStartPos.current.time;

    // If tap was quick and not dragging/scrolling, navigate
    if (!isDragging.current && dt < 400) {
      navigateToProduct();
    }

    touchStartPos.current = null;
    // Keep isDragging.current true for 250ms so synthetic click is suppressed
    setTimeout(() => {
      isDragging.current = false;
    }, 250);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    navigateToProduct();
  };

  return (
    <div
      className={`relative w-full bg-[var(--bg-secondary)] overflow-hidden rounded-xl border border-[var(--border-subtle)] ${aspectRatioClass} select-none group`}
    >
      {/* Horizontal Snap Scroll Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        className="w-full h-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-none touch-manipulation cursor-pointer overscroll-x-contain"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x pan-y',
        }}
      >
        {slides.map((media, sIdx) => {
          return (
            <div
              key={`${media.url}-${sIdx}`}
              className="relative w-full h-full flex-shrink-0 snap-start select-none overflow-hidden"
              style={{ minWidth: '100%', width: '100%' }}
            >
              {media.type === 'video' ? (
                <div className="relative w-full h-full">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    unoptimized
                    priority={priority && sIdx === 0}
                    loading={priority && sIdx === 0 ? 'eager' : 'lazy'}
                    className="object-cover pointer-events-none"
                  />
                  <video
                    ref={(el) => {
                      if (el) {
                        el.muted = true;
                        el.defaultMuted = true;
                        el.playsInline = true;
                        el.setAttribute('muted', '');
                        el.setAttribute('playsinline', '');
                        el.setAttribute('webkit-playsinline', '');
                        el.setAttribute('x5-playsinline', '');
                        if (el.paused) el.play().catch(() => {});
                      }
                    }}
                    src={media.url}
                    poster={product.imageUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    webkit-playsinline="true"
                    x5-playsinline="true"
                    preload="metadata"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                </div>
              ) : (
                <Image
                  src={media.url}
                  alt={`${product.name} - view ${sIdx + 1}`}
                  fill
                  unoptimized
                  priority={priority && sIdx === 0}
                  loading={priority && sIdx === 0 ? 'eager' : 'lazy'}
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Slide Dot Indicators */}
      {hasMultiple && (
        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1 pointer-events-none z-10">
          {slides.map((_, dotIdx) => (
            <span
              key={dotIdx}
              className={`transition-all duration-300 rounded-full shadow-sm ${
                dotIdx === activeIndex
                  ? 'w-3.5 h-1 bg-white ring-1 ring-black/20'
                  : 'w-1 h-1 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Passed Overlays (Discount badge, wishlist heart, etc.) */}
      {children}
    </div>
  );
}
