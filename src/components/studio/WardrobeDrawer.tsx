'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/useStore';
import { GarmentCategory, GarmentOriginType } from '@/types';
import { calculateFitMatch } from '@/lib/utils/sizingEngine';
import { products as initialProducts } from '@/lib/data/products';
import { Sparkles, Check, Plus, Scissors, ShoppingBag } from 'lucide-react';
import Image from 'next/image';

export default function WardrobeDrawer() {
  const {
    bodyProfile,
    activeOutfit,
    setOutfitItem,
    removeOutfitItem,
    addToCart,
    allProducts,
    fetchProductsFromDb,
    selectedGender,
    setSelectedGender,
    selectedOriginType,
    setSelectedOriginType,
  } = useStore();

  const [activeCategory, setActiveCategory] = useState<GarmentCategory | 'all'>('tops');

  // Load latest real products from database on mount
  useEffect(() => {
    fetchProductsFromDb();
  }, [fetchProductsFromDb]);

  const catalog = (allProducts && allProducts.length > 0) ? allProducts : initialProducts;

  const categories: { id: GarmentCategory | 'all'; stepNum: string; label: string }[] = [
    { id: 'tops', stepNum: 'Step 1', label: selectedGender === 'female' ? 'Ankara / Tops' : 'Senators / Tops' },
    { id: 'bottoms', stepNum: 'Step 2', label: 'Trousers & Denim' },
    { id: 'footwear', stepNum: 'Step 3', label: 'Shoes & Slides' },
    { id: 'outerwear', stepNum: 'Layer', label: 'Agbada & Robes' },
    { id: 'accessories', stepNum: 'Extra', label: 'Fila & Accs' },
    { id: 'all', stepNum: 'All', label: 'All Catalog' },
  ];

  const filteredProducts = catalog.filter((item) => {
    const pGender = String(item.genderTarget || '').toLowerCase();
    const sGender = String(selectedGender || '').toLowerCase();
    const matchesGender = 
      pGender === 'unisex' ||
      pGender === sGender ||
      (sGender === 'male' && (pGender === 'male' || pGender === 'men' || pGender === 'man')) ||
      (sGender === 'female' && (pGender === 'female' || pGender === 'women' || pGender === 'woman'));

    const pOrigin = String(item.garmentOriginType || '').toLowerCase();
    const sOrigin = String(selectedOriginType || '').toLowerCase();
    const matchesOrigin = 
      sOrigin === 'all' || 
      (sOrigin === 'handmade_designer' && (pOrigin === 'handmade_designer' || pOrigin === 'bespoke_atelier')) ||
      (sOrigin === 'ready_made_boutique' && pOrigin === 'ready_made_boutique') ||
      pOrigin === sOrigin;

    const n = (item.name || '').toLowerCase();
    const matchesCat = activeCategory === 'all'
      ? true
      : activeCategory === 'tops'
      ? item.category === 'tops' || n.includes('hoodie') || n.includes('sweatshirt') || n.includes('shirt') || n.includes('top')
      : activeCategory === 'bottoms'
      ? item.category === 'bottoms' || n.includes('jean') || n.includes('trouser') || n.includes('pant') || n.includes('adiddas')
      : activeCategory === 'footwear'
      ? item.category === 'footwear' || n.includes('slide') || n.includes('shoe')
      : activeCategory === 'outerwear'
      ? item.category === 'outerwear' || n.includes('agbada') || n.includes('jacket')
      : activeCategory === 'accessories'
      ? item.category === 'accessories' || n.includes('cap') || n.includes('chain')
      : item.category === activeCategory;

    return matchesGender && matchesOrigin && matchesCat;
  });

  return (
    <div className="flex flex-col h-full max-h-full rounded-3xl surface-card p-5 overflow-hidden">
      
      {/* Top Filter Bar: Gender Switch + Handmade vs ReadyMade Filter */}
      <div className="pb-3 border-b border-[var(--border-subtle)] space-y-3 shrink-0">
        
        {/* Gender Toggle & Header */}
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold">
            Outfit Clothes Vault
          </div>

          <div className="flex items-center p-0.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
            <button
              onClick={() => setSelectedGender('male')}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono-luxury uppercase transition-all ${
                selectedGender === 'male'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Men
            </button>
            <button
              onClick={() => setSelectedGender('female')}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono-luxury uppercase transition-all ${
                selectedGender === 'female'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Women
            </button>
          </div>
        </div>

        {/* Handmade Designers vs Ready-Made Boutiques Filter */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[10px] font-mono-luxury uppercase">
          <button
            onClick={() => setSelectedOriginType('all')}
            className={`py-1.5 px-2 rounded-lg transition-all text-center ${
              selectedOriginType === 'all'
                ? 'bg-[var(--badge-bg)] text-[var(--text-primary)] font-bold border border-[var(--border-subtle)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            All Pieces
          </button>
          <button
            onClick={() => setSelectedOriginType('handmade_designer')}
            className={`py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
              selectedOriginType === 'handmade_designer'
                ? 'bg-[var(--gold-subtle)] text-[var(--gold-accent)] font-bold border border-[var(--gold-accent)]/20'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <Scissors className="h-3 w-3" />
            <span>Handmade</span>
          </button>
          <button
            onClick={() => setSelectedOriginType('ready_made_boutique')}
            className={`py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
              selectedOriginType === 'ready_made_boutique'
                ? 'bg-[var(--gold-subtle)] text-[var(--gold-accent)] font-bold border border-[var(--gold-accent)]/20'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <ShoppingBag className="h-3 w-3" />
            <span>Ready-Made</span>
          </button>
        </div>

        {/* Step Categories */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-2 rounded-2xl text-xs font-mono-luxury uppercase tracking-wider whitespace-nowrap transition-all flex flex-col items-start ${
                activeCategory === cat.id
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <span className="text-[9px] opacity-70 uppercase font-light">{cat.stepNum}</span>
              <span className="font-semibold">{cat.label}</span>
            </button>
          ))}
        </div>

      </div>

      {/* Product Items List */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-3 mt-3 overscroll-contain">
        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)] font-light">
            No garments match this filter. Switch category or gender above.
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isWorn = activeOutfit[product.category]?.id === product.id;
            const fitResult = calculateFitMatch(bodyProfile, product);

            return (
              <div
                key={product.id}
                className={`group relative p-3 rounded-2xl border transition-all duration-300 flex items-center gap-3.5 ${
                  isWorn
                    ? 'bg-[var(--gold-subtle)] border-[var(--gold-accent)]/50 shadow-md ring-1 ring-[var(--gold-accent)]/30'
                    : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] hover:border-[var(--border-hover)]'
                }`}
              >
                {/* Image */}
                <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-[var(--bg-secondary)] shrink-0 border border-[var(--border-subtle)]">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Origin Badge */}
                  <div className="absolute top-1 left-1">
                    <span className="text-[8px] font-mono-luxury px-1.5 py-0.5 rounded bg-black/80 text-white font-bold">
                      {product.garmentOriginType === 'handmade_designer' ? 'Handmade' : 'Ready-Made'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono-luxury text-[var(--gold-accent)] uppercase font-semibold">
                      {product.vendorName}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate mt-0.5">
                    {product.name}
                  </h4>

                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-mono-luxury font-medium">
                      <Sparkles className="h-2.5 w-2.5" />
                      <span>{fitResult.matchScore}% Match · Size {fitResult.recommendedSize}</span>
                    </div>

                    <span className="text-xs font-mono-luxury font-semibold text-[var(--text-primary)]">
                      ₦{product.price.toLocaleString()}
                    </span>
                  </div>

                  {/* Wear & Add Buttons */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => {
                        if (isWorn) {
                          removeOutfitItem(product.category);
                        } else {
                          setOutfitItem(product);
                        }
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-[11px] font-mono-luxury uppercase tracking-wider font-semibold transition-all ${
                        isWorn
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                          : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)]'
                      }`}
                    >
                      {isWorn ? (
                        <>
                          <Check className="h-3 w-3 stroke-[3]" />
                          <span>Selected on Model</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 text-[var(--gold-accent)]" />
                          <span>Wear on Model</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => addToCart(product, fitResult.recommendedSize)}
                      className="p-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--badge-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors"
                      title="Add directly to Bag"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
