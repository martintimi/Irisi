'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/useStore';
import {
  User, Phone, Mail, MapPin, Package, Bell, Star, ShieldCheck,
  CheckCircle2, Clock, Sparkles, ArrowRight, Layers, LogOut,
  Scissors, ChevronRight, Check, Heart, Edit3, MessageSquare, Loader2, Truck,
  Settings, KeyRound, HelpCircle, Lightbulb, ExternalLink
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import MobileProfileView from '@/components/profile/MobileProfileView';
import ChangePasswordModal from '@/components/profile/ChangePasswordModal';
import FaqHelpModal from '@/components/profile/FaqHelpModal';
import RateAppModal from '@/components/profile/RateAppModal';
import HelpImproveModal from '@/components/profile/HelpImproveModal';

export default function ProfilePage() {
  const router = useRouter();
  const {
    bodyProfile, setBodyProfile, userOrders, rateOrder,
    userNotifications, markNotificationAsRead, markAllNotificationsAsRead,
    userAuth, setUserAuth, logout
  } = useStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'body_twin' | 'orders' | 'notifications' | 'settings'>('orders');
  const [isLoading, setIsLoading] = useState(false);
  const [liveOrders, setLiveOrders] = useState<any[]>([]);

  // Settings Modals State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isRateAppOpen, setIsRateAppOpen] = useState(false);
  const [isHelpImproveOpen, setIsHelpImproveOpen] = useState(false);

  // Fetch real orders from PostgreSQL on mount
  useEffect(() => {
    async function loadRealOrders() {
      try {
        const userEmail = userAuth?.email || bodyProfile?.email || '';
        const url = userEmail ? `/api/orders?email=${encodeURIComponent(userEmail)}` : '/api/orders';
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setLiveOrders(data.orders);
        } else {
          setLiveOrders([]);
        }
      } catch (e) {
        setLiveOrders([]);
      }
    }
    loadRealOrders();
  }, [userAuth?.email, bodyProfile?.email]);

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: bodyProfile.name || userAuth.name || '',
    email: bodyProfile.email || userAuth.email || '',
    phone: bodyProfile.phone || userAuth.phone || '',
    deliveryAddress: bodyProfile.deliveryAddress || '',
    city: bodyProfile.city || 'Lagos',
    state: bodyProfile.state || 'Lagos',
  });

  // Hydrate from live /api/auth/me and /api/orders
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            const p = data.profile;
            const updated = {
              name: p.full_name || '',
              email: p.email || '',
              phone: p.phone || '',
              deliveryAddress: p.delivery_address || '',
              city: p.delivery_city || 'Lagos',
              state: p.delivery_state || 'Lagos',
            };
            setProfileForm(prev => ({ ...prev, ...updated }));
            setBodyProfile(updated);
            setUserAuth({
              isLoggedIn: true,
              name: p.full_name || '',
              email: p.email || '',
              phone: p.phone || '',
            });
          }
        }

        const ordRes = await fetch('/api/orders');
        if (ordRes.ok) {
          const ordData = await ordRes.json();
          if (ordData.orders) {
            setLiveOrders(ordData.orders);
          }
        }
      } catch (err) {
        console.warn('Profile fetch note:', err);
      }
    }

    loadData();
  }, [setBodyProfile, setUserAuth]);

  // Rating Modal state
  const [ratingModalOrder, setRatingModalOrder] = useState<string | null>(null);
  const [starRating, setStarRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('World-class quality and authentic craftsmanship. Fits comfortably and delivered promptly.');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setBodyProfile(profileForm);
    setUserAuth({
      name: profileForm.name,
      email: profileForm.email,
      phone: profileForm.phone,
    });

    try {
      await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
    } catch (err) {
      console.warn('Profile sync note:', err);
    } finally {
      setIsLoading(false);
    }

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#e6c367', '#10b981', '#ffffff']
    });
  };

  const handleRatingSubmit = async (orderId: string) => {
    const matchedOrder = effectiveOrders.find(o => o.id === orderId || o.orderNumber === orderId);
    const firstItem = matchedOrder?.items?.[0] || {};

    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: matchedOrder?.id || orderId,
          orderNumber: matchedOrder?.orderNumber,
          productId: firstItem.productId || firstItem.id,
          productName: firstItem.productName || firstItem.name || 'Garment Piece',
          vendorId: firstItem.vendorId || 'moji-wears',
          customerName: displayName,
          rating: starRating,
          fitRating: 'true_to_size',
          comment: reviewComment.trim()
        })
      });
    } catch (e) {}

    rateOrder(orderId, starRating, reviewComment);
    setRatingModalOrder(null);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#e6c367', '#10b981', '#ffffff']
    });
  };

  const unreadCount = userNotifications.filter(n => !n.read).length;
  const displayName = profileForm.name || userAuth.name || (userAuth.email ? userAuth.email.split('@')[0] : 'Ìrísí Patron');
  const displayPhone = profileForm.phone || userAuth.phone || 'No phone added (Tap Details to Add)';
  const displayLocation = (profileForm.deliveryAddress || profileForm.city) ? `${profileForm.city}, ${profileForm.state}` : 'Lagos, Nigeria';
  const effectiveOrders = liveOrders.length > 0 ? liveOrders : userOrders;

  return (
    <>
      {/* 1. DEDICATED MOBILE PROFILE VIEW */}
      <div className="block md:hidden">
        <MobileProfileView />
      </div>

      {/* 2. DESKTOP LUXURY PROFILE VIEW */}
      <div className="hidden md:block min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Top Profile Banner Header */}
      <div className="p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] flex items-center justify-center font-editorial font-bold text-2xl shadow-md uppercase">
            {displayName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-editorial text-2xl sm:text-3xl font-normal text-[var(--text-primary)]">
                {displayName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px] font-mono-luxury font-bold">
                ● Verified Patron Account
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-1 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-[var(--gold-accent)]" />
                <span>{displayPhone}</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[var(--gold-accent)]" />
                <span>{displayLocation}</span>
              </span>
            </p>
          </div>
        </div>

        {/* Quick Stats Pill Bar */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="px-4 py-2 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center shrink-0">
            <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase block">Orders</span>
            <span className="font-bold text-sm text-[var(--text-primary)]">{effectiveOrders.length} Completed</span>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center shrink-0">
            <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase block">Patron Atelier ID</span>
            <span className="font-mono-luxury font-bold text-xs text-[var(--gold-accent)]">{bodyProfile.twinId || 'VY-NIG-782'}</span>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono-luxury uppercase tracking-wider font-bold transition-all shrink-0 ${
            activeTab === 'orders'
              ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Order History ({effectiveOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('body_twin')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono-luxury uppercase tracking-wider font-bold transition-all shrink-0 ${
            activeTab === 'body_twin'
              ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Scissors className="h-4 w-4" />
          <span>Bespoke Sizing & Fit</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono-luxury uppercase tracking-wider font-bold transition-all shrink-0 relative ${
            activeTab === 'notifications'
              ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono-luxury uppercase tracking-wider font-bold transition-all shrink-0 ${
            activeTab === 'profile'
              ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Account & Delivery Details</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono-luxury uppercase tracking-wider font-bold transition-all shrink-0 ${
            activeTab === 'settings'
              ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Settings & Support</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ORDER HISTORY & RATINGS */}
      {/* ======================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Your Orders & Delivery Status
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-1">
              Direct doorstep deliveries dispatched by each verified boutique and brand across Nigeria.
            </p>
          </div>

          <div className="space-y-6">
            {liveOrders.length === 0 ? (
              <div className="p-16 rounded-3xl surface-card text-center space-y-4 border border-[var(--border-subtle)]">
                <Package className="h-10 w-10 text-[var(--gold-accent)] mx-auto opacity-70" />
                <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
                  No Orders Yet
                </h3>
                <p className="text-xs font-mono-luxury text-[var(--text-secondary)] max-w-sm mx-auto">
                  You have not placed any orders yet. Discover boutique apparel, shoes, bags & jewelry drops on the shop.
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase font-bold hover:opacity-90 transition-all shadow-md mt-2"
                >
                  <span>Explore Shop Catalog</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : liveOrders.map((order: any) => (
              <div
                key={order.id}
                className="p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-6 shadow-lg"
              >
                {/* Order Top Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono-luxury font-bold text-[var(--gold-accent)]">
                        {order.orderNumber}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono-luxury font-bold capitalize">
                        {(order.status || 'Escrow Secured').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] font-mono-luxury mt-1">
                      Ordered on {order.date} · Destination: {order.deliveryAddress}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {order.status?.toLowerCase() !== 'delivered' && (order.trackingStage ?? 1) < 4 ? (
                      <Link
                        href={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}`}
                        className="px-4 py-2 rounded-full surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-xs font-mono-luxury font-bold uppercase transition-all inline-flex items-center gap-1.5"
                      >
                        <Truck className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                        <span>Track Order</span>
                      </Link>
                    ) : (
                      <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono-luxury font-bold uppercase flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" />
                        <span>Delivered</span>
                      </span>
                    )}

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase block">Total Amount</span>
                      <span className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
                        ₦{order.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Driver / Courier Contact (If Dispatched) */}
                {order.trackingStage >= 3 && (order.trackingDetails?.driverPhone || order.trackingDetails?.waybillNumber) && (
                  <div className="p-3.5 rounded-2xl bg-[var(--gold-subtle)]/40 border border-[var(--gold-accent)]/30 flex items-center justify-between text-xs font-mono-luxury text-[var(--text-primary)] flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-[var(--gold-accent)] shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[var(--gold-accent)] block">Dispatched With Courier</span>
                        {order.trackingDetails?.driverPhone && (
                          <span className="font-bold">Driver: {order.trackingDetails.driverPhone}</span>
                        )}
                        {order.trackingDetails?.waybillNumber && (
                          <span className="text-[11px] text-[var(--text-secondary)] ml-2">Waybill: {order.trackingDetails.waybillNumber}</span>
                        )}
                      </div>
                    </div>

                    {order.trackingDetails?.driverPhone && (
                      <a
                        href={`tel:${order.trackingDetails.driverPhone}`}
                        className="px-3.5 py-1.5 rounded-full bg-[var(--gold-accent)] text-black font-bold uppercase text-[11px] hover:bg-[#d8b357] transition-all flex items-center gap-1.5"
                      >
                        <Phone className="h-3 w-3 text-black" />
                        <span>Call Driver</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Garments in this Order */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {order.items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center gap-3.5"
                    >
                      <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-[var(--bg-secondary)] shrink-0">
                        <Image src={item.imageUrl} alt={item.productName} fill unoptimized className="object-cover" />
                      </div>
                      <div className="truncate">
                        <span className="text-[10px] font-mono-luxury text-[var(--gold-accent)] font-bold block truncate">
                          {item.vendorName}
                        </span>
                        <h4 className="font-bold text-xs text-[var(--text-primary)] truncate">
                          {item.productName}
                        </h4>
                        <div className="text-xs font-mono-luxury text-[var(--text-secondary)] mt-0.5">
                          Size: {item.size} · ₦{item.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rating & Review Section */}
                <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {order.isRated ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono-luxury font-bold text-[var(--gold-accent)]">Your Verified Fit Review:</span>
                        <div className="flex items-center text-amber-400 gap-0.5">
                          {Array.from({ length: order.rating || 5 }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] italic font-light">
                        &quot;{order.reviewComment}&quot;
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-[var(--text-primary)]">How was your order and fit?</span>
                      <p className="text-xs text-[var(--text-muted)] font-light">Rate the quality, fit and craftsmanship for the boutique & designers.</p>
                    </div>
                  )}

                  {!order.isRated && (
                    <button
                      onClick={() => setRatingModalOrder(order.id)}
                      className="px-5 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold hover:opacity-90 transition-all shadow-md flex items-center gap-1.5"
                    >
                      <Star className="h-3.5 w-3.5 fill-current text-[var(--gold-accent)]" />
                      <span>Rate & Review Fit</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: BESPOKE SIZING & MEASUREMENTS */}
      {/* ======================================================== */}
      {activeTab === 'body_twin' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Your Bespoke Sizing & Measurements Profile
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-1">
              Used by Nigerian tailors & designers to guarantee 100% precision fit on Senator sets, Agbadas, and streetwear.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* 6 Measurement Metric Cards */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase">Height</span>
                <div className="font-editorial text-2xl font-bold text-[var(--text-primary)]">{bodyProfile.heightCm} cm</div>
                <span className="text-[10px] text-emerald-500 font-mono-luxury">Calibrated</span>
              </div>

              <div className="p-5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase">Weight</span>
                <div className="font-editorial text-2xl font-bold text-[var(--text-primary)]">{bodyProfile.weightKg} kg</div>
                <span className="text-[10px] text-emerald-500 font-mono-luxury">Athletic Build</span>
              </div>

              <div className="p-5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase">Chest Circumference</span>
                <div className="font-editorial text-2xl font-bold text-[var(--gold-accent)]">{bodyProfile.chestCm} cm</div>
                <span className="text-[10px] text-emerald-500 font-mono-luxury">Zero Pull Fit</span>
              </div>

              <div className="p-5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase">Shoulder Breadth</span>
                <div className="font-editorial text-2xl font-bold text-[var(--gold-accent)]">{bodyProfile.shoulderWidthCm} cm</div>
                <span className="text-[10px] text-emerald-500 font-mono-luxury">Broad Cut</span>
              </div>

              <div className="p-5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase">Waistline</span>
                <div className="font-editorial text-2xl font-bold text-[var(--text-primary)]">{bodyProfile.waistCm} cm</div>
                <span className="text-[10px] text-emerald-500 font-mono-luxury">Tailored Inseam</span>
              </div>

              <div className="p-5 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase">Trouser Inseam</span>
                <div className="font-editorial text-2xl font-bold text-[var(--text-primary)]">{bodyProfile.inseamCm} cm</div>
                <span className="text-[10px] text-emerald-500 font-mono-luxury">Slim Break</span>
              </div>
            </div>

            {/* Right Mannequin Silhouette Card */}
            <div className="lg:col-span-4 p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4 text-center">
              <span className="text-xs font-mono-luxury uppercase tracking-wider text-[var(--gold-accent)] font-bold">
                Digital Anatomy Model
              </span>
              <div className="h-64 w-full relative flex items-center justify-center">
                <svg viewBox="0 0 200 400" className="w-full h-full text-[var(--gold-accent)]" fill="none">
                  <circle cx="100" cy="40" r="22" stroke="currentColor" strokeWidth="2" />
                  <path d="M65 85 L135 85 L125 180 L75 180 Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M75 185 L125 185 L120 360 L80 360 Z" stroke="currentColor" strokeWidth="2" />
                  <circle cx="65" cy="85" r="4" fill="currentColor" />
                  <circle cx="135" cy="85" r="4" fill="currentColor" />
                  <circle cx="100" cy="130" r="4" fill="currentColor" />
                </svg>
              </div>
              <Link
                href="/studio"
                className="w-full py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <span>Open Virtual Fitting Studio</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: NOTIFICATIONS CENTER */}
      {/* ======================================================== */}
      {activeTab === 'notifications' && (
        <div className="space-y-6 animate-fadeIn max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                Notifications & Order Updates
              </h2>
              <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-1">
                Real-time tracking notifications from Nigerian fashion houses & Ìrísí delivery network.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="space-y-3">
            {userNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markNotificationAsRead(notif.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                  notif.read
                    ? 'bg-[var(--bg-primary)] border-[var(--border-subtle)] opacity-75'
                    : 'surface-card border-[var(--gold-accent)]/50 shadow-md ring-1 ring-[var(--gold-accent)]/20'
                }`}
              >
                <div className="h-10 w-10 rounded-xl bg-[var(--gold-subtle)] text-[var(--gold-accent)] flex items-center justify-center shrink-0">
                  <Bell className="h-5 w-5" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">{notif.title}</h4>
                    <span className="text-[10px] font-mono-luxury text-[var(--text-muted)]">{notif.timestamp}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: ACCOUNT & MANDATORY MOBILE DETAILS */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl space-y-6 animate-fadeIn">
          <div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Account & Delivery Contacts
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-1">
              Your mobile phone number is shared with dispatchers for seamless Lagos & Nationwide delivery.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 rounded-3xl surface-card space-y-4 border border-[var(--border-subtle)]">
            <div>
              <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                Full Name
              </label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Mobile Phone Number (Required)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gold-accent)]" />
                  <input
                    type="tel"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="08012*****"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                Street Delivery Address
              </label>
              <input
                type="text"
                required
                value={profileForm.deliveryAddress}
                onChange={(e) => setProfileForm({ ...profileForm, deliveryAddress: e.target.value })}
                placeholder="House / flat number, street name, and landmark"
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  City / Area
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  placeholder="City or Town"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  State
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.state}
                  onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                  placeholder="State"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)]"
                />
              </div>
            </div>

            {/* Ready-to-Wear Size Preference Card */}
            <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3 pt-3">
              <div>
                <label className="block text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold">
                  Your Ready-to-Wear Preferred Size
                </label>
                <p className="text-[11px] text-[var(--text-muted)] font-mono-luxury mt-0.5">
                  Your chosen size is automatically pre-selected when viewing clothes for fast 1-click checkout.
                </p>
              </div>

              <div className="grid grid-cols-5 gap-2 font-mono-luxury text-xs">
                {(['S', 'M', 'L', 'XL', 'XXL'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => {
                      setBodyProfile({ ...bodyProfile, preferredSize: sz });
                    }}
                    className={`py-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      (bodyProfile?.preferredSize || 'M') === sz
                        ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)] shadow-md'
                        : 'surface-card border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] font-mono-luxury text-[var(--text-secondary)]">
                <span>Fit Mode: <strong>Standard Ready-to-Wear</strong></span>
                <span className="text-emerald-400 font-bold">✓ Active in Store</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold hover:opacity-90 transition-all shadow-md mt-2 cursor-pointer"
            >
              {isLoading ? 'Saving Changes...' : 'Save Account & Sizing'}
            </button>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: SETTINGS & PATRON CARE */}
      {/* ======================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
              Settings & Patron Support
            </h2>
            <p className="text-xs font-mono-luxury text-[var(--text-secondary)] mt-1">
              Manage security credentials, explore FAQs for boutiques, shoes & jewelry, rate the platform, or submit feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Change Password */}
            <div className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] flex items-center justify-center">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                  Account Password & Security
                </h3>
                <p className="text-xs font-mono-luxury text-[var(--text-secondary)] leading-relaxed">
                  Update your Supabase authentication password. Protect your account credentials and order vault.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(true)}
                className="w-full py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[var(--text-primary)] hover:text-[var(--gold-accent)] font-mono-luxury text-xs uppercase font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Change Password</span>
              </button>
            </div>

            {/* Card 2: Need Help / FAQs */}
            <div className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                  Need Help / FAQ Topics
                </h3>
                <p className="text-xs font-mono-luxury text-[var(--text-secondary)] leading-relaxed">
                  Clear answers on boutique fashion, shoe & bag specifications, escrow guarantees, courier tracking, and returns.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFaqOpen(true)}
                  className="flex-1 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury text-xs uppercase font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-sm"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Browse FAQ Topics</span>
                </button>

                <a
                  href="https://wa.me/2348120000000?text=Hello%20%C3%8Cr%C3%ADs%C3%AD%20Concierge,%20I%20need%20assistance"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
                  title="WhatsApp Concierge"
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Card 3: Rate This App */}
            <div className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[var(--gold-accent)] flex items-center justify-center">
                  <Star className="h-6 w-6 fill-current" />
                </div>
                <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                  Rate Ìrísí Experience
                </h3>
                <p className="text-xs font-mono-luxury text-[var(--text-secondary)] leading-relaxed">
                  Leave a 5-star rating for our platform experience. Your reviews empower authentic African couture designers.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsRateAppOpen(true)}
                className="w-full py-3 rounded-xl bg-[var(--gold-accent)] text-black font-mono-luxury text-xs uppercase font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-md"
              >
                <Star className="h-3.5 w-3.5 fill-black" />
                <span>Rate This App</span>
              </button>
            </div>

            {/* Card 4: Help Improve This App */}
            <div className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)]">
                  Help Improve Ìrísí
                </h3>
                <p className="text-xs font-mono-luxury text-[var(--text-secondary)] leading-relaxed">
                  Have a suggestion or found a glitch? Tell our engineering team directly so we can build a better platform for you.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsHelpImproveOpen(true)}
                className="w-full py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-purple-400/50 text-[var(--text-primary)] hover:text-purple-300 font-mono-luxury text-xs uppercase font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                <span>Send Platform Feedback</span>
              </button>
            </div>
          </div>

          {/* Quick Concierge Banner */}
          <div className="p-6 rounded-3xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/40 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold tracking-wider">
                Direct Atelier Support
              </span>
              <h4 className="font-editorial text-lg font-bold text-[var(--text-primary)]">
                Need real-time assistance with a live custom order?
              </h4>
              <p className="text-xs font-mono-luxury text-[var(--text-secondary)]">
                Our bespoke concierge is available Monday to Saturday via WhatsApp hotline.
              </p>
            </div>

            <a
              href="https://wa.me/2348120000000?text=Hello%20%C3%8Cr%C3%ADs%C3%AD%20Concierge,%20I%20need%20assistance"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-[var(--gold-accent)] text-black font-mono-luxury text-xs uppercase font-bold flex items-center gap-2 hover:brightness-110 transition-all shrink-0 cursor-pointer shadow-lg"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Chat Concierge</span>
            </a>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5-STAR RATING & REVIEW MODAL */}
      {/* ======================================================== */}
      {ratingModalOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md surface-card p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] space-y-5 shadow-2xl animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] flex items-center justify-center mx-auto">
                <Star className="h-6 w-6 fill-current" />
              </div>
              <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
                Rate Your Items & Fit
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                How accurately did this piece fit your sizing and expectations?
              </p>
            </div>

            {/* Interactive Stars */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setStarRating(star)}
                  className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                >
                  <span className={star <= starRating ? 'text-amber-400' : 'text-zinc-600'}>
                    ★
                  </span>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                Review Feedback for Ateliers
              </label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share thoughts on fabric quality, shoulder drape, and delivery..."
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setRatingModalOrder(null)}
                className="w-1/2 py-3 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase text-[var(--text-primary)] font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRatingSubmit(ratingModalOrder)}
                className="w-1/2 py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase font-bold hover:opacity-90 transition-all shadow-md"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings & Support Modals */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        userEmail={userAuth.email || profileForm.email}
      />
      <FaqHelpModal
        isOpen={isFaqOpen}
        onClose={() => setIsFaqOpen(false)}
      />
      <RateAppModal
        isOpen={isRateAppOpen}
        onClose={() => setIsRateAppOpen(false)}
        userEmail={userAuth.email || profileForm.email}
        userName={displayName}
      />
      <HelpImproveModal
        isOpen={isHelpImproveOpen}
        onClose={() => setIsHelpImproveOpen(false)}
        userEmail={userAuth.email || profileForm.email}
        userName={displayName}
      />

      </div>
    </>
  );
}
