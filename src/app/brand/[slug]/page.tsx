'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { calculateFitMatch } from '@/lib/utils/sizingEngine';
import {
  Sparkles, Check, ShoppingBag, Layers, ShieldCheck, Truck, RotateCcw,
  Star, Heart, ArrowLeft, ArrowRight, Share2, Ruler, Scissors,
  Building, Phone, MapPin, CheckCircle2, ChevronRight, MessageCircle,
  Copy, ExternalLink, SlidersHorizontal, Bookmark, Eye, Store, Loader2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import ProductQuickLookModal from '@/components/shop/ProductQuickLookModal';
import MobileBrandView from '@/components/brand/MobileBrandView';
import LuxuryLoader from '@/components/common/LuxuryLoader';
import { isBoutiqueVendor } from '@/types';

// Vector App Logos
const InstagramLogo = () => (
  <svg className="h-3.5 w-3.5 shrink-0 text-pink-500 fill-current" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TikTokLogo = () => (
  <svg className="h-3.5 w-3.5 shrink-0 text-cyan-400 fill-current" viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.81 4.48 6.27 6.27 0 0 0 1.9-4.47V8.62a8.27 8.27 0 0 0 4.88 1.58V6.75c-.34-.01-.67-.03-1-.06z"/>
  </svg>
);

const SnapchatLogo = () => (
  <svg className="h-3.5 w-3.5 shrink-0 text-amber-300 fill-current" viewBox="0 0 24 24">
    <path d="M12.002 2c-3.528 0-6.136 2.548-6.136 5.86 0 .894.227 1.83.67 2.66-.25.13-.538.258-.871.393-1.077.441-1.637.95-1.665 1.512-.03.585.503 1.135 1.583 1.635.035.016.07.032.106.048-.052.288-.13.722-.387 1.253-.332.684-.816 1.183-1.438 1.482-.676.326-.777.685-.758.895.03.328.375.568.995.692.658.132 1.458.118 2.327-.04.423-.077.873-.193 1.341-.334.422.56.985.939 1.688 1.132.846.232 1.745.244 2.545.035.801.21 1.7.198 2.546-.035.703-.193 1.266-.572 1.688-1.132.468.141.918.257 1.341.334.869.158 1.669.172 2.327.04.62-.124.965-.364.995-.692.019-.21-.082-.569-.758-.895-.622-.299-1.106-.798-1.438-1.482-.257-.531-.335-.965-.387-1.253.036-.016.071-.032.106-.048 1.08-.5 1.613-1.05 1.583-1.635-.028-.562-.588-1.071-1.665-1.512-.333-.135-.621-.263-.871-.393.443-.83.67-1.766.67-2.66 0-3.312-2.608-5.86-6.136-5.86z"/>
  </svg>
);

export default function BrandStorefrontPage() {
  const params = useParams();
  const router = useRouter();
  const rawSlug = params?.slug as string;

  const {
    bodyProfile,
    addToCart,
    setOutfitItem,
    toggleVaultItem,
    isInVault,
  } = useStore();

  const [vendor, setVendor] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [quickLookProduct, setQuickLookProduct] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [vendorReviews, setVendorReviews] = useState<{ averageRating: number; count: number; reviews: any[] }>({
    averageRating: 5.0,
    count: 0,
    reviews: []
  });

  // Fetch live Brand & Products by Slug on mount
  useEffect(() => {
    async function loadBrandStorefront() {
      if (!rawSlug) return;
      setIsLoading(true);
      setErrorMsg('');

      try {
        const res = await fetch(`/api/vendors/${rawSlug}`);
        const data = await res.json();

        if (res.ok && data.success && data.vendor) {
          setVendor(data.vendor);
          setProducts(data.products || []);

          try {
            const revRes = await fetch(`/api/reviews?vendorId=${encodeURIComponent(data.vendor.id || '')}`);
            const revJson = await revRes.json();
            if (revJson.success) {
              setVendorReviews(revJson);
            }
          } catch (e) {}
        } else {
          setErrorMsg(data.error || 'Brand storefront not found');
        }
      } catch (err: any) {
        setErrorMsg('Failed to load brand storefront.');
      } finally {
        setIsLoading(false);
      }
    }

    loadBrandStorefront();
  }, [rawSlug]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  if (isLoading) {
    return (
      <LuxuryLoader
        fullScreen={false}
        label="Ì R Í S Í"
        sublabel="Loading Designer Collection..."
      />
    );
  }

  if (!vendor || errorMsg) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fadeIn">
        <div className="h-16 w-16 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
          <RotateCcw className="h-8 w-8" />
        </div>
        <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          Storefront Not Found
        </h2>
        <p className="text-xs font-mono-luxury text-[var(--text-secondary)] max-w-md mx-auto">
          {errorMsg || 'The requested brand does not currently have an active catalog on Ìrísí.'}
        </p>
        <Link
          href="/shop"
          className="px-6 py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase font-bold hover:opacity-90 transition-all shadow-md inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Storefront</span>
        </Link>
      </div>
    );
  }

  const isBoutique = isBoutiqueVendor(vendor);

  const categories = [
    { id: 'all', label: 'ALL' },
    { id: 'tops', label: 'TOPS' },
    { id: 'bottoms', label: 'BOTTOMS' },
    { id: 'outerwear', label: 'OUTERWEAR' },
    { id: 'footwear', label: 'FOOTWEAR' },
    { id: 'accessories', label: 'ACCESSORIES' },
  ];

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());

  // Clean social URLs
  const igUrl = vendor.instagram ? `https://instagram.com/${vendor.instagram.replace('@', '')}` : null;
  const tiktokUrl = vendor.tiktok ? `https://tiktok.com/@${vendor.tiktok.replace('@', '')}` : null;
  const snapUrl = vendor.snapchat ? `https://snapchat.com/add/${vendor.snapchat.replace('@', '')}` : null;
  const waUrl = vendor.whatsapp ? `https://wa.me/${vendor.whatsapp.replace(/[^0-9]/g, '')}` : null;

  return (
    <>
      {/* 1. DEDICATED MOBILE BRAND VIEW */}
      <div className="block md:hidden">
        <MobileBrandView
          brandName={vendor.name}
          brandSlug={rawSlug}
          vendorProducts={products}
          vendorProfile={vendor}
        />
      </div>

      {/* 2. DESKTOP LUXURY BRAND VIEW */}
      <div className="hidden md:block min-h-screen pb-16 space-y-8 animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      
      {/* Top Breadcrumb & Share Actions */}
      <div className="flex items-center justify-between text-xs font-mono-luxury text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[var(--text-primary)] transition-colors">Boutiques</Link>
          <span>/</span>
          <span className="text-[var(--gold-accent)] uppercase font-bold">{vendor.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all font-bold uppercase text-[11px]"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>WhatsApp Brand</span>
            </a>
          )}

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all font-bold uppercase text-[11px]"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedLink ? 'Link Copied' : 'Share Store'}</span>
          </button>
        </div>
      </div>

      {/* Brand Hero Dossier Banner with App Logos */}
      <div className="p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] relative overflow-hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] font-editorial font-bold text-2xl sm:text-3xl flex items-center justify-center shrink-0 shadow-lg">
              {vendor.name ? vendor.name.charAt(0).toUpperCase() : 'V'}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-editorial text-3xl sm:text-4xl font-normal text-[var(--text-primary)] leading-tight">
                  {vendor.name}
                </h1>
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px] font-mono-luxury font-bold">
                  {isBoutique ? 'Verified Nigerian Boutique' : 'Verified Nigerian Atelier'}
                </span>
              </div>
              
              {vendor.bio && (
                <p className="text-xs text-[var(--text-secondary)] font-light max-w-xl leading-relaxed">
                  {vendor.bio}
                </p>
              )}

              <div className="flex items-center gap-4 text-[11px] font-mono-luxury text-[var(--text-muted)] pt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                  {vendor.origin}
                </span>
                <span>•</span>
                <span className="text-[var(--gold-accent)] font-bold">
                  {vendor.satisfactionRate}% Rating
                </span>
              </div>

              {/* Social Channels with Official Vector App Logos */}
              <div className="flex items-center gap-2 pt-2 flex-wrap">
                {vendor.instagram && (
                  <a
                    href={igUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full surface-card border border-[var(--border-subtle)] hover:border-pink-500/50 text-[10px] font-mono-luxury font-bold text-[var(--text-primary)] hover:text-pink-400 transition-all shadow-sm"
                  >
                    <InstagramLogo />
                    <span>{vendor.instagram}</span>
                  </a>
                )}

                {vendor.tiktok && (
                  <a
                    href={tiktokUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full surface-card border border-[var(--border-subtle)] hover:border-cyan-400/50 text-[10px] font-mono-luxury font-bold text-[var(--text-primary)] hover:text-cyan-400 transition-all shadow-sm"
                  >
                    <TikTokLogo />
                    <span>{vendor.tiktok}</span>
                  </a>
                )}

                {vendor.snapchat && (
                  <a
                    href={snapUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full surface-card border border-[var(--border-subtle)] hover:border-amber-300/50 text-[10px] font-mono-luxury font-bold text-[var(--text-primary)] hover:text-amber-300 transition-all shadow-sm"
                  >
                    <SnapchatLogo />
                    <span>{vendor.snapchat}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stat Pills */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center min-w-[100px]">
              <span className="text-[9px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold block">Live Drops</span>
              <strong className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
                {products.length} {products.length === 1 ? 'Piece' : 'Pieces'}
              </strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center min-w-[120px]">
              <span className="text-[9px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold block">Lagos Dispatch</span>
              <strong className="text-xs font-mono-luxury text-emerald-500 font-bold block pt-1">
                24–48h Express
              </strong>
            </div>
          </div>

        </div>
      </div>

      {/* Collection Title & Category Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              {vendor.name} Collection
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-mono-luxury">
              Authentic drops available for immediate dispatch.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 font-mono-luxury text-xs">
            {categories.map((cat) => (
              <button
                key={`cat-${cat.id}`}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full uppercase transition-all whitespace-nowrap font-bold text-[11px] ${
                  activeCategory === cat.id
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                    : 'surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="p-12 rounded-3xl surface-card border border-[var(--border-subtle)] text-center space-y-3">
            <ShoppingBag className="h-10 w-10 text-[var(--text-muted)] mx-auto opacity-50" />
            <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
              No products found in this category
            </h3>
            <p className="text-xs font-mono-luxury text-[var(--text-secondary)]">
              Try switching category filters to view other ready-to-wear drops from {vendor.name}.
            </p>
            <button
              onClick={() => setActiveCategory('all')}
              className="px-4 py-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase font-bold"
            >
              Show All Drops
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((p) => {
              const fitResult = calculateFitMatch(bodyProfile, p);
              const isSaved = isInVault(p.id);

              return (
                <div
                  key={`prod-card-${p.id}`}
                  className="group relative rounded-3xl overflow-hidden surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/50 transition-all duration-500 flex flex-col justify-between shadow-lg"
                >
                  {/* Garment Image */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/40">
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      unoptimized
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />

                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                      <span className="px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-emerald-400 border border-emerald-400/30 text-[9px] font-mono-luxury font-bold uppercase">
                        {fitResult.matchScore}% Match
                      </span>
                    </div>

                    <button
                      onClick={() => toggleVaultItem(p)}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all z-10 ${
                        isSaved
                          ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)]'
                          : 'bg-black/70 border-white/10 text-white hover:text-rose-400'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
                    </button>

                    {/* Hover Action Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 p-4 z-20">
                      <button
                        onClick={() => setQuickLookProduct(p)}
                        className="px-3.5 py-2 rounded-full bg-white text-black font-mono-luxury text-xs uppercase font-bold flex items-center gap-1.5 shadow-xl hover:scale-105 transition-transform"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Quick Look</span>
                      </button>
                    </div>
                  </div>

                  {/* Garment Details */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold block">
                        {p.category}
                      </span>
                      <Link
                        href={`/shop/${p.id}`}
                        className="font-editorial text-lg font-bold text-[var(--text-primary)] hover:text-[var(--gold-accent)] transition-colors line-clamp-1 mt-0.5"
                      >
                        {p.name}
                      </Link>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                      <span className="font-editorial text-xl font-bold text-amber-600 dark:text-[var(--gold-accent)]">
                        ₦{Number(p.price).toLocaleString()}
                      </span>

                      <button
                        onClick={() => {
                          addToCart(p, p.sizes?.[0] || 'M');
                        }}
                        className="p-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-all shadow-md"
                        title="Add to Bag"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verified Client Reviews Section */}
      <div className="pt-8 border-t border-[var(--border-subtle)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--gold-accent)]" />
              <span className="text-xs font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold">
                Verified Store Ledger
              </span>
            </div>
            <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1">
              Client Reviews & Satisfaction
            </h3>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-xs font-mono-luxury font-bold text-[var(--gold-accent)]">
            <Star className="h-4 w-4 fill-current text-[var(--gold-accent)]" />
            <span>{vendorReviews.averageRating} / 5.0 Rating ({vendorReviews.count} Verified Reviews)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendorReviews.reviews.map((rev, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3 shadow-sm hover:border-[var(--gold-accent)]/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 flex items-center justify-center font-bold text-xs text-[var(--gold-accent)] font-mono-luxury">
                    {rev.customerName ? rev.customerName.charAt(0).toUpperCase() : 'V'}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                      <span>{rev.customerName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono-luxury font-bold">
                        Verified Purchase
                      </span>
                    </div>
                    <span className="text-[10px] font-mono-luxury text-[var(--text-muted)]">{rev.productName || 'Garment Drop'} · {rev.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[var(--gold-accent)]">
                  {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
                &quot;{rev.comment}&quot;
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Look Modal */}
      {quickLookProduct && (
        <ProductQuickLookModal
          product={quickLookProduct}
          onClose={() => setQuickLookProduct(null)}
        />
      )}

      </div>
    </>
  );
}
