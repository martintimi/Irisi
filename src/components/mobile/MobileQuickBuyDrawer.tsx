'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useStore } from '@/lib/store/useStore';
import { X, Check, ShoppingBag, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import FitPredictorModal from '@/components/shop/FitPredictorModal';

interface QuickBuyDrawerProps {
  product: any | null;
  onClose: () => void;
}

export default function MobileQuickBuyDrawer({ product, onClose }: QuickBuyDrawerProps) {
  const router = useRouter();
  const { bodyProfile, addToCart, setIsCartOpen, userAuth } = useStore();

  if (!product) return null;

  const pref = bodyProfile?.preferredSize || 'M';
  const isAccessory = product.category === 'accessories';
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
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isFitPredictorOpen, setIsFitPredictorOpen] = useState(false);

  useEffect(() => {
    if (product) {
      const pref = bodyProfile?.preferredSize || 'M';
      const available = product.sizes && product.sizes.length > 0 ? product.sizes : ['M', 'L', 'XL'];
      setSelectedSize(available.includes(pref) ? pref : (available[0] || 'M'));
      if (product.colors && product.colors.length > 0) {
        setSelectedColor(product.colors[0]);
      } else {
        setSelectedColor({ name: 'Standard', hex: '#111111' });
      }
    }
  }, [product?.id, bodyProfile?.preferredSize]);

  const isOutOfStock = product.stockQuantity === 0;

  const handleAddBag = () => {
    if (isOutOfStock) return;
    setIsAdding(true);
    setIsAdded(true);
    addToCart(product, selectedSize, selectedColor, quantity);

    try {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.8 },
        colors: ['#e6c367', '#10b981', '#ffffff']
      });
    } catch {}

    setTimeout(() => {
      setIsAdding(false);
      setIsAdded(false);
      onClose();
    }, 750);
  };

  const handleInstantBuy = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedSize, selectedColor, quantity);

    onClose();
    if (!userAuth?.isLoggedIn) {
      router.push('/auth?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center select-none animate-fadeIn">
      {/* Drawer Card */}
      <div className="w-full max-w-md surface-card rounded-t-3xl border-t border-x border-[var(--border-subtle)] p-6 space-y-5 shadow-2xl animate-slideUp">
        
        {/* Drawer Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-3.5">
            <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-black/40 border border-[var(--border-subtle)] shrink-0">
              <Image
                src={product.imageUrl || '/images/products/BlackTrapStarHoodie.jpg'}
                alt={product.name}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div>
              <span className="text-[10px] font-mono-luxury text-[var(--gold-accent)] uppercase font-bold">
                {product.vendorName || 'Ìrísí Boutique'}
              </span>
              <h3 className="font-bold text-sm text-[var(--text-primary)] line-clamp-1">
                {product.name}
              </h3>
              <div className="text-sm font-mono-luxury font-bold text-[var(--gold-accent)] mt-0.5">
                ₦{Number(product.price || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 1-Tap Ready-to-Wear Size Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono-luxury">
            <div className="flex items-center gap-2">
              <span className="uppercase text-[var(--text-secondary)] font-bold">Select Size:</span>
              {!isAccessory && (
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
            <span className="text-[var(--gold-accent)] font-bold">Size: {selectedSize}</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {availableSizes.map((sz: string) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSelectedSize(sz)}
                className={`py-2.5 rounded-xl border text-xs font-mono-luxury font-bold transition-all cursor-pointer ${
                  selectedSize === sz
                    ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)] shadow-md'
                    : 'surface-card border-[var(--border-subtle)] text-[var(--text-secondary)]'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Colorway Selection */}
        {product.colors && product.colors.length > 1 && (
          <div className="space-y-2">
            <span className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] font-bold">
              Select Color: <strong className="text-[var(--text-primary)]">{selectedColor?.name || 'Standard'}</strong>
            </span>
            <div className="flex items-center gap-2.5">
              {product.colors.map((c: any, idx: number) => {
                const colorName = typeof c === 'string' ? c : (c.name || 'Standard');
                const colorHex = typeof c === 'object' && c?.hex ? c.hex : '#111111';
                const isSelected = selectedColor?.name === colorName || selectedColor?.hex === colorHex;
                return (
                  <button
                    key={`color-pill-${colorName}-${idx}`}
                    type="button"
                    onClick={() => setSelectedColor(typeof c === 'object' ? c : { name: colorName, hex: colorHex })}
                    className={`h-7 w-7 rounded-full border-2 transition-transform cursor-pointer ${
                      isSelected
                        ? 'border-[var(--gold-accent)] scale-110 shadow-md ring-2 ring-[var(--gold-accent)]/30'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: colorHex }}
                    title={colorName}
                  />
                );
              })}
            </div>
          </div>
        )}

        {product.colors && product.colors.length === 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-luxury uppercase text-[var(--text-secondary)] font-bold">
              Color:
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              {selectedColor?.name && selectedColor.name.toLowerCase() !== 'as pictured' && selectedColor.name.toLowerCase() !== 'standard' && (
                <span
                  className="h-2.5 w-2.5 rounded-full border border-white/20 shrink-0"
                  style={{
                    background: (selectedColor?.name || '').toLowerCase().includes('multi')
                      ? 'conic-gradient(from 180deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #f59e0b, #ef4444, #ec4899)'
                      : (selectedColor?.hex || '#111111')
                  }}
                />
              )}
              <span className="text-xs font-bold text-[var(--text-primary)] font-mono-luxury">
                {selectedColor?.name || 'Standard'}
              </span>
            </div>
          </div>
        )}

        {/* Quantity & Escrow Badge */}
        <div className="flex items-center justify-between pt-1 text-xs font-mono-luxury">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)] font-bold">Quantity:</span>
            <div className="flex items-center border border-[var(--border-subtle)] rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-2.5 py-1 text-sm text-[var(--text-secondary)] hover:text-white"
              >
                -
              </button>
              <span className="px-2.5 py-1 font-bold text-[var(--text-primary)]">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="px-2.5 py-1 text-sm text-[var(--text-secondary)] hover:text-white"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Verified Piece</span>
          </div>
        </div>

        {/* Dual Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleAddBag}
            disabled={isAdding || isOutOfStock}
            className={`py-3.5 rounded-full border text-[var(--text-primary)] font-mono-luxury uppercase text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-40 active:scale-95 ${
              isAdded
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'surface-card border-[var(--border-subtle)] hover:border-[var(--gold-accent)]'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400">Added to Bag! ✓</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4 text-[var(--gold-accent)]" />
                <span>{isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleInstantBuy}
            disabled={isOutOfStock}
            className="py-3.5 rounded-full bg-[var(--gold-accent)] text-black font-mono-luxury uppercase text-xs font-bold hover:bg-[#d8b357] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xl disabled:opacity-40"
          >
            <Zap className="h-4 w-4 fill-current text-black" />
            <span>{isOutOfStock ? 'Out of Stock' : 'Instant Buy'}</span>
          </button>
        </div>

      </div>

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
