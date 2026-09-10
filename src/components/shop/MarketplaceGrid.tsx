'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { GarmentCategory, GarmentOriginType } from '@/types';
import { calculateFitMatch } from '@/lib/utils/sizingEngine';
import {
  Sparkles, Check, ShoppingBag, Search, Scissors, ArrowRight,
  ChevronLeft, ChevronRight, RotateCcw, PackageSearch, Layers,
  Bookmark, Eye, Plus, MapPin
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import ProductQuickLookModal from '@/components/shop/ProductQuickLookModal';

const ITEMS_PER_PAGE = 24;

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
  const [selectedCategory, setSelectedCategory] = useState<GarmentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [quickLookProduct, setQuickLookProduct] = useState<any>(null);

  useEffect(() => {
    const gen = searchParams.get('gender')?.toLowerCase();
    if (gen === 'male' || gen === 'men') {
      setSelectedGender('male');
      setCurrentPage(1);
    } else if (gen === 'female' || gen === 'women') {
      setSelectedGender('female');
      setCurrentPage(1);
    }

    const cat = searchParams.get('category')?.toLowerCase();
    if (cat && ['tops', 'bottoms', 'outerwear', 'footwear', 'accessories'].includes(cat)) {
      setSelectedCategory(cat as GarmentCategory);
      setCurrentPage(1);
    } else if (cat === 'all') {
      setSelectedCategory('all');
      setCurrentPage(1);
    } else if (cat) {
      // If it's a specific subcategory, map to the closest category or search query
      if (['hoodies', 'jackets'].includes(cat)) setSelectedCategory('outerwear');
      else if (['jeans', 'cargo', 'trousers', 'shorts'].includes(cat)) setSelectedCategory('bottoms');
      else if (['slides', 'sneakers', 'loafers', 'heels', 'clogs', 'crocs'].includes(cat)) setSelectedCategory('footwear');
      else if (['bags', 'backpacks', 'chains', 'watches', 'caps', 'fila', 'clutches'].includes(cat)) setSelectedCategory('accessories');
      else if (['senator', 'agbada', 'jalabiya', 'dresses'].includes(cat)) setSelectedCategory('tops');
      
      if (['bags', 'backpacks', 'men-backpacks', 'women-bags', 'clutches'].includes(cat)) {
        setSearchQuery('bag');
      } else if (cat === 'clogs' || cat === 'crocs') {
        setSearchQuery('clog');
      } else {
        setSearchQuery(cat);
      }
      setCurrentPage(1);
    }
  }, [searchParams, setSelectedGender]);

  const categories: { id: GarmentCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Items & Drops' },
    { id: 'tops', label: selectedGender === 'female' ? 'Dresses & Tops' : 'Senator & Tops' },
    { id: 'outerwear', label: selectedGender === 'female' ? 'Boubou & Robes' : 'Agbada & Hoodies' },
    { id: 'bottoms', label: 'Trousers & Jeans' },
    { id: 'footwear', label: 'Slides, Palms & Shoes' },
    { id: 'accessories', label: 'Caps, Jewelry & Bags' },
  ];

  const brandOptions = useMemo(() => {
    const brandsMap = new Map<string, { id: string; name: string; count: number }>();
    brandsMap.set('all', { id: 'all', name: 'All Ateliers & Boutiques', count: allProducts.length });
    
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

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
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

      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;

      const pVendorName = String(p.vendorName || '').toLowerCase();
      const pVendorId = String(p.vendorId || '').toLowerCase();
      const sBrand = String(selectedBrand || '').toLowerCase();
      const matchesBrand = sBrand === 'all' || pVendorId === sBrand || pVendorName.includes(sBrand);

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
                           String(p.name || '').toLowerCase().includes(q) ||
                           String(p.description || '').toLowerCase().includes(q) ||
                           (Array.isArray(p.tags) && p.tags.some(t => String(t).toLowerCase().includes(q)));

      return matchesGender && matchesOrigin && matchesCat && matchesBrand && matchesQuery;
    });
  }, [allProducts, selectedGender, selectedOriginType, selectedCategory, selectedBrand, searchQuery]);

  // Reset page when filters change
  const handleBrandChange = (brandId: string) => {
    setSelectedBrand(brandId);
    setCurrentPage(1);
  };

  const handleCategoryChange = (catId: GarmentCategory | 'all') => {
    setSelectedCategory(catId);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedBrand('all');
    setSelectedCategory('all');
    setSelectedOriginType('all');
    setSearchQuery('');
    setCurrentPage(1);
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
            
            {/* Left Button */}
            <Link
              href="/studio"
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase tracking-widest text-xs font-bold hover:opacity-90 transition-all shadow-md shrink-0"
            >
              <Layers className="h-4 w-4" />
              <span>Open Virtual Dressing Room</span>
            </Link>

        

          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SEARCH & GLOBAL FILTERS BAR */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl surface-card border border-[var(--border-subtle)]">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search Senator, Ankara, Hoodies, Denim..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs sm:text-sm text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
          />
        </div>

        {/* Gender Switcher & Handmade vs ReadyMade Filter */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          
          {/* Gender Switcher */}
          <div className="flex items-center p-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
            <button
              onClick={() => {
                setSelectedGender('male');
                setCurrentPage(1);
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-mono-luxury uppercase transition-all ${
                selectedGender === 'male'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Men&apos;s
            </button>
            <button
              onClick={() => {
                setSelectedGender('female');
                setCurrentPage(1);
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-mono-luxury uppercase transition-all ${
                selectedGender === 'female'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Women&apos;s
            </button>
          </div>

          {/* Origin Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[11px] font-mono-luxury uppercase">
            <button
              onClick={() => {
                setSelectedOriginType('all');
                setCurrentPage(1);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-full transition-all ${
                selectedOriginType === 'all'
                  ? 'bg-[var(--badge-bg)] text-[var(--text-primary)] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => {
                setSelectedOriginType('handmade_designer');
                setCurrentPage(1);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                selectedOriginType === 'handmade_designer'
                  ? 'bg-[var(--gold-subtle)] text-[var(--gold-accent)] font-bold border border-[var(--gold-accent)]/20'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Scissors className="h-3 w-3" />
              <span>Handmade</span>
            </button>
            <button
              onClick={() => {
                setSelectedOriginType('ready_made_boutique');
                setCurrentPage(1);
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-full transition-all ${
                selectedOriginType === 'ready_made_boutique'
                  ? 'bg-[var(--badge-bg)] text-[var(--text-primary)] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Ready-Made
            </button>
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* 3. CATEGORY PILL SELECTOR */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-mono-luxury uppercase tracking-wider font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
                : 'surface-card text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
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

        /* PRODUCT GRID (2-COLUMNS ON MOBILE, 4-COLUMNS ON DESKTOP) */
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {paginatedProducts.map((product) => {
            const isWorn = activeOutfit[product.category]?.id === product.id;
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
                  className="relative h-48 sm:h-80 w-full bg-[var(--bg-secondary)] overflow-hidden block cursor-pointer"
                >
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover transition-all duration-500 brightness-95 group-hover:brightness-100 group-hover:scale-105"
                  />
                  {!product.videoUrl && secondaryImage && (
                    <Image
                      src={secondaryImage}
                      alt={`${product.name} alternate view`}
                      fill
                      unoptimized
                      className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none group-hover:scale-105"
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
                  
                  {/* Top Left: Atelier Attribution */}
                  <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10">
                    <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[9px] sm:text-[10px] font-mono-luxury uppercase tracking-wider text-white border border-white/10 font-bold shadow-md">
                      {product.vendorName}
                    </span>
                  </div>

                  {/* Top Right: Curated Vault Bookmark Button */}
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVaultItem(product);
                      }}
                      className={`p-2 sm:p-2.5 rounded-full backdrop-blur-md border transition-all ${
                        isInVault(product.id)
                          ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)] shadow-md scale-105'
                          : 'bg-black/60 text-white/80 border-white/10 hover:text-white hover:bg-black/85'
                      }`}
                      title={isInVault(product.id) ? 'In Curated Vault' : 'Curate to Wardrobe Vault'}
                    >
                      <Bookmark className={`h-3.5 w-3.5 ${isInVault(product.id) ? 'fill-current' : ''}`} />
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
                      <button
                        onClick={() => {
                          if (isWorn) {
                            removeOutfitItem(product.category);
                          } else {
                            setOutfitItem(product);
                          }
                        }}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-full text-[11px] font-mono-luxury uppercase tracking-wider font-semibold whitespace-nowrap transition-all ${
                          isWorn
                            ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                            : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:text-[var(--gold-accent)]'
                        }`}
                      >
                        {isWorn ? (
                          <>
                            <Check className="h-3 w-3 stroke-[3] shrink-0" />
                            <span className="truncate">On Model</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 text-[var(--gold-accent)] shrink-0" />
                            <span className="truncate">Style Look</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => product.stockQuantity === 0 ? null : addToCart(product, fitResult.recommendedSize, product.colors?.[0], 1)}
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
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] hover:border-[var(--gold-accent)] hover:text-[var(--gold-accent)] transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Prev</span>
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`h-9 w-9 rounded-full text-xs font-mono-luxury font-bold transition-all flex items-center justify-center ${
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
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] hover:border-[var(--gold-accent)] hover:text-[var(--gold-accent)] transition-all disabled:opacity-30 disabled:pointer-events-none"
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

    </div>
  );
}
