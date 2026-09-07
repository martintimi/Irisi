'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { GarmentCategory } from '@/types';
import {
  Heart, SlidersHorizontal, X, Search, ShoppingBag,
  ChevronLeft, ChevronRight, Grid2X2, Square, RotateCcw, Video
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import MobileQuickBuyDrawer from '@/components/mobile/MobileQuickBuyDrawer';
import MobileStoriesRow from '@/components/mobile/MobileStoriesRow';
import MobileProductSlider from '@/components/shop/MobileProductSlider';

const ITEMS_PER_PAGE = 8;

const categoryMeta: Record<string, { label: string; desc: string }> = {
  tops: { label: 'Shirts & Tops', desc: 'Boutique shirts, tees, Senator sets, and kaftans' },
  outerwear: { label: 'Streetwear & Hoodies', desc: 'Heavyweight hoodies, jackets, and urban drops' },
  footwear: { label: 'Footwear & Shoes', desc: 'Handcrafted leather shoes, slides, mules, and sneakers' },
  bottoms: { label: 'Trousers & Denim', desc: 'Baggy denim, cargo pants, and boutique trousers' },
  accessories: { label: 'Bags & Jewelry', desc: 'Luxury totes, Cuban links, rings, and leather bags' },
};

export default function MobileShopView() {
  const {
    allProducts,
    isProductsLoading,
    toggleVaultItem,
    isInVault,
    fetchProductsFromDb,
    addToCart,
  } = useStore();

  const searchParams = useSearchParams();
  const router = useRouter();

  const [genderFilter, setGenderFilter] = useState<'male' | 'female'>('male');
  const [selectedCategory, setSelectedCategory] = useState<GarmentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isRefineOpen, setIsRefineOpen] = useState(false);
  const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);
  const [burstingHearts, setBurstingHearts] = useState<Set<string>>(new Set());

  // Feature B: 1-Col vs 2-Col Grid Toggle
  const [gridCols, setGridCols] = useState<1 | 2>(2);

  // Feature 7: Price Range and Sorting Filters
  const [priceRange, setPriceRange] = useState<'all' | 'under25k' | '25k-50k' | '50k-100k' | 'over100k'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');

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

  const handleHeartClick = (product: any) => {
    toggleVaultItem(product);
    // Trigger burst animation
    setBurstingHearts((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setBurstingHearts((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 700);
  };

  useEffect(() => {
    fetchProductsFromDb();
  }, [fetchProductsFromDb]);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && ['tops', 'bottoms', 'outerwear', 'footwear', 'accessories'].includes(cat)) {
      setSelectedCategory(cat as GarmentCategory);
      setCurrentPage(1);
    } else if (cat === 'all') {
      setSelectedCategory('all');
    }
    const gen = searchParams.get('gender');
    if (gen && ['male', 'female'].includes(gen)) {
      setGenderFilter(gen as 'male' | 'female');
      setCurrentPage(1);
    }
  }, [searchParams]);

  const categories: { id: GarmentCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Items' },
    { id: 'tops', label: 'Shirts & Natives' },
    { id: 'outerwear', label: 'Streetwear Drops' },
    { id: 'bottoms', label: 'Trousers & Denim' },
    { id: 'footwear', label: 'Footwear & Shoes' },
    { id: 'accessories', label: 'Bags & Jewelry' },
  ];

  const filteredProducts = useMemo(() => {
    let list = Array.isArray(allProducts) ? [...allProducts] : [];

    // Filter strictly by gender: only selected gender or unisex (never show both male and female together)
    list = list.filter((p) => {
      const pGender = (p.genderTarget || '').toLowerCase();
      const matchesGender = pGender === genderFilter || pGender === 'unisex';
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.tags || []).some(t => (t || '').toLowerCase().includes(q));

      // Price Range Filter
      let matchesPrice = true;
      const price = Number(p.price || 0);
      if (priceRange === 'under25k') matchesPrice = price < 25000;
      else if (priceRange === '25k-50k') matchesPrice = price >= 25000 && price <= 50000;
      else if (priceRange === '50k-100k') matchesPrice = price > 50000 && price <= 100000;
      else if (priceRange === 'over100k') matchesPrice = price > 100000;

      return matchesGender && matchesCat && matchesQuery && matchesPrice;
    });

    // Sort
    if (sortBy === 'price-asc') {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === 'newest') {
      list.reverse();
    }

    return list;
  }, [allProducts, genderFilter, selectedCategory, searchQuery, priceRange, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleGenderChange = (g: 'male' | 'female') => {
    setGenderFilter(g);
    setCurrentPage(1);
    router.replace(`/shop?gender=${g}${selectedCategory !== 'all' ? `&category=${selectedCategory}` : ''}`);
  };

  const handleCategoryChange = (catId: GarmentCategory | 'all') => {
    setSelectedCategory(catId);
    setCurrentPage(1);
    if (catId === 'all') {
      router.replace(`/shop?gender=${genderFilter}`);
    } else {
      router.replace(`/shop?category=${catId}&gender=${genderFilter}`);
    }
  };

  return (
    <div className="md:hidden pb-28 bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen">

      {/* STORIES ROW */}
      <div className="pt-4 pb-3 border-b border-[var(--border-subtle)]">
        <MobileStoriesRow />
      </div>

      {/* HEADER ROW: title + refine */}
      <div className="px-4 pt-4 pb-2">
        {selectedCategory !== 'all' && (
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleCategoryChange('all')}
              className="inline-flex items-center gap-1 text-[11px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold hover:underline cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>All Departments</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategoryChange('all')}
              className="text-[10px] font-mono-luxury uppercase text-[var(--text-secondary)] hover:text-rose-400 font-bold px-2 py-0.5 rounded-full border border-[var(--border-subtle)]"
            >
              ✕ Clear Filter
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="font-editorial text-2xl font-bold text-[var(--text-primary)] leading-tight">
              {selectedCategory !== 'all'
                ? categoryMeta[selectedCategory]?.label || 'Category Drops'
                : genderFilter === 'male'
                ? "Men's Drops"
                : "Women's Drops"}
            </h1>
            <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)] mt-0.5">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'} {selectedCategory !== 'all' ? `in ${categoryMeta[selectedCategory]?.label || selectedCategory}` : 'curated across Nigeria'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* 1-Col vs 2-Col Grid View Toggle (Feature B) */}
            <button
              type="button"
              onClick={toggleGridCols}
              className="flex items-center gap-1.5 px-3 py-2 border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-mono-luxury font-bold rounded-lg cursor-pointer hover:border-[var(--gold-accent)] transition-all bg-[var(--bg-secondary)] active:scale-95"
              aria-label={gridCols === 2 ? 'Switch to 1-column view' : 'Switch to 2-column view'}
            >
              {gridCols === 2 ? (
                <>
                  <Square className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                  <span className="text-[10px]">1-Col</span>
                </>
              ) : (
                <>
                  <Grid2X2 className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                  <span className="text-[10px]">2-Col</span>
                </>
              )}
            </button>

            {/* Refine / Filters Button (Feature 7) */}
            <button
              type="button"
              onClick={() => setIsRefineOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-lg text-xs font-mono-luxury font-bold cursor-pointer transition-all active:scale-95 ${
                priceRange !== 'all' || sortBy !== 'featured'
                  ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)] shadow-md'
                  : 'border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--gold-accent)] bg-[var(--bg-secondary)]'
              }`}
            >
              <span>Refine</span>
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* GENDER TABS (ONLY MEN AND WOMEN) */}
      <div className="px-4 flex items-center gap-6 border-b border-[var(--border-subtle)] pb-0">
        {[
          { id: 'male', label: 'Men' },
          { id: 'female', label: 'Women' },
        ].map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => handleGenderChange(g.id as 'male' | 'female')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              genderFilter === g.id
                ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* CATEGORY PILLS */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleCategoryChange(cat.id)}
            className={`whitespace-nowrap px-3 py-1.5 text-xs border rounded-full transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)]'
                : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ITEM COUNT */}
      <div className="px-4 pb-3 flex items-center justify-between text-xs text-[var(--text-secondary)]">
        {isProductsLoading && (!allProducts || allProducts.length === 0) ? (
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--gold-accent)] font-mono-luxury font-bold animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold-accent)] animate-ping" />
            <span>Loading pieces...</span>
          </span>
        ) : (
          <span>{filteredProducts.length} items</span>
        )}
        {totalPages > 1 && !(isProductsLoading && (!allProducts || allProducts.length === 0)) && (
          <span className="font-mono-luxury text-[11px]">Page {currentPage} of {totalPages}</span>
        )}
      </div>

      {/* PRODUCT GRID */}
      {isProductsLoading && (!allProducts || allProducts.length === 0) ? (
        <div className="grid grid-cols-2 px-2 gap-x-2.5 gap-y-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col justify-between h-full space-y-2 animate-pulse">
              <div className="relative aspect-[3/4] w-full bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
              </div>
              <div className="space-y-1 px-0.5">
                <div className="h-3.5 w-4/5 bg-[var(--bg-secondary)] rounded-md" />
                <div className="h-3 w-1/3 bg-[var(--bg-secondary)] rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="px-6 py-15 flex flex-col items-center text-center gap-4 animate-fadeIn">
          {/* Minimal icon */}
          <div className="h-16 w-16 rounded-full border-2 border-dashed border-[var(--border-subtle)] flex items-center justify-center">
            <span className="text-2xl opacity-30">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)]"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </span>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">Nothing here yet</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-[220px]">
              No pieces match your current selection. Try a different category or department.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setGenderFilter('male'); setSelectedCategory('all'); setSearchQuery(''); setCurrentPage(1); }}
            className="mt-1 px-6 py-2.5 border border-[var(--text-primary)] text-[var(--text-primary)] text-xs font-medium rounded-sm hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className={gridCols === 1 ? "grid grid-cols-1 px-3 gap-y-8" : "grid grid-cols-2 px-2 gap-x-2.5 gap-y-6"}>
            {paginatedProducts.map((product, idx) => {
              const saved = isInVault(product.id);
              const origPrice = product.originalPrice;
              const hasDiscount = typeof origPrice === 'number' && origPrice > product.price;
              const discountPercent = (hasDiscount && origPrice)
                ? Math.round((1 - (product.price / origPrice)) * 100)
                : 0;

              return (
                <div key={product.id} className={`flex flex-col justify-between h-full group ${gridCols === 1 ? 'pb-2 border-b border-[var(--border-subtle)]/50' : ''}`}>
                  <div>
                    {/* ASOS Swipeable Image Slider with Auto-Peek Animation & Dots */}
                    <MobileProductSlider
                      product={product}
                      priority={idx < 4}
                      aspectRatioClass={gridCols === 1 ? 'aspect-[3/4]' : 'aspect-[3/4]'}
                      idx={idx}
                    >
                      {/* Top-Left: Sold Out Badge or Discount Badge */}
                      {product.stockQuantity === 0 ? (
                        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
                          <span className="px-2 py-0.5 rounded-full bg-rose-600/95 backdrop-blur-sm text-white text-[9px] font-mono-luxury font-bold uppercase tracking-wider shadow-md">
                            Sold Out
                          </span>
                        </div>
                      ) : (product.stockQuantity !== undefined && product.stockQuantity <= 3) ? (
                        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
                          <span className="px-2 py-0.5 rounded-full bg-amber-600/95 backdrop-blur-sm text-white text-[9px] font-mono-luxury font-bold uppercase tracking-wider shadow-md animate-pulse">
                            Only {product.stockQuantity} Left
                          </span>
                        </div>
                      ) : hasDiscount && discountPercent > 0 ? (
                        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
                          <span className="px-1.5 py-0.5 rounded bg-white text-rose-600 text-[10px] font-mono-luxury font-bold tracking-tight shadow-sm">
                            -{discountPercent}%
                          </span>
                        </div>
                      ) : null}

                      {/* Wishlist heart — Instagram burst animation */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHeartClick(product);
                        }}
                        className={`absolute top-2 right-2 p-1.5 cursor-pointer z-20 ${gridCols === 1 ? 'h-9 w-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center' : ''}`}
                        aria-label="Save"
                      >
                        {burstingHearts.has(product.id) && (
                          <span
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            style={{ animation: 'heartBurst 0.6s ease-out forwards' }}
                          >
                            <Heart className="h-8 w-8 fill-red-500 text-red-500 opacity-80" />
                          </span>
                        )}
                        <Heart
                          className={`h-5 w-5 transition-all duration-200 ${
                            saved ? 'fill-red-500 stroke-red-500' : 'stroke-white fill-black/30'
                          } ${burstingHearts.has(product.id) ? 'scale-125' : 'scale-100'}`}
                          strokeWidth={1.5}
                          style={{
                            filter: saved ? 'drop-shadow(0 0 4px rgba(239,68,68,0.6))' : undefined,
                            transition: 'transform 0.2s cubic-bezier(0.36,0.07,0.19,0.97)',
                          }}
                        />
                      </button>
                    </MobileProductSlider>

                    {/* Info */}
                    <div className="pt-2.5 px-0.5 space-y-1">
                      {/* Vendor Name */}
                      <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider line-clamp-1 font-mono-luxury">
                        {product.vendorName || 'Atelier'}
                      </p>

                      {/* Product Name */}
                      <Link href={`/shop/${product.id}`} className="block">
                        <h3 className={`${gridCols === 1 ? 'text-sm' : 'text-xs'} font-semibold text-[var(--text-primary)] leading-snug line-clamp-1 hover:underline`}>
                          {product.name}
                        </h3>
                      </Link>

                      {/* Prominent High-Legibility Gold Price */}
                      <div className="pt-1 flex items-baseline gap-2">
                        <span className={`font-mono-luxury ${gridCols === 1 ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'} font-black text-[var(--gold-accent)] tracking-tight`}>
                          ₦{Number(product.price || 0).toLocaleString()}
                        </span>
                        {hasDiscount && origPrice && (
                          <span className="text-[11px] text-[var(--text-secondary)] line-through font-mono-luxury">
                            ₦{Number(origPrice).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Single Clean Add to Bag Button */}
                  <button
                    type="button"
                    onClick={() => product.stockQuantity === 0 ? null : setQuickBuyProduct(product)}
                    disabled={product.stockQuantity === 0}
                    className={`w-full mt-2.5 py-2 px-2.5 rounded-xl border ${product.stockQuantity === 0 ? 'border-rose-500/30 bg-rose-500/10 text-rose-400 opacity-60 cursor-not-allowed' : 'surface-card border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[var(--text-primary)] hover:bg-[var(--gold-subtle)] cursor-pointer active:scale-95'} ${gridCols === 1 ? 'text-xs py-2.5' : 'text-[11px]'} font-mono-luxury uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm`}
                  >
                    <ShoppingBag className={`h-3.5 w-3.5 ${product.stockQuantity === 0 ? 'text-rose-400' : 'text-[var(--gold-accent)]'} shrink-0`} />
                    <span>{product.stockQuantity === 0 ? 'Sold Out' : 'Add to Bag'}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* MOBILE PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8 pb-4">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-2.5 rounded-xl surface-card border border-[var(--border-subtle)] text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-all cursor-pointer"
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => {
                      setCurrentPage(pageNum);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`h-8 min-w-[32px] px-2 rounded-xl text-xs font-mono-luxury font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-[var(--gold-accent)] text-black shadow-md'
                        : 'surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-2.5 rounded-xl surface-card border border-[var(--border-subtle)] text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-all cursor-pointer"
                aria-label="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* REFINE BOTTOM SHEET (Feature 7) */}
      {isRefineOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            onClick={() => setIsRefineOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />
          <div className="relative bg-[var(--bg-primary)] rounded-t-3xl pt-5 pb-8 px-5 space-y-6 z-10 max-h-[85vh] overflow-y-auto border-t border-[var(--border-subtle)] shadow-2xl">
            {/* Grab handle */}
            <div className="w-12 h-1.5 rounded-full bg-[var(--border-subtle)] mx-auto mb-2" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">Refine & Sort</h3>
                <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)] mt-0.5">
                  Showing {filteredProducts.length} curated pieces
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRefineOpen(false)}
                className="p-2 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by designer, style, or tag..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] bg-[var(--bg-secondary)] focus:outline-none focus:border-[var(--gold-accent)] transition-colors placeholder:text-[var(--text-secondary)] font-mono-luxury"
              />
            </div>

            {/* Sort By */}
            <div className="space-y-2.5">
              <p className="text-xs font-mono-luxury font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Sort By
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'featured', label: 'Featured Drops' },
                  { id: 'newest', label: 'Newest Arrivals' },
                  { id: 'price-asc', label: 'Price: Low to High' },
                  { id: 'price-desc', label: 'Price: High to Low' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSortBy(s.id as any);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-2.5 rounded-xl text-left text-xs font-mono-luxury transition-all cursor-pointer border ${
                      sortBy === s.id
                        ? 'border-[var(--gold-accent)] bg-[var(--gold-subtle)] text-[var(--gold-accent)] font-bold shadow-xs'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)] bg-[var(--bg-secondary)] hover:border-[var(--text-primary)]/40'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2.5">
              <p className="text-xs font-mono-luxury font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Price Range
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Prices' },
                  { id: 'under25k', label: 'Under ₦25k' },
                  { id: '25k-50k', label: '₦25k - ₦50k' },
                  { id: '50k-100k', label: '₦50k - ₦100k' },
                  { id: 'over100k', label: 'Over ₦100k' },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => {
                      setPriceRange(tier.id as any);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-mono-luxury transition-all cursor-pointer border ${
                      priceRange === tier.id
                        ? 'border-[var(--gold-accent)] bg-[var(--gold-subtle)] text-[var(--gold-accent)] font-bold shadow-xs'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)] bg-[var(--bg-secondary)] hover:border-[var(--text-primary)]/40'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <p className="text-xs font-mono-luxury font-bold uppercase tracking-wider text-[var(--text-primary)]">Department</p>
              <div className="grid grid-cols-2 gap-2">
                {[{ id: 'male', label: 'Men' }, { id: 'female', label: 'Women' }].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setGenderFilter(g.id as 'male' | 'female');
                      setCurrentPage(1);
                    }}
                    className={`py-2.5 rounded-xl text-center text-xs font-mono-luxury transition-all cursor-pointer border ${
                      genderFilter === g.id
                        ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold shadow-xs'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)] bg-[var(--bg-secondary)]'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <p className="text-xs font-mono-luxury font-bold uppercase tracking-wider text-[var(--text-primary)]">Category</p>
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setCurrentPage(1);
                    }}
                    className={`text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-[var(--gold-subtle)] font-bold text-[var(--gold-accent)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <span className="font-mono-luxury">{cat.label}</span>
                    {selectedCategory === cat.id && <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold-accent)]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* STICKY BOTTOM ACTIONS: Reset + Live Pieces Counter Button */}
            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setGenderFilter('male');
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setPriceRange('all');
                  setSortBy('featured');
                  setCurrentPage(1);
                }}
                className="px-4 py-3 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono-luxury font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRefineOpen(false)}
                className="flex-1 py-3.5 px-4 rounded-xl bg-[var(--gold-accent)] text-black font-mono-luxury font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View {filteredProducts.length} {filteredProducts.length === 1 ? 'Piece' : 'Pieces'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK BUY DRAWER */}
      {quickBuyProduct && (
        <MobileQuickBuyDrawer
          product={quickBuyProduct}
          onClose={() => setQuickBuyProduct(null)}
        />
      )}
    </div>
  );
}
