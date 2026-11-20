'use client';

import React from 'react';
import { ShieldCheck, Sparkles, Clock } from 'lucide-react';

interface OrderStatusAnimationProps {
  trackingStage: number; // 1 = Needs Packing, 2 = Packed/Ready, 3 = In Transit, 4 = Delivered & Settled
  deliveryMethod?: string;
  courierName?: string;
  compact?: boolean;
}

/**
 * Quiet-Luxury Animated Order Status Visual Strip
 * Replaces plain static dots with crisp animated vector scenes for each stage:
 * - Stage 1 (Unattended): Pulsing alert radar + bobbing parcel box
 * - Stage 2 (Packed): Sealed package + gliding dispatch ready shimmer
 * - Stage 3 (In Transit): Animated delivery motorbike gliding along a live moving road
 * - Stage 4 (Delivered): Animated emerald verification seal + subtle gold shimmer
 */
export default function OrderStatusAnimation({
  trackingStage,
  deliveryMethod,
  courierName,
  compact = false,
}: OrderStatusAnimationProps) {
  const isPark = deliveryMethod === 'park_pickup';

  // STAGE 4: DELIVERED & ESCROW SETTLED
  if (trackingStage >= 4) {
    return (
      <div
        className={`relative overflow-hidden flex items-center justify-between gap-3 ${
          compact ? 'px-3.5 py-2.5' : 'px-4 py-3'
        } bg-emerald-500/[0.06] border-b border-emerald-500/15`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Animated Emerald Check Seal */}
          <div className="relative h-9 w-9 flex items-center justify-center shrink-0">
            <span className="irisi-seal-ring absolute inset-0 rounded-full bg-emerald-500/20" />
            <div className="relative h-8 w-8 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-500 flex items-center justify-center">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <Sparkles className="irisi-sparkle-float absolute -top-1 -right-1 h-3 w-3 text-[var(--gold-accent)]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono-luxury uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Delivered &amp; Verified
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-light truncate">
              Buyer confirmed receipt · Payout released to treasury
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono-luxury shrink-0">
          <ShieldCheck className="h-3 w-3" />
          <span>Settled</span>
        </span>
      </div>
    );
  }

  // STAGE 3: IN TRANSIT — ANIMATED DELIVERY RIDER ON LIVE ROAD
  if (trackingStage === 3) {
    return (
      <div
        className={`relative overflow-hidden ${
          compact ? 'px-3.5 py-2.5' : 'px-4 py-3'
        } bg-[var(--gold-accent)]/[0.06] border-b border-[var(--gold-accent)]/20 space-y-2`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--gold-accent)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--gold-accent)]" />
            </span>
            <span className="text-[11px] font-mono-luxury uppercase tracking-wider text-[var(--gold-accent)] truncate">
              {isPark ? 'In Transit · Bus / Hub Waybill' : 'Rider On The Road · In Transit'}
            </span>
          </div>
          <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] shrink-0">
            {courierName || 'Live Dispatch'}
          </span>
        </div>

        {/* Live Animated Route Track with Moving Delivery Motorbike / Van */}
        <div className="relative h-8 rounded-xl bg-[var(--bg-primary)]/80 border border-[var(--border-subtle)] px-3 flex items-center justify-between overflow-hidden">
          <span className="text-[9px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] z-10 bg-[var(--bg-primary)] pr-1.5">
            Studio
          </span>

          {/* Animated Highway Track */}
          <div className="relative flex-1 mx-1.5 h-6 flex items-center overflow-hidden">
            {/* Moving Dashed Road Line */}
            <div className="irisi-road-dashes absolute inset-x-0 bottom-1 h-[2px]" />

            {/* Gliding Delivery Rider SVG */}
            <div className="irisi-rider-glide absolute bottom-[3px] left-0 flex items-center">
              {/* Speed Wind Lines */}
              <div className="flex flex-col gap-[2px] mr-0.5 opacity-60">
                <span className="block h-[1.5px] w-2.5 rounded-full bg-[var(--gold-accent)]" />
                <span className="block h-[1.5px] w-1.5 rounded-full bg-[var(--gold-accent)]" />
              </div>

              {isPark ? (
                /* Express Transit Van SVG */
                <svg
                  className="h-5 w-7 text-[var(--text-primary)]"
                  viewBox="0 0 36 22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 15V6a2 2 0 0 1 2-2h17v11H2Z" fill="currentColor" fillOpacity="0.08" />
                  <path d="M21 8h7.5L33 12v3h-12V8Z" />
                  <circle cx="8" cy="17" r="2.6" fill="var(--bg-primary)" stroke="var(--gold-accent)" strokeWidth="2" />
                  <circle cx="27" cy="17" r="2.6" fill="var(--bg-primary)" stroke="var(--gold-accent)" strokeWidth="2" />
                </svg>
              ) : (
                /* Express Courier Motorbike Rider SVG */
                <svg
                  className="h-5 w-7 text-[var(--text-primary)]"
                  viewBox="0 0 36 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Delivery Box on Back */}
                  <rect x="3" y="7" width="8" height="6" rx="1.5" fill="var(--gold-accent)" fillOpacity="0.28" stroke="var(--gold-accent)" />
                  {/* Rider Helmet & Torso */}
                  <circle cx="19" cy="5.5" r="2.2" />
                  <path d="M16 12l2.5-3.5 3.5 1.5 3 0.5" />
                  {/* Bike Frame */}
                  <path d="M9 17h10l4-6h4" />
                  <path d="M25 11l2.5 6" />
                  {/* Wheels */}
                  <circle cx="9" cy="18" r="3" fill="var(--bg-primary)" stroke="var(--gold-accent)" strokeWidth="2" />
                  <circle cx="28" cy="18" r="3" fill="var(--bg-primary)" stroke="var(--gold-accent)" strokeWidth="2" />
                </svg>
              )}
            </div>
          </div>

          <span className="text-[9px] font-mono-luxury uppercase tracking-wider text-[var(--gold-accent)] z-10 bg-[var(--bg-primary)] pl-1.5">
            Buyer
          </span>
        </div>
      </div>
    );
  }

  // STAGE 2: PACKED & READY FOR COURIER HANDOFF
  if (trackingStage === 2) {
    return (
      <div
        className={`relative overflow-hidden flex items-center justify-between gap-3 ${
          compact ? 'px-3.5 py-2.5' : 'px-4 py-3'
        } bg-amber-500/[0.06] border-b border-amber-500/20`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <svg className="irisi-parcel-bob h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16.5 9.4l-9-5.19" />
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-mono-luxury uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Packed &amp; Sealed · Ready To Dispatch
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-light truncate">
              Tap Dispatch Order below to enter waybill or rider contact
            </p>
          </div>
        </div>
      </div>
    );
  }

  // STAGE 1: NEW PAID ORDER — UNATTENDED / ACTION NEEDED
  return (
    <div
      className={`relative overflow-hidden flex items-center justify-between gap-3 ${
        compact ? 'px-3.5 py-2.5' : 'px-4 py-3'
      } bg-sky-500/[0.06] border-b border-sky-500/20`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Animated Pulsing Radar + Parcel Alert */}
        <div className="relative h-9 w-9 flex items-center justify-center shrink-0">
          <span className="irisi-radar-ring absolute inset-0 rounded-full bg-sky-500/25" />
          <div className="relative h-8 w-8 rounded-full bg-sky-500/15 border border-sky-500/40 text-sky-500 flex items-center justify-center">
            <svg className="irisi-parcel-bob h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono-luxury uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Action Needed · Awaiting Packaging
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] font-light truncate">
            Payment locked in Escrow · Pack &amp; mark ready for dispatch
          </p>
        </div>
      </div>

      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[10px] font-mono-luxury shrink-0">
        <Clock className="h-3 w-3" />
        <span>New</span>
      </span>
    </div>
  );
}
