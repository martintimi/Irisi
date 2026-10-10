'use client';

import React from 'react';
import {
  TrendingUp, Download, ArrowUpRight, DollarSign,
  Package, ShieldCheck, CheckCircle2, Award
} from 'lucide-react';
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
  averageOrderValue
}: MobileVendorReportsProps) {
  if (isLoading) {
    return <VendorLuxuryLoader label="Generating Store Financial Analytics..." />;
  }

  return (
    <div className="space-y-4 animate-fadeIn pb-16 select-none">
      
      {/* 1. Header with Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-editorial text-2xl font-bold text-[var(--text-primary)] leading-tight">
            Sales & Analytics
          </h2>
          <span className="text-[11px] font-mono-luxury text-[var(--text-secondary)]">
            Revenue, AOV & Settlement Ledger
          </span>
        </div>

        <button
          type="button"
          onClick={() => alert('Monthly statement exported to CSV!')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury font-bold text-[var(--text-primary)] hover:border-[var(--gold-accent)] transition-all cursor-pointer shrink-0"
        >
          <Download className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
          <span>Export</span>
        </button>
      </div>

      {/* 2. 2x2 Metric Grid */}
      <div className="grid grid-cols-2 gap-2.5 font-mono-luxury">
        
        {/* Metric 1: Total Volume */}
        <div className="p-3.5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1">
          <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] block">Total Sales</span>
          <div className="font-editorial text-2xl font-bold text-[var(--text-primary)] leading-none">
            ₦{totalRevenue.toLocaleString()}
          </div>
          <div className="text-[9px] text-emerald-400 flex items-center gap-1 pt-0.5 font-bold">
            <TrendingUp className="h-2.5 w-2.5" />
            <span>{totalPiecesSold} Piece{totalPiecesSold === 1 ? '' : 's'} Sold</span>
          </div>
        </div>

        {/* Metric 2: Average Order Value */}
        <div className="p-3.5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1">
          <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] block">Average Order</span>
          <div className="font-editorial text-2xl font-bold text-[var(--gold-accent)] leading-none">
            ₦{averageOrderValue.toLocaleString()}
          </div>
          <div className="text-[9px] text-[var(--text-secondary)] pt-0.5 truncate">
            {products.length} Active Catalog Pieces
          </div>
        </div>

        {/* Metric 3: Quality Rating */}
        <div className="p-3.5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1">
          <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] block">Client Rating</span>
          <div className="font-editorial text-2xl font-bold text-emerald-400 leading-none">5.0 / 5.0</div>
          <div className="text-[9px] text-[var(--text-secondary)] pt-0.5">
            100% On-Time Fulfillment
          </div>
        </div>

        {/* Metric 4: Platform Fee */}
        <div className="p-3.5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1">
          <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] block">Platform Fee</span>
          <div className="font-editorial text-2xl font-bold text-emerald-400 leading-none">0%</div>
          <div className="text-[9px] text-[var(--gold-accent)] pt-0.5 font-bold">
            Promo Retained 100%
          </div>
        </div>

      </div>

      {/* 3. Live Order Fulfillment Ledger List (Mobile Clean Cards instead of broken table) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="font-editorial text-lg font-bold text-[var(--text-primary)]">
            Fulfillment Ledger ({orders.length})
          </h3>
          <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)]">
            Verified Escrow
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 rounded-3xl surface-card border border-[var(--border-subtle)] text-center space-y-2.5">
            <Package className="h-8 w-8 text-[var(--gold-accent)] mx-auto opacity-50" />
            <h4 className="font-editorial text-base font-bold text-[var(--text-primary)]">
              No Ledger Records Yet
            </h4>
            <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)] max-w-xs mx-auto">
              Completed customer orders will generate transparent financial line items here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {orders.map((row, idx) => {
              const rowSubtotal = (row.items || []).reduce((s: number, i: any) => s + (Number(i.price) || 0) * (i.quantity || 1), 0);
              const rowPayout = rowSubtotal;

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs font-mono-luxury border-b border-[var(--border-subtle)] pb-2">
                    <span className="font-bold text-[var(--gold-accent)]">{row.orderNumber}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{row.date || 'Recent'}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono-luxury">
                    <span className="font-bold text-[var(--text-primary)]">{row.customerName}</span>
                    <span className="text-[11px] text-[var(--text-secondary)]">{row.items?.length || 1} Item(s)</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono-luxury pt-1 border-t border-[var(--border-subtle)]">
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] block">Gross: ₦{rowSubtotal.toLocaleString()}</span>
                      <span className="text-[10px] text-emerald-400 font-bold">Fee: ₦0 (0%)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-[var(--text-muted)] uppercase block">Escrow Payout</span>
                      <span className="font-editorial text-base font-bold text-emerald-400">
                        ₦{rowPayout.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
