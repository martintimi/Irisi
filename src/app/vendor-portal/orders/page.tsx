'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store/useStore';
import Image from 'next/image';
import {
  PackageCheck, Clock, CheckCircle2, ShieldCheck,
  Phone, MapPin, User, Truck, ShoppingBag, Scissors, Layers,
  Ruler, Sparkles, ChevronRight, Check, AlertCircle, Package,
  Send, Loader2, X, Navigation, RefreshCw, Star, Printer, Building
} from 'lucide-react';
import MobileVendorOrders from '@/components/vendor/MobileVendorOrders';
import VendorLuxuryLoader from '@/components/vendor/VendorLuxuryLoader';
import ShippingWaybillModal from '@/components/vendor/ShippingWaybillModal';
import confetti from 'canvas-confetti';

import { isBoutiqueVendor } from '@/types';

export default function VendorOrdersPage() {
  const { vendorProfile, updateOrderStatus } = useStore();
  const isBoutique = isBoutiqueVendor(vendorProfile);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'dispatched' | 'delivered'>('all');
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Waybill Slip & Dispatch Modal State
  const [selectedWaybillOrder, setSelectedWaybillOrder] = useState<any | null>(null);
  const [dispatchModalOrder, setDispatchModalOrder] = useState<any | null>(null);
  const [waybillInput, setWaybillInput] = useState('');
  const [driverPhoneInput, setDriverPhoneInput] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Read active vendor ID reliably from store, localStorage, or cookie
  const getActiveVendorId = useCallback(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('irisi_vendor_id') || localStorage.getItem('veyra_vendor_id');
      if (storedId) return storedId;
    }
    return vendorProfile.email || '';
  }, [vendorProfile.email]);

  // Load orders strictly from live PostgreSQL DB
  const loadVendorDbOrders = useCallback(async () => {
    const activeVendorId = getActiveVendorId();
    try {
      setIsLoading(true);
      const res = await fetch(`/api/orders?vendorId=${encodeURIComponent(activeVendorId)}`, {
        headers: {
          'x-vendor-id': activeVendorId,
          'Cache-Control': 'no-cache',
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setDbOrders(data.orders);
      } else {
        setDbOrders([]);
      }
    } catch (e) {
      console.error('Error fetching vendor orders from DB:', e);
      setDbOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [getActiveVendorId]);

  useEffect(() => {
    loadVendorDbOrders();
  }, [loadVendorDbOrders]);

  // Process returned DB orders
  const vendorOrders = dbOrders.map((ord: any) => {
    const items = ord.items || [];
    if (items.length === 0) return null;

    const vendorSubtotal = items.reduce(
      (sum: number, i: any) => sum + (Number(i.price) || 0) * (i.quantity || 1),
      0
    );

    const activeVendorId = getActiveVendorId();
    const vendorKey = (items[0]?.vendorId || activeVendorId || '').toLowerCase().trim();
    const vendorPackages = ord.vendorPackages || ord.customer_measurements?.vendorPackages || {};
    const myPkg = vendorPackages[vendorKey] || Object.values(vendorPackages)[0] || {};

    const deliveryMethod = myPkg.deliveryMethod || ord.deliveryMethod || 'doorstep';
    const isParkPickup = deliveryMethod === 'park_pickup';
    const totalPkgCount = Object.keys(vendorPackages).length || 1;
    const vendorDeliveryFee = isParkPickup
      ? 0
      : (myPkg.shippingFee !== undefined
          ? Number(myPkg.shippingFee)
          : Math.round((Number(ord.shippingFee) || 0) / totalPkgCount));
    // The vendor payout is STRICTLY their clothes earnings! Delivery fees are paid to courier riders or collected at the park.
    const totalPayout = vendorSubtotal;

    const trackingStage = Number(myPkg.trackingStage || ord.trackingStage || (
      ord.status === 'delivered' ? 4 :
      ord.status === 'dispatched' ? 3 :
      (ord.status === 'packing' || ord.status === 'ready') ? 2 : 1
    ));
    const courierName = myPkg.courierName || (deliveryMethod === 'park_pickup' ? 'Motor Park Bus Waybill' : 'Shipbubble Courier');
    const waybillNumber = myPkg.waybillNumber || myPkg.trackingNumber || ord.trackingDetails?.waybillNumber || '';
    const courierServiceType = myPkg.courierServiceType || 'pickup';
    const pickupStatus = myPkg.pickupStatus || (trackingStage === 4 ? 'delivered' : trackingStage === 3 ? 'in_transit' : trackingStage === 2 ? (courierServiceType === 'pickup' ? 'ready_for_pickup' : 'ready_for_dropoff') : 'pending_packaging');
    const packageWeightKg = myPkg.packageWeightKg || 1.1;
    const packageDimensions = myPkg.packageDimensions || '35×25×6cm';
    const dropoffStation = myPkg.dropoffStation || myPkg.selectedParkTerminal;
    const instructions = myPkg.instructions || (deliveryMethod === 'park_pickup' ? 'Take parcel to local motor park. Customer pays collection fee.' : (courierServiceType === 'pickup' ? `${courierName} dispatch rider will arrive for pickup at your registered address.` : 'Drop off at nearest courier office.'));

    return {
      id: ord.id,
      orderNumber: ord.orderNumber || ord.id,
      date: ord.date,
      customerName: ord.customerName || 'Customer',
      customerPhone: ord.customerPhone || '',
      customerEmail: ord.customerEmail || '',
      deliveryAddress: ord.deliveryAddress || 'Nigeria',
      deliveryCity: ord.deliveryCity || 'Lagos',
      items,
      vendorSubtotal,
      vendorDeliveryFee,
      totalPayout,
      status: myPkg.status || ord.status || 'escrow_secured',
      trackingStage,
      trackingDetails: ord.trackingDetails || {},
      deliveryMethod,
      courierName,
      waybillNumber,
      courierServiceType,
      pickupStatus,
      packageWeightKg,
      packageDimensions,
      dropoffStation,
      instructions,
      deliveryIssue: myPkg.deliveryIssue || null,
    };
  }).filter(Boolean);

  const filteredOrders = vendorOrders.filter((ord: any) => {
    if (activeTab === 'pending') return ord.trackingStage <= 2;
    if (activeTab === 'dispatched') return ord.trackingStage === 3;
    if (activeTab === 'delivered') return ord.trackingStage >= 4;
    return true;
  });

  // Action 1: Pack & Mark Ready (Stage 1 -> Stage 2)
  const handlePackReady = async (ord: any) => {
    setIsUpdatingStatus(true);
    const activeVendorId = getActiveVendorId();
    const targetVendorId = ord.items?.[0]?.vendorId || activeVendorId;
    const nextPickupStatus = ord.courierServiceType === 'pickup' ? 'ready_for_pickup' : 'ready_for_dropoff';
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': targetVendorId
        },
        body: JSON.stringify({
          orderNumber: ord.orderNumber,
          orderId: ord.id,
          status: 'packing',
          trackingStage: 2,
          pickupStatus: nextPickupStatus,
          vendorId: targetVendorId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        updateOrderStatus(ord.orderNumber, 'packing', 2, targetVendorId);
        setDbOrders(prev => prev.map(o => (o.orderNumber === ord.orderNumber || o.id === ord.id) ? {
          ...o,
          status: 'packing',
          trackingStage: 2,
          pickupStatus: nextPickupStatus
        } : o));
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      }
    } catch (e) {
      console.error('Failed to update packing status:', e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Action 2: Open Dispatch Waybill Modal (Stage 2 -> Stage 3)
  const openDispatchModal = (ord: any) => {
    setDispatchModalOrder(ord);
    setWaybillInput('');
    setDriverPhoneInput('');
  };

  // Action 3: Confirm Dispatch with Waybill / Driver info
  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchModalOrder) return;

    setIsUpdatingStatus(true);
    const activeVendorId = getActiveVendorId();
    const targetVendorId = dispatchModalOrder.items?.[0]?.vendorId || activeVendorId;
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': targetVendorId
        },
        body: JSON.stringify({
          orderNumber: dispatchModalOrder.orderNumber,
          orderId: dispatchModalOrder.id,
          status: 'dispatched',
          trackingStage: 3,
          waybillNumber: waybillInput.trim(),
          driverPhone: driverPhoneInput.trim(),
          vendorId: targetVendorId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        updateOrderStatus(dispatchModalOrder.orderNumber, 'dispatched', 3, targetVendorId);
        setDbOrders(prev => prev.map(o => (o.orderNumber === dispatchModalOrder.orderNumber || o.id === dispatchModalOrder.id) ? {
          ...o,
          status: 'dispatched',
          trackingStage: 3,
          trackingDetails: {
            waybillNumber: waybillInput.trim(),
            driverPhone: driverPhoneInput.trim()
          }
        } : o));

        setDispatchModalOrder(null);
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      }
    } catch (e) {
      console.error('Failed to update dispatch status:', e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleMobileConfirmDispatch = async (ord: any, waybill: string, driverPhone: string) => {
    setIsUpdatingStatus(true);
    const activeVendorId = getActiveVendorId();
    const targetVendorId = ord.items?.[0]?.vendorId || activeVendorId;
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': targetVendorId
        },
        body: JSON.stringify({
          orderNumber: ord.orderNumber,
          orderId: ord.id,
          status: 'dispatched',
          trackingStage: 3,
          waybillNumber: waybill.trim(),
          driverPhone: driverPhone.trim(),
          vendorId: targetVendorId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        updateOrderStatus(ord.orderNumber, 'dispatched', 3, targetVendorId);
        setDbOrders(prev => prev.map(o => (o.orderNumber === ord.orderNumber || o.id === ord.id) ? {
          ...o,
          status: 'dispatched',
          trackingStage: 3,
          trackingDetails: {
            waybillNumber: waybill.trim(),
            driverPhone: driverPhone.trim()
          }
        } : o));

        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      }
    } catch (e) {
      console.error('Failed to update dispatch status:', e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <>
      {/* 1. DEDICATED MOBILE VENDOR ORDERS */}
      <div className="block md:hidden">
        <MobileVendorOrders
          vendorOrders={vendorOrders}
          isLoading={isLoading}
          onRefresh={loadVendorDbOrders}
          onPackReady={handlePackReady}
          onConfirmDispatch={handleMobileConfirmDispatch}
          onOpenWaybill={(ord) => setSelectedWaybillOrder(ord)}
          isUpdatingStatus={isUpdatingStatus}
        />
      </div>

      {/* 2. DESKTOP LUXURY VENDOR ORDERS */}
      <div className="hidden md:block space-y-8 animate-fadeIn max-w-7xl pb-20">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
            Store Orders & Dispatch Fulfillment
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-1">
            Fulfill incoming customer orders, manage package dispatch, and track your escrow payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadVendorDbOrders}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs font-mono-luxury text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--gold-accent)] transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <div className="flex items-center gap-2 p-1 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] self-start sm:self-auto text-xs font-mono-luxury font-bold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${activeTab === 'all' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}`}
            >
              All ({vendorOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${activeTab === 'pending' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}`}
            >
              To Pack ({vendorOrders.filter((o: any) => o.trackingStage <= 2).length})
            </button>
            <button
              onClick={() => setActiveTab('dispatched')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${activeTab === 'dispatched' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}`}
            >
              Dispatched ({vendorOrders.filter((o: any) => o.trackingStage === 3).length})
            </button>
            <button
              onClick={() => setActiveTab('delivered')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${activeTab === 'delivered' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}`}
            >
              Delivered & Settled ({vendorOrders.filter((o: any) => o.trackingStage >= 4).length})
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <VendorLuxuryLoader label="Retrieving incoming orders from PostgreSQL..." />
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 rounded-3xl surface-card text-center space-y-4 border border-[var(--border-subtle)]">
          <Package className="h-10 w-10 text-[var(--gold-accent)] mx-auto opacity-70" />
          <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
            No Orders in this Status
          </h3>
          <p className="text-xs font-mono-luxury text-[var(--text-secondary)]">
            Incoming orders containing your brand garments will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((ord: any) => (
            <div key={ord.id} className="p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] shadow-md space-y-6">
              
              {/* Order Top Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono-luxury font-bold text-[var(--gold-accent)]">{ord.orderNumber}</span>
                    <span className="text-xs text-[var(--text-muted)] font-mono-luxury">· {ord.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono-luxury text-[var(--text-secondary)] mt-1">
                    <User className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                    <span>Customer: <strong className="text-[var(--text-primary)]">{ord.customerName}</strong> {ord.customerPhone ? `(${ord.customerPhone})` : ''}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono-luxury font-bold uppercase ${
                    ord.trackingStage === 4
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : ord.trackingStage === 3
                      ? 'bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30'
                      : ord.trackingStage === 2
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {ord.trackingStage === 4 ? 'Delivered' : ord.trackingStage === 3 ? 'Dispatched' : ord.trackingStage === 2 ? 'Packing Ready' : 'Escrow Secured'}
                  </span>
                </div>
              </div>

              {/* Items bought strictly from THIS vendor */}
              <div className="space-y-3">
                <span className="text-[11px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold block">
                  Items in this Package ({ord.items.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ord.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                      <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-[var(--bg-secondary)] shrink-0 border border-[var(--border-subtle)]">
                        <Image src={item.imageUrl || '/images/products/BlackTrapStarHoodie.jpg'} alt={item.productName} fill unoptimized className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-[var(--text-primary)] truncate">{item.productName}</h4>
                        <div className="text-[11px] font-mono-luxury text-[var(--text-secondary)] flex items-center gap-2 flex-wrap mt-0.5">
                          <span>Size: <strong className="text-[var(--gold-accent)]">{item.size || 'M'}</strong></span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <span>Color:</span>
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full border border-white/20 shadow-xs shrink-0"
                              style={{ backgroundColor: item.colorHex || (typeof item.color === 'string' && item.color.startsWith('#') ? item.color : '#111111') }}
                            />
                            <strong className="text-[var(--text-primary)]">{item.colorName || item.color || 'Standard'}</strong>
                          </span>
                          <span>·</span>
                          <span>Qty: <strong className="text-[var(--gold-accent)]">{item.quantity || 1}</strong></span>
                        </div>
                        <div className="text-xs font-mono-luxury text-[var(--gold-accent)] font-bold mt-0.5">
                          ₦{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}
                          {Number(item.quantity || 1) > 1 && (
                            <span className="text-[10px] text-[var(--text-muted)] font-normal ml-1.5">
                              (₦{Number(item.price || 0).toLocaleString()} × {item.quantity})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Destination & Vendor Escrow Payout (Clean 2-Column Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-subtle)] text-xs font-mono-luxury">
                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex flex-col justify-between">
                  <div>
                    <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider block">
                      Delivery Destination:
                    </span>
                    <div className="font-bold text-[var(--text-primary)] mt-1 text-sm leading-snug">
                      {ord.deliveryAddress}
                    </div>
                  </div>
                  {ord.deliveryCity && (
                    <span className="text-[10px] text-[var(--gold-accent)] mt-2 block font-bold">
                      📍 {ord.deliveryCity}
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex flex-col justify-between">
                  <div>
                    <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider block">
                      Your Total Escrow Payout:
                    </span>
                    <div className="font-editorial font-bold text-emerald-400 text-2xl mt-0.5">
                      ₦{ord.totalPayout.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-400/90 mt-2 font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>100% Escrow Secured · Clothes Earnings credited upon delivery</span>
                  </div>
                </div>
              </div>

              {/* Courier & Driver contact details if already dispatched - NO DUPLICATE WAYBILL */}
              {ord.trackingStage >= 3 && ord.trackingDetails?.driverPhone && (
                <div className="p-3.5 rounded-2xl bg-[var(--gold-subtle)]/40 border border-[var(--gold-accent)]/30 flex items-center justify-between text-xs font-mono-luxury text-[var(--text-primary)] flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-[var(--gold-accent)]" />
                    <span>Courier Assigned: <strong>{ord.courierName}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                    <span>Driver / Station: <strong>{ord.trackingDetails.driverPhone}</strong></span>
                  </div>
                </div>
              )}

              {/* Customer Rating & Review Box if Delivered & Rated */}
              {ord.trackingStage >= 4 && ord.customer_measurements?.reviews && ord.customer_measurements.reviews.length > 0 && (
                <div className="p-4 rounded-2xl bg-[var(--gold-accent)]/[0.04] border border-[var(--gold-accent)]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-mono-luxury text-[var(--gold-accent)] font-bold">
                      <Star className="h-4 w-4 fill-current text-[var(--gold-accent)]" />
                      <span>Verified Client Review from {ord.customerName}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-[10px] font-mono-luxury font-bold">
                      {ord.customer_measurements.reviews[0].fitRating === 'true_to_size' ? 'True to Size' : ord.customer_measurements.reviews[0].fitRating?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-primary)] italic font-mono-luxury">
                    "{ord.customer_measurements.reviews[0].comment}"
                  </p>
                  <div className="text-[10px] font-mono-luxury text-[var(--text-muted)]">
                    Rating: {ord.customer_measurements.reviews[0].rating}.0 / 5.0 ★ · Published on product lookbook & brand storefront
                  </div>
                </div>
              )}

              {/* Vendor Fulfillment Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs font-mono-luxury text-[var(--text-secondary)]">
                  {ord.trackingStage === 1 && 'Package garments and mark ready.'}
                  {ord.trackingStage === 2 && 'Garments packed! Ready for courier dispatch.'}
                  {ord.trackingStage === 3 && 'Package is in transit to customer.'}
                  {ord.trackingStage === 4 && 'Customer has confirmed receipt. Funds credited to payout balance.'}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedWaybillOrder(ord)}
                    className="px-4 py-2.5 rounded-full surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[var(--text-primary)] font-mono-luxury uppercase text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer hover:bg-[var(--gold-subtle)]"
                  >
                    <Printer className="h-4 w-4 text-[var(--gold-accent)]" />
                    <span>Print Packing Slip</span>
                  </button>

                  {ord.trackingStage === 1 && (
                    <button
                      type="button"
                      onClick={() => handlePackReady(ord)}
                      disabled={isUpdatingStatus}
                      className="px-6 py-2.5 rounded-full bg-[var(--gold-accent)] text-black font-mono-luxury uppercase text-xs font-bold hover:opacity-90 transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <PackageCheck className="h-4 w-4" />
                      <span>Mark Packed & Ready</span>
                    </button>
                  )}

                  {ord.trackingStage === 2 && (
                    <button
                      type="button"
                      onClick={() => openDispatchModal(ord)}
                      className="px-6 py-2.5 rounded-full bg-[var(--gold-accent)] text-white font-mono-luxury uppercase text-xs font-bold hover:bg-[#d8b357] transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <Truck className="h-4 w-4 text-white" />
                      <span>Dispatch / Hand to Rider</span>
                    </button>
                  )}

                  {ord.trackingStage === 3 && (
                    <span className="text-xs font-mono-luxury text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>In Transit with Courier</span>
                    </span>
                  )}
                  
                  {ord.trackingStage === 4 && (
                    <span className="text-xs font-mono-luxury text-emerald-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Delivered & Settled</span>
                    </span>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Dispatch Waybill Modal */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="surface-card rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[var(--border-subtle)] space-y-5 animate-fadeIn shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-2xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] flex items-center justify-center">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-editorial text-lg font-bold text-[var(--text-primary)]">
                    Dispatch Order {dispatchModalOrder.orderNumber}
                  </h3>
                  <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)]">
                    Enter waybill or driver details for live customer tracking.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDispatchModalOrder(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="space-y-4 text-xs font-mono-luxury">
              <div>
                <label className="block uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Dispatch Rider / Driver Phone Number:
                </label>
                <input
                  type="tel"
                  value={driverPhoneInput}
                  onChange={(e) => setDriverPhoneInput(e.target.value)}
                  placeholder="e.g. 09043*****"
                  className="w-full px-3.5 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-bold"
                  required
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Customer will receive this number to contact the rider directly upon arrival.
                </p>
              </div>

              <div>
                <label className="block uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Waybill / Tracking / Park Number (Optional):
                </label>
                <input
                  type="text"
                  value={waybillInput}
                  onChange={(e) => setWaybillInput(e.target.value)}
                  placeholder="e.g. GIG-918239 or PEACE-PARK-01"
                  className="w-full px-3.5 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDispatchModalOrder(null)}
                  className="flex-1 py-3 rounded-full surface-card border border-[var(--border-subtle)] uppercase font-bold text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="flex-1 py-3 rounded-full bg-[var(--gold-accent)] text-white uppercase font-bold hover:bg-[#d8b357] transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingStatus ? <Sparkles className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4 text-white" />}
                  <span>Confirm Dispatch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. PRINTABLE COURIER SHIPPING WAYBILL MODAL */}
      {selectedWaybillOrder && (
        <ShippingWaybillModal
          order={selectedWaybillOrder}
          vendorProfile={vendorProfile}
          onClose={() => setSelectedWaybillOrder(null)}
        />
      )}

      </div>
    </>
  );
}
