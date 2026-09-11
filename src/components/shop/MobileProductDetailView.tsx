'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import {
  ArrowLeft, ArrowRight, Bookmark, Heart, Share2, Sparkles, ShieldCheck, MapPin,
  Clock, Truck, ShoppingBag, Zap, Star, Check, CheckCircle2,
  ChevronDown, ChevronUp, Store, RotateCcw, X, ZoomIn,
  Video, Volume2, VolumeX, MessageCircle, User, Layers,
  Play, Pause, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import FitPredictorModal from '@/components/shop/FitPredictorModal';

interface MobileProductDetailViewProps {
  product: any;
  reviewsData: {
    averageRating: number;
    fitAccuracyPercent: number;
    count: number;
    reviews: any[];
  };
}

function getProductArchetype(prod: any): string {
  if (!prod) return 'other';
  const text = `${prod.name || ''} ${prod.category || ''} ${prod.department || ''} ${Array.isArray(prod.tags) ? prod.tags.join(' ') : ''}`.toLowerCase();

  if (text.includes('croc') || text.includes('clog') || text.includes('foam')) return 'crocs';
  if (text.includes('slide') || text.includes('palm') || text.includes('slipper') || text.includes('sandal')) return 'slides';
  if (text.includes('sneaker') || text.includes('canvas') || text.includes('trainer') || text.includes('runner')) return 'sneakers';
  if (text.includes('heel') || text.includes('pump') || text.includes('stiletto')) return 'heels';
  if (text.includes('loafer') || text.includes('mule') || text.includes('oxford') || text.includes('derby') || text.includes('formal shoe')) return 'formal_shoes';

  if (text.includes('hoodie') || text.includes('sweatshirt') || text.includes('fleece')) return 'hoodie';
  if (text.includes('polo')) return 'polo';
  if (text.includes('jacket') || text.includes('bomber') || text.includes('vest') || text.includes('coat')) return 'jacket';
  if (text.includes('senator') || text.includes('agbada') || text.includes('kaftan') || text.includes('jalabiya') || text.includes('fila')) return 'native_men';
  if (text.includes('boubou') || text.includes('abaya') || text.includes('kimono') || text.includes('ankara') || text.includes('lace')) return 'native_women';
  if (text.includes('dress') || text.includes('gown') || text.includes('bodycon') || text.includes('maxi')) return 'dress';
  if (text.includes('corset')) return 'corset';
  if (text.includes('two-piece') || text.includes('two piece') || text.includes('co-ord')) return 'two_piece';
  if (text.includes('tee') || text.includes('t-shirt') || text.includes('blouse') || text.includes('top')) return 'tops';

  if (text.includes('jean') || text.includes('denim')) return 'jeans';
  if (text.includes('cargo') || text.includes('jogger') || text.includes('sweatpant') || text.includes('trouser')) return 'cargo';
  if (text.includes('short')) return 'shorts';
  if (text.includes('skirt') || text.includes('mini')) return 'skirts';

  if (text.includes('crossbody') || text.includes('chest') || text.includes('backpack') || text.includes('clutch') || text.includes('tote') || text.includes('bag')) return 'bags';
  if (text.includes('cuban') || text.includes('chain') || text.includes('necklace') || text.includes('ring') || text.includes('pendant') || text.includes('bracelet') || text.includes('jewelry')) return 'jewelry';
  if (text.includes('watch')) return 'watches';
  if (text.includes('sunglass') || text.includes('shades') || text.includes('eyewear')) return 'sunglasses';
  if (text.includes('cap') || text.includes('hat') || text.includes('beanie')) return 'caps';

  return (prod.category || 'other').toLowerCase();
}

export default function MobileProductDetailView({ product, reviewsData }: MobileProductDetailViewProps) {
  const router = useRouter();
  const {
    bodyProfile,
    addToCart,
    toggleVaultItem,
    isInVault,
    setOutfitItem,
    setIsCartOpen,
    userAuth,
    allProducts,
    fetchProductsFromDb,
  } = useStore();

  const isSaved = isInVault(product.id);
  const isAccessory = product.category === 'accessories';
  const pref = bodyProfile?.preferredSize || 'M';

  const availableSizes: string[] = isAccessory
    ? ['One Size']
    : Array.isArray(product.sizes) && product.sizes.length > 0
    ? product.sizes
    : product.sizeStock && typeof product.sizeStock === 'object' && Object.keys(product.sizeStock).length > 0
    ? Object.keys(product.sizeStock).filter(sz => {
        const v = product.sizeStock[sz];
        return typeof v === 'object' ? v?.enabled !== false : Number(v) > 0;
      })
    : ['M', 'L', 'XL'];

  const defaultSize = availableSizes.includes(pref) ? pref : (availableSizes[0] || 'M');

  const [selectedSize, setSelectedSize] = useState(defaultSize);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || { name: 'Standard', hex: '#111111' });
  const [quantity, setQuantity] = useState(1);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isFitPredictorOpen, setIsFitPredictorOpen] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [hasNudged, setHasNudged] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoBuffering, setIsVideoBuffering] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [showAddedToast, setShowAddedToast] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const carouselRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isDraggingCarousel = useRef(false);
  const carouselTouchStart = useRef<{ x: number; y: number } | null>(null);
  // Track in recently viewed
  useEffect(() => {
    if (!product?.id || typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('irisi_recently_viewed');
      const list: string[] = raw ? JSON.parse(raw) : [];
      const updated = [String(product.id), ...list.filter(id => String(id) !== String(product.id))].slice(0, 12);
      localStorage.setItem('irisi_recently_viewed', JSON.stringify(updated));
    } catch (e) {}
  }, [product?.id]);

  useEffect(() => {
    if (!allProducts || allProducts.length === 0) {
      fetchProductsFromDb();
    }
  }, [allProducts, fetchProductsFromDb]);

  const [showSimilarProducts, setShowSimilarProducts] = useState(false);

  // Similar products recommendation algorithm based on archetype, category, department, gender & keywords
  const similarProducts = useMemo(() => {
    if (!product || !allProducts || allProducts.length === 0) return [];
    const pArchetype = getProductArchetype(product);
    const pCat = (product.category || '').toLowerCase().trim();
    const pGender = (product.genderTarget || '').toLowerCase().trim();
    const pVendor = (product.vendorId || product.vendorName || '').toLowerCase().trim();
    const pDepartment = (product.department || '').toLowerCase().trim();
    const pName = (product.name || '').toLowerCase();

    const stopWords = new Set(['with', 'from', 'black', 'white', 'luxury', 'classic', 'drop', 'edition', 'the', 'and', 'for', 'men', 'women']);
    const keywords = pName
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length > 2 && !stopWords.has(w));

    const candidates = allProducts.filter((p: any) => String(p.id) !== String(product.id));

    const scored = candidates.map((cand: any) => {
      let score = 0;
      const cArchetype = getProductArchetype(cand);
      const cCat = (cand.category || '').toLowerCase().trim();
      const cGender = (cand.genderTarget || '').toLowerCase().trim();
      const cVendor = (cand.vendorId || cand.vendorName || '').toLowerCase().trim();
      const cDepartment = (cand.department || '').toLowerCase().trim();
      const cName = (cand.name || '').toLowerCase();

      // Same fashion archetype (+20 pts massive boost: crocs->crocs, hoodie->hoodie, heels->heels, etc.)
      if (pArchetype !== 'other' && cArchetype === pArchetype) {
        score += 20;
      }

      // Category match (+8)
      if (cCat && pCat && cCat === pCat) score += 8;

      // Department match (+6)
      if (cDepartment && pDepartment && cDepartment === pDepartment) score += 6;

      // Gender compatibility
      if (pGender && cGender) {
        if (cGender === pGender) {
          score += 6;
        } else if (cGender === 'unisex' || pGender === 'unisex') {
          score += 4;
        } else {
          score -= 15;
        }
      }

      // Vendor / Brand (+4)
      if (cVendor && pVendor && cVendor === pVendor) score += 4;

      // Keyword matches (+3 each)
      for (const kw of keywords) {
        if (cName.includes(kw)) score += 3;
      }

      return { product: cand, score };
    });

    scored.sort((a: any, b: any) => b.score - a.score);

    const positiveMatches = scored.filter((s: any) => s.score >= 1).map((s: any) => s.product);
    if (positiveMatches.length > 0) {
      return positiveMatches.slice(0, 8);
    }

    return candidates
      .filter((c: any) => {
        const cg = (c.genderTarget || '').toLowerCase();
        return !pGender || !cg || cg === 'unisex' || cg === pGender;
      })
      .slice(0, 8);
  }, [product, allProducts]);

  // Genuine Recently Viewed products (strictly from localStorage history, ZERO mock fallbacks)
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('irisi_recently_viewed');
      if (raw && allProducts && allProducts.length > 0) {
        const ids: string[] = JSON.parse(raw);
        if (Array.isArray(ids) && ids.length > 0) {
          const matched = ids
            .filter((id) => String(id) !== String(product?.id))
            .map((id) => allProducts.find((p: any) => String(p.id) === String(id)))
            .filter(Boolean);
          if (matched.length > 0) {
            setRecentlyViewed(matched.slice(0, 8));
            return;
          }
        }
      }
    } catch (e) {}
    setRecentlyViewed([]);
  }, [allProducts, product?.id]);

  useEffect(() => {
    const handleSync = () => {
      try {
        const raw = localStorage.getItem('irisi_recently_viewed');
        if (!raw) setRecentlyViewed([]);
      } catch (e) {}
    };
    window.addEventListener('irisi_recently_viewed_updated', handleSync);
    return () => window.removeEventListener('irisi_recently_viewed_updated', handleSync);
  }, []);

  const handleClearRecentlyViewed = () => {
    try {
      localStorage.removeItem('irisi_recently_viewed');
      window.dispatchEvent(new Event('irisi_recently_viewed_updated'));
    } catch (e) {}
    setRecentlyViewed([]);
  };

  const handleCarouselTouchStart = (e: React.TouchEvent) => {
    setHasNudged(true);
    playVideo();
    const t = e.touches[0];
    carouselTouchStart.current = { x: t.clientX, y: t.clientY };
    isDraggingCarousel.current = false;
  };

  const handleCarouselTouchMove = (e: React.TouchEvent) => {
    if (!carouselTouchStart.current) return;
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - carouselTouchStart.current.x);
    const dy = Math.abs(t.clientY - carouselTouchStart.current.y);
    if (dx > 8 || dy > 8) {
      isDraggingCarousel.current = true;
    }
  };

  const handleCarouselTouchEnd = () => {
    carouselTouchStart.current = null;
    setTimeout(() => {
      isDraggingCarousel.current = false;
    }, 250);
  };

  // Multi-media gallery items (Photos + Catwalk Video)
  const mediaItems = useMemo(() => {
    const items: Array<{ type: 'image' | 'video'; url: string }> = [];
    if (product.imageUrl) {
      items.push({ type: 'image', url: product.imageUrl });
    }
    if (Array.isArray(product.images)) {
      product.images.forEach((img: string) => {
        if (img && img !== product.imageUrl && !items.some(it => it.url === img)) {
          items.push({ type: 'image', url: img });
        }
      });
    }
    if (product.videoUrl) {
      items.push({ type: 'video', url: product.videoUrl });
    }
    return items.length > 0 ? items : [{ type: 'image', url: '/images/products/BlackTrapStarHoodie.jpg' }];
  }, [product.imageUrl, product.videoUrl, product.images]);

  // Reliable instant video autoplay with Low Power Mode manual unlock
  const playVideo = () => {
    const v = videoRef.current;
    if (v) {
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.setAttribute('x5-playsinline', '');
      v.setAttribute('muted', '');
      const p = v.play();
      if (p !== undefined) {
        p.then(() => {
          setIsVideoPlaying(true);
          setIsVideoBuffering(false);
        }).catch(() => {
          // Autoplay was blocked by Low Power Mode or browser policy
          setIsVideoPlaying(false);
        });
      }
    }
  };

  // iOS Safari Low Power Mode Unlock:
  // In Low Power Mode, WebKit blocks programmatic play() unless triggered in a direct user touch frame.
  // Listening to touchstart/pointerdown unlocks playback the instant the user touches to scroll or swipe!
  useEffect(() => {
    const handleGesture = () => {
      playVideo();
    };

    // Immediate attempt on render
    playVideo();

    // Attach synchronous user gesture listeners on window and document
    window.addEventListener('touchstart', handleGesture, { passive: true });
    window.addEventListener('pointerdown', handleGesture, { passive: true });
    window.addEventListener('touchend', handleGesture, { passive: true });

    // Handle return from other tabs, pages, background, or bfcache
    const handlePageResume = () => {
      playVideo();
    };

    window.addEventListener('pageshow', handlePageResume);
    window.addEventListener('focus', handlePageResume);
    document.addEventListener('visibilitychange', handlePageResume);

    return () => {
      window.removeEventListener('touchstart', handleGesture);
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('touchend', handleGesture);
      window.removeEventListener('pageshow', handlePageResume);
      window.removeEventListener('focus', handlePageResume);
      document.removeEventListener('visibilitychange', handlePageResume);
    };
  }, [mediaItems]);

  // IntersectionObserver plays video the instant user begins swiping into it
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            playVideo();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(v);
    return () => observer.disconnect();
  }, [mediaItems]);

  const handleCarouselScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setHasNudged(true);
    playVideo();
    isDraggingCarousel.current = true;
    const el = e.currentTarget;
    if (el.clientWidth > 0) {
      const index = Math.round(el.scrollLeft / el.clientWidth);
      if (index !== activeMediaIndex) {
        setActiveMediaIndex(index);
      }
      if (mediaItems[index]?.type === 'video') {
        playVideo();
      }
    }
  };

  const handleSelectColor = (colorObj: any) => {
    setSelectedColor(colorObj);

    const targetUrl = colorObj?.imageUrl;
    if (targetUrl && carouselRef.current) {
      const targetIdx = mediaItems.findIndex((m) => m.url === targetUrl);
      if (targetIdx !== -1) {
        setActiveMediaIndex(targetIdx);
        carouselRef.current.scrollTo({
          left: targetIdx * carouselRef.current.clientWidth,
          behavior: 'smooth',
        });
      }
    }
  };

  // Stock for chosen color and size
  const currentVariantStock = (() => {
    if (product.sizeStock && typeof product.sizeStock === 'object') {
      const anyStock: any = product.sizeStock;
      const variantKey = selectedColor?.name && selectedSize ? `${selectedColor.name.trim()}_${selectedSize.trim()}` : null;
      if (variantKey && anyStock.variants && anyStock.variants[variantKey] !== undefined) {
        return anyStock.variants[variantKey];
      }
      if (selectedSize && anyStock[selectedSize] !== undefined) {
        return typeof anyStock[selectedSize] === 'number' ? anyStock[selectedSize] : (anyStock[selectedSize]?.quantity ?? 15);
      }
    }
    return product.stockQuantity ?? 15;
  })();

  const currentSizeStock = currentVariantStock;
  const isOutOfStock = currentVariantStock === 0;

  const rates = product.shippingRates || {
    sameCity: 1000,
    closeHub: 2500,
    interstate: 4500,
    parkPickup: 1500,
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedSize, selectedColor, quantity);

    setIsAdded(true);
    setShowAddedToast(true);

    try {
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.85 },
        colors: ['#e6c367', '#10b981', '#ffffff']
      });
    } catch {}

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);

    setTimeout(() => {
      setIsAdded(false);
    }, 2200);

    toastTimeoutRef.current = setTimeout(() => {
      setShowAddedToast(false);
    }, 4500);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedSize, selectedColor, quantity);
    if (!userAuth?.isLoggedIn) {
      router.push('/auth?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} on Ìrísí`,
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-36 select-none animate-fadeIn">
      {/* Absolute suppression of native mobile WebKit video play buttons & overlays */}
      <style dangerouslySetInnerHTML={{ __html: `
        video::-webkit-media-controls,
        video::-webkit-media-controls-start-playback-button,
        video::-webkit-media-controls-play-button,
        video::-webkit-media-controls-overlay-play-button,
        video::-webkit-media-controls-enclosure,
        video::-webkit-media-controls-panel {
          display: none !important;
          -webkit-appearance: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}} />
      
      {/* 1. TOP FLOATING APP BAR (Glassmorphic Controls) */}
      <div className="fixed top-3 inset-x-3 z-40 flex items-center justify-between pointer-events-none">
        <button
          type="button"
          onClick={() => router.back()}
          className="pointer-events-auto p-2.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-white shadow-xl active:scale-90 transition-transform cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="p-2.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-white shadow-xl active:scale-90 transition-transform cursor-pointer"
            aria-label="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => toggleVaultItem(product)}
            className="p-2.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-white shadow-xl active:scale-90 transition-transform cursor-pointer"
            aria-label={isSaved ? 'In Vault' : 'Save to Vault'}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-[var(--gold-accent)] text-[var(--gold-accent)]' : 'text-white'}`} />
          </button>
        </div>
      </div>

      {/* 2. PRODUCT HERO SWIPEABLE MEDIA CAROUSEL (Photo + Auto-Looping Silent Catwalk Video) */}
      <div className="relative w-full h-[54vh] sm:h-[60vh] max-h-[500px] bg-black overflow-hidden group">
        {/* Swipeable Horizontal Scroll Container with organic peek animation */}
        <motion.div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          animate={hasNudged || mediaItems.length <= 1 ? { x: 0 } : { x: [0, -55, 0, -30, 0] }}
          transition={{
            delay: 0.5,
            duration: 1.4,
            times: [0, 0.3, 0.6, 0.8, 1],
            ease: [0.25, 1, 0.5, 1],
          }}
          onAnimationComplete={() => setHasNudged(true)}
          onTouchStart={handleCarouselTouchStart}
          onTouchMove={handleCarouselTouchMove}
          onTouchEnd={handleCarouselTouchEnd}
          onPointerDown={() => {
            setHasNudged(true);
            playVideo();
          }}
          className="flex w-full h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-none touch-manipulation overscroll-x-contain"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x pan-y',
          }}
        >
          {mediaItems.map((item, idx) => (
            <div
              key={idx}
              className="min-w-full w-full h-full snap-center relative flex-shrink-0 cursor-pointer"
              onClick={(e) => {
                if (isDraggingCarousel.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                if (item.type === 'video') {
                  const v = videoRef.current;
                  if (v && v.paused) {
                    v.play().catch(() => {});
                  } else {
                    setIsImageModalOpen(true);
                  }
                } else {
                  setIsImageModalOpen(true);
                }
              }}
              onTouchStart={playVideo}
              onPointerDown={playVideo}
            >
              {item.type === 'video' ? (
                <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
                  {/* Universal Instant Poster Image underneath video: guarantees screen is NEVER blank */}
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    unoptimized
                    priority
                    className="object-cover object-center pointer-events-none"
                  />

                  {/* HTML5 Video Layer */}
                  {!videoError && (
                    <video
                      ref={(el) => {
                        videoRef.current = el;
                        if (el) {
                          el.muted = true;
                          el.defaultMuted = true;
                          el.playsInline = true;
                          el.setAttribute('muted', '');
                          el.setAttribute('playsinline', '');
                          el.setAttribute('webkit-playsinline', '');
                          el.setAttribute('x5-playsinline', '');
                          if (el.paused && activeMediaIndex === idx) {
                            el.play().then(() => setIsVideoPlaying(true)).catch(() => {});
                          }
                        }
                      }}
                      src={item.url}
                      poster={product.imageUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      webkit-playsinline="true"
                      x5-playsinline="true"
                      controls={false}
                      disablePictureInPicture
                      preload="auto"
                      onPlaying={() => {
                        setIsVideoPlaying(true);
                        setIsVideoBuffering(false);
                      }}
                      onPause={() => {
                        setIsVideoPlaying(false);
                      }}
                      onWaiting={() => {
                        setIsVideoBuffering(true);
                      }}
                      onCanPlay={() => {
                        setIsVideoBuffering(false);
                      }}
                      onError={() => {
                        setVideoError(true);
                        setIsVideoPlaying(false);
                        setIsVideoBuffering(false);
                      }}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}

                  {/* Centered Play/Unlock Button Overlay if autoplay paused or blocked by battery-saver mode */}
                  {!isVideoPlaying && !videoError && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        playVideo();
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/35 z-10 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-black/85 backdrop-blur-md border border-[var(--gold-accent)]/50 text-white shadow-2xl active:scale-95 transition-all">
                        <Play className="h-4 w-4 text-[var(--gold-accent)] fill-current animate-pulse" />
                        <span className="text-xs font-mono-luxury font-bold tracking-wider uppercase text-white">
                          Tap to Play Video
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Loading Spinner if Video is buffering on slow connection */}
                  {isVideoBuffering && !videoError && (
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[10px] font-mono-luxury border border-white/15">
                      <Loader2 className="h-3 w-3 animate-spin text-[var(--gold-accent)]" />
                      <span>Loading...</span>
                    </div>
                  )}

                  {/* Fallback Badge if Video Format was Incompatible on user's device */}
                  {videoError && (
                    <div className="absolute bottom-4 left-4 right-4 z-10 p-2.5 rounded-xl bg-black/85 backdrop-blur-md text-center border border-white/10">
                      <span className="text-[11px] font-mono-luxury text-amber-300">
                        Video stream not supported by this browser. Showing photo.
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <Image
                  src={item.url}
                  alt={product.name}
                  fill
                  unoptimized
                  priority={idx === 0}
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                />
              )}
            </div>
          ))}
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

        {/* Media Slide Counter (1 / 2) */}
        {mediaItems.length > 1 && (
          <div className="absolute top-16 right-3 z-20">
            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-mono-luxury font-bold border border-white/10 shadow-sm">
              {activeMediaIndex + 1} / {mediaItems.length}
            </span>
          </div>
        )}

        {/* Bottom Carousel Indicator Dots */}
        {mediaItems.length > 1 && (
          <div className="absolute bottom-12 left-0 right-0 z-20 flex items-center justify-center gap-1.5 pointer-events-none">
            {mediaItems.map((_, idx) => (
              <div
                key={idx}
                className={`transition-all duration-300 rounded-full ${
                  activeMediaIndex === idx
                    ? 'w-5 h-1.5 bg-[var(--gold-accent)] shadow-sm'
                    : 'w-1.5 h-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Bottom Floating Controls (Tap to View + Try on Model + View in 3D) */}
        <div className="absolute bottom-3 left-3 z-10 text-xs font-mono-luxury flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsImageModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white/90 text-[10px] font-bold flex items-center gap-1 shadow-lg active:scale-95 transition-transform cursor-pointer"
          >
            <ZoomIn className="h-3 w-3 text-[var(--gold-accent)]" />
            <span>Tap to View</span>
          </button>
        </div>
      </div>

      {/* 3. PRODUCT ESSENTIAL DETAILS & VENDOR IDENTITY */}
      <div className="p-4 sm:p-6 space-y-4">
        
        {/* Vendor Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
          <Link
            href={`/brand/${encodeURIComponent(product.vendorName || product.vendorId)}`}
            className="flex items-center gap-2 group"
          >
            <div className="h-7 w-7 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/40 text-[var(--gold-accent)] flex items-center justify-center font-bold text-xs">
              <Store className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="font-bold text-xs font-mono-luxury text-[var(--text-primary)] group-hover:text-[var(--gold-accent)] transition-colors block">
                {product.vendorName}
              </span>
              <span className="text-[9px] text-[var(--gold-accent)] font-mono-luxury uppercase font-bold tracking-wider flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                <span>Verified Atelier Drop</span>
              </span>
            </div>
          </Link>

          {reviewsData && reviewsData.count > 0 && reviewsData.averageRating > 0 ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--badge-bg)] border border-[var(--border-subtle)] text-[11px] font-mono-luxury">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-bold text-[var(--text-primary)]">{reviewsData.averageRating.toFixed(1)}</span>
              <span className="text-[var(--text-muted)]">({reviewsData.count})</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--badge-bg)] border border-[var(--border-subtle)] text-[10px] font-mono-luxury">
              <span className="text-[var(--gold-accent)] font-bold">Verified Drop</span>
            </div>
          )}
        </div>

        {/* Title & Price */}
        <div className="space-y-1.5">
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-snug">
            {product.name}
          </h1>

          <div className="flex items-baseline justify-between pt-0.5">
            <div className="font-editorial text-2xl sm:text-3xl font-bold text-amber-600 dark:text-[var(--gold-accent)]">
              ₦{Number(product.price || 0).toLocaleString()}
            </div>

            {isOutOfStock ? (
              <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-mono-luxury font-bold uppercase">
                Out of Stock
              </span>
            ) : currentSizeStock <= 5 ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-mono-luxury font-bold uppercase animate-pulse">
                Only {currentSizeStock} Left!
              </span>
            ) : null}
          </div>

          {/* Location line */}
          <div className="flex items-center gap-2 text-xs font-mono-luxury text-[var(--text-secondary)] pt-0.5">
            <MapPin className="h-3.5 w-3.5 text-[var(--gold-accent)] shrink-0" />
            <span>Ships from <strong className="text-[var(--text-primary)]">{product.vendorCity ? `${product.vendorCity}, ` : ''}{product.vendorState || 'Lagos'}</strong></span>
          </div>
        </div>

        {/* Description (Only show when genuine description exists) */}
        {product.description && product.description.trim().length > 0 && product.description.trim().toLowerCase() !== (product.name || '').trim().toLowerCase() && (
          <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed border-t border-[var(--border-subtle)] pt-2.5">
            {product.description}
          </p>
        )}

        {/* 4. COLOR SELECTOR (Only shown when vendor provides multiple distinct colorways to choose from) */}
        {product.category !== 'accessories' && product.colors && product.colors.length > 1 && !product.colors.every((c: any) => {
          const name = (typeof c === 'string' ? c : c?.name || '').toLowerCase();
          return name === 'as pictured' || name === 'standard';
        }) && (
          <div className="p-4 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono-luxury">
              <span className="text-[var(--text-secondary)] uppercase font-bold">
                Color: <strong className="text-[var(--text-primary)]">{selectedColor?.name || 'Standard'}</strong>
              </span>
              <span className="text-[10px] text-[var(--gold-accent)] font-bold">
                {product.colors.length} {product.colors.length === 1 ? 'Color' : 'Colors'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {product.colors.map((c: any, index: number) => {
                const colorName = typeof c === 'string' ? c : (c.name || 'Standard');
                const colorHex = typeof c === 'object' && c?.hex ? c.hex : '#111111';
                const isChosen = selectedColor?.name === colorName || selectedColor?.hex === colorHex;
                return (
                  <button
                    key={`color-${colorName}-${index}`}
                    type="button"
                    onClick={() => handleSelectColor(typeof c === 'object' ? c : { name: colorName, hex: colorHex })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                      isChosen
                        ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] ring-2 ring-[var(--gold-accent)] shadow-md'
                        : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)]'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-white/30 shrink-0"
                      style={{
                        background: colorName.toLowerCase().includes('multi')
                          ? 'conic-gradient(from 180deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #f59e0b, #ef4444, #ec4899)'
                          : colorHex
                      }}
                    />
                    <span className="text-[11px] font-mono-luxury font-bold">{colorName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. 1-TAP SIZE SELECTOR */}
        {product.category === 'accessories' ? (
          <div className="p-4 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono-luxury">
              <span className="text-[var(--text-secondary)] uppercase font-bold">Size & Fit:</span>
              <span className="text-emerald-400 font-bold">{product.stockQuantity || 1} available</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 text-xs font-mono-luxury font-bold">
              <span>One Size · Universal Fit</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono-luxury">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)] uppercase font-bold">
                  {product.category === 'footwear' ? 'Shoe Size (EU):' : 'Select Size:'}
                </span>
                {product.category !== 'footwear' && (
                  <button
                    type="button"
                    onClick={() => setIsFitPredictorOpen(true)}
                    className="text-[10px] text-[var(--gold-accent)] font-bold inline-flex items-center gap-1 hover:underline cursor-pointer bg-[var(--gold-subtle)] px-2 py-0.5 rounded-full border border-[var(--gold-accent)]/30"
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    <span>Find My Size</span>
                  </button>
                )}
              </div>
              <span className="text-[var(--gold-accent)] font-bold">{selectedSize}</span>
            </div>

            <div className="flex flex-wrap gap-2 font-mono-luxury text-xs">
              {availableSizes.map((size: string) => {
                const isChosen = size === selectedSize;
                const szOutOfStock = (() => {
                  if (product.sizeStock && typeof product.sizeStock === 'object') {
                    const anyStock: any = product.sizeStock;
                    const variantKey = selectedColor?.name ? `${selectedColor.name.trim()}_${size.trim()}` : null;
                    if (variantKey && anyStock.variants && anyStock.variants[variantKey] !== undefined) {
                      return anyStock.variants[variantKey] === 0;
                    }
                    const szStock = anyStock[size];
                    if (szStock !== undefined) {
                      return typeof szStock === 'object' ? szStock?.enabled === false || Number(szStock?.quantity) === 0 : szStock === 0;
                    }
                  }
                  return false;
                })();

                return (
                  <button
                    key={`size-btn-${size}`}
                    type="button"
                    disabled={szOutOfStock}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[44px] px-3.5 py-2.5 rounded-xl border transition-all text-center flex items-center justify-center font-bold cursor-pointer ${
                      szOutOfStock
                        ? 'opacity-30 line-through cursor-not-allowed bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                        : isChosen
                        ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)] shadow-md font-extrabold'
                        : 'surface-card border-[var(--border-subtle)] text-[var(--text-primary)]'
                    }`}
                  >
                    <span>{size}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. NATIONWIDE COURIER & MOTOR PARK DELIVERY INFO */}
        <div className="p-4 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-2.5 text-xs font-mono-luxury shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
              <Truck className="h-4 w-4 text-[var(--gold-accent)]" />
              <span className="uppercase tracking-wider">Nationwide Delivery</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">
              Dispatches in {product.dispatchDays || '1-2 business days'}
            </span>
          </div>

          <p className="text-[11px] text-[var(--text-secondary)] font-light leading-relaxed">
            Live courier rates calculated at checkout based on your destination. Doorstep delivery (GIG, Fez, Red Star) &amp; Motor Park Waybills supported across Nigeria.
          </p>

          <div className="pt-1 flex items-center gap-1.5 text-[10px] text-[var(--gold-accent)] font-medium">
            <MapPin className="h-3 w-3 shrink-0" />
            <span>Ships directly from {product.vendorCity ? `${product.vendorCity}, ` : ''}{product.vendorState || 'Nigeria'}</span>
          </div>
        </div>

        {/* 7. EXPANDABLE CUSTOMER REVIEWS ACCORDION */}
        <div className="rounded-2xl surface-card border border-[var(--border-subtle)] overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setIsReviewsOpen(!isReviewsOpen)}
            className="w-full p-4 flex items-center justify-between text-xs font-mono-luxury text-[var(--text-primary)] font-bold cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-[var(--gold-accent)]" />
              <span className="uppercase">Customer Reviews ({reviewsData.count || 0})</span>
            </div>
            {isReviewsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {isReviewsOpen && (
            <div className="p-4 pt-0 border-t border-[var(--border-subtle)] space-y-3 text-xs font-mono-luxury">
              {reviewsData.reviews.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] py-2">No written reviews yet for this piece.</p>
              ) : (
                reviewsData.reviews.map((rev, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--text-primary)] text-xs">{rev.customerName || 'Ìrísí Patron'}</span>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] font-light leading-relaxed">
                      &quot;{rev.comment}&quot;
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 8. WHATSAPP CONCIERGE SIZING & ATELIER INQUIRY */}
        <a
          href={`https://wa.me/2348000000000?text=${encodeURIComponent(
            `Hello Ìrísí Concierge, I am inquiring about "${product.name}" by ${product.vendorName || 'the Atelier'} (Price: ₦${Number(product.price || 0).toLocaleString()}). Could you assist with sizing and delivery details?`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono-luxury text-xs font-bold transition-all hover:bg-emerald-500/20 active:scale-[0.98] cursor-pointer shadow-sm"
        >
          <MessageCircle className="h-4 w-4 fill-emerald-500/20" />
          <span>Inquire via WhatsApp Concierge</span>
        </a>

        {/* 9. CHECK SIMILAR PRODUCTS (Expandable on click) */}
        {similarProducts.length > 0 && (
          <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
            <button
              type="button"
              onClick={() => setShowSimilarProducts((prev) => !prev)}
              className="w-full py-3.5 px-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--gold-accent)]/60 text-[var(--text-primary)] transition-all flex items-center justify-between shadow-sm active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-mono-luxury font-bold uppercase tracking-wider block text-[var(--text-primary)]">
                    Check Similar Products
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono-luxury">
                    {similarProducts.length} matching pieces curated for you
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[var(--gold-accent)]">
                <span className="text-[10px] font-mono-luxury font-bold uppercase">
                  {showSimilarProducts ? 'Hide' : 'View'}
                </span>
                {showSimilarProducts ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </button>

            {/* When clicked, show the products under */}
            <AnimatePresence>
              {showSimilarProducts && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden space-y-3 pt-1"
                >
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold">
                      Matching Pieces
                    </span>
                    <Link
                      href={`/shop?category=${product.category || 'all'}`}
                      className="text-[10px] font-mono-luxury font-bold text-[var(--text-secondary)] hover:text-[var(--gold-accent)] flex items-center gap-1 uppercase"
                    >
                      <span>Explore More</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {/* Horizontal Swipeable Product Cards */}
                  <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
                    {similarProducts.map((item: any) => {
                      const itemImg = item.imageUrl || (Array.isArray(item.images) && item.images[0]) || '/images/products/BlackTrapStarHoodie.jpg';
                      const isItemSaved = isInVault(item.id);
                      return (
                        <div
                          key={`similar-${item.id}`}
                          className="w-36 shrink-0 rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex flex-col group shadow-sm hover:border-[var(--gold-accent)]/50 transition-colors"
                        >
                          <Link href={`/shop/${item.id}`} className="relative aspect-[3/4] w-full block bg-black/10 overflow-hidden">
                            <Image
                              src={itemImg}
                              alt={item.name}
                              fill
                              unoptimized
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleVaultItem(item);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:text-red-500 transition-colors cursor-pointer"
                              aria-label="Wishlist"
                            >
                              <Heart className={`h-3.5 w-3.5 ${isItemSaved ? 'fill-red-500 text-red-500' : ''}`} />
                            </button>
                          </Link>
                          <div className="p-2.5 flex flex-col justify-between flex-1 gap-1.5">
                            <div>
                              <span className="text-[8px] font-mono-luxury uppercase tracking-wider text-[var(--gold-accent)] font-bold block truncate">
                                {item.vendorName || 'Atelier'}
                              </span>
                              <Link href={`/shop/${item.id}`} className="hover:text-[var(--gold-accent)] transition-colors">
                                <h4 className="text-[11px] font-medium text-[var(--text-primary)] line-clamp-1">
                                  {item.name}
                                </h4>
                              </Link>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]/50">
                              <span className="text-xs font-mono-luxury font-bold text-[var(--text-primary)]">
                                ₦{Number(item.price || 0).toLocaleString()}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const defSize = Array.isArray(item.sizes) && item.sizes.length > 0 ? item.sizes[0] : 'M';
                                  const defColor = Array.isArray(item.colors) && item.colors.length > 0 ? item.colors[0] : { name: 'Standard', hex: '#111111' };
                                  addToCart(item, defSize, defColor, 1);
                                }}
                                className="h-6 w-6 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all text-xs font-bold cursor-pointer"
                                title="Quick Add to Bag"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 10. RECENTLY VIEWED (Strictly user's actual browsing history, ZERO mock fallbacks) */}
        {recentlyViewed.length > 0 && (
          <div className="pt-6 border-t border-[var(--border-subtle)] space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold block">
                  Your Browsing History
                </span>
                <h3 className="font-editorial text-base font-bold text-[var(--text-primary)]">
                  Recently Viewed
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClearRecentlyViewed}
                  className="text-[10px] font-mono-luxury font-bold text-[var(--text-muted)] hover:text-rose-500 transition-colors uppercase cursor-pointer"
                >
                  Clear
                </button>
                <Link
                  href="/shop"
                  className="text-[10px] font-mono-luxury font-bold text-[var(--text-secondary)] hover:text-[var(--gold-accent)] flex items-center gap-1 uppercase"
                >
                  <span>Shop All</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Horizontal Swipeable Product Cards */}
            <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
              {recentlyViewed.map((item: any) => {
                const itemImg = item.imageUrl || (Array.isArray(item.images) && item.images[0]) || '/images/products/BlackTrapStarHoodie.jpg';
                const isItemSaved = isInVault(item.id);
                return (
                  <div
                    key={`recent-${item.id}`}
                    className="w-36 shrink-0 rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex flex-col group shadow-sm hover:border-[var(--gold-accent)]/50 transition-colors"
                  >
                    <Link href={`/shop/${item.id}`} className="relative aspect-[3/4] w-full block bg-black/10 overflow-hidden">
                      <Image
                        src={itemImg}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleVaultItem(item);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:text-red-500 transition-colors cursor-pointer"
                        aria-label="Wishlist"
                      >
                        <Heart className={`h-3.5 w-3.5 ${isItemSaved ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                    </Link>
                    <div className="p-2.5 flex flex-col justify-between flex-1 gap-1.5">
                      <div>
                        <span className="text-[8px] font-mono-luxury uppercase tracking-wider text-[var(--gold-accent)] font-bold block truncate">
                          {item.vendorName || 'Atelier'}
                        </span>
                        <Link href={`/shop/${item.id}`} className="hover:text-[var(--gold-accent)] transition-colors">
                          <h4 className="text-[11px] font-medium text-[var(--text-primary)] line-clamp-1">
                            {item.name}
                          </h4>
                        </Link>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]/50">
                        <span className="text-xs font-mono-luxury font-bold text-[var(--text-primary)]">
                          ₦{Number(item.price || 0).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const defSize = Array.isArray(item.sizes) && item.sizes.length > 0 ? item.sizes[0] : 'M';
                            const defColor = Array.isArray(item.colors) && item.colors.length > 0 ? item.colors[0] : { name: 'Standard', hex: '#111111' };
                            addToCart(item, defSize, defColor, 1);
                          }}
                          className="h-6 w-6 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all text-xs font-bold cursor-pointer"
                          title="Quick Add to Bag"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* FLOATING ADDED TO BAG CONFIRMATION TOAST BANNER */}
      <AnimatePresence>
        {showAddedToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-[72px] inset-x-3 z-50 p-3 rounded-2xl bg-[#111215] text-white border border-emerald-500/40 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                  <Image
                    src={selectedColor?.imageUrl || product.imageUrl || '/images/products/BlackTrapStarHoodie.jpg'}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[11px] font-bold text-emerald-400 font-mono-luxury uppercase tracking-wider">
                      Added to Bag!
                    </span>
                  </div>
                  <p className="text-xs text-white/90 font-medium truncate max-w-[170px]">
                    {product.name}
                  </p>
                  <span className="text-[10px] text-white/60 font-mono-luxury block">
                    Size: {selectedSize} • Qty: {quantity}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  href="/cart"
                  className="py-2 px-3.5 rounded-xl bg-[var(--gold-accent)] text-black font-mono-luxury uppercase text-[10px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-1 cursor-pointer"
                >
                  <span>View Bag</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
                <button
                  type="button"
                  onClick={() => setShowAddedToast(false)}
                  className="p-1.5 text-white/50 hover:text-white transition-colors cursor-pointer"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. FIXED FLOATING BOTTOM DOCK */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] p-3 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">
        {/* Add to Bag + Instant Buy */}
        <div className="flex items-center gap-2">
          {/* Compact Quantity Stepper */}
          <div className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1 || isOutOfStock}
              className="h-8 w-7 rounded-lg flex items-center justify-center text-[var(--text-primary)] disabled:opacity-30 active:bg-[var(--bg-primary)] transition-all font-bold text-sm cursor-pointer"
              title="Decrease"
            >
              -
            </button>
            <span className="text-xs font-mono-luxury font-bold text-[var(--text-primary)] px-1 min-w-[18px] text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(q => Math.min(currentSizeStock || 15, q + 1))}
              disabled={quantity >= (currentSizeStock || 15) || isOutOfStock}
              className="h-8 w-7 rounded-lg flex items-center justify-center text-[var(--text-primary)] disabled:opacity-30 active:bg-[var(--bg-primary)] transition-all font-bold text-sm cursor-pointer"
              title="Increase"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex-1 py-3 rounded-xl font-mono-luxury uppercase text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-95 ${
              isAdded
                ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--text-primary)] bg-[var(--bg-secondary)]'
            }`}
          >
            {isAdded ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 animate-bounce" />
                <span className="text-emerald-400 font-extrabold tracking-wider">Added to Bag! ✓</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{isOutOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="flex-1 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-[0.98]"
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>Buy Now</span>
          </button>
        </div>
      </div>

      {/* 9. FULL-SCREEN INTERACTIVE IMAGE LIGHTBOX WITH TRANSITION */}
      <AnimatePresence>
        {isImageModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 pt-12 pb-8 select-none"
            onClick={() => setIsImageModalOpen(false)}
          >
            {/* Top Bar: Title & Close */}
            <div className="flex items-center justify-between text-white z-10" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold block">
                  {product.vendorName || 'Ìrísí Brand'}
                </span>
                <h3 className="font-editorial text-lg font-bold text-white truncate max-w-[240px]">
                  {product.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="p-2.5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
                aria-label="Close image view"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Centered Media with smooth scale transition */}
            <motion.div
              initial={{ scale: 0.86, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.86, opacity: 0, y: 20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full h-[62vh] my-auto flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {mediaItems[activeMediaIndex]?.type === 'video' ? (
                <div className="relative w-full h-full max-h-[62vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                  <Image
                    src={product.imageUrl || '/images/products/BlackTrapStarHoodie.jpg'}
                    alt={product.name}
                    fill
                    unoptimized
                    priority
                    className="object-contain pointer-events-none"
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
                    src={mediaItems[activeMediaIndex].url}
                    poster={product.imageUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    webkit-playsinline="true"
                    x5-playsinline="true"
                    controls
                    preload="auto"
                    className="relative w-full h-full object-contain z-10"
                  />
                </div>
              ) : (
                <Image
                  src={mediaItems[activeMediaIndex]?.url || product.imageUrl || '/images/products/BlackTrapStarHoodie.jpg'}
                  alt={product.name}
                  fill
                  unoptimized
                  priority
                  className="object-contain"
                />
              )}
            </motion.div>

            {/* Bottom Actions inside Lightbox */}
            <div className="flex items-center justify-between gap-3 z-10 pt-2" onClick={(e) => e.stopPropagation()}>
              <div className="font-editorial text-2xl font-bold text-[var(--gold-accent)]">
                ₦{Number(product.price || 0).toLocaleString()}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsImageModalOpen(false);
                  handleAddToCart();
                }}
                disabled={isOutOfStock}
                className="py-3 px-6 rounded-full bg-white text-black font-mono-luxury uppercase text-xs font-bold hover:bg-zinc-200 active:scale-95 transition-all shadow-xl flex items-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>{isOutOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fit Predictor Modal */}
      <FitPredictorModal
        isOpen={isFitPredictorOpen}
        onClose={() => setIsFitPredictorOpen(false)}
        onSelectSize={(sz) => setSelectedSize(sz)}
        category={product.category}
        availableSizes={availableSizes}
      />

    </div>
  );
}
