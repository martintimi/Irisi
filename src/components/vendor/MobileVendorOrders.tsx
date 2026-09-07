'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  PackageCheck, Truck, CheckCircle2, ShieldCheck,
  Phone, User, Package, RefreshCw, Send, Loader2,
  X, Check, Star, AlertCircle, ChevronRight, Sparkles, Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import VendorLuxuryLoader from './VendorLuxuryLoader';

interface MobileVendorOrdersProps {
  vendorOrders: any[];
  isLoading: boolean;
  onRefresh: () => void;
  onPackReady: (ord: any) => Promise<void>;
  onConfirmDispatch: (order: any, waybill: string, driverPhone: string) => Promise<void>;
  onOpenWaybill?: (order: any) => void;
  isUpdatingStatus: boolean;
}

export default function MobileVendorOrders({
  vendorOrders,
  isLoading,
  onRefresh,
  onPackReady,
  onConfirmDispatch,
  onOpenWaybill,
  isUpdatingStatus
}: MobileVendorOrdersProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'dispatched' | 'delivered'>('all');
  
  // Dispatch Modal State
  const [dispatchModalOrder, setDispatchModalOrder] = useState<any | null>(null);
  const [waybillInput, setWaybillInput] = useState('');
  const [driverPhoneInput, setDriverPhoneInput] = useState('');

  const toPackCount = vendorOrders.filter((o: any) => o.trackingStage <= 2).length;
  const dispatchedCount = vendorOrders.filter((o: any) => o.trackingStage === 3).length;
  const deliveredCount = vendorOrders.filter((o: any) => o.trackingStage >= 4).length;

  const filteredOrders = vendorOrders.filter((ord: any) => {
    if (activeTab === 'pending') return ord.trackingStage <= 2;
    if (activeTab === 'dispatched') return ord.trackingStage === 3;
    if (activeTab === 'delivered') return ord.trackingStage >= 4;
    return true;
  });

  const handleOpenDispatch = (ord: any) => {
    setDispatchModalOrder(ord);
    setWaybillInput('');
    setDriverPhoneInput('');
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchModalOrder) return;
    await onConfirmDispatch(dispatchModalOrder, waybillInput, driverPhoneInput);
    setDispatchModalOrder(null);
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-16 select-none">
      
      {/* 1. Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-editorial text-2xl font-bold text-[var(--text-primary)] leading-tight">
            Store Orders
          </h2>
          <span className="text-[11px] font-mono-luxury text-[var(--text-secondary)]">
            Fulfillment & Escrow Payouts
          </span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury text-[var(--text-primary)] hover:border-[var(--gold-accent)] transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-[var(--gold-accent)] ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Horizontal Filter Segmented Bar (Non-overflowing, clean wrap/scroll) */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] overflow-x-auto no-scrollbar font-mono-luxury text-xs">
        {[
          { id: 'all', label: `All (${vendorOrders.length})` },
          { id: 'pending', label: `To Pack (${toPackCount})` },
          { id: 'dispatched', label: `Dispatched (${dispatchedCount})` },
          { id: 'delivered', label: `Delivered (${deliveredCount})` },
        ].map((tab) => {
          const isChosen = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isChosen
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Orders List */}
      {isLoading ? (
        <VendorLuxuryLoader label="Loading Customer Orders..." />
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 rounded-3xl surface-card text-center space-y-3 border border-[var(--border-subtle)]">
          <Package className="h-8 w-8 text-[var(--gold-accent)] mx-auto opacity-50" />
          <h3 className="font-editorial text-lg font-bold text-[var(--text-primary)]">
            No Orders Found
          </h3>
          <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)] max-w-xs mx-auto">
            {activeTab === 'all'
              ? 'New orders containing your brand garments will appear here instantly.'
              : `No orders currently in the ${activeTab} stage.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((ord: any) => (
            <div
              key={ord.id}
              className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3 shadow-sm"
            >
              {/* Order Top Meta */}
              <div className="flex items-start justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
                <div>
                  <span className="font-editorial text-base font-bold text-[var(--gold-accent)] block">
                    {ord.orderNumber}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono-luxury block">
                    {ord.date || 'Recent'}
                  </span>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono-luxury font-bold uppercase border shrink-0 ${
                  ord.trackingStage === 4
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : ord.trackingStage === 3
                    ? 'bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30'
                    : ord.trackingStage === 2
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {ord.trackingStage === 4 ? '● Delivered' : ord.trackingStage === 3 ? '● Dispatched' : ord.trackingStage === 2 ? '● Packing' : '● Escrow Secured'}
                </span>
              </div>

              {/* Customer Contact Bar */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury">
                <div className="flex items-center gap-2 min-w-0">
                  <User className="h-3.5 w-3.5 text-[var(--gold-accent)] shrink-0" />
                  <span className="font-bold text-[var(--text-primary)] truncate">{ord.customerName}</span>
                </div>

                {ord.customerPhone && (
                  <a
                    href={`tel:${ord.customerPhone}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[10px] text-[var(--gold-accent)] font-bold shrink-0 active:scale-95"
                  >
                    <Phone className="h-3 w-3" />
                    <span>Call</span>
                  </a>
                )}
              </div>

              {/* Items in package */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold block">
                  Items in Package ({ord.items.length}):
                </span>

                {ord.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                    <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-black shrink-0 border border-[var(--border-subtle)]">
                      <Image
                        src={item.imageUrl || '/images/products/BlackTrapStarHoodie.jpg'}
                        alt={item.productName}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-[var(--text-primary)] truncate">{item.productName}</h4>
                      <div className="text-[10px] font-mono-luxury text-[var(--text-secondary)] flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span>Size: <strong className="text-[var(--gold-accent)]">{item.size || 'M'}</strong></span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <span>Color:</span>
                          <span
                            className="inline-block h-2 w-2 rounded-full border border-white/20 shadow-xs shrink-0"
                            style={{ backgroundColor: item.colorHex || (typeof item.color === 'string' && item.color.startsWith('#') ? item.color : '#111111') }}
                          />
                          <strong className="text-[var(--text-primary)]">{item.colorName || item.color || 'Standard'}</strong>
                        </span>
                        <span>·</span>
                        <span>Qty: <strong className="text-[var(--gold-accent)]">{item.quantity || 1}</strong></span>
                      </div>
                      <div className="text-[11px] font-mono-luxury text-[var(--gold-accent)] font-bold">
                        ₦{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dedicated Logistics & Pickup Dispatch Hub Ribbon */}
              <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono-luxury font-bold uppercase flex items-center gap-1 ${
                    ord.deliveryMethod === 'park_pickup'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {ord.deliveryMethod === 'park_pickup' ? <Truck className="h-3 w-3" /> : <Truck className="h-3 w-3" />}
                    <span>{ord.deliveryMethod === 'park_pickup' ? 'Park Waybill' : 'Door Delivery'}</span>
                  </span>

                  <span className="text-[11px] font-mono-luxury font-bold text-[var(--text-primary)]">
                    Courier: <span className="text-[var(--gold-accent)]">{ord.courierName || 'GIG Logistics'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono-luxury pt-1 border-t border-[var(--border-subtle)]/60">
                  <div className="p-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)] block text-[9px]">Waybill No:</span>
                    <span className="font-bold text-[var(--gold-accent)]">{ord.waybillNumber || 'Pending'}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)] block text-[9px]">Package Weight:</span>
                    <span className="font-bold text-[var(--text-primary)]">{ord.packageWeightKg || 0.8}kg</span>
                  </div>
                </div>

                {ord.instructions && (
                  <p className="text-[10px] font-mono-luxury text-[var(--text-secondary)] leading-tight">
                    {ord.instructions}
                  </p>
                )}
              </div>

              {/* Payout & Delivery Breakdown */}
              <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-1.5 text-xs font-mono-luxury">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-secondary)]">Destination:</span>
                  <span className="font-bold text-[var(--text-primary)] text-right truncate max-w-[180px]">{ord.deliveryAddress}</span>
                </div>
                {ord.deliveryMethod === 'park_pickup' && ord.dropoffStation && (
                  <div className="flex items-center justify-between text-[11px] text-amber-400">
                    <span>Collection Terminal:</span>
                    <span className="font-bold truncate max-w-[170px]">{ord.dropoffStation}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-secondary)]">Delivery Method / Fee:</span>
                  <span className="text-[var(--gold-accent)] font-bold">
                    {ord.deliveryMethod === 'park_pickup' ? 'Pay on Collection' : `₦${Number(ord.vendorDeliveryFee || 0).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
                  <span className="text-[var(--text-primary)] font-bold">Your Escrow Payout:</span>
                  <span className="font-editorial text-base font-bold text-emerald-400">
                    ₦{Number(ord.totalPayout || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Courier & Driver details if dispatched - NO DUPLICATE WAYBILL */}
              {ord.trackingStage >= 3 && ord.trackingDetails?.driverPhone && (
                <div className="p-2.5 rounded-2xl bg-[var(--gold-subtle)]/40 border border-[var(--gold-accent)]/30 flex items-center justify-between text-[11px] font-mono-luxury text-[var(--text-primary)]">
                  <div className="flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                    <span>Courier: <strong>{ord.courierName}</strong></span>
                  </div>
                  <a href={`tel:${ord.trackingDetails.driverPhone}`} className="text-[var(--gold-accent)] font-bold flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{ord.trackingDetails.driverPhone}</span>
                  </a>
                </div>
              )}

              {/* Customer Fit Review if Delivered */}
              {ord.trackingStage >= 4 && ord.customer_measurements?.reviews && ord.customer_measurements.reviews.length > 0 && (
                <div className="p-3 rounded-2xl bg-[var(--gold-accent)]/[0.04] border border-[var(--gold-accent)]/30 space-y-1 text-xs font-mono-luxury">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--gold-accent)] font-bold flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current text-[var(--gold-accent)]" />
                      <span>Client Review</span>
                    </span>
                    <span className="text-[9px] text-amber-400 font-bold">
                      {ord.customer_measurements.reviews[0].rating}.0 ★
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-primary)] italic">
                    &quot;{ord.customer_measurements.reviews[0].comment}&quot;
                  </p>
                </div>
              )}

              {/* Action Fulfillment Buttons */}
              <div className="pt-1 space-y-2">
                {onOpenWaybill && (
                  <button
                    type="button"
                    onClick={() => onOpenWaybill(ord)}
                    className="w-full py-2.5 rounded-full surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[var(--text-primary)] font-mono-luxury uppercase text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                    <span>Print Shipping Waybill</span>
                  </button>
                )}

                {ord.trackingStage === 1 && (
                  <button
                    type="button"
                    onClick={() => onPackReady(ord)}
                    disabled={isUpdatingStatus}
                    className="w-full py-3 rounded-full bg-[var(--gold-accent)] text-black font-mono-luxury uppercase text-xs font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer disabled:opacity-50"
                  >
                    <PackageCheck className="h-4 w-4" />
                    <span>
                      {ord.deliveryMethod === 'park_pickup'
                        ? 'Mark Ready for Motor Park'
                        : ord.courierServiceType === 'pickup'
                        ? 'Mark Ready for Courier Pickup'
                        : 'Mark Ready for Station Drop-off'}
                    </span>
                  </button>
                )}

                {ord.trackingStage === 2 && (
                  <button
                    type="button"
                    onClick={() => handleOpenDispatch(ord)}
                    className="w-full py-3 rounded-full bg-[var(--gold-accent)] text-black font-mono-luxury uppercase text-xs font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer"
                  >
                    <Truck className="h-4 w-4" />
                    <span>Dispatch / Driver Waybill</span>
                  </button>
                )}

                {ord.trackingStage === 3 && (
                  <div className="py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center text-xs font-mono-luxury font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>In Transit with Courier</span>
                  </div>
                )}

                {ord.trackingStage === 4 && (
                  <div className="py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-center text-xs font-mono-luxury font-bold flex items-center justify-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Delivered & Settled in Escrow</span>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Mobile Dispatch Modal Bottom Sheet */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="surface-card rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 max-w-md w-full border border-[var(--border-subtle)] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-[var(--gold-subtle)] text-[var(--gold-accent)] flex items-center justify-center shrink-0">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-editorial text-lg font-bold text-[var(--text-primary)]">
                    Dispatch {dispatchModalOrder.orderNumber}
                  </h3>
                  <span className="text-[10px] font-mono-luxury text-[var(--text-secondary)]">
                    Customer receives live driver SMS & waybill
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDispatchModalOrder(null)}
                className="p-1 rounded-full text-[var(--text-muted)] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-3 text-xs font-mono-luxury">
              <div>
                <label className="block uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Dispatch Rider / Driver Phone Number:
                </label>
                <input
                  type="tel"
                  value={driverPhoneInput}
                  onChange={(e) => setDriverPhoneInput(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="w-full px-3.5 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-bold"
                  required
                />
              </div>

              <div>
                <label className="block uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Waybill / Tracking No (Optional):
                </label>
                <input
                  type="text"
                  value={waybillInput}
                  onChange={(e) => setWaybillInput(e.target.value)}
                  placeholder="e.g. GIG-1234 or PARK-LAGOS-01"
                  className="w-full px-3.5 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDispatchModalOrder(null)}
                  className="flex-1 py-3 rounded-full surface-card border border-[var(--border-subtle)] uppercase font-bold text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="flex-1 py-3 rounded-full bg-[var(--gold-accent)] text-black uppercase font-bold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isUpdatingStatus ? <Sparkles className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Confirm</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
