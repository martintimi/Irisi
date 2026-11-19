'use client';

import React, { useState, useMemo } from 'react';
import { Star, MessageSquare, RefreshCw } from 'lucide-react';
import VendorLuxuryLoader from './VendorLuxuryLoader';

interface MobileVendorReviewsProps {
  reviewsData: {
    averageRating: number;
    fitAccuracyPercent: number;
    count: number;
    reviews: any[];
  };
  isLoading: boolean;
  onRefresh: () => void;
}

export default function MobileVendorReviews({
  reviewsData,
  isLoading,
  onRefresh,
}: MobileVendorReviewsProps) {
  const [filterTab, setFilterTab] = useState<'all' | '5stars' | 'comments'>('all');

  const reviews = reviewsData.reviews || [];

  const fiveStarReviews = useMemo(
    () => reviews.filter((r) => Number(r.rating || 5) >= 5),
    [reviews]
  );

  const commentedReviews = useMemo(
    () => reviews.filter((r) => r.comment && r.comment.trim().length > 0),
    [reviews]
  );

  const filteredReviews = useMemo(() => {
    if (filterTab === '5stars') return fiveStarReviews;
    if (filterTab === 'comments') return commentedReviews;
    return reviews;
  }, [reviews, filterTab, fiveStarReviews, commentedReviews]);

  if (isLoading) {
    return <VendorLuxuryLoader label="Loading Reviews..." />;
  }

  return (
    <div className="space-y-5 animate-fadeIn pb-6 select-none">
      {/* 1. Native Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-editorial text-[26px] font-normal text-[var(--text-primary)] leading-tight">
            Reviews
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-light">
            Verified ratings &amp; fit accuracy
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="h-9 w-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] flex items-center justify-center active:scale-95 cursor-pointer shrink-0"
          aria-label="Refresh reviews"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Unified 3-Column Hairline Reputation Bar */}
      <section className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] grid grid-cols-3 divide-x divide-[var(--border-subtle)] py-4 text-center">
        <div className="px-2">
          <div className="font-editorial text-2xl text-[var(--gold-accent)] leading-none">
            {reviewsData.count > 0 ? reviewsData.averageRating.toFixed(1) : '—'}
          </div>
          <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] mt-1.5 block">
            Score ★
          </span>
        </div>

        <div className="px-2">
          <div className="font-editorial text-2xl text-emerald-500 leading-none">
            {reviewsData.count > 0 ? `${reviewsData.fitAccuracyPercent}%` : '—'}
          </div>
          <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] mt-1.5 block">
            True Fit
          </span>
        </div>

        <div className="px-2">
          <div className="font-editorial text-2xl text-[var(--text-primary)] leading-none">
            {reviewsData.count}
          </div>
          <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] mt-1.5 block">
            Verified
          </span>
        </div>
      </section>

      {/* 3. Native Segmented Filter */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
        {[
          { id: 'all', label: `All (${reviews.length})` },
          { id: '5stars', label: `5 Stars (${fiveStarReviews.length})` },
          { id: 'comments', label: `Notes (${commentedReviews.length})` },
        ].map((tab) => {
          const active = filterTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as any)}
              className={`py-2 rounded-xl text-[11px] font-mono-luxury transition-all cursor-pointer ${
                active
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. Review Feed */}
      {filteredReviews.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-2">
          <MessageSquare className="h-7 w-7 text-[var(--text-muted)] mx-auto" strokeWidth={1.5} />
          <p className="font-editorial text-lg text-[var(--text-primary)]">No Reviews Yet</p>
          <p className="text-xs text-[var(--text-muted)] font-light">
            Verified buyer ratings appear here once orders are delivered.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
          {filteredReviews.map((rev: any, idx: number) => {
            const customerInitials = (rev.customerName || 'C')
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div key={rev.id || idx} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs flex items-center justify-center shrink-0 font-editorial">
                      {customerInitials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                        {rev.customerName || 'Verified Buyer'}
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-light block truncate">
                        {rev.productName || 'Piece'} ·{' '}
                        {rev.createdAt
                          ? new Date(rev.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                          : 'Recent'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 text-[var(--gold-accent)] shrink-0 pt-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3 w-3 ${
                          s <= Number(rev.rating || 5)
                            ? 'fill-current text-[var(--gold-accent)]'
                            : 'text-[var(--border-subtle)]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {rev.comment && (
                  <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
                    &quot;{rev.comment}&quot;
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] font-mono-luxury text-[var(--text-muted)]">
                  <span>{rev.orderNumber || 'Verified Purchase'}</span>
                  <span className="text-[var(--gold-accent)]">
                    {rev.fitRating === 'true_to_size'
                      ? 'True to Size'
                      : rev.fitRating?.replace(/_/g, ' ') || 'True to Size'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
