'use client';

import React, { useState } from 'react';
import { Star, X, Sparkles, Check, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RateAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Fair Experience',
  3: 'Good Marketplace',
  4: 'Great Couture Experience',
  5: 'World-Class Luxury Experience',
};

const EXPERIENCE_TAGS = [
  'Boutique Fashion Drops',
  'Handcrafted Leather Footwear',
  'Luxury Bags & Jewelry',
  'Accurate Sizing & Fit',
  'Fast State-to-State Delivery',
  'Seamless Escrow Checkout',
  'Responsive Concierge',
];

export default function RateAppModal({ isOpen, onClose, userEmail, userName }: RateAppModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Boutique Fashion Drops', 'Accurate Sizing & Fit']);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const activeRating = hoverRating || rating;

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
        particleCount: 80,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#e6c367', '#10b981', '#ffffff', '#ec4899'],
      });

      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
      }, 1800);
    } catch (err) {
      console.error('Rate app error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-md surface-card border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-2 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="h-12 w-12 rounded-2xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] flex items-center justify-center mx-auto shadow-sm">
            <Star className="h-6 w-6 fill-current text-[var(--gold-accent)]" />
          </div>
          <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
            Rate Your Ìrísí Experience
          </h3>
          <p className="text-xs font-mono-luxury text-[var(--text-secondary)] max-w-xs mx-auto">
            Your rating helps us champion authentic Nigerian boutiques & designers.
          </p>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3 animate-fadeIn">
            <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Check className="h-7 w-7" />
            </div>
            <h4 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
              Thank You for Rating!
            </h4>
            <p className="text-xs font-mono-luxury text-[var(--text-secondary)]">
              Your feedback is deeply appreciated by our designers and engineering team.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 font-mono-luxury text-xs">
            {/* Stars Row */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= activeRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1 text-[var(--gold-accent)] transition-transform hover:scale-125 active:scale-95 cursor-pointer"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          isFilled
                            ? 'fill-[var(--gold-accent)] text-[var(--gold-accent)] filter drop-shadow-[0_0_8px_rgba(230,195,103,0.5)]'
                            : 'text-[var(--text-muted)]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-bold text-[var(--gold-accent)] uppercase tracking-wider">
                {RATING_LABELS[activeRating]}
              </span>
            </div>

            {/* Experience Tags */}
            <div className="space-y-2">
              <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold block">
                What did you enjoy most?
              </span>
              <div className="flex flex-wrap gap-1.5">
                {EXPERIENCE_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--gold-accent)] text-black shadow-sm'
                          : 'bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Comment */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[var(--text-secondary)] uppercase font-bold block">
                Comments or Suggestions (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="What made your experience great or how can we improve?"
                className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-accent)] resize-none text-xs"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-[var(--gold-accent)] text-black font-bold uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting Rating...</span>
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4 fill-black" />
                  <span>Submit Rating</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
