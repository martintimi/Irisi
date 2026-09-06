'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Store, Star, ArrowRight, MapPin, Search, Sparkles,
  ShieldCheck, Package, ExternalLink, Scissors, Award
} from 'lucide-react';

interface DynamicAtelier {
  id: string;
  slug: string;
  name: string;
  location: string;
  city?: string;
  state?: string;
  focus?: string;
  desc?: string;
  images?: string[];
  tag?: string;
  productCount: number;
}

export default function VendorsPage() {
  const [ateliers, setAteliers] = useState<DynamicAtelier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');

  useEffect(() => {
    let isMounted = true;
    async function loadVendors() {
      try {
        const res = await fetch('/api/vendors/featured');
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.ateliers)) {
          setAteliers(data.ateliers);
        }
      } catch (err) {
        console.error('Failed to load partner ateliers:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadVendors();
    return () => { isMounted = false; };
  }, []);

  const filteredAteliers = useMemo(() => {
    return ateliers.filter((atelier) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        atelier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (atelier.location && atelier.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (atelier.desc && atelier.desc.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTag =
        selectedTag === 'all' ||
        (atelier.tag && atelier.tag.toLowerCase().includes(selectedTag.toLowerCase())) ||
        (atelier.focus && atelier.focus.toLowerCase().includes(selectedTag.toLowerCase()));

      return matchesSearch && matchesTag;
    });
  }, [ateliers, searchQuery, selectedTag]);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 animate-fadeIn pb-24">
      
      {/* 1. Header & Context */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--badge-bg)] border border-[var(--border-subtle)] text-[var(--gold-accent)] text-xs font-mono-luxury uppercase tracking-widest font-bold">
          <Store className="h-3.5 w-3.5" />
          <span>VERIFIED NIGERIAN FASHION HOUSES</span>
        </div>

        <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-[var(--text-primary)] leading-tight">
          Discover Designers & Ateliers
        </h1>

        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed max-w-2xl mx-auto">
          Explore independent Nigerian tailors, bespoke native houses, and contemporary streetwear designers. Every brand is verified for quality and craftsmanship.
        </p>
      </div>

      {/* 2. Search & Tag Filter Bar */}
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ateliers by name, aesthetic, or city (e.g. Lagos, Yaba, Native)..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-accent)] transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs font-mono-luxury">
          {[
            { id: 'all', label: 'All Houses' },
            { id: 'native', label: 'Bespoke Native & Agbada' },
            { id: 'street', label: 'Streetwear & Drops' },
            { id: 'footwear', label: 'Handcrafted Footwear' },
            { id: 'boutique', label: 'Curated Boutiques' },
          ].map((tag) => {
            const isSelected = selectedTag === tag.id;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => setSelectedTag(tag.id)}
                className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer text-[11px] font-bold ${
                  isSelected
                    ? 'bg-[var(--gold-accent)] text-black shadow-sm'
                    : 'bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Ateliers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] animate-pulse h-56 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-zinc-800" />
                <div className="h-5 w-3/4 bg-zinc-800 rounded-md" />
                <div className="h-3 w-1/2 bg-zinc-800 rounded-md" />
              </div>
              <div className="h-8 w-full bg-zinc-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredAteliers.length === 0 ? (
        <div className="p-12 rounded-3xl surface-card border border-[var(--border-subtle)] text-center space-y-4 max-w-md mx-auto">
          <Store className="h-8 w-8 text-[var(--gold-accent)] mx-auto opacity-60" />
          <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
            No Ateliers Found
          </h3>
          <p className="text-xs text-[var(--text-secondary)] font-light">
            No fashion houses matched your search criteria. Try a different city or category filter.
          </p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setSelectedTag('all'); }}
            className="px-4 py-2 rounded-xl bg-[var(--gold-accent)] text-black text-xs font-mono-luxury font-bold uppercase cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAteliers.map((atelier) => {
            const initials = (atelier.name || 'V')
              .split(' ')
              .map((w: string) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={atelier.id}
                className="p-6 rounded-3xl surface-card flex flex-col justify-between space-y-6 hover:shadow-xl transition-all duration-300 group border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/50 relative overflow-hidden"
              >
                {/* Top Subtle Brand Gradient */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--gold-accent)]/20 to-transparent" />

                <div className="space-y-4">
                  {/* Brand Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[var(--gold-accent)]/15 to-[var(--gold-accent)]/5 border border-[var(--gold-accent)]/30 font-mono-luxury font-bold text-xs flex items-center justify-center text-[var(--gold-accent)] shrink-0 shadow-inner">
                        {initials}
                      </div>
                      <div>
                        <Link href={`/brand/${atelier.slug}`} className="hover:text-[var(--gold-accent)] transition-colors">
                          <h3 className="font-editorial text-lg sm:text-xl font-bold text-[var(--text-primary)] leading-tight group-hover:text-[var(--gold-accent)] transition-colors">
                            {atelier.name}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-1 text-[11px] font-mono-luxury text-[var(--text-muted)] mt-0.5">
                          <MapPin className="h-3 w-3 text-[var(--gold-accent)] shrink-0" />
                          <span>{atelier.location || 'Nigeria'}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-luxury font-bold uppercase bg-[var(--badge-bg)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/20 shrink-0">
                      {atelier.tag || 'Verified'}
                    </span>
                  </div>

                  {/* Specialty focus */}
                  {atelier.focus && (
                    <div className="text-xs font-mono-luxury text-[var(--gold-accent)] font-medium">
                      {atelier.focus}
                    </div>
                  )}

                  {/* Brand Description */}
                  <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed line-clamp-3">
                    {atelier.desc || 'Verified Nigerian fashion house offering bespoke craftsmanship and luxury ready-to-wear pieces.'}
                  </p>
                </div>

                {/* Card Footer: Product Count + Link */}
                <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <span className="text-[11px] font-mono-luxury text-[var(--text-muted)] flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                    <span>{atelier.productCount} {atelier.productCount === 1 ? 'Design' : 'Designs'} Live</span>
                  </span>

                  <Link
                    href={`/brand/${atelier.slug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-primary)] group-hover:text-[var(--gold-accent)] transition-all font-bold"
                  >
                    <span>Storefront</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Designer Onboarding Callout (Customer & Brand separation) */}
      <div className="p-8 sm:p-10 rounded-3xl surface-card border border-[var(--border-subtle)] max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left bg-gradient-to-br from-[var(--bg-secondary)] to-black/40">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold">
            <Scissors className="h-3.5 w-3.5" />
            <span>FASHION DESIGNER PORTAL</span>
          </div>
          <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
            Are you an independent Nigerian designer?
          </h3>
          <p className="text-xs text-[var(--text-secondary)] font-light max-w-lg">
            Showcase your collections to shoppers with verified measurements, escrow protection, and door-to-door courier dispatches.
          </p>
        </div>

        <Link
          href="/vendor-portal/auth"
          className="px-6 py-3.5 rounded-2xl bg-[var(--gold-accent)] text-black text-xs font-mono-luxury font-bold uppercase tracking-wider hover:brightness-110 transition-all shrink-0 shadow-lg"
        >
          Vendor Portal Login
        </Link>
      </div>

    </div>
  );
}
