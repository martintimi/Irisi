'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import OutfitCanvas from '@/components/studio/OutfitCanvas';
import WardrobeDrawer from '@/components/studio/WardrobeDrawer';
import LookBreakdown from '@/components/studio/LookBreakdown';
import StudioDressingStage from '@/components/3d/StudioDressingStage';
import { Sparkles, ShieldCheck, Store, Truck, Layers, RotateCw, SlidersHorizontal } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';

export default function StudioPage() {
  const { userAuth, bodyProfile, setIsProfileWizardOpen, fetchProductsFromDb } = useStore();
  const [studioMode, setStudioMode] = useState<'look_builder' | 'webgl_3d'>('look_builder');

  useEffect(() => {
    fetchProductsFromDb();
  }, [fetchProductsFromDb]);

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-fadeIn">
      
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 text-[10px] font-mono-luxury font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              <span>Editorial Styling Studio</span>
            </span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[var(--text-primary)] mt-2">
            Outfit Look Builder
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-light max-w-2xl leading-relaxed">
            Style complete Nigerian luxury looks with real garments from verified ateliers. Mix Senator tops, hoodies, baggy denim, and handcrafted slides into a complete outfit.
          </p>
        </div>

        {/* Studio Mode Switcher: Editorial Look Builder vs 3D 360° Dais */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center gap-1 shadow-sm">
            <button
              type="button"
              onClick={() => setStudioMode('look_builder')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono-luxury uppercase font-bold transition-all cursor-pointer ${
                studioMode === 'look_builder'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Complete Look Studio</span>
            </button>

            <button
              type="button"
              onClick={() => setStudioMode('webgl_3d')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono-luxury uppercase font-bold transition-all cursor-pointer ${
                studioMode === 'webgl_3d'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>3D 360° Dais</span>
            </button>
          </div>

          {/* Sizing Calibration Indicator */}
          <button
            type="button"
            onClick={() => setIsProfileWizardOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[var(--bg-secondary)] hover:border-[var(--gold-accent)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] transition-all cursor-pointer shadow-sm"
          >
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono-luxury text-xs font-bold">
              {bodyProfile.heightCm}cm · {bodyProfile.gender}
            </span>
            <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          </button>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="w-full">
        {studioMode === 'look_builder' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[640px]">
            {/* Left: Step-by-Step Clothes Selector (4 cols) */}
            <div className="lg:col-span-4 h-[620px] lg:h-[720px]">
              <WardrobeDrawer />
            </div>

            {/* Center: Live Look Canvas Preview (5 cols) */}
            <div className="lg:col-span-5 h-[620px] lg:h-[720px]">
              <OutfitCanvas />
            </div>

            {/* Right: Outfit Summary & Checkout (3 cols) */}
            <div className="lg:col-span-3 h-[620px] lg:h-[720px]">
              <LookBreakdown />
            </div>
          </div>
        ) : (
          <StudioDressingStage />
        )}
      </div>

      {/* Trust & Craftsmanship Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 sm:p-5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-[var(--gold-accent)] font-bold text-xs font-mono-luxury">
            <Store className="h-4 w-4" />
            <span className="uppercase">100% Platform Inventory</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
            Every piece on this styling canvas is sourced directly from independent Nigerian fashion houses and ready for instant dispatch.
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono-luxury">
            <ShieldCheck className="h-4 w-4" />
            <span className="uppercase">Zero Pull Escrow</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
            Your payment is held safely in Ìrísí Escrow until delivery is confirmed and the cut matches your exact satisfaction.
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs font-mono-luxury">
            <Truck className="h-4 w-4" />
            <span className="uppercase">Nationwide Express Delivery</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
            Your entire styled look is packaged together and delivered in 1 consolidated box across all 36 Nigerian states.
          </p>
        </div>
      </div>

    </div>
  );
}
