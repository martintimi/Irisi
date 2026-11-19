'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store/useStore';
import {
  Crown, Check, Sparkles, ShieldCheck, Store, Layers,
  TrendingDown, Loader2, ExternalLink, CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: any) => { openIframe: () => void };
    };
  }
}

export default function VendorPlusPage() {
  const { vendorProfile } = useStore();
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [billing, setBilling] = useState<any>(null);
  const [vendorPlan, setVendorPlan] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const vendorKey = vendorProfile.id || vendorProfile.email || '';

  const loadPlan = useCallback(async () => {
    setLoading(true);
    try {
      const qs = vendorKey ? `?vendorId=${encodeURIComponent(vendorKey)}` : '';
      const res = await fetch(`/api/vendor/subscription${qs}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setBilling(data.billing);
        setVendorPlan(data.vendorPlan);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [vendorKey]);

  useEffect(() => {
    loadPlan();
    // Preload Paystack Inline script cleanly
    if (typeof window !== 'undefined' && !document.getElementById('paystack-inline-js')) {
      const s = document.createElement('script');
      s.id = 'paystack-inline-js';
      s.src = 'https://js.paystack.co/v1/inline.js';
      s.async = true;
      document.body.appendChild(s);
    }
  }, [loadPlan]);

  const activateWithRef = async (paymentRef: string) => {
    setUpgrading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/vendor/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendorPlan?.vendorId || vendorProfile.id,
          email: vendorProfile.email,
          action: 'activate_plus',
          paymentRef,
          durationDays: 30,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Could not activate ÌRÍSÍ Plus.');
        return;
      }
      setStatusMsg(data.message || 'ÌRÍSÍ Plus is now active on your storefront!');
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 }, colors: ['#c4972e', '#10b981', '#ffffff'] });
      await loadPlan();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Activation failed.');
    } finally {
      setUpgrading(false);
    }
  };

  const handleSubscribePlus = () => {
    setErrorMsg('');
    setStatusMsg('');
    const amountNgn = Number(billing?.plusMonthlyPriceNgn || 5000);
    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
    const ref = `IRISI_PLUS_${Date.now()}`;

    if (typeof window !== 'undefined' && window.PaystackPop && paystackKey) {
      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email: vendorProfile.email || 'vendor@irisimi.ng',
        amount: Math.round(amountNgn * 100),
        currency: 'NGN',
        ref,
        metadata: {
          custom_fields: [
            { display_name: 'Brand', variable_name: 'brand', value: vendorProfile.brandName || 'Vendor' },
            { display_name: 'Plan', variable_name: 'plan', value: 'IRISI Plus Monthly' },
          ],
        },
        callback: (response: { reference: string }) => {
          activateWithRef(response.reference);
        },
        onClose: () => {},
      });
      handler.openIframe();
    } else {
      setErrorMsg('Paystack checkout is initializing. Please refresh or contact admin support.');
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--gold-accent)]" />
      </div>
    );
  }

  const freeLaunch = Boolean(billing?.freeLaunchMode);
  const plusPrice = Number(billing?.plusMonthlyPriceNgn ?? 5000);
  const freeComm = Number(billing?.freeTierCommissionPercent ?? 8);
  const plusComm = Number(billing?.plusTierCommissionPercent ?? 5);
  const freeCap = Number(billing?.freeTierProductLimit ?? 12);
  const isPlus = Boolean(vendorPlan?.isPlus);

  return (
    <div className="px-0.5 sm:px-6 md:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-8 md:pb-24">
      {/* Header */}
      <div className="md:border-b md:border-[var(--border-subtle)] md:pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] text-[11px] font-mono-luxury uppercase tracking-widest">
            <Crown className="h-3.5 w-3.5" />
            <span>Merchant Plans &amp; Fees</span>
          </div>
          <h1 className="font-editorial text-[26px] sm:text-4xl font-normal text-[var(--text-primary)] leading-tight">
            ÌRÍSÍ Plus
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-light max-w-xl">
            Clean white-label storefront, lower commission, unlimited listings, and 48h Lookbook Stories.
          </p>
        </div>

        <div className="px-4 py-2.5 rounded-2xl surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury">
          <span className="text-[var(--text-muted)] block text-[10px] uppercase">Current Status</span>
          <span className="text-[var(--text-primary)]">
            {freeLaunch
              ? 'Free Launch Promo · 0% Fee + Full Plus Access'
              : isPlus
              ? `ÌRÍSÍ Plus Active (${plusComm}% fee)`
              : `Free Tier (${freeComm}% fee · ${vendorPlan?.publishedProductCount || 0}/${freeCap} listings)`}
          </span>
        </div>
      </div>

      {freeLaunch && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="text-[var(--text-primary)] font-medium">
              Launch Promo Period Is Active — 0% Commission &amp; Full Plus Features Unlocked!
            </p>
            <p className="text-[var(--text-secondary)] font-light">
              As a founding brand, you currently enjoy unlimited uploads, your clean branded storefront link, and Lookbook Stories completely free. Once the promotional launch window ends, you can stay on Free ({freeComm}% per completed order) or upgrade to ÌRÍSÍ Plus (₦{plusPrice.toLocaleString()}/month for {plusComm}% commission).
            </p>
          </div>
        </div>
      )}

      {statusMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500">
          {errorMsg}
        </div>
      )}

      {/* Plan Comparison Cards (Option B — Freemium vs Plus) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Tier */}
        <div className="p-7 rounded-3xl surface-card border border-[var(--border-subtle)] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-luxury uppercase tracking-widest text-[var(--text-muted)]">Standard</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--badge-bg)] text-[10px] font-mono-luxury text-[var(--text-secondary)]">
                Pay Only When You Sell
              </span>
            </div>
            <div>
              <h2 className="font-editorial text-3xl font-normal text-[var(--text-primary)]">Free</h2>
              <p className="text-xs font-mono-luxury text-[var(--text-muted)] mt-1">
                ₦0 / month · {freeLaunch ? '0% during launch promo' : `${freeComm}% per completed order`}
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] font-light pt-2">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Up to {freeCap} active published products</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Basic shareable storefront link</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> 100% Escrow payment protection &amp; SMS alerts</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Automated waybills &amp; doorstep/park delivery</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Ready-to-Ship &amp; Made-to-Order fulfillment</li>
            </ul>
          </div>
          <div className="pt-4 border-t border-[var(--border-subtle)] text-[11px] font-mono-luxury text-[var(--text-muted)]">
            Commission is only charged on completed, escrow-released orders.
          </div>
        </div>

        {/* ÌRÍSÍ Plus Tier */}
        <div className="p-7 rounded-3xl surface-card border-2 border-[var(--gold-accent)]/60 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)]">
                <Crown className="h-3.5 w-3.5" />
                <span>Recommended</span>
              </span>
              {isPlus && !freeLaunch && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono-luxury">
                  Active Plan
                </span>
              )}
            </div>
            <div>
              <h2 className="font-editorial text-3xl font-normal text-[var(--text-primary)]">
                ÌRÍSÍ Plus
              </h2>
              <p className="text-xs font-mono-luxury text-[var(--gold-accent)] mt-1">
                ₦{plusPrice.toLocaleString()} / month · {freeLaunch ? '0% launch promo' : `Lower ${plusComm}% commission`}
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] font-light pt-2">
              <li className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-[var(--gold-accent)] shrink-0" />
                <span><strong>Lower {plusComm}% commission</strong> (saves {Math.max(0, freeComm - plusComm)}% on every sale — pays for itself!)</span>
              </li>
              <li className="flex items-center gap-2">
                <Store className="h-4 w-4 text-[var(--gold-accent)] shrink-0" />
                <span><strong>Clean White-Label Storefront Link</strong> — zero competitor recommendations</span>
              </li>
              <li className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[var(--gold-accent)] shrink-0" />
                <span><strong>Unlimited Product Listings</strong> + Batch Upload &amp; AI Copy Generator</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--gold-accent)] shrink-0" />
                <span><strong>48h Lookbook Stories &amp; Follower Drop Alerts</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--gold-accent)] shrink-0" />
                <span><strong>Gold Verified Badge</strong>, Priority Discovery &amp; Direct-Sales POS</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
            {freeLaunch ? (
              <div className="w-full py-3 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-center text-xs font-mono-luxury uppercase tracking-wider">
                Included Free During Launch Period
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSubscribePlus}
                disabled={upgrading}
                className="w-full py-3.5 rounded-full bg-[var(--gold-accent)] text-black text-xs font-mono-luxury uppercase tracking-wider hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {upgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                <span>{isPlus ? `Renew ÌRÍSÍ Plus (+30 Days · ₦${plusPrice.toLocaleString()})` : `Activate ÌRÍSÍ Plus · ₦${plusPrice.toLocaleString()}/mo`}</span>
              </button>
            )}
            {vendorPlan?.plusExpiresAt && !freeLaunch && (
              <p className="text-[10px] font-mono-luxury text-center text-[var(--text-muted)]">
                Active until {new Date(vendorPlan.plusExpiresAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Storefront Link */}
      {vendorPlan?.vendorId && (
        <div className="p-5 rounded-2xl surface-card border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-mono-luxury uppercase text-[10px] text-[var(--text-muted)] block">Your Dedicated Storefront Link</span>
            <span className="font-mono-luxury text-[var(--text-primary)]">irisimi.ng/brand/{vendorPlan.vendorId}</span>
          </div>
          <Link
            href={`/brand/${vendorPlan.vendorId}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--border-subtle)] text-xs font-mono-luxury hover:border-[var(--gold-accent)]"
          >
            <span>Open Storefront</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
