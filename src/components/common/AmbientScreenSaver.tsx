'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';

interface EditorialSlide {
  id: string;
  title: string;
  categoryName: string;
  designerName: string;
  imageUrl: string;
  description: string;
  linkUrl: string;
}

const DEFAULT_EDITORIAL_SLIDES: EditorialSlide[] = [
  {
    id: 'slide-lv-hoodie',
    title: 'Luxury Monogram Fleece Hoodie',
    categoryName: 'Designer Streetwear',
    designerName: 'Moji Wears',
    imageUrl: '/images/products/LVhoodie.jpg',
    description: 'High-density cotton knit with designer monogram embroidery and double-lined hood.',
    linkUrl: '/shop'
  },
  {
    id: 'slide-white-brown-hoodie',
    title: 'Cream & Mocha Streetwear Hoodie',
    categoryName: 'Streetwear & Hoodies',
    designerName: 'Moji Wears',
    imageUrl: '/images/products/WhiteNdBrownHoodie.jpg',
    description: 'Heavyweight 480GSM fleece with puff graphics, dropped shoulders, and relaxed streetwear fit.',
    linkUrl: '/shop'
  },
  {
    id: 'slide-agbada',
    title: 'Bespoke Royal Heritage Agbada',
    categoryName: 'Men & Unisex Native',
    designerName: 'Sartorial Lagos',
    imageUrl: '/images/products/BlackAgbada.jpg',
    description: 'Hand-tailored wool drape structured for distinguished ceremonies and royal occasions.',
    linkUrl: '/shop'
  },
  {
    id: 'slide-boubou',
    title: 'Artisanal Silk Boubous & Gowns',
    categoryName: "Women's Couture & Silks",
    designerName: 'Arike Brand',
    imageUrl: '/images/editorial/female_dress.jpg',
    description: 'Flowing rich-auntie silk Bubu dresses with vibrant African motifs and fluid silhouette.',
    linkUrl: '/shop'
  },
  {
    id: 'slide-slides',
    title: 'Handcrafted Cowhide Leather Slides',
    categoryName: 'Footwear & Slides',
    designerName: 'Kano Artisan Footwear',
    imageUrl: '/images/products/UnisexSlides.jpg',
    description: 'Authentic cowhide leather slides with ergonomic shock-absorbing footbed and weather-sealed edges.',
    linkUrl: '/shop'
  },
  {
    id: 'slide-carmo-cap',
    title: 'Tactical Camo Streetwear Cap',
    categoryName: 'Caps & Headwear',
    designerName: 'Moji Wears',
    imageUrl: '/images/products/CarmoCap.jpg',
    description: 'Structured 6-panel camouflage dad hat with heavy-duty metal clasp and curved brim.',
    linkUrl: '/shop'
  },
  {
    id: 'slide-jewelry',
    title: '18K Cuban Chain & Luxury Watch',
    categoryName: 'Fine Jewelry & Watches',
    designerName: 'Vee Collection Luxury',
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1400&auto=format&fit=crop',
    description: 'Double-micro gold plating, micro-pave zirconia crystals with hand-polished luxury weight.',
    linkUrl: '/shop'
  },
  {
    id: 'slide-cap1',
    title: 'Royal Velvet Embroidered Fila Cap',
    categoryName: 'Native Headwear',
    designerName: 'Sartorial Lagos',
    imageUrl: '/images/products/Cap1.png',
    description: 'Hand-tailored royal cotton velvet Fila cap with traditional geometric chest embroidery.',
    linkUrl: '/shop'
  },
  {
    id: 'slide-trapstar',
    title: 'Trapstar Cyber Heavyweight Hoodie',
    categoryName: 'Urban Streetwear',
    designerName: 'Moji Wears',
    imageUrl: '/images/no-product.svg',
    description: 'Heavyweight brushed cotton fleece with gothic street typography and kangaroo pocket.',
    linkUrl: '/shop'
  },
  {
    id: 'slide-dresses',
    title: 'Contemporary Dresses & Co-ord Sets',
    categoryName: "Women's Ready-to-Wear",
    designerName: 'Arike Brand',
    imageUrl: '/images/editorial/female_shirt.jpg',
    description: 'Tailored two-piece co-ord sets, silk trousers, evening dresses, and chic ready-to-wear silhouettes.',
    linkUrl: '/shop'
  },
  {
    id: 'slide-smart-shoes',
    title: 'Smart Shoes & Luxury Loafers',
    categoryName: 'Shoes & Footwear',
    designerName: 'Kano Artisan Footwear',
    imageUrl: '/images/products/BlackSmartShoes.jpg',
    description: 'Hand-burnished leather loafers, Italian-cut dress shoes, and contemporary luxury footwear.',
    linkUrl: '/shop'
  },
  {
    id: 'slide-baggy-jean',
    title: 'Raw Selvedge Wide-Leg Baggy Denim',
    categoryName: 'Pants & Denim',
    designerName: 'Moji Wears',
    imageUrl: '/images/products/BaggyJean.jpg',
    description: 'Heavyweight 14oz wide-leg relaxed denim with reinforced pocket rivets and contrast stitching.',
    linkUrl: '/shop'
  }
];

const INACTIVITY_TIMEOUT_MS = 60000; // 60s idle before activation
const SLIDE_DURATION_MS = 6500; // 6.5s per slide

export default function AmbientScreenSaver() {
  const router = useRouter();
  const { allProducts } = useStore();
  const [isIdle, setIsIdle] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slides, setSlides] = useState<EditorialSlide[]>(DEFAULT_EDITORIAL_SLIDES);

  // Helper to map DB product to slide
  const mapProductToSlide = useCallback((p: any, idx: number): EditorialSlide => {
    const rawCat = (p.category || 'tops').toLowerCase();
    let catName = 'Ready-to-Wear Fashion';

    if (rawCat === 'footwear' || rawCat.includes('shoe') || rawCat.includes('slide')) {
      catName = 'Footwear & Slides';
    } else if (rawCat === 'accessories' || rawCat.includes('jewel') || rawCat.includes('watch')) {
      catName = 'Fine Jewelry & Watches';
    } else if (rawCat.includes('cap') || rawCat.includes('hat') || rawCat.includes('fila')) {
      catName = 'Caps & Headwear';
    } else if (rawCat === 'outerwear' || rawCat.includes('hoodie') || rawCat.includes('jacket')) {
      catName = 'Streetwear & Hoodies';
    } else if (rawCat === 'dresses' || rawCat.includes('boubou') || rawCat.includes('gown')) {
      catName = "Women's Couture & Silks";
    }

    const finalImg = p.imageUrl || p.image_url || DEFAULT_EDITORIAL_SLIDES[idx % DEFAULT_EDITORIAL_SLIDES.length].imageUrl;

    return {
      id: `live-prod-${p.id || idx}`,
      title: p.name || 'Contemporary Fashion Drop',
      categoryName: catName,
      designerName: p.vendorName || p.vendor_name || 'Verified Nigerian Designer',
      imageUrl: finalImg,
      description: p.description || p.fitNotes || 'Handcrafted contemporary Nigerian design available for immediate delivery.',
      linkUrl: `/shop/${p.id}`
    };
  }, []);

  // Fetch real database products on mount
  useEffect(() => {
    async function loadLiveProducts() {
      try {
        const res = await fetch('/api/products?limit=25');
        const data = await res.json();
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          const liveSlides: EditorialSlide[] = data.products.map((p: any, idx: number) => mapProductToSlide(p, idx));
          // Interleave real products with default editorial slides
          setSlides([...liveSlides, ...DEFAULT_EDITORIAL_SLIDES]);
        }
      } catch (err) {
        console.error('Failed to load products for screensaver:', err);
      }
    }
    loadLiveProducts();
  }, [mapProductToSlide]);

  // Sync if allProducts in store updates
  useEffect(() => {
    if (allProducts && allProducts.length > 0) {
      const dynamicSlides: EditorialSlide[] = allProducts.map((p, idx) => mapProductToSlide(p, idx));
      setSlides([...dynamicSlides, ...DEFAULT_EDITORIAL_SLIDES]);
    }
  }, [allProducts, mapProductToSlide]);

  // Inactivity Detection Engine
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    if (isIdle) {
      setIsIdle(false);
    }

    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, INACTIVITY_TIMEOUT_MS);
  }, [isIdle]);

  useEffect(() => {
    const events = [
      'mousedown', 'mousemove', 'keydown',
      'scroll', 'touchstart', 'touchmove', 'wheel'
    ];

    const handleUserActivity = () => {
      resetIdleTimer();
    };

    events.forEach(evt => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, INACTIVITY_TIMEOUT_MS);

    return () => {
      events.forEach(evt => {
        window.removeEventListener(evt, handleUserActivity);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [resetIdleTimer]);

  // Slow smooth crossfade auto-advance when idle
  useEffect(() => {
    if (!isIdle) return;

    const slideTimer = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % slides.length);
    }, SLIDE_DURATION_MS);

    return () => clearInterval(slideTimer);
  }, [isIdle, slides.length]);

  // Dismiss screensaver on any movement or touch
  const handleWakeUp = () => {
    setIsIdle(false);
    resetIdleTimer();
  };

  const activeSlide = slides[currentSlideIndex] || slides[0];

  return (
    <div
      role="dialog"
      aria-label="ÃŒrÃ­sÃ­ Ambient Fashion Screensaver"
      onClick={handleWakeUp}
      className={`fixed inset-0 z-[999999] bg-black text-white select-none transition-opacity duration-1000 ease-in-out ${
        isIdle
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* â”€â”€ 1. FULLSCREEN BACKGROUND IMAGES WITH ULTRA-SMOOTH SLOW FADE â”€â”€ */}
      <div className="absolute inset-0 overflow-hidden">
        {slides.map((slide, idx) => {
          const isActive = idx === currentSlideIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-[1800ms] ease-in-out ${
                isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Layer A: Ambient Soft Blurred Background to avoid harsh borders */}
              <div className="absolute inset-0">
                <Image
                  src={slide.imageUrl}
                  alt=""
                  fill
                  priority={idx === 0}
                  className="object-cover object-center filter blur-3xl scale-110 opacity-25"
                  sizes="100vw"
                />
              </div>

              {/* Layer B: Full Uncropped Hero Image - Not zoomed in, 100% visible from top to bottom */}
              <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-12 lg:p-16">
                <div className="relative w-full h-full max-w-5xl max-h-[84vh]">
                  <Image
                    src={slide.imageUrl}
                    alt={slide.title}
                    fill
                    priority={idx === 0}
                    className="object-contain object-center drop-shadow-2xl"
                    sizes="100vw"
                  />
                </div>
              </div>

              {/* Exact Cinematic Gradient Overlays from Signup Page */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-transparent to-black/50 pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* â”€â”€ 2. FOREGROUND CONTENT MATCHING SIGNUP PAGE LAYOUT â”€â”€ */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 sm:p-12 lg:p-16">
        
        {/* Top Header Row: Gold Capsule Category Pill */}
        <div className="flex items-center justify-end">
          <span className="px-3.5 py-1.5 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] text-xs font-mono-luxury uppercase tracking-widest font-bold backdrop-blur-md">
            {activeSlide.categoryName}
          </span>
        </div>

        {/* Bottom Editorial Caption & Micro-Footer */}
        <div className="space-y-6 max-w-2xl animate-fadeIn">
          
          {/* Dot Indicator Row */}
          <div className="flex items-center gap-1.5">
            {slides.slice(0, 14).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-700 ${
                  idx === (currentSlideIndex % 14)
                    ? 'w-8 bg-[var(--gold-accent)]'
                    : 'w-1.5 bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Editorial Serif Title */}
          <h1 className="font-editorial text-3xl sm:text-5xl lg:text-6xl font-normal text-white leading-tight drop-shadow-xl">
            {activeSlide.title}
          </h1>

          {/* Editorial Subtitle Description */}
          <p className="text-sm sm:text-base text-white/75 font-light leading-relaxed max-w-xl drop-shadow">
            {activeSlide.description}
          </p>

          {/* Micro Footer Bar Matching Signup Page */}
          <div className="pt-4 border-t border-white/15 flex items-center justify-between text-[10px] font-mono-luxury text-white/60 tracking-wider uppercase">
            <span>ÃŒrÃ­sÃ­ Lookbook</span>
            <span>Doorstep Nationwide Delivery</span>
          </div>

        </div>

      </div>
    </div>
  );
}