'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import {
  Search, ShieldCheck, CheckCircle2, Truck, Phone,
  ArrowLeft, RefreshCw, AlertCircle, Loader2, Star,
  Package, Copy, Check, X, MapPin, Camera, Flag, ExternalLink
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabase/client';
import OrderStatusAnimation from '@/components/vendor/OrderStatusAnimation';
import LuxuryLoader from '@/components/common/LuxuryLoader';

interface VendorMeta {
  id: string;
  slug: string;
  brandName: string;
  logoUrl: string;
  fallbackImage: string;
  city: string;
  state: string;
  isVerified: boolean;
}

const FIT_OPTIONS = [
  { id: 'true_to_size', label: 'True to Size' },
  { id: 'runs_small', label: 'Runs Small' },
  { id: 'runs_large', label: 'Runs Loose' },
];

const DISPUTE_REASONS = [
  'Wrong item, color, or size sent',
  'Item damaged or defective on arrival',
  'Missing piece from my order',
  'Item significantly differs from listing',
];

export default function MobileTrackOrderView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialOrderNo = searchParams.get('orderNumber') || '';

  const { userOrders, userAuth } = useStore();

  const [searchQuery, setSearchQuery] = useState(initialOrderNo);
  const [searchedOrder, setSearchedOrder] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [releasingPackageId, setReleasingPackageId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [copiedWaybill, setCopiedWaybill] = useState<string | null>(null);
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

  // Vendor Logo Lookup Directory
  const [vendorDirectory, setVendorDirectory] = useState<Record<string, VendorMeta>>({});
  const [brokenLogos, setBrokenLogos] = useState<Record<string, boolean>>({});

  // Rating & Review Bottom Sheet
  const [activeReviewVendor, setActiveReviewVendor] = useState<{
    vendorId: string;
    vendorName: string;
    productId: string;
    productName: string;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFit, setReviewFit] = useState('true_to_size');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [ratedVendors, setRatedVendors] = useState<Record<string, boolean>>({});

  // 48-Hour Escrow Dispute Bottom Sheet
  const [disputeVendor, setDisputeVendor] = useState<{ vendorId: string; vendorName: string } | null>(null);
  const [disputeReason, setDisputeReason] = useState(DISPUTE_REASONS[0]);
  const [disputeDetails, setDisputeDetails] = useState('');
  const [disputeProofUrls, setDisputeProofUrls] = useState<string[]>([]);
  const [isUploadingDisputeProof, setIsUploadingDisputeProof] = useState(false);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  // User's recent orders for quick-switch chips
  const userOrdersList = useMemo(() => {
    const userEmail = (userAuth?.email || '').toLowerCase().trim();
    const userPhone = (userAuth?.phone || '').replace(/\D/g, '');
    const matched = userOrders.filter((ord: any) => {
      if (!userEmail && !userPhone) return true;
      const oEmail = (ord.customerEmail || ord.customer_email || '').toLowerCase().trim();
      const oPhone = (ord.customerPhone || ord.customer_phone || '').replace(/\D/g, '');
      return (
        (userEmail && oEmail === userEmail) ||
        (userPhone && userPhone.length >= 7 && oPhone.includes(userPhone))
      );
    });

    return [...matched].sort((a: any, b: any) => {
      const timeB = new Date(b.created_at || b.createdAt || b.date || 0).getTime();
      const timeA = new Date(a.created_at || a.createdAt || a.date || 0).getTime();
      return timeB - timeA;
    });
  }, [userOrders, userAuth?.email, userAuth?.phone]);

  const fetchOrderFromDb = async (queryNum: string) => {
    if (!queryNum) return;
    setIsSearching(true);
    setIsRefreshing(true);

    try {
      const res = await fetch(`/api/orders?orderNumber=${encodeURIComponent(queryNum.trim())}`, {
        headers: { 'Cache-Control': 'no-cache' },
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
          (o) =>
            o.orderNumber.toLowerCase() === queryNum.toLowerCase().trim() ||
            o.id === queryNum.trim()
        );
        setSearchedOrder(storeMatch || null);
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
    } else if (userOrdersList.length > 0 && !searchedOrder) {
      const topOrder = userOrdersList[0];
      const ordCode = topOrder.orderNumber || topOrder.id;
      if (ordCode) {
        setSearchQuery(ordCode);
        fetchOrderFromDb(ordCode);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrderNo, userOrdersList.length]);

  // Live Supabase Realtime updates whenever vendor packs or dispatches
  useEffect(() => {
    if (!searchedOrder) return;
    const orderNum = searchedOrder.order_number || searchedOrder.orderNumber;
    if (!orderNum) return;

    const channel = supabase
      .channel(`mobile-track-${orderNum}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updated = payload.new as any;
          if (updated && (updated.order_number === orderNum || updated.id === searchedOrder.id)) {
            fetchOrderFromDb(orderNum);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedOrder?.id, searchedOrder?.orderNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    fetchOrderFromDb(searchQuery);
  };

  const getVendorPackageRecord = (orderVendorPackages: any, vId: string, vName?: string) => {
    if (!orderVendorPackages || typeof orderVendorPackages !== 'object') return null;
    if (orderVendorPackages[vId]) return orderVendorPackages[vId];
    const cleanId = (vId || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const cleanName = (vName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');

    for (const [k, v] of Object.entries(orderVendorPackages)) {
      const cleanK = k.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (
        cleanK === cleanId ||
        (cleanName && cleanK === cleanName) ||
        cleanK.includes(cleanId) ||
        cleanId.includes(cleanK)
      ) {
        return v as any;
      }
    }
    return null;
  };

  const vendorPackages = useMemo(() => {
    if (!searchedOrder) return [];
    const items = searchedOrder.items || [];
    const vMap = new Map<
      string,
      {
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
        preDispatchProofUrl: string;
        lastUpdated: string;
        subtotal: number;
      }
    >();

    const orderVendorPackages =
      searchedOrder.vendorPackages || searchedOrder.customer_measurements?.vendorPackages || {};

    items.forEach((item: any) => {
      const vId = (item.vendorId || item.vendor_id || 'vendor').toLowerCase().trim();
      const vName = item.vendorName || vId.replace(/-/g, ' ');
      const pkgInfo = getVendorPackageRecord(orderVendorPackages, vId, vName);

      const itemQty = Number(item.quantity || 1);
      const itemPrice = Number(item.price || 0);

      if (!vMap.has(vId)) {
        let pkgStage = 1;
        let pkgStatus = 'escrow_secured';

        if (pkgInfo) {
          if (pkgInfo.trackingStage !== undefined && Number(pkgInfo.trackingStage) > 0) {
            pkgStage = Number(pkgInfo.trackingStage);
            pkgStatus =
              pkgInfo.status ||
              (pkgStage === 4
                ? 'delivered'
                : pkgStage === 3
                ? 'dispatched'
                : pkgStage === 2
                ? 'packing'
                : 'escrow_secured');
          } else if (pkgInfo.status) {
            pkgStatus = pkgInfo.status;
            pkgStage =
              pkgStatus === 'delivered'
                ? 4
                : pkgStatus === 'dispatched'
                ? 3
                : pkgStatus === 'packing' || pkgStatus === 'ready'
                ? 2
                : 1;
          }
        } else if (item.status && item.status !== 'escrow_secured') {
          pkgStatus = item.status;
          pkgStage =
            pkgStatus === 'delivered'
              ? 4
              : pkgStatus === 'dispatched'
              ? 3
              : pkgStatus === 'packing' || pkgStatus === 'ready'
              ? 2
              : 1;
        }

        vMap.set(vId, {
          vendorId: vId,
          vendorName: vName,
          items: [],
          packageStage: pkgStage,
          packageStatus: pkgStatus,
          deliveryMethod: pkgInfo?.deliveryMethod || 'doorstep',
          courierName:
            pkgInfo?.courierName ||
            (pkgInfo?.deliveryMethod === 'park_pickup'
              ? 'Motor Park Waybill'
              : 'Express Courier'),
          driverPhone: pkgInfo?.driverPhone || '',
          waybillNumber: pkgInfo?.waybillNumber || pkgInfo?.trackingNumber || '',
          dropoffStation: pkgInfo?.dropoffStation || pkgInfo?.selectedParkTerminal || '',
          packageWeightKg: pkgInfo?.packageWeightKg || 1.1,
          packageDimensions: pkgInfo?.packageDimensions || '35×25×6cm',
          instructions: pkgInfo?.instructions || '',
          preDispatchProofUrl: pkgInfo?.preDispatchProofUrl || '',
          lastUpdated: pkgInfo?.lastUpdated || '',
          subtotal: 0,
        });
      }

      const entry = vMap.get(vId)!;
      entry.items.push(item);
      entry.subtotal += itemPrice * itemQty;
    });

    return Array.from(vMap.values()).sort((a, b) => {
      if (b.packageStage !== a.packageStage) return b.packageStage - a.packageStage;
      const bTime = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
      const aTime = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
      return bTime - aTime;
    });
  }, [searchedOrder]);

  // Batch fetch real vendor logos for all packages in the tracked order
  useEffect(() => {
    if (vendorPackages.length === 0) return;
    let cancelled = false;
    async function loadLogos() {
      try {
        const ids = vendorPackages.map((p) => encodeURIComponent(p.vendorId)).join(',');
        const res = await fetch(`/api/vendors/lookup?ids=${ids}`);
        const data = await res.json();
        if (!cancelled && data.success && data.vendors) {
          setVendorDirectory(data.vendors);
        }
      } catch {}
    }
    loadLogos();
    return () => {
      cancelled = true;
    };
  }, [vendorPackages]);

  const handleCopyWaybill = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedWaybill(code);
      setTimeout(() => setCopiedWaybill(null), 1800);
    } catch {}
  };

  const handleConfirmReceivedPackage = async (vendorId: string, vendorName: string) => {
    if (!searchedOrder) return;
    setReleasingPackageId(vendorId);

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: searchedOrder.orderNumber,
          orderId: searchedOrder.id,
          vendorId,
          status: 'delivered',
          trackingStage: 4,
        }),
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
          return { ...prev, vendorPackages: updatedPackages };
        });

        setToastMessage(`Package from ${vendorName} confirmed. Escrow released.`);
        confetti({
          particleCount: 75,
          spread: 68,
          origin: { y: 0.65 },
          colors: ['#e6c367', '#10b981', '#ffffff'],
        });
        setTimeout(() => setToastMessage(''), 4200);

        const firstItem = vendorPackages.find((p) => p.vendorId === vendorId)?.items[0] || {};
        setActiveReviewVendor({
          vendorId,
          vendorName,
          productId: firstItem.productId || firstItem.id || '',
          productName: firstItem.productName || firstItem.name || 'Piece',
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
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: searchedOrder.orderNumber,
          orderId: searchedOrder.id,
          productId: activeReviewVendor.productId,
          productName: activeReviewVendor.productName,
          vendorId: activeReviewVendor.vendorId,
          customerName: searchedOrder.customerName || 'Verified Shopper',
          rating: reviewRating,
          fitRating: reviewFit,
          comment: reviewComment.trim(),
        }),
      });

      if (res.ok) {
        setRatedVendors((prev) => ({ ...prev, [activeReviewVendor.vendorId]: true }));
        setActiveReviewVendor(null);
        setReviewComment('');
        setToastMessage('Thank you! Your review has been published.');
        setTimeout(() => setToastMessage(''), 3200);
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#e6c367', '#10b981', '#ffffff'],
        });
      }
    } catch (e) {
      console.error('Error submitting review:', e);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDisputePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingDisputeProof(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setDisputeProofUrls((prev) => [...prev, data.url]);
      }
    } catch {} finally {
      setIsUploadingDisputeProof(false);
    }
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeVendor || !searchedOrder) return;
    setIsSubmittingDispute(true);
    const resolvedOrderNo = searchedOrder.order_number || searchedOrder.orderNumber;
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: resolvedOrderNo,
          orderId: searchedOrder.id,
          vendorId: disputeVendor.vendorId,
          action: 'open_dispute',
          disputeReason,
          disputeDetails,
          disputeProofUrls,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToastMessage('Issue reported. Escrow funds are frozen while our team reviews within 24–48h.');
        setDisputeVendor(null);
        setDisputeDetails('');
        setDisputeProofUrls([]);
        await fetchOrderFromDb(resolvedOrderNo);
      } else {
        setToastMessage(data.error || 'Could not submit issue report.');
      }
    } catch {
      setToastMessage('Network error submitting issue report.');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const stageLabels = [
    { num: 1, short: 'Confirmed' },
    { num: 2, short: 'Packed' },
    { num: 3, short: 'In Transit' },
    { num: 4, short: 'Delivered' },
  ];

  const highestStage = vendorPackages.reduce((max, p) => Math.max(max, p.packageStage), 1);
  const overallLabel =
    searchedOrder?.status === 'disputed'
      ? 'Escrow Frozen'
      : highestStage >= 4
      ? 'Delivered'
      : highestStage === 3
      ? 'In Transit'
      : highestStage === 2
      ? 'Packed'
      : 'Escrow Secured';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-32 select-none animate-fadeIn">
      {/* 1. Native Sticky Top Header */}
      <header className="sticky top-0 z-30 h-14 px-4 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-[var(--border-subtle)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-9 w-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center justify-center active:scale-95 transition-transform shrink-0 cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="font-editorial text-[20px] font-normal text-[var(--text-primary)] leading-tight truncate">
              Track Delivery
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {searchedOrder && (
            <button
              type="button"
              onClick={() => fetchOrderFromDb(searchedOrder.orderNumber)}
              disabled={isRefreshing}
              className="h-9 w-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
              aria-label="Refresh tracking"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[var(--gold-accent)]' : ''}`} />
            </button>
          )}
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* 2. Sleek Order Lookup Pill Bar */}
        <section className="space-y-2.5">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Order ref e.g. #VY-ORD-6965"
                className="w-full h-11 pl-10 pr-3.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono-luxury text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold-accent)] focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="h-11 px-5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[11px] font-mono-luxury uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span>Track</span>}
            </button>
          </form>

          {/* Quick-Switch Order Chips when Shopper has multiple orders */}
          {userOrdersList.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {userOrdersList.slice(0, 6).map((ord: any) => {
                const refCode = ord.orderNumber || ord.id;
                const isSelected =
                  searchedOrder &&
                  (searchedOrder.orderNumber === refCode || searchedOrder.id === refCode);
                return (
                  <button
                    key={refCode}
                    type="button"
                    onClick={() => {
                      setSearchQuery(refCode);
                      fetchOrderFromDb(refCode);
                    }}
                    className={`h-8 px-3 rounded-full text-[11px] font-mono-luxury whitespace-nowrap border transition-colors shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                    }`}
                  >
                    {refCode}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Live Feedback Banner */}
        {toastMessage && (
          <div className="px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Loading State */}
        {isSearching && !searchedOrder && (
          <div className="py-10">
            <LuxuryLoader fullScreen={false} label="Ì R Í S Í" sublabel="Fetching live delivery status..." />
          </div>
        )}

        {/* 3. Signature Obsidian Order Hero Card */}
        {searchedOrder && (
          <section className="relative rounded-[26px] bg-[#0D0D10] text-white p-5 overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.18)] border border-white/10 space-y-4">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full opacity-35"
              style={{
                background: 'radial-gradient(circle, rgba(230, 195, 103, 0.45), transparent 70%)',
              }}
            />

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-zinc-400 block">
                  Order Reference
                </span>
                <div className="font-editorial text-2xl font-normal text-white leading-tight mt-0.5 truncate">
                  {searchedOrder.orderNumber}
                </div>
                <span className="text-[11px] text-zinc-400 font-light mt-0.5 block">
                  {searchedOrder.date || 'Recent Order'}
                </span>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono-luxury border shrink-0 ${
                  searchedOrder.status === 'disputed'
                    ? 'bg-rose-500/15 border-rose-400/40 text-rose-300'
                    : highestStage >= 4
                    ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300'
                    : highestStage === 3
                    ? 'bg-[#E6C367]/15 border-[#E6C367]/40 text-[#E6C367]'
                    : 'bg-white/10 border-white/15 text-zinc-200'
                }`}
              >
                {overallLabel}
              </span>
            </div>

            <div className="relative z-10 pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-zinc-400 block">
                  Escrow Total
                </span>
                <span className="font-editorial text-xl text-[#E6C367] mt-0.5 block">
                  ₦{Number(searchedOrder.totalAmount || 0).toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-zinc-400 block">
                  Packages
                </span>
                <span className="font-editorial text-xl text-white mt-0.5 block">
                  {vendorPackages.length} {vendorPackages.length === 1 ? 'Brand' : 'Brands'}
                </span>
              </div>
            </div>

            {searchedOrder.deliveryAddress && (
              <div className="relative z-10 pt-3 border-t border-white/10 flex items-start gap-2 text-[11px] text-zinc-300 font-light">
                <MapPin className="h-3.5 w-3.5 text-[#E6C367] shrink-0 mt-0.5" />
                <span className="leading-snug">{searchedOrder.deliveryAddress}</span>
              </div>
            )}
          </section>
        )}

        {/* 4. Per-Brand Package Cards */}
        {searchedOrder && vendorPackages.length > 0 ? (
          <section className="space-y-4">
            <div className="px-1 flex items-center justify-between">
              <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Live Shipments ({vendorPackages.length})
              </span>
              <span className="text-[10px] font-mono-luxury text-emerald-500 inline-flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                <span>Escrow Active</span>
              </span>
            </div>

            {vendorPackages.map((pkg) => {
              const isRated = ratedVendors[pkg.vendorId];
              const isDispatched = pkg.packageStage >= 3;
              const isDelivered = pkg.packageStage >= 4;
              const meta = vendorDirectory[pkg.vendorId] || vendorDirectory[pkg.vendorId.toLowerCase()];
              const resolvedName = meta?.brandName || pkg.vendorName;
              const initial = resolvedName.trim().charAt(0).toUpperCase() || 'B';
              const logoSrc = !brokenLogos[pkg.vendorId]
                ? meta?.logoUrl || meta?.fallbackImage || ''
                : '';

              return (
                <article
                  key={pkg.vendorId}
                  className="rounded-[22px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden"
                >
                  {/* Animated Live Order Status Strip */}
                  <OrderStatusAnimation
                    trackingStage={pkg.packageStage}
                    deliveryMethod={pkg.deliveryMethod}
                    courierName={pkg.courierName}
                    viewer="shopper"
                    compact
                  />

                  {/* Vendor Header with Real Brand Logo */}
                  <div className="px-4 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3">
                    <Link
                      href={`/brand/${encodeURIComponent(meta?.slug || pkg.vendorId)}`}
                      className="flex items-center gap-3 min-w-0 flex-1 active:opacity-75"
                    >
                      <div className="relative h-10 w-10 rounded-full bg-[var(--bg-primary)] border border-[var(--gold-accent)]/40 text-[var(--gold-accent)] flex items-center justify-center font-editorial text-base shrink-0 overflow-hidden">
                        {logoSrc ? (
                          <img
                            src={logoSrc}
                            alt={resolvedName}
                            onError={() =>
                              setBrokenLogos((prev) => ({ ...prev, [pkg.vendorId]: true }))
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{initial}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-medium text-[var(--text-primary)] capitalize truncate">
                          {resolvedName}
                        </div>
                        <span className="text-[11px] text-[var(--text-muted)] font-light">
                          {pkg.items.length} {pkg.items.length === 1 ? 'piece' : 'pieces'} · ₦
                          {pkg.subtotal.toLocaleString()}
                        </span>
                      </div>
                    </Link>

                    <Link
                      href={`/brand/${encodeURIComponent(meta?.slug || pkg.vendorId)}`}
                      className="h-8 px-3 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[10px] font-mono-luxury text-[var(--text-secondary)] inline-flex items-center gap-1 shrink-0"
                    >
                      <span>Store</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  </div>

                  {/* 4-Step Hairline Timeline */}
                  <div className="px-4 pt-3.5 pb-3 border-b border-[var(--border-subtle)] space-y-2.5">
                    <div className="grid grid-cols-4 gap-1.5">
                      {stageLabels.map((st) => {
                        const isDone = pkg.packageStage >= st.num;
                        const isCurr = pkg.packageStage === st.num;
                        return (
                          <div key={st.num} className="space-y-1.5 text-center">
                            <div
                              className={`h-1.5 w-full rounded-full transition-colors ${
                                isDone
                                  ? pkg.packageStage >= 4
                                    ? 'bg-emerald-500'
                                    : 'bg-[var(--gold-accent)]'
                                  : 'bg-[var(--bg-secondary)]'
                              }`}
                            />
                            <span
                              className={`text-[9.5px] font-mono-luxury block truncate ${
                                isCurr
                                  ? pkg.packageStage >= 4
                                    ? 'text-emerald-500'
                                    : 'text-[var(--gold-accent)]'
                                  : isDone
                                  ? 'text-[var(--text-primary)]'
                                  : 'text-[var(--text-muted)]'
                              }`}
                            >
                              {st.short}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Logistics Detail Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10.5px]">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                        <Truck className="h-3 w-3 text-[var(--gold-accent)]" />
                        <span>
                          {pkg.deliveryMethod === 'park_pickup'
                            ? 'Pickup Hub'
                            : pkg.courierName}
                        </span>
                      </span>

                      {pkg.waybillNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopyWaybill(pkg.waybillNumber)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] active:scale-95 cursor-pointer"
                        >
                          <span className="font-mono-luxury">#{pkg.waybillNumber}</span>
                          {copiedWaybill === pkg.waybillNumber ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-2.5 w-2.5 text-[var(--text-muted)]" />
                          )}
                        </button>
                      )}

                      {pkg.preDispatchProofUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewProofUrl(pkg.preDispatchProofUrl)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] cursor-pointer"
                        >
                          <Camera className="h-3 w-3" />
                          <span>Dispatch Photo</span>
                        </button>
                      )}
                    </div>

                    {pkg.dropoffStation && pkg.deliveryMethod === 'park_pickup' && (
                      <p className="text-[11px] text-amber-500 font-light">
                        Collection hub: <span className="font-medium">{pkg.dropoffStation}</span>
                      </p>
                    )}

                    {/* Driver / Rider Direct Call Bar */}
                    {isDispatched && !isDelivered && pkg.driverPhone && (
                      <div className="mt-1 px-3.5 py-2.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--gold-accent)]/30 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] block">
                            Rider / Driver Contact
                          </span>
                          <span className="text-xs font-mono-luxury text-[var(--text-primary)] truncate block">
                            {pkg.driverPhone}
                          </span>
                        </div>
                        <a
                          href={`tel:${pkg.driverPhone}`}
                          className="h-9 px-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10.5px] font-mono-luxury uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0 active:scale-95"
                        >
                          <Phone className="h-3 w-3 text-[var(--gold-accent)]" />
                          <span>Call</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Hairline Itemized Pieces */}
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {pkg.items.map((item, iIdx) => (
                      <div key={iIdx} className="px-4 py-3 flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-zinc-900 border border-[var(--border-subtle)] shrink-0">
                          <Image
                            src={item.imageUrl || '/images/no-product.svg'}
                            alt={item.productName || 'Piece'}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-[var(--text-primary)] truncate">
                            {item.productName || item.name || 'Piece'}
                          </h4>
                          <span className="text-[11px] text-[var(--text-muted)] font-light">
                            {item.size ? `Size ${item.size} · ` : ''}Qty {item.quantity || 1}
                          </span>
                        </div>
                        <div className="font-editorial text-base text-[var(--text-primary)] shrink-0">
                          ₦{Number(item.price || 0).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer Actions: Confirm Receipt / Report Issue / Rate Brand */}
                  <div className="px-4 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 space-y-2.5">
                    {isDelivered ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>Delivered · Escrow Released</span>
                        </div>
                        {!isRated ? (
                          <button
                            type="button"
                            onClick={() => {
                              const firstItem = pkg.items[0] || {};
                              setActiveReviewVendor({
                                vendorId: pkg.vendorId,
                                vendorName: resolvedName,
                                productId: firstItem.productId || firstItem.id || '',
                                productName: firstItem.productName || firstItem.name || 'Piece',
                              });
                            }}
                            className="h-9 px-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10.5px] font-mono-luxury uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                          >
                            <Star className="h-3 w-3 text-[var(--gold-accent)] fill-[var(--gold-accent)]" />
                            <span>Rate Fit</span>
                          </button>
                        ) : (
                          <span className="text-[10.5px] font-mono-luxury text-[var(--text-muted)]">
                            Reviewed ✓
                          </span>
                        )}
                      </div>
                    ) : isDispatched ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleConfirmReceivedPackage(pkg.vendorId, resolvedName)
                          }
                          disabled={releasingPackageId === pkg.vendorId}
                          className="w-full h-11 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[11px] font-mono-luxury uppercase tracking-[0.12em] flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                        >
                          {releasingPackageId === pkg.vendorId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          )}
                          <span>
                            {releasingPackageId === pkg.vendorId
                              ? 'Confirming...'
                              : 'Confirm Received & Release Escrow'}
                          </span>
                        </button>

                        {searchedOrder.status !== 'disputed' && (
                          <button
                            type="button"
                            onClick={() =>
                              setDisputeVendor({
                                vendorId: pkg.vendorId,
                                vendorName: resolvedName,
                              })
                            }
                            className="w-full h-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10.5px] font-mono-luxury text-[var(--text-secondary)] hover:text-rose-500 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Flag className="h-3 w-3" />
                            <span>Report an Issue (48h Escrow Freeze)</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)] font-light">
                        <span>
                          {pkg.packageStage === 2
                            ? 'Boxed & awaiting courier dispatch.'
                            : 'Order received — brand is preparing your pieces.'}
                        </span>
                        <span className="text-[10px] font-mono-luxury text-[var(--gold-accent)] shrink-0">
                          100% Protected
                        </span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        ) : searchQuery && !isSearching ? (
          <div className="py-12 px-6 rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-3.5">
            <div className="h-14 w-14 mx-auto rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-rose-400 flex items-center justify-center">
              <AlertCircle className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div className="space-y-1">
              <h3 className="font-editorial text-xl font-normal text-[var(--text-primary)]">
                Order Not Found
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-light max-w-xs mx-auto leading-relaxed">
                We couldn&apos;t locate an order matching &ldquo;{searchQuery}&rdquo;. Double-check the reference from your confirmation email.
              </p>
            </div>
          </div>
        ) : !isSearching ? (
          <div className="py-12 px-6 rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-4">
            <div className="h-14 w-14 mx-auto rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-muted)] flex items-center justify-center">
              <Package className="h-6 w-6" strokeWidth={1.4} />
            </div>
            <div className="space-y-1">
              <h3 className="font-editorial text-xl font-normal text-[var(--text-primary)]">
                Track Any ÌRÍSÍ Order
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-light max-w-xs mx-auto leading-relaxed">
                Enter your order reference above to see live packing, courier transit, and escrow delivery protection.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[11px] font-mono-luxury uppercase tracking-wider"
            >
              <span>Explore Shop</span>
            </Link>
          </div>
        ) : null}
      </div>

      {/* Pre-Dispatch Photo Proof Lightbox */}
      {previewProofUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setPreviewProofUrl(null)}
        >
          <div
            className="w-full max-w-sm rounded-[24px] overflow-hidden bg-[#0D0D10] border border-white/15 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 text-white">
              <span className="text-xs font-mono-luxury uppercase tracking-wider text-[#E6C367]">
                Pre-Dispatch Photo Proof
              </span>
              <button
                type="button"
                onClick={() => setPreviewProofUrl(null)}
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative aspect-[4/5] w-full bg-black">
              <img
                src={previewProofUrl}
                alt="Pre-dispatch photo proof"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Quiet-Luxury Brand Rating Bottom Sheet */}
      {activeReviewVendor && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end justify-center animate-fadeIn"
          onClick={() => !isSubmittingReview && setActiveReviewVendor(null)}
        >
          <div
            className="w-full max-w-md bg-[var(--bg-surface)] rounded-t-[28px] border-t border-[var(--border-subtle)] shadow-2xl animate-slideUp max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-3 pb-1 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-[var(--border-subtle)]" />
            </div>

            <div className="px-6 pt-3 pb-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--gold-accent)] block">
                  Review Order
                </span>
                <h3 className="font-editorial text-xl font-normal text-[var(--text-primary)] truncate mt-0.5">
                  Rate {activeReviewVendor.vendorName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveReviewVendor(null)}
                className="h-8 w-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-muted)] flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-5">
              {/* Interactive Star Bar */}
              <div className="py-4 px-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 active:scale-90 transition-transform cursor-pointer"
                  >
                    <Star
                      strokeWidth={1.5}
                      className={`h-8 w-8 ${
                        star <= reviewRating
                          ? 'text-[var(--gold-accent)] fill-[var(--gold-accent)]'
                          : 'text-[var(--text-muted)]/40'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Tactile Fit Selector Pills */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] block px-0.5">
                  How was the sizing &amp; fit?
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {FIT_OPTIONS.map((opt) => {
                    const active = reviewFit === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setReviewFit(opt.id)}
                        className={`h-9 rounded-full text-[11px] border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]'
                            : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] block px-0.5">
                  Your Review
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share thoughts on quality, packaging, and fit..."
                  className="w-full p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-accent)] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full h-12 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-[0.14em] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingReview ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Submit Review</span>
                )}
              </button>
            </form>
            <div className="h-safe-area-bottom" />
          </div>
        </div>
      )}

      {/* 48-Hour Escrow Dispute Bottom Sheet */}
      {disputeVendor && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end justify-center animate-fadeIn"
          onClick={() => !isSubmittingDispute && setDisputeVendor(null)}
        >
          <div
            className="w-full max-w-md bg-[var(--bg-surface)] rounded-t-[28px] border-t border-[var(--border-subtle)] shadow-2xl animate-slideUp max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-3 pb-1 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-[var(--border-subtle)]" />
            </div>

            <div className="px-6 pt-3 pb-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-rose-500 block">
                  48h Escrow Protection
                </span>
                <h3 className="font-editorial text-xl font-normal text-[var(--text-primary)] mt-0.5">
                  Report an Issue
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDisputeVendor(null)}
                className="h-8 w-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-muted)] flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDispute} className="p-6 space-y-4">
              <p className="text-xs text-[var(--text-muted)] font-light leading-relaxed">
                Submitting a report immediately freezes the escrow payout for{' '}
                <span className="text-[var(--text-primary)]">{disputeVendor.vendorName}</span> while
                our team reviews your evidence within 24–48 hours.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] block px-0.5">
                  Issue Category
                </label>
                <div className="space-y-1.5">
                  {DISPUTE_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setDisputeReason(reason)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs border transition-colors cursor-pointer ${
                        disputeReason === reason
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]'
                          : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] block px-0.5">
                  Details
                </label>
                <textarea
                  rows={3}
                  required
                  value={disputeDetails}
                  onChange={(e) => setDisputeDetails(e.target.value)}
                  placeholder="Describe what happened clearly..."
                  className="w-full p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] cursor-pointer">
                  <Camera className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                  <span>{isUploadingDisputeProof ? 'Uploading photo...' : 'Attach Photo Evidence'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDisputePhotoUpload}
                    className="hidden"
                  />
                </label>
                {disputeProofUrls.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {disputeProofUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt="Evidence"
                        className="h-12 w-12 rounded-xl object-cover border border-[var(--border-subtle)]"
                      />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmittingDispute}
                className="w-full h-12 rounded-full bg-rose-600 text-white text-xs font-mono-luxury uppercase tracking-[0.14em] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingDispute ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Freeze Escrow &amp; Submit Report</span>
                )}
              </button>
            </form>
            <div className="h-safe-area-bottom" />
          </div>
        </div>
      )}
    </div>
  );
}
