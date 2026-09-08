'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Heart, ShoppingBag, Trash2, ArrowRight,
  Sparkles, Check, ChevronRight, Share2, Store
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '@/lib/store/useStore';
import MobileQuickBuyDrawer from '@/components/mobile/MobileQuickBuyDrawer';

export default function WishlistPage() {
  const router = useRouter();
  const { vault, toggleVaultItem, addToCart, cart, allProducts } = useStore();

  const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);
  const [movedMessage, setMovedMessage] = useState<string | null>(null);

  // Total in cart
  const totalCartCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  // Handle move single item to bag
  const handleMoveToBag = (product: any) => {
    addToCart(product, 'M', undefined, 1);
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#d4af37', '#ffffff', '#000000'],
    });
    setMovedMessage(`Moved "${product.name}" to your shopping bag`);
    setTimeout(() => setMovedMessage(null), 3500);
  };

  // Handle move all items to bag
  const handleMoveAllToBag = () => {
    vault.forEach((p) => {
      addToCart(p, 'M', undefined, 1);
    });
    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.7 },
      colors: ['#d4af37', '#ffffff', '#000000'],
    });
    setMovedMessage(`All ${vault.length} pieces moved to your shopping bag!`);
    setTimeout(() => setMovedMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0C] text-black dark:text-white pb-32">

      {/* ── STICKY HEADER ───────────────────────────────────── */}
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
          <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-900 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between text-xs">
            <span className="text-neutral-500 font-mono text-[11px]">
              Total Value: <strong className="text-black dark:text-white">₦{vault.reduce((s, p) => s + Number(p.price || 0), 0).toLocaleString()}</strong>
            </span>

            <button
              type="button"
              onClick={handleMoveAllToBag}
              className="text-[11px] font-bold uppercase tracking-wider text-black dark:text-white underline underline-offset-2 hover:text-amber-500 transition-colors cursor-pointer"
            >
              Move All to Bag
            </button>
          </div>
        )}
      </header>

      {/* Toast feedback message */}
      {movedMessage && (
        <div className="fixed top-16 inset-x-4 z-50 max-w-md mx-auto p-3 rounded-xl bg-black text-white dark:bg-white dark:text-black shadow-2xl flex items-center gap-2 text-xs font-bold animate-slideDown">
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="truncate flex-1">{movedMessage}</span>
          <Link href="/cart" className="underline uppercase tracking-wider text-[10px] shrink-0">
            View Bag →
          </Link>
        </div>
      )}

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <main className="px-4 py-6 max-w-5xl mx-auto">
        {vault.length === 0 ? (
          /* ── EMPTY STATE ──────────────────────────────────── */
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
          /* ── GRID OF SAVED PIECES ─────────────────────────── */
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {vault.map((product) => {
                const imageSrc =
                  product.imageUrl ||
                  (Array.isArray(product.images) && product.images[0]) ||
                  '/images/products/BlackTrapStarHoodie.jpg';

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

      {/* Quick Buy Drawer if triggered */}
      {quickBuyProduct && (
        <MobileQuickBuyDrawer
          product={quickBuyProduct}
          onClose={() => setQuickBuyProduct(null)}
        />
      )}

    </div>
  );
}
