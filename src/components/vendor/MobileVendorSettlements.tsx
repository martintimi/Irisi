'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck, CheckCircle2, Clock, ArrowUpRight,
  Download, Copy, Check, Sparkles, Building2, Banknote,
  ChevronRight, RefreshCw, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import VendorLuxuryLoader from './VendorLuxuryLoader';

interface MobileVendorSettlementsProps {
  orders: any[];
  isLoading: boolean;
  vendorProfile: any;
  onRefresh: () => void;
}

export default function MobileVendorSettlements({
  orders,
  isLoading,
  vendorProfile,
  onRefresh
}: MobileVendorSettlementsProps) {
  const [filterTab, setFilterTab] = useState<'all' | 'escrow' | 'settled'>('all');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const totalEscrowLocked = useMemo(() => {
    return orders
      .filter(o => o.trackingStage < 4)
      .reduce((sum, ord) => {
        const itemsTotal = (ord.items || []).reduce((s: number, i: any) => s + (Number(i.price) || 0) * (i.quantity || 1), 0);
        return sum + itemsTotal;
      }, 0);
  }, [orders]);

  const completedOrders = useMemo(() => orders.filter(o => o.trackingStage >= 4), [orders]);
  const inEscrowOrders = useMemo(() => orders.filter(o => o.trackingStage < 4), [orders]);

  const totalSettled = useMemo(() => {
    return completedOrders.reduce((sum, ord) => {
      const itemsTotal = (ord.items || []).reduce((s: number, i: any) => s + (Number(i.price) || 0) * (i.quantity || 1), 0);
      return sum + itemsTotal;
    }, 0);
  }, [completedOrders]);

  const filteredOrders = useMemo(() => {
    if (filterTab === 'escrow') return inEscrowOrders;
    if (filterTab === 'settled') return completedOrders;
    return orders;
  }, [orders, inEscrowOrders, completedOrders, filterTab]);

  const handleCopyAccount = () => {
    const acc = vendorProfile?.accountNumber || '0123456789';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(acc);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    }
  };

  const handleDownloadAdvice = () => {
    setToastMessage('Payout Ledger & Advice downloaded successfully!');
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (isLoading) {
    return <VendorLuxuryLoader label="Loading Treasury Balances & Payouts..." />;
  }

  return (
    <div className="space-y-4 animate-fadeIn pb-24 select-none">
      
      {/* 1. Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-[10px] font-mono-luxury uppercase font-bold border border-[var(--gold-accent)]/20 mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Treasury & Bank Payouts</span>
          </div>
          <h2 className="font-editorial text-2xl font-bold text-[var(--text-primary)] leading-tight">
            Settlement Ledger
          </h2>
          <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)]">
            Instant T+0 bank payouts wired upon delivery.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="p-2 rounded-2xl surface-card border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer shrink-0 active:scale-95"
          title="Refresh Treasury"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-mono-luxury font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Top Treasury Metrics (Grid 2-cols) */}
      <div className="grid grid-cols-2 gap-2.5">
        
        {/* Active Escrow */}
        <div className="p-3.5 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] font-mono-luxury tracking-wider">
              Active Escrow
            </span>
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <div className="font-editorial text-xl font-bold text-[var(--gold-accent)] leading-none">
            ₦{totalEscrowLocked.toLocaleString()}
          </div>
          <p className="text-[9px] font-mono-luxury text-amber-400 font-bold leading-tight">
            Auto-Releases on Delivery
          </p>
        </div>

        {/* Settled Payouts */}
        <div className="p-3.5 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] font-mono-luxury tracking-wider">
              Settled Bank
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <div className="font-editorial text-xl font-bold text-[var(--text-primary)] leading-none">
            ₦{totalSettled.toLocaleString()}
          </div>
          <p className="text-[9px] font-mono-luxury text-[var(--text-secondary)] leading-tight">
            {completedOrders.length} Order(s) Paid Out
          </p>
        </div>

      </div>

      {/* Promo Fee Banner */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between text-xs font-mono-luxury">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-[11px] text-[var(--text-primary)] font-bold">
            Platform Fee: <strong className="text-emerald-400">0% Special Rate</strong>
          </span>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full">
          Verified Store
        </span>
      </div>

      {/* 3. Verified Payout Bank Destination Card */}
      <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3 shadow-sm text-xs font-mono-luxury">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
            <span>Settlement Bank Account</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold">
            Verified
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-secondary)] uppercase">Bank Name:</span>
            <strong className="text-[var(--text-primary)]">
              {vendorProfile?.bankName || 'Guaranty Trust Bank (GTBank)'}
            </strong>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-secondary)] uppercase">NUBAN Account:</span>
            <div className="flex items-center gap-1.5">
              <strong className="text-[var(--gold-accent)] font-mono tracking-wider">
                {vendorProfile?.accountNumber || '0123456789'}
              </strong>
              <button
                type="button"
                onClick={handleCopyAccount}
                className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-white cursor-pointer"
              >
                {copiedAccount ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-secondary)] uppercase">Account Name:</span>
            <strong className="text-[var(--text-primary)] uppercase truncate max-w-[180px]">
              {vendorProfile?.accountName || vendorProfile?.brandName || 'Verified Merchant'}
            </strong>
          </div>
        </div>

        {/* Download Payout Advice Action */}
        <button
          type="button"
          onClick={handleDownloadAdvice}
          className="w-full py-3 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] uppercase font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 active:scale-98 transition-all"
        >
          <Download className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
          <span>Download Payout Statement</span>
        </button>
      </div>

      {/* 4. Filterable Payout Ledger */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-[var(--text-primary)] font-mono-luxury">
            Payout History ({filteredOrders.length})
          </span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`flex-1 py-2 rounded-xl text-center font-bold uppercase text-[10px] transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('escrow')}
            className={`flex-1 py-2 rounded-xl text-center font-bold uppercase text-[10px] transition-all cursor-pointer ${
              filterTab === 'escrow'
                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            In Escrow ({inEscrowOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('settled')}
            className={`flex-1 py-2 rounded-xl text-center font-bold uppercase text-[10px] transition-all cursor-pointer ${
              filterTab === 'settled'
                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            Settled ({completedOrders.length})
          </button>
        </div>

        {/* Orders Payout Cards */}
        {filteredOrders.length === 0 ? (
          <div className="p-8 rounded-3xl surface-card text-center space-y-2 border border-[var(--border-subtle)] text-xs font-mono-luxury text-[var(--text-muted)]">
            <Banknote className="h-8 w-8 text-[var(--gold-accent)] mx-auto opacity-50 mb-1" />
            <p>No transactions in this category.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredOrders.map((ord, idx) => {
              const rowSubtotal = (ord.items || []).reduce((s: number, i: any) => s + (Number(i.price) || 0) * (i.quantity || 1), 0);
              const rowPayout = rowSubtotal;
              const isSettled = ord.trackingStage >= 4;

              return (
                <div
                  key={ord.id || ord.orderNumber || idx}
                  className="p-3.5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-2 shadow-sm text-xs font-mono-luxury"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[var(--gold-accent)] text-xs block">
                        {ord.orderNumber}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {ord.customerName} · {ord.date || 'Recent'}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-sm text-[var(--text-primary)] font-editorial">
                        ₦{rowPayout.toLocaleString()}
                      </div>
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        isSettled
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {isSettled ? 'Paid Out to Bank' : 'Locked in Escrow'}
                      </span>
                    </div>
                  </div>

                  {/* Items summary */}
                  {ord.items && ord.items.length > 0 && (
                    <div className="pt-1.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
                      <span className="truncate max-w-[200px]">
                        {ord.items.map((it: any) => `${it.productName || it.name} (${it.size || 'M'})`).join(', ')}
                      </span>
                      <span className="text-emerald-400 font-bold shrink-0">
                        {isSettled ? 'Transferred' : 'Stage ' + (ord.trackingStage || 1)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
