'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles, User, ShieldCheck, ShoppingBag, Check, Camera,
  Share2, Ruler, Eye, Store, ChevronRight, Layers, ArrowRight,
  Maximize2, Zap, Search, MessageSquare
} from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import { products as initialProducts } from '@/lib/data/products';
import { Product } from '@/types';
import confetti from 'canvas-confetti';

type ModelGender = 'male' | 'female';
type ViewAngle = 'full_runway' | 'tailored_cut' | 'fabric_zoom';
type StudioCategory = 'all' | 'native' | 'streetwear' | 'tops' | 'bottoms' | 'accessories';

// Smart editorial model visual mapping based on real platform piece
function getModelVisual(product: Product, gender: ModelGender): string {
  const n = (product.name || '').toLowerCase();
  const c = (product.category || '').toLowerCase();
  const t = (product.tags || []).map(tag => tag.toLowerCase()).join(' ');

  if (gender === 'male') {
    if (n.includes('agbada') || c.includes('agbada') || t.includes('agbada')) {
      return '/images/editorial/nigerian_male_couture.jpg';
    }
    if (n.includes('senator') || n.includes('kaftan') || t.includes('senator')) {
      return '/images/editorial/male_senator.jpg';
    }
    if (
      n.includes('hoodie') || n.includes('sweatshirt') || n.includes('jacket') ||
      n.includes('trap star') || n.includes('bo + tee') || n.includes('chrome heart') ||
      n.includes('kokolee')
    ) {
      return '/images/editorial/male_hoodie.jpg';
    }
    if (
      n.includes('jean') || n.includes('pant') || n.includes('trouser') ||
      n.includes('cargo') || c === 'bottoms' || n.includes('adiddas') || n.includes('baggy')
    ) {
      return '/images/editorial/modern_male_streetwear.jpg';
    }
    if (
      n.includes('slide') || n.includes('shoe') || c === 'footwear' ||
      c === 'accessories' || n.includes('chain') || n.includes('cap')
    ) {
      return '/images/editorial/modern_male_streetwear.jpg';
    }
    return '/images/editorial/male_shirt.jpg';
  } else {
    if (n.includes('agbada') || c.includes('agbada') || t.includes('agbada') || n.includes('boubou')) {
      return '/images/editorial/nigerian_female_couture.jpg';
    }
    if (n.includes('dress') || n.includes('gown') || n.includes('slip') || n.includes('lace')) {
      return '/images/editorial/female_dress.jpg';
    }
    if (
      n.includes('hoodie') || n.includes('sweatshirt') || n.includes('jacket') ||
      n.includes('trap star') || n.includes('bo + tee') || n.includes('chrome heart')
    ) {
      return '/images/editorial/female_hoodie.jpg';
    }
    if (n.includes('jean') || n.includes('pant') || n.includes('trouser') || c === 'bottoms') {
      return '/images/editorial/modern_female_streetwear.jpg';
    }
    if (
      n.includes('slide') || n.includes('shoe') || c === 'footwear' ||
      c === 'accessories' || n.includes('chain') || n.includes('cap')
    ) {
      return '/images/editorial/modern_female_streetwear.jpg';
    }
    return '/images/editorial/female_shirt.jpg';
  }
}

// Generate bespoke drape intelligence notes for real products
function getDrapeIntelligence(product: Product): { drape: string; fabric: string } {
  const n = (product.name || '').toLowerCase();
  const c = (product.category || '').toLowerCase();

  let drape = product.fitNotes || '';
  if (!drape || drape.length < 15) {
    if (n.includes('agbada') || c.includes('agbada')) {
      drape = 'Sweeping regal wingspan with weighted drape over shoulders, tailored for traditional prestige and majestic movement.';
    } else if (n.includes('senator') || n.includes('kaftan')) {
      drape = 'Structured shoulder line with tailored bespoke tunic drop. Engineered with zero pull across the chest and clean sleeve fall.';
    } else if (n.includes('hoodie') || n.includes('sweatshirt')) {
      drape = 'Heavyweight boxy drop-shoulder cut with double-layered hood and relaxed wrist cuff stacking.';
    } else if (n.includes('jean') || n.includes('pant') || c === 'bottoms') {
      drape = 'Relaxed contemporary wide-leg cut engineered for effortless drape and stacking over footwear.';
    } else if (n.includes('dress') || n.includes('gown')) {
      drape = 'Fluid silhouette that moves naturally with runway stride, accentuating natural posture and waistline.';
    } else {
      drape = 'Clean tailored contour with relaxed chest opening, engineered for tropical climate breathability and sharp lines.';
    }
  }

  const fabric = product.fabricComposition || 'Premium West African cotton & artisanal fiber blend with reinforced seams.';
  return { drape, fabric };
}

export default function RealModelTryOnStudio() {
  const { allProducts, isProductsLoading, fetchProductsFromDb, addToCart, setIsCartOpen, bodyProfile } = useStore();

  const [activeGender, setActiveGender] = useState<ModelGender>('male');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [activeAngle, setActiveAngle] = useState<ViewAngle>('full_runway');
  const [selectedSize, setSelectedSize] = useState<string>('L');
  const [activeCategory, setActiveCategory] = useState<StudioCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [snapshotSuccess, setSnapshotSuccess] = useState<boolean>(false);

  // Trigger loading of real database products on mount
  useEffect(() => {
    fetchProductsFromDb();
  }, [fetchProductsFromDb]);

  // Combine live database products with baseline curated products
  const liveCatalog: Product[] = useMemo(() => {
    if (allProducts && allProducts.length > 0) {
      return allProducts;
    }
    return initialProducts;
  }, [allProducts]);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return liveCatalog.filter((p) => {
      const n = (p.name || '').toLowerCase();
      const c = (p.category || '').toLowerCase();
      const t = (p.tags || []).map((x) => x.toLowerCase()).join(' ');

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = n.includes(q);
        const matchesVendor = (p.vendorName || '').toLowerCase().includes(q);
        const matchesCat = c.includes(q);
        if (!matchesName && !matchesVendor && !matchesCat) return false;
      }

      // Category tab match
      if (activeCategory === 'native') {
        return n.includes('senator') || n.includes('kaftan') || n.includes('agbada') || t.includes('senator') || t.includes('native') || c.includes('agbada');
      }
      if (activeCategory === 'streetwear') {
        return n.includes('hoodie') || n.includes('sweatshirt') || n.includes('trap star') || n.includes('bo + tee') || n.includes('chrome heart') || n.includes('kokolee');
      }
      if (activeCategory === 'tops') {
        return c === 'tops' || n.includes('top') || n.includes('shirt') || n.includes('waistcoat') || n.includes('t-shirt') || n.includes('lace') || n.includes('assad');
      }
      if (activeCategory === 'bottoms') {
        return c === 'bottoms' || n.includes('jean') || n.includes('pant') || n.includes('trouser') || n.includes('adiddas') || n.includes('baggy');
      }
      if (activeCategory === 'accessories') {
        return c === 'accessories' || c === 'footwear' || n.includes('slide') || n.includes('shoe') || n.includes('chain') || n.includes('cap') || n.includes('carmocap') || n.includes('guccicap');
      }

      return true;
    });
  }, [liveCatalog, activeCategory, searchQuery]);

  // Set default selected product once catalog is loaded
  useEffect(() => {
    if (!selectedProductId && liveCatalog.length > 0) {
      // Prioritize famous native Senator or Hoodie if present
      const senatorItem = liveCatalog.find(
        (p) => p.name.toLowerCase().includes('senator') || p.name.toLowerCase().includes('trap star')
      );
      const defaultItem = senatorItem || liveCatalog[0];
      setSelectedProductId(defaultItem.id);
      if (defaultItem.sizes && defaultItem.sizes.length > 0) {
        setSelectedSize(defaultItem.sizes[0]);
      }
    }
  }, [liveCatalog, selectedProductId]);

  // Active product item
  const activeProduct: Product = useMemo(() => {
    const found = liveCatalog.find((p) => p.id === selectedProductId);
    return found || liveCatalog[0] || initialProducts[0];
  }, [liveCatalog, selectedProductId]);

  // Synchronize size when product changes
  const availableSizes = useMemo(() => {
    if (activeProduct.sizes && activeProduct.sizes.length > 0) {
      return activeProduct.sizes;
    }
    return ['S', 'M', 'L', 'XL', 'XXL'];
  }, [activeProduct]);

  useEffect(() => {
    if (availableSizes.length > 0 && !availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  // Model image source mapped to current active real piece
  const modelImage = useMemo(() => {
    return getModelVisual(activeProduct, activeGender);
  }, [activeProduct, activeGender]);

  // Tailoring notes
  const tailoringInfo = useMemo(() => {
    return getDrapeIntelligence(activeProduct);
  }, [activeProduct]);

  // Real Model Specifications
  const modelInfo = useMemo(() => {
    if (activeGender === 'male') {
      return {
        name: 'Timi',
        title: 'Runway Lead',
        height: '6\'1" (185 cm)',
        weight: '82 kg',
        build: 'Athletic Nigerian Frame',
        chest: '40" (102 cm)',
        waist: '32" (81 cm)',
        defaultSize: 'L',
      };
    }
    return {
      name: 'Zainab',
      title: 'Haute Couture Lead',
      height: '5\'10" (178 cm)',
      weight: '58 kg',
      build: 'High-Fashion Runway Frame',
      chest: '34" (86 cm)',
      waist: '26" (66 cm)',
      defaultSize: 'M',
    };
  }, [activeGender]);

  // Add to Bag with real product data
  const handleAddToCart = () => {
    addToCart(activeProduct, selectedSize);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#c4972e', '#ffffff', '#10b981'],
    });

    setIsCartOpen(true);
  };

  // Snapshot look photo
  const handleSnapshot = () => {
    const link = document.createElement('a');
    link.href = modelImage;
    link.download = `irisi-runway-${modelInfo.name.toLowerCase()}-${activeProduct.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`;
    link.click();

    setSnapshotSuccess(true);
    confetti({ particleCount: 30, spread: 45, origin: { y: 0.85 } });
    setTimeout(() => setSnapshotSuccess(false), 2800);
  };

  const whatsappMessage = encodeURIComponent(
    `Hello Ìrísí Atelier Concierge,\n\nI am viewing the "${activeProduct.name}" (ID: ${activeProduct.id}, ₦${activeProduct.price.toLocaleString()}) by ${activeProduct.vendorName || 'your atelier'} on the Runway Model Studio.\n\nI would like to inquire about ordering this piece in size ${selectedSize} or custom measurements.`
  );

  return (
    <div className="w-full space-y-6">
      
      {/* 1. STUDIO RUNWAY STAGE CONTAINER */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-[#121216] via-[#0b0b0e] to-[#060608] border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col lg:flex-row items-stretch">
        
        {/* LEFT: PHOTOREALISTIC RUNWAY MODEL DISPLAY (60% ON DESKTOP) */}
        <div className="relative w-full lg:w-7/12 h-[560px] sm:h-[640px] lg:h-[720px] bg-black overflow-hidden group">
          
          {/* Main Runway Photo with Smooth Zoom Transformation based on Angle */}
          <div className="relative w-full h-full overflow-hidden">
            <Image
              src={modelImage}
              alt={`${modelInfo.name} wearing ${activeProduct.name}`}
              fill
              unoptimized
              priority
              className={`object-cover object-top transition-all duration-700 ease-out ${
                activeAngle === 'tailored_cut'
                  ? 'scale-125 object-center'
                  : activeAngle === 'fabric_zoom'
                  ? 'scale-150 object-center'
                  : 'scale-100 object-top'
              }`}
            />
          </div>

          {/* Luxury Studio Ambient Vignette & Warm Gold Rim Filter */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none" />

          {/* TOP FLOATING OVERLAY: Model Selector + Action Buttons */}
          <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
            
            {/* Model Gender Toggle Switcher */}
            <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-full bg-black/70 backdrop-blur-xl border border-white/20 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveGender('male');
                  setSelectedSize(availableSizes.includes('L') ? 'L' : availableSizes[0]);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono-luxury text-xs font-bold transition-all cursor-pointer ${
                  activeGender === 'male'
                    ? 'bg-[var(--gold-accent)] text-black shadow-md'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <User className="h-3 w-3" />
                <span>Male (Timi)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveGender('female');
                  setSelectedSize(availableSizes.includes('M') ? 'M' : availableSizes[0]);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono-luxury text-xs font-bold transition-all cursor-pointer ${
                  activeGender === 'female'
                    ? 'bg-[var(--gold-accent)] text-black shadow-md'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <User className="h-3 w-3" />
                <span>Female (Zainab)</span>
              </button>
            </div>

            {/* Actions: Snapshot & Camera */}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handleSnapshot}
                className="p-2.5 rounded-full bg-black/70 hover:bg-black border border-white/20 text-white shadow-xl active:scale-90 transition-transform cursor-pointer"
                title="Save High-Res Look Photo"
                aria-label="Save High-Res Look Photo"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* FLOATING REAL PRODUCT INSET CARD (Shows the Actual Store Inventory Thumbnail) */}
          <div className="absolute top-16 sm:top-18 left-4 z-20 pointer-events-auto">
            <div className="p-2.5 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center gap-3 max-w-[280px]">
              <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-zinc-900 border border-white/20 shrink-0">
                <Image
                  src={activeProduct.imageUrl}
                  alt={activeProduct.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="space-y-0.5 overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[9px] font-mono-luxury font-bold uppercase tracking-wider text-emerald-400">
                    Live Store Item
                  </span>
                </div>
                <h4 className="text-xs font-editorial font-bold text-white truncate leading-tight">
                  {activeProduct.name}
                </h4>
                <p className="text-[10px] font-mono-luxury text-[var(--gold-accent)] font-bold">
                  ₦{activeProduct.price.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* ANGLE / VIEWPORT CONTROLS (Floating Right Edge) */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => setActiveAngle('full_runway')}
              className={`px-3 py-1.5 rounded-full backdrop-blur-xl border text-[10px] font-mono-luxury uppercase font-bold transition-all shadow-lg text-right ${
                activeAngle === 'full_runway'
                  ? 'bg-white text-black border-white shadow-md'
                  : 'bg-black/60 text-white/75 border-white/15 hover:text-white'
              }`}
            >
              Full Body
            </button>

            <button
              type="button"
              onClick={() => setActiveAngle('tailored_cut')}
              className={`px-3 py-1.5 rounded-full backdrop-blur-xl border text-[10px] font-mono-luxury uppercase font-bold transition-all shadow-lg text-right ${
                activeAngle === 'tailored_cut'
                  ? 'bg-white text-black border-white shadow-md'
                  : 'bg-black/60 text-white/75 border-white/15 hover:text-white'
              }`}
            >
              Torso Fit
            </button>

            <button
              type="button"
              onClick={() => setActiveAngle('fabric_zoom')}
              className={`px-3 py-1.5 rounded-full backdrop-blur-xl border text-[10px] font-mono-luxury uppercase font-bold transition-all shadow-lg text-right ${
                activeAngle === 'fabric_zoom'
                  ? 'bg-white text-black border-white shadow-md'
                  : 'bg-black/60 text-white/75 border-white/15 hover:text-white'
              }`}
            >
              Weave Zoom
            </button>
          </div>

          {/* BOTTOM MODEL SPECS HUD ON IMAGE */}
          <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between text-white pointer-events-none">
            <div className="p-3 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/15 space-y-0.5 pointer-events-auto">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono-luxury text-xs font-bold uppercase tracking-wider text-white">
                  {modelInfo.name} · {modelInfo.height}
                </span>
                <span className="text-[10px] font-mono-luxury text-[var(--gold-accent)] bg-[var(--gold-accent)]/15 px-2 py-0.5 rounded-md border border-[var(--gold-accent)]/30 font-bold">
                  Wearing Size {selectedSize}
                </span>
              </div>
              <p className="text-[10px] font-mono-luxury text-white/60">
                Chest {modelInfo.chest} · Waist {modelInfo.waist} · {modelInfo.build}
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono-luxury text-white/70 bg-black/60 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              <span>Verified Store Inventory</span>
            </div>
          </div>

          {/* Toast Notification */}
          {snapshotSuccess && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md text-emerald-400 font-mono-luxury text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-2xl">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
              <span>High-resolution look photo saved to downloads!</span>
            </div>
          )}

        </div>

        {/* RIGHT: REAL PIECE DETAILS, SIZING & STORE WARDROBE (40% ON DESKTOP) */}
        <div className="w-full lg:w-5/12 p-5 sm:p-6 flex flex-col justify-between space-y-5 bg-[#0c0c0f]">
          
          {/* Section 1: Active Piece Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold flex items-center gap-1.5">
                  <Store className="h-3 w-3 text-[var(--gold-accent)]" />
                  <span>{activeProduct.vendorName || 'Ìrísí Certified Atelier'}</span>
                </span>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-white leading-snug">
                  {activeProduct.name}
                </h2>
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div className="font-editorial text-3xl font-bold text-[var(--gold-accent)]">
                ₦{activeProduct.price.toLocaleString()}
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono-luxury font-bold uppercase">
                Escrow Protected
              </span>
            </div>

            {/* Drape & Tailoring Intelligence Card */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-mono-luxury text-[var(--gold-accent)] font-bold uppercase">
                <Ruler className="h-4 w-4" />
                <span>Drape &amp; Silhouette Analysis</span>
              </div>
              <p className="text-xs text-white/80 font-light leading-relaxed">
                {tailoringInfo.drape}
              </p>
              <p className="text-[11px] text-white/50 border-t border-white/10 pt-2 font-light">
                <strong className="text-white/80 font-medium">Fabric:</strong> {tailoringInfo.fabric}
              </p>
            </div>

            {/* Patron Size Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-luxury">
                <span className="text-white/60 uppercase font-bold">Select Size to Equip:</span>
                <span className="text-[var(--gold-accent)] font-bold">
                  {selectedSize} {bodyProfile?.preferredSize === selectedSize ? '(Your Saved Fit)' : ''}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap font-mono-luxury text-xs">
                {availableSizes.map((sz) => {
                  const isChosen = sz === selectedSize;
                  return (
                    <button
                      key={`sz-${sz}`}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`min-w-[44px] px-3 py-2 rounded-xl border transition-all text-center font-bold cursor-pointer ${
                        isChosen
                          ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)] shadow-md font-black scale-105'
                          : 'bg-white/5 border-white/15 text-white hover:border-white/30'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Real Store Wardrobe Selector Dock */}
          <div className="space-y-3 border-t border-white/10 pt-4">
            
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'native', label: 'Senator & Agbada' },
                { id: 'streetwear', label: 'Hoodies' },
                { id: 'tops', label: 'Tops' },
                { id: 'bottoms', label: 'Jeans' },
                { id: 'accessories', label: 'Footwear & Accs' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id as StudioCategory)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-mono-luxury font-bold uppercase transition-all shrink-0 cursor-pointer ${
                    activeCategory === tab.id
                      ? 'bg-[var(--gold-accent)] text-black shadow-md'
                      : 'bg-white/5 text-white/70 hover:text-white border border-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs font-mono-luxury">
              <span className="text-white/60 uppercase tracking-wider font-bold">
                Platform Inventory ({filteredProducts.length})
              </span>
              <span className="text-[10px] text-[var(--gold-accent)]">
                Tap garment to equip on model
              </span>
            </div>

            {/* Horizontal Garment Scroll Dock */}
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-2 pt-1">
              {filteredProducts.map((item) => {
                const isSelected = activeProduct.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedProductId(item.id);
                      if (item.sizes && item.sizes.length > 0) {
                        setSelectedSize(item.sizes[0]);
                      }
                      setActiveAngle('full_runway');
                    }}
                    className={`relative w-28 sm:w-32 h-36 rounded-2xl overflow-hidden border transition-all shrink-0 cursor-pointer text-left group bg-zinc-950 ${
                      isSelected
                        ? 'ring-2 ring-[var(--gold-accent)] border-[var(--gold-accent)] scale-105 shadow-xl'
                        : 'border-white/15 opacity-75 hover:opacity-100 hover:border-white/30'
                    }`}
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
                    
                    <div className="absolute bottom-2 inset-x-2 text-white">
                      <span className="text-[9px] font-mono-luxury font-bold text-[var(--gold-accent)] block truncate">
                        ₦{(item.price / 1000).toFixed(0)}k
                      </span>
                      <span className="text-[10px] font-editorial font-bold line-clamp-1 leading-tight text-white">
                        {item.name}
                      </span>
                      <span className="text-[8px] font-mono-luxury text-white/50 block truncate">
                        {item.vendorName}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[var(--gold-accent)] text-black flex items-center justify-center text-[10px] font-black shadow-md">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Add to Bag & Secondary Actions */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full py-4 rounded-2xl bg-[var(--gold-accent)] hover:bg-amber-400 text-black font-mono-luxury uppercase text-xs font-black tracking-widest transition-all shadow-[0_6px_25px_rgba(196,151,46,0.4)] flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4 stroke-[2.5]" />
              <span>Add This Look to Bag (₦{activeProduct.price.toLocaleString()})</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href={`/shop/${activeProduct.id}`}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-mono-luxury text-[10px] uppercase font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Product Page</span>
                <ArrowRight className="h-3 w-3" />
              </Link>

              <a
                href={`https://wa.me/2348000000000?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono-luxury text-[10px] uppercase font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <MessageSquare className="h-3 w-3" />
                <span>WhatsApp Atelier</span>
              </a>
            </div>
          </div>

        </div>

      </div>

      {/* 2. ATELIER TRUST & MEASUREMENT GUARANTEE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-[var(--gold-accent)] font-bold text-xs font-mono-luxury">
            <Store className="h-4 w-4" />
            <span className="uppercase">100% Platform Inventory</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
            Every garment fitted in this studio is available right now from independent Nigerian designers on Ìrísí—ready for direct delivery.
          </p>
        </div>

        <div className="p-5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono-luxury">
            <ShieldCheck className="h-4 w-4" />
            <span className="uppercase">Zero Pull Escrow Guarantee</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
            Your payment is held safely in Ìrísí Escrow. The artisan receives payout ONLY when your piece arrives and fits your measurements to perfection.
          </p>
        </div>

        <div className="p-5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs font-mono-luxury">
            <Zap className="h-4 w-4" />
            <span className="uppercase">Custom Sizing Concierge</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
            Need this Senator, Agbada, or Hoodie altered or customized in another fabric? Contact our direct concierge on WhatsApp for bespoke tailoring.
          </p>
        </div>
      </div>

    </div>
  );
}
