'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store/useStore';
import { vendors } from '@/lib/data/vendors';
import { X, Trash2, Plus, Minus, Check, Sparkles, Truck, ArrowRight, Store, Lock } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function SplitCartDrawer() {
  const router = useRouter();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    bodyProfile,
    userAuth,
    setIsAuthModalOpen
  } = useStore();

  const groupedItems = cart.reduce((acc, item) => {
    const vendorId = item.product.vendorId;
    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendor: vendors.find(v => v.id === vendorId) || {
          id: vendorId,
          name: item.product.vendorName,
          code: 'VY',
          deliveryDays: '1 - 2 business days (Lagos)',
          shippingFee: 2000,
        },
        items: [],
      };
    }
    acc[vendorId].items.push(item);
    return acc;
  }, {} as Record<string, { vendor: any; items: typeof cart }>);

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const distinctVendors = Object.keys(groupedItems).length;
  const grandTotal = subtotal;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    if (!userAuth?.isLoggedIn) {
      router.push('/auth?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Smooth Backdrop Fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />

          {/* Smooth Spring Sliding Drawer */}
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
              <Store className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                Your Shopping Bag
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-mono-luxury uppercase">
                {cart.length} {cart.length === 1 ? 'Garment' : 'Garments'} · {distinctVendors} {distinctVendors === 1 ? 'Brand' : 'Brands'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 text-[var(--text-muted)] space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center">
                <Store className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)] font-mono-luxury uppercase">
                Shopping Bag Empty
              </p>
              <p className="text-xs max-w-xs text-[var(--text-secondary)] font-light">
                Explore our catalog to mix and match Senator sets, hoodies, and shoes.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(groupedItems).map(({ vendor, items }) => (
                <div
                  key={vendor.id}
                  className="rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                    <div>
                      <span className="text-[10px] font-mono-luxury text-[var(--gold-accent)] font-bold uppercase tracking-wider block">
                        Atelier / Boutique
                      </span>
                      <h4 className="font-bold text-xs text-[var(--text-primary)]">{vendor.name}</h4>
                    </div>
                    <span className="text-[10px] font-mono-luxury text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                      ● Direct Atelier Dispatch
                    </span>
                  </div>

                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-[var(--bg-secondary)] shrink-0 border border-[var(--border-subtle)]">
                            <Image src={item.product.imageUrl} alt={item.product.name} fill unoptimized className="object-cover" />
                          </div>
                          <div className="truncate">
                            <h5 className="font-bold text-xs text-[var(--text-primary)] truncate max-w-[170px]">{item.product.name}</h5>
                            <div className="text-[10px] font-mono-luxury text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span>Size: <strong className="text-[var(--text-primary)]">{item.selectedSize}</strong></span>
                              {item.selectedColor?.name && (
                                <>
                                  <span>·</span>
                                  <span className="flex items-center gap-1">
                                    {item.selectedColor.name.toLowerCase() !== 'as pictured' && item.selectedColor.name.toLowerCase() !== 'standard' && (
                                      <span
                                        className="h-2 w-2 rounded-full border border-white/20 inline-block shrink-0"
                                        style={{ backgroundColor: item.selectedColor.hex || '#111111' }}
                                      />
                                    )}
                                    <span>{item.selectedColor.name}</span>
                                  </span>
                                </>
                              )}
                              <span>·</span>
                              <span>₦{item.product.price.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg p-1">
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-mono-luxury text-[var(--text-primary)] px-1">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] space-y-4">
            <div className="space-y-1.5 text-xs font-mono-luxury">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Items Subtotal</span>
                <span className="font-bold text-[var(--text-primary)]">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Delivery Fee</span>
                <span className="text-[var(--gold-accent)] font-semibold">
                  Calculated at Checkout
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[var(--text-primary)] pt-2 border-t border-[var(--border-subtle)]">
                <span>Subtotal</span>
                <span className="font-editorial text-2xl font-bold text-[var(--gold-accent)]">₦{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase tracking-widest font-bold text-xs hover:opacity-90 transition-all shadow-lg group"
            >
              <Lock className="h-4 w-4" />
              <span>Proceed to Checkout (₦{grandTotal.toLocaleString()})</span>
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
