'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store/useStore';
import { vendorFetch, getActiveVendorId } from '@/lib/services/apiClient';
import {
  DollarSign, CreditCard, ShieldCheck, CheckCircle2,
  Clock, ArrowUpRight, TrendingUp, Download, Loader2, Sparkles, RefreshCw
} from 'lucide-react';
import MobileVendorSettlements from '@/components/vendor/MobileVendorSettlements';
import VendorLuxuryLoader from '@/components/vendor/VendorLuxuryLoader';

export default function VendorSettlementsPage() {
  const { vendorProfile } = useStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettlements = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await vendorFetch('/api/orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error('Error loading settlements:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  const totalEscrowLocked = orders.reduce((sum, ord) => {
    const itemsTotal = (ord.items || []).reduce((s: number, i: any) => s + (Number(i.price) || 0) * (i.quantity || 1), 0);
    // Escrow balance is strictly clothes sales. Delivery fees belong to couriers / transport drivers.
    return sum + itemsTotal;
  }, 0);

  const completedOrders = orders.filter(o => o.trackingStage >= 4);
  const totalSettled = completedOrders.reduce((sum, ord) => {
    const itemsTotal = (ord.items || []).reduce((s: number, i: any) => s + (Number(i.price) || 0) * (i.quantity || 1), 0);
    return sum + itemsTotal;
  }, 0);

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden">
        <MobileVendorSettlements
          orders={orders}
          isLoading={isLoading}
          vendorProfile={vendorProfile}
          onRefresh={loadSettlements}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block space-y-8 animate-fadeIn max-w-7xl pb-20">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
              Settlements & Merchant Treasury
            </h1>
            <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-1">
              Automated payouts wired directly into your verified Nigerian commercial bank account with 0% platform promo fee.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadSettlements}
              disabled={isLoading}
              className="px-4 py-2 rounded-full surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] hover:border-[var(--gold-accent)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => alert('Payout ledger statement downloaded!')}
              className="px-4 py-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] hover:border-[var(--gold-accent)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4 text-[var(--gold-accent)]" />
              <span>Download Payout Advice</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <VendorLuxuryLoader label="Loading Treasury Balances & Payouts..." />
        ) : (
        <>
          {/* 3 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl surface-card space-y-2 border border-[var(--border-subtle)]">
              <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase tracking-wider">Active Escrow Balance</span>
              <div className="font-editorial text-3xl font-bold text-[var(--gold-accent)]">
                ₦{totalEscrowLocked.toLocaleString()}
              </div>
              <span className="text-xs text-emerald-500 font-mono-luxury font-bold">Secured & Auto-Releases upon Delivery</span>
            </div>

            <div className="p-6 rounded-3xl surface-card space-y-2 border border-[var(--border-subtle)]">
              <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase tracking-wider">Settled Payouts</span>
              <div className="font-editorial text-3xl font-bold text-[var(--text-primary)]">
                ₦{totalSettled.toLocaleString()}
              </div>
              <span className="text-xs text-[var(--text-secondary)] font-mono-luxury">{completedOrders.length} Order(s) Completed</span>
            </div>

            <div className="p-6 rounded-3xl surface-card space-y-2 border border-[var(--border-subtle)]">
              <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase tracking-wider">Active Platform Fee</span>
              <div className="font-editorial text-3xl font-bold text-emerald-500">0% Special Rate</div>
              <span className="text-xs text-[var(--text-secondary)] font-mono-luxury">Verified Partner Store</span>
            </div>
          </div>

          {/* Verified Bank Account Details & Settlement History */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left 6 Cols: Bank Details Card */}
            <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl surface-card space-y-4 border border-[var(--border-subtle)] shadow-md">
              <div className="flex items-center gap-2 text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold">
                <ShieldCheck className="h-4 w-4" />
                <span>Verified Merchant Settlement Account</span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 text-xs font-mono-luxury">
                  <span className="text-[var(--text-secondary)] uppercase">Settlement Bank:</span>
                  <span className="font-bold text-[var(--text-primary)]">{vendorProfile.bankName || 'Guaranty Trust Bank (GTBank)'}</span>
                </div>

                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 text-xs font-mono-luxury">
                  <span className="text-[var(--text-secondary)] uppercase">Account Number:</span>
                  <span className="font-bold font-mono text-[var(--gold-accent)] tracking-wider">{vendorProfile.accountNumber || '0123456789'}</span>
                </div>

                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 text-xs font-mono-luxury">
                  <span className="text-[var(--text-secondary)] uppercase">Account Name:</span>
                  <span className="font-bold text-[var(--text-primary)]">{vendorProfile.accountName || vendorProfile.brandName}</span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs font-mono-luxury">
                  <span className="text-[var(--text-secondary)] uppercase">Payout Frequency:</span>
                  <span className="font-bold text-emerald-400">Instant T+0 on Delivery Approval</span>
                </div>
              </div>
            </div>

            {/* Right 6 Cols: Active Escrow Payouts List */}
            <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl surface-card space-y-4 border border-[var(--border-subtle)] shadow-md">
              <div className="flex items-center gap-2 text-xs font-mono-luxury uppercase text-[var(--text-primary)] font-bold">
                <Clock className="h-4 w-4 text-[var(--gold-accent)]" />
                <span>Incoming Order Payouts ({orders.length})</span>
              </div>

              {orders.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono-luxury text-[var(--text-muted)]">
                  No active payouts pending. Completed orders will appear here.
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord, idx) => {
                    const rowSubtotal = (ord.items || []).reduce((s: number, i: any) => s + (Number(i.price) || 0) * (i.quantity || 1), 0);
                    const rowPayout = rowSubtotal;

                    return (
                      <div key={idx} className="p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono-luxury">
                        <div>
                          <div className="font-bold text-[var(--gold-accent)]">{ord.orderNumber}</div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{ord.customerName} · {ord.date}</div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-sm text-emerald-400">₦{rowPayout.toLocaleString()}</div>
                          <span className={`text-[10px] uppercase font-bold ${ord.trackingStage >= 4 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {ord.trackingStage >= 4 ? 'Settled to Bank' : 'In Escrow'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </>
      )}

      </div>
    </>
  );
}
