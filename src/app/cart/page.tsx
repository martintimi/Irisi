'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import {
  Trash2, Plus, Minus, Store, Truck, ArrowRight, Sparkles, Check,
  MapPin, Clock, ShieldCheck, Heart, ArrowLeft, ChevronRight, Lock, RefreshCw
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MobileCartView from '@/components/cart/MobileCartView';

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
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
    removeFromCart(item.product.id);
  };

  // Group items by vendor
  const groupedItems = cart.reduce((acc, item) => {
    const vendorId = item.product.vendorId || 'boutique';
    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendorId,
        vendorName: item.product.vendorName || 'Independent Atelier',
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
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const distinctVendorsCount = Object.keys(groupedItems).length;

  return (
    <>

      {/* ========================================================================= */}
      {/* 1. DEDICATED MOBILE CART VIEW (< md screen sizes)                         */}
      {/* ========================================================================= */}
      <div className="block md:hidden">
        <MobileCartView />
      </div>

      {/* ========================================================================= */}
      {/* 2. BESPOKE DESKTOP LUXURY CART VIEW (>= md screen sizes)                   */}
      {/* ========================================================================= */}
      <div className="hidden md:block min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 space-y-8 animate-fadeIn">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-muted)]">
            <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/shop" className="hover:text-[var(--text-primary)] transition-colors">Catalog</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-[var(--gold-accent)] font-bold">Shopping Bag</span>
          </nav>

          {/* Desktop Luxury Hero Banner */}
          <div className="relative rounded-3xl surface-card p-8 lg:p-10 border border-[var(--border-subtle)] overflow-hidden shadow-sm">
            {/* Ambient Gold Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--gold-subtle)]/25 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] text-xs font-mono-luxury uppercase tracking-widest font-bold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>ESCROW-PROTECTED CHECKOUT</span>
                </div>

                <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-[var(--text-primary)] leading-tight">
                  Your Shopping Bag
                </h1>

                <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                  Every piece is fulfilled directly from verified Nigerian ateliers and boutiques. Your payment is held safely in escrow until your package is delivered and confirmed.
                </p>
              </div>

              {/* Quick Summary Pill Card */}
              {cart.length > 0 && (
                <div className="flex items-center gap-6 p-5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] shrink-0 shadow-xs">
                  <div>
                    <p className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] font-semibold">Total Items</p>
                    <p className="text-2xl font-editorial font-bold text-[var(--text-primary)] leading-tight">
                      {totalItemsCount} {totalItemsCount === 1 ? 'Piece' : 'Pieces'}
                    </p>
                  </div>
                  <div className="h-8 w-[1px] bg-[var(--border-subtle)]" />
                  <div>
                    <p className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] font-semibold">Atelier Packages</p>
                    <p className="text-2xl font-editorial font-bold text-[var(--gold-accent)] leading-tight">
                      {distinctVendorsCount} {distinctVendorsCount === 1 ? 'Origin' : 'Origins'}
                    </p>
                  </div>
                  <div className="h-8 w-[1px] bg-[var(--border-subtle)]" />
                  <button
                    type="button"
                    onClick={clearCart}
                    className="p-2 rounded-xl text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Clear entire shopping bag"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Cart Content: Empty State vs Active Packages */}
          {cart.length === 0 ? (
            /* Desktop Empty State */
            <div className="rounded-3xl surface-card border border-[var(--border-subtle)] p-16 text-center space-y-8 max-w-2xl mx-auto shadow-sm">
              <div className="h-24 w-24 mx-auto rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 flex items-center justify-center shadow-inner">
                <Store className="h-12 w-12 stroke-[1.2]" />
              </div>

              <div className="space-y-3">
                <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                  Your Shopping Bag is Empty
                </h2>
                <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed max-w-md mx-auto">
                  You haven&apos;t added any luxury pieces or bespoke drops to your bag yet. Explore Nigeria&apos;s finest ateliers and ready-to-wear collections.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase tracking-widest text-xs font-bold hover:opacity-90 transition-all shadow-md cursor-pointer"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/wishlist"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] font-mono-luxury uppercase tracking-widest text-xs font-bold transition-all cursor-pointer"
                >
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  <span>View Wishlist</span>
                </Link>
              </div>

              {/* Popular Categories Links */}
              <div className="pt-8 border-t border-[var(--border-subtle)] text-center space-y-3">
                <span className="text-[11px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] font-bold block">
                  Trending Collections:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {[
                    { label: "Men's Kaftans & Senator", href: '/shop?gender=men&category=senator' },
                    { label: 'Heavyweight Hoodies', href: '/shop?gender=men&category=hoodies' },
                    { label: "Women's Couture & Gowns", href: '/shop?gender=women&category=dresses' },
                    { label: 'Leather Slides & Mules', href: '/shop?category=slides' },
                    { label: 'Adire Silk Boubou', href: '/shop?category=boubou' },
                  ].map((tag) => (
                    <Link
                      key={tag.label}
                      href={tag.href}
                      className="px-4 py-1.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs font-mono-luxury hover:border-[var(--gold-accent)] hover:text-[var(--gold-accent)] transition-colors"
                    >
                      {tag.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Active Cart: Two-Column Luxury Layout */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Vendor Packages (Span 8) */}
              <div className="lg:col-span-8 space-y-6">
                {Object.values(groupedItems).map(({ vendorId, vendorName, vendorCity, vendorState, dispatchDays, items }) => (
                  <div
                    key={vendorId}
                    className="p-6 sm:p-7 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-6 shadow-sm hover:border-[var(--gold-accent)]/30 transition-colors"
                  >
                    {/* Atelier Origin Header */}
                    <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4 flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] flex items-center justify-center shrink-0">
                          <Store className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-[var(--text-primary)]">{vendorName}</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-mono-luxury font-bold uppercase">
                              Verified Atelier
                            </span>
                          </div>
                          <p className="text-[11px] font-mono-luxury text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                            <MapPin className="h-3 w-3 text-[var(--gold-accent)]" />
                            <span>{vendorCity ? `Dispatches from ${vendorCity}, ${vendorState}` : 'Verified Vendor Hub'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs font-mono-luxury text-emerald-500 font-semibold shadow-xs">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Ready in {dispatchDays}</span>
                      </div>
                    </div>

                    {/* Items from this Atelier */}
                    <div className="space-y-5 divide-y divide-[var(--border-subtle)]/40">
                      {items.map((item) => (
                        <div
                          key={`${item.product.id}-${item.selectedSize}`}
                          className="pt-5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                        >
                          {/* Product Image & Details */}
                          <div className="flex items-center gap-4 min-w-0">
                            <Link
                              href={`/shop/${item.product.id}`}
                              className="relative h-24 w-20 sm:h-28 sm:w-22 rounded-2xl overflow-hidden bg-[var(--bg-secondary)] shrink-0 border border-[var(--border-subtle)] group block"
                            >
                              <Image
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                fill
                                unoptimized
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </Link>

                            <div className="space-y-1.5 min-w-0">
                              <Link
                                href={`/shop/${item.product.id}`}
                                className="font-editorial text-base sm:text-lg font-bold text-[var(--text-primary)] hover:text-[var(--gold-accent)] transition-colors line-clamp-1 block"
                              >
                                {item.product.name}
                              </Link>

                              {/* Attributes & Size Pill */}
                              <div className="flex items-center gap-2 flex-wrap text-xs font-mono-luxury">
                                <span className="px-2.5 py-0.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-bold">
                                  Size: <span className="text-[var(--text-primary)]">{item.selectedSize || 'Standard'}</span>
                                </span>

                                {item.selectedColor && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                                    <span
                                      className="h-2.5 w-2.5 rounded-full border border-white/20"
                                      style={{ backgroundColor: typeof item.selectedColor === 'object' ? item.selectedColor.hex : '#111111' }}
                                    />
                                    <span>{typeof item.selectedColor === 'object' ? item.selectedColor.name : item.selectedColor}</span>
                                  </span>
                                )}

                                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                                  ● In Stock
                                </span>
                              </div>

                              {/* Unit Price */}
                              <div className="pt-0.5">
                                <span className="font-editorial text-lg sm:text-xl font-bold text-amber-600 dark:text-[var(--gold-accent)]">
                                  ₦{Number(item.product.price).toLocaleString()}
                                </span>
                                {item.quantity > 1 && (
                                  <span className="text-xs font-mono-luxury text-[var(--text-muted)] ml-2">
                                    (₦{(item.product.price * item.quantity).toLocaleString()} total)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Stepper & Action Controls */}
                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0">
                            {/* Quantity Stepper */}
                            <div className="flex items-center rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-1 shadow-xs">
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-[var(--badge-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="px-3 min-w-[28px] text-center text-xs font-mono-luxury font-bold text-[var(--text-primary)]">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-[var(--badge-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Secondary Actions: Move to Wishlist + Delete */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleMoveToWishlist(item)}
                                className="p-2 rounded-full hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer"
                                title="Save to Wishlist"
                              >
                                <Heart className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => removeFromCart(item.product.id)}
                                className="p-2 rounded-full hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-rose-500 transition-colors cursor-pointer"
                                title="Remove from bag"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Buyer Protection Guarantee Strip */}
                <div className="p-5 rounded-2xl surface-card border border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono-luxury shadow-xs">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0" />
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">100% Escrow Buyer Protection</p>
                      <p className="text-[11px] text-[var(--text-muted)] font-normal">
                        Funds safely held by Irisi until you inspect and confirm receipt of all packages.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--gold-accent)] font-bold hover:underline shrink-0"
                  >
                    <span>Add More Drops</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Elevated Order Summary (Span 4) */}
              <div className="lg:col-span-4 sticky top-28 space-y-6">
                <div className="p-7 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-6 shadow-xl relative overflow-hidden">
                  
                  {/* Subtle Top Accent */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--gold-accent)] to-transparent opacity-60" />

                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                    <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
                      Order Summary
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--badge-bg)] text-xs font-mono-luxury font-bold text-[var(--gold-accent)]">
                      {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'}
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs font-mono-luxury">
                    <div className="flex items-center justify-between text-[var(--text-secondary)]">
                      <span>Pieces Subtotal:</span>
                      <span className="font-bold text-sm text-[var(--text-primary)]">₦{subtotal.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-[var(--text-secondary)]">
                      <span>Atelier Fulfillment Packages:</span>
                      <span className="font-bold text-[var(--gold-accent)]">
                        {distinctVendorsCount} Independent {distinctVendorsCount === 1 ? 'Atelier' : 'Ateliers'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[var(--text-secondary)]">
                      <span>Escrow Buyer Guarantee:</span>
                      <span className="text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        <span>Included</span>
                      </span>
                    </div>

                    {/* Delivery Logistics Notice */}
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1.5 text-[11px] text-[var(--text-secondary)] shadow-xs">
                      <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                        <Truck className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                        <span>Nationwide Escrow Logistics</span>
                      </div>
                      <p className="leading-relaxed font-light">
                        Delivery fees are calculated per atelier origin based on your state and city in the next step.
                      </p>
                    </div>

                    {/* Total Amount */}
                    <div className="pt-4 border-t border-[var(--border-subtle)] flex items-baseline justify-between">
                      <div>
                        <span className="font-bold text-sm text-[var(--text-primary)] block">Estimated Total:</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-normal">Excludes state delivery fees</span>
                      </div>
                      <span className="font-editorial text-3xl font-bold text-amber-600 dark:text-[var(--gold-accent)]">
                        ₦{subtotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Primary Checkout CTA */}
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={handleProceedToCheckout}
                      className="w-full py-4 px-6 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold tracking-widest hover:opacity-90 active:scale-[0.99] transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <Link
                      href="/shop"
                      className="w-full py-3 rounded-full border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-xs font-mono-luxury font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center justify-center gap-2 text-center"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Continue Shopping</span>
                    </Link>
                  </div>

                  {/* Trust & Security Footnote */}
                  <div className="pt-3 border-t border-[var(--border-subtle)] text-center space-y-1.5">
                    <p className="text-[10px] font-mono-luxury text-[var(--text-muted)] flex items-center justify-center gap-1.5 font-bold">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>256-Bit SSL Encrypted Escrow Payment</span>
                    </p>
                    <p className="text-[9px] font-mono-luxury text-[var(--text-muted)]">
                      Supports Cards, Bank Transfer, USSD & Naira Accounts
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}
