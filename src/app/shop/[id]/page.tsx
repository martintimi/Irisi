'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import {
  Sparkles, Check, ShoppingBag, ShieldCheck, Truck, RotateCcw,
  Star, Heart, ArrowLeft, ArrowRight, Share2, Ruler,
  Building, Phone, MapPin, CheckCircle2, ChevronRight, ChevronDown, ChevronUp, Loader2, Store, Clock, Package, Play, User, Layers
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import MobileProductDetailView from '@/components/shop/MobileProductDetailView';
import LuxuryLoader from '@/components/common/LuxuryLoader';
import Product3DModal from '@/components/3d/Product3DModal';

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

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const {
    bodyProfile,
    addToCart,
    allProducts,
    fetchProductsFromDb,
    toggleVaultItem,
    isInVault,
    setOutfitItem,
    userAuth,
  } = useStore();

  const cachedProduct = useMemo(() => {
    if (!productId || !allProducts || allProducts.length === 0) return null;
    return allProducts.find((p) => String(p.id) === String(productId)) || null;
  }, [productId, allProducts]);

  const [product, setProduct] = useState<any | null>(() => cachedProduct);
  const [isLoading, setIsLoading] = useState(!cachedProduct);
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedSize, setSelectedSize] = useState(() => {
    const pref = bodyProfile?.preferredSize || 'M';
    if (cachedProduct?.sizes?.includes(pref)) return pref;
    return cachedProduct?.sizes?.[0] || 'M';
  });
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string } | null>(() => {
    return cachedProduct?.colors?.[0] || { name: 'As Pictured', hex: '#111111' };
  });
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>(() => cachedProduct?.imageUrl || '');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverVideoRef = useRef<HTMLVideoElement>(null);

  // Determine next / alternate image for hover preview when no video
  const nextImage = useMemo(() => {
    if (!product) return null;
    const allImages: string[] = [
      product.imageUrl,
      ...(Array.isArray(product.images) ? product.images.map((img: any) => typeof img === 'string' ? img : img?.url).filter(Boolean) : [])
    ];
    const unique = Array.from(new Set(allImages));
    return unique.find(img => img !== (activeImage || product.imageUrl)) || null;
  }, [product, activeImage]);

  const [is3DModalOpen, setIs3DModalOpen] = useState(false);
  const [isModelTryOnOpen, setIsModelTryOnOpen] = useState(false);
  const [reviewsData, setReviewsData] = useState<{ averageRating: number; fitAccuracyPercent: number; count: number; reviews: any[] }>({
    averageRating: 5.0,
    fitAccuracyPercent: 100,
    count: 0,
    reviews: []
  });
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isAdded, setIsAdded] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!allProducts || allProducts.length === 0) {
      fetchProductsFromDb();
    }
  }, [allProducts, fetchProductsFromDb]);

  // Track in recently viewed
  useEffect(() => {
    if (!product?.id || typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('irisi_recently_viewed');
      const list: string[] = raw ? JSON.parse(raw) : [];
      const updated = [String(product.id), ...list.filter((id) => String(id) !== String(product.id))].slice(0, 12);
      localStorage.setItem('irisi_recently_viewed', JSON.stringify(updated));
    } catch (e) {}
  }, [product?.id]);

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

  // Sync with cachedProduct if it becomes available
  useEffect(() => {
    if (cachedProduct && !product) {
      setProduct(cachedProduct);
      setIsLoading(false);
      const pref = bodyProfile?.preferredSize || 'M';
      setSelectedSize(cachedProduct.sizes?.includes(pref) ? pref : (cachedProduct.sizes?.[0] || 'M'));
      setSelectedColor(cachedProduct.colors?.[0] || { name: 'As Pictured', hex: '#111111' });
      if (cachedProduct.imageUrl) setActiveImage(cachedProduct.imageUrl);
    }
  }, [cachedProduct, product, bodyProfile]);

  const handleSelectColor = (c: any) => {
    const colorObj = typeof c === 'object' ? c : { name: c, hex: '#111111' };
    setSelectedColor(colorObj);
    setIsVideoPlaying(false);

    // 1. If color has direct imageUrl
    if (colorObj.imageUrl) {
      setActiveImage(colorObj.imageUrl);
      return;
    }

    // 2. Look for matching image in product.images
    if (Array.isArray(product?.images)) {
      const match = product.images.find((img: any) => {
        if (typeof img === 'object' && img.colorName?.toLowerCase() === colorObj.name?.toLowerCase()) {
          return true;
        }
        return false;
      });
      if (match) {
        setActiveImage(typeof match === 'string' ? match : match.url);
      }
    }
  };

  // Fetch exact single product from API by ID (SWR style: silent update if cachedProduct exists)
  useEffect(() => {
    async function loadSingleProduct() {
      if (!productId) return;
      if (!cachedProduct) {
        setIsLoading(true);
      }
      setErrorMsg('');

      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();

        if (res.ok && data.success && data.product) {
          const p = data.product;
          setProduct(p);
          const pref = bodyProfile?.preferredSize || 'M';
          const defaultSz = p.sizes?.includes(pref) ? pref : (p.sizes?.[0] || 'M');
          setSelectedSize((prev: string) => (p.sizes?.includes(prev) ? prev : defaultSz));
          const initialColor = p.colors?.[0] || { name: 'As Pictured', hex: '#111111' };
          setSelectedColor((prev: any) => prev || initialColor);
          setActiveImage((prev: string) => prev || initialColor?.imageUrl || p.imageUrl || '');

          // Fetch reviews for this product
          try {
            const revRes = await fetch(`/api/reviews?productId=${encodeURIComponent(p.id)}`);
            const revJson = await revRes.json();
            if (revJson.success) {
              setReviewsData(revJson);
            }
          } catch (e) {}
        } else if (!cachedProduct) {
          setErrorMsg(data.error || 'Product not found');
        }
      } catch (err: any) {
        if (!cachedProduct) {
          setErrorMsg('Failed to load product details.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadSingleProduct();
  }, [productId, cachedProduct, bodyProfile]);

  if (isLoading) {
    return <LuxuryLoader fullScreen={false} />;
  }

  if (!product || errorMsg) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-5 animate-fadeIn bg-white dark:bg-[#0A0A0C] text-black dark:text-white">
        <div className="h-20 w-20 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-400">
          <Layers className="h-9 w-9 stroke-[1.3]" />
        </div>
        <div className="space-y-1.5 max-w-sm mx-auto">
          <span className="text-[10px] font-mono tracking-widest uppercase text-amber-500 font-bold block">
            PIECE NOT FOUND
          </span>
          <h2 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white">
            Product Not Found
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-light">
            {errorMsg || 'The requested piece is no longer active in our catalog or may have been archived.'}
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-md"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Shop</span>
          </Link>
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs font-bold uppercase tracking-wider text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            <span>Browse Categories</span>
          </Link>
        </div>
      </div>
    );
  }

  const isSaved = isInVault(product.id);

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

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedSize, selectedColor, quantity);

    setIsAdded(true);
    try {
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.85 },
        colors: ['#e6c367', '#10b981', '#ffffff']
      });
    } catch {}

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setIsAdded(false);
    }, 2200);
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

  const rates = product.shippingRates || {
    sameCity: 1000,
    closeHub: 2500,
    interstate: 4500,
    parkPickup: 1500
  };

  const locationLabel = product.vendorCity || product.vendorState ? (
    <>Ships from <strong className="text-[var(--gold-accent)]">{product.vendorCity ? `${product.vendorCity}, ` : ''}{product.vendorState}</strong></>
  ) : (
    'Ships direct from boutique'
  );

  return (
    <>
      {/* 1. DEDICATED MOBILE PRODUCT DETAIL VIEW */}
      <div className="block md:hidden">
        <MobileProductDetailView product={product} reviewsData={reviewsData} />
      </div>

      {/* 2. DESKTOP LUXURY PRODUCT DETAIL VIEW */}
      <div className="hidden md:block min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 animate-fadeIn pb-20">
      
      {/* Top Breadcrumbs & Back Navigation */}
      <div className="flex items-center justify-between text-xs font-mono-luxury text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[var(--text-primary)] transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-[var(--gold-accent)] uppercase font-bold">{product.category}</span>
          <span>/</span>
          <span className="text-[var(--text-primary)] font-bold truncate max-w-[200px]">{product.name}</span>
        </div>

        <Link
          href="/shop"
          className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-bold uppercase text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Shop</span>
        </Link>
      </div>

      {/* Main 2-Column Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        
        {/* LEFT COLUMN: HD GALLERY + VENDOR DELIVERY RATES UNDER IMAGE (6 COLS) */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* Main Product Image Container with Hover to Play Video or Show Next Image */}
          <div
            onMouseEnter={() => {
              setIsHovered(true);
              if (hoverVideoRef.current) {
                hoverVideoRef.current.play().catch(() => {});
              }
            }}
            onMouseLeave={() => {
              setIsHovered(false);
              if (hoverVideoRef.current) {
                hoverVideoRef.current.pause();
                hoverVideoRef.current.currentTime = 0;
              }
            }}
            className="relative h-[480px] sm:h-[540px] w-full rounded-3xl overflow-hidden surface-card border border-[var(--border-subtle)] shadow-xl group"
          >
            {/* 1. Base Active Image */}
            <Image
              src={activeImage || product.imageUrl}
              alt={product.name}
              fill
              unoptimized
              priority
              className={`object-cover object-center transition-all duration-700 ${
                isHovered && (product.videoUrl || nextImage) ? 'opacity-0 scale-105' : 'opacity-100 scale-100 group-hover:scale-105'
              }`}
            />

            {/* 2. Hover Next/Alternate Image (when no video) */}
            {nextImage && !product.videoUrl && (
              <Image
                src={nextImage}
                alt={`${product.name} alternate view`}
                fill
                unoptimized
                className={`object-cover object-center transition-opacity duration-500 pointer-events-none ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}

            {/* 3. Hover Video Playback (when video is available) */}
            {product.videoUrl && (
              <video
                ref={(el) => {
                  hoverVideoRef.current = el;
                  if (el) {
                    el.muted = true;
                    el.defaultMuted = true;
                    el.playsInline = true;
                    el.setAttribute('muted', '');
                    el.setAttribute('playsinline', '');
                    el.setAttribute('webkit-playsinline', '');
                  }
                }}
                src={product.videoUrl}
                poster={activeImage || product.imageUrl}
                loop
                muted
                playsInline
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 pointer-events-none ${
                  isHovered || isVideoPlaying ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              />
            )}

            {/* Vendor Badge Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
              <span className="px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md text-white text-[11px] font-mono-luxury uppercase font-bold border border-white/10 shadow-md">
                {product.vendorName}
              </span>
            </div>

            {/* Subtle video preview indicator when product has video */}
            {product.videoUrl && (
              <div className="absolute top-4 right-4 z-20">
                <span className="px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white/90 text-[11px] font-mono-luxury font-bold border border-white/15 flex items-center gap-1.5 shadow-md">
                  <Play className="h-3 w-3 text-[var(--gold-accent)] fill-current" />
                  <span>{isHovered ? 'Playing Preview' : 'Hover to Play'}</span>
                </span>
              </div>
            )}

            {/* Store Origin Location Badge on Photo */}
            <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-black/85 backdrop-blur-md border border-white/10 flex items-center justify-between text-xs font-mono-luxury text-white z-20">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[var(--gold-accent)] shrink-0" />
                <span>{locationLabel}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                <Clock className="h-3 w-3" />
                <span>{product.dispatchDays || '1-2 business days'}</span>
              </div>
            </div>
          </div>

          {/* Desktop Multi-Image & Video Thumbnail Strip */}
          {((product.images && product.images.length > 1) || product.videoUrl) && (
            <div className="flex items-center gap-2.5 overflow-x-auto py-1 scrollbar-none">
              {Array.from(new Set<string>([
                product.imageUrl,
                ...(Array.isArray(product.images) ? product.images.map((img: any) => typeof img === 'string' ? img : img?.url) : [])
              ].filter(Boolean))).map((imgUrl: string, idx: number) => {
                const isCurrent = (activeImage === imgUrl || (!activeImage && idx === 0)) && !isVideoPlaying;
                const matchedColor = product.colors?.find((c: any) => c.imageUrl === imgUrl);

                return (
                  <button
                    key={`thumb-${idx}`}
                    type="button"
                    onClick={() => {
                      setActiveImage(imgUrl);
                      setIsVideoPlaying(false);
                      if (matchedColor) setSelectedColor(matchedColor);
                    }}
                    onMouseEnter={() => {
                      setActiveImage(imgUrl);
                      setIsVideoPlaying(false);
                      if (matchedColor) setSelectedColor(matchedColor);
                    }}
                    className={`relative h-20 w-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group/thumb ${
                      isCurrent
                        ? 'border-[var(--gold-accent)] ring-2 ring-[var(--gold-accent)]/40 scale-105 shadow-md'
                        : 'border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/60 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`${product.name} view ${idx + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    {matchedColor && (
                      <span
                        className="absolute bottom-1 right-1 h-3 w-3 rounded-full border border-white/40 shadow-sm"
                        style={{ backgroundColor: matchedColor.hex }}
                        title={matchedColor.name}
                      />
                    )}
                  </button>
                );
              })}

              {/* Video Thumbnail if available */}
              {product.videoUrl && (
                <button
                  type="button"
                  onClick={() => setIsVideoPlaying(true)}
                  className={`relative h-20 w-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 bg-black flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isVideoPlaying
                      ? 'border-[var(--gold-accent)] ring-2 ring-[var(--gold-accent)]/40 scale-105 shadow-md'
                      : 'border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/60 opacity-80 hover:opacity-100'
                  }`}
                >
                  <Play className="h-6 w-6 text-[var(--gold-accent)] fill-current mb-0.5" />
                  <span className="text-[9px] font-mono-luxury font-bold uppercase text-white tracking-wider">
                    Video
                  </span>
                </button>
              )}
            </div>
          )}

          {/* NATIONWIDE COURIER & MOTOR PARK DELIVERY INFO */}
          <div className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3 text-xs font-mono-luxury shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                <Truck className="h-4 w-4 text-[var(--gold-accent)]" />
                <span className="uppercase tracking-wider">Nationwide Courier &amp; Waybill</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold">
                Dispatches in {product.dispatchDays || '1-2 business days'}
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
              Live courier delivery rates calculated dynamically at checkout based on your delivery address. Verified doorstep delivery (GIG Logistics, Fez, Red Star) and Motor Park Waybills supported nationwide.
            </p>

            <div className="flex items-center gap-2 text-xs text-[var(--gold-accent)] font-medium pt-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>Dispatched directly from <strong className="text-[var(--text-primary)]">{product.vendorCity ? `${product.vendorCity}, ` : ''}{product.vendorState}</strong></span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: SPECS, COLORS, SIZES, STOCK & ADD TO BAG (6 COLS) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Header & Vendor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Link
                href={`/brand/${encodeURIComponent(product.vendorName)}`}
                className="inline-flex items-center gap-1.5 text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold hover:underline"
              >
                <Store className="h-3.5 w-3.5" />
                <span>{product.vendorName}</span>
              </Link>

              <button
                onClick={() => toggleVaultItem(product)}
                className={`p-2 rounded-full border transition-all cursor-pointer ${
                  isSaved
                    ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)]'
                    : 'surface-card border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-rose-400'
                }`}
                title={isSaved ? 'In Vault' : 'Save to Vault'}
              >
                <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>

            <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] leading-tight">
              {product.name}
            </h1>

            {/* Origin & Turnaround Line */}
            <div className="flex items-center gap-2 text-xs font-mono-luxury text-[var(--text-secondary)]">
              <MapPin className="h-3.5 w-3.5 text-[var(--gold-accent)] shrink-0" />
              <span>Ships from <strong className="text-[var(--text-primary)]">{product.vendorCity ? `${product.vendorCity}, ` : ''}{product.vendorState}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">Dispatches in {product.dispatchDays || '1-2 business days'}</span>
            </div>

            {/* Price & Rating */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
              <div className="flex items-baseline gap-3">
                <span className="font-editorial text-3xl sm:text-4xl font-bold text-amber-600 dark:text-[var(--gold-accent)] drop-shadow-sm">
                  ₦{Number(product.price).toLocaleString()}
                </span>
                <span className="text-xs font-mono-luxury text-emerald-500 font-bold">
                  In Stock
                </span>
              </div>

              {reviewsData && reviewsData.count > 0 && reviewsData.averageRating > 0 ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--badge-bg)] border border-[var(--border-subtle)] text-xs font-mono-luxury">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-[var(--text-primary)]">{reviewsData.averageRating.toFixed(1)}</span>
                  <span className="text-[var(--text-muted)]">({reviewsData.count} {reviewsData.count === 1 ? 'review' : 'reviews'})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--badge-bg)] border border-[var(--border-subtle)] text-xs font-mono-luxury">
                  <span className="text-[var(--gold-accent)] font-bold">Verified Drop</span>
                </div>
              )}
            </div>
          </div>

          {/* Description (Only show when genuine description exists) */}
          {product.description && product.description.trim().length > 0 && product.description.trim().toLowerCase() !== (product.name || '').trim().toLowerCase() && (
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)] pt-4">
              {product.description}
            </p>
          )}

          {/* 1. Color Selector (Only shown when multiple colorways are offered) */}
          {product.category !== 'accessories' && product.colors && product.colors.length > 1 && !product.colors.every((c: any) => {
            const name = (typeof c === 'string' ? c : c?.name || '').toLowerCase();
            return name === 'as pictured' || name === 'standard';
          }) && (
            <div className="p-5 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-xs font-mono-luxury">
                <span className="text-[var(--text-secondary)] uppercase font-bold">
                  Select Color: <strong className="text-[var(--text-primary)]">{selectedColor?.name || 'Standard'}</strong>
                </span>
                <span className="text-[11px] text-[var(--gold-accent)] font-bold">
                  {product.colors.length} {product.colors.length === 1 ? 'Option' : 'Options'}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-1 flex-wrap">
                {product.colors.map((c: any, index: number) => {
                  const colorName = typeof c === 'string' ? c : (c.name || 'Standard');
                  const colorHex = typeof c === 'object' && c?.hex ? c.hex : '#111111';
                  const isSelected = selectedColor?.name === colorName || selectedColor?.hex === colorHex;
                  return (
                    <button
                      key={`color-${colorName}-${index}`}
                      type="button"
                      onClick={() => handleSelectColor(c)}
                      onMouseEnter={() => handleSelectColor(c)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md border-transparent ring-2 ring-[var(--gold-accent)]'
                          : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-white/30 shadow-sm shrink-0"
                        style={{
                          background: colorName.toLowerCase().includes('multi')
                            ? 'conic-gradient(from 180deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #f59e0b, #ef4444, #ec4899)'
                            : colorHex
                        }}
                      />
                      <span className="text-xs font-mono-luxury font-bold">{colorName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Size Selector */}
          {product.category === 'accessories' ? (
            <div className="p-5 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-mono-luxury">
                <span className="text-[var(--text-secondary)] uppercase font-bold">Size & Fit:</span>
                <span className="text-emerald-500 font-bold">{product.stockQuantity || currentSizeStock || 1} available</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 text-xs font-mono-luxury font-bold">
                <span>One Size · Universal Fit</span>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-xs font-mono-luxury">
                <span className="text-[var(--text-secondary)] uppercase font-bold">
                  {product.category === 'footwear' ? 'Select Shoe Size (EU):' : 'Select Size:'}
                </span>
                {isOutOfStock ? (
                  <span className="text-rose-400 font-bold">Out of Stock</span>
                ) : currentSizeStock <= 5 ? (
                  <span className="text-amber-500 font-bold animate-pulse">Only {currentSizeStock} left!</span>
                ) : (
                  <span className="text-emerald-500 font-bold">{currentSizeStock} available</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5 font-mono-luxury text-xs pt-1">
                {(Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : (product.sizeStock && Object.keys(product.sizeStock).length > 0 ? Object.keys(product.sizeStock) : ['M', 'L', 'XL'])).map((size: string) => {
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
                      className={`min-w-[48px] px-4 py-3 rounded-2xl border transition-all text-center flex items-center justify-center font-bold cursor-pointer ${
                        szOutOfStock
                          ? 'opacity-30 line-through cursor-not-allowed bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                          : isChosen
                          ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)] shadow-md font-extrabold'
                          : 'surface-card border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                      }`}
                    >
                      <span>{size}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] flex items-center justify-between shadow-xs">
            <span className="text-xs font-mono-luxury uppercase font-bold text-[var(--text-secondary)]">
              Quantity:
            </span>
            <div className="flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-1 px-2">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1 || isOutOfStock}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-primary)] disabled:opacity-30 transition-all cursor-pointer font-bold text-base"
                title="Decrease quantity"
              >
                -
              </button>
              <span className="text-sm font-mono-luxury font-bold text-[var(--text-primary)] min-w-[24px] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(q => Math.min(currentSizeStock || 15, q + 1))}
                disabled={quantity >= (currentSizeStock || 15) || isOutOfStock}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-primary)] disabled:opacity-30 transition-all cursor-pointer font-bold text-base"
                title="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons: Add to Bag & Buy Now */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`py-4 px-6 rounded-full font-mono-luxury uppercase text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer active:scale-95 ${
                  isAdded
                    ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'surface-card border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--gold-accent)]'
                }`}
              >
                {isAdded ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 animate-bounce" />
                    <span className="text-emerald-400 font-extrabold tracking-wider">Added to Bag! ✓</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    <span>{isOutOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="py-4 px-6 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 font-mono-luxury uppercase text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
              >
                <span>Instant Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Buyer Protection Guarantee */}
          <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center gap-3 text-xs font-mono-luxury text-[var(--text-secondary)]">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <span className="font-bold text-[var(--text-primary)]">Buyer Protection Guarantee:</span> Your payment is safely held until the item is delivered and confirmed.
            </div>
          </div>

        </div>

      </div>

      {/* Verified Customer Reviews & Sizing Feedback Section */}
      <div className="pt-12 border-t border-[var(--border-subtle)] space-y-8 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--gold-accent)]" />
              <span className="text-xs font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold">
                Verified Client Feedback
              </span>
            </div>
            <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1">
              Customer Reviews & Sizing Ratings
            </h3>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-xs font-mono-luxury font-bold text-[var(--gold-accent)]">
              <Star className="h-4 w-4 fill-current text-[var(--gold-accent)]" />
              <span>{reviewsData.averageRating} / 5.0 Rating ({reviewsData.count} Reviews)</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono-luxury font-bold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{reviewsData.fitAccuracyPercent}% True to Size</span>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reviewsData.reviews.map((rev, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4 shadow-sm hover:border-[var(--gold-accent)]/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 flex items-center justify-center font-bold text-xs text-[var(--gold-accent)] font-mono-luxury">
                    {rev.customerName ? rev.customerName.charAt(0).toUpperCase() : 'V'}
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                      <span>{rev.customerName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono-luxury font-bold">
                        Verified Purchase
                      </span>
                    </div>
                    <span className="text-[10px] font-mono-luxury text-[var(--text-muted)]">{rev.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[var(--gold-accent)]">
                  {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                &quot;{rev.comment}&quot;
              </p>

              <div className="flex items-center gap-2 pt-1 border-t border-[var(--border-subtle)] text-[11px] font-mono-luxury text-[var(--text-muted)]">
                <span className="text-[var(--gold-accent)] font-bold">Fit Note:</span>
                <span className="capitalize">{rev.fitRating === 'true_to_size' ? 'True to Size & Perfect Drape' : rev.fitRating?.replace(/_/g, ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. SIMILAR PIECES / CHECK SIMILAR PRODUCTS */}
      {similarProducts.length > 0 && (
        <div className="space-y-6 pt-10 border-t border-[var(--border-subtle)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 hover:border-[var(--gold-accent)]/50 transition-all shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold block">
                  Curated Recommendations
                </span>
                <h3 className="font-editorial text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                  Check Similar Products
                </h3>
                <span className="text-xs text-[var(--text-muted)] font-mono-luxury">
                  {similarProducts.length} matching pieces curated based on this style
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <Link
                href={`/shop?category=${product.category || 'all'}`}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono-luxury uppercase font-bold text-[var(--text-secondary)] hover:text-[var(--gold-accent)] transition-colors mr-2"
              >
                <span>Explore Collection</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setShowSimilarProducts((prev) => !prev)}
                className="px-5 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 font-mono-luxury uppercase text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-md"
              >
                <span>{showSimilarProducts ? 'Hide Similar Pieces' : 'Check Similar Products'}</span>
                {showSimilarProducts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* When clicked, show the products under */}
          {showSimilarProducts && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-fadeIn">
              {similarProducts.slice(0, 4).map((item: any) => {
                const itemImg = item.imageUrl || (Array.isArray(item.images) && item.images[0]) || '/images/products/BlackTrapStarHoodie.jpg';
                const isItemSaved = isInVault(item.id);
                return (
                  <div
                    key={`desktop-similar-${item.id}`}
                    className="group rounded-2xl surface-card overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/50 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl"
                  >
                    <div className="relative aspect-[3/4] w-full bg-[var(--bg-secondary)] overflow-hidden">
                      <Link href={`/shop/${item.id}`} className="block w-full h-full">
                        <Image
                          src={itemImg}
                          alt={item.name}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </Link>
                      <div className="absolute top-3 left-3 pointer-events-none">
                        <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[9px] font-mono-luxury uppercase tracking-wider text-white border border-white/10 font-bold">
                          {item.vendorName || 'Atelier'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVaultItem(item);
                        }}
                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                          isItemSaved
                            ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)] shadow-md'
                            : 'bg-black/60 text-white/80 border-white/10 hover:text-white hover:bg-black/85'
                        }`}
                        aria-label="Curate to Vault"
                      >
                        <Heart className={`h-3.5 w-3.5 ${isItemSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold tracking-wider block">
                          {item.category}
                        </span>
                        <Link href={`/shop/${item.id}`} className="hover:text-[var(--gold-accent)] transition-colors">
                          <h4 className="font-editorial text-sm sm:text-base font-bold text-[var(--text-primary)] line-clamp-1 mt-0.5">
                            {item.name}
                          </h4>
                        </Link>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                        <span className="font-mono-luxury font-bold text-sm sm:text-base text-[var(--text-primary)]">
                          ₦{Number(item.price || 0).toLocaleString()}
                        </span>
                        <Link
                          href={`/shop/${item.id}`}
                          className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-primary)] text-xs font-mono-luxury font-bold uppercase tracking-wider text-[var(--text-primary)] transition-colors"
                        >
                          View Piece
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. RECENTLY VIEWED (Strictly actual user history, ZERO mock fallbacks) */}
      {recentlyViewed.length > 0 && (
        <div className="space-y-6 pt-10 border-t border-[var(--border-subtle)]">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold block">
                Session History
              </span>
              <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                Recently Viewed
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleClearRecentlyViewed}
                className="text-xs font-mono-luxury uppercase font-bold text-[var(--text-muted)] hover:text-rose-500 transition-colors cursor-pointer"
              >
                Clear History
              </button>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 text-xs font-mono-luxury uppercase font-bold text-[var(--text-secondary)] hover:text-[var(--gold-accent)] transition-colors"
              >
                <span>Back to Catalog</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {recentlyViewed.slice(0, 4).map((item: any) => {
              const itemImg = item.imageUrl || (Array.isArray(item.images) && item.images[0]) || '/images/products/BlackTrapStarHoodie.jpg';
              const isItemSaved = isInVault(item.id);
              return (
                <div
                  key={`desktop-recent-${item.id}`}
                  className="group rounded-2xl surface-card overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/50 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl"
                >
                  <div className="relative aspect-[3/4] w-full bg-[var(--bg-secondary)] overflow-hidden">
                    <Link href={`/shop/${item.id}`} className="block w-full h-full">
                      <Image
                        src={itemImg}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </Link>
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[9px] font-mono-luxury uppercase tracking-wider text-white border border-white/10 font-bold">
                        {item.vendorName || 'Atelier'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVaultItem(item);
                      }}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                        isItemSaved
                          ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)] shadow-md'
                          : 'bg-black/60 text-white/80 border-white/10 hover:text-white hover:bg-black/85'
                      }`}
                      aria-label="Curate to Vault"
                    >
                      <Heart className={`h-3.5 w-3.5 ${isItemSaved ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold tracking-wider block">
                        {item.category}
                      </span>
                      <Link href={`/shop/${item.id}`} className="hover:text-[var(--gold-accent)] transition-colors">
                        <h4 className="font-editorial text-sm sm:text-base font-bold text-[var(--text-primary)] line-clamp-1 mt-0.5">
                          {item.name}
                        </h4>
                      </Link>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                      <span className="font-mono-luxury font-bold text-sm sm:text-base text-[var(--text-primary)]">
                        ₦{Number(item.price || 0).toLocaleString()}
                      </span>
                      <Link
                        href={`/shop/${item.id}`}
                        className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-primary)] text-xs font-mono-luxury font-bold uppercase tracking-wider text-[var(--text-primary)] transition-colors"
                      >
                        View Piece
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>

      {/* 3D WebGL Product Inspector Modal */}
      {product && (
        <Product3DModal
          isOpen={is3DModalOpen}
          onClose={() => setIs3DModalOpen(false)}
          product={product}
        />
      )}
    </>
  );
}
