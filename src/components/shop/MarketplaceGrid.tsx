'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { GarmentCategory, GarmentOriginType } from '@/types';
import { calculateFitMatch } from '@/lib/utils/sizingEngine';
import {
  Sparkles, Check, ShoppingBag, Search, Scissors, ArrowRight,
  ChevronLeft, ChevronRight, RotateCcw, PackageSearch, Layers,
  Bookmark, Eye, Plus, MapPin, SlidersHorizontal, X, Heart,
  Grid3X3, LayoutGrid, CheckCircle2, ChevronDown
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ProductQuickLookModal from '@/components/shop/ProductQuickLookModal';
import { diversifyCatalog } from '@/lib/utils/catalogShuffle';

import {
  isNativeProduct,
  matchesCategoryFilter,
  matchesSpecificCategory,
  matchesDepartment
} from '@/lib/utils/categoryMatcher';

const ITEMS_PER_PAGE = 24;

const categoryMeta: Record<string, { label: string; desc: string }> = {
  native: { label: 'Native & Cultural', desc: 'Bespoke Senator sets, Grand Agbada, Boubou, Kaftans, and tailored native wear' },
  tops: { label: 'Shirts & Tops', desc: 'Boutique shirts, graphic tees, polos, and blouses' },
  outerwear: { label: 'Streetwear & Hoodies', desc: 'Heavyweight hoodies, jackets, and urban drops' },
  footwear: { label: 'Footwear & Shoes', desc: 'Handcrafted leather shoes, slides, mules, and sneakers' },
  bottoms: { label: 'Trousers & Denim', desc: 'Baggy denim, cargo pants, and boutique trousers' },
  accessories: { label: 'Bags & Jewelry', desc: 'Luxury totes, Cuban links, rings, and leather bags' },
};

const MEN_DESKTOP_CATEGORIES: { id: string; label: string; type: 'cat' | 'sub' }[] = [
  { id: 'all', label: 'All Items & Drops', type: 'cat' },
  { id: 'senator', label: 'Senator & Kaftans', type: 'sub' },
  { id: 'agbada', label: 'Grand Agbada', type: 'sub' },
  { id: 'tshirts', label: 'T-Shirts & Tops', type: 'sub' },
  { id: 'polos', label: 'Luxury Polos', type: 'sub' },
  { id: 'hoodies', label: 'Hoodies & Sweatshirts', type: 'sub' },
  { id: 'jeans', label: 'Jeans & Denim', type: 'sub' },
  { id: 'cargo', label: 'Cargo & Joggers', type: 'sub' },
  { id: 'shorts', label: 'Shorts & Casual', type: 'sub' },
  { id: 'slides', label: 'Slides, Palms & Slippers', type: 'sub' },
  { id: 'sneakers', label: 'Sneakers & Casual Shoes', type: 'sub' },
  { id: 'clogs', label: 'Crocs & Foam Clogs', type: 'sub' },
  { id: 'backpacks', label: 'Backpacks & Bags', type: 'sub' },
  { id: 'crossbody', label: 'Crossbody Bags', type: 'sub' },
  { id: 'chains', label: 'Chains & Jewelry', type: 'sub' },
  { id: 'watches', label: 'Watches', type: 'sub' },
  { id: 'caps', label: 'Caps & Traditional Hats', type: 'sub' },
];

const WOMEN_DESKTOP_CATEGORIES: { id: string; label: string; type: 'cat' | 'sub' }[] = [
  { id: 'all', label: 'All Items & Drops', type: 'cat' },
  { id: 'boubou', label: 'Silk Boubou & Abayas', type: 'sub' },
  { id: 'lace_ankara', label: 'Lace & Ankara', type: 'sub' },
  { id: 'dresses', label: 'Dresses & Maxis', type: 'sub' },
  { id: 'two-piece', label: 'Two-Piece Sets', type: 'sub' },
  { id: 'tops', label: 'Corsets & Tops', type: 'sub' },
  { id: 'women-hoodies', label: 'Hoodies & Sweatshirts', type: 'sub' },
  { id: 'women-jeans', label: 'Jeans & Cargo Pants', type: 'sub' },
  { id: 'skirts', label: 'Skirts & Minis', type: 'sub' },
  { id: 'heels', label: 'Heels, Pumps & Mules', type: 'sub' },
  { id: 'women-slides', label: 'Slides & Flats', type: 'sub' },
  { id: 'clogs', label: 'Crocs & Clogs', type: 'sub' },
  { id: 'handbags', label: 'Handbags & Totes', type: 'sub' },
  { id: 'clutches', label: 'Clutches & Minis', type: 'sub' },
  { id: 'jewelry', label: 'Jewelry & Watches', type: 'sub' },
];

export default function MarketplaceGrid() {
  const {
    bodyProfile,
    activeOutfit,
    setOutfitItem,
    removeOutfitItem,
    addToCart,
    allProducts,
    isProductsLoading,
    selectedGender,
    setSelectedGender,
    selectedOriginType,
    setSelectedOriginType,
    toggleVaultItem,
    isInVault,
    fetchProductsFromDb,
  } = useStore();

  useEffect(() => {
    fetchProductsFromDb();
  }, [fetchProductsFromDb]);

  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<GarmentCategory | 'native' | 'all'>('all');
  const [specificCategory, setSpecificCategory] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<'all' | 'under25k' | '25k-50k' | '50k-100k' | 'over100k'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-asc' | 'price-desc'>('featured');
  const [isRefineOpen, setIsRefineOpen] = useState(false);
  const [gridCols, setGridCols] = useState<3 | 4>(4);
  const [burstingHearts, setBurstingHearts] = useState<Set<string>>(new Set());

  const [currentPage, setCurrentPage] = useState<number>(() => {
    const p = parseInt(searchParams?.get('page') || '1', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const [quickLookProduct, setQuickLookProduct] = useState<any>(null);

  const handleHeartClick = (product: any) => {
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

  useEffect(() => {
    const gen = searchParams.get('gender')?.toLowerCase();
    if (gen === 'male' || gen === 'men') {
      setSelectedGender('male');
      try { localStorage.setItem('irisi_selected_gender', 'male'); } catch (e) {}
    } else if (gen === 'female' || gen === 'women') {
      setSelectedGender('female');
      try { localStorage.setItem('irisi_selected_gender', 'female'); } catch (e) {}
    } else {
      const savedGender = selectedGender || (typeof window !== 'undefined' ? localStorage.getItem('irisi_selected_gender') : null);
      if (String(savedGender || '').toLowerCase() === 'female' || String(savedGender || '').toLowerCase() === 'women') {
        setSelectedGender('female');
      }
    }

    const pageParam = parseInt(searchParams.get('page') || '', 10);
    if (!isNaN(pageParam) && pageParam >= 1) {
      setCurrentPage(pageParam);
    }

    const dept = searchParams.get('department') || searchParams.get('dept');
    if (dept) {
      setDepartmentFilter(dept.toLowerCase());
    } else {
      setDepartmentFilter(null);
    }

    const occ = searchParams.get('occasion');
    if (occ) {
      setSearchQuery(occ);
    }

    const cat = searchParams.get('category')?.toLowerCase();
    if (cat && ['tops', 'bottoms', 'outerwear', 'footwear', 'accessories', 'native'].includes(cat)) {
      setSelectedCategory(cat as any);
      setSpecificCategory(null);
    } else if (cat === 'all') {
      setSelectedCategory('all');
      setSpecificCategory(null);
    } else if (cat) {
      setSelectedCategory('all');
      setSpecificCategory(cat);
    } else {
      setSpecificCategory(null);
    }
  }, [searchParams, selectedGender, setSelectedGender]);

  const updateQueryParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    });
    router.replace(`/shop?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (pageNum: number) => {
    setCurrentPage(pageNum);
    updateQueryParams({ page: pageNum > 1 ? String(pageNum) : null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categories = selectedGender === 'female' ? WOMEN_DESKTOP_CATEGORIES : MEN_DESKTOP_CATEGORIES;

  const brandOptions = useMemo(() => {
    const brandsMap = new Map<string, { id: string; name: string; count: number }>();
    brandsMap.set('all', { id: 'all', name: 'All Brands & Designers', count: allProducts.length });
    
    allProducts.forEach(p => {
      const vId = p.vendorId || 'boutique';
      const vName = p.vendorName || (vId.charAt(0).toUpperCase() + vId.slice(1).replace(/-/g, ' '));
      if (!brandsMap.has(vId)) {
        brandsMap.set(vId, { id: vId, name: vName, count: 0 });
      }
      brandsMap.get(vId)!.count += 1;
    });

    return Array.from(brandsMap.values());
  }, [allProducts]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (specificCategory !== null) count++;
    if (departmentFilter !== null) count++;
    if (priceRange !== 'all') count++;
    if (selectedBrand !== 'all') count++;
    if (selectedOriginType !== 'all') count++;
    if (searchQuery.trim().length > 0) count++;
    if (sortBy !== 'featured') count++;
    return count;
  }, [selectedCategory, specificCategory, departmentFilter, priceRange, selectedBrand, selectedOriginType, searchQuery, sortBy]);

  const filteredProducts = useMemo(() => {
    let list = allProducts.filter((p) => {
      const pGender = String(p.genderTarget || '').toLowerCase();
      const sGender = String(selectedGender || '').toLowerCase();
      const matchesGender = 
        pGender === 'unisex' ||
        pGender === sGender ||
        (sGender === 'male' && (pGender === 'male' || pGender === 'men' || pGender === 'man')) ||
        (sGender === 'female' && (pGender === 'female' || pGender === 'women' || pGender === 'woman'));

      const pOrigin = String(p.garmentOriginType || '').toLowerCase();
      const sOrigin = String(selectedOriginType || '').toLowerCase();
      const matchesOrigin = 
        sOrigin === 'all' || 
        (sOrigin === 'handmade_designer' && (pOrigin === 'handmade_designer' || pOrigin === 'bespoke_atelier')) ||
        (sOrigin === 'ready_made_boutique' && pOrigin === 'ready_made_boutique') ||
        pOrigin === sOrigin;

      const matchesCat = matchesCategoryFilter(p, selectedCategory);

      // Specific subcategory filter
      const matchesSpecific = specificCategory ? matchesSpecificCategory(p, specificCategory) : true;

      // Department filter
      const matchesDept = departmentFilter ? matchesDepartment(p, departmentFilter) : true;

      const pVendorName = String(p.vendorName || '').toLowerCase();
      const pVendorId = String(p.vendorId || '').toLowerCase();
      const sBrand = String(selectedBrand || '').toLowerCase();
      const matchesBrand = sBrand === 'all' || pVendorId === sBrand || pVendorName.includes(sBrand);

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
                           String(p.name || '').toLowerCase().includes(q) ||
                           String(p.description || '').toLowerCase().includes(q) ||
                           (Array.isArray(p.tags) && p.tags.some(t => String(t).toLowerCase().includes(q)));

      // Price Range Filter
      let matchesPrice = true;
      const price = Number(p.price || 0);
      if (priceRange === 'under25k') matchesPrice = price < 25000;
      else if (priceRange === '25k-50k') matchesPrice = price >= 25000 && price <= 50000;
      else if (priceRange === '50k-100k') matchesPrice = price > 50000 && price <= 100000;
      else if (priceRange === 'over100k') matchesPrice = price > 100000;

      return matchesGender && matchesOrigin && matchesCat && matchesSpecific && matchesDept && matchesBrand && matchesQuery && matchesPrice;
    });

    // Sorting
    if (sortBy === 'price-asc') {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === 'newest') {
      list.sort((a, b) => {
        const tA = new Date((a as any).created_at || (a as any).createdAt || 0).getTime();
        const tB = new Date((b as any).created_at || (b as any).createdAt || 0).getTime();
        return tB - tA;
      });
    } else if (sortBy === 'featured') {
      list = diversifyCatalog(list);
    }

    return list;
  }, [allProducts, selectedGender, selectedOriginType, selectedCategory, specificCategory, departmentFilter, selectedBrand, searchQuery, priceRange, sortBy]);

  // Reset page when filters change
  const handleBrandChange = (brandId: string) => {
    setSelectedBrand(brandId);
    setCurrentPage(1);
  };

  const handleCategoryItemClick = (cat: { id: string; label: string; type: 'cat' | 'sub' }) => {
    setCurrentPage(1);
    if (cat.id === 'all') {
      setSelectedCategory('all');
      setSpecificCategory(null);
      setDepartmentFilter(null);
      router.replace(`/shop?gender=${selectedGender === 'male' ? 'men' : 'women'}&page=1`);
    } else if (cat.type === 'cat') {
      setSelectedCategory(cat.id as any);
      setSpecificCategory(null);
      setDepartmentFilter(null);
      router.replace(`/shop?category=${cat.id}&gender=${selectedGender === 'male' ? 'men' : 'women'}&page=1`);
    } else {
      setSelectedCategory('all');
      setSpecificCategory(cat.id);
      setDepartmentFilter(null);
      router.replace(`/shop?category=${cat.id}&gender=${selectedGender === 'male' ? 'men' : 'women'}&page=1`);
    }
  };

  const handleGenderChange = (g: 'male' | 'female') => {
    setSelectedGender(g);
    try { localStorage.setItem('irisi_selected_gender', g); } catch (e) {}
    setSelectedCategory('all');
    setSpecificCategory(null);
    setDepartmentFilter(null);
    setCurrentPage(1);
    router.replace(`/shop?gender=${g === 'male' ? 'men' : 'women'}&page=1`);
  };

  const handleResetFilters = () => {
    setSelectedBrand('all');
    setSelectedCategory('all');
    setSpecificCategory(null);
    setDepartmentFilter(null);
    setSelectedOriginType('all');
    setPriceRange('all');
    setSortBy('featured');
    setSearchQuery('');
    setCurrentPage(1);
    router.replace(`/shop?gender=${selectedGender === 'male' ? 'men' : 'women'}&page=1`);
  };

  // Pagination math
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      
      {/* ======================================================== */}
      {/* 1. UNIFIED WELCOME CARD WITH EMBEDDED BRAND FILTERS */}
      {/* ======================================================== */}
      <div className="relative rounded-2xl sm:rounded-3xl surface-card p-5 sm:p-10 overflow-hidden shadow-xl border border-[var(--border-subtle)]">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--gold-subtle)]/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-5 sm:space-y-6">
          
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--badge-bg)] border border-[var(--border-subtle)] text-[var(--gold-accent)] text-[10px] sm:text-xs font-mono-luxury uppercase tracking-widest font-bold">
              <Sparkles className="h-3 w-3" />
              <span>NIGERIAN APPAREL CATALOG</span>
            </div>

            <h1 className="font-editorial text-2xl sm:text-5xl text-[var(--text-primary)] leading-tight font-normal">
              Curated Fashion, Footwear & Accessories
            </h1>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed max-w-2xl">
              Curated Nigerian boutiques, ready-to-wear fashion, handcrafted footwear, luxury bags, fine jewelry, and streetwear drops with nationwide escrow delivery.
            </p>
          </div>

          {/* Action Row: Virtual Dressing Room + Integrated Brand Filter Pills */}
          <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Left Button: Explore Categories Directory */}
            <Link
              href="/categories"
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase tracking-widest text-xs font-bold hover:opacity-90 transition-all shadow-md shrink-0"
            >
              <Sparkles className="h-4 w-4 text-[var(--gold-accent)]" />
              <span>Explore All Categories</span>
            </Link>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DEDICATED LUXURY SEARCH BAR */}
      {/* ======================================================== */}
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative flex items-center">
          <Search className="absolute left-[22px] top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search products, brands, luxury drops..."
            className="w-full pl-[50px] pr-12 py-3.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/50 focus:border-[var(--gold-accent)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] shadow-xs focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-4.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--badge-bg)] transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. REFINED CONTROLS & FILTER TOOLBAR */}
      {/* ======================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl surface-card border border-[var(--border-subtle)] shadow-xs">
        
        {/* Left Side: Gender + Origin Switchers */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Gender Switcher */}
          <div className="flex items-center p-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] shadow-xs">
            <button
              type="button"
              onClick={() => handleGenderChange('male')}
              className={`px-4 py-1.5 rounded-full text-xs font-mono-luxury uppercase transition-all cursor-pointer ${
                selectedGender === 'male'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Men&apos;s
            </button>
            <button
              type="button"
              onClick={() => handleGenderChange('female')}
              className={`px-4 py-1.5 rounded-full text-xs font-mono-luxury uppercase transition-all cursor-pointer ${
                selectedGender === 'female'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Women&apos;s
            </button>
          </div>

          {/* Origin Switcher */}
          <div className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[11px] font-mono-luxury uppercase shadow-xs">
            <button
              type="button"
              onClick={() => {
                setSelectedOriginType('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                selectedOriginType === 'all'
                  ? 'bg-[var(--badge-bg)] text-[var(--text-primary)] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedOriginType('handmade_designer');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                selectedOriginType === 'handmade_designer'
                  ? 'bg-[var(--gold-subtle)] text-[var(--gold-accent)] font-bold border border-[var(--gold-accent)]/20'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Scissors className="h-3 w-3" />
              <span>Handmade</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedOriginType('ready_made_boutique');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                selectedOriginType === 'ready_made_boutique'
                  ? 'bg-[var(--badge-bg)] text-[var(--text-primary)] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Ready-Made
            </button>
          </div>
        </div>

        {/* Right Side: Quick Sort, Quick Price, Refine Modal Trigger, and Grid Density */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Quick Sort Select */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
              className="appearance-none pl-3.5 pr-8 py-2 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-xs font-mono-luxury font-bold text-[var(--text-primary)] cursor-pointer focus:outline-none transition-all shadow-xs"
            >
              <option value="featured">Sort: Featured Drops</option>
              <option value="newest">Sort: Newest Arrivals</option>
              <option value="price-asc">Sort: Price Low to High</option>
              <option value="price-desc">Sort: Price High to Low</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
          </div>

          {/* Quick Price Select */}
          <div className="relative">
            <select
              value={priceRange}
              onChange={(e) => {
                setPriceRange(e.target.value as any);
                setCurrentPage(1);
              }}
              className="appearance-none pl-3.5 pr-8 py-2 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-xs font-mono-luxury font-bold text-[var(--text-primary)] cursor-pointer focus:outline-none transition-all shadow-xs"
            >
              <option value="all">Price: All</option>
              <option value="under25k">Under ₦25k</option>
              <option value="25k-50k">₦25k - ₦50k</option>
              <option value="50k-100k">₦50k - ₦100k</option>
              <option value="over100k">Over ₦100k</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
          </div>

          {/* Refine / All Filters Button */}
          <button
            type="button"
            onClick={() => setIsRefineOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono-luxury font-bold cursor-pointer transition-all shadow-xs border ${
              activeFiltersCount > 0
                ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)] shadow-md hover:brightness-105'
                : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--gold-accent)]'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Refine</span>
            {activeFiltersCount > 0 && (
              <span className="h-4.5 w-4.5 px-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-[10px] font-extrabold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Grid Layout Density Switcher (3-Col vs 4-Col) */}
          <button
            type="button"
            onClick={() => setGridCols((prev) => (prev === 4 ? 3 : 4))}
            className="flex items-center gap-1.5 px-3 py-2 border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-mono-luxury font-bold rounded-full cursor-pointer hover:border-[var(--gold-accent)] transition-all bg-[var(--bg-primary)] active:scale-95"
            title={gridCols === 4 ? 'Switch to 3-column view' : 'Switch to 4-column view'}
          >
            {gridCols === 4 ? (
              <>
                <Grid3X3 className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                <span className="text-[10px] uppercase font-bold">3-Col</span>
              </>
            ) : (
              <>
                <LayoutGrid className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                <span className="text-[10px] uppercase font-bold">4-Col</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2.5 ACTIVE FILTER PILLS (Matching Mobile) */}
      {/* ======================================================== */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury">
          <span className="text-[10px] uppercase text-[var(--gold-accent)] font-bold shrink-0">Active Filters:</span>
          
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium">
              <span>{categoryMeta[selectedCategory]?.label || selectedCategory}</span>
              <button onClick={() => setSelectedCategory('all')} className="hover:text-red-500 cursor-pointer ml-0.5"><X className="h-3 w-3" /></button>
            </span>
          )}
          {specificCategory && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium">
              <span className="capitalize">{specificCategory.replace(/-/g, ' ')}</span>
              <button onClick={() => setSpecificCategory(null)} className="hover:text-red-500 cursor-pointer ml-0.5"><X className="h-3 w-3" /></button>
            </span>
          )}
          {departmentFilter && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium">
              <span className="uppercase">{departmentFilter}</span>
              <button onClick={() => setDepartmentFilter(null)} className="hover:text-red-500 cursor-pointer ml-0.5"><X className="h-3 w-3" /></button>
            </span>
          )}
          {priceRange !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium">
              <span>
                {priceRange === 'under25k' && 'Under ₦25k'}
                {priceRange === '25k-50k' && '₦25k - ₦50k'}
                {priceRange === '50k-100k' && '₦50k - ₦100k'}
                {priceRange === 'over100k' && 'Over ₦100k'}
              </span>
              <button onClick={() => setPriceRange('all')} className="hover:text-red-500 cursor-pointer ml-0.5"><X className="h-3 w-3" /></button>
            </span>
          )}
          {selectedBrand !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium">
              <span>Brand: {brandOptions.find(b => b.id === selectedBrand)?.name || selectedBrand}</span>
              <button onClick={() => setSelectedBrand('all')} className="hover:text-red-500 cursor-pointer ml-0.5"><X className="h-3 w-3" /></button>
            </span>
          )}
          {selectedOriginType !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium">
              <span>{selectedOriginType === 'handmade_designer' ? 'Handmade' : 'Ready-Made'}</span>
              <button onClick={() => setSelectedOriginType('all')} className="hover:text-red-500 cursor-pointer ml-0.5"><X className="h-3 w-3" /></button>
            </span>
          )}
          {sortBy !== 'featured' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium">
              <span>
                {sortBy === 'newest' && 'Newest'}
                {sortBy === 'price-asc' && 'Price: Low-High'}
                {sortBy === 'price-desc' && 'Price: High-Low'}
              </span>
              <button onClick={() => setSortBy('featured')} className="hover:text-red-500 cursor-pointer ml-0.5"><X className="h-3 w-3" /></button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium">
              <span>&quot;{searchQuery}&quot;</span>
              <button onClick={() => setSearchQuery('')} className="hover:text-red-500 cursor-pointer ml-0.5"><X className="h-3 w-3" /></button>
            </span>
          )}

          <button
            type="button"
            onClick={handleResetFilters}
            className="ml-auto text-[11px] text-rose-500 hover:underline font-bold uppercase cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. CATEGORY PILL SELECTOR & PIECES SUMMARY */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected =
              (cat.id === 'all' && selectedCategory === 'all' && !specificCategory && !departmentFilter) ||
              (cat.type === 'cat' && selectedCategory === cat.id && !specificCategory) ||
              (cat.type === 'sub' && specificCategory === cat.id);

            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryItemClick(cat)}
                className={`px-4 py-2 rounded-full text-xs font-mono-luxury uppercase tracking-wider font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
                    : 'surface-card text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono-luxury px-1">
          <span>{filteredProducts.length} {filteredProducts.length === 1 ? 'curated piece' : 'curated pieces'} found</span>
          {totalPages > 1 && <span>Page {currentPage} of {totalPages}</span>}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. GARMENTS GRID OR ANIMATED EMPTY STATE */}
      {/* ======================================================== */}
      {isProductsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-2xl sm:rounded-3xl surface-card p-4 space-y-3 animate-pulse border border-[var(--border-subtle)]">
              <div className="aspect-[4/5] w-full bg-[var(--bg-secondary)] rounded-2xl" />
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-[var(--bg-secondary)] rounded-md" />
                <div className="h-3 w-1/2 bg-[var(--bg-secondary)] rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        
        /* ANIMATED NO RESULTS EMPTY STATE */
        <div className="p-12 sm:p-16 rounded-3xl surface-card border border-[var(--border-subtle)] text-center space-y-6 animate-fadeIn max-w-xl mx-auto shadow-xl">
          
          <div className="relative h-20 w-20 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] flex items-center justify-center mx-auto shadow-inner">
            <PackageSearch className="h-10 w-10 text-[var(--gold-accent)]" />
          </div>

          <div className="space-y-2">
            <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              {allProducts.length === 0 ? 'New Season Drops Coming Soon' : 'No Garments Match Filter'}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light max-w-md mx-auto leading-relaxed">
              {allProducts.length === 0
                ? 'Our partner boutiques and ateliers are currently preparing their upcoming collections. Check back shortly for new exclusive drops.'
                : `We couldn't find any designs matching "${searchQuery || selectedCategory || selectedBrand}". Try adjusting your filters.`}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold hover:opacity-90 transition-all shadow-md"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>

        </div>

      ) : (

        /* PRODUCT GRID (Dynamic 3-Col vs 4-Col on Desktop) */
        <div className={gridCols === 3 ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"}>
          {paginatedProducts.map((product) => {
            const isWorn = Boolean(product.category && (activeOutfit as any)[product.category]?.id === product.id);
            const fitResult = calculateFitMatch(bodyProfile, product);
            const productImagesList: string[] = Array.isArray(product.images)
              ? product.images.map((img: any) => typeof img === 'string' ? img : img?.url).filter(Boolean)
              : (product.imageUrl ? [product.imageUrl] : []);
            const secondaryImage = productImagesList.length > 1
              ? productImagesList.find((img) => img !== product.imageUrl) || productImagesList[1]
              : undefined;

            return (
              <div
                key={product.id}
                className={`group relative rounded-2xl sm:rounded-3xl surface-card overflow-hidden flex flex-col justify-between hover:shadow-2xl transition-all duration-500 border border-[var(--border-subtle)] ${
                  isWorn ? 'border-[var(--gold-accent)] shadow-md ring-1 ring-[var(--gold-accent)]/30' : ''
                }`}
              >
                {/* Image Container with Quick Look Click */}
                <div
                  onClick={() => setQuickLookProduct(product)}
                  onMouseEnter={(e) => {
                    const video = e.currentTarget.querySelector('video');
                    if (video && video.paused) {
                      video.play().catch(() => {});
                    }
                  }}
                  className={`relative ${gridCols === 3 ? 'h-64 sm:h-96' : 'h-48 sm:h-80'} w-full bg-[var(--bg-secondary)] overflow-hidden block cursor-pointer`}
                >
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover transition-all duration-500 brightness-95 group-hover:brightness-100"
                  />
                  {!product.videoUrl && secondaryImage && (
                    <Image
                      src={secondaryImage}
                      alt={`${product.name} alternate view`}
                      fill
                      unoptimized
                      className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    />
                  )}
                  {product.videoUrl && (
                    <video
                      ref={(el) => {
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
                      poster={product.imageUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      webkit-playsinline="true"
                      x5-playsinline="true"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    />
                  )}

                  {/* Top Right: Wishlist Heart Button (Matching Mobile Feature) */}
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHeartClick(product);
                      }}
                      className={`p-2 sm:p-2.5 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                        isInVault(product.id)
                          ? 'bg-red-500/20 text-red-500 border-red-500/40 shadow-md scale-105'
                          : 'bg-black/60 text-white/80 border-white/10 hover:text-white hover:bg-black/85'
                      }`}
                      title={isInVault(product.id) ? 'In Wishlist' : 'Add to Wishlist'}
                      aria-label="Wishlist"
                    >
                      <Heart
                        className={`h-4 w-4 transition-all duration-200 ${
                          isInVault(product.id) ? 'fill-red-500 text-red-500' : 'text-white stroke-[2]'
                        } ${burstingHearts.has(product.id) ? 'scale-125' : 'scale-100'}`}
                      />
                    </button>
                  </div>

                  {/* Quick View Center Overlay */}
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="px-3.5 py-1.5 rounded-full bg-black/85 backdrop-blur-md text-white text-[10px] font-mono-luxury uppercase tracking-wider font-bold border border-white/20 shadow-lg flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                      <span>Quick View</span>
                    </span>
                  </div>

                  {/* Stock & Sizes Pill */}
                  <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-black/85 backdrop-blur-md border border-white/10 flex items-center justify-between z-10 shadow-md">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-400" />
                      <span className="text-[9px] sm:text-[11px] font-mono-luxury text-emerald-400 font-bold uppercase tracking-wider">
                        {product.category === 'accessories' || product.category === 'footwear' ? 'In Stock' : 'In Stock · RTW'}
                      </span>
                    </div>

                    {product.category !== 'footwear' && (
                      <span className="text-[9px] sm:text-[11px] font-mono-luxury text-white font-bold bg-white/10 px-2 sm:px-2.5 py-0.5 rounded-md sm:rounded-lg border border-white/15">
                        {product.category === 'accessories'
                          ? 'One Size'
                          : (product.sizes || ['S', 'M', 'L']).slice(0, 3).join(' · ') + ((product.sizes || []).length > 3 ? '+' : '')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
                  <div>
                    {/* Atelier & Details Link */}
                    <div className="flex items-center justify-between gap-2 pb-1">
                      <span className="text-[10px] sm:text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold tracking-wider truncate">
                        {product.vendorName}
                      </span>

                      <Link
                        href={`/shop/${product.id}`}
                        className="text-[10px] sm:text-xs font-mono-luxury uppercase text-[var(--text-muted)] hover:text-[var(--gold-accent)] font-bold inline-flex items-center gap-1 shrink-0 transition-colors"
                      >
                        <span>Details</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>

                    {/* Title */}
                    <Link href={`/shop/${product.id}`} className="hover:text-[var(--gold-accent)] transition-colors block">
                      <h3 className="font-editorial text-sm sm:text-2xl font-bold text-[var(--text-primary)] leading-snug line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Prominent Eye-Catching Gold Price & Stock Status */}
                    <div className="flex items-baseline gap-2 pt-1.5">
                      <span className="font-editorial text-lg sm:text-2xl font-bold text-amber-600 dark:text-[var(--gold-accent)] drop-shadow-sm">
                        ₦{product.price.toLocaleString()}
                      </span>
                      {product.stockQuantity === 0 ? (
                        <span className="text-[9px] sm:text-[11px] font-mono-luxury text-rose-500 font-bold uppercase">
                          Sold Out
                        </span>
                      ) : (product.stockQuantity !== undefined && product.stockQuantity <= 3) ? (
                        <span className="text-[9px] sm:text-[11px] font-mono-luxury text-amber-500 font-bold uppercase animate-pulse">
                          Only {product.stockQuantity} Left
                        </span>
                      ) : (
                        <span className="text-[9px] sm:text-[11px] font-mono-luxury text-emerald-500 font-bold">
                          In Stock
                        </span>
                      )}
                    </div>

                    {/* Store Origin Location */}
                    <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono-luxury text-[var(--text-secondary)] pt-1">
                      <MapPin className="h-3 w-3 text-[var(--gold-accent)] shrink-0" />
                      <span className="truncate">{product.vendorCity ? `Ships from ${product.vendorCity}${product.vendorState ? `, ${product.vendorState}` : ''}` : 'Ships from verified vendor'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2.5 sm:pt-3 border-t border-[var(--border-subtle)]">
                    {/* Desktop: 2-column grid with Style Look and Add to Bag */}
                    <div className="hidden md:grid md:grid-cols-2 gap-2">
                      <Link
                        href={`/shop/${product.id}`}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-full text-[11px] font-mono-luxury uppercase tracking-wider font-semibold whitespace-nowrap transition-all bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] hover:text-[var(--gold-accent)] cursor-pointer"
                        title="View Garment"
                      >
                        <Eye className="h-3.5 w-3.5 text-[var(--gold-accent)] shrink-0" />
                        <span className="truncate">View</span>
                      </Link>

                      <button
                        onClick={() => product.stockQuantity === 0 ? null : setQuickLookProduct(product)}
                        disabled={product.stockQuantity === 0}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-full text-[11px] font-mono-luxury uppercase tracking-wider font-semibold whitespace-nowrap border transition-all ${
                          product.stockQuantity === 0
                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-400 opacity-60 cursor-not-allowed'
                            : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:text-[var(--gold-accent)] cursor-pointer'
                        }`}
                      >
                        <ShoppingBag className="h-3 w-3 shrink-0" />
                        <span className="truncate">{product.stockQuantity === 0 ? 'Sold Out' : 'Add to Bag'}</span>
                      </button>
                    </div>

                    {/* Mobile: Clean single Add to Bag button (Zero Style Look on mobile) */}
                    <button
                      onClick={() => product.stockQuantity === 0 ? null : addToCart(product, fitResult.recommendedSize, product.colors?.[0], 1)}
                      disabled={product.stockQuantity === 0}
                      className={`md:hidden w-full flex items-center justify-center gap-1.5 py-2 px-2 rounded-full text-[10px] font-mono-luxury uppercase tracking-wider font-bold whitespace-nowrap border transition-all ${
                        product.stockQuantity === 0
                          ? 'border-rose-500/30 bg-rose-500/10 text-rose-400 opacity-60 cursor-not-allowed'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)] active:scale-95 cursor-pointer'
                      }`}
                    >
                      <ShoppingBag className="h-3 w-3 shrink-0" />
                      <span>{product.stockQuantity === 0 ? 'Sold Out' : 'Add to Bag'}</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. CLASSIC PAGINATION CONTROLS */}
      {/* ======================================================== */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8 border-t border-[var(--border-subtle)]">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] hover:border-[var(--gold-accent)] hover:text-[var(--gold-accent)] transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Prev</span>
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`h-9 w-9 rounded-full text-xs font-mono-luxury font-bold transition-all flex items-center justify-center cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-black dark:bg-white text-white dark:text-black font-bold shadow-md scale-105'
                    : 'surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--gold-accent)]'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] hover:border-[var(--gold-accent)] hover:text-[var(--gold-accent)] transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Garment Quick Look Editorial Modal */}
      <ProductQuickLookModal
        product={quickLookProduct}
        onClose={() => setQuickLookProduct(null)}
      />

      {/* ======================================================== */}
      {/* 6. REFINE SLIDE-OVER DRAWER (Desktop) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isRefineOpen && (
          <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRefineOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-lg bg-[var(--bg-primary)] border-l border-[var(--border-subtle)] shadow-2xl flex flex-col justify-between h-full z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">Refine &amp; Sort</h3>
                  <p className="text-xs font-mono-luxury text-[var(--text-secondary)] mt-0.5">
                    Showing {filteredProducts.length} curated {filteredProducts.length === 1 ? 'piece' : 'pieces'}
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

              {/* Scrollable Filters Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-xs font-mono-luxury font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    Search Catalog
                  </label>
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
                        className={`px-3.5 py-2 rounded-xl text-xs font-mono-luxury transition-all cursor-pointer border ${
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
                    {[{ id: 'male', label: "Men's Collection" }, { id: 'female', label: "Women's Collection" }].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          handleGenderChange(g.id as 'male' | 'female');
                        }}
                        className={`py-2.5 rounded-xl text-center text-xs font-mono-luxury transition-all cursor-pointer border ${
                          selectedGender === g.id
                            ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold shadow-xs'
                            : 'border-[var(--border-subtle)] text-[var(--text-secondary)] bg-[var(--bg-secondary)]'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Garment Origin Type */}
                <div className="space-y-2">
                  <p className="text-xs font-mono-luxury font-bold uppercase tracking-wider text-[var(--text-primary)]">Garment Origin</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'all', label: 'All Types' },
                      { id: 'handmade_designer', label: 'Handmade' },
                      { id: 'ready_made_boutique', label: 'Ready-Made' },
                    ].map((orig) => (
                      <button
                        key={orig.id}
                        type="button"
                        onClick={() => {
                          setSelectedOriginType(orig.id as any);
                          setCurrentPage(1);
                        }}
                        className={`py-2 px-1 text-center text-xs font-mono-luxury transition-all cursor-pointer rounded-xl border ${
                          selectedOriginType === orig.id
                            ? 'border-[var(--gold-accent)] bg-[var(--gold-subtle)] text-[var(--gold-accent)] font-bold'
                            : 'border-[var(--border-subtle)] text-[var(--text-secondary)] bg-[var(--bg-secondary)]'
                        }`}
                      >
                        {orig.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Verified Boutiques & Designers */}
                <div className="space-y-2">
                  <p className="text-xs font-mono-luxury font-bold uppercase tracking-wider text-[var(--text-primary)]">Boutique / Brand</p>
                  <select
                    value={selectedBrand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-xs font-mono-luxury text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)] cursor-pointer"
                  >
                    {brandOptions.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category List */}
                <div className="space-y-2">
                  <p className="text-xs font-mono-luxury font-bold uppercase tracking-wider text-[var(--text-primary)]">Categories</p>
                  <div className="flex flex-col gap-1 max-h-52 overflow-y-auto pr-1">
                    {categories.map((cat) => {
                      const isSelected =
                        (cat.id === 'all' && selectedCategory === 'all' && !specificCategory && !departmentFilter) ||
                        (cat.type === 'cat' && selectedCategory === cat.id && !specificCategory) ||
                        (cat.type === 'sub' && specificCategory === cat.id);

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            handleCategoryItemClick(cat);
                            setIsRefineOpen(false);
                          }}
                          className={`text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[var(--gold-subtle)] font-bold text-[var(--gold-accent)]'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                          }`}
                        >
                          <span className="font-mono-luxury">{cat.label}</span>
                          {isSelected && <span className="h-2 w-2 rounded-full bg-[var(--gold-accent)]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-5 py-3 rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono-luxury font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset All</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRefineOpen(false)}
                  className="flex-1 py-3 px-6 rounded-full bg-[var(--gold-accent)] text-black font-mono-luxury font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>View {filteredProducts.length} {filteredProducts.length === 1 ? 'Piece' : 'Pieces'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
