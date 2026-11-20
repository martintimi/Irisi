'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Star, ShieldCheck, CheckCircle2, MessageSquare, RefreshCw, Loader2, ArrowUpRight, Sparkles } from 'lucide-react';
import { getActiveVendorId } from '@/lib/services/apiClient';
import { useStore } from '@/lib/store/useStore';
import Link from 'next/link';
import MobileVendorReviews from '@/components/vendor/MobileVendorReviews';
import VendorLuxuryLoader from '@/components/vendor/VendorLuxuryLoader';
import LuxuryLoader from '@/components/common/LuxuryLoader';
import { getVendorCache, setVendorCache } from '@/lib/cache/vendorPortalCache';

export default function VendorReviewsPage() {
  const { vendorProfile } = useStore();
  const activeVendorId = getActiveVendorId();

  const cachedInitReviews = getVendorCache<any>(activeVendorId || 'default', 'reviews_full');
  const [reviewsData, setReviewsData] = useState<{
    averageRating: number;
    fitAccuracyPercent: number;
    count: number;
    reviews: any[];
  }>(() => cachedInitReviews || {
    averageRating: 5.0,
    fitAccuracyPercent: 100,
    count: 0,
    reviews: []
  });
  const [isLoading, setIsLoading] = useState(() => !cachedInitReviews);

  const fetchReviews = useCallback(async () => {
    const cached = getVendorCache<any>(activeVendorId || 'default', 'reviews_full');
    if (cached) {
      setReviewsData(cached);
      setIsLoading(false);
    }
    try {
      if (!cached) setIsLoading(true);
      const res = await fetch(`/api/reviews?vendorId=${encodeURIComponent(activeVendorId)}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const nextObj = {
          averageRating: data.averageRating || 5.0,
          fitAccuracyPercent: data.fitAccuracyPercent || 100,
          count: data.count || (data.reviews ? data.reviews.length : 0),
          reviews: data.reviews || []
        };
        setReviewsData(nextObj);
        setVendorCache(activeVendorId || 'default', 'reviews_full', nextObj);
      }
    } catch (e) {
      console.error('Error fetching vendor reviews:', e);
    } finally {
      setIsLoading(false);
    }
  }, [activeVendorId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden">
        <MobileVendorReviews
          reviewsData={reviewsData}
          isLoading={isLoading}
          onRefresh={fetchReviews}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block p-6 sm:p-10 max-w-6xl mx-auto space-y-8 animate-fadeIn">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--gold-accent)] animate-pulse" />
              <span className="text-xs font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold">
                Client Reputation Ledger
              </span>
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-1">
              Customer Reviews & Ratings
            </h1>
            <p className="text-xs font-mono-luxury text-[var(--text-secondary)] mt-1">
              Real feedback and sizing drape scores left by verified buyers upon confirming order delivery.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchReviews}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-full surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] hover:border-[var(--gold-accent)] transition-all cursor-pointer self-start sm:self-center"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Ratings</span>
          </button>
        </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Average Rating Card */}
        <div className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] shadow-sm space-y-3">
          <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold block">
            Overall Brand Rating
          </span>
          <div className="flex items-baseline gap-3">
            <span className="font-editorial text-4xl font-bold text-[var(--gold-accent)]">
              {reviewsData.count > 0 ? reviewsData.averageRating.toFixed(1) : '—'}
            </span>
            <div className="flex items-center gap-1 text-[var(--gold-accent)]">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    reviewsData.count > 0 && star <= Math.round(reviewsData.averageRating)
                      ? 'fill-current text-[var(--gold-accent)]'
                      : 'text-[var(--border-subtle)]'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)]">
            {reviewsData.count > 0 ? `Based on ${reviewsData.count} verified order completion(s)` : 'No buyer ratings recorded yet'}
          </p>
        </div>

        {/* Fit Accuracy */}
        <div className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] shadow-sm space-y-3">
          <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold block">
            Sizing & Fit Accuracy
          </span>
          <div className="flex items-baseline gap-3">
            <span className="font-editorial text-4xl font-bold text-emerald-400">
              {reviewsData.count > 0 ? `${reviewsData.fitAccuracyPercent}%` : '—'}
            </span>
            {reviewsData.count > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono-luxury font-bold">
                True to Size
              </span>
            )}
          </div>
          <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)]">
            {reviewsData.count > 0 ? 'Shoppers report garments match standard ready-to-wear sizing' : 'Awaiting order completion feedback'}
          </p>
        </div>

        {/* Verified Escrow Protection */}
        <div className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] shadow-sm space-y-3">
          <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold block">
            Review Verification
          </span>
          <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono-luxury text-sm">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <span>100% Verified Buyers</span>
          </div>
          <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)]">
            Only customers who received and inspected garments can leave ratings
          </p>
        </div>

      </div>

      {/* Reviews Feed */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
            Verified Customer Feedback ({reviewsData.reviews.length})
          </h2>
          <span className="text-[11px] font-mono-luxury text-[var(--text-muted)]">
            Published publicly on your store profile
          </span>
        </div>

        {isLoading ? (
          <LuxuryLoader
            fullScreen={false}
            label="Ì R Í S Í"
            sublabel="Loading Customer Reviews..."
          />
        ) : reviewsData.reviews.length === 0 ? (
          <div className="p-16 rounded-3xl surface-card text-center space-y-3 border border-[var(--border-subtle)]">
            <MessageSquare className="h-10 w-10 text-[var(--gold-accent)] mx-auto opacity-60" />
            <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
              No Reviews Yet
            </h3>
            <p className="text-xs font-mono-luxury text-[var(--text-secondary)] max-w-md mx-auto">
              When customers receive their clothes and confirm delivery, their ratings and reviews will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviewsData.reviews.map((rev: any, idx: number) => (
              <div
                key={rev.id || idx}
                className="p-6 sm:p-7 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--text-primary)]">{rev.customerName || 'Verified Client'}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono-luxury font-bold">
                        Verified Order
                      </span>
                    </div>
                    <div className="text-[11px] font-mono-luxury text-[var(--text-muted)] mt-0.5">
                      Order: {rev.orderNumber || '#VY-ORD'} · {new Date(rev.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[var(--gold-accent)]">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${
                          s <= Number(rev.rating || 5)
                            ? 'fill-current text-[var(--gold-accent)]'
                            : 'text-[var(--border-subtle)]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono-luxury">
                    <span className="text-[var(--text-secondary)]">
                      Piece: <strong className="text-[var(--text-primary)]">{rev.productName || 'Garment Piece'}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-[10px] font-bold">
                      {rev.fitRating === 'true_to_size' ? 'True to Size' : rev.fitRating?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs font-mono-luxury text-[var(--text-primary)] leading-relaxed italic bg-[var(--bg-secondary)]/50 p-3.5 rounded-2xl border border-[var(--border-subtle)]">
                    "{rev.comment}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      </div>
    </>
  );
}
