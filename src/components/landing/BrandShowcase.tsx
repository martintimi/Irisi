'use client';

import React, { useState, useEffect } from 'react';
import { Store, Star, ArrowRight, Crown } from 'lucide-react';
import Link from 'next/link';

interface DynamicVendor {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
  images?: string[];
  location: string;
  desc: string;
  productCount: number;
  rating?: string;
  tag?: string;
  hasPaidPlus?: boolean;
}

const DISPLAY_LIMIT = 6;

export default function BrandShowcase() {
  const [vendors, setVendors] = useState<DynamicVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [brokenLogos, setBrokenLogos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadVendors() {
      try {
        const res = await fetch('/api/vendors/featured', { cache: 'no-store' });
        const data = await res.json();
        const list = Array.isArray(data?.featuredBrands)
          ? data.featuredBrands
          : Array.isArray(data?.ateliers)
          ? data.ateliers
          : [];
        if (isMounted && data.success) {
          setVendors(list);
        }
      } catch (err) {
        console.error('Failed to load featured brands:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadVendors();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!isLoading && vendors.length === 0) return null;

  const displayedVendors = showAll ? vendors : vendors.slice(0, DISPLAY_LIMIT);

  return (
    <section className="py-20 border-b border-[var(--border-subtle)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-[var(--border-subtle)]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--badge-bg)] border border-[var(--border-subtle)] text-[var(--gold-accent)] text-[11px] font-mono-luxury uppercase tracking-widest">
              <Store className="h-3.5 w-3.5" />
              <span>Featured Independent Brands</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-normal text-[var(--text-primary)]">
              Featured Brands &amp; Stores
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light max-w-xl">
              Real verified fashion labels, footwear makers, and luxury studios active on ÌRÍSÍ — spotlighting ÌRÍSÍ Plus partners.
            </p>
          </div>

          <Link
            href="/vendors"
            className="inline-flex items-center gap-2 text-xs font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] hover:underline"
          >
            <span>Explore All Brands</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Brand Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [1, 2, 3].map((n) => (
              <div
                key={n}
                className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] animate-pulse h-48"
              />
            ))
          ) : (
            displayedVendors.map((vendor) => {
              const initials = (vendor.name || 'B')
                .split(' ')
                .map((w: string) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              const logoSrc = !brokenLogos[vendor.id]
                ? vendor.logoUrl || (vendor.images && vendor.images[0]) || ''
                : '';

              return (
                <div
                  key={vendor.id}
                  className="p-6 rounded-3xl surface-card flex flex-col justify-between space-y-6 hover:shadow-xl transition-all duration-300 group border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/40"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative h-12 w-12 rounded-full bg-[var(--bg-primary)] border border-[var(--gold-accent)]/40 font-editorial text-sm flex items-center justify-center text-[var(--gold-accent)] overflow-hidden shrink-0">
                          {logoSrc ? (
                            <img
                              src={logoSrc}
                              alt={vendor.name}
                              onError={() =>
                                setBrokenLogos((prev) => ({ ...prev, [vendor.id]: true }))
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/brand/${encodeURIComponent(vendor.slug)}`}
                            className="hover:text-[var(--gold-accent)] transition-colors"
                          >
                            <h3 className="font-editorial text-xl font-normal text-[var(--text-primary)] truncate">
                              {vendor.name}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {vendor.hasPaidPlus && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/35 text-[9px] font-mono-luxury uppercase text-[var(--gold-accent)]">
                                <Crown className="h-2.5 w-2.5" />
                                <span>Plus</span>
                              </span>
                            )}
                            <span className="text-[11px] font-mono-luxury text-[var(--text-muted)] truncate">
                              {vendor.location}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-mono-luxury text-[var(--text-primary)] shrink-0">
                        <Star className="h-3.5 w-3.5 fill-current text-[var(--gold-accent)]" />
                        <span>{vendor.rating || '5.0'}</span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed mt-4 line-clamp-3">
                      {vendor.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-[11px] font-mono-luxury text-[var(--text-muted)]">
                      {vendor.productCount} {vendor.productCount === 1 ? 'Live Piece' : 'Live Pieces'}
                    </span>

                    <Link
                      href={`/brand/${encodeURIComponent(vendor.slug)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-primary)] group-hover:text-[var(--gold-accent)] transition-colors"
                    >
                      <span>Visit Store</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {vendors.length > DISPLAY_LIMIT && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="px-6 py-2.5 rounded-full border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-primary)] hover:border-[var(--gold-accent)] transition-colors cursor-pointer"
            >
              {showAll ? 'Show Less' : `View All ${vendors.length} Brands`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
