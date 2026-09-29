'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles, ArrowRight, Layers, ShieldCheck,
  Check, Bell, Wand2, Scissors, Crown, Compass, SlidersHorizontal
} from 'lucide-react';
import { useStore } from '@/lib/store/useStore';

export default function StudioPage() {
  const { userAuth, bodyProfile } = useStore();
  const [email, setEmail] = useState(userAuth?.email || '');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 700);
  };

  return (
    <div className="relative min-h-[85vh] flex flex-col justify-center items-center overflow-hidden bg-[var(--bg-primary)] px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      
      {/* ─── Ambient Luxury Background Aura ────────────────────────────── */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[750px] h-[450px] sm:h-[550px] bg-gradient-to-b from-[var(--gold-accent)]/15 via-[var(--gold-accent)]/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10 opacity-70 animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--bg-primary)_85%)] pointer-events-none -z-10" />

      {/* ─── Center Hero Content ───────────────────────────────────────── */}
      <div className="w-full max-w-4xl mx-auto text-center space-y-8 animate-fadeIn">
        
        {/* Editorial Pill Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[var(--badge-bg)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] text-xs font-mono-luxury uppercase tracking-widest shadow-lg backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--gold-accent)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--gold-accent)]" />
          </span>
          <span className="font-bold">Ìrísí Digital Atelier · Private Beta</span>
        </div>

        {/* Grand Headline */}
        <div className="space-y-4">
          <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-[var(--text-primary)] leading-[1.08]">
            The Outfit Studio.<br />
            <span className="italic font-normal shimmer-gold">
              Virtual Runway in Progress.
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-[var(--text-secondary)] font-light max-w-2xl mx-auto leading-relaxed">
            We are engineering a proprietary 3D styling and outfit composition engine. Calibrate your exact measurements, curate complete looks from verified Nigerian fashion houses, and test garment drapes before placing a single order.
          </p>
        </div>

        {/* VIP Early Access Card */}
        <div className="max-w-md mx-auto p-6 sm:p-7 rounded-3xl surface-card border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 backdrop-blur-xl shadow-2xl space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono-luxury font-bold uppercase text-[var(--gold-accent)]">
              <Crown className="h-4 w-4" />
              <span>VIP Atelier Access</span>
            </div>
            <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] tracking-wider">
              Limited to 250 Testers
            </span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] font-light leading-normal">
            Be the first to dress your digital body twin with authentic native wear, streetwear drops, and bespoke couture.
          </p>

          {isSubmitted ? (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Check className="h-4 w-4" />
              </div>
              <div className="text-xs font-mono-luxury">
                <p className="font-bold uppercase tracking-wider text-emerald-300">You are on the Atelier Guestlist</p>
                <p className="text-[11px] text-emerald-400/80 mt-0.5">We will notify {email} the moment the fitting room unlocks.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email for private invite..."
                className="flex-1 px-4 py-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-accent)] transition-all font-mono-luxury"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-3 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 font-mono-luxury text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Reserving...</span>
                ) : (
                  <>
                    <Bell className="h-3.5 w-3.5" />
                    <span>Join Waitlist</span>
                  </>
                )}
              </button>
            </form>
          )}

          {bodyProfile?.heightCm && (
            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono-luxury text-[var(--text-muted)]">
              <span>Your Twin Profile:</span>
              <span className="text-[var(--text-primary)] font-bold">
                {bodyProfile.heightCm}cm · {bodyProfile.gender}
              </span>
            </div>
          )}
        </div>

        {/* ─── 3 Visual Architecture Pillars ────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left max-w-4xl mx-auto">
          
          {/* Pillar 1 */}
          <div className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 backdrop-blur-sm space-y-2 hover:border-[var(--gold-accent)]/40 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--gold-accent)]/10 text-[var(--gold-accent)] border border-[var(--gold-accent)]/20">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <span className="text-[9px] font-mono-luxury uppercase text-[var(--gold-accent)] tracking-widest font-bold">
                01 / ARCHITECTURE
              </span>
            </div>
            <h4 className="font-editorial text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--gold-accent)] transition-colors">
              3D Body Twin Calibration
            </h4>
            <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
              Photorealistic body twin mapped to bespoke Nigerian tailoring dimensions, arm length, chest drape, and torso drop.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 backdrop-blur-sm space-y-2 hover:border-[var(--gold-accent)]/40 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--gold-accent)]/10 text-[var(--gold-accent)] border border-[var(--gold-accent)]/20">
                <Layers className="h-4 w-4" />
              </div>
              <span className="text-[9px] font-mono-luxury uppercase text-[var(--gold-accent)] tracking-widest font-bold">
                02 / ARCHITECTURE
              </span>
            </div>
            <h4 className="font-editorial text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--gold-accent)] transition-colors">
              Multi-Brand Look Builder
            </h4>
            <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
              Mix a Sartorial Lagos Senator top with Moji Wears raw denim and Kano cowhide slides on a single unified canvas.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 backdrop-blur-sm space-y-2 hover:border-[var(--gold-accent)]/40 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--gold-accent)]/10 text-[var(--gold-accent)] border border-[var(--gold-accent)]/20">
                <Wand2 className="h-4 w-4" />
              </div>
              <span className="text-[9px] font-mono-luxury uppercase text-[var(--gold-accent)] tracking-widest font-bold">
                03 / ARCHITECTURE
              </span>
            </div>
            <h4 className="font-editorial text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--gold-accent)] transition-colors">
              Physics Drape Simulation
            </h4>
            <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
              Accurate textile simulation for 450gsm heavyweight cotton, flowing silk boubous, and structured cashmere wools.
            </p>
          </div>

        </div>

        {/* ─── Back to Shopping Action Buttons ───────────────────────────── */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-lg group"
          >
            <span>Explore Live Marketplace</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/category"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono-luxury text-xs font-bold uppercase tracking-wider hover:border-[var(--gold-accent)] transition-all"
          >
            <Compass className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
            <span>Browse All Categories</span>
          </Link>
        </div>

      </div>

    </div>
  );
}
