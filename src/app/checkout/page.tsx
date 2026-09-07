'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store/useStore';
import {
  Home, ShieldCheck, Truck, Lock, CreditCard, CheckCircle2,
  ArrowRight, ArrowLeft, Phone, Mail, MapPin, Sparkles, Check,
  AlertCircle, ChevronRight, Package, Clock, Loader2, Store,
  Building, Navigation
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { signInCustomer, signUpCustomer } from '@/lib/services/auth';
import MobileCheckoutView from '@/components/checkout/MobileCheckoutView';
import { NIGERIAN_STATES, getCitiesForState } from '@/lib/data/nigeriaLocations';
import { estimateItemWeightKg, getMotorParksForState } from '@/lib/services/logistics';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    clearCart,
    bodyProfile,
    createNewOrder,
    userAuth,
    setUserAuth,
    setBodyProfile,
    setSelectedGender,
    fetchProductsFromDb,
  } = useStore();

  // Auth Gate State (for unauthenticated visitors)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authGender, setAuthGender] = useState<'male' | 'female'>('male');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');

  // Customer Delivery Form State (Empty by default with clean placeholders)
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

  // Fetch fresh products and reconcile cart items from DB on mount
  useEffect(() => {
    fetchProductsFromDb();
  }, [fetchProductsFromDb]);

  // Restore saved checkout form from sessionStorage so reloads never erase customer input
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = sessionStorage.getItem('irisi_checkout_form');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({
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

  // Persist form changes to sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem('irisi_checkout_form', JSON.stringify(formData));
    } catch {}
  }, [formData]);

  const handleStateChange = (newState: string) => {
    const cities = getCitiesForState(newState);
    setFormData(prev => ({
      ...prev,
      state: newState,
      city: cities[0] || ''
    }));
  };

  // Package delivery methods per vendor (key: vendorId, value: 'doorstep' | 'park_pickup')
  const [packageMethods, setPackageMethods] = useState<Record<string, 'doorstep' | 'park_pickup'>>({});
  const [selectedParkTerminals, setSelectedParkTerminals] = useState<Record<string, string>>({});

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'bank_transfer'>('paystack');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaystackSimModal, setShowPaystackSimModal] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<any>(null);
  const isTestMode = (process.env.NEXT_PUBLIC_PAYSTACK_KEY || '').startsWith('pk_test_') || !process.env.NEXT_PUBLIC_PAYSTACK_KEY;

  // Group items by vendor
  const groupedItems = useMemo(() => {
    return cart.reduce((acc, item) => {
      const vendorId = item.product.vendorId || 'boutique';
      if (!acc[vendorId]) {
        acc[vendorId] = {
          vendorId,
          vendorName: item.product.vendorName,
          vendorCity: item.product.vendorCity || 'Ijebu-Ode',
          vendorState: item.product.vendorState || 'Ogun State',
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
    }, {} as Record<string, {
      vendorId: string;
      vendorName: string;
      vendorCity: string;
      vendorState: string;
      dispatchDays: string;
      shippingRates: any;
      items: typeof cart;
    }>);
  }, [cart]);

  // Live Logistics API State
  const [liveRates, setLiveRates] = useState<Record<string, any>>({});
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // Fetch real-time live carrier quotes from /api/logistics/rates
  useEffect(() => {
    async function fetchLiveRates() {
      const packageRequests = Object.values(groupedItems).map(pkg => {
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
          totalWeightKg: Math.max(0.5, Number(pkgWeight.toFixed(2)))
        };
      });

      if (packageRequests.length === 0) return;

      setIsLoadingRates(true);
      try {
        const res = await fetch('/api/logistics/rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packages: packageRequests })
        });
        const data = await res.json();
        if (data.success && data.rates) {
          setLiveRates(data.rates);
        }
      } catch (err) {
        console.warn('Failed to fetch live carrier rates:', err);
      } finally {
        setIsLoadingRates(false);
      }
    }

    const timer = setTimeout(fetchLiveRates, 300);
    return () => clearTimeout(timer);
  }, [groupedItems, formData.state, formData.city]);

  // Calculate dynamic shipping fee per vendor package
  const packageShippingCalculations = useMemo(() => {
    const calcs: Record<string, {
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
    }> = {};

    Object.values(groupedItems).forEach((pkg) => {
      const live = liveRates[pkg.vendorId];
      const chosenMethod = packageMethods[pkg.vendorId] || 'doorstep';

      if (live) {
        const isDoor = chosenMethod === 'doorstep';
        const rateObj = isDoor ? live.doorstep : live.parkPickup;

        calcs[pkg.vendorId] = {
          fee: rateObj?.fee || (isDoor ? 4500 : 0),
          method: chosenMethod,
          reason: isDoor ? (rateObj?.serviceType || 'Doorstep Courier') : 'Pay Driver on Pickup (~₦1,500 - ₦2,500)',
          isSameCity: live.isSameCity,
          courierName: rateObj?.courierName || (isDoor ? 'GIG Logistics' : 'Motor Park Waybill'),
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
        const customerCity = (formData.city || '').toLowerCase().trim();
        const vendorCity = (pkg.vendorCity || '').toLowerCase().trim();
        const isSameCity = !!(customerCity && vendorCity && (customerCity === vendorCity || customerCity.includes(vendorCity) || vendorCity.includes(customerCity)));

        if (chosenMethod === 'park_pickup') {
          calcs[pkg.vendorId] = {
            fee: 0,
            method: 'park_pickup',
            reason: 'Pay Driver on Pickup (~₦1,500 - ₦2,500)',
            isSameCity: false,
            courierName: 'Interstate Bus Terminal Waybill',
            eta: '1-2 business days',
            packageWeightKg: 0.8,
            packageDimensions: '32×24×6cm',
            hasDoorstepPickup: false,
            courierServiceType: 'dropoff',
            motorParks: getMotorParksForState(formData.state),
          };
        } else {
          calcs[pkg.vendorId] = {
            fee: isSameCity ? 1500 : 4500,
            method: 'doorstep',
            reason: isSameCity ? 'Same-City Direct Rider' : 'Interstate Doorstep Courier',
            isSameCity,
            courierName: isSameCity ? 'Direct Dispatch Rider' : 'GIG Logistics Express',
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

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const totalShippingFee = Object.values(packageShippingCalculations).reduce((sum, item) => sum + item.fee, 0);
  const grandTotal = subtotal + totalShippingFee;

  const vendorIds = useMemo(() => Object.keys(groupedItems), [groupedItems]);
  const isAllParkPickup = vendorIds.length > 0 && vendorIds.every(
    vId => (packageMethods[vId] || packageShippingCalculations[vId]?.method) === 'park_pickup'
  );
  const hasDoorstep = vendorIds.length === 0 || vendorIds.some(
    vId => (packageMethods[vId] || packageShippingCalculations[vId]?.method || 'doorstep') === 'doorstep'
  );

  const [motorParkName, setMotorParkName] = useState<string>('');
  const resolvedMotorPark = motorParkName.trim() || `${formData.city} Motor Park`;

  // Toggle park pickup vs doorstep for all vendor packages at once
  const setAllDeliveryMethods = (method: 'doorstep' | 'park_pickup') => {
    const updated: Record<string, 'doorstep' | 'park_pickup'> = {};
    vendorIds.forEach(vId => {
      updated[vId] = method;
    });
    setPackageMethods(updated);
  };

  // Toggle park pickup vs doorstep for a specific vendor package
  const togglePackageMethod = (vendorId: string, method: 'doorstep' | 'park_pickup') => {
    setPackageMethods(prev => ({ ...prev, [vendorId]: method }));
  };

  // Auth Handler
  const handleQuickAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError('');

    try {
      if (authTab === 'login') {
        const res = await signInCustomer(authEmail, authPassword);
        if (!res.success) {
          setAuthError(res.error || 'Invalid credentials');
          setIsAuthenticating(false);
          return;
        }

        const patronName = res.profile?.full_name || authEmail.split('@')[0];
        setUserAuth({
          isLoggedIn: true,
          name: patronName,
          email: authEmail,
          userType: 'shopper',
        });
        setFormData(prev => ({ ...prev, email: authEmail, name: patronName }));
      } else {
        const res = await signUpCustomer({
          email: authEmail,
          password: authPassword,
          fullName: authName || authEmail.split('@')[0],
          gender: authGender,
        });

        if (!res.success) {
          setAuthError(res.error || 'Registration failed');
          setIsAuthenticating(false);
          return;
        }

        const patronName = authName || authEmail.split('@')[0];
        const twinId = `VY-NIG-${Math.floor(100 + Math.random() * 900)}`;

        setUserAuth({
          isLoggedIn: true,
          name: patronName,
          email: authEmail,
          gender: authGender,
          userType: 'shopper',
        });
        setSelectedGender(authGender);
        setBodyProfile({
          name: patronName,
          email: authEmail,
          gender: authGender,
          twinId,
          isInitialized: true,
        });
        setFormData(prev => ({ ...prev, email: authEmail, name: patronName }));
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!formData.name || !formData.phone || !formData.city) {
      alert('Please fill in your recipient name, phone number, and city.');
      return;
    }
    if (hasDoorstep && !formData.address) {
      alert('Please enter your street address for doorstep courier delivery.');
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
    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_KEY || 'pk_test_747039dcebc800028fafa806d62e38f2ed02ab95';

    try {
      const loaded = await loadPaystackScript();
      if (loaded && (window as any).PaystackPop) {
        const handler = (window as any).PaystackPop.setup({
          key: paystackKey,
          email: formData.email || userAuth?.email || 'customer@irisi.ng',
          amount: Math.round(grandTotal * 100),
          currency: 'NGN',
          ref: paymentRef,
          metadata: {
            custom_fields: [
              { display_name: 'Customer Name', variable_name: 'customer_name', value: formData.name },
              { display_name: 'Phone Number', variable_name: 'phone_number', value: formData.phone }
            ]
          },
          callback: (response: any) => {
            setShowPaymentModal(false);
            handleCompleteOrder(response.reference || paymentRef);
          },
          onClose: () => {
            setIsProcessing(false);
          }
        });
        handler.openIframe();
      } else {
        alert('Could not load Paystack gateway. Please check your internet connection.');
        setIsProcessing(false);
      }
    } catch (e) {
      console.error('Paystack popup error:', e);
      setIsProcessing(false);
    }
  };

  const handleCompleteOrder = async (resolvedPaymentRef?: string) => {
    setIsProcessing(true);

    try {
      const orderNum = `#VY-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const paymentRef = resolvedPaymentRef || `vy_escrow_${Date.now()}`;

      const parkLocation = motorParkName.trim() || `${formData.city} Motor Park`;
      const resolvedParkTerminals = vendorIds.reduce((acc, vId) => {
        acc[vId] = parkLocation;
        return acc;
      }, {} as Record<string, string>);

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
          : (rateObj?.courierName || calc?.courierName || 'Shipbubble Courier');

        const shippingFee = isPark ? 0 : (rateObj?.fee || calc?.fee || 0);

        vendorPackagesPayload[vId] = {
          vendorId: vId,
          vendorName: pkg.vendorName,
          vendorCity: pkg.vendorCity || 'Lagos',
          vendorState: pkg.vendorState || 'Lagos',
          deliveryMethod: method,
          shippingFee,
          courierName,
          courierServiceType: isPark ? 'dropoff' : (rateObj?.courierServiceType || calc?.courierServiceType || 'pickup'),
          hasDoorstepPickup: isPark ? false : (rateObj?.hasDoorstepPickup ?? calc?.hasDoorstepPickup ?? true),
          requestToken: rateObj?.requestToken || live?.doorstep?.requestToken,
          serviceCode: rateObj?.serviceCode || live?.doorstep?.serviceCode,
          courierId: rateObj?.courierId || live?.doorstep?.courierId,
          selectedParkTerminal: isPark ? (selectedParkTerminals[vId] || motorParkName || `${formData.city} Motor Park`) : undefined,
          dropoffStation: isPark ? (selectedParkTerminals[vId] || motorParkName) : (rateObj?.dropoffStation || calc?.dropoffStation),
          instructions: rateObj?.instructions || calc?.instructions || (isPark
            ? 'Package garment and drop at local motor park. Customer pays collection fee upon arrival.'
            : `${courierName} rider will pick up from your atelier once marked ready.`),
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
        items: cart.map(item => ({
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

      // 1. Send live POST request to PostgreSQL database
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });
        const data = await res.json();
        if (res.ok && data.success && data.order) {
          orderPayload.id = data.order.id || orderPayload.id;
        }
      } catch (dbErr) {
        console.error('Failed to post order to DB:', dbErr);
      }

      // 2. Update local state & clear cart
      createNewOrder(orderPayload);
      setOrderPlaced(orderPayload);
      clearCart();
      setIsProcessing(false);
      setShowPaymentModal(false);

      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#e6c367', '#10b981', '#ffffff']
      });
    } catch (err) {
      console.error('Payment completion error:', err);
      setIsProcessing(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center text-center p-6 space-y-7 max-w-2xl mx-auto animate-fadeIn py-16">
        
        {/* Luxury Animated Escrow Secured Emblem */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-28 w-28 rounded-full bg-emerald-500/15 animate-ping opacity-75" />
          <div className="absolute h-24 w-24 rounded-full bg-[var(--gold-accent)]/10 animate-pulse" />
          <div className="relative h-20 w-20 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-black flex items-center justify-center shadow-2xl ring-4 ring-emerald-400/20 transform transition-transform hover:scale-105">
            <Check className="h-10 w-10 stroke-[3] text-black drop-shadow-sm" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono-luxury font-bold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            <span>Escrow Payment Confirmed & Secured</span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)] leading-tight pt-1">
            Order Sent to Designers & Brands!
          </h1>
          <p className="text-xs font-mono-luxury text-[var(--gold-accent)] font-bold tracking-wider">
            Order Reference: {orderPlaced.orderNumber}
          </p>
        </div>

        <div className="w-full p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] text-left space-y-4 text-xs font-mono-luxury shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <span className="text-[var(--text-secondary)]">Recipient Name:</span>
            <span className="font-bold text-[var(--text-primary)]">{orderPlaced.customerName}</span>
          </div>
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <span className="text-[var(--text-secondary)]">Delivery Destination:</span>
            <span className="font-bold text-[var(--text-primary)] text-right">{orderPlaced.deliveryAddress}</span>
          </div>
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <span className="text-[var(--text-secondary)]">Total Paid (Escrow):</span>
            <span className="font-bold text-[var(--gold-accent)] text-sm">₦{Number(orderPlaced.totalAmount || 0).toLocaleString()}</span>
          </div>
          <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-start gap-2.5 text-[11px] text-[var(--text-secondary)]">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Each vendor has been notified with your sizes. They are preparing your garments for courier dispatch. Funds will only be released after you confirm receipt.</span>
          </div>
        </div>

        {/* Action Buttons: Track Order & Continue Shopping */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <Link
            href={`/track-order?orderNumber=${encodeURIComponent(orderPlaced.orderNumber)}`}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold hover:opacity-90 transition-all shadow-md inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Truck className="h-4 w-4" />
            <span>Track Order Live</span>
          </Link>

          <Link
            href="/shop"
            className="w-full sm:w-auto px-8 py-4 rounded-full surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[var(--text-primary)] font-mono-luxury uppercase text-xs font-bold transition-all shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    );
  }

  return (
    <>
      {/* 1. DEDICATED MOBILE CHECKOUT VIEW */}
      <div className="block md:hidden">
        <MobileCheckoutView />
      </div>

      {/* 2. DESKTOP LUXURY CHECKOUT VIEW */}
      <div className="hidden md:block min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 animate-fadeIn pb-24">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold">
              Secure Escrow Checkout
            </span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-1">
            Delivery & Payment
          </h1>
        </div>

        <Link
          href="/cart"
          className="flex items-center gap-1.5 text-xs font-mono-luxury uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Bag</span>
        </Link>
      </div>

      {cart.length === 0 ? (
        <div className="p-16 rounded-3xl surface-card text-center space-y-4 border border-[var(--border-subtle)]">
          <p className="text-base text-[var(--text-secondary)] font-light">Your shopping bag is empty.</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase tracking-widest text-xs font-bold hover:opacity-90 transition-all shadow-md"
          >
            <span>Browse Clothes</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT 7 COLS: DELIVERY ADDRESS & DETAILS */}
          <div className="lg:col-span-7 space-y-6">

            {/* Quick Login / Create Account if not logged in */}
            {!userAuth.isLoggedIn && (
              <div className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold">
                    Quick Shopper Access (Optional)
                  </span>
                  <div className="flex items-center p-0.5 rounded-lg bg-[var(--bg-secondary)] text-[10px] font-mono-luxury font-bold">
                    <button
                      type="button"
                      onClick={() => setAuthTab('login')}
                      className={`px-2.5 py-1 rounded-md transition-all ${authTab === 'login' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'text-[var(--text-secondary)]'}`}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthTab('register')}
                      className={`px-2.5 py-1 rounded-md transition-all ${authTab === 'register' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'text-[var(--text-secondary)]'}`}
                    >
                      Sign Up
                    </button>
                  </div>
                </div>

                <form onSubmit={handleQuickAuth} className="space-y-3 text-xs font-mono-luxury">
                  {authTab === 'register' && (
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                    />
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                    />
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                    />
                  </div>

                  {authError && <p className="text-rose-400 text-[11px] font-bold">{authError}</p>}

                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--gold-accent)] font-bold uppercase text-[10px] transition-all"
                  >
                    {isAuthenticating ? 'Authenticating...' : authTab === 'login' ? 'Quick Login' : 'Create Shopper Account'}
                  </button>
                </form>
              </div>
            )}

            {/* Delivery Destination Form */}
            <form onSubmit={handleStartPayment} id="checkout-form" className="p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-5 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold block">
                  1. Delivery Method & Destination
                </span>
                {isAllParkPickup && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-mono-luxury font-bold uppercase">
                    Park Pickup · Pay on Collection
                  </span>
                )}
              </div>

              {/* Delivery Option Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] font-bold">
                  Choose How You Want to Receive Your Order
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAllDeliveryMethods('doorstep')}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      !isAllParkPickup
                        ? 'bg-[var(--gold-subtle)]/40 border-[var(--gold-accent)] shadow-sm'
                        : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--gold-accent)]/50'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${!isAllParkPickup ? 'bg-[var(--gold-accent)] text-black font-bold' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}>
                      <Home className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold font-mono-luxury text-[var(--text-primary)]">Doorstep Courier Delivery</div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
                        Express courier delivery direct to your home or office address.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAllDeliveryMethods('park_pickup')}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      isAllParkPickup
                        ? 'bg-[var(--gold-subtle)]/40 border-[var(--gold-accent)] shadow-sm'
                        : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--gold-accent)]/50'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${isAllParkPickup ? 'bg-[var(--gold-accent)] text-black font-bold' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}>
                      <Building className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold font-mono-luxury text-[var(--text-primary)]">Motor Park / Bus Driver Delivery</div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
                        Sent via bus driver to the motor park in your city. Pay driver on collection (No street address required).
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recipient Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-[var(--border-subtle)]">
                <div>
                  <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Full Name"
                    className="w-full px-3.5 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-bold focus:border-[var(--gold-accent)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                    {isAllParkPickup ? 'Phone Number (Driver Calls You on Arrival)' : 'Phone Number (For Courier)'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08012*****"
                    className="w-full px-3.5 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                  />
                </div>
              </div>

              {/* State & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                    Delivery State
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-bold cursor-pointer"
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                    City / Town / District
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-bold cursor-pointer"
                  >
                    {getCitiesForState(formData.state).map((ct) => (
                      <option key={ct} value={ct}>{ct}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conditional Field: Motor Park in City vs Street Delivery Address */}
              {isAllParkPickup ? (
                <div className="p-4 rounded-2xl bg-amber-500/[0.08] border border-amber-500/30 space-y-3 animate-fadeIn">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)]">
                        Motor Park Delivery (No Street Address Needed)
                      </h4>
                      <p className="text-[11px] text-[var(--text-secondary)] font-mono-luxury mt-0.5 leading-relaxed">
                        The vendor will send your package via an interstate bus driver heading to <strong>{formData.city}, {formData.state}</strong>. When the bus arrives at the motor park in {formData.city}, the driver will call your phone ({formData.phone || 'provided above'}) to collect it.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold mb-1">
                      Motor Park / Garage in {formData.city} (Optional):
                    </label>
                    <input
                      type="text"
                      value={motorParkName}
                      onChange={(e) => setMotorParkName(e.target.value)}
                      placeholder={`e.g. Main Motor Park, Central Garage, or nearest park in ${formData.city}`}
                      className="w-full px-3.5 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-bold focus:border-[var(--gold-accent)] focus:outline-none"
                    />
                    <p className="text-[10px] font-mono-luxury text-amber-400/90 mt-1.5 flex items-center gap-1">
                      <span>⚠️ Pay the bus driver's transport fee directly when you collect your parcel from the driver in {formData.city}.</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                      Street Delivery Address
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="House / flat number, street name, and landmark"
                      className="w-full px-3.5 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                      Delivery Notes / Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="e.g. Opposite First Bank, call on arrival"
                      className="w-full px-3.5 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* RIGHT 5 COLS: CHECKOUT TOTAL & ESCROW PAYMENT BUTTON */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-5 shadow-md sticky lg:top-24">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                Order Summary
              </h3>
              <span className="text-xs font-mono-luxury text-[var(--text-secondary)]">
                {cart.reduce((s, i) => s + i.quantity, 0)} item(s)
              </span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 text-xs font-mono-luxury divide-y divide-[var(--border-subtle)]/50">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 pt-2.5 first:pt-0">
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                    <Image src={item.selectedColor?.imageUrl || item.product.imageUrl} alt={item.product.name} fill unoptimized className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-[var(--text-primary)] truncate">{item.product.name}</h4>
                    <div className="text-[10px] text-[var(--text-secondary)] mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>Size: <strong className="text-[var(--gold-accent)]">{item.selectedSize}</strong></span>
                      {item.selectedColor?.name && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <span
                              className="h-2 w-2 rounded-full border border-white/20 inline-block shrink-0"
                              style={{ backgroundColor: item.selectedColor.hex || '#111111' }}
                            />
                            <span>{item.selectedColor.name}</span>
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span>Qty: <strong className="text-[var(--gold-accent)]">{item.quantity}</strong></span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">
                      {item.product.vendorName || 'Atelier Store'}
                    </div>
                  </div>
                  <div className="text-right font-bold text-[var(--text-primary)] font-editorial text-sm shrink-0">
                    ₦{(item.product.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 pt-3 border-t border-[var(--border-subtle)] text-xs font-mono-luxury">
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Garments Subtotal:</span>
                <span className="font-bold text-[var(--text-primary)]">₦{subtotal.toLocaleString()}</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[var(--text-secondary)]">
                  <span>Delivery:</span>
                  <span className="font-bold text-[var(--gold-accent)]">
                    {isAllParkPickup ? 'Pay Driver on Collection (~₦1,500)' : `₦${totalShippingFee.toLocaleString()}`}
                  </span>
                </div>
                {!isAllParkPickup && (
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      <span>{Object.values(packageShippingCalculations)[0]?.courierName || 'Shipbubble Live Dispatch'}</span>
                    </span>
                    <span>{Object.values(packageShippingCalculations)[0]?.eta || '2-4 business days'}</span>
                  </div>
                )}
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-sm">
                <span className="font-bold text-[var(--text-primary)]">Total Due Now:</span>
                <span className="font-editorial text-2xl sm:text-3xl font-bold text-amber-600 dark:text-[var(--gold-accent)]">
                  ₦{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              className="w-full py-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              <span>Pay ₦{grandTotal.toLocaleString()} via Escrow</span>
            </button>

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-emerald-400 text-[11px] font-mono-luxury">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <strong>100% Escrow Protection:</strong> Your payment is held safely and only released to the vendor after you receive and approve your clothes.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Interactive Escrow Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-6 shadow-2xl animate-scaleUp">
            
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span className="font-editorial text-lg font-bold text-[var(--text-primary)]">Ìrísí Escrow Gateway</span>
              </div>
              <span className="text-[10px] font-mono-luxury text-emerald-400 font-bold">256-Bit Encrypted</span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-2 text-xs font-mono-luxury">
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Items Subtotal:</span>
                <span className="font-bold text-[var(--text-primary)]">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Multi-Vendor Shipping:</span>
                <span className="font-bold text-[var(--gold-accent)]">₦{totalShippingFee.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-sm font-bold text-[var(--text-primary)]">
                <span>Total Charge:</span>
                <span className="text-[var(--gold-accent)] text-lg">₦{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-mono-luxury uppercase text-[var(--text-secondary)] font-bold block">
                Select Payment Channel:
              </span>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paystack')}
                  className={`p-3.5 rounded-2xl border text-center font-mono-luxury text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === 'paystack'
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
                      : 'surface-card border-[var(--border-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Debit / Credit Card</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-3.5 rounded-2xl border text-center font-mono-luxury text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === 'bank_transfer'
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
                      : 'surface-card border-[var(--border-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>Instant Bank Transfer</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={paymentMethod === 'paystack' ? handlePayWithPaystack : () => handleCompleteOrder()}
                disabled={isProcessing}
                className="w-full py-4 rounded-full bg-emerald-500 text-black font-mono-luxury uppercase text-xs font-bold hover:bg-emerald-400 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" />
                    <span>Processing Escrow Authorization...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Pay ₦{grandTotal.toLocaleString()} {paymentMethod === 'paystack' ? (isTestMode ? '(Test Mode)' : '') : '(Bank Transfer)'}</span>
                  </>
                )}
              </button>

              {isTestMode && (
                <button
                  type="button"
                  onClick={() => handleCompleteOrder()}
                  disabled={isProcessing}
                  className="w-full py-2.5 rounded-xl border border-[var(--border-subtle)] text-center text-xs font-mono-luxury uppercase text-[var(--gold-accent)] hover:border-[var(--gold-accent)] transition-colors cursor-pointer"
                >
                  Instant Test Checkout (Skip Gateway)
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                disabled={isProcessing}
                className="w-full py-2 text-center text-xs font-mono-luxury text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Cancel & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYSTACK SANDBOX SIMULATOR MODAL */}
      {showPaystackSimModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm surface-card rounded-3xl border border-[var(--border-subtle)] p-6 space-y-5 shadow-2xl animate-scaleUp text-center">
            
            {/* Paystack Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono-luxury font-bold uppercase tracking-wider">
                <CreditCard className="h-3.5 w-3.5" />
                <span>Paystack Sandbox Simulation</span>
              </div>
              <div className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
                ₦{grandTotal.toLocaleString()}
              </div>
              <p className="text-[11px] font-mono-luxury text-[var(--text-muted)]">
                Recipient: Ìrísí Escrow Treasury
              </p>
            </div>

            {/* Simulated Debit Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-black border border-white/10 text-white text-left space-y-3 shadow-xl">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">TEST DEBIT CARD</span>
                <span className="text-[var(--gold-accent)] font-bold">VERVE / MASTERCARD</span>
              </div>
              <div className="font-mono text-base tracking-widest text-zinc-100 font-bold py-1">
                4084 •••• •••• 0840
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <div>
                  <span>EXPIRY: </span>
                  <strong className="text-white">12/28</strong>
                </div>
                <div>
                  <span>CVV: </span>
                  <strong className="text-white">408</strong>
                </div>
                <div>
                  <span>PIN: </span>
                  <strong className="text-white">1234</strong>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono-luxury text-amber-400 text-left leading-relaxed">
              <strong>Test Mode:</strong> No personal Paystack key added in <code className="text-white">.env.local</code> yet. This simulates a successful Paystack card payment and secures your order into Ìrísí Escrow.
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={async () => {
                  setShowPaystackSimModal(false);
                  await handleCompleteOrder(`paystack_sim_${Date.now()}`);
                }}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-full bg-emerald-500 text-black font-mono-luxury uppercase text-xs font-bold hover:bg-emerald-400 transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin text-black" />
                    <span>Securing Escrow...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 stroke-[2]" />
                    <span>Simulate Successful Payment</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowPaystackSimModal(false)}
                className="w-full py-2.5 rounded-full surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel Payment
              </button>
            </div>

          </div>
        </div>
      )}

      </div>
    </>
  );
}
