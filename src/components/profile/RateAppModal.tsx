'use client';

import React, { useState, useEffect } from 'react';
import { Star, X, Check, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useBodyScrollLock } from '@/lib/utils/useBodyScrollLock';

interface RateAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

const RATING_LABELS: Record<number, { title: string; subtitle: string }> = {
  1: { title: 'Needs Work', subtitle: 'Tell us what felt off so we can fix it.' },
  2: { title: 'Fair', subtitle: 'We would love to know what to improve.' },
  3: { title: 'Good', subtitle: 'Glad it worked — how can we make it great?' },
  4: { title: 'Loved It', subtitle: 'Almost perfect — tell us what stood out.' },
  5: { title: 'Exceptional', subtitle: 'Thank you for loving the ÌRÍSÍ experience.' },
};

const EXPERIENCE_TAGS = [
  'Curated Brands',
  '24h Stories',
  'Escrow Safety',
  'Fast Delivery',
  'Easy Checkout',
  'Sizing & Fit',
  'Support Team',
];

export default function RateAppModal({ isOpen, onClose, userEmail, userName }: RateAppModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Curated Brands', 'Escrow Safety']);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const activeRating = hoverRating ?? rating;
  const activeCopy = RATING_LABELS[activeRating] || RATING_LABELS[5];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'app_rating',
          rating,
          tags: selectedTags,
          comment: comment.trim(),
          customerEmail: userEmail,
          customerName: userName,
        }),
      });

      setIsSubmitted(true);

      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#e6c367', '#10b981', '#ffffff'],
      });

      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setComment('');
      }, 1700);
    } catch (err) {
      console.error('Rate app error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn overscroll-contain"
      onClick={() => !isSubmitting && onClose()}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-md bg-[var(--bg-surface)] border-t sm:border border-[var(--border-subtle)] rounded-t-[28px] sm:rounded-[28px] shadow-2xl relative max-h-[90dvh] overflow-y-auto overscroll-contain animate-slideUp"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Mobile Native Drag Handle */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[var(--border-subtle)]" />
        </div>

        {/* Minimal Header */}
        <div className="px-6 pt-4 sm:pt-6 pb-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--gold-accent)] block">
              Feedback
            </span>
            <h3 className="font-editorial text-xl font-normal text-[var(--text-primary)] leading-tight mt-0.5">
              Rate ÌRÍSÍ
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-8 w-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {isSubmitted ? (
            <div className="py-8 text-center space-y-3 animate-fadeIn">
              <div className="h-14 w-14 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center">
                <Check className="h-7 w-7" strokeWidth={1.8} />
              </div>
              <h4 className="font-editorial text-2xl font-normal text-[var(--text-primary)]">
                Thank You
              </h4>
              <p className="text-xs text-[var(--text-muted)] font-light max-w-xs mx-auto leading-relaxed">
                Your rating helps us keep raising the bar for every brand and shopper on ÌRÍSÍ.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Interactive Star Selector Card */}
              <div className="py-5 px-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-center space-y-2.5">
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= activeRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRating(star)}
                        className="p-1.5 rounded-full transition-transform hover:scale-110 active:scale-90 cursor-pointer"
                        aria-label={`Rate ${star} out of 5`}
                      >
                        <Star
                          strokeWidth={1.5}
                          className={`h-8 w-8 transition-all ${
                            isFilled
                              ? 'fill-[var(--gold-accent)] text-[var(--gold-accent)] drop-shadow-[0_2px_10px_rgba(230,195,103,0.4)]'
                              : 'text-[var(--text-muted)]/45'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div>
                  <div className="font-editorial text-lg font-normal text-[var(--text-primary)]">
                    {activeCopy.title}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] font-light mt-0.5">
                    {activeCopy.subtitle}
                  </p>
                </div>
              </div>

              {/* Clean Highlight Pills */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono-luxury uppercase tracking-[0.16em] text-[var(--text-muted)] block px-0.5">
                  What stood out?
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {EXPERIENCE_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-[11px] transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]'
                            : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/50'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Note */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono-luxury uppercase tracking-[0.16em] text-[var(--text-muted)] block px-0.5">
                  Note (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Share a quick thought or suggestion..."
                  className="w-full p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-accent)] resize-none transition-colors"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-[0.14em] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Submit {rating}-Star Rating</span>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="h-safe-area-bottom sm:hidden" />
      </div>
    </div>
  );
}
