'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import {
  Search, ShieldCheck, CheckCircle2, Truck, Phone,
  Clock, ArrowLeft, RefreshCw, AlertCircle, Loader2, Star, Send,
  Package, Check, Store, X, Sparkles
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export default function MobileTrackOrderView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialOrderNo = searchParams.get('orderNumber') || '';

  const { userOrders } = useStore();

  const [searchQuery, setSearchQuery] = useState(initialOrderNo);
  const [searchedOrder, setSearchedOrder] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [releasingPackageId, setReleasingPackageId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Rating & Review State
  const [activeReviewVendor, setActiveReviewVendor] = useState<{ vendorId: string; vendorName: string; productId: string; productName: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFit, setReviewFit] = useState('true_to_size');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [ratedVendors, setRatedVendors] = useState<Record<string, boolean>>({});

  const fetchOrderFromDb = async (queryNum: string) => {
    if (!queryNum) return;
    setIsSearching(true);
    setIsRefreshing(true);

    try {
      const res = await fetch(`/api/orders?orderNumber=${encodeURIComponent(queryNum.trim())}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();

      if (res.ok && data.success && data.orders && data.orders.length > 0) {
        setSearchedOrder(data.orders[0]);
        if (data.orders[0].customer_measurements?.isRated) {
          const revs = data.orders[0].customer_measurements?.reviews || [];
          const ratedMap: Record<string, boolean> = {};
          revs.forEach((r: any) => {
            if (r.vendorId) ratedMap[r.vendorId] = true;
          });
          setRatedVendors(ratedMap);
        }
      } else {
        const storeMatch = userOrders.find(
          (o) => o.orderNumber.toLowerCase() === queryNum.toLowerCase().trim() || o.id === queryNum.trim()
        );
        if (storeMatch) {
          setSearchedOrder(storeMatch);
        } else {
          setSearchedOrder(null);
        }
      }
    } catch (e) {
      console.error('Error fetching live order tracking:', e);
    } finally {
      setIsSearching(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (initialOrderNo) {
      fetchOrderFromDb(initialOrderNo);
    }
  }, [initialOrderNo]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    fetchOrderFromDb(searchQuery);
  };

  // Helper to find vendor package record reliably
  const getVendorPackageRecord = (orderVendorPackages: any, vId: string, vName?: string) => {
    if (!orderVendorPackages || typeof orderVendorPackages !== 'object') return null;
    if (orderVendorPackages[vId]) return orderVendorPackages[vId];
    const cleanId = (vId || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const cleanName = (vName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');

    for (const [k, v] of Object.entries(orderVendorPackages)) {
      const cleanK = k.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (cleanK === cleanId || (cleanName && cleanK === cleanName) || cleanK.includes(cleanId) || cleanId.includes(cleanK)) {
        return v as any;
      }
    }
    return null;
  };

  // Group items by vendor into dedicated package shipments
  const vendorPackages = useMemo(() => {
    if (!searchedOrder) return [];
    const items = searchedOrder.items || [];
    const vMap = new Map<string, {
      vendorId: string;
      vendorName: string;
      items: any[];
      packageStage: number;
      packageStatus: string;
      deliveryMethod: string;
      courierName: string;
      driverPhone: string;
      waybillNumber: string;
      dropoffStation: string;
      packageWeightKg: number;
      packageDimensions: string;
      instructions: string;
      lastUpdated: string;
      subtotal: number;
    }>();

    const orderVendorPackages = searchedOrder.vendorPackages || searchedOrder.customer_measurements?.vendorPackages || {};

    items.forEach((item: any) => {
      const vId = (item.vendorId || item.vendor_id || 'vendor').toLowerCase().trim();
      const vName = item.vendorName || (vId.replace(/-/g, ' ').toUpperCase());
      const pkgInfo = getVendorPackageRecord(orderVendorPackages, vId, vName);

      const itemQty = Number(item.quantity || 1);
      const itemPrice = Number(item.price || 0);

      if (!vMap.has(vId)) {
        // Individual package stage calculation: strictly isolated per vendor!
        let pkgStage = 1;
        let pkgStatus = 'escrow_secured';

        if (pkgInfo) {
          if (pkgInfo.trackingStage !== undefined && Number(pkgInfo.trackingStage) > 0) {
            pkgStage = Number(pkgInfo.trackingStage);
            pkgStatus = pkgInfo.status || (pkgStage === 4 ? 'delivered' : pkgStage === 3 ? 'dispatched' : pkgStage === 2 ? 'packing' : 'escrow_secured');
          } else if (pkgInfo.status) {
            pkgStatus = pkgInfo.status;
            pkgStage = pkgStatus === 'delivered' ? 4 : pkgStatus === 'dispatched' ? 3 : (pkgStatus === 'packing' || pkgStatus === 'ready') ? 2 : 1;
          }
        } else if (item.status && item.status !== 'escrow_secured') {
          pkgStatus = item.status;
          pkgStage = pkgStatus === 'delivered' ? 4 : pkgStatus === 'dispatched' ? 3 : (pkgStatus === 'packing' || pkgStatus === 'ready') ? 2 : 1;
        }

        vMap.set(vId, {
          vendorId: vId,
          vendorName: vName,
          items: [],
          packageStage: pkgStage,
          packageStatus: pkgStatus,
          deliveryMethod: pkgInfo?.deliveryMethod || 'doorstep',
          courierName: pkgInfo?.courierName || (pkgInfo?.deliveryMethod === 'park_pickup' ? 'Motor Park Bus Waybill' : 'GIG Logistics Express'),
          driverPhone: pkgInfo?.driverPhone || '',
          waybillNumber: pkgInfo?.waybillNumber || pkgInfo?.trackingNumber || '',
          dropoffStation: pkgInfo?.dropoffStation || pkgInfo?.selectedParkTerminal || '',
          packageWeightKg: pkgInfo?.packageWeightKg || 1.1,
          packageDimensions: pkgInfo?.packageDimensions || '35×25×6cm',
          instructions: pkgInfo?.instructions || '',
          lastUpdated: pkgInfo?.lastUpdated || '',
          subtotal: 0,
        });
      }

      const entry = vMap.get(vId)!;
      entry.items.push(item);
      entry.subtotal += itemPrice * itemQty;
    });

    return Array.from(vMap.values());
  }, [searchedOrder]);

  const handleConfirmReceivedPackage = async (vendorId: string, vendorName: string) => {
    if (!searchedOrder) return;
    setReleasingPackageId(vendorId);

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: searchedOrder.orderNumber,
          vendorId: vendorId,
          status: 'delivered',
          trackingStage: 4,
        })
      });

      if (res.ok) {
        setSearchedOrder((prev: any) => {
          if (!prev) return prev;
          const updatedPackages = { ...(prev.vendorPackages || {}) };
          updatedPackages[vendorId] = {
            ...(updatedPackages[vendorId] || {}),
            status: 'delivered',
            trackingStage: 4,
          };
          return {
            ...prev,
            vendorPackages: updatedPackages
          };
        });

        setToastMessage(`Package from ${vendorName} received! Escrow released.`);
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e6c367', '#10b981', '#ffffff']
        });
        setTimeout(() => setToastMessage(''), 4000);

        const firstItem = vendorPackages.find(p => p.vendorId === vendorId)?.items[0] || {};
        setActiveReviewVendor({
          vendorId,
          vendorName,
          productId: firstItem.productId || firstItem.id || '',
          productName: firstItem.productName || firstItem.name || 'Garment Piece',
        });
      }
    } catch (e) {
      console.error('Error confirming package receipt:', e);
    } finally {
      setReleasingPackageId(null);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchedOrder || !activeReviewVendor || !reviewComment.trim()) return;
    setIsSubmittingReview(true);

    try {
      const payload = {
        orderNumber: searchedOrder.orderNumber,
        orderId: searchedOrder.id,
        productId: activeReviewVendor.productId,
        productName: activeReviewVendor.productName,
        vendorId: activeReviewVendor.vendorId,
        customerName: searchedOrder.customerName || 'Valued Client',
        rating: reviewRating,
        fitRating: reviewFit,
        comment: reviewComment.trim()
      };

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setRatedVendors(prev => ({ ...prev, [activeReviewVendor.vendorId]: true }));
        setActiveReviewVendor(null);
        setReviewComment('');
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#e6c367', '#10b981', '#ffffff']
        });
      }
    } catch (e) {
      console.error('Error submitting review:', e);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const stageLabels = [
    { num: 1, short: 'Confirmed' },
    { num: 2, short: 'Packed' },
    { num: 3, short: 'In Transit' },
    { num: 4, short: 'Delivered' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-36 select-none animate-fadeIn">
      
      {/* 1. TOP APP BAR */}
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-[var(--border-subtle)] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-editorial text-xl font-bold text-[var(--text-primary)] leading-tight">
              Track Deliveries
            </h1>
            <span className="text-[10px] font-mono-luxury text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              <span>Escrow Logistics Hub</span>
            </span>
          </div>
        </div>

        {searchedOrder && (
          <button
            type="button"
            onClick={() => fetchOrderFromDb(searchedOrder.orderNumber)}
            disabled={isRefreshing}
            className="p-2 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--gold-accent)]"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        
        {/* 2. ORDER SEARCH BAR */}
        <form onSubmit={handleSearch} className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-2.5 shadow-sm">
          <label className="block text-[11px] font-mono-luxury uppercase text-[var(--text-secondary)] font-bold">
            Order Reference Code:
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. #VY-ORD-6965"
                className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono-luxury font-bold focus:border-[var(--gold-accent)] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2.5 rounded-2xl bg-[var(--gold-accent)] text-black font-mono-luxury uppercase text-xs font-bold shadow-md flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {isSearching ? <Sparkles className="h-3.5 w-3.5 animate-spin text-black" /> : <span>Track</span>}
            </button>
          </div>
        </form>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-mono-luxury font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 3. ORDER SUMMARY BANNER */}
        {searchedOrder && (
          <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3 shadow-sm text-xs font-mono-luxury">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase block">Order Code:</span>
                <span className="font-editorial text-xl font-bold text-[var(--gold-accent)]">
                  {searchedOrder.orderNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block">Escrow Paid:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  ₦{Number(searchedOrder.totalAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
              <span>Destination: <strong className="text-[var(--text-primary)]">{searchedOrder.deliveryAddress}</strong></span>
            </div>
          </div>
        )}

        {/* 4. INDIVIDUAL VENDOR PACKAGE SHIPMENTS */}
        {searchedOrder && vendorPackages.length > 0 ? (
          <div className="space-y-4">
            <span className="text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold block px-1">
              Vendor Shipments ({vendorPackages.length})
            </span>

            {vendorPackages.map((pkg, idx) => {
              const isRated = ratedVendors[pkg.vendorId];
              const isDispatched = pkg.packageStage >= 3;
              const isDelivered = pkg.packageStage >= 4;
              const isPacking = pkg.packageStage === 2;

              return (
                <div
                  key={pkg.vendorId}
                  className={`p-4 rounded-3xl surface-card border space-y-4 shadow-sm ${
                    isDelivered
                      ? 'border-emerald-500/40'
                      : isDispatched
                      ? 'border-[var(--gold-accent)]/50'
                      : 'border-[var(--border-subtle)]'
                  }`}
                >
                  {/* Package Header */}
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-xl bg-[var(--gold-subtle)] text-[var(--gold-accent)] flex items-center justify-center font-bold text-xs">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs font-mono-luxury text-[var(--text-primary)]">
                          {pkg.vendorName}
                        </h3>
                        <span className="text-[10px] font-mono-luxury text-[var(--text-muted)]">
                          {pkg.items.length} item(s) · ₦{pkg.subtotal.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono-luxury font-bold uppercase ${
                      isDelivered
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : isDispatched
                        ? 'bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 animate-pulse'
                        : isPacking
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {isDelivered ? 'Delivered' : isDispatched ? 'With Courier' : isPacking ? 'Packed' : 'Received'}
                    </span>
                  </div>

                  {/* Package Logistics Badge & Details */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono-luxury bg-[var(--bg-secondary)]/70 p-2.5 rounded-2xl border border-[var(--border-subtle)]">
                    <span className={`px-2 py-0.5 rounded-md font-bold uppercase flex items-center gap-1 ${
                      pkg.deliveryMethod === 'park_pickup'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      <Truck className="h-3 w-3" />
                      <span>{pkg.deliveryMethod === 'park_pickup' ? 'Motor Park Hub' : 'Door Delivery'}</span>
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      Courier: <strong className="text-[var(--gold-accent)]">{pkg.courierName}</strong>
                    </span>
                    {pkg.waybillNumber && (
                      <span className="text-[var(--text-muted)]">
                        · Waybill: <strong className="text-[var(--text-primary)]">{pkg.waybillNumber}</strong>
                      </span>
                    )}
                    <span className="text-[var(--text-muted)]">
                      · {pkg.packageWeightKg}kg ({pkg.packageDimensions})
                    </span>
                    {pkg.dropoffStation && pkg.deliveryMethod === 'park_pickup' && (
                      <div className="w-full text-amber-400 pt-1 border-t border-[var(--border-subtle)]/50 mt-1">
                        Collection Terminal: <strong>{pkg.dropoffStation}</strong> (Pay on collection)
                      </div>
                    )}
                  </div>

                  {/* 4-Step Progress Bar */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {stageLabels.map((st) => {
                      const isDone = pkg.packageStage >= st.num;
                      const isCurr = pkg.packageStage === st.num;
                      return (
                        <div key={st.num} className="space-y-1 text-center">
                          <div className={`h-1.5 w-full rounded-full ${
                            isDone ? 'bg-[var(--gold-accent)]' : 'bg-[var(--bg-secondary)]'
                          }`} />
                          <span className={`text-[9px] font-mono-luxury ${
                            isCurr ? 'text-[var(--gold-accent)] font-bold' : isDone ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                          }`}>
                            {st.short}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Courier / Driver Call Bar */}
                  {isDispatched && !isDelivered && pkg.driverPhone && (
                    <div className="p-3 rounded-2xl bg-[var(--gold-subtle)]/40 border border-[var(--gold-accent)]/30 flex items-center justify-between gap-2 text-xs font-mono-luxury">
                      <div className="flex items-center gap-2 truncate">
                        <Truck className="h-4 w-4 text-[var(--gold-accent)] shrink-0" />
                        <span className="truncate font-bold">Driver: {pkg.driverPhone}</span>
                      </div>

                      <a
                        href={`tel:${pkg.driverPhone}`}
                        className="px-3 py-1.5 rounded-full bg-[var(--gold-accent)] text-black font-bold uppercase text-[10px] shadow-md flex items-center gap-1 shrink-0"
                      >
                        <Phone className="h-3 w-3" />
                        <span>Call</span>
                      </a>
                    </div>
                  )}

                  {/* Clothes in this Shipment */}
                  <div className="space-y-2">
                    {pkg.items.map((item, iIdx) => (
                      <div key={iIdx} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]/50">
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-black/40 shrink-0">
                          <Image src={item.imageUrl || '/images/products/BlackTrapStarHoodie.jpg'} alt={item.productName} fill unoptimized className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-[var(--text-primary)] truncate">{item.productName}</h4>
                          <span className="text-[10px] font-mono-luxury text-[var(--text-muted)]">Size: {item.size || 'M'} · Qty: {item.quantity || 1}</span>
                        </div>
                        <div className="font-mono-luxury text-xs font-bold text-[var(--gold-accent)]">
                          ₦{Number(item.price || 0).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons: Confirm Receipt / Rate */}
                  <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                    {isDelivered ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono-luxury text-emerald-400 font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Delivered · Escrow Released</span>
                      </div>
                    ) : isDispatched ? (
                      <button
                        type="button"
                        onClick={() => handleConfirmReceivedPackage(pkg.vendorId, pkg.vendorName)}
                        disabled={releasingPackageId === pkg.vendorId}
                        className="w-full py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-mono-luxury uppercase font-bold shadow-md flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{releasingPackageId === pkg.vendorId ? 'Releasing...' : 'Confirm Received (Release Escrow)'}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono-luxury text-[var(--text-muted)]">
                        {isPacking ? 'Store is packing clothes for courier.' : 'Order confirmed at boutique.'}
                      </span>
                    )}

                    {isDelivered && !isRated && (
                      <button
                        type="button"
                        onClick={() => {
                          const firstItem = pkg.items[0] || {};
                          setActiveReviewVendor({
                            vendorId: pkg.vendorId,
                            vendorName: pkg.vendorName,
                            productId: firstItem.productId || firstItem.id || '',
                            productName: firstItem.productName || firstItem.name || 'Garment Piece',
                          });
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-[var(--gold-accent)] text-black text-[11px] font-mono-luxury uppercase font-bold shadow-md flex items-center gap-1 shrink-0"
                      >
                        <Star className="h-3 w-3 fill-current" />
                        <span>Rate Fit</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        ) : searchQuery && !isSearching ? (
          <div className="p-10 rounded-3xl surface-card border border-[var(--border-subtle)] text-center space-y-3 my-4">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
              Order Not Found
            </h3>
            <p className="text-xs font-mono-luxury text-[var(--text-secondary)] max-w-xs mx-auto">
              We could not find an order matching &quot;{searchQuery}&quot;. Please check your reference code.
            </p>
          </div>
        ) : null}

      </div>

      {/* 5. PER-VENDOR RATING MODAL */}
      {activeReviewVendor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center p-0 animate-fadeIn">
          <div className="w-full max-w-md surface-card rounded-t-3xl border-t border-x border-[var(--border-subtle)] p-6 space-y-4 shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h3 className="font-editorial text-lg font-bold text-[var(--text-primary)]">
                  Rate {activeReviewVendor.vendorName}
                </h3>
                <p className="text-[10px] font-mono-luxury text-[var(--text-muted)]">
                  How was the fabric quality and tailoring fit?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveReviewVendor(null)}
                className="text-[var(--text-muted)] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-3.5 text-xs font-mono-luxury">
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 cursor-pointer"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        star <= reviewRating
                          ? 'text-[var(--gold-accent)] fill-[var(--gold-accent)]'
                          : 'text-zinc-600'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div>
                <label className="block uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Sizing Drape & Fit:
                </label>
                <select
                  value={reviewFit}
                  onChange={(e) => setReviewFit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                >
                  <option value="true_to_size">True to Size (Perfect Fit)</option>
                  <option value="runs_small">Runs Slightly Small</option>
                  <option value="runs_large">Runs Loose / Oversized</option>
                </select>
              </div>

              <div>
                <label className="block uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Your Review Feedback:
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details on tailoring drape and fabric feel..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveReviewVendor(null)}
                  className="py-3 rounded-2xl surface-card border border-[var(--border-subtle)] uppercase font-bold text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="py-3 rounded-2xl bg-[var(--gold-accent)] text-black uppercase font-bold hover:bg-[#d8b357] shadow-xl flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  {isSubmittingReview ? <Sparkles className="h-4 w-4 animate-spin text-black" /> : <Send className="h-4 w-4" />}
                  <span>Submit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
