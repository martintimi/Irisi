'use client';

import React from 'react';
import { useStore } from '@/lib/store/useStore';
import {
  Trash2, Plus, Minus, Store, ArrowRight, Heart,
  MapPin, Clock, ShoppingBag, ShieldCheck, ArrowLeft
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const POPULAR_CATEGORIES = [
  { label: "Men's Hoodies", href: '/shop?gender=men&category=hoodies' },
  { label: 'Senator & Kaftan', href: '/shop?gender=men&category=senator' },
  { label: 'Leather Slides', href: '/shop?gender=men&category=slides' },
  { label: 'Denim & Cargo', href: '/shop?gender=men&category=jeans' },
  { label: "Women's Dresses", href: '/shop?gender=women&category=dresses' },
  { label: 'Silk Boubou', href: '/shop?gender=women&category=boubou' },
];

export default function MobileCartView() {
  const router = useRouter();
  const {
    cart,
    vault,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    userAuth,
    toggleVaultItem,
    isInVault,
  } = useStore();

  const handleProceedToCheckout = () => {
    if (!userAuth?.isLoggedIn) {
      router.push('/auth?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  const handleMoveToWishlist = (item: any) => {
    if (!isInVault(item.product.id)) {
      toggleVaultItem(item.product);
    }
    removeFromCart(item.id);
  };

  const groupedItems = cart.reduce((acc, item) => {
    const vendorId = item.product.vendorId || 'brand';
    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendorId,
        vendorName: item.product.vendorName || 'Verified Brand',
        vendorCity: item.product.vendorCity || '',
        vendorState: item.product.vendorState || '',
        dispatchDays: item.product.dispatchDays || '1–2 business days',
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
    items: typeof cart;
  }>);

  const totalCount = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + Number(item.product.price || 0) * item.quantity, 0);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-44 select-none animate-fadeIn">
      {/* 1. Native Minimal Top App Bar */}
      <header className="sticky top-0 z-30 h-14 px-4 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-[var(--border-subtle)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-9 w-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center justify-center active:scale-95 transition-transform shrink-0 cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="font-editorial text-[20px] font-normal text-[var(--text-primary)] leading-tight truncate">
              Shopping Bag
            </h1>
            <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] block leading-tight">
              {totalCount} {totalCount === 1 ? 'piece' : 'pieces'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {cart.length > 0 ? (
            <button
              type="button"
              onClick={clearCart}
              className="px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] font-mono-luxury uppercase tracking-wider text-rose-500 active:scale-95 cursor-pointer"
            >
              Clear
            </button>
          ) : (
            <Link
              href="/wishlist"
              className="relative h-9 w-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] flex items-center justify-center"
              aria-label="Wishlist"
            >
              <Heart className="h-4 w-4" strokeWidth={1.6} />
              {vault.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-mono-luxury flex items-center justify-center">
                  {vault.length}
                </span>
              )}
            </Link>
          )}
        </div>
      </header>

      {/* 2. Content: Matches Wishlist Empty Look OR Quiet-Luxury Native iOS Grouped Packages */}
      <main className="px-4 py-5 space-y-5">
        {cart.length === 0 ? (
          <div className="py-12 text-center space-y-6 max-w-md mx-auto">
            <div className="h-20 w-20 mx-auto rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)]">
              <ShoppingBag className="h-9 w-9" strokeWidth={1.2} />
            </div>

            <div className="space-y-2">
              <h2 className="font-editorial text-2xl font-normal text-[var(--text-primary)] tracking-tight">
                Your Shopping Bag is Empty
              </h2>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed font-light max-w-xs mx-auto">
                Add pieces you love while exploring verified independent brands. Every checkout stays 100% protected in Escrow until delivery.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-wider active:scale-95 transition-transform"
              >
                <span>Explore New Drops</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              {vault.length > 0 && (
                <Link
                  href="/wishlist"
                  className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-primary)]"
                >
                  <Heart className="h-3.5 w-3.5 text-rose-500" />
                  <span>View Wishlist ({vault.length})</span>
                </Link>
              )}
            </div>

            {/* Popular Categories Discovery (Mirrors Wishlist Empty State) */}
            <div className="pt-8 border-t border-[var(--border-subtle)] text-left space-y-3">
              <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--text-muted)] block">
                Popular Categories
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_CATEGORIES.map((tag) => (
                  <Link
                    key={tag.label}
                    href={tag.href}
                    className="px-3.5 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] active:bg-[var(--bg-secondary)] transition-colors"
                  >
                    {tag.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Grouped Native Brand Packages */}
            {Object.values(groupedItems).map(({ vendorId, vendorName, vendorCity, vendorState, dispatchDays, items }) => (
              <section
                key={vendorId}
                className="rounded-[22px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden"
              >
                {/* Clean Brand Strip */}
                <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Store className="h-3.5 w-3.5 text-[var(--gold-accent)] shrink-0" strokeWidth={1.7} />
                    <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {vendorName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono-luxury text-[var(--text-muted)] shrink-0">
                    <Clock className="h-3 w-3 text-emerald-500" />
                    <span>{dispatchDays}</span>
                  </div>
                </div>

                {/* Hairline-Divided Items List */}
                <div className="divide-y divide-[var(--border-subtle)]">
                  {items.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-start gap-3">
                      <Link
                        href={`/shop/${item.product.id}`}
                        className="relative h-20 w-16 rounded-xl overflow-hidden bg-zinc-900 border border-[var(--border-subtle)] shrink-0"
                      >
                        <Image
                          src={item.product.imageUrl || '/images/no-product.svg'}
                          alt={item.product.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </Link>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/shop/${item.product.id}`}
                            className="text-[13px] font-medium text-[var(--text-primary)] leading-snug line-clamp-1"
                          >
                            {item.product.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-[var(--text-muted)] hover:text-rose-500 cursor-pointer shrink-0"
                            aria-label="Remove piece"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="text-[11px] text-[var(--text-muted)] font-light flex items-center gap-1.5 flex-wrap">
                          <span>Size {item.selectedSize}</span>
                          {item.selectedColor?.name && (
                            <>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1">
                                {item.selectedColor.name.toLowerCase() !== 'as pictured' &&
                                  item.selectedColor.name.toLowerCase() !== 'standard' && (
                                    <span
                                      className="h-2 w-2 rounded-full border border-black/15 dark:border-white/20 inline-block"
                                      style={{ backgroundColor: item.selectedColor.hex || '#111111' }}
                                    />
                                  )}
                                <span>{item.selectedColor.name}</span>
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="font-editorial text-lg text-[var(--text-primary)] leading-none">
                            ₦{(Number(item.product.price || 0) * item.quantity).toLocaleString()}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleMoveToWishlist(item)}
                              className="h-7 w-7 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center active:scale-95 cursor-pointer"
                              aria-label="Save to wishlist"
                              title="Save to Wishlist"
                            >
                              <Heart className="h-3.5 w-3.5" />
                            </button>

                            <div className="inline-flex items-center rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] h-7 px-1">
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                className="h-6 w-6 rounded-full flex items-center justify-center text-[var(--text-secondary)] active:scale-90 cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="px-2 text-xs font-mono-luxury text-[var(--text-primary)]">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                className="h-6 w-6 rounded-full flex items-center justify-center text-[var(--text-secondary)] active:scale-90 cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Origin City Footer */}
                {(vendorCity || vendorState) && (
                  <div className="px-4 py-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/30 flex items-center justify-between text-[10px] font-mono-luxury text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-[var(--gold-accent)]" />
                      <span>Ships from {[vendorCity, vendorState].filter(Boolean).join(', ')}</span>
                    </span>
                    <span className="text-emerald-500">Escrow Protected</span>
                  </div>
                )}
              </section>
            ))}

            {/* Quiet-Luxury Order Summary Card */}
            <section className="p-4 rounded-[22px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Subtotal ({totalCount} {totalCount === 1 ? 'item' : 'items'})</span>
                <span className="font-editorial text-base text-[var(--text-primary)]">
                  ₦{subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Delivery</span>
                <span className="text-[11px] font-mono-luxury text-[var(--text-secondary)]">
                  Calculated at checkout
                </span>
              </div>
              <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-center gap-2 text-[11px] text-[var(--text-muted)] font-light">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Your payment is held safely in Escrow until you receive and approve your pieces.</span>
              </div>
            </section>
          </>
        )}
      </main>

      {/* 3. Native Sticky Bottom Checkout Dock (Right above MobileBottomNav) */}
      {cart.length > 0 && (
        <div className="fixed bottom-[62px] inset-x-0 z-30 bg-[var(--bg-surface)]/95 backdrop-blur-2xl border-t border-[var(--border-subtle)] px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.12)] flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] block">
              Subtotal
            </span>
            <div className="font-editorial text-2xl font-normal text-[var(--text-primary)] leading-none mt-0.5">
              ₦{subtotal.toLocaleString()}
            </div>
          </div>

          <button
            type="button"
            onClick={handleProceedToCheckout}
            className="flex-1 max-w-[215px] h-12 px-5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform cursor-pointer"
          >
            <span>Checkout</span>
            <ArrowRight className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
          </button>
        </div>
      )}
    </div>
  );
}
