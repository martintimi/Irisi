'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import {
  PackageCheck, Truck, CheckCircle2, ShieldCheck,
  Phone, User, Package, RefreshCw, Send, Loader2,
  X, Star, AlertCircle, Printer, Camera
} from 'lucide-react';
import VendorLuxuryLoader from './VendorLuxuryLoader';

interface MobileVendorOrdersProps {
  vendorOrders: any[];
  isLoading: boolean;
  onRefresh: () => void;
  onPackReady: (ord: any) => Promise<void>;
  onConfirmDispatch: (order: any, waybill: string, driverPhone: string, preDispatchProofUrl?: string) => Promise<void>;
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
  isUpdatingStatus,
}: MobileVendorOrdersProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'dispatched' | 'delivered'>('all');

  // Dispatch Bottom Sheet State (includes Pre-Dispatch Photo Proof)
  const [dispatchModalOrder, setDispatchModalOrder] = useState<any | null>(null);
  const [waybillInput, setWaybillInput] = useState('');
  const [driverPhoneInput, setDriverPhoneInput] = useState('');
  const [preDispatchProofUrl, setPreDispatchProofUrl] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [dispatchError, setDispatchError] = useState('');

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
    setWaybillInput(ord.waybillNumber || ord.trackingDetails?.waybillNumber || '');
    setDriverPhoneInput(ord.driverPhone || ord.trackingDetails?.driverPhone || '');
    setPreDispatchProofUrl(ord.preDispatchProofUrl || '');
    setDispatchError('');
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingProof(true);
    setDispatchError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setPreDispatchProofUrl(data.url);
      } else {
        setDispatchError(data.error || 'Could not upload proof photo.');
      }
    } catch {
      setDispatchError('Upload failed. Please try again.');
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchModalOrder) return;
    const waybill = waybillInput.trim();
    const driverPhone = driverPhoneInput.trim();

    if (!waybill && !driverPhone) {
      setDispatchError('Enter a waybill / tracking code or rider phone number.');
      return;
    }

    setDispatchError('');
    await onConfirmDispatch(dispatchModalOrder, waybill, driverPhone, preDispatchProofUrl || undefined);
    setDispatchModalOrder(null);
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-6 select-none">
      {/* 1. Native App Screen Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-editorial text-[26px] font-normal text-[var(--text-primary)] leading-tight">
            Orders
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-light">
            Fulfillment &amp; escrow payouts
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="h-9 w-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
          aria-label="Refresh orders"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-[var(--gold-accent)]' : ''}`} />
        </button>
      </div>

      {/* 2. Native iOS Segmented Control */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
        {[
          { id: 'all', label: `All (${vendorOrders.length})` },
          { id: 'pending', label: `Pack (${toPackCount})` },
          { id: 'dispatched', label: `Sent (${dispatchedCount})` },
          { id: 'delivered', label: `Done (${deliveredCount})` },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 rounded-xl text-[11px] font-mono-luxury transition-all cursor-pointer truncate ${
                active
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Orders Feed */}
      {isLoading ? (
        <VendorLuxuryLoader label="Loading Orders..." />
      ) : filteredOrders.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-2.5">
          <Package className="h-7 w-7 text-[var(--text-muted)] mx-auto" strokeWidth={1.5} />
          <h3 className="font-editorial text-xl font-normal text-[var(--text-primary)]">
            No Orders Here
          </h3>
          <p className="text-xs text-[var(--text-muted)] font-light max-w-xs mx-auto">
            {activeTab === 'all'
              ? 'New paid orders will show up here immediately with live SMS & push activity.'
              : `No orders currently in this stage.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredOrders.map((ord: any) => {
            const stageLabel =
              ord.trackingStage === 4
                ? 'Delivered'
                : ord.trackingStage === 3
                ? 'In Transit'
                : ord.trackingStage === 2
                ? 'Packed'
                : 'Escrow Secured';
            const stageDot =
              ord.trackingStage === 4
                ? 'bg-emerald-500'
                : ord.trackingStage === 3
                ? 'bg-[var(--gold-accent)]'
                : ord.trackingStage === 2
                ? 'bg-amber-500'
                : 'bg-sky-500';

            return (
              <article
                key={ord.id}
                className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden shadow-xs"
              >
                {/* Top Order Strip */}
                <div className="px-4 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between gap-2">
                  <div>
                    <div className="font-editorial text-lg text-[var(--text-primary)] leading-tight">
                      {ord.orderNumber}
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] font-light">
                      {ord.date || 'Recent'}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[10px] font-mono-luxury text-[var(--text-primary)]">
                    <span className={`h-1.5 w-1.5 rounded-full ${stageDot}`} />
                    <span>{stageLabel}</span>
                  </span>
                </div>

                {/* Buyer Strip */}
                <div className="px-4 py-2.5 bg-[var(--bg-primary)]/50 border-b border-[var(--border-subtle)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" strokeWidth={1.7} />
                    <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {ord.customerName}
                    </span>
                  </div>
                  {ord.customerPhone && (
                    <a
                      href={`tel:${ord.customerPhone}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-mono-luxury text-[var(--text-primary)] active:scale-95 shrink-0"
                    >
                      <Phone className="h-3 w-3 text-[var(--gold-accent)]" />
                      <span>Call</span>
                    </a>
                  )}
                </div>

                {/* Ordered Items */}
                <div className="divide-y divide-[var(--border-subtle)]">
                  {(ord.items || []).map((item: any, idx: number) => (
                    <div key={idx} className="px-4 py-3 flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-[var(--border-subtle)]">
                        <Image
                          src={item.imageUrl || '/images/no-product.svg'}
                          alt={item.productName || 'Piece'}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                          {item.productName}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] font-light flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span>Size {item.size || 'M'}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <span
                              className="inline-block h-2 w-2 rounded-full border border-black/15 dark:border-white/20"
                              style={{
                                backgroundColor:
                                  item.colorHex ||
                                  (typeof item.color === 'string' && item.color.startsWith('#') ? item.color : '#111111'),
                              }}
                            />
                            <span>{item.colorName || item.color || 'Standard'}</span>
                          </span>
                          <span>·</span>
                          <span>Qty {item.quantity || 1}</span>
                        </div>
                      </div>
                      <div className="font-editorial text-sm text-[var(--text-primary)] shrink-0">
                        ₦{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery, Tracking & Escrow Summary */}
                <div className="px-4 py-3 bg-[var(--bg-primary)]/40 border-t border-[var(--border-subtle)] space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--text-muted)]">Destination</span>
                    <span className="text-[var(--text-primary)] text-right truncate max-w-[65%]">
                      {ord.deliveryAddress}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--text-muted)]">
                      {ord.deliveryMethod === 'park_pickup' ? 'Park Waybill' : 'Courier'}
                    </span>
                    <span className="text-[var(--text-primary)] font-mono-luxury text-[11px]">
                      {ord.courierName || 'Dispatch'}
                      {(ord.waybillNumber || ord.trackingDetails?.waybillNumber)
                        ? ` · ${ord.waybillNumber || ord.trackingDetails?.waybillNumber}`
                        : ''}
                    </span>
                  </div>
                  {(ord.driverPhone || ord.trackingDetails?.driverPhone) && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[var(--text-muted)]">Rider Contact</span>
                      <a
                        href={`tel:${ord.driverPhone || ord.trackingDetails?.driverPhone}`}
                        className="text-[var(--gold-accent)] font-mono-luxury text-[11px]"
                      >
                        {ord.driverPhone || ord.trackingDetails?.driverPhone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
                    <span className="text-[var(--text-secondary)]">Your Escrow Payout</span>
                    <span className="font-editorial text-lg text-emerald-500">
                      ₦{Number(ord.totalPayout || 0).toLocaleString()}
                    </span>
                  </div>

                  {ord.instructions && (
                    <p className="text-[11px] text-[var(--text-muted)] font-light leading-relaxed pt-1">
                      {ord.instructions}
                    </p>
                  )}

                  {ord.trackingStage >= 4 &&
                    ord.customer_measurements?.reviews &&
                    ord.customer_measurements.reviews.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1 mt-1">
                        <div className="flex items-center justify-between text-[10px] font-mono-luxury text-[var(--gold-accent)]">
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" /> Buyer Review
                          </span>
                          <span>{ord.customer_measurements.reviews[0].rating}.0 ★</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] italic">
                          &quot;{ord.customer_measurements.reviews[0].comment}&quot;
                        </p>
                      </div>
                    )}
                </div>

                {/* Action Footer */}
                <div className="px-4 py-3 border-t border-[var(--border-subtle)] flex items-center gap-2">
                  {onOpenWaybill && (
                    <button
                      type="button"
                      onClick={() => onOpenWaybill(ord)}
                      className="h-10 px-3.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-[11px] font-mono-luxury inline-flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
                    >
                      <Printer className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                      <span>Waybill</span>
                    </button>
                  )}

                  {ord.trackingStage === 1 && (
                    <button
                      type="button"
                      onClick={() => onPackReady(ord)}
                      disabled={isUpdatingStatus}
                      className="flex-1 h-10 px-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[11px] font-mono-luxury uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <PackageCheck className="h-4 w-4" />
                      <span>Mark Packed &amp; Ready</span>
                    </button>
                  )}

                  {ord.trackingStage === 2 && (
                    <button
                      type="button"
                      onClick={() => handleOpenDispatch(ord)}
                      className="flex-1 h-10 px-4 rounded-full bg-[var(--gold-accent)] text-black text-[11px] font-mono-luxury uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Truck className="h-4 w-4" />
                      <span>Dispatch Order</span>
                    </button>
                  )}

                  {ord.trackingStage === 3 && (
                    <div className="flex-1 h-10 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-emerald-500 text-[11px] font-mono-luxury flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>In Transit</span>
                    </div>
                  )}

                  {ord.trackingStage === 4 && (
                    <div className="flex-1 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-[11px] font-mono-luxury flex items-center justify-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Delivered &amp; Settled</span>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Native Slide-Up Dispatch Bottom Sheet (With Pre-Dispatch Photo Proof) */}
      {typeof document !== 'undefined' &&
        dispatchModalOrder &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] bg-black/65 backdrop-blur-md flex items-end justify-center animate-fadeIn"
            onClick={() => setDispatchModalOrder(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              data-lenis-prevent="true"
              className="w-full max-w-lg rounded-t-[30px] bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-4 shadow-2xl max-h-[88vh] overflow-y-auto"
            >
              <div className="flex justify-center">
                <span className="h-1 w-10 rounded-full bg-[var(--border-hover)]" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--gold-accent)]">
                    Dispatch Package
                  </span>
                  <h3 className="font-editorial text-2xl font-normal text-[var(--text-primary)]">
                    {dispatchModalOrder.orderNumber}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDispatchModalOrder(null)}
                  className="h-8 w-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="space-y-3.5 text-xs">
                {dispatchError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{dispatchError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Waybill / Tracking Number
                  </label>
                  <input
                    type="text"
                    value={waybillInput}
                    onChange={(e) => {
                      setWaybillInput(e.target.value);
                      setDispatchError('');
                    }}
                    placeholder="e.g. GIG-918239 or PARK-01"
                    className="w-full h-11 px-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Rider / Driver Phone Number
                  </label>
                  <input
                    type="tel"
                    value={driverPhoneInput}
                    onChange={(e) => {
                      setDriverPhoneInput(e.target.value);
                      setDispatchError('');
                    }}
                    placeholder="e.g. 08012345678"
                    className="w-full h-11 px-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] font-mono-luxury focus:border-[var(--gold-accent)] focus:outline-none"
                  />
                </div>

                {/* Finished Piece Pre-Dispatch Proof */}
                <div className="p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--gold-accent)] flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5" />
                      <span>Finished Piece Proof (Optional)</span>
                    </span>
                    {preDispatchProofUrl && (
                      <span className="text-[10px] text-emerald-500">Attached</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] font-light">
                    Snap a quick photo before sealing — protects your escrow payout against disputes.
                  </p>
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-mono-luxury text-[var(--text-primary)] cursor-pointer">
                    {isUploadingProof ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--gold-accent)]" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                        <span>{preDispatchProofUrl ? 'Replace Proof Photo' : 'Attach Proof Photo'}</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/quicktime"
                      onChange={handleProofUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="pt-2 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDispatchModalOrder(null)}
                    className="flex-1 h-11 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-mono-luxury uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingStatus || isUploadingProof}
                    className="flex-1 h-11 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    <span>Confirm Dispatch</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
