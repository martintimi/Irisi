'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import {
  Store, ShieldCheck, MapPin, Clock, Plus, Check,
  Zap, Sparkles, Bookmark, ArrowLeft, Star, ShoppingBag
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MobileQuickBuyDrawer from '@/components/mobile/MobileQuickBuyDrawer';

interface MobileBrandViewProps {
  brandName: string;
  brandSlug: string;
  vendorProducts: any[];
  vendorProfile: any;
}

export default function MobileBrandView({
  brandName,
  brandSlug,
  vendorProducts,
  vendorProfile,
}: MobileBrandViewProps) {
  const router = useRouter();
  const {
    isInVault,
    toggleVaultItem,
    followedVendors,
    toggleFollowVendor,
    setOutfitItem,
  } = useStore();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);

  const isFollowed = (followedVendors || []).includes((brandSlug || '').toLowerCase());

  const categories = [
    { id: 'all', label: 'All Pieces' },
    { id: 'tops', label: 'Tops & Sets' },
    { id: 'outerwear', label: 'Jackets & Hoodies' },
    { id: 'bottoms', label: 'Trousers' },
    { id: 'footwear', label: 'Footwear' },
  ];

  const filteredProducts = vendorProducts.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  const city = vendorProfile?.city || vendorProducts[0]?.vendorCity || 'Lagos';
  const state = vendorProfile?.state || vendorProducts[0]?.vendorState || 'Lagos State';
  const dispatchDays = vendorProfile?.dispatchDays || vendorProducts[0]?.dispatchDays || '1-2 business days';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-36 select-none animate-fadeIn">
      
      {/* 1. TOP FLOATING APP BAR */}
      <div className="fixed top-3 inset-x-3 z-40 flex items-center justify-between pointer-events-none">
        <button
          type="button"
          onClick={() => router.back()}
          className="pointer-events-auto p-2.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-white shadow-xl active:scale-90 transition-transform cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => toggleFollowVendor(brandSlug)}
          className={`pointer-events-auto px-4 py-2 rounded-full text-xs font-mono-luxury uppercase font-bold shadow-xl active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ${
            isFollowed
              ? 'bg-emerald-500 text-black'
              : 'bg-[var(--gold-accent)] text-black'
          }`}
        >
          {isFollowed ? (
            <>
              <Check className="h-3.5 w-3.5 stroke-[3]" />
              <span>Following</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>Follow Atelier</span>
            </>
          )}
        </button>
      </div>

      {/* 2. ATELIER COVER & IDENTITY BANNER */}
      <div className="relative h-64 w-full bg-gradient-to-br from-[#18181f] via-black to-[#0c0c0e] overflow-hidden">
        {vendorProducts[0]?.imageUrl && (
          <Image
            src={vendorProducts[0].imageUrl}
            alt={brandName}
            fill
            unoptimized
            priority
            className="object-cover opacity-40 blur-sm scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-black/60" />

        {/* Brand Meta Overlay */}
        <div className="absolute bottom-4 inset-x-4 flex items-end gap-3.5">
          <div className="h-16 w-16 rounded-2xl bg-[var(--gold-subtle)] border-2 border-[var(--gold-accent)] flex items-center justify-center font-editorial font-bold text-2xl text-[var(--gold-accent)] shadow-xl shrink-0 overflow-hidden relative">
            {vendorProfile?.logoUrl || vendorProfile?.logo ? (
              <Image
                src={vendorProfile.logoUrl || vendorProfile.logo}
                alt={brandName}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <span>{brandName.charAt(0)}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="font-editorial text-xl sm:text-2xl font-normal text-[var(--text-primary)] truncate">
                {brandName}
              </h1>
              <ShieldCheck className="h-4 w-4 text-[var(--gold-accent)] shrink-0" />
            </div>
            <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)] mt-0.5 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[var(--gold-accent)]" />
                <span>{city}, {state}</span>
              </span>
              <span>·</span>
              <span className="text-emerald-400 font-bold">{dispatchDays}</span>
            </p>
            {vendorProfile?.bio && (
              <p className="text-xs text-[var(--text-secondary)] font-light mt-1.5 line-clamp-2">
                {vendorProfile.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. ATELIER TRUST & STATS ROW */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl surface-card border border-[var(--border-subtle)] text-center text-xs font-mono-luxury shadow-sm">
          <div>
            <span className="text-[9px] text-[var(--text-muted)] uppercase block">Curated Drops</span>
            <span className="font-bold text-sm text-[var(--text-primary)]">{vendorProducts.length} Pieces</span>
          </div>
          <div className="border-x border-[var(--border-subtle)]">
            <span className="text-[9px] text-[var(--text-muted)] uppercase block">Escrow Rating</span>
            <span className="font-bold text-sm text-amber-400">5.0 ★</span>
          </div>
          <div>
            <span className="text-[9px] text-[var(--text-muted)] uppercase block">Dispatch Hub</span>
            <span className="font-bold text-sm text-[var(--gold-accent)]">{city}</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono-luxury uppercase font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-[var(--gold-accent)] text-black shadow-md'
                  : 'surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 4. 2-COLUMN COLLECTION GRID */}
        {filteredProducts.length === 0 ? (
          <div className="p-12 rounded-3xl surface-card border border-[var(--border-subtle)] text-center space-y-3">
            <ShoppingBag className="h-8 w-8 mx-auto text-[var(--gold-accent)] opacity-60" />
            <h3 className="font-editorial text-lg font-bold text-[var(--text-primary)]">No Pieces in this Category</h3>
            <p className="text-xs font-mono-luxury text-[var(--text-secondary)]">Check back soon for new drops.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {filteredProducts.map((product) => {
              const inVault = isInVault(product.id);

              return (
                <div
                  key={product.id}
                  className="rounded-3xl surface-card border border-[var(--border-subtle)] overflow-hidden flex flex-col justify-between shadow-sm"
                >
                  <div className="relative aspect-[3/4] w-full bg-black/40 overflow-hidden">
                    <Link href={`/shop/${product.id}`} className="block h-full w-full">
                      <Image
                        src={product.imageUrl || '/images/products/BlackTrapStarHoodie.jpg'}
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVaultItem(product);
                      }}
                      className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center cursor-pointer border border-white/10 z-10 transition-transform active:scale-90"
                    >
                      <Bookmark className={`h-4 w-4 ${inVault ? 'fill-[var(--gold-accent)] text-[var(--gold-accent)]' : 'text-white'}`} />
                    </button>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickBuyProduct(product);
                        }}
                        className="w-full py-2 px-2.5 rounded-xl bg-black/85 backdrop-blur-md border border-[var(--gold-accent)]/50 text-[var(--gold-accent)] text-[10px] font-mono-luxury uppercase font-bold flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-transform cursor-pointer"
                      >
                        <Zap className="h-3 w-3 fill-current" />
                        <span>Quick Add</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                    <Link href={`/shop/${product.id}`} className="block">
                      <h4 className="font-bold text-xs text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--gold-accent)] transition-colors">
                        {product.name}
                      </h4>
                    </Link>

                    <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]/60">
                      <div className="font-mono-luxury text-xs font-bold text-[var(--gold-accent)]">
                        ₦{Number(product.price || 0).toLocaleString()}
                      </div>
                      <span className="text-[9px] font-mono-luxury text-emerald-400 font-bold uppercase">
                        Ready
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Quick Buy Drawer */}
      {quickBuyProduct && (
        <MobileQuickBuyDrawer
          product={quickBuyProduct}
          onClose={() => setQuickBuyProduct(null)}
        />
      )}

    </div>
  );
}
