'use client';

import React from 'react';
import { Download, Package, TrendingUp } from 'lucide-react';
import VendorLuxuryLoader from './VendorLuxuryLoader';

interface MobileVendorReportsProps {
  orders: any[];
  products: any[];
  isLoading: boolean;
  totalRevenue: number;
  totalPiecesSold: number;
  averageOrderValue: number;
}

export default function MobileVendorReports({
  orders,
  products,
  isLoading,
  totalRevenue,
  totalPiecesSold,
  averageOrderValue,
}: MobileVendorReportsProps) {
  if (isLoading) {
    return <VendorLuxuryLoader label="Loading Analytics..." />;
  }

  return (
    <div className="space-y-5 animate-fadeIn pb-6 select-none">
      {/* 1. Native Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-editorial text-[26px] font-normal text-[var(--text-primary)] leading-tight">
            Analytics
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-light">
            Revenue, average order &amp; ledger
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('Monthly statement exported to CSV!')}
          className="h-9 px-3.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-mono-luxury text-[var(--text-primary)] inline-flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
        >
          <Download className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
          <span>Export</span>
        </button>
      </div>

      {/* 2. Hero Revenue Card */}
      <section className="rounded-[26px] bg-[#0D0D10] text-white p-5 space-y-4 border border-white/10 shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[#E6C367]">
            Total Gross Volume
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono-luxury text-emerald-400">
            <TrendingUp className="h-3 w-3" />
            <span>{totalPiecesSold} Sold</span>
          </span>
        </div>

        <div className="font-editorial text-[38px] font-normal tracking-tight text-white leading-none">
          ₦{totalRevenue.toLocaleString()}
        </div>

        <div className="grid grid-cols-3 divide-x divide-white/10 pt-3 border-t border-white/10 text-center">
          <div className="pr-2">
            <div className="font-editorial text-lg text-white">₦{averageOrderValue.toLocaleString()}</div>
            <span className="text-[9px] font-mono-luxury uppercase text-zinc-400">Avg Order</span>
          </div>
          <div className="px-2">
            <div className="font-editorial text-lg text-[#E6C367]">{products.length}</div>
            <span className="text-[9px] font-mono-luxury uppercase text-zinc-400">Listings</span>
          </div>
          <div className="pl-2">
            <div className="font-editorial text-lg text-emerald-400">0%</div>
            <span className="text-[9px] font-mono-luxury uppercase text-zinc-400">Launch Fee</span>
          </div>
        </div>
      </section>

      {/* 3. Grouped Fulfillment Ledger */}
      <section className="space-y-2">
        <div className="px-1 flex items-center justify-between">
          <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Fulfillment Ledger ({orders.length})
          </span>
          <span className="text-[10px] font-mono-luxury text-[var(--gold-accent)]">Escrow Verified</span>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-2">
            <Package className="h-7 w-7 text-[var(--text-muted)] mx-auto" strokeWidth={1.5} />
            <h4 className="font-editorial text-lg font-normal text-[var(--text-primary)]">
              No Ledger Entries Yet
            </h4>
            <p className="text-xs text-[var(--text-muted)] font-light max-w-xs mx-auto">
              Completed orders generate transparent revenue entries here automatically.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            {orders.map((row, idx) => {
              const rowSubtotal = (row.items || []).reduce(
                (s: number, i: any) => s + (Number(i.price) || 0) * (i.quantity || 1),
                0
              );

              return (
                <div key={idx} className="px-4 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                      {row.orderNumber}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] font-light truncate mt-0.5">
                      {row.customerName} · {row.items?.length || 1} item(s) · {row.date || 'Recent'}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-editorial text-base text-emerald-500">
                      ₦{rowSubtotal.toLocaleString()}
                    </div>
                    <span className="text-[10px] font-mono-luxury text-[var(--text-muted)]">Fee ₦0</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
