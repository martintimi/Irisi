'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import {
  ArrowLeft, Heart, ShoppingBag, Grid2X2, Square, Eye,
  Bookmark, MapPin, Sparkles, Scissors, ArrowRight, PackageSearch, RotateCcw
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import MobileQuickBuyDrawer from '@/components/mobile/MobileQuickBuyDrawer';
import MobileProductSlider from '@/components/shop/MobileProductSlider';
import ProductQuickLookModal from '@/components/shop/ProductQuickLookModal';
import { products as fallbackProducts } from '@/lib/data/products';
import { calculateFitMatch } from '@/lib/utils/sizingEngine';

// Category metadata mapping for title and filtering
interface CategoryConfig {
  title: string;
  subtitle: string;
  filterFn: (p: any) => boolean;
}

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  shirts: {
    title: 'SHIRTS',
    subtitle: 'Button-downs, polo shirts & casual tops',
    filterFn: (p: any) => {
      const n = (p.name || '').toLowerCase();
      const tags = Array.isArray(p.tags) ? p.tags.map((t: string) => t.toLowerCase()) : [];
      if (n.includes('agbada') || n.includes('senator') || n.includes('hoodie')) return false;
      return (
        n.includes('shirt') ||
        n.includes('tee') ||
        n.includes('top') ||
        n.includes('lace') ||
        tags.some((t: string) => t.includes('shirt') || t.includes('tee') || t.includes('top') || t.includes('lace'))
      );
    }
  },
  streetwear: {
    title: 'STREETWEAR',
    subtitle: 'Heavyweight hoodies, graphic drops & urban sets',
    filterFn: (p: any) => {
      const n = (p.name || '').toLowerCase();
      const tags = Array.isArray(p.tags) ? p.tags.map((t: string) => t.toLowerCase()) : [];
      return (
        n.includes('hoodie') ||
        n.includes('sweatshirt') ||
        n.includes('trapstar') ||
        n.includes('street') ||
        n.includes('kokolee') ||
        tags.some((t: string) => t.includes('hoodie') || t.includes('streetwear') || t.includes('street'))
      );
    }
  },
  native: {
    title: 'NATIVE & AGBADA',
    subtitle: 'Senator kaftans, royal Agbadas & bespoke tailoring',
    filterFn: (p: any) => {
      const n = (p.name || '').toLowerCase();
      const tags = Array.isArray(p.tags) ? p.tags.map((t: string) => t.toLowerCase()) : [];
      return (
        n.includes('agbada') ||
        n.includes('senator') ||
        n.includes('kaftan') ||
        n.includes('native') ||
        tags.some((t: string) => t.includes('native') || t.includes('agbada') || t.includes('senator'))
      );
    }
  },
  footwear: {
    title: 'FOOTWEAR & SLIDES',
    subtitle: 'Handcrafted cowhide slides, mules & sneakers',
    filterFn: (p: any) => {
      const n = (p.name || '').toLowerCase();
      const c = (p.category || '').toLowerCase();
      return (
        c === 'footwear' ||
        n.includes('slide') ||
        n.includes('shoe') ||
        n.includes('adilette') ||
        n.includes('sneaker') ||
        n.includes('loafer') ||
        n.includes('palm') ||
        n.includes('clog') ||
        n.includes('croc')
      );
    }
  },
  clogs: {
    title: 'CROCS & FOAM CLOGS',
    subtitle: 'Classic clogs, platform mules, Crocs & foam comfort slip-ons',
    filterFn: (p: any) => {
      const n = (p.name || '').toLowerCase();
      const tags = Array.isArray(p.tags) ? p.tags.map((t: string) => t.toLowerCase()) : [];
      return (
        n.includes('clog') ||
        n.includes('croc') ||
        n.includes('foam') ||
        n.includes('mule') ||
        tags.some((t: string) => t.includes('clog') || t.includes('croc') || t.includes('foam'))
      );
    }
  },
  trousers: {
    title: 'TROUSERS & DENIM',
    subtitle: 'Baggy selvedge denim, cargo pants & tailored trousers',
    filterFn: (p: any) => {
      const n = (p.name || '').toLowerCase();
      const c = (p.category || '').toLowerCase();
      return (
        c === 'bottoms' ||
        n.includes('jean') ||
        n.includes('pant') ||
        n.includes('cargo') ||
        n.includes('trouser') ||
        n.includes('jogger') ||
        n.includes('adiddas')
      );
    }
  },
  accessories: {
    title: 'CAPS & ACCESSORIES',
    subtitle: 'Monogram caps, Cuban links & luxury accessories',
    filterFn: (p: any) => {
      const n = (p.name || '').toLowerCase();
      const c = (p.category || '').toLowerCase();
      return (
        c === 'accessories' ||
        n.includes('cap') ||
        n.includes('watch') ||
        n.includes('chain') ||
        n.includes('neckless') ||
        n.includes('necklace') ||
        n.includes('ring') ||
        n.includes('hat')
      );
    }
  },
  jewelry: {
    title: 'JEWELRY & WATCHES',
    subtitle: 'Cuban links, signet rings & luxury timepieces',
    filterFn: (p: any) => {
      const n = (p.name || '').toLowerCase();
      return (
        n.includes('watch') ||
        n.includes('chain') ||
        n.includes('neckless') ||
        n.includes('necklace') ||
        n.includes('ring') ||
        n.includes('bracelet') ||
        n.includes('rolex')
      );
    }
  },
  dresses: {
    title: 'DRESSES & GOWNS',
    subtitle: 'Silk boubous, two-piece sets & evening gowns',
    filterFn: (p: any) => {
      const n = (p.name || '').toLowerCase();
      const tags = Array.isArray(p.tags) ? p.tags.map((t: string) => t.toLowerCase()) : [];
      return (
        n.includes('dress') ||
        n.includes('gown') ||
        n.includes('boubou') ||
        n.includes('bubu') ||
        tags.some((t: string) => t.includes('dress') || t.includes('boubou') || t.includes('maxidress'))
      );
    }
  }
};

const ALL_CATEGORY_LINKS = [
  { slug: 'native', label: 'Native & Agbada' },
  { slug: 'streetwear', label: 'Streetwear' },
  { slug: 'shirts', label: 'Shirts & Tops' },
  { slug: 'footwear', label: 'Footwear & Slides' },
  { slug: 'trousers', label: 'Trousers & Denim' },
  { slug: 'accessories', label: 'Accessories' },
];

export default function DedicatedCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params?.slug || '').toLowerCase();

  const {
    bodyProfile,
    allProducts,
    toggleVaultItem,
    isInVault,
    fetchProductsFromDb,
    addToCart,
    setOutfitItem,
  } = useStore();

  const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);
  const [quickLookProduct, setQuickLookProduct] = useState<any>(null);
  const [burstingHearts, setBurstingHearts] = useState<Set<string>>(new Set());
  const [gridCols, setGridCols] = useState<1 | 2>(2);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('irisi-mobile-grid-cols');
      if (saved === '1' || saved === '2') setGridCols(Number(saved) as 1 | 2);
    }
  }, []);

  const toggleGridCols = () => {
    const next = gridCols === 2 ? 1 : 2;
    setGridCols(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('irisi-mobile-grid-cols', String(next));
    }
  };

  useEffect(() => {
    fetchProductsFromDb();
  }, [fetchProductsFromDb]);

  // Find configuration or fallback dynamically
  const config = useMemo(() => {
    if (CATEGORY_MAP[slug]) return CATEGORY_MAP[slug];
    const formattedTitle = slug.replace(/-/g, ' ').toUpperCase();
    return {
      title: formattedTitle,
      subtitle: `Curated ${slug.replace(/-/g, ' ')} collections`,
      filterFn: (p: any) => {
        const q = slug.toLowerCase();
        return (
          p.category === q ||
          (p.name && p.name.toLowerCase().includes(q)) ||
          (Array.isArray(p.tags) && p.tags.some((t: string) => t.toLowerCase().includes(q)))
        );
      }
    };
  }, [slug]);

  // Filter products strictly for this category
  const categoryProducts = useMemo(() => {
    let list = Array.isArray(allProducts) && allProducts.length > 0 ? allProducts : [];
    if (list.length === 0 && Array.isArray(fallbackProducts)) {
      list = fallbackProducts;
    }
    return list.filter(config.filterFn);
  }, [allProducts, config]);

  const handleHeartClick = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleVaultItem(product);
    setBurstingHearts((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setBurstingHearts((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 700);
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] select-none">
      
      {/* ========================================================================= */}
      {/* ── 1. DEDICATED MOBILE CATEGORY VIEW (< md screen sizes) ───────────────── */}
      {/* ========================================================================= */}
      <div className="block md:hidden pb-28">
        
        {/* Mobile ASOS-Style Sticky App Bar */}
        <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border-subtle)] px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="h-10 w-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[var(--text-primary)] flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-sm shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 stroke-[2.2]" />
          </button>

          <div className="flex-1 text-center px-2">
            <h1 className="text-sm sm:text-base font-mono-luxury font-black tracking-widest text-[var(--text-primary)] uppercase truncate">
              {config.title}
            </h1>
          </div>

          <button
            type="button"
            onClick={toggleGridCols}
            className="h-10 w-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[var(--text-primary)] flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-sm shrink-0"
            aria-label={gridCols === 2 ? 'Switch to 1-column view' : 'Switch to 2-column view'}
          >
            {gridCols === 2 ? (
              <Square className="h-4 w-4 text-[var(--gold-accent)]" />
            ) : (
              <Grid2X2 className="h-4 w-4 text-[var(--gold-accent)]" />
            )}
          </button>
        </header>

        {/* Mobile Product Feed */}
        <main className="max-w-7xl mx-auto px-2 sm:px-3 pt-2.5 pb-8">
          {categoryProducts.length === 0 ? (
            <div className="py-24 text-center space-y-3 px-4">
              <p className="text-base font-editorial font-bold text-[var(--text-primary)]">
                No pieces found in {config.title}
              </p>
              <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
                Our ateliers and boutique partners are curating new drops for this department.
              </p>
              <button
                type="button"
                onClick={handleBack}
                className="mt-3 px-6 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold shadow-md cursor-pointer"
              >
                Return to Feed
              </button>
            </div>
          ) : (
            <div className={gridCols === 1 ? "grid grid-cols-1 gap-y-8" : "grid grid-cols-2 gap-x-2 gap-y-6 sm:gap-x-3 sm:gap-y-8"}>
              {categoryProducts.map((product, idx) => {
                const saved = isInVault(product.id);
                const isSellingFast = idx % 3 === 1;
                const origPrice = product.originalPrice;
                const hasDiscount = typeof origPrice === 'number' && origPrice > product.price;
                const discountPercent = (hasDiscount && origPrice)
                  ? Math.round((1 - (product.price / origPrice)) * 100)
                  : 0;

                return (
                  <div key={product.id} className={`flex flex-col justify-between h-full group ${gridCols === 1 ? 'pb-3 border-b border-[var(--border-subtle)]/50' : ''}`}>
                    <div>
                      <MobileProductSlider
                        product={product}
                        priority={idx < 4}
                        aspectRatioClass={gridCols === 1 ? 'aspect-[3/4]' : 'aspect-[3/4]'}
                        idx={idx}
                      >
                        {hasDiscount && discountPercent > 0 && (
                          <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
                            <span className="px-1.5 py-0.5 rounded bg-white text-rose-600 text-[10px] font-mono-luxury font-bold tracking-tight shadow-sm">
                              -{discountPercent}%
                            </span>
                          </div>
                        )}

                        {isSellingFast && (
                          <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none">
                            <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-white text-[9px] font-mono-luxury uppercase font-bold tracking-wider shadow-sm">
                              Selling Fast
                            </span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHeartClick(product, e);
                          }}
                          className="absolute bottom-2.5 right-2.5 h-8 w-8 rounded-full bg-white text-black shadow-md flex items-center justify-center transition-transform active:scale-75 cursor-pointer z-20"
                          aria-label="Wishlist"
                        >
                          {burstingHearts.has(product.id) && (
                            <span
                              className="absolute inset-0 flex items-center justify-center pointer-events-none"
                              style={{ animation: 'heartBurst 0.6s ease-out forwards' }}
                            >
                              <Heart className="h-5 w-5 fill-rose-500 text-rose-500 opacity-90" />
                            </span>
                          )}
                          <Heart
                            className={`h-4 w-4 transition-colors ${
                              saved ? 'fill-rose-500 stroke-rose-500 text-rose-500' : 'stroke-black fill-transparent text-black'
                            }`}
                          />
                        </button>
                      </MobileProductSlider>

                      <div className="pt-2 px-0.5 space-y-0.5">
                        <div className="flex items-baseline gap-1.5 pt-0.5 flex-wrap">
                          <span className={`font-mono-luxury ${gridCols === 1 ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'} font-black text-[var(--gold-accent)] tracking-tight`}>
                            ₦{Number(product.price || 0).toLocaleString()}
                          </span>
                          {hasDiscount && origPrice && (
                            <span className="text-[11px] text-[var(--text-secondary)] line-through font-mono-luxury">
                              ₦{Number(origPrice).toLocaleString()}
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-[var(--text-secondary)] uppercase font-mono-luxury font-bold tracking-wider truncate pt-0.5">
                          {product.vendorName || 'Atelier'}
                        </p>

                        <Link href={`/shop/${product.id}`} className="block">
                          <h3 className={`${gridCols === 1 ? 'text-sm' : 'text-xs'} font-normal text-[var(--text-primary)] leading-snug line-clamp-1 hover:underline`}>
                            {product.name}
                          </h3>
                        </Link>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setQuickBuyProduct(product)}
                      className={`w-full mt-2.5 py-2 px-2.5 rounded-xl surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[var(--text-primary)] ${gridCols === 1 ? 'text-xs py-2.5' : 'text-[10px]'} font-mono-luxury uppercase font-bold tracking-wider hover:bg-[var(--gold-subtle)] active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer`}
                    >
                      <ShoppingBag className="h-3.5 w-3.5 text-[var(--gold-accent)] shrink-0" />
                      <span>Add to Bag</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* ── 2. LUXURY DESKTOP CATEGORY CATALOG (>= md screen sizes) ─────────────── */}
      {/* ========================================================================= */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Desktop Breadcrumbs & Back Navigation */}
        <div className="flex items-center justify-between text-xs font-mono-luxury text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-[var(--text-primary)] transition-colors">Collections</Link>
            <span>/</span>
            <span className="text-[var(--gold-accent)] uppercase font-bold">{config.title}</span>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 hover:text-[var(--gold-accent)] transition-colors text-xs font-mono-luxury uppercase font-bold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Departments</span>
          </Link>
        </div>

        {/* Desktop Category Hero Dossier */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--border-subtle)]">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--badge-bg)] text-[var(--gold-accent)] text-xs font-mono-luxury uppercase tracking-widest font-bold border border-[var(--border-subtle)]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>CURATED WARDROBE OCCASION</span>
              </div>
              <h1 className="font-editorial text-4xl sm:text-5xl font-normal text-[var(--text-primary)] tracking-tight">
                {config.title}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                {config.subtitle} — Verified Nigerian tailored garments available for immediate nationwide dispatch.
              </p>
            </div>

            <div className="p-4 rounded-2xl surface-card border border-[var(--border-subtle)] text-right shrink-0">
              <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] block">Available Pieces</span>
              <strong className="font-editorial text-2xl font-bold text-[var(--gold-accent)]">
                {categoryProducts.length} {categoryProducts.length === 1 ? 'Design' : 'Designs'}
              </strong>
            </div>
          </div>

          {/* Quick Department Switcher Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Link
              href="/shop"
              className="px-4 py-2 rounded-full text-xs font-mono-luxury uppercase tracking-wider font-semibold whitespace-nowrap surface-card text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-all"
            >
              All Drops
            </Link>
            {ALL_CATEGORY_LINKS.map((cat) => {
              const isActive = cat.slug === slug;
              return (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className={`px-4 py-2 rounded-full text-xs font-mono-luxury uppercase tracking-wider font-semibold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)] shadow-md'
                      : 'surface-card text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]'
                  }`}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* 4-Column Desktop Garments Grid */}
        {categoryProducts.length === 0 ? (
          <div className="p-16 rounded-3xl surface-card border border-[var(--border-subtle)] text-center space-y-6 max-w-xl mx-auto shadow-xl">
            <div className="relative h-20 w-20 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] flex items-center justify-center mx-auto shadow-inner">
              <PackageSearch className="h-10 w-10 text-[var(--gold-accent)]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-editorial text-3xl font-bold text-[var(--text-primary)]">
                No Garments Found in {config.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                Our partner ateliers are currently crafting new drops for this category. Check our full catalog in the meantime.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold hover:opacity-90 transition-all shadow-md"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Browse All Departments</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categoryProducts.map((product) => {
              const isSaved = isInVault(product.id);
              const fitResult = calculateFitMatch(bodyProfile, product);

              return (
                <div
                  key={`desktop-${product.id}`}
                  className="group relative rounded-3xl surface-card overflow-hidden flex flex-col justify-between hover:shadow-2xl transition-all duration-500 border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/50"
                >
                  {/* Image Container with Quick Look Click */}
                  <div
                    onClick={() => setQuickLookProduct(product)}
                    className="relative h-80 w-full bg-[var(--bg-secondary)] overflow-hidden block cursor-pointer"
                  >
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      unoptimized
                      className="object-cover transition-all duration-700 brightness-95 group-hover:brightness-100 group-hover:scale-105"
                    />

                    {/* Top Left: Atelier Attribution */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono-luxury uppercase tracking-wider text-white border border-white/10 font-bold shadow-md">
                        {product.vendorName}
                      </span>
                    </div>

                    {/* Top Right: Wishlist Bookmark */}
                    <div className="absolute top-4 right-4 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVaultItem(product);
                        }}
                        className={`p-2.5 rounded-full backdrop-blur-md border transition-all ${
                          isSaved
                            ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)] shadow-md scale-105'
                            : 'bg-black/60 text-white/80 border-white/10 hover:text-white hover:bg-black/85'
                        }`}
                        title={isSaved ? 'In Curated Vault' : 'Curate to Wardrobe Vault'}
                      >
                        <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Quick View Center Overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="px-4 py-2 rounded-full bg-black/90 backdrop-blur-md text-white text-xs font-mono-luxury uppercase tracking-wider font-bold border border-white/20 shadow-xl flex items-center gap-2">
                        <Eye className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                        <span>Quick View</span>
                      </span>
                    </div>

                    {/* Stock Pill at Bottom */}
                    <div className="absolute bottom-4 left-4 right-4 p-2 rounded-2xl bg-black/85 backdrop-blur-md border border-white/10 flex items-center justify-between z-10 shadow-md">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="text-[10px] font-mono-luxury text-emerald-400 font-bold uppercase tracking-wider">
                          In Stock · Express
                        </span>
                      </div>
                      <span className="text-[10px] font-mono-luxury text-white font-bold bg-white/10 px-2 py-0.5 rounded-md border border-white/15">
                        {(product.sizes || ['S', 'M', 'L']).slice(0, 3).join(' · ')}
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-1">
                        <span className="text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold tracking-wider truncate">
                          {product.vendorName}
                        </span>
                        <span className="text-[10px] font-mono-luxury text-emerald-400 font-bold">
                          {fitResult.matchScore}% Match
                        </span>
                      </div>

                      <Link href={`/shop/${product.id}`} className="hover:text-[var(--gold-accent)] transition-colors block">
                        <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)] leading-snug line-clamp-1">
                          {product.name}
                        </h3>
                      </Link>

                      <div className="flex items-baseline gap-2 pt-2">
                        <span className="font-editorial text-2xl font-bold text-amber-600 dark:text-[var(--gold-accent)]">
                          ₦{Number(product.price).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => addToCart(product, product.sizes?.[0] || 'M')}
                        className="flex-1 py-2.5 px-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Add to Bag</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOutfitItem(product);
                          router.push('/studio');
                        }}
                        className="p-2.5 rounded-full surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[var(--text-secondary)] hover:text-[var(--gold-accent)] transition-all"
                        title="Style in Studio"
                      >
                        <Scissors className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── 3. MODALS & DRAWERS ──────────────────────────────────────────────── */}
      {quickBuyProduct && (
        <MobileQuickBuyDrawer
          product={quickBuyProduct}
          onClose={() => setQuickBuyProduct(null)}
        />
      )}

      {quickLookProduct && (
        <ProductQuickLookModal
          product={quickLookProduct}
          onClose={() => setQuickLookProduct(null)}
        />
      )}

    </div>
  );
}
