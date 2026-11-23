'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store/useStore';
import {
  ShieldCheck, Truck, Lock, CreditCard, CheckCircle2,
  ArrowRight, ArrowLeft, MapPin, Building, Home,
  Check, Loader2, AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

import { NIGERIAN_STATES, getCitiesForState } from '@/lib/data/nigeriaLocations';
import { estimateItemWeightKg, getMotorParksForState } from '@/lib/services/logistics';

export default function MobileCheckoutView() {
  const router = useRouter();
  const {
    cart,
    clearCart,
    bodyProfile,
    createNewOrder,
    userAuth,
    fetchProductsFromDb,
  } = useStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !userAuth?.isLoggedIn) {
      router.replace('/auth?redirect=/checkout');
    }
  }, [mounted, userAuth?.isLoggedIn, router]);

  const initialDeliveryState = bodyProfile.state || 'Lagos';
  const initialCities = getCitiesForState(initialDeliveryState);

  const [formData, setFormData] = useState({
    name: bodyProfile.name || userAuth.name || '',
    phone: bodyProfile.phone || userAuth.phone || '',
    email: bodyProfile.email || userAuth.email || '',
    address: bodyProfile.deliveryAddress || '',
    state: initialDeliveryState,
    city: bodyProfile.city || initialCities[0] || 'Ikeja',
    notes: '',
  });

  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    fetchProductsFromDb();
  }, [fetchProductsFromDb]);

  // Restore saved checkout form from sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = sessionStorage.getItem('irisi_checkout_form');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          name: parsed.name || prev.name,
          phone: parsed.phone || prev.phone,
          address: parsed.address || prev.address,
          state: parsed.state || prev.state,
          city: parsed.city || prev.city,
        }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem('irisi_checkout_form', JSON.stringify(formData));
    } catch {}
  }, [formData]);

  const handleStateChange = (newState: string) => {
    const cities = getCitiesForState(newState);
    setFormData((prev) => ({
      ...prev,
      state: newState,
      city: cities[0] || '',
    }));
  };

  const [packageMethods, setPackageMethods] = useState<Record<string, 'doorstep' | 'park_pickup'>>({});
  const [selectedParkTerminals] = useState<Record<string, string>>({});
  const [paymentMethod] = useState<'paystack' | 'bank_transfer'>('paystack');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaystackSimModal, setShowPaystackSimModal] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<any>(null);
  const isTestMode =
    (process.env.NEXT_PUBLIC_PAYSTACK_KEY || '').startsWith('pk_test_') ||
    !process.env.NEXT_PUBLIC_PAYSTACK_KEY;

  // Group items by vendor
  const groupedItems = useMemo(() => {
    return cart.reduce(
      (acc, item) => {
        const vendorId = item.product.vendorId || 'boutique';
        if (!acc[vendorId]) {
          acc[vendorId] = {
            vendorId,
            vendorName: item.product.vendorName,
            vendorCity: item.product.vendorCity || 'Lagos',
            vendorState: item.product.vendorState || 'Lagos State',
            dispatchDays: item.product.dispatchDays || '1-2 business days',
            shippingRates: item.product.shippingRates || {
              sameCity: 1000,
              closeHub: 2500,
              interstate: 4500,
              parkPickup: 1500,
              parkPickupEnabled: true,
            },
            items: [],
          };
        }
        acc[vendorId].items.push(item);
        return acc;
      },
      {} as Record<
        string,
        {
          vendorId: string;
          vendorName: string;
          vendorCity: string;
          vendorState: string;
          dispatchDays: string;
          shippingRates: any;
          items: typeof cart;
        }
      >
    );
  }, [cart]);

  const [liveRates, setLiveRates] = useState<Record<string, any>>({});
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  useEffect(() => {
    async function fetchLiveRates() {
      const packageRequests = Object.values(groupedItems).map((pkg) => {
        const pkgWeight = pkg.items.reduce((sum, item) => {
          return sum + estimateItemWeightKg(item.product) * item.quantity;
        }, 0);

        return {
          vendorId: pkg.vendorId,
          vendorName: pkg.vendorName,
          originState: pkg.vendorState || 'Lagos',
          originCity: pkg.vendorCity || 'Lagos',
          destinationState: formData.state || 'Lagos',
          destinationCity: formData.city || 'Lagos',
          itemCount: pkg.items.length,
          totalWeightKg: Math.max(0.5, Number(pkgWeight.toFixed(2))),
          shippingRates: pkg.shippingRates,
        };
      });

      if (packageRequests.length === 0) return;

      setIsLoadingRates(true);
      try {
        const res = await fetch('/api/logistics/rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packages: packageRequests }),
        });
        const data = await res.json();
        if (data.success && data.rates) {
          setLiveRates(data.rates);
        }
      } catch (err) {
        console.warn('Failed to fetch live carrier rates on mobile:', err);
      } finally {
        setIsLoadingRates(false);
      }
    }

    const timer = setTimeout(fetchLiveRates, 300);
    return () => clearTimeout(timer);
  }, [groupedItems, formData.state, formData.city]);

  const packageShippingCalculations = useMemo(() => {
    const calcs: Record<
      string,
      {
        fee: number;
        method: 'doorstep' | 'park_pickup';
        reason: string;
        isSameCity: boolean;
        courierName?: string;
        eta?: string;
        packageWeightKg?: number;
        packageDimensions?: string;
        hasDoorstepPickup?: boolean;
        courierServiceType?: 'pickup' | 'dropoff';
        dropoffStation?: string;
        instructions?: string;
        serviceabilityBadge?: string;
        motorParks?: any[];
      }
    > = {};

    Object.values(groupedItems).forEach((pkg) => {
      const live = liveRates[pkg.vendorId];
      const chosenMethod = packageMethods[pkg.vendorId] || 'doorstep';
      const customerCity = (formData.city || '').toLowerCase().trim();
      const vendorCity = (pkg.vendorCity || '').toLowerCase().trim();
      const customerState = (formData.state || '').toLowerCase().trim();
      const vendorState = (pkg.vendorState || '').toLowerCase().trim();
      const isSameCity = !!(
        customerCity &&
        vendorCity &&
        (customerCity === vendorCity ||
          customerCity.includes(vendorCity) ||
          vendorCity.includes(customerCity))
      );
      const isSameState = !!(customerState && vendorState && customerState === vendorState);

      const vendorDoorstepFee = isSameCity
        ? Number(pkg.shippingRates?.sameCity ?? 1000)
        : isSameState
        ? Number(pkg.shippingRates?.closeHub ?? pkg.shippingRates?.sameCity ?? 2500)
        : Number(pkg.shippingRates?.interstate ?? 4500);

      if (live) {
        const isDoor = chosenMethod === 'doorstep';
        const rateObj = isDoor ? live.doorstep : live.parkPickup;

        calcs[pkg.vendorId] = {
          fee: isDoor ? (rateObj?.fee !== undefined ? rateObj.fee : vendorDoorstepFee) : 0,
          method: chosenMethod,
          reason: isDoor ? rateObj?.serviceType || 'Doorstep Courier' : 'Pay Driver on Pickup',
          isSameCity: live.isSameCity,
          courierName:
            rateObj?.courierName || (isDoor ? 'Doorstep Courier Partner' : 'Motor Park Waybill'),
          eta: rateObj?.estimatedDeliveryDays || (isDoor ? '1-3 business days' : '1-2 business days'),
          packageWeightKg: live.packageWeightKg,
          packageDimensions: live.packageDimensions,
          hasDoorstepPickup: live.doorstep?.hasDoorstepPickup,
          courierServiceType: live.doorstep?.courierServiceType,
          dropoffStation: live.doorstep?.dropoffStation,
          instructions: rateObj?.instructions,
          serviceabilityBadge: live.serviceability?.badgeLabel,
          motorParks: live.motorParks || getMotorParksForState(formData.state),
        };
      } else {
        if (chosenMethod === 'park_pickup') {
          calcs[pkg.vendorId] = {
            fee: 0,
            method: 'park_pickup',
            reason: 'Pay Driver on Pickup',
            isSameCity: false,
            courierName: 'Motor Park Bus Waybill',
            eta: '1-2 business days',
            packageWeightKg: 0.8,
            packageDimensions: '32×24×6cm',
            hasDoorstepPickup: false,
            courierServiceType: 'dropoff',
            motorParks: getMotorParksForState(formData.state),
          };
        } else {
          calcs[pkg.vendorId] = {
            fee: vendorDoorstepFee,
            method: 'doorstep',
            reason: isSameCity
              ? 'Same-City Direct Rider'
              : isSameState
              ? 'Intra-State Doorstep'
              : 'Interstate Doorstep Courier',
            isSameCity,
            courierName: isSameCity ? 'Direct Dispatch Rider' : 'Doorstep Courier Partner',
            eta: isSameCity ? 'Same-day / 24h' : '2-3 business days',
            packageWeightKg: 0.8,
            packageDimensions: '32×24×6cm',
            hasDoorstepPickup: isSameCity,
            courierServiceType: isSameCity ? 'pickup' : 'dropoff',
            motorParks: getMotorParksForState(formData.state),
          };
        }
      }
    });

    return calcs;
  }, [groupedItems, liveRates, packageMethods, formData.city, formData.state]);

  const vendorIds = useMemo(() => Object.keys(groupedItems), [groupedItems]);
  const isAllParkPickup =
    vendorIds.length > 0 &&
    vendorIds.every(
      (vId) => (packageMethods[vId] || packageShippingCalculations[vId]?.method) === 'park_pickup'
    );
  const hasDoorstep =
    vendorIds.length === 0 ||
    vendorIds.some(
      (vId) =>
        (packageMethods[vId] || packageShippingCalculations[vId]?.method || 'doorstep') ===
        'doorstep'
    );

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const totalShippingFee = isAllParkPickup
    ? 0
    : Object.values(packageShippingCalculations).reduce((sum, item) => sum + item.fee, 0);
  const grandTotal = subtotal + totalShippingFee;
  const totalItemsCount = cart.reduce((s, i) => s + i.quantity, 0);

  const [motorParkName, setMotorParkName] = useState<string>('');

  const setAllDeliveryMethods = (method: 'doorstep' | 'park_pickup') => {
    const updated: Record<string, 'doorstep' | 'park_pickup'> = {};
    vendorIds.forEach((vId) => {
      updated[vId] = method;
    });
    setPackageMethods(updated);
    setValidationError('');
  };

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    if (!userAuth?.isLoggedIn) {
      router.push('/auth?redirect=/checkout');
      return;
    }
    if (cart.length === 0) return;
    if (!formData.name.trim() || !formData.phone.trim() || !formData.city.trim()) {
      setValidationError('Please enter your full name, phone number, and city.');
      return;
    }
    if (hasDoorstep && !formData.address.trim()) {
      setValidationError('Please enter your street address for doorstep courier delivery.');
      return;
    }
    handlePayWithPaystack();
  };

  const loadPaystackScript = () => {
    return new Promise<boolean>((resolve) => {
      if ((window as any).PaystackPop) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayWithPaystack = async () => {
    setIsProcessing(true);
    const paymentRef = `vy_escrow_${Date.now()}`;
    const paystackKey =
      process.env.NEXT_PUBLIC_PAYSTACK_KEY || 'pk_test_747039dcebc800028fafa806d62e38f2ed02ab95';

    try {
      const loaded = await loadPaystackScript();
      if (loaded && (window as any).PaystackPop) {
        const handler = (window as any).PaystackPop.setup({
          key: paystackKey,
          email: formData.email || userAuth?.email || 'buyer@irisimi.ng',
          amount: Math.round(grandTotal * 100),
          currency: 'NGN',
          ref: paymentRef,
          metadata: {
            custom_fields: [
              { display_name: 'Customer Name', variable_name: 'customer_name', value: formData.name },
              { display_name: 'Phone Number', variable_name: 'phone_number', value: formData.phone },
            ],
          },
          callback: (response: any) => {
            setShowPaymentModal(false);
            handleCompletePayment(response.reference || paymentRef);
          },
          onClose: () => {
            setIsProcessing(false);
          },
        });
        handler.openIframe();
      } else {
        setValidationError('Could not load Paystack gateway. Please check your internet connection.');
        setIsProcessing(false);
      }
    } catch (e) {
      console.error('Paystack popup error:', e);
      setIsProcessing(false);
    }
  };

  const handleCompletePayment = async (resolvedPaymentRef?: string) => {
    setIsProcessing(true);

    try {
      const orderNum = `#VY-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const paymentRef = resolvedPaymentRef || `vy_escrow_${Date.now()}`;

      const parkLocation = motorParkName.trim() || `${formData.city} Motor Park`;
      const formattedDeliveryAddress = isAllParkPickup
        ? `${parkLocation}, ${formData.city}, ${formData.state} (Motor Park Pickup)`
        : `${formData.address ? formData.address + ', ' : ''}${formData.city}, ${formData.state}`;

      const vendorPackagesPayload: Record<string, any> = {};
      Object.values(groupedItems).forEach((pkg) => {
        const vId = pkg.vendorId;
        const method = packageMethods[vId] || 'doorstep';
        const isPark = method === 'park_pickup';
        const live = liveRates[vId];
        const rateObj = isPark ? live?.parkPickup : live?.doorstep;
        const calc = packageShippingCalculations[vId];

        const courierName = isPark
          ? 'Motor Park Bus Waybill'
          : rateObj?.courierName || calc?.courierName || 'Shipbubble Courier';

        const shippingFee = isPark
          ? 0
          : rateObj?.fee !== undefined
          ? rateObj.fee
          : calc?.fee ?? 0;

        vendorPackagesPayload[vId] = {
          vendorId: vId,
          vendorName: pkg.vendorName,
          vendorCity: pkg.vendorCity || 'Lagos',
          vendorState: pkg.vendorState || 'Lagos',
          deliveryMethod: method,
          shippingFee,
          courierName,
          courierServiceType: isPark
            ? 'dropoff'
            : rateObj?.courierServiceType || calc?.courierServiceType || 'pickup',
          hasDoorstepPickup: isPark
            ? false
            : rateObj?.hasDoorstepPickup ?? calc?.hasDoorstepPickup ?? true,
          requestToken: rateObj?.requestToken || live?.doorstep?.requestToken,
          serviceCode: rateObj?.serviceCode || live?.doorstep?.serviceCode,
          courierId: rateObj?.courierId || live?.doorstep?.courierId,
          selectedParkTerminal: isPark
            ? selectedParkTerminals[vId] || motorParkName || `${formData.city} Motor Park`
            : undefined,
          dropoffStation: isPark
            ? selectedParkTerminals[vId] || motorParkName
            : rateObj?.dropoffStation || calc?.dropoffStation,
          instructions:
            rateObj?.instructions ||
            calc?.instructions ||
            (isPark
              ? 'Package order securely and drop at local motor park. Customer pays collection fee upon arrival.'
              : `${courierName} rider will pick up from your store location once marked ready.`),
          packageWeightKg: live?.packageWeightKg || calc?.packageWeightKg || 1.0,
          packageDimensions: live?.packageDimensions || calc?.packageDimensions || '32×24×6cm',
          status: 'escrow_secured',
          pickupStatus: 'pending_packaging',
        };
      });

      const orderPayload: any = {
        orderNumber: orderNum,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email || userAuth?.email || bodyProfile?.email || '',
        deliveryAddress: formattedDeliveryAddress,
        deliveryCity: formData.city,
        subtotal,
        shippingFee: totalShippingFee,
        totalAmount: grandTotal,
        customerMeasurements: {
          heightCm: 0,
          chestCm: 0,
          shoulderCm: 0,
          waistCm: 0,
          inseamCm: 0,
        },
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          vendorId: item.product.vendorId,
          vendorName: item.product.vendorName,
          price: item.product.price,
          quantity: Number(item.quantity || 1),
          size: item.selectedSize,
          color: item.selectedColor?.name || 'As Pictured',
          colorName: item.selectedColor?.name || 'As Pictured',
          colorHex: item.selectedColor?.hex || '#111111',
          imageUrl: item.selectedColor?.imageUrl || item.product.imageUrl,
          category: item.product.category,
        })),
        vendorPackages: vendorPackagesPayload,
        paymentRef,
        paystackRef: paymentRef,
        packageMethods,
        selectedParkTerminals,
        deliveryState: formData.state,
      };

      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload),
        });
        const data = await res.json();
        if (res.ok && data.success && data.order) {
          orderPayload.id = data.order.id || orderPayload.id;
        }
      } catch (dbErr) {
        console.error('Failed to post order to DB:', dbErr);
      }

      createNewOrder(orderPayload);
      setOrderPlaced(orderPayload);
      clearCart();
      setIsProcessing(false);
      setShowPaymentModal(false);

      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#e6c367', '#10b981', '#ffffff'],
      });
    } catch (err) {
      console.error('Payment completion error:', err);
      setIsProcessing(false);
    }
  };

  /* ── ORDER CONFIRMED STATE (Quiet-Luxury Native Receipt) ─────────────── */
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] px-5 py-12 flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn pb-24">
        <div className="h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center">
          <Check className="h-8 w-8" strokeWidth={2} />
        </div>

        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-[10px] font-mono-luxury uppercase tracking-wider">
            <ShieldCheck className="h-3 w-3" />
            <span>Escrow Secured</span>
          </span>
          <h1 className="font-editorial text-3xl font-normal text-[var(--text-primary)] leading-tight pt-1">
            Order Confirmed
          </h1>
          <p className="text-xs font-mono-luxury text-[var(--gold-accent)]">
            {orderPlaced.orderNumber}
          </p>
        </div>

        <div className="w-full max-w-sm rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] text-left text-xs overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between gap-2">
            <span className="text-[var(--text-muted)]">Recipient</span>
            <span className="text-[var(--text-primary)] font-medium truncate">
              {orderPlaced.customerName}
            </span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-[var(--text-muted)] shrink-0">Destination</span>
            <span className="text-[var(--text-primary)] text-right truncate">
              {orderPlaced.deliveryAddress}
            </span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between gap-2">
            <span className="text-[var(--text-muted)]">Total Paid</span>
            <span className="font-editorial text-lg text-[var(--text-primary)]">
              ₦{Number(orderPlaced.totalAmount || 0).toLocaleString()}
            </span>
          </div>
          <div className="px-4 py-3 bg-[var(--bg-primary)]/50 text-[11px] text-[var(--text-secondary)] font-light leading-relaxed flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Your brand has been notified and is preparing your pieces. Your payment remains
              protected in escrow until delivery.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 w-full max-w-sm">
          <Link
            href={`/track-order?orderNumber=${encodeURIComponent(orderPlaced.orderNumber)}`}
            className="w-full h-12 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-[0.14em] flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <Truck className="h-4 w-4 text-[var(--gold-accent)]" />
            <span>Track Live Delivery</span>
          </Link>

          <Link
            href="/shop"
            className="w-full h-11 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-mono-luxury uppercase tracking-wider flex items-center justify-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--gold-accent)]" />
      </div>
    );
  }

  if (!userAuth?.isLoggedIn) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-6 text-center space-y-5 max-w-sm mx-auto animate-fadeIn py-16">
        <div className="h-14 w-14 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--gold-accent)]">
          <Lock className="h-6 w-6" strokeWidth={1.6} />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-editorial text-2xl font-normal text-[var(--text-primary)]">
            Sign In to Checkout
          </h2>
          <p className="text-xs text-[var(--text-muted)] font-light leading-relaxed">
            Sign in so your escrow receipt, delivery tracking, and brand alerts sync to your account.
          </p>
        </div>
        <Link
          href="/auth?redirect=/checkout"
          className="w-full h-12 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-[0.14em] flex items-center justify-center gap-2"
        >
          <span>Continue to Sign In</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-32 select-none animate-fadeIn">
      {/* 1. Native Sticky Top Header */}
      <header className="sticky top-0 z-30 h-14 px-4 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-[var(--border-subtle)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => router.push(cart.length > 0 ? '/cart' : '/shop')}
            className="h-9 w-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center justify-center active:scale-95 transition-transform shrink-0 cursor-pointer"
            aria-label="Back to bag"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-editorial text-[20px] font-normal text-[var(--text-primary)] leading-tight truncate">
            Checkout
          </h1>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-mono-luxury text-emerald-500 shrink-0">
          <ShieldCheck className="h-3 w-3" />
          <span>Escrow</span>
        </span>
      </header>

      {/* 2. Form Content */}
      <form
        onSubmit={handleStartPayment}
        id="mobile-checkout-form"
        noValidate
        className="px-4 py-4 space-y-5"
      >
        {validationError && (
          <div className="px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Section 1: Delivery Method */}
        <section className="space-y-2.5">
          <div className="px-1 flex items-center justify-between">
            <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Delivery Method
            </span>
            {isAllParkPickup && (
              <span className="text-[10px] font-mono-luxury text-[var(--gold-accent)]">
                Pay driver on pickup
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setAllDeliveryMethods('doorstep')}
              className={`h-10 rounded-xl text-[11.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                !isAllParkPickup
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <Home className="h-3.5 w-3.5" strokeWidth={1.7} />
              <span>Doorstep</span>
            </button>
            <button
              type="button"
              onClick={() => setAllDeliveryMethods('park_pickup')}
              className={`h-10 rounded-xl text-[11.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isAllParkPickup
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <Building className="h-3.5 w-3.5" strokeWidth={1.7} />
              <span>Park Waybill</span>
            </button>
          </div>
        </section>

        {/* Section 2: Recipient & Destination */}
        <section className="space-y-2.5">
          <div className="px-1 flex items-center gap-1.5 text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--text-muted)]">
            <MapPin className="h-3 w-3 text-[var(--gold-accent)]" />
            <span>Recipient &amp; Address</span>
          </div>

          <div className="p-4 rounded-[22px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3.5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] px-0.5">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (validationError) setValidationError('');
                }}
                placeholder="Recipient full name"
                className="w-full h-11 px-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold-accent)] focus:outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] px-0.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (validationError) setValidationError('');
                  }}
                  placeholder="08012345678"
                  className="w-full h-11 px-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs font-mono-luxury text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold-accent)] focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] px-0.5">
                  State
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full h-11 px-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none cursor-pointer"
                >
                  {NIGERIAN_STATES.map((st: string) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] px-0.5">
                City / District
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full h-11 px-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none cursor-pointer"
              >
                {getCitiesForState(formData.state).map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>

            {isAllParkPickup ? (
              <div className="p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--gold-accent)]/30 space-y-2.5 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <Truck className="h-4 w-4 text-[var(--gold-accent)] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[var(--text-secondary)] font-light leading-relaxed">
                    Your package will ship via interstate bus waybill to{' '}
                    <span className="text-[var(--text-primary)] font-medium">
                      {formData.city}, {formData.state}
                    </span>
                    . The driver calls you on arrival — pay transport directly at collection.
                  </p>
                </div>

                <input
                  type="text"
                  value={motorParkName}
                  onChange={(e) => setMotorParkName(e.target.value)}
                  placeholder={`Preferred motor park in ${formData.city} (optional)`}
                  className="w-full h-10 px-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold-accent)] focus:outline-none"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] px-0.5">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      if (validationError) setValidationError('');
                    }}
                    placeholder="House / flat number, street name, landmark"
                    className="w-full h-11 px-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold-accent)] focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] px-0.5">
                    Delivery Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Gate code, nearby landmark, or call instruction"
                    className="w-full h-11 px-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--gold-accent)] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Order Summary */}
        <section className="space-y-2.5">
          <div className="px-1 flex items-center justify-between">
            <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Order Summary ({totalItemsCount} {totalItemsCount === 1 ? 'Piece' : 'Pieces'})
            </span>
            {isLoadingRates && (
              <span className="text-[10px] font-mono-luxury text-[var(--gold-accent)] inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Updating rates</span>
              </span>
            )}
          </div>

          <div className="rounded-[22px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
            {/* Items */}
            <div className="divide-y divide-[var(--border-subtle)]">
              {cart.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-[var(--border-subtle)] bg-zinc-900">
                    <Image
                      src={item.selectedColor?.imageUrl || item.product.imageUrl}
                      alt={item.product.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {item.product.name}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] font-light truncate mt-0.5">
                      {item.product.vendorName || 'Verified Brand'} · Size {item.selectedSize} · Qty{' '}
                      {item.quantity}
                    </div>
                  </div>
                  <div className="font-editorial text-base text-[var(--text-primary)] shrink-0">
                    ₦{(item.product.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Breakdown */}
            <div className="px-4 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Subtotal</span>
                <span className="text-[var(--text-primary)]">₦{subtotal.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>
                  {isAllParkPickup
                    ? 'Motor Park Waybill'
                    : Object.values(packageShippingCalculations)[0]?.courierName || 'Courier Delivery'}
                </span>
                <span className="text-[var(--text-primary)]">
                  {isAllParkPickup ? 'Pay on pickup' : `₦${totalShippingFee.toLocaleString()}`}
                </span>
              </div>

              <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-baseline justify-between">
                <span className="text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-muted)]">
                  Total Due
                </span>
                <span className="font-editorial text-2xl font-normal text-[var(--text-primary)]">
                  ₦{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Escrow Guarantee Pill Card */}
        <section className="px-4 py-3.5 rounded-[20px] bg-[#0D0D10] text-white border border-white/10 flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-zinc-300 font-light leading-relaxed">
            <span className="text-white font-medium">100% Escrow Protected.</span> Your funds are
            held securely until your order arrives and you confirm the quality and fit.
          </div>
        </section>
      </form>

      {/* 3. Sticky Native Bottom Checkout Dock */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[var(--bg-primary)]/95 backdrop-blur-xl border-t border-[var(--border-subtle)] px-4 pt-3 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] block">
              Escrow Total
            </span>
            <div className="font-editorial text-2xl font-normal text-[var(--text-primary)] leading-none mt-0.5">
              ₦{grandTotal.toLocaleString()}
            </div>
          </div>

          <button
            type="submit"
            form="mobile-checkout-form"
            disabled={isProcessing || cart.length === 0}
            className="flex-1 max-w-[215px] h-12 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-[0.14em] flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing</span>
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                <span>Pay Securely</span>
              </>
            )}
          </button>
        </div>
        <div className="h-safe-area-bottom" />
      </div>

      {/* 4. Payment Confirmation Bottom Sheet (fallback flow if triggered) */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end justify-center animate-fadeIn"
          onClick={() => !isProcessing && setShowPaymentModal(false)}
        >
          <div
            className="w-full max-w-md bg-[var(--bg-surface)] rounded-t-[28px] border-t border-[var(--border-subtle)] p-6 space-y-5 shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center -mt-2">
              <div className="h-1 w-10 rounded-full bg-[var(--border-subtle)]" />
            </div>

            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="font-editorial text-lg font-normal text-[var(--text-primary)]">
                  Confirm Payment
                </span>
              </div>
              <span className="text-[10px] font-mono-luxury text-emerald-500">256-Bit Encrypted</span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs space-y-2">
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Items</span>
                <span className="text-[var(--text-primary)]">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Delivery</span>
                <span className="text-[var(--text-primary)]">₦{totalShippingFee.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-baseline justify-between">
                <span className="text-[var(--text-muted)]">Total</span>
                <span className="font-editorial text-xl text-[var(--text-primary)]">
                  ₦{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={
                  paymentMethod === 'paystack'
                    ? handlePayWithPaystack
                    : () => handleCompletePayment()
                }
                disabled={isProcessing}
                className="w-full h-12 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-[0.14em] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Pay ₦{grandTotal.toLocaleString()}</span>
                )}
              </button>

              {isTestMode && (
                <button
                  type="button"
                  onClick={() => handleCompletePayment()}
                  disabled={isProcessing}
                  className="w-full h-10 rounded-full border border-[var(--border-subtle)] text-[11px] font-mono-luxury uppercase text-[var(--gold-accent)] cursor-pointer"
                >
                  Instant Test Checkout
                </button>
              )}
            </div>
            <div className="h-safe-area-bottom" />
          </div>
        </div>
      )}

      {/* 5. Paystack Sandbox Simulator Modal */}
      {showPaystackSimModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-[var(--bg-surface)] rounded-t-[28px] sm:rounded-[28px] border border-[var(--border-subtle)] p-6 space-y-5 shadow-2xl text-center">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--gold-accent)] text-[10px] font-mono-luxury uppercase tracking-wider">
                <CreditCard className="h-3.5 w-3.5" />
                <span>Paystack Test Mode</span>
              </div>
              <div className="font-editorial text-3xl font-normal text-[var(--text-primary)] pt-1">
                ₦{grandTotal.toLocaleString()}
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                setShowPaystackSimModal(false);
                await handleCompletePayment(`paystack_sim_${Date.now()}`);
              }}
              disabled={isProcessing}
              className="w-full h-12 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-[0.14em] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Complete Test Payment</span>}
            </button>
            <button
              type="button"
              onClick={() => setShowPaystackSimModal(false)}
              className="w-full text-xs text-[var(--text-muted)] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
