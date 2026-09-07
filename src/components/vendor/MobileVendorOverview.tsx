'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  TrendingUp, PackageCheck, DollarSign, Sparkles,
  Plus, ExternalLink, ShieldCheck, ShoppingBag,
  Scissors, AlertTriangle, AlertCircle, Clock,
  ArrowRight, Store, Copy, Check, Share2, Banknote, Lock,
  Gem, Footprints, Shirt, Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';

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

import { isBoutiqueVendor, getVendorSpecialty, getVendorSpecialtyInfo } from '@/types';

export default function MobileVendorOverview({
  vendorProfile,
  dbProducts,
  totalLiveInventory,
  profileStatus,
  pendingOrdersCount = 0,
  activeEscrowBalance = 0,
  settledPayouts = 0,
  recentOrders = [],
  onEditProduct
}: MobileVendorOverviewProps) {
  const [copied, setCopied] = useState(false);
  const isBoutique = isBoutiqueVendor(vendorProfile);
  const specialty = getVendorSpecialty(vendorProfile);
  const specialtyInfo = getVendorSpecialtyInfo(specialty, isBoutique);

  const isVerified = profileStatus?.isVerified || profileStatus?.approvalStatus === 'approved';
  const isRejected = profileStatus?.approvalStatus === 'rejected';
  const isPendingReview = !isVerified && !isRejected && profileStatus?.isProfileSaved;
  const isProfileIncomplete = !isVerified && !isRejected && profileStatus && !profileStatus.isProfileSaved;

  const brandName = vendorProfile?.brandName || 'Atelier';
  const storeUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/brand/${encodeURIComponent(brandName)}`
    : `https://veyra.ng/brand/${encodeURIComponent(brandName)}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-16 select-none">
      
      {/* 1. Status Notification Alerts if needed */}
      {isRejected && (
        <div className="p-4 rounded-2xl surface-card border border-rose-500/30 space-y-2">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
            <span className="text-[11px] font-mono-luxury font-bold uppercase tracking-wider text-rose-400">Profile Returned for Correction</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-mono-luxury leading-relaxed">
            {profileStatus.rejectionReason ? `Admin Feedback: "${profileStatus.rejectionReason}"` : 'Please review your store bio, turnaround times, or delivery zone rates and resubmit.'}
          </p>
          <Link
            href="/vendor-portal/atelier"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-mono-luxury uppercase font-bold mt-1 shadow-sm"
          >
            <span>Update Store Details</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {isProfileIncomplete && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-[11px] font-mono-luxury font-bold uppercase">Setup Required</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-mono-luxury leading-relaxed">
            Complete your brand profile & contacts to activate verified ready-to-wear drops.
          </p>
          <Link
            href="/vendor-portal/atelier"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500 text-black text-[11px] font-mono-luxury uppercase font-bold mt-1"
          >
            <span>Complete Profile</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {isPendingReview && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-amber-400 animate-pulse shrink-0" />
            <div>
              <span className="text-[11px] font-mono-luxury font-bold text-amber-400 uppercase block">Under Review</span>
              <span className="text-[10px] text-[var(--text-secondary)]">Super Admin is verifying your store.</span>
            </div>
          </div>
          <Link
            href="/vendor-portal/atelier"
            className="px-3 py-1 rounded-full surface-card border border-amber-500/30 text-amber-400 text-[10px] font-mono-luxury font-bold uppercase shrink-0"
          >
            View
          </Link>
        </div>
      )}

      {/* 2. Welcome & Brand Card */}
      <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3 shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between gap-2 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-[9px] font-mono-luxury uppercase font-bold border border-[var(--gold-accent)]/20 mb-1.5">
              {specialty === 'caps' ? (
                <Crown className="h-3 w-3" />
              ) : specialty === 'accessories' ? (
                <Sparkles className="h-3 w-3" />
              ) : specialty === 'jewelry' ? (
                <Gem className="h-3 w-3" />
              ) : specialty === 'footwear' ? (
                <Footprints className="h-3 w-3" />
              ) : specialty === 'native_tailoring' ? (
                <Scissors className="h-3 w-3" />
              ) : specialty === 'streetwear' || specialty === 'apparel' ? (
                <Shirt className="h-3 w-3" />
              ) : isBoutique ? (
                <ShoppingBag className="h-3 w-3" />
              ) : (
                <Scissors className="h-3 w-3" />
              )}
              <span>{specialtyInfo.badge}</span>
            </div>
            <h2 className="font-editorial text-2xl font-bold text-[var(--text-primary)] leading-tight">
              {vendorProfile.designerName || vendorProfile.brandName}
            </h2>
            <span className="text-[11px] font-mono-luxury text-[var(--text-secondary)] block mt-0.5">
              {vendorProfile.location || 'Lagos, Nigeria'}
            </span>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono-luxury font-bold uppercase border shrink-0 ${
            isVerified ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
          }`}>
            {isVerified ? '● Verified' : '● In Review'}
          </span>
        </div>

        {/* Quick Action Chips */}
        <div className="grid grid-cols-2 gap-2 pt-1 relative z-10">
          {isVerified ? (
            <Link
              href="/vendor-portal/publish"
              className="py-2.5 px-3 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-[10px] font-bold shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Add New Drop</span>
            </Link>
          ) : (
            <Link
              href="/vendor-portal/atelier"
              className="py-2.5 px-3 rounded-2xl bg-[var(--bg-secondary)] border border-amber-500/30 text-amber-400 font-mono-luxury uppercase text-[10px] font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <Lock className="h-3 w-3 text-amber-400" />
              <span>Verify Store to Drop</span>
            </Link>
          )}
          <Link
            href="/vendor-portal/orders"
            className="py-2.5 px-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono-luxury uppercase text-[10px] font-bold flex items-center justify-center gap-1.5 hover:border-[var(--gold-accent)] active:scale-95 transition-transform"
          >
            <PackageCheck className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
            <span>Pack Orders ({pendingOrdersCount})</span>
          </Link>
        </div>

        {/* Background glow */}
        <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-[var(--gold-accent)]/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 3. 2x2 Compact Metric Grid Connected to Real Endpoints */}
      <div className="grid grid-cols-2 gap-2.5 font-mono-luxury">
        
        {/* Metric 1: Live Drops */}
        <div className="p-3.5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1">
          <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] block">Live Drops</span>
          <div className="font-editorial text-2xl font-normal text-[var(--gold-accent)] leading-none">{dbProducts.length}</div>
          <div className="text-[9px] text-emerald-400 flex items-center gap-1 pt-0.5">
            <TrendingUp className="h-2.5 w-2.5" />
            <span>Active in catalog</span>
          </div>
        </div>

        {/* Metric 2: Orders to Pack */}
        <div className="p-3.5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1">
          <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] block">Orders to Pack</span>
          <div className="font-editorial text-2xl font-normal text-[var(--text-primary)] leading-none">{pendingOrdersCount}</div>
          <div className="text-[9px] text-[var(--text-secondary)] pt-0.5">
            {pendingOrdersCount === 0 ? 'Queue is clear' : 'Awaiting dispatch'}
          </div>
        </div>

        {/* Metric 3: Total Stock Units */}
        <div className="p-3.5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1">
          <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] block">Stock Units</span>
          <div className="font-editorial text-2xl font-normal text-emerald-400 leading-none">{totalLiveInventory}</div>
          <div className="text-[9px] text-[var(--text-secondary)] pt-0.5 truncate">
            Across {dbProducts.length} piece{dbProducts.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Metric 4: Escrow Settlement */}
        <div className="p-3.5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1">
          <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] block">Active Escrow</span>
          <div className="font-editorial text-2xl font-normal text-[var(--gold-accent)] leading-none">
            ₦{activeEscrowBalance.toLocaleString()}
          </div>
          <div className="text-[9px] text-emerald-400 pt-0.5 font-bold">
            Auto-Settles T+0
          </div>
        </div>

      </div>

      {/* 4. Live Incoming Orders Section (If Any) */}
      {recentOrders.length > 0 && (
        <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3 shadow-sm text-xs font-mono-luxury">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <PackageCheck className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
              <span>Incoming Patron Orders ({recentOrders.length})</span>
            </span>
            <Link
              href="/vendor-portal/orders"
              className="text-[10px] text-[var(--gold-accent)] uppercase font-bold hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="space-y-2">
            {recentOrders.slice(0, 3).map((ord: any, idx: number) => {
              const rowSubtotal = (ord.items || []).reduce((s: number, i: any) => s + (Number(i.price) || 0) * (i.quantity || 1), 0);
              const isSettled = ord.trackingStage >= 4;

              return (
                <div
                  key={ord.id || ord.orderNumber || idx}
                  className="p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-[var(--gold-accent)] block text-xs">
                      {ord.orderNumber}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {ord.customerName} · {ord.date || 'Recent'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-editorial font-bold text-sm text-[var(--text-primary)] block">
                      ₦{rowSubtotal.toLocaleString()}
                    </span>
                    <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded-full inline-block ${
                      isSettled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {isSettled ? 'Settled' : 'In Escrow'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Storefront Link Sharing Card */}
      <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[var(--gold-accent)]" />
            <span className="text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)]">
              Your Boutique Link
            </span>
          </div>
          <span className="text-[9px] font-mono-luxury font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10">
            0% Fee
          </span>
        </div>

        <p className="text-[11px] text-[var(--text-secondary)] font-mono-luxury leading-relaxed">
          Share in your Instagram bio or WhatsApp to take verified orders:
        </p>

        <div className="flex items-center gap-2">
          <div className="flex-1 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[10px] font-mono-luxury text-[var(--text-muted)] truncate select-all">
            {storeUrl}
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className={`p-2.5 rounded-xl border text-xs font-mono-luxury font-bold transition-all cursor-pointer shrink-0 ${
              copied
                ? 'bg-emerald-500 text-black border-emerald-500'
                : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--gold-accent)]'
            }`}
            title="Copy link"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyLink}
            className="py-2 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[10px] font-mono-luxury uppercase font-bold text-[var(--text-primary)] flex items-center justify-center gap-1.5"
          >
            <Share2 className="h-3 w-3 text-[var(--gold-accent)]" />
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          <Link
            href={`/brand/${encodeURIComponent(brandName)}`}
            target="_blank"
            className="py-2 px-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] font-mono-luxury uppercase font-bold flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Preview Store</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* 6. Live Product Drops List */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="font-editorial text-lg font-bold text-[var(--text-primary)]">
            Live Product Drops ({dbProducts.length})
          </h3>
          <div className="flex items-center gap-2.5">
            <Link
              href="/vendor-portal/products"
              className="text-[11px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold hover:underline"
            >
              Manage ({dbProducts.length})
            </Link>
            <Link
              href="/vendor-portal/publish"
              className="text-[11px] font-mono-luxury uppercase text-[var(--text-primary)] font-bold hover:underline"
            >
              + Add
            </Link>
          </div>
        </div>

        {dbProducts.length === 0 ? (
          <div className="p-8 rounded-3xl surface-card border border-[var(--border-subtle)] text-center space-y-2.5">
            <Store className="h-8 w-8 text-[var(--gold-accent)] mx-auto opacity-50" />
            <h4 className="font-editorial text-base font-bold text-[var(--text-primary)]">
              No Product Drops Yet
            </h4>
            <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)] max-w-xs mx-auto">
              Upload your first ready-to-wear piece or bespoke design to start receiving patron orders.
            </p>
            <Link
              href="/vendor-portal/publish"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] font-mono-luxury uppercase font-bold shadow-md mt-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add First Piece</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {dbProducts.map((piece, i) => (
              <div
                key={piece.id || i}
                onClick={() => onEditProduct?.(piece)}
                className="p-3 rounded-2xl surface-card border border-[var(--border-subtle)] flex items-center justify-between gap-3 hover:border-[var(--gold-accent)]/50 transition-all shadow-sm cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-13 w-12 rounded-xl overflow-hidden bg-black shrink-0 border border-[var(--border-subtle)]">
                    <Image
                      src={piece.imageUrl || piece.image_url || '/images/products/BlackTrapStarHoodie.jpg'}
                      alt={piece.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-[var(--text-primary)] truncate">
                      {piece.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono-luxury text-[var(--text-secondary)] mt-0.5 flex-wrap">
                      <span className="text-[var(--gold-accent)] uppercase font-bold truncate">{piece.category || 'Ready-to-Wear'}</span>
                      <span>·</span>
                      <span className={piece.stockQuantity === 0 ? 'text-rose-400 font-bold' : piece.stockQuantity <= 3 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {piece.stockQuantity === 0 ? '0 Left' : `${piece.stockQuantity ?? 0} Left`}
                      </span>
                      <span>·</span>
                      <span className="text-[var(--text-primary)] font-bold">{piece.unitsSold ?? 0} Sold</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-editorial font-bold text-sm text-[var(--text-primary)]">
                    ₦{Number(piece.price || 0).toLocaleString()}
                  </div>
                  {piece.stockQuantity === 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-[9px] font-mono-luxury uppercase font-bold border border-rose-500/30">
                      🔴 Sold Out
                    </span>
                  ) : piece.stockQuantity <= 3 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[9px] font-mono-luxury uppercase font-bold border border-amber-500/30 animate-pulse">
                      ⚠️ Only {piece.stockQuantity} Left
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono-luxury uppercase text-emerald-400 font-bold">
                      Active · {piece.stockQuantity} in Stock
                    </span>
                  )}
                  <div className="text-[9px] text-[var(--gold-accent)] font-mono-luxury mt-0.5 font-bold">
                    Tap to Edit ✏️
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-2">
              <Link
                href="/vendor-portal/products"
                className="w-full py-3 px-4 rounded-2xl surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-center text-xs font-mono-luxury font-bold text-[var(--gold-accent)] uppercase flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Open Full Catalog & Stock Manager ({dbProducts.length})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
