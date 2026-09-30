'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Heart, ShoppingBag, Trash2, ArrowRight,
  Sparkles, Check, ChevronRight, Share2, Store, Eye, MapPin
} from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import MobileQuickBuyDrawer from '@/components/mobile/MobileQuickBuyDrawer';
import ProductQuickLookModal from '@/components/shop/ProductQuickLookModal';

export default function WishlistPage() {
  const router = useRouter();
  const { vault, toggleVaultItem, clearVault, addToCart, cart } = useStore();

  const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);
  const [quickLookProduct, setQuickLookProduct] = useState<any>(null);

  // Total in cart
  const totalCartCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  // Total estimated value of wishlist
  const totalWishlistValue = vault.reduce((sum, p) => sum + Number(p.price || 0), 0);

  // Handle move single item to bag
  const handleMoveToBag = (product: any) => {
    addToCart(product, 'M', undefined, 1);
  };

  // Handle move all items to bag
  const handleMoveAllToBag = () => {
    if (vault.length === 0) return;
    vault.forEach((p) => {
      addToCart(p, 'M', undefined, 1);
    });
  };

  const handleClearWishlist = () => {
    clearVault();
  };

  const handleShareWishlist = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* ── 1. EXACT ORIGINAL MOBILE WISHLIST VIEW (< md screens) ──────────────── */}
      {/* ========================================================================= */}
      <div className="block md:hidden min-h-screen bg-white dark:bg-[#0A0A0C] text-black dark:text-white pb-32">
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0A0A0C]/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                aria-label="Go Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-sm font-black uppercase tracking-wider">
                  My Wishlist
                </h1>
                <span className="text-[10px] text-neutral-500 font-medium">
                  {vault.length} {vault.length === 1 ? 'saved piece' : 'saved pieces'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/cart"
                className="p-2 rounded-full text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white relative"
                aria-label="Shopping Bag"
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                {totalCartCount > 0 && (
                  <span className="absolute top-1 right-1 h-3.5 min-w-[14px] px-1 rounded-full bg-black dark:bg-white text-white dark:text-black text-[8px] font-bold flex items-center justify-center">
                    {totalCartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Action sub-bar if wishlist has items */}
          {vault.length > 0 && (
            <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-900 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between text-xs flex-wrap gap-2">
              <span className="text-neutral-500 font-mono text-[11px]">
                Total Value: <strong className="text-black dark:text-white">₦{vault.reduce((s, p) => s + Number(p.price || 0), 0).toLocaleString()}</strong>
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleMoveAllToBag}
                  className="text-[11px] font-bold uppercase tracking-wider text-black dark:text-white underline underline-offset-2 hover:text-amber-500 transition-colors cursor-pointer"
                >
                  Move All to Bag
                </button>

                <button
                  type="button"
                  onClick={handleClearWishlist}
                  className="text-[11px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear Wishlist</span>
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="px-4 py-6 max-w-5xl mx-auto">
          {vault.length === 0 ? (
            /* Empty State */
            <div className="py-16 text-center space-y-6 max-w-md mx-auto">
              <div className="h-20 w-20 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-400">
                <Heart className="h-10 w-10 stroke-[1.2]" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black uppercase tracking-tight">
                  Your Wishlist is Empty
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-light">
                  Save pieces you love while browsing to keep track of new releases, drops, and restocks. Tap the heart icon on any piece to save it here.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-md"
                >
                  <span>Explore New Drops</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Quick Categories Discovery */}
              <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800 text-left space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Popular Categories:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Men's Hoodies", href: '/shop?gender=men&category=hoodies' },
                    { label: "Senator & Kaftan", href: '/shop?gender=men&category=senator' },
                    { label: 'Leather Slides', href: '/shop?gender=men&category=slides' },
                    { label: 'Denim & Cargo', href: '/shop?gender=men&category=jeans' },
                    { label: "Women's Dresses", href: '/shop?gender=women&category=dresses' },
                    { label: 'Silk Boubou', href: '/shop?gender=women&category=boubou' },
                  ].map((tag) => (
                    <Link
                      key={tag.label}
                      href={tag.href}
                      className="px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-medium hover:border-black dark:hover:border-white transition-colors"
                    >
                      {tag.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Grid of Saved Pieces */
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {vault.map((product) => {
                  const imageSrc =
                    product.imageUrl ||
                    (Array.isArray(product.images) && product.images[0]) ||
                    '/images/no-product.svg';

                  return (
                    <div
                      key={product.id}
                      className="group flex flex-col border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-[#111113] transition-all hover:shadow-md"
                    >
                      {/* Portrait Image (3:4) */}
                      <div className="relative aspect-[3/4] w-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                        <Link href={`/shop/${product.id}`} className="block h-full w-full relative">
                          <Image
                            src={imageSrc}
                            alt={product.name}
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </Link>

                        {/* Remove from Wishlist Button */}
                        <button
                          type="button"
                          onClick={() => toggleVaultItem(product)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm text-neutral-500 hover:text-rose-500 active:scale-90 transition-all cursor-pointer z-10 shadow-sm"
                          aria-label="Remove from Wishlist"
                          title="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Stock badge */}
                        <div className="absolute top-2 left-2 z-10">
                          <span className="px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-sm text-white text-[8px] font-bold uppercase tracking-wider">
                            In Stock
                          </span>
                        </div>

                        {/* Move to Bag Button */}
                        <button
                          type="button"
                          onClick={() => handleMoveToBag(product)}
                          className="absolute bottom-2 inset-x-2 py-2 rounded-lg bg-black/90 dark:bg-white/90 text-white dark:text-black text-[10px] font-black uppercase tracking-wider text-center opacity-90 hover:opacity-100 active:scale-95 transition-all cursor-pointer shadow-md flex items-center justify-center gap-1"
                        >
                          <ShoppingBag className="h-3 w-3" />
                          <span>Move to Bag</span>
                        </button>
                      </div>

                      {/* Meta Details */}
                      <div className="p-3 flex flex-col flex-1 justify-between gap-1.5">
                        <Link href={`/shop/${product.id}`} className="space-y-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block truncate">
                            {product.vendorName || 'Brand'}
                          </span>
                          <h3 className="text-xs font-semibold text-black dark:text-white line-clamp-1">
                            {product.name}
                          </h3>
                        </Link>

                        <div className="pt-1 flex items-baseline justify-between">
                          <span className="text-xs font-black text-black dark:text-white">
                            ₦{Number(product.price || 0).toLocaleString()}
                          </span>
                          <Link
                            href={`/shop/${product.id}`}
                            className="text-[10px] text-neutral-400 hover:text-black dark:hover:text-white font-medium"
                          >
                            Details →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* Quick Buy Drawer if triggered on mobile */}
        {quickBuyProduct && (
          <MobileQuickBuyDrawer
            product={quickBuyProduct}
            onClose={() => setQuickBuyProduct(null)}
          />
        )}
      </div>

      {/* ========================================================================= */}
      {/* ── 2. BESPOKE LUXURY DESKTOP WISHLIST VIEW (>= md screens) ───────────── */}
      {/* ========================================================================= */}
      <div className="hidden md:block min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 space-y-8 animate-fadeIn">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-muted)]">
            <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/shop" className="hover:text-[var(--text-primary)] transition-colors">Catalog</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-[var(--gold-accent)] font-bold">Curated Wishlist</span>
          </nav>

          {/* Desktop Luxury Hero Banner */}
          <div className="relative rounded-3xl surface-card p-8 lg:p-10 border border-[var(--border-subtle)] overflow-hidden shadow-sm">
            {/* Subtle Ambient Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--gold-subtle)]/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] text-xs font-mono-luxury uppercase tracking-widest font-bold">
                  <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                  <span>SAVED COLLECTIONS</span>
                </div>

                <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-[var(--text-primary)] leading-tight">
                  Your Curated Wishlist
                </h1>

                <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                  Pieces you have handpicked from Nigerian luxury fashion boutiques, bespoke native tailors, and streetwear ateliers. Secured with nationwide escrow protection.
                </p>
              </div>

              {/* Quick Stats Pill Card */}
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] shrink-0 shadow-xs">
                <div className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <Heart className="h-6 w-6 fill-red-500 text-red-500" />
                </div>
                <div>
                  <p className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] font-semibold">Total Saved</p>
                  <p className="text-2xl font-editorial font-bold text-[var(--text-primary)] leading-tight">
                    {vault.length} {vault.length === 1 ? 'Piece' : 'Pieces'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Empty State vs Wishlist Catalog */}
          {vault.length === 0 ? (
            /* Desktop Empty State */
            <div className="rounded-3xl surface-card border border-[var(--border-subtle)] p-16 text-center space-y-8 max-w-2xl mx-auto shadow-sm">
              <div className="h-24 w-24 mx-auto rounded-full bg-red-500/5 border border-red-500/20 flex items-center justify-center text-red-500/80 shadow-inner">
                <Heart className="h-12 w-12 stroke-[1.2]" />
              </div>

              <div className="space-y-3">
                <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                  Your Wishlist is Empty
                </h2>
                <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed max-w-md mx-auto">
                  Discover exceptional Nigerian craftsmanship, limited RTW drops, and bespoke couture. Tap the heart icon on any piece to save it here.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase tracking-widest text-xs font-bold hover:opacity-90 transition-all shadow-md cursor-pointer"
                >
                  <span>Browse All Drops</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/categories"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] font-mono-luxury uppercase tracking-widest text-xs font-bold transition-all cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-[var(--gold-accent)]" />
                  <span>Categories</span>
                </Link>
              </div>

              {/* Popular Links */}
              <div className="pt-8 border-t border-[var(--border-subtle)] text-center space-y-3">
                <span className="text-[11px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] font-bold block">
                  Popular Categories to Explore:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {[
                    { label: "Men's Hoodies", href: '/shop?gender=men&category=hoodies' },
                    { label: "Senator & Kaftan", href: '/shop?gender=men&category=senator' },
                    { label: "Women's Couture", href: '/shop?gender=women&category=dresses' },
                    { label: "Handcrafted Slides", href: '/shop?category=slides' },
                    { label: "Luxury Bags", href: '/shop?category=handbags' },
                    { label: "Adire Silk Robes", href: '/shop?category=boubou' },
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
            /* Desktop Wishlist Active Grid & Actions Toolbar */
            <div className="space-y-6">
              
              {/* Desktop Action & Summary Toolbar */}
              <div className="p-4 sm:p-5 rounded-2xl surface-card border border-[var(--border-subtle)] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-xs">
                {/* Left: Summary Metrics */}
                <div className="flex items-center gap-6 flex-wrap">
                  <div>
                    <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] block font-bold">
                      Estimated Value
                    </span>
                    <span className="font-editorial text-2xl font-bold text-amber-600 dark:text-[var(--gold-accent)]">
                      ₦{totalWishlistValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="hidden sm:block h-8 w-[1px] bg-[var(--border-subtle)]" />
                  <div className="hidden sm:flex items-center gap-2 text-xs font-mono-luxury text-emerald-600 dark:text-emerald-400 font-semibold">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>All pieces ready for direct escrow delivery</span>
                  </div>
                </div>

                {/* Right: Batch Actions */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleShareWishlist}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] text-xs font-mono-luxury font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
                    title="Share Wishlist"
                  >
                    <Share2 className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                    <span>Share</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearWishlist}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-rose-500/50 hover:text-rose-500 text-xs font-mono-luxury font-bold text-[var(--text-secondary)] transition-all cursor-pointer shadow-xs"
                    title="Clear all saved pieces"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear All</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleMoveAllToBag}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase tracking-wider text-xs font-bold hover:opacity-90 transition-all shadow-md cursor-pointer"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Move All to Bag</span>
                  </button>
                </div>
              </div>

              {/* Desktop Products Grid: 4 columns, clean photos with NO in-image move button */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {vault.map((product) => {
                  const imageSrc =
                    product.imageUrl ||
                    (Array.isArray(product.images) && product.images[0]) ||
                    '/images/no-product.svg';

                  return (
                    <div
                      key={product.id}
                      className="group flex flex-col surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
                    >
                      {/* Portrait Image Area (3:4) - Pristine & Clean (Zero button clutter) */}
                      <div className="relative aspect-[3/4] w-full bg-[var(--bg-secondary)] overflow-hidden">
                        <Link href={`/shop/${product.id}`} className="block h-full w-full relative">
                          <Image
                            src={imageSrc}
                            alt={product.name}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </Link>

                        {/* Top Right: Remove from Wishlist Button */}
                        <div className="absolute top-3 right-3 z-20">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVaultItem(product);
                            }}
                            className="p-2 rounded-full bg-black/60 hover:bg-rose-500 text-white backdrop-blur-md border border-white/10 transition-all cursor-pointer shadow-md active:scale-95"
                            title="Remove from Wishlist"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Top Left: Stock Status */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono-luxury font-bold uppercase tracking-wider text-emerald-400 border border-white/10 shadow-md">
                            In Stock · RTW
                          </span>
                        </div>
                      </div>

                      {/* Card Body Details: Actions belong here in the description! */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          {/* Atelier Name */}
                          <div className="flex items-center justify-between pb-1">
                            <span className="text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold tracking-wider truncate">
                              {product.vendorName || 'Independent Atelier'}
                            </span>
                            <Link
                              href={`/shop/${product.id}`}
                              className="text-xs font-mono-luxury uppercase text-[var(--text-muted)] hover:text-[var(--gold-accent)] transition-colors shrink-0"
                            >
                              Details →
                            </Link>
                          </div>

                          {/* Title */}
                          <Link href={`/shop/${product.id}`} className="block hover:text-[var(--gold-accent)] transition-colors">
                            <h3 className="font-editorial text-lg font-bold text-[var(--text-primary)] leading-snug line-clamp-1">
                              {product.name}
                            </h3>
                          </Link>

                          {/* Price */}
                          <div className="pt-2 flex items-baseline gap-2">
                            <span className="font-editorial text-xl font-bold text-amber-600 dark:text-[var(--gold-accent)]">
                              ₦{Number(product.price || 0).toLocaleString()}
                            </span>
                          </div>

                          {/* Store Origin Location */}
                          <div className="flex items-center gap-1 text-[11px] font-mono-luxury text-[var(--text-secondary)] pt-1">
                            <MapPin className="h-3 w-3 text-[var(--gold-accent)] shrink-0" />
                            <span className="truncate">
                              {product.vendorCity ? `Ships from ${product.vendorCity}` : 'Verified Vendor'}
                            </span>
                          </div>
                        </div>

                        {/* Card Footer Actions: Quick View + Add to Bag */}
                        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQuickLookProduct(product)}
                            className="flex-1 py-2 rounded-full border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[11px] font-mono-luxury uppercase font-bold text-[var(--text-primary)] hover:text-[var(--gold-accent)] transition-colors cursor-pointer text-center"
                          >
                            Quick View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveToBag(product)}
                            className="flex-1 py-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[11px] font-mono-luxury uppercase font-bold hover:opacity-90 transition-opacity cursor-pointer text-center"
                          >
                            Add to Bag
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Look Desktop Modal */}
      {quickLookProduct && (
        <ProductQuickLookModal
          product={quickLookProduct}
          onClose={() => setQuickLookProduct(null)}
        />
      )}
    </>
  );
}
