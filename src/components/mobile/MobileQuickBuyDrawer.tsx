'use client';

import React, { useState } from 'react';
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
  const { bodyProfile, addToCart, setIsCartOpen } = useStore();

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
  const [isFitPredictorOpen, setIsFitPredictorOpen] = useState(false);

  const isOutOfStock = product.stockQuantity === 0;

  const handleAddBag = () => {
    if (isOutOfStock) return;
    setIsAdding(true);
    addToCart(product, selectedSize, selectedColor, quantity);

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#e6c367', '#ffffff', '#10b981']
    });

    setTimeout(() => {
      setIsAdding(false);
      onClose();
    }, 400);
  };

  const handleInstantBuy = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedSize, selectedColor, quantity);

    onClose();
    router.push('/checkout');
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

        {/* Colorway Selection if multiple available */}
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
            className="py-3.5 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono-luxury uppercase text-xs font-bold hover:border-[var(--gold-accent)] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-40"
          >
            <ShoppingBag className="h-4 w-4 text-[var(--gold-accent)]" />
            <span>{isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
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
