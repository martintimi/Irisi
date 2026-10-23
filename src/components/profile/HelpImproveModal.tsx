'use client';

import React, { useState, useEffect } from 'react';
import { Lightbulb, X, Sparkles, Check, Send, Bug, Compass, Layers, ShieldCheck, Truck } from 'lucide-react';
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
  { id: 'Checkout & Escrow', label: 'Checkout & Escrow', icon: ShieldCheck },
  { id: 'Waybill & Delivery', label: 'Waybill & Delivery', icon: Truck },
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

  // Complete background scroll lock when help improve modal is active
  useBodyScrollLock(isOpen);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);

    try {
      const diagnostics = includeDiagnostics && typeof window !== 'undefined'
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
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e6c367', '#38bdf8', '#ffffff', '#10b981'],
      });

      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setMessage('');
      }, 1800);
    } catch (err) {
      console.error('Help improve submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn overscroll-contain"
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-md surface-card border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[88dvh] overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
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
            <Lightbulb className="h-6 w-6 text-[var(--gold-accent)]" />
          </div>
          <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
            Help Improve Ìrísí
          </h3>
          <p className="text-xs font-mono-luxury text-[var(--text-secondary)] max-w-xs mx-auto">
            Your ideas and reports directly shape our couture shopping experience.
          </p>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3 animate-fadeIn">
            <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Check className="h-7 w-7" />
            </div>
            <h4 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
              Proposal Received!
            </h4>
            <p className="text-xs font-mono-luxury text-[var(--text-secondary)]">
              Thank you for contributing to the evolution of Ìrísí Luxury.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 font-mono-luxury text-xs">
            {/* Category Selector */}
            <div className="space-y-2">
              <label className="text-[10px] text-[var(--text-secondary)] uppercase font-bold block">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--gold-subtle)] border-[var(--gold-accent)] text-[var(--gold-accent)] shadow-sm'
                          : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-[11px] font-bold truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Area */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[var(--text-secondary)] uppercase font-bold block">
                Your Feedback or Suggestion
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                placeholder="What can we improve, or what new feature would you love to see in Ìrísí?"
                className="w-full p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-accent)] resize-none text-xs"
              />
            </div>

            {/* Device Diagnostics Checkbox */}
            <label className="flex items-center gap-2.5 text-[11px] text-[var(--text-secondary)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeDiagnostics}
                onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                className="rounded border-[var(--border-subtle)] text-[var(--gold-accent)] focus:ring-[var(--gold-accent)]"
              />
              <span>Include anonymous browser/screen info to assist our tech team</span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="w-full py-3.5 rounded-xl bg-[var(--gold-accent)] text-black font-bold uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting Feedback...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Feedback</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
