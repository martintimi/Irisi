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

  const isBoutique = vendorProfile?.vendorType === 'boutique_seller' || vendorProfile?.vendor_type === 'boutique_seller' || vendorProfile?.vendorType === 'boutique_merchant' || vendorProfile?.vendor_type === 'boutique_merchant';
  const rawCity = vendorProfile?.city || vendorProducts[0]?.vendorCity || 'Lagos';
  const cleanCity = rawCity.replace(/\s*\([^)]*\)/g, '').trim() || 'Lagos';
  const rawState = vendorProfile?.state || vendorProducts[0]?.vendorState || 'Lagos State';
  const cleanState = rawState.replace(/\s*State/i, '').replace(/\s*\([^)]*\)/g, '').trim();
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
              <span>Follow {isBoutique ? 'Boutique' : 'Atelier'}</span>
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
          <div className="h-14 w-24 rounded-2xl bg-black border border-[var(--gold-accent)]/50 flex items-center justify-center font-editorial font-bold text-2xl text-[var(--gold-accent)] shadow-xl shrink-0 overflow-hidden relative p-1">
            {vendorProfile?.logoUrl || vendorProfile?.logo ? (
              <Image
                src={vendorProfile.logoUrl || vendorProfile.logo}
                alt={brandName}
                fill
                unoptimized
                className="object-contain"
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
            <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)] mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[var(--gold-accent)] shrink-0" />
                <span>{cleanCity}{cleanState ? `, ${cleanState}` : ''}</span>
              </span>
              <span>·</span>
              <span className="text-emerald-400 font-bold whitespace-nowrap">{dispatchDays}</span>
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
            <span className="text-[9px] text-[var(--text-muted)] uppercase block">Brand Status</span>
            <span className="font-bold text-sm text-emerald-400">Verified</span>
          </div>
          <div className="min-w-0 px-1">
            <span className="text-[9px] text-[var(--text-muted)] uppercase block">Dispatch Hub</span>
            <span className="font-bold text-xs sm:text-sm text-[var(--gold-accent)] truncate block" title={cleanCity}>{cleanCity}</span>
          </div>
        </div>
        {/* Social Media Links — clean icon row */}
        {(() => {
          const ig = vendorProfile?.instagram || vendorProfile?.socialLinks?.instagram || '';
          const tt = vendorProfile?.tiktok || vendorProfile?.socialLinks?.tiktok || '';
          const snap = vendorProfile?.snapchat || vendorProfile?.socialLinks?.snapchat || '';
          const wa = vendorProfile?.whatsapp || vendorProfile?.socialLinks?.whatsapp || '';
          if (!ig && !tt && !snap && !wa) return null;
          return (
            <div className="flex items-center gap-4 pt-1 pb-0.5">
              {ig && (
                <a href={`https://instagram.com/${ig.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 group">
                  <div className="h-8 w-8 rounded-full border border-[var(--border-subtle)] flex items-center justify-center bg-[var(--bg-secondary)] group-active:scale-90 transition-transform">
                    <svg className="h-3.5 w-3.5 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </div>
                  <span className="text-[9px] font-mono-luxury text-[var(--text-muted)] truncate max-w-[52px]">{ig.startsWith('@') ? ig : `@${ig}`}</span>
                </a>
              )}
              {tt && (
                <a href={`https://tiktok.com/@${tt.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 group">
                  <div className="h-8 w-8 rounded-full border border-[var(--border-subtle)] flex items-center justify-center bg-[var(--bg-secondary)] group-active:scale-90 transition-transform">
                    <svg className="h-3.5 w-3.5 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.96a8.25 8.25 0 004.84 1.56V7.07a4.85 4.85 0 01-1.07-.38z"/></svg>
                  </div>
                  <span className="text-[9px] font-mono-luxury text-[var(--text-muted)] truncate max-w-[52px]">{tt.startsWith('@') ? tt : `@${tt}`}</span>
                </a>
              )}
              {snap && (
                <a href={`https://snapchat.com/add/${snap.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 group">
                  <div className="h-8 w-8 rounded-full border border-[var(--border-subtle)] flex items-center justify-center bg-[var(--bg-secondary)] group-active:scale-90 transition-transform">
                    <svg className="h-3.5 w-3.5 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="currentColor"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.49-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.479-.105l-.03-.509c-.105-1.629-.234-3.654.3-4.832C7.845 1.054 11.236.793 12.206.793z"/></svg>
                  </div>
                  <span className="text-[9px] font-mono-luxury text-[var(--text-muted)] truncate max-w-[52px]">{snap.startsWith('@') ? snap : `@${snap}`}</span>
                </a>
              )}
              {wa && (
                <a href={`https://wa.me/${wa.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 group">
                  <div className="h-8 w-8 rounded-full border border-[var(--border-subtle)] flex items-center justify-center bg-[var(--bg-secondary)] group-active:scale-90 transition-transform">
                    <svg className="h-3.5 w-3.5 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </div>
                  <span className="text-[9px] font-mono-luxury text-[var(--text-muted)]">WhatsApp</span>
                </a>
              )}
            </div>
          );
        })()}

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
                        src={product.imageUrl || '/images/no-product.svg'}
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
