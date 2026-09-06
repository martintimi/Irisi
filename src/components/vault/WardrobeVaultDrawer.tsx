'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store/useStore';
import {
  X, Bookmark, Trash2, ShoppingBag, Sparkles, ArrowRight, Store, Check
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

export default function WardrobeVaultDrawer() {
  const router = useRouter();
  const {
    vault,
    isVaultOpen,
    setIsVaultOpen,
    toggleVaultItem,
    clearVault,
    activeOutfit,
    setOutfitItem,
    removeOutfitItem,
    addToCart,
    bodyProfile
  } = useStore();

  const handleTryOn = (product: any) => {
    const isWorn = activeOutfit[product.category as keyof typeof activeOutfit]?.id === product.id;
    if (isWorn) {
      removeOutfitItem(product.category);
    } else {
      setOutfitItem(product);
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    }
  };

  const handleAddAllToBag = () => {
    vault.forEach((p) => addToCart(p));
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    setIsVaultOpen(false);
  };

  return (
    <AnimatePresence>
      {isVaultOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Smooth Backdrop Fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            onClick={() => setIsVaultOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />

          {/* Sliding Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320, mass: 0.8 }}
            className="relative w-full max-w-lg h-full bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] shadow-2xl flex flex-col justify-between overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--gold-subtle)] text-[var(--gold-accent)]">
                  <Bookmark className="h-4 w-4 fill-current" />
                </div>
                <div>
                  <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                    Curated Wardrobe Vault
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-mono-luxury uppercase">
                    {vault.length} {vault.length === 1 ? 'Saved Piece' : 'Saved Pieces'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {vault.length > 0 && (
                  <button
                    onClick={clearVault}
                    className="p-2 rounded-full text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                    title="Clear vault"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsVaultOpen(false)}
                  className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  title="Close vault"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {vault.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--gold-accent)]">
                    <Bookmark className="h-8 w-8" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <h4 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                      Your Vault is Empty
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] font-light">
                      Curate luxury native Kaftans, Agbadas, and designer streetwear by tapping the bookmark icon on any piece.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsVaultOpen(false)}
                    className="px-6 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury text-xs uppercase font-bold hover:opacity-90 transition-all shadow-md"
                  >
                    Explore Shop Catalog
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {vault.map((product) => {
                    const isWorn = activeOutfit[product.category]?.id === product.id;
                    return (
                      <div
                        key={product.id}
                        className="p-4 rounded-2xl surface-card border border-[var(--border-subtle)] flex gap-4 items-center group transition-all"
                      >
                        {/* Thumbnail */}
                        <div className="relative h-20 w-16 rounded-xl overflow-hidden bg-black shrink-0 border border-[var(--border-subtle)]">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold truncate">
                              {product.vendorName}
                            </span>
                            <button
                              onClick={() => toggleVaultItem(product)}
                              className="text-[var(--text-muted)] hover:text-rose-500 p-1 transition-colors"
                              title="Remove from vault"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <Link
                            href={`/shop/${product.id}`}
                            onClick={() => setIsVaultOpen(false)}
                            className="block hover:text-[var(--gold-accent)] transition-colors"
                          >
                            <h4 className="font-editorial text-base font-bold text-[var(--text-primary)] truncate">
                              {product.name}
                            </h4>
                          </Link>

                          <div className="flex items-baseline gap-2">
                            <span className="font-editorial text-base font-bold text-amber-600 dark:text-[var(--gold-accent)]">
                              ₦{product.price.toLocaleString()}
                            </span>
                          </div>

                          {/* Action Row */}
                          <div className="flex items-center gap-2 pt-2">
                            {/* Desktop: Style Look and Bag. Mobile: Clean full-width Add to Bag */}
                            <button
                              onClick={() => handleTryOn(product)}
                              className={`hidden md:flex flex-1 py-1.5 px-2.5 rounded-full text-[10px] font-mono-luxury uppercase font-bold items-center justify-center gap-1 border transition-all ${
                                isWorn
                                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                                  : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:border-[var(--gold-accent)]'
                              }`}
                            >
                              {isWorn ? (
                                <>
                                  <Check className="h-3 w-3 stroke-[3]" />
                                  <span>On Model</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3 w-3 text-[var(--gold-accent)]" />
                                  <span>Style Look</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => {
                                addToCart(product);
                                confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
                              }}
                              className="w-full md:w-auto py-1.5 px-3 rounded-full text-[10px] font-mono-luxury uppercase font-bold bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 flex items-center justify-center gap-1 transition-all cursor-pointer"
                            >
                              <ShoppingBag className="h-3 w-3" />
                              <span>Add to Bag</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {vault.length > 0 && (
              <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] space-y-3">
                <button
                  onClick={handleAddAllToBag}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase tracking-widest font-bold text-xs hover:opacity-90 transition-all shadow-lg group"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Move All to Shopping Bag ({vault.length})</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
