'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import {
  Sparkles, Check, ShoppingBag, ShieldCheck, Truck, RotateCcw,
  Star, Heart, ArrowLeft, ArrowRight, Share2, Ruler,
  Building, Phone, MapPin, CheckCircle2, ChevronRight, Loader2, Store, Clock, Package, Play, User, Layers
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import MobileProductDetailView from '@/components/shop/MobileProductDetailView';
import LuxuryLoader from '@/components/common/LuxuryLoader';
import Product3DModal from '@/components/3d/Product3DModal';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const {
    bodyProfile,
    addToCart,
    allProducts,
    toggleVaultItem,
    isInVault,
    setOutfitItem,
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
  const [activeImage, setActiveImage] = useState<string>(() => cachedProduct?.imageUrl || '');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);
  const [isModelTryOnOpen, setIsModelTryOnOpen] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [reviewsData, setReviewsData] = useState<{ averageRating: number; fitAccuracyPercent: number; count: number; reviews: any[] }>({
    averageRating: 5.0,
    fitAccuracyPercent: 100,
    count: 0,
    reviews: []
  });
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

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
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fadeIn">
        <div className="h-16 w-16 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
          <RotateCcw className="h-8 w-8" />
        </div>
        <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          Product Not Found
        </h2>
        <p className="text-xs font-mono-luxury text-[var(--text-secondary)] max-w-md mx-auto">
          {errorMsg || 'The requested product is no longer active in the storefront catalog.'}
        </p>
        <Link
          href="/shop"
          className="px-6 py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase font-bold hover:opacity-90 transition-all shadow-md inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Storefront</span>
        </Link>
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
    addToCart(product, selectedSize);
    setAddedToast(true);
    confetti({
      particleCount: 45,
      spread: 55,
      origin: { y: 0.6 },
      colors: ['#e6c367', '#10b981', '#ffffff']
    });
    setTimeout(() => setAddedToast(false), 3500);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedSize);
    router.push('/checkout');
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
          
          {/* Main Product Image Container */}
          <div className="relative h-[480px] sm:h-[540px] w-full rounded-3xl overflow-hidden surface-card border border-[var(--border-subtle)] shadow-xl group">
            {isVideoPlaying && product.videoUrl ? (
              <video
                src={product.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src={activeImage || product.imageUrl}
                alt={product.name}
                fill
                unoptimized
                priority
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
            )}

            {/* Vendor Badge Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              <span className="px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md text-white text-[11px] font-mono-luxury uppercase font-bold border border-white/10 shadow-md">
                {product.vendorName}
              </span>
            </div>

            {/* Action Badges in Top Right: Try on Model, Inspect in 3D & Watch Video */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setOutfitItem(product);
                  router.push('/studio');
                }}
                className="px-3.5 py-1.5 rounded-full bg-black/85 hover:bg-black text-[var(--gold-accent)] text-xs font-mono-luxury font-bold flex items-center gap-1.5 border border-[var(--gold-accent)] backdrop-blur-md shadow-lg transition-all active:scale-95 cursor-pointer hover:bg-[var(--gold-accent)] hover:text-black"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Style in Studio</span>
              </button>

              <button
                type="button"
                onClick={() => setIs3DModalOpen(true)}
                className="px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-white/90 hover:text-white text-xs font-mono-luxury font-bold flex items-center gap-1.5 border border-white/20 backdrop-blur-md shadow-lg transition-all active:scale-95 cursor-pointer hover:border-[var(--gold-accent)] hover:text-[var(--gold-accent)]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Inspect in 3D</span>
              </button>

              {product.videoUrl && !isVideoPlaying && (
                <button
                  type="button"
                  onClick={() => setIsVideoPlaying(true)}
                  className="px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-white hover:text-zinc-200 text-xs font-mono-luxury font-bold flex items-center gap-1.5 border border-white/15 backdrop-blur-md shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Watch Video</span>
                </button>
              )}
            </div>

            {/* Store Origin Location Badge on Photo */}
            <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-black/85 backdrop-blur-md border border-white/10 flex items-center justify-between text-xs font-mono-luxury text-white">
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

          {/* Action Buttons: Add to Bag & Buy Now */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="py-4 px-6 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--gold-accent)] font-mono-luxury uppercase text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Add to Bag</span>
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

            {addedToast && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-mono-luxury font-bold flex items-center justify-center gap-2 animate-fadeIn text-center">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Item added to your shopping bag!</span>
              </div>
            )}
          </div>

          {/* Buyer Protection Guarantee */}
          <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center gap-3 text-xs font-mono-luxury text-[var(--text-secondary)]">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <span className="font-bold text-[var(--text-primary)]">Ìrísí Escrow Protection:</span> Your payment is held safely until the item is delivered and inspected.
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
