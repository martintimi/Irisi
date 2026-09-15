'use client';

import React, { useState, useMemo } from 'react';
import { Product, GarmentCategory } from '@/types';
import Image from 'next/image';
import {
  Sparkles, Download, Copy, Check, Send,
  Search, Tag, CheckCircle2, MessageSquare, Share2,
  ExternalLink, Eye, EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import VendorLuxuryLoader from './VendorLuxuryLoader';

interface MobileVendorDirectSalesProps {
  vendorProducts: Product[];
  isLoadingProducts: boolean;
  selectedProductId: string;
  setSelectedProductId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: GarmentCategory | 'all';
  setSelectedCategory: (c: GarmentCategory | 'all') => void;
  includePrice: boolean;
  setIncludePrice: (val: boolean) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customNote: string;
  setCustomNote: (note: string) => void;
  downloadBrandedCard: (product: Product, withPrice: boolean) => Promise<void>;
  isDownloading: boolean;
  downloadToast: string | null;
  productLink: string;
  activeProduct: Product | null;
  generatedMessage: string;
}

export default function MobileVendorDirectSales({
  vendorProducts,
  isLoadingProducts,
  selectedProductId,
  setSelectedProductId,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  includePrice,
  setIncludePrice,
  customerName,
  setCustomerName,
  customNote,
  setCustomNote,
  downloadBrandedCard,
  isDownloading,
  downloadToast,
  productLink,
  activeProduct,
  generatedMessage
}: MobileVendorDirectSalesProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  const categoryTabs: { id: GarmentCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'tops', label: 'Tops & Senators' },
    { id: 'bottoms', label: 'Trousers' },
    { id: 'outerwear', label: 'Agbadas & Robes' },
    { id: 'footwear', label: 'Shoes & Slides' },
  ];

  const filteredProducts = useMemo(() => {
    return vendorProducts.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q)));

      return matchesCategory && matchesQuery;
    });
  }, [vendorProducts, selectedCategory, searchQuery]);

  const handleCopyLinkOnly = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && productLink) {
      navigator.clipboard.writeText(productLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    }
  };

  const handleCopyMessage = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && generatedMessage) {
      navigator.clipboard.writeText(generatedMessage);
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2000);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleShareWhatsApp = () => {
    if (typeof window !== 'undefined' && generatedMessage) {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(generatedMessage)}`;
      window.open(url, '_blank');
    }
  };

  if (isLoadingProducts) {
    return <VendorLuxuryLoader label="Loading Atelier Catalog for Direct Sales..." />;
  }

  return (
    <div className="space-y-4 animate-fadeIn pb-20 select-none">
      
      {/* 1. Top Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-[10px] font-mono-luxury uppercase font-bold border border-[var(--gold-accent)]/20 mb-1">
          <span>Social DM Assistant</span>
        </div>
        <h2 className="font-editorial text-2xl font-bold text-[var(--text-primary)] leading-tight">
          Direct Sales & Lookbook
        </h2>
        <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)]">
          Convert WhatsApp & Instagram DMs with 3D fitting links.
        </p>
      </div>

      {/* 2. Step 1: Select Piece from Catalog */}
      <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3 shadow-sm text-xs font-mono-luxury">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-[var(--text-primary)]">
            1. Select Garment ({vendorProducts.length})
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search piece name..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categoryTabs.map((tab) => {
            const isChosen = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer text-[10px] font-bold uppercase ${
                  isChosen
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                    : 'bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Product Cards List */}
        {filteredProducts.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--text-muted)]">
            No garments match your search.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const isSelected = (activeProduct?.id === p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProductId(p.id)}
                  className={`p-2 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--gold-subtle)] border-[var(--gold-accent)] ring-1 ring-[var(--gold-accent)] shadow-sm'
                      : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="relative h-11 w-10 rounded-xl overflow-hidden bg-black shrink-0">
                    <Image
                      src={p.imageUrl || '/images/no-product.svg'}
                      alt={p.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-[11px] text-[var(--text-primary)] truncate">{p.name}</h4>
                    <span className="font-editorial text-xs font-bold text-[var(--gold-accent)] block">
                      ₦{Number(p.price || 0).toLocaleString()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activeProduct && (
        <>
          {/* Quick Copy Link Bar */}
          <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs font-mono-luxury">
            <span className="text-[11px] text-[var(--text-secondary)] truncate flex-1 font-bold">
              {productLink}
            </span>
            <button
              type="button"
              onClick={handleCopyLinkOnly}
              className="px-3 py-1.5 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] uppercase text-[10px] font-bold shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-transform"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>

          {/* 2. Branded Lookbook Card Downloader */}
          <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3 shadow-sm text-xs font-mono-luxury">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-[var(--text-primary)]">
                2. Branded Lookbook Card
              </span>
              <span className="text-[9px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10">
                High-Res
              </span>
            </div>

            {/* Toggle Price Mode */}
            <div className="p-2 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-secondary)]">Card Price Display:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIncludePrice(false)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] uppercase font-bold transition-all ${
                    !includePrice
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  Hide Price
                </button>
                <button
                  type="button"
                  onClick={() => setIncludePrice(true)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] uppercase font-bold transition-all ${
                    includePrice
                      ? 'bg-[var(--gold-accent)] text-black shadow-sm'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  Show Price
                </button>
              </div>
            </div>

            {/* Card Preview */}
            <div className="relative aspect-[4/5] max-h-72 w-full rounded-2xl overflow-hidden bg-black border border-[var(--border-subtle)] mx-auto shadow-md">
              <Image
                src={activeProduct.imageUrl}
                alt={activeProduct.name}
                fill
                unoptimized
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-3 inset-x-3 text-white space-y-0.5">
                <span className="text-[9px] uppercase tracking-widest text-[var(--gold-accent)] font-bold block">
                  VEYRA EXCLUSIVE LOOKBOOK
                </span>
                <h4 className="font-editorial text-base font-bold truncate">
                  {activeProduct.name}
                </h4>
                {includePrice && (
                  <span className="font-editorial text-sm font-bold text-[var(--gold-accent)] block">
                    ₦{activeProduct.price.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Download Button */}
            <button
              type="button"
              disabled={isDownloading}
              onClick={() => downloadBrandedCard(activeProduct, includePrice)}
              className="w-full py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] uppercase text-xs font-bold shadow-lg hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="h-4 w-4 stroke-[2.5]" />
              <span>{isDownloading ? 'Generating Card...' : includePrice ? 'Download Card (With Price)' : 'Download Clean Card (No Price)'}</span>
            </button>

            {downloadToast && (
              <p className="text-center text-[10px] text-emerald-400 font-bold">
                {downloadToast}
              </p>
            )}
          </div>
        </>
      )}

    </div>
  );
}
