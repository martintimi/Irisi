'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/types';
import { useStore } from '@/lib/store/useStore';
import { calculateFitMatch } from '@/lib/utils/sizingEngine';
import {
  X, Sparkles, ShoppingBag, Bookmark, ArrowRight, Check,
  Ruler, Store
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

interface ProductQuickLookModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductQuickLookModal({ product, onClose }: ProductQuickLookModalProps) {
  const router = useRouter();
  const {
    bodyProfile,
    activeOutfit,
    setOutfitItem,
    removeOutfitItem,
    addToCart,
    toggleVaultItem,
    isInVault,
  } = useStore();

  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      const fit = calculateFitMatch(bodyProfile, product);
      setSelectedSize(fit.recommendedSize || product.sizes?.[0] || 'M');
      setSelectedColor(product.colors?.[0] || { name: 'Standard', hex: '#111111' });
      setQuantity(1);
    }
  }, [product, bodyProfile]);

  if (!product) return null;

  const fitResult = calculateFitMatch(bodyProfile, product);
  const isWorn = activeOutfit[product.category]?.id === product.id;
  const isSaved = isInVault(product.id);

  const currentStock = product.sizeStock && selectedSize && product.sizeStock[selectedSize] !== undefined
    ? product.sizeStock[selectedSize]
    : (product.stockQuantity ?? 15);

  const handleTryOn = () => {
    if (isWorn) {
      removeOutfitItem(product.category);
    } else {
      setOutfitItem(product);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    confetti({ particleCount: 55, spread: 65, origin: { y: 0.6 } });
  };

  const handleToggleVault = () => {
    toggleVaultItem(product);
    if (!isSaved) {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#e6c367', '#f59e0b', '#ffffff']
      });
    }
  };

  const handleViewFullDetails = () => {
    onClose();
    router.push(`/shop/${product.id}`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop Fade */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window with Scale & Fade Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
          className="relative w-full max-w-3xl rounded-3xl surface-card border border-[var(--border-subtle)] shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row max-h-[90vh]"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/90 transition-all backdrop-blur-md shadow-md"
            title="Close preview"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Left: Visual Lookbook Image */}
          <div className="relative w-full md:w-1/2 h-72 md:h-auto min-h-[320px] bg-black shrink-0 overflow-hidden group">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              unoptimized
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            {product.videoUrl && (
              <video
                src={product.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Sizing Match Pill */}
            <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-black/85 backdrop-blur-md border border-white/10 flex items-center justify-between z-10 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono-luxury text-emerald-400 font-bold uppercase">
                  {fitResult.matchScore}% Bespoke Fit Match
                </span>
              </div>
              <span className="text-xs font-mono-luxury text-white font-bold bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30">
                Size {fitResult.recommendedSize}
              </span>
            </div>
          </div>

          {/* Right: Garment Editorial Dossier & Actions */}
          <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="space-y-4">
              {/* Atelier & Origin */}
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/brand/${encodeURIComponent(product.vendorName)}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold hover:underline"
                >
                  <Store className="h-3.5 w-3.5" />
                  <span>{product.vendorName}</span>
                </Link>

                <span className="text-[10px] font-mono-luxury uppercase px-2.5 py-0.5 rounded-full bg-[var(--badge-bg)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-semibold">
                  {product.garmentOriginType === 'handmade_designer' ? 'Bespoke Atelier' : 'Ready-to-Wear'}
                </span>
              </div>

              {/* Title */}
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-tight">
                {product.name}
              </h2>

              {/* Price & Stock */}
              <div className="flex items-baseline gap-3 pt-1">
                <span className="font-editorial text-2xl sm:text-3xl font-bold text-amber-600 dark:text-[var(--gold-accent)] drop-shadow-sm">
                  ₦{Number(product.price).toLocaleString()}
                </span>
                <span className="text-xs font-mono-luxury text-emerald-500 font-bold">
                  ● 24h Express Dispatch
                </span>
              </div>

              {/* Sizing & Live Remaining Stock Status */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-mono-luxury">
                  <span className="text-[var(--text-secondary)] uppercase font-bold">Choose Size:</span>
                  {currentStock === 0 ? (
                    <span className="text-rose-400 font-bold">Out of Stock</span>
                  ) : currentStock <= 5 ? (
                    <span className="text-amber-500 font-bold animate-pulse inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      <span>Only {currentStock} left in Size {selectedSize}!</span>
                    </span>
                  ) : (
                    <span className="text-emerald-500 font-bold">● {currentStock} in stock</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(product.sizes || ['S', 'M', 'L', 'XL', 'XXL']).map((sz) => {
                    const isSelected = selectedSize === sz;
                    const szStock = product.sizeStock?.[sz];
                    const isOutOfStock = szStock === 0;

                    return (
                      <button
                        key={sz}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => setSelectedSize(sz)}
                        className={`h-9 min-w-10 px-3 rounded-xl font-mono-luxury text-xs font-bold transition-all border ${
                          isOutOfStock
                            ? 'opacity-40 line-through cursor-not-allowed bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                            : isSelected
                            ? 'bg-[var(--gold-subtle)] border-[var(--gold-accent)] text-[var(--gold-accent)] shadow-sm ring-1 ring-[var(--gold-accent)]/30'
                            : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Selector if available */}
              {product.colors && product.colors.length > 1 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-mono-luxury">
                    <span className="text-[var(--text-secondary)] uppercase font-bold">Color:</span>
                    <span className="text-[var(--gold-accent)] font-bold">{selectedColor?.name || 'Standard'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((c: any, i: number) => {
                      const cName = typeof c === 'string' ? c : c.name;
                      const cHex = typeof c === 'object' && c.hex ? c.hex : '#111111';
                      const isChosen = selectedColor?.name === cName;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedColor(typeof c === 'object' ? c : { name: cName, hex: cHex })}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono-luxury border transition-all cursor-pointer ${
                            isChosen
                              ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-transparent ring-1 ring-[var(--gold-accent)]'
                              : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                          }`}
                        >
                          <span className="h-2.5 w-2.5 rounded-full border border-white/20" style={{ backgroundColor: cHex }} />
                          <span>{cName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-mono-luxury uppercase font-bold text-[var(--text-secondary)]">
                  Quantity:
                </span>
                <div className="flex items-center bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-[var(--text-primary)] disabled:opacity-30 cursor-pointer font-bold"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono-luxury font-bold text-[var(--text-primary)] px-2 min-w-[20px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.min(currentStock || 15, q + 1))}
                    disabled={quantity >= (currentStock || 15)}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-[var(--text-primary)] disabled:opacity-30 cursor-pointer font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                {product.description}
              </p>

              {/* Sizing Fit Feedback */}
              <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-1 text-xs font-mono-luxury">
                <div className="flex items-center gap-1.5 text-[var(--text-primary)] font-bold">
                  <Ruler className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                  <span>Atelier Sizing Precision</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] font-light">
                  {(fitResult.insights && fitResult.insights[0]) || 'Tailored to drape naturally over standard Nigerian silhouette metrics.'}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-mono-luxury uppercase px-2.5 py-0.5 rounded-md bg-[var(--badge-bg)] border border-[var(--border-subtle)] text-[var(--text-muted)]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
              <div className="grid grid-cols-2 gap-2">
                {/* Style Look */}
                <button
                  onClick={handleTryOn}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-full text-xs font-mono-luxury uppercase tracking-wider font-bold transition-all shadow-sm ${
                    isWorn
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                      : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] hover:text-[var(--gold-accent)]'
                  }`}
                >
                  {isWorn ? (
                    <>
                      <Check className="h-4 w-4 stroke-[3]" />
                      <span>On Model</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-[var(--gold-accent)]" />
                      <span>Style Look</span>
                    </>
                  )}
                </button>

                {/* Add to Bag */}
                <button
                  onClick={handleAddToCart}
                  disabled={currentStock === 0}
                  className="flex items-center justify-center gap-2 py-3 px-3 rounded-full text-xs font-mono-luxury uppercase tracking-wider font-bold bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>{currentStock === 0 ? 'Out of Stock' : 'Add to Bag'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Curate / Save to Vault */}
                <button
                  onClick={handleToggleVault}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full text-xs font-mono-luxury uppercase font-bold border transition-all ${
                    isSaved
                      ? 'bg-[var(--gold-subtle)] text-[var(--gold-accent)] border-[var(--gold-accent)]/50'
                      : 'surface-card border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
                  <span>{isSaved ? 'In Curated Vault' : 'Save to Vault'}</span>
                </button>

                {/* View Full Page */}
                <button
                  onClick={handleViewFullDetails}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full text-xs font-mono-luxury uppercase font-bold surface-card border border-[var(--border-subtle)] text-[var(--gold-accent)] hover:border-[var(--gold-accent)] transition-all"
                >
                  <span>View Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
