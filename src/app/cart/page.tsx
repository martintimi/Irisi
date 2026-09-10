'use client';

import React from 'react';
import { useStore } from '@/lib/store/useStore';
import { Trash2, Plus, Minus, Store, Truck, ArrowRight, Sparkles, Check, MapPin, Clock, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MobileCartView from '@/components/cart/MobileCartView';

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateCartQuantity, clearCart, userAuth } = useStore();

  const handleProceedToCheckout = () => {
    if (!userAuth?.isLoggedIn) {
      router.push('/auth?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  // Group items by vendor
  const groupedItems = cart.reduce((acc, item) => {
    const vendorId = item.product.vendorId || 'boutique';
    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendorId,
        vendorName: item.product.vendorName,
        vendorCity: item.product.vendorCity || 'Ijebu-Ode',
        vendorState: item.product.vendorState || 'Ogun State',
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
    <>
      {/* 1. DEDICATED MOBILE CART VIEW */}
      <div className="block md:hidden">
        <MobileCartView />
      </div>

      {/* 2. DESKTOP LUXURY CART VIEW */}
      <div className="hidden md:block mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 space-y-10 pb-20 animate-fadeIn">
      
      <div className="pb-6 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-luxury text-[var(--gold-accent)] uppercase tracking-widest mb-1 font-bold">
            <Store className="h-3.5 w-3.5" />
            <span>Ready-to-Wear Shopping Bag</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)]">
            Your Shopping Bag
          </h1>
        </div>

        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs font-mono-luxury text-rose-400 hover:text-rose-300 transition-colors uppercase self-start sm:self-auto"
          >
            Clear Entire Bag
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="p-16 rounded-3xl surface-card text-center space-y-5 border border-[var(--border-subtle)]">
          <p className="text-base text-[var(--text-secondary)] font-light">Your shopping bag is currently empty.</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase tracking-widest text-xs font-bold hover:opacity-90 transition-all shadow-md"
          >
            <span>Browse Ready-to-Wear Clothes</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Vendor Packages List */}
          <div className="lg:col-span-8 space-y-6">
            {Object.values(groupedItems).map(({ vendorId, vendorName, vendorCity, vendorState, dispatchDays, items }) => (
              <div key={vendorId} className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-5 shadow-sm">
                
                {/* Vendor Header with Location */}
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-[var(--gold-accent)]" />
                    <span className="font-bold text-sm text-[var(--text-primary)]">{vendorName}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono-luxury text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                      <span>{vendorCity ? `Ships from ${vendorCity}${vendorState ? `, ${vendorState}` : ''}` : 'Verified Store Dispatch'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400 font-bold">
                      <Clock className="h-3 w-3" />
                      <span>{dispatchDays}</span>
                    </div>
                  </div>
                </div>

                {/* Items from this vendor */}
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={`${item.product.id}-${item.selectedSize}`} className="flex items-center justify-between gap-4 py-2 border-b border-[var(--border-subtle)]/50 last:border-0">
                      
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-[var(--bg-secondary)] shrink-0 border border-[var(--border-subtle)]">
                          <Image src={item.product.imageUrl} alt={item.product.name} fill unoptimized className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate">{item.product.name}</h4>
                          <div className="text-[11px] font-mono-luxury text-[var(--text-secondary)]">
                            Size: <strong className="text-[var(--text-primary)]">{item.selectedSize}</strong>
                          </div>
                          <div className="text-xs font-mono-luxury text-[var(--gold-accent)] font-bold mt-0.5">
                            ₦{Number(item.product.price).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {/* Quantity Stepper */}
                        <div className="flex items-center rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-1">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2.5 text-xs font-mono-luxury font-bold text-[var(--text-primary)]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-2 rounded-xl text-[var(--text-muted)] hover:text-rose-400 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>

          {/* Right Column: Checkout Summary */}
          <div className="lg:col-span-4 p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-6 shadow-md sticky lg:top-24">
            <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs font-mono-luxury">
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Items Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} pcs):</span>
                <span className="font-bold text-[var(--text-primary)]">₦{subtotal.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Vendor Packages:</span>
                <span className="font-bold text-[var(--gold-accent)]">{distinctVendorsCount} Package{distinctVendorsCount > 1 ? 's' : ''}</span>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-1 text-[11px] text-[var(--text-secondary)]">
                <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                  <Truck className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                  <span>Calculated at Checkout</span>
                </div>
                <p>
                  Delivery fee is calculated per vendor package based on your delivery state and town.
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-sm">
                <span className="font-bold text-[var(--text-primary)]">Estimated Subtotal:</span>
                <span className="font-editorial text-2xl font-bold text-amber-600 dark:text-[var(--gold-accent)]">
                  ₦{subtotal.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="w-full py-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-[10px] font-mono-luxury text-[var(--text-muted)] text-center flex items-center justify-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Verified Secure & Encrypted Payment</span>
            </p>
          </div>

        </div>
      )}

      </div>
    </>
  );
}
