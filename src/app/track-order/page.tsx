'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import {
  Search, ShieldCheck, CheckCircle2, Truck, PackageCheck,
  Phone, Clock, ArrowLeft, RefreshCw, AlertCircle, Loader2, Star, Send,
  Package, ChevronRight, Sparkles
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import MobileTrackOrderView from '@/components/tracking/MobileTrackOrderView';

export default function TrackOrderPage() {
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

  // Fetch live order directly from PostgreSQL backend API
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

  // Release Escrow for a specific vendor's package
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
        // Update local package state
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

        setToastMessage(`Package from ${vendorName} confirmed! Escrow released.`);
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e6c367', '#10b981', '#ffffff']
        });
        setTimeout(() => setToastMessage(''), 5000);

        // Open rating modal for this specific vendor
        const firstItem = vendorPackages.find(p => p.vendorId === vendorId)?.items[0] || {};
        setActiveReviewVendor({
          vendorId,
          vendorName,
          productId: firstItem.productId || firstItem.id || '',
          productName: firstItem.productName || firstItem.name || 'Garment Drop',
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
    { num: 1, title: 'Order Confirmed', short: 'Awaiting Pack' },
    { num: 2, title: 'Packed at Store', short: 'Ready' },
    { num: 3, title: 'In Transit with Courier', short: 'On the Way' },
    { num: 4, title: 'Delivered', short: 'Completed' },
  ];

  return (
    <>
      {/* 1. DEDICATED MOBILE TRACK ORDER VIEW */}
      <div className="block md:hidden">
        <MobileTrackOrderView />
      </div>

      {/* 2. DESKTOP LUXURY TRACK ORDER VIEW */}
      <div className="hidden md:block min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 animate-fadeIn pb-24">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold">
              Multi-Vendor Logistics Ledger
            </span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-1">
            Track Your Order
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {searchedOrder && (
            <button
              type="button"
              onClick={() => fetchOrderFromDb(searchedOrder.orderNumber)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-xs font-mono-luxury uppercase text-[var(--gold-accent)] hover:underline font-bold cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Tracking</span>
            </button>
          )}

          <Link
            href="/shop"
            className="flex items-center gap-1.5 text-xs font-mono-luxury uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Shop</span>
          </Link>
        </div>
      </div>

      {/* Order Search Box */}
      <form onSubmit={handleSearch} className="p-4 sm:p-6 rounded-3xl surface-card border border-[var(--border-subtle)] shadow-sm space-y-3">
        <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] font-bold">
          Enter Your Order Reference Number:
        </label>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. #VY-ORD-6965"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono-luxury font-bold focus:border-[var(--gold-accent)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-3 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold hover:opacity-90 transition-all shadow-md shrink-0 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSearching ? <Sparkles className="h-4 w-4 animate-spin text-[var(--gold-accent)]" /> : <span>Track</span>}
          </button>
        </div>
      </form>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-mono-luxury font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Order Tracking Dashboard */}
      {searchedOrder ? (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Master Order Meta Banner */}
          <div className="p-6 sm:p-7 rounded-3xl surface-card border border-[var(--border-subtle)] shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase tracking-wider">
                    Master Reference
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 text-[10px] font-mono-luxury font-bold">
                    {vendorPackages.length} {vendorPackages.length === 1 ? 'Package Shipment' : 'Vendor Shipments'}
                  </span>
                </div>
                <span className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--gold-accent)] mt-0.5 block">
                  {searchedOrder.orderNumber}
                </span>
                <div className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-0.5">
                  Placed on: {searchedOrder.date || 'Today'}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase tracking-wider block">
                  Total Escrow Paid
                </span>
                <div className="font-editorial text-xl sm:text-2xl font-bold text-emerald-400">
                  ₦{Number(searchedOrder.totalAmount || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono-luxury flex items-center gap-1 sm:justify-end">
                  <ShieldCheck className="h-3 w-3" />
                  <span>100% Escrow Protected</span>
                </div>
              </div>
            </div>

            {/* Recipient & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono-luxury">
              <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <div className="text-[var(--text-muted)] uppercase text-[10px]">Recipient:</div>
                <div className="font-bold text-[var(--text-primary)] mt-0.5">{searchedOrder.customerName}</div>
                <div className="text-[11px] text-[var(--text-secondary)]">{searchedOrder.customerPhone}</div>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <div className="text-[var(--text-muted)] uppercase text-[10px]">Delivery Destination:</div>
                <div className="font-bold text-[var(--text-primary)] mt-0.5">{searchedOrder.deliveryAddress}</div>
              </div>
            </div>
          </div>

          {/* Individual Vendor Package Cards */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold tracking-wider">
                Shipment Packages ({vendorPackages.length})
              </span>
              <span className="text-[11px] font-mono-luxury text-[var(--text-muted)]">
                Each vendor fulfills and dispatches independently
              </span>
            </div>

            {vendorPackages.map((pkg, idx) => {
              const isRated = ratedVendors[pkg.vendorId];
              const isDispatched = pkg.packageStage >= 3;
              const isDelivered = pkg.packageStage >= 4;
              const isPacking = pkg.packageStage === 2;

              return (
                <div
                  key={pkg.vendorId}
                  className={`p-6 sm:p-7 rounded-3xl surface-card border transition-all space-y-6 shadow-md ${
                    isDelivered
                      ? 'border-emerald-500/40 bg-emerald-500/[0.02]'
                      : isDispatched
                      ? 'border-[var(--gold-accent)]/50 bg-[var(--gold-accent)]/[0.02]'
                      : 'border-[var(--border-subtle)]'
                  }`}
                >
                  {/* Package Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-xs font-mono-luxury ${
                        isDelivered
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : isDispatched
                          ? 'bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/40'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                      }`}>
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold">
                          Package {idx + 1} of {vendorPackages.length}
                        </div>
                        <h3 className="font-editorial text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                          {pkg.vendorName}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap text-xs font-mono-luxury mt-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 ${
                            pkg.deliveryMethod === 'park_pickup'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            <Truck className="h-3 w-3" />
                            <span>{pkg.deliveryMethod === 'park_pickup' ? 'Motor Park Waybill' : 'Doorstep Delivery'}</span>
                          </span>
                          <span className="text-[11px] text-[var(--text-secondary)]">
                            Courier: <strong className="text-[var(--gold-accent)]">{pkg.courierName}</strong>
                          </span>
                          {pkg.waybillNumber && (
                            <span className="text-[11px] text-[var(--text-muted)]">
                              Waybill: <strong className="text-[var(--text-primary)]">{pkg.waybillNumber}</strong>
                            </span>
                          )}
                        </div>
                        {pkg.dropoffStation && pkg.deliveryMethod === 'park_pickup' && (
                          <div className="text-[11px] font-mono-luxury text-amber-400 mt-1">
                            Collection Hub: <strong>{pkg.dropoffStation}</strong> (Pay driver on arrival)
                          </div>
                        )}
                        <span className="text-[11px] font-mono-luxury text-[var(--text-secondary)] block mt-0.5">
                          {pkg.items.length} item(s) in this package · ₦{pkg.subtotal.toLocaleString()} · Weight: {pkg.packageWeightKg}kg
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span className={`px-3.5 py-1.5 rounded-full text-xs font-mono-luxury font-bold uppercase self-start sm:self-center ${
                      isDelivered
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : isDispatched
                        ? 'bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 animate-pulse'
                        : isPacking
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {isDelivered
                        ? 'Delivered'
                        : isDispatched
                        ? 'In Transit with Courier'
                        : isPacking
                        ? 'Packed & Ready at Store'
                        : 'Order Received · Packing'}
                    </span>
                  </div>

                  {/* 4-Step Progress for THIS Specific Package */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                      {stageLabels.map((st) => {
                        const isDone = pkg.packageStage >= st.num;
                        const isCurr = pkg.packageStage === st.num;
                        return (
                          <div key={st.num} className="space-y-1 text-center">
                            <div className={`h-1.5 w-full rounded-full transition-all ${
                              isDone ? 'bg-[var(--gold-accent)]' : 'bg-[var(--bg-secondary)]'
                            }`} />
                            <div className={`text-[10px] font-mono-luxury ${
                              isCurr ? 'text-[var(--gold-accent)] font-bold' : isDone ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                            }`}>
                              {st.short}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Courier / Driver Info (Only if this specific vendor dispatched) */}
                  {isDispatched && !isDelivered && (pkg.driverPhone || pkg.waybillNumber) && (
                    <div className="p-4 rounded-2xl bg-[var(--gold-subtle)]/30 border border-[var(--gold-accent)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono-luxury">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[var(--gold-accent)]/20 text-[var(--gold-accent)] flex items-center justify-center shrink-0">
                          <Truck className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-[var(--gold-accent)]">
                            Dispatched by {pkg.vendorName}
                          </div>
                          {pkg.driverPhone && (
                            <div className="font-bold text-sm text-[var(--text-primary)] mt-0.5 flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-[var(--gold-accent)]" />
                              <span>Driver: {pkg.driverPhone}</span>
                            </div>
                          )}
                          {pkg.waybillNumber && (
                            <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                              Waybill Code: <strong>{pkg.waybillNumber}</strong>
                            </div>
                          )}
                        </div>
                      </div>

                      {pkg.driverPhone && (
                        <a
                          href={`tel:${pkg.driverPhone}`}
                          className="px-4 py-2 rounded-full bg-[var(--gold-accent)] text-black font-bold uppercase text-xs hover:bg-[#d8b357] transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Phone className="h-3.5 w-3.5 text-black" />
                          <span>Call Driver Directly</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Items inside this specific vendor package */}
                  <div className="space-y-2.5 pt-1">
                    <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold block">
                      Clothes in this Shipment ({pkg.items.length}):
                    </span>

                    <div className="space-y-2">
                      {pkg.items.map((item: any, iIdx: number) => {
                        const qty = Number(item.quantity || 1);
                        const unitPrice = Number(item.price || 0);
                        const lineTotal = unitPrice * qty;

                        return (
                          <div key={iIdx} className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex-wrap">
                            <div className="flex items-center gap-3.5">
                              <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-[var(--bg-secondary)] shrink-0 border border-[var(--border-subtle)]">
                                <Image src={item.imageUrl || '/images/products/BlackTrapStarHoodie.jpg'} alt={item.productName || item.name} fill unoptimized className="object-cover" />
                              </div>
                              <div>
                                <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">{item.productName || item.name}</h4>
                                <div className="text-[11px] font-mono-luxury text-[var(--text-secondary)] mt-0.5">
                                  Size: <strong className="text-[var(--gold-accent)]">{item.size || 'M'}</strong> · Qty: <strong className="text-[var(--text-primary)]">{qty}</strong>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-mono-luxury text-[var(--gold-accent)] font-bold">
                                ₦{lineTotal.toLocaleString()}
                              </div>
                              {qty > 1 && (
                                <div className="text-[10px] font-mono-luxury text-[var(--text-muted)]">
                                  ₦{unitPrice.toLocaleString()} × {qty}
                                </div>
                              )}
                              <span className="text-[9px] font-mono-luxury text-emerald-400 font-bold uppercase">
                                Ready-to-Wear
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Delivery & Escrow Action for THIS Package */}
                  <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {isDelivered ? (
                      <div className="flex items-center gap-2 text-xs font-mono-luxury text-emerald-400 font-bold">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Package Delivered · Escrow Released to {pkg.vendorName}</span>
                      </div>
                    ) : isDispatched ? (
                      <div className="text-xs font-mono-luxury text-amber-400">
                        Package is with the driver. When it arrives, click confirm to release escrow to this vendor.
                      </div>
                    ) : (
                      <div className="text-xs font-mono-luxury text-[var(--text-muted)]">
                        {isPacking ? `${pkg.vendorName} has packed your clothes and is handing over to courier.` : `${pkg.vendorName} has received order and is preparing package.`}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {isDispatched && !isDelivered && (
                        <button
                          type="button"
                          onClick={() => handleConfirmReceivedPackage(pkg.vendorId, pkg.vendorName)}
                          disabled={releasingPackageId === pkg.vendorId}
                          className="px-5 py-2 rounded-full bg-emerald-500 text-black text-xs font-mono-luxury uppercase font-bold hover:bg-emerald-400 transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          {releasingPackageId === pkg.vendorId ? 'Releasing...' : 'Confirm Received (Release Escrow)'}
                        </button>
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
                              productName: firstItem.productName || firstItem.name || 'Garment Drop',
                            });
                          }}
                          className="px-4 py-2 rounded-full bg-[var(--gold-accent)] text-black text-xs font-mono-luxury uppercase font-bold hover:bg-[#d8b357] transition-all shadow-md flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Star className="h-3.5 w-3.5 fill-current text-black" />
                          <span>Rate {pkg.vendorName}</span>
                        </button>
                      )}

                      {isDelivered && isRated && (
                        <span className="text-[11px] font-mono-luxury text-[var(--gold-accent)] font-bold">
                          ✓ Review Submitted
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      ) : searchQuery && !isSearching ? (
        <div className="p-12 rounded-3xl surface-card border border-[var(--border-subtle)] text-center space-y-4 animate-fadeIn">
          <div className="h-14 w-14 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
              Order Not Found
            </h3>
            <p className="text-xs font-mono-luxury text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
              We couldn&apos;t find an order matching &quot;{searchQuery}&quot;. Please check your reference code from your receipt.
            </p>
          </div>
        </div>
      ) : null}

      {/* Per-Vendor Interactive Rating & Review Modal */}
      {activeReviewVendor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="surface-card rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[var(--border-subtle)] space-y-5 animate-fadeIn shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-2xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] flex items-center justify-center">
                  <Star className="h-5 w-5 fill-current text-[var(--gold-accent)]" />
                </div>
                <div>
                  <h3 className="font-editorial text-lg font-bold text-[var(--text-primary)]">
                    Rate {activeReviewVendor.vendorName}
                  </h3>
                  <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)]">
                    Feedback is published on the {activeReviewVendor.productName} and brand store.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveReviewVendor(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs font-mono-luxury">
              {/* Star Rating Selector */}
              <div>
                <label className="block uppercase text-[var(--text-secondary)] mb-2 font-bold">
                  Overall Star Rating:
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= reviewRating
                            ? 'text-[var(--gold-accent)] fill-[var(--gold-accent)]'
                            : 'text-[var(--border-subtle)] fill-none'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-bold text-sm text-[var(--gold-accent)]">{reviewRating}.0 / 5.0</span>
                </div>
              </div>

              {/* Fit Accuracy */}
              <div>
                <label className="block uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Sizing & Fit Accuracy:
                </label>
                <select
                  value={reviewFit}
                  onChange={(e) => setReviewFit(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                >
                  <option value="true_to_size">True to Size (Perfect Fit)</option>
                  <option value="runs_small">Runs Slightly Small / Snug</option>
                  <option value="runs_large">Runs Loose / Oversized</option>
                </select>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Your Review & Comments:
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details on fabric quality, sizing drape, and vendor speed..."
                  className="w-full px-3.5 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveReviewVendor(null)}
                    className="flex-1 py-3 rounded-full surface-card border border-[var(--border-subtle)] uppercase font-bold text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="flex-1 py-3 rounded-full bg-[var(--gold-accent)] text-white uppercase font-bold hover:bg-[#d8b357] transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReview ? <Sparkles className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4 text-white" />}
                  <span>Submit Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </>
  );
}
