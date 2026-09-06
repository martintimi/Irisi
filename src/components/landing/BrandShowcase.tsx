'use client';

import React, { useState, useEffect } from 'react';
import { Store, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DynamicVendor {
  id: string;
  slug: string;
  name: string;
  location: string;
  desc: string;
  productCount: number;
}

export default function BrandShowcase() {
  const [vendors, setVendors] = useState<DynamicVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadVendors() {
      try {
        const res = await fetch('/api/vendors/featured');
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.ateliers)) {
          setVendors(data.ateliers);
        }
      } catch (err) {
        console.error('Failed to load partner brands:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadVendors();
    return () => { isMounted = false; };
  }, []);

  if (!isLoading && vendors.length === 0) return null;

  return (
    <section className="py-20 border-b border-[var(--border-subtle)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-[var(--border-subtle)]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--badge-bg)] text-[var(--gold-accent)] text-xs font-mono-luxury uppercase tracking-widest font-bold">
              <Store className="h-3.5 w-3.5" />
              <span>VERIFIED NIGERIAN BRANDS</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-normal text-[var(--text-primary)]">
              Partner Designers & Houses
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light max-w-xl">
              Verified independent fashion designers, artisanal footwear houses, and fine jewelry brands across Nigeria.
            </p>
          </div>

          <Link
            href="/vendors"
            className="inline-flex items-center gap-2 text-xs font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] hover:underline font-bold"
          >
            <span>Are you a Nigerian brand? Join Us</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Brand Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] animate-pulse h-48" />
            ))
          ) : (
            vendors.map((vendor) => {
              const initials = (vendor.name || 'V')
                .split(' ')
                .map((w: string) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={vendor.id}
                  className="p-6 rounded-3xl surface-card flex flex-col justify-between space-y-6 hover:shadow-xl transition-all duration-300 group border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/40"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="h-10 w-10 rounded-2xl bg-[var(--badge-bg)] border border-[var(--border-subtle)] font-mono-luxury font-bold text-xs flex items-center justify-center text-[var(--text-primary)]">
                          {initials}
                        </span>
                        <div>
                          <Link href={`/brand/${vendor.slug}`} className="hover:text-[var(--gold-accent)] transition-colors">
                            <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                              {vendor.name}
                            </h3>
                          </Link>
                          <div className="text-[11px] font-mono-luxury text-[var(--gold-accent)] uppercase">
                            {vendor.location}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-mono-luxury text-[var(--text-primary)]">
                        <Star className="h-3.5 w-3.5 fill-current text-[var(--gold-accent)]" />
                        <span>99.4%</span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed mt-4 line-clamp-3">
                      {vendor.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-[11px] font-mono-luxury text-[var(--text-muted)]">
                      {vendor.productCount} {vendor.productCount === 1 ? 'Design' : 'Designs'} Live
                    </span>

                    <Link
                      href={`/brand/${vendor.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-primary)] group-hover:text-[var(--gold-accent)] transition-colors font-bold"
                    >
                      <span>Storefront</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </section>
  );
}
