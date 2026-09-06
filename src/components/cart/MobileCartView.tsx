'use client';

import React from 'react';
import { useStore } from '@/lib/store/useStore';
import {
  Trash2, Plus, Minus, Store, Truck, ArrowRight, Sparkles,
  MapPin, Clock, ShoppingBag, ShieldCheck, ArrowLeft
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MobileCartView() {
  const router = useRouter();
  const { cart, removeFromCart, updateCartQuantity, clearCart } = useStore();

  // Group items by vendor
  const groupedItems = cart.reduce((acc, item) => {
    const vendorId = item.product.vendorId || 'boutique';
    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendorId,
        vendorName: item.product.vendorName,
        vendorCity: item.product.vendorCity || 'Lagos',
        vendorState: item.product.vendorState || 'Lagos State',
        dispatchDays: item.product.dispatchDays || '1-2 business days',
        shippingRates: item.product.shippingRates || {
          sameCity: 1000,
          closeHub: 2500,
          interstate: 4500,
        },
        items: [],
      };
    }
    acc[vendorId].items.push(item);
    return acc;
  }, {} as Record<string, {
    vendorId: string;
    vendorName: string;
    vendorCity: string;
    vendorState: string;
    dispatchDays: string;
    shippingRates: any;
    items: typeof cart;
  }>);

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const distinctVendorsCount = Object.keys(groupedItems).length;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-36 select-none animate-fadeIn">
      
      {/* 1. TOP FLOATING APP BAR */}
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-[var(--border-subtle)] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-editorial text-xl font-bold text-[var(--text-primary)] leading-tight">
              Shopping Bag
            </h1>
            <span className="text-[10px] font-mono-luxury text-[var(--gold-accent)] font-bold">
              {cart.reduce((s, i) => s + i.quantity, 0)} {cart.reduce((s, i) => s + i.quantity, 0) === 1 ? 'Piece' : 'Pieces'}
            </span>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-[11px] font-mono-luxury text-rose-400 hover:text-rose-300 font-bold uppercase transition-colors"
          >
            Clear Bag
          </button>
        )}
      </div>

      {/* 2. CART ITEMS LIST / EMPTY STATE */}
      <div className="p-4 space-y-4">
        {cart.length === 0 ? (
          <div className="p-12 rounded-3xl surface-card text-center space-y-4 border border-[var(--border-subtle)] my-8">
            <div className="h-16 w-16 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] flex items-center justify-center mx-auto border border-[var(--gold-accent)]/30 shadow-lg">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <h2 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
              Your Bag is Empty
            </h2>
            <p className="text-xs font-mono-luxury text-[var(--text-secondary)] max-w-xs mx-auto">
              Explore curated Nigerian ready-to-wear drops with instant escrow protection.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--gold-accent)] text-black font-mono-luxury uppercase text-xs font-bold shadow-xl active:scale-95 transition-transform"
            >
              <span>Explore Shop Catalog</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Vendor Packages Group */}
            {Object.values(groupedItems).map(({ vendorId, vendorName, vendorCity, vendorState, dispatchDays, items }) => (
              <div
                key={vendorId}
                className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4 shadow-sm"
              >
                {/* Vendor Header */}
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] flex items-center justify-center text-xs font-bold">
                      <Store className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-bold text-xs font-mono-luxury text-[var(--text-primary)]">
                      {vendorName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono-luxury text-[var(--text-secondary)]">
                    <MapPin className="h-3 w-3 text-[var(--gold-accent)]" />
                    <span>{vendorCity ? `${vendorCity}, ${vendorState}` : 'Lagos'}</span>
                  </div>
                </div>

                {/* Items in this Vendor Package */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]/60"
                    >
                      <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-black/40 shrink-0 border border-[var(--border-subtle)]">
                        <Image
                          src={item.product.imageUrl || '/images/products/BlackTrapStarHoodie.jpg'}
                          alt={item.product.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-xs text-[var(--text-primary)] truncate">
                          {item.product.name}
                        </h3>
                        <div className="text-[11px] font-mono-luxury text-[var(--text-secondary)] mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>Size: <strong className="text-[var(--gold-accent)]">{item.selectedSize}</strong></span>
                          {item.selectedColor?.name && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <span
                                  className="h-2.5 w-2.5 rounded-full border border-white/20 inline-block shrink-0"
                                  style={{ backgroundColor: item.selectedColor.hex || '#111111' }}
                                />
                                <span>{item.selectedColor.name}</span>
                              </span>
                            </>
                          )}
                        </div>
                        <div className="font-mono-luxury text-xs font-bold text-[var(--gold-accent)] mt-0.5">
                          ₦{Number(item.product.price || 0).toLocaleString()}
                        </div>
                      </div>

                      {/* Stepper Controls & Delete */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 rounded-lg text-[var(--text-muted)] hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        <div className="flex items-center rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-0.5">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-white cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 text-xs font-mono-luxury font-bold text-[var(--text-primary)]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-white cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono-luxury text-[var(--text-muted)] pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-emerald-400" />
                    <span>Dispatches in {dispatchDays}</span>
                  </span>
                  <span className="text-emerald-400 font-bold uppercase">
                    Ready-to-Wear
                  </span>
                </div>
              </div>
            ))}

            {/* Escrow Guarantee Pill */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-400 text-xs font-mono-luxury font-bold">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>100% Escrow Protection: Funds released only after delivery</span>
            </div>
          </>
        )}
      </div>

      {/* 3. FIXED FLOATING BOTTOM DOCK WITH TOTAL & CHECKOUT BUTTON */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#0a0a0c]/90 dark:bg-[#0a0a0c]/90 bg-white/95 backdrop-blur-2xl border-t border-black/10 dark:border-white/10 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3">
          <div>
            <span className="text-[9px] font-mono-luxury text-[var(--text-muted)] uppercase block">Estimated Subtotal:</span>
            <div className="font-editorial text-2xl font-bold text-amber-600 dark:text-[var(--gold-accent)] leading-none mt-0.5">
              ₦{subtotal.toLocaleString()}
            </div>
          </div>

          <Link
            href="/checkout"
            className="flex-1 max-w-[210px] py-3.5 px-4 rounded-2xl bg-[var(--gold-accent)] text-black font-mono-luxury uppercase text-xs font-bold hover:bg-[#d8b357] transition-all shadow-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

    </div>
  );
}
