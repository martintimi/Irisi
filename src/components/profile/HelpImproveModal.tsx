'use client';

import React, { useState, useEffect } from 'react';
import { Lightbulb, X, Check, Bug, Compass, Layers, ShieldCheck, Truck, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useBodyScrollLock } from '@/lib/utils/useBodyScrollLock';

interface HelpImproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

const CATEGORIES = [
  { id: 'Feature Idea', label: 'Feature Idea', icon: Lightbulb },
  { id: 'Bug / Glitch', label: 'Bug / Glitch', icon: Bug },
  { id: 'Sizing & Fit', label: 'Sizing & Fit', icon: Layers },
  { id: 'Checkout & Escrow', label: 'Escrow & Pay', icon: ShieldCheck },
  { id: 'Waybill & Delivery', label: 'Delivery', icon: Truck },
  { id: 'Design & UX', label: 'Design & UX', icon: Compass },
];

export default function HelpImproveModal({
  isOpen,
  onClose,
  userEmail,
  userName,
}: HelpImproveModalProps) {
  const [category, setCategory] = useState('Feature Idea');
  const [message, setMessage] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);

    try {
      const diagnostics =
        includeDiagnostics && typeof window !== 'undefined'
          ? {
              userAgent: navigator.userAgent,
              screenWidth: window.innerWidth,
              screenHeight: window.innerHeight,
              url: window.location.pathname,
            }
          : null;

      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'app_improvement',
          category,
          message: message.trim(),
          diagnostics,
          customerEmail: userEmail,
          customerName: userName,
        }),
      });

      setIsSubmitted(true);

      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.65 },
        colors: ['#e6c367', '#10b981', '#ffffff'],
      });

      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setMessage('');
      }, 1700);
    } catch (err) {
      console.error('Help improve submit error:', err);
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
              Product Feedback
            </span>
            <h3 className="font-editorial text-xl font-normal text-[var(--text-primary)] leading-tight mt-0.5">
              Help Improve ÌRÍSÍ
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
                Feedback Received
              </h4>
              <p className="text-xs text-[var(--text-muted)] font-light max-w-xs mx-auto leading-relaxed">
                Thank you for helping us refine ÌRÍSÍ. Our product team reviews every note directly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Topic Pill Grid */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono-luxury uppercase tracking-[0.16em] text-[var(--text-muted)] block px-0.5">
                  Topic
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`h-10 px-3 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]'
                            : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/50'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
                        <span className="text-[11.5px] truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono-luxury uppercase tracking-[0.16em] text-[var(--text-muted)] block px-0.5">
                  Your Note
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="Share an idea, request a feature, or describe something we can polish..."
                  className="w-full p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-accent)] resize-none transition-colors"
                />
              </div>

              {/* Clean Hairline Diagnostics Switch */}
              <label className="px-3.5 py-2.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 cursor-pointer select-none">
                <span className="text-[11px] text-[var(--text-secondary)] font-light leading-snug">
                  Include anonymous device &amp; screen info to help fix issues faster
                </span>
                <input
                  type="checkbox"
                  checked={includeDiagnostics}
                  onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                  className="h-4 w-4 rounded accent-[var(--gold-accent)] shrink-0 cursor-pointer"
                />
              </label>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="w-full h-12 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-[0.14em] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-45"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Feedback</span>
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
