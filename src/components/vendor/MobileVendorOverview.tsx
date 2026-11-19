'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  PackageCheck, DollarSign, Plus, ExternalLink, ShieldCheck,
  AlertTriangle, AlertCircle, Clock, ArrowRight, Store, Copy,
  Check, Lock, CheckCircle2, Camera, ChevronRight, Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { isBoutiqueVendor, getVendorSpecialty, getVendorSpecialtyInfo } from '@/types';

interface MobileVendorOverviewProps {
  vendorProfile: any;
  dbProducts: any[];
  totalLiveInventory: number;
  profileStatus: {
    isProfileSaved: boolean;
    isVerified: boolean;
    approvalStatus: string;
    rejectionReason: string;
  } | null;
  pendingOrdersCount?: number;
  activeEscrowBalance?: number;
  settledPayouts?: number;
  recentOrders?: any[];
  onEditProduct?: (product: any) => void;
}

export default function MobileVendorOverview({
  vendorProfile,
  dbProducts,
  totalLiveInventory,
  profileStatus,
  pendingOrdersCount = 0,
  activeEscrowBalance = 0,
  settledPayouts = 0,
  recentOrders = [],
  onEditProduct,
}: MobileVendorOverviewProps) {
  const [copied, setCopied] = useState(false);
  const isBoutique = isBoutiqueVendor(vendorProfile);
  const specialty = getVendorSpecialty(vendorProfile);
  const specialtyInfo = getVendorSpecialtyInfo(specialty, isBoutique);

  const isVerified = profileStatus?.isVerified || profileStatus?.approvalStatus === 'approved';
  const isRejected = profileStatus?.approvalStatus === 'rejected';
  const isPendingReview = !isVerified && !isRejected && profileStatus?.isProfileSaved;
  const isProfileIncomplete = !isVerified && !isRejected && profileStatus && !profileStatus.isProfileSaved;

  const missingLogo = !vendorProfile?.logoUrl || !vendorProfile.logoUrl.trim();
  const missingBio = !vendorProfile?.bio || !vendorProfile.bio.trim();
  const missingHub = !vendorProfile?.location || !vendorProfile.location.trim();
  const needsStoreProfile = missingLogo || missingBio || missingHub;
  const needsBankSetup =
    !vendorProfile?.bankName ||
    vendorProfile.bankName === 'Not Configured' ||
    !vendorProfile?.accountNumber ||
    vendorProfile.accountNumber === 'N/A' ||
    vendorProfile.accountNumber.trim().length < 10;

  const brandName = vendorProfile?.brandName || 'Atelier';
  const storeSlug = encodeURIComponent(vendorProfile?.id || brandName);
  const storeUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/brand/${storeSlug}`
      : `https://irisimi.ng/brand/${storeSlug}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
      confetti({ particleCount: 30, spread: 45, origin: { y: 0.7 } });
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-6 select-none">
      {/* 1. Native Status Banners (Only shown when action is needed) */}
      {isRejected && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2.5">
          <div className="flex items-center gap-2 text-rose-500">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-[11px] font-mono-luxury uppercase tracking-wider">
              Profile Needs Update
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
            {profileStatus?.rejectionReason
              ? `Admin note: "${profileStatus.rejectionReason}"`
              : 'Please review your store bio, turnaround times, or dispatch hub and resubmit.'}
          </p>
          <Link
            href="/vendor-portal/atelier"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-500 text-white text-[11px] font-mono-luxury uppercase tracking-wider"
          >
            <span>Update Profile</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {isProfileIncomplete && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-xs font-medium text-[var(--text-primary)]">Finish Store Setup</div>
              <p className="text-[11px] text-[var(--text-secondary)] font-light">
                Complete your brand details to start publishing pieces.
              </p>
            </div>
          </div>
          <Link
            href="/vendor-portal/atelier"
            className="px-3.5 py-1.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] font-mono-luxury uppercase shrink-0"
          >
            Setup
          </Link>
        </div>
      )}

      {isPendingReview && (
        <div className="px-4 py-3 rounded-2xl bg-[var(--bg-surface)] border border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-medium text-[var(--text-primary)]">Verification In Progress</div>
              <span className="text-[11px] text-[var(--text-muted)] font-light block truncate">
                Our team is reviewing your store profile.
              </span>
            </div>
          </div>
          <Link
            href="/vendor-portal/atelier"
            className="text-[11px] font-mono-luxury text-[var(--gold-accent)] shrink-0"
          >
            View
          </Link>
        </div>
      )}

      {/* 2. Signature Native Wallet Hero Card (Replaces Repetitive Web Header Box) */}
      <section className="relative rounded-[26px] bg-[#0D0D10] text-white p-5 overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.18)] border border-white/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full opacity-35"
          style={{
            background: 'radial-gradient(circle, rgba(230, 195, 103, 0.45), transparent 70%)',
          }}
        />

        {/* Top Meta Row */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[#E6C367] truncate">
              {specialtyInfo.badge}
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono-luxury shrink-0 ${
              isVerified
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isVerified ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {isVerified ? 'Verified' : 'In Review'}
          </span>
        </div>

        {/* Main Escrow Balance */}
        <div className="relative z-10 mt-4 flex items-end justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono-luxury uppercase tracking-[0.16em] text-zinc-400 block">
              Active Escrow Balance
            </span>
            <div className="font-editorial text-[38px] font-normal tracking-tight text-white leading-none mt-1">
              ₦{activeEscrowBalance.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px] font-mono-luxury text-zinc-400">
              <span>Settled: ₦{settledPayouts.toLocaleString()}</span>
              <span>·</span>
              <span className="text-emerald-400">T+0 Auto-Payout</span>
            </div>
          </div>

          <Link
            href="/vendor-portal/settlements"
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-[10px] font-mono-luxury uppercase tracking-wider text-white shrink-0 active:scale-95 transition-transform"
          >
            Payouts ›
          </Link>
        </div>

        {/* Hairline + Location & Fee Footer */}
        <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400 font-light">
          <span className="truncate max-w-[65%]">
            {vendorProfile?.location || 'Dispatch hub not configured'}
          </span>
          <span className="text-[#E6C367] font-mono-luxury text-[10px] uppercase tracking-wider shrink-0">
            0% Launch Fee
          </span>
        </div>
      </section>

      {/* 3. Native iOS Circular Quick-Action Bar (Monochrome & Clean) */}
      <section className="grid grid-cols-4 gap-2">
        {isVerified ? (
          <Link
            href="/vendor-portal/publish"
            className="flex flex-col items-center gap-1.5 py-2 active:scale-95 transition-transform"
          >
            <div className="h-12 w-12 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center shadow-sm">
              <Plus className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <span className="text-[11px] text-[var(--text-primary)] font-normal">Add Drop</span>
          </Link>
        ) : (
          <Link
            href="/vendor-portal/atelier"
            className="flex flex-col items-center gap-1.5 py-2 active:scale-95 transition-transform"
          >
            <div className="h-12 w-12 rounded-full bg-[var(--bg-surface)] border border-amber-500/40 text-amber-500 flex items-center justify-center">
              <Lock className="h-[18px] w-[18px]" strokeWidth={1.7} />
            </div>
            <span className="text-[11px] text-[var(--text-primary)] font-normal">Verify</span>
          </Link>
        )}

        <Link
          href="/vendor-portal/stories"
          className="flex flex-col items-center gap-1.5 py-2 active:scale-95 transition-transform"
        >
          <div className="h-12 w-12 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center justify-center">
            <Camera className="h-[19px] w-[19px]" strokeWidth={1.65} />
          </div>
          <span className="text-[11px] text-[var(--text-primary)] font-normal">Story</span>
        </Link>

        <Link
          href="/vendor-portal/orders"
          className="flex flex-col items-center gap-1.5 py-2 active:scale-95 transition-transform"
        >
          <div className="relative h-12 w-12 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center justify-center">
            <PackageCheck className="h-[19px] w-[19px]" strokeWidth={1.65} />
            {pendingOrdersCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] px-1 rounded-full bg-[var(--gold-accent)] text-black text-[10px] font-mono-luxury flex items-center justify-center">
                {pendingOrdersCount}
              </span>
            )}
          </div>
          <span className="text-[11px] text-[var(--text-primary)] font-normal">Orders</span>
        </Link>

        <button
          type="button"
          onClick={handleCopyLink}
          className="flex flex-col items-center gap-1.5 py-2 active:scale-95 transition-transform cursor-pointer"
        >
          <div
            className={`h-12 w-12 rounded-full border flex items-center justify-center transition-colors ${
              copied
                ? 'bg-emerald-500 border-emerald-500 text-black'
                : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)]'
            }`}
          >
            {copied ? (
              <Check className="h-[19px] w-[19px]" strokeWidth={2} />
            ) : (
              <Share2 className="h-[18px] w-[18px]" strokeWidth={1.65} />
            )}
          </div>
          <span className="text-[11px] text-[var(--text-primary)] font-normal">
            {copied ? 'Copied' : 'Share'}
          </span>
        </button>
      </section>

      {/* 4. Unified 3-Column Hairline KPI Strip (Replaces Boxy 2x2 Grid) */}
      <section className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] grid grid-cols-3 divide-x divide-[var(--border-subtle)] py-3.5">
        <Link href="/vendor-portal/products" className="px-3 text-center active:opacity-70">
          <div className="font-editorial text-2xl font-normal text-[var(--text-primary)] leading-none">
            {dbProducts.length}
          </div>
          <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] mt-1.5 block">
            Live Drops
          </span>
        </Link>

        <Link href="/vendor-portal/orders" className="px-3 text-center active:opacity-70">
          <div className="font-editorial text-2xl font-normal text-[var(--gold-accent)] leading-none">
            {pendingOrdersCount}
          </div>
          <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] mt-1.5 block">
            To Pack
          </span>
        </Link>

        <Link href="/vendor-portal/products" className="px-3 text-center active:opacity-70">
          <div className="font-editorial text-2xl font-normal text-[var(--text-primary)] leading-none">
            {totalLiveInventory}
          </div>
          <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] mt-1.5 block">
            In Stock
          </span>
        </Link>
      </section>

      {/* 5. Post-Approval Setup Checklist (Only shown if profile/bank still incomplete) */}
      {isVerified && (needsStoreProfile || needsBankSetup) && (
        <section className="space-y-2">
          <div className="px-1 text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--gold-accent)]">
            Finish Store Setup
          </div>
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            <Link
              href="/vendor-portal/atelier"
              className="px-4 py-3.5 flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Store className="h-[18px] w-[18px] text-[var(--text-primary)] shrink-0" strokeWidth={1.65} />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-[var(--text-primary)]">Store Profile</div>
                  <p className="text-[11px] text-[var(--text-muted)] font-light truncate">
                    {needsStoreProfile
                      ? `Add ${[missingLogo && 'Logo', missingBio && 'Bio', missingHub && 'Hub'].filter(Boolean).join(', ')}`
                      : 'Logo, bio & dispatch hub ready'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {needsStoreProfile ? (
                  <span className="text-[10px] font-mono-luxury text-amber-500">Required</span>
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
              </div>
            </Link>

            <Link
              href="/vendor-portal/settlements"
              className="px-4 py-3.5 flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <DollarSign className="h-[18px] w-[18px] text-[var(--text-primary)] shrink-0" strokeWidth={1.65} />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-[var(--text-primary)]">Payout Bank Account</div>
                  <p className="text-[11px] text-[var(--text-muted)] font-light truncate">
                    {needsBankSetup ? 'Connect 10-digit bank account for payouts' : 'Connected for T+0 escrow payout'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {needsBankSetup ? (
                  <span className="text-[10px] font-mono-luxury text-rose-500">Missing</span>
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* 6. Recent Patron Orders (Native Grouped iOS List) */}
      {recentOrders.length > 0 && (
        <section className="space-y-2">
          <div className="px-1 flex items-center justify-between">
            <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Recent Orders ({recentOrders.length})
            </span>
            <Link
              href="/vendor-portal/orders"
              className="text-[11px] font-mono-luxury text-[var(--gold-accent)]"
            >
              See All
            </Link>
          </div>

          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            {recentOrders.slice(0, 3).map((ord: any, idx: number) => {
              const rowSubtotal = (ord.items || []).reduce(
                (s: number, i: any) => s + (Number(i.price) || 0) * (i.quantity || 1),
                0
              );
              const isSettled = ord.trackingStage >= 4;

              return (
                <Link
                  key={ord.id || ord.orderNumber || idx}
                  href="/vendor-portal/orders"
                  className="px-4 py-3.5 flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                      {ord.orderNumber}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] font-light truncate mt-0.5">
                      {ord.customerName} · {ord.date || 'Recent'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <div className="font-editorial text-base text-[var(--text-primary)] leading-tight">
                        ₦{rowSubtotal.toLocaleString()}
                      </div>
                      <span
                        className={`text-[10px] font-mono-luxury ${
                          isSettled ? 'text-emerald-500' : 'text-[var(--gold-accent)]'
                        }`}
                      >
                        {isSettled ? 'Settled' : 'In Escrow'}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[var(--text-muted)]/60" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 7. Storefront Link Compact Bar */}
      <section className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono-luxury uppercase tracking-[0.16em] text-[var(--text-muted)]">
            <ShieldCheck className="h-3 w-3 text-[var(--gold-accent)]" />
            <span>Your Storefront Link</span>
          </div>
          <div className="text-xs font-mono-luxury text-[var(--text-primary)] truncate mt-0.5 select-all">
            {storeUrl.replace(/^https?:\/\//, '')}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="h-9 w-9 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] active:scale-95 cursor-pointer"
            aria-label="Copy storefront link"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <Link
            href={`/brand/${storeSlug}`}
            target="_blank"
            className="h-9 px-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[11px] font-mono-luxury inline-flex items-center gap-1 active:scale-95"
          >
            <span>Open</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* 8. Live Catalog Snapshot (Native iOS Grouped Rows — Tap Any Piece to Edit) */}
      <section className="space-y-2">
        <div className="px-1 flex items-center justify-between">
          <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Catalog ({dbProducts.length})
          </span>
          <Link
            href="/vendor-portal/products"
            className="text-[11px] font-mono-luxury text-[var(--gold-accent)]"
          >
            Manage All
          </Link>
        </div>

        {dbProducts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-3">
            <Store className="h-7 w-7 text-[var(--text-muted)] mx-auto" strokeWidth={1.5} />
            <div className="space-y-1">
              <h4 className="font-editorial text-xl font-normal text-[var(--text-primary)]">
                No Listings Yet
              </h4>
              <p className="text-xs text-[var(--text-muted)] font-light max-w-xs mx-auto">
                Publish your first ready-to-ship or made-to-order piece to start taking escrow orders.
              </p>
            </div>
            <Link
              href="/vendor-portal/publish"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-wider"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Publish First Piece</span>
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            {dbProducts.slice(0, 4).map((piece, i) => {
              const qty = Number(piece.stockQuantity ?? 0);
              return (
                <button
                  key={piece.id || i}
                  type="button"
                  onClick={() => onEditProduct?.(piece)}
                  className="w-full text-left px-3.5 py-3 flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-[var(--border-subtle)]">
                      <Image
                        src={
                          piece.imageUrl ||
                          piece.image_url ||
                          (Array.isArray(piece.images) && piece.images[0]) ||
                          '/images/no-product.svg'
                        }
                        alt={piece.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                        {piece.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-light mt-0.5">
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${
                            qty === 0 ? 'bg-rose-500' : qty <= 3 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        />
                        <span>{qty === 0 ? 'Sold out' : `${qty} left`}</span>
                        <span>·</span>
                        <span>{piece.unitsSold ?? 0} sold</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="font-editorial text-base text-[var(--text-primary)]">
                        ₦{Number(piece.price || 0).toLocaleString()}
                      </div>
                      <span className="text-[10px] font-mono-luxury text-[var(--gold-accent)]">Edit</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[var(--text-muted)]/60" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
