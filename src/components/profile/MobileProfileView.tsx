'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store/useStore';
import {
  Heart, Package, Store, MapPin, Phone, ShieldCheck, LogOut,
  Check, ChevronRight, ArrowRight, ArrowLeft, Ruler, Truck,
  KeyRound, HelpCircle, Star, Lightbulb, ExternalLink, Eye,
  Sun, Moon, FileText, RotateCcw, Lock, ShoppingBag, UserMinus
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileQuickBuyDrawer from '@/components/mobile/MobileQuickBuyDrawer';
import LuxuryLoader from '@/components/common/LuxuryLoader';
import ChangePasswordModal from '@/components/profile/ChangePasswordModal';
import FaqHelpModal from '@/components/profile/FaqHelpModal';
import RateAppModal from '@/components/profile/RateAppModal';
import HelpImproveModal from '@/components/profile/HelpImproveModal';
import ShopperNotificationBell from '@/components/common/ShopperNotificationBell';
import PlusVerifiedBadge from '@/components/common/PlusVerifiedBadge';
import { getConciergeConfig, generateWhatsAppUrl } from '@/lib/config/concierge';

export default function MobileProfileView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    userAuth,
    setUserAuth,
    bodyProfile,
    setBodyProfile,
    vault,
    userOrders,
    followedVendors,
    toggleFollowVendor,
    toggleVaultItem,
    theme,
    toggleTheme,
  } = useStore();

  type ProfileTab = 'orders' | 'wishlist' | 'brands' | 'settings';
  const resolveTabFromParam = (raw: string | null): ProfileTab => {
    if (raw === 'wishlist' || raw === 'brands' || raw === 'settings' || raw === 'orders') return raw;
    return 'orders';
  };

  const [activeTab, setActiveTabState] = useState<ProfileTab>(() => resolveTabFromParam(searchParams.get('tab')));
  const [vendorDirectory, setVendorDirectory] = useState<Record<string, { id: string; slug: string; brandName: string; logoUrl: string; fallbackImage: string; city: string; state: string; isVerified: boolean; hasPaidPlus?: boolean }>>({});
  const [brokenLogos, setBrokenLogos] = useState<Record<string, boolean>>({});

  // Keep activeTab synced when navigating back to /profile?tab=settings (or any tab)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTabState(resolveTabFromParam(tabParam));
    }
  }, [searchParams]);

  const setActiveTab = (nextTab: ProfileTab) => {
    setActiveTabState(nextTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', nextTab);
      window.history.replaceState(window.history.state, "", url.pathname + url.search);
    }
  };
  const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(bodyProfile.deliveryAddress || '');
  const [city, setCity] = useState(bodyProfile.city || '');
  const [state, setState] = useState(bodyProfile.state || '');
  const [phone, setPhone] = useState(bodyProfile.phone || userAuth.phone || '');
  const [savedToast, setSavedToast] = useState(false);

  // Settings & Support Modals
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isRateAppOpen, setIsRateAppOpen] = useState(false);
  const [isHelpImproveOpen, setIsHelpImproveOpen] = useState(false);

  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // One-time cleanup: clear legacy pre-seeded fake defaults ['moji-wears', 'arike-brand'] so shoppers ONLY see brands they actually followed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const cleaned = localStorage.getItem('irisi_cleaned_default_follows_v1');
      if (!cleaned) {
        const list = Array.isArray(followedVendors) ? followedVendors : [];
        if (list.length === 2 && list.includes('moji-wears') && list.includes('arike-brand')) {
          toggleFollowVendor('moji-wears');
          toggleFollowVendor('arike-brand');
        }
        localStorage.setItem('irisi_cleaned_default_follows_v1', '1');
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch live orders from PostgreSQL
  useEffect(() => {
    async function loadOrders() {
      const userEmail = userAuth?.email || bodyProfile?.email || '';
      const userPhone = userAuth?.phone || bodyProfile?.phone || '';
      if (!userEmail && !userPhone) {
        setLiveOrders([]);
        return;
      }

      setIsLoadingOrders(true);
      try {
        let fetched: any[] = [];
        if (userEmail) {
          const res = await fetch(`/api/orders?email=${encodeURIComponent(userEmail)}`);
          const data = await res.json();
          if (data.success && Array.isArray(data.orders)) {
            fetched = data.orders;
          }
        }

        if (fetched.length === 0 && (userEmail || userPhone)) {
          const resAll = await fetch('/api/orders');
          const dataAll = await resAll.json();
          if (dataAll.success && Array.isArray(dataAll.orders)) {
            const cleanPhone = userPhone.replace(/\D/g, '');
            fetched = dataAll.orders.filter((o: any) => {
              const oEmail = (o.customerEmail || '').toLowerCase().trim();
              const oPhone = (o.customerPhone || '').replace(/\D/g, '');
              return (
                (userEmail && oEmail === userEmail.toLowerCase().trim()) ||
                (cleanPhone && cleanPhone.length >= 7 && oPhone.includes(cleanPhone))
              );
            });
          }
        }
        setLiveOrders(fetched);
      } catch (err) {
        console.error('Failed to load orders on mobile profile:', err);
      } finally {
        setIsLoadingOrders(false);
      }
    }

    loadOrders();
  }, [userAuth?.email, userAuth?.phone, bodyProfile?.email, bodyProfile?.phone]);

  // Deduplicated, user-scoped orders
  const effectiveOrders = useMemo(() => {
    const userEmail = (userAuth?.email || bodyProfile?.email || '').toLowerCase().trim();
    const userPhone = (userAuth?.phone || bodyProfile?.phone || '').replace(/\D/g, '');

    const map = new Map<string, any>();

    userOrders.forEach((o: any) => {
      const oEmail = (o.customerEmail || o.customer_email || '').toLowerCase().trim();
      const oPhone = (o.customerPhone || o.customer_phone || '').replace(/\D/g, '');
      const belongsToUser =
        !userEmail && !userPhone
          ? false
          : (userEmail && oEmail && oEmail === userEmail) ||
            (userPhone && userPhone.length >= 7 && oPhone.includes(userPhone));

      if (belongsToUser && (o.orderNumber || o.id)) {
        map.set(o.orderNumber || o.id, o);
      }
    });

    liveOrders.forEach((o: any) => {
      if (o.orderNumber || o.id) map.set(o.orderNumber || o.id, o);
    });

    return Array.from(map.values()).sort((a, b) => {
      const timeB = new Date(b.created_at || b.createdAt || b.date || 0).getTime();
      const timeA = new Date(a.created_at || a.createdAt || a.date || 0).getTime();
      return timeB - timeA;
    });
  }, [userOrders, liveOrders, userAuth?.email, bodyProfile?.email, userAuth?.phone, bodyProfile?.phone]);

  const cleanFollowedBrands = useMemo(
    () => Array.from(new Set((followedVendors || []).map((v) => String(v || '').trim()).filter(Boolean))),
    [followedVendors]
  );

  // Fetch real brand names & logos for all followed brands
  useEffect(() => {
    if (cleanFollowedBrands.length === 0) return;
    let cancelled = false;
    async function loadVendorLogos() {
      try {
        const idsParam = cleanFollowedBrands.map((id) => encodeURIComponent(id)).join(",");
        const res = await fetch(`/api/vendors/lookup?ids=${idsParam}`);
        const data = await res.json();
        if (!cancelled && data.success && data.vendors) {
          setVendorDirectory(data.vendors);
        }
      } catch {}
    }
    loadVendorLogos();
    return () => {
      cancelled = true;
    };
  }, [cleanFollowedBrands]);

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setBodyProfile({ deliveryAddress, city, state, phone });
    setIsEditingAddress(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleLogout = () => {
    setUserAuth({
      isLoggedIn: false,
      email: '',
      name: '',
      phone: '',
      gender: 'male',
      userType: 'shopper',
    });
    router.push('/');
  };

  const openWhatsAppConcierge = () => {
    const cfg = getConciergeConfig();
    const url = generateWhatsAppUrl(
      cfg.whatsappNumber,
      `Hi ÌRÍSÍ Concierge, I need assistance with my account (${userAuth.email || 'Shopper'}).`
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const displayName = userAuth.name || bodyProfile.name || (userAuth.email ? userAuth.email.split('@')[0] : 'ÌRÍSÍ Member');
  const displayInitial = displayName.trim().charAt(0).toUpperCase() || 'Ì';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-32 select-none animate-fadeIn">
      {/* 1. Native Sticky Top Header */}
      <header className="sticky top-0 z-30 h-14 px-4 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-[var(--border-subtle)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => { if (isEditingAddress) { setIsEditingAddress(false); return; } router.back(); }}
            className="h-9 w-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center justify-center active:scale-95 transition-transform shrink-0 cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-editorial text-[20px] font-normal text-[var(--text-primary)] leading-tight truncate">
            My Account
          </h1>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <ShopperNotificationBell compact />
          <button
            type="button"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] flex items-center justify-center active:scale-95 cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-zinc-500" />}
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-5">
        {savedToast && (
          <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-500 flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            <span>Delivery details saved.</span>
          </div>
        )}

        {/* 2. Signature Obsidian Member Card (Matches Vendor Portal Hero Aesthetic) */}
        <section className="relative rounded-[26px] bg-[#0D0D10] text-white p-5 overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.18)] border border-white/10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full opacity-35"
            style={{
              background: 'radial-gradient(circle, rgba(230, 195, 103, 0.45), transparent 70%)',
            }}
          />

          <div className="relative z-10 flex items-center gap-3.5">
            <div className="h-14 w-14 rounded-full bg-white/10 border border-[#E6C367]/50 flex items-center justify-center font-editorial text-2xl text-[#E6C367] shrink-0">
              {displayInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-editorial text-2xl font-normal text-white truncate leading-tight">
                  {displayName}
                </h2>
              </div>
              <p className="text-xs text-zinc-400 font-light truncate mt-0.5">
                {userAuth.email || 'Sign in to sync orders & follows'}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono-luxury text-emerald-300">
                <ShieldCheck className="h-3 w-3" />
                <span>Escrow Protected Member</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="truncate">
              Preferred Fit: <span className="text-white">{bodyProfile.preferredSize || 'M'}</span>
              {bodyProfile.city ? ` · ${bodyProfile.city}` : ''}
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="text-[10px] font-mono-luxury uppercase tracking-wider text-[#E6C367] shrink-0 cursor-pointer"
            >
              Edit Profile ›
            </button>
          </div>
        </section>

        {/* 3. Unified 3-Column Hairline KPI Strip */}
        <section className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] grid grid-cols-3 divide-x divide-[var(--border-subtle)] py-3.5">
          <button type="button" onClick={() => setActiveTab('orders')} className="px-3 text-center active:opacity-70 cursor-pointer">
            <div className="font-editorial text-2xl font-normal text-[var(--text-primary)] leading-none">
              {effectiveOrders.length}
            </div>
            <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] mt-1.5 block">
              Orders
            </span>
          </button>

          <button type="button" onClick={() => setActiveTab('wishlist')} className="px-3 text-center active:opacity-70 cursor-pointer">
            <div className="font-editorial text-2xl font-normal text-[var(--text-primary)] leading-none">
              {vault.length}
            </div>
            <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] mt-1.5 block">
              Wishlist
            </span>
          </button>

          <button type="button" onClick={() => setActiveTab('brands')} className="px-3 text-center active:opacity-70 cursor-pointer">
            <div className="font-editorial text-2xl font-normal text-[var(--gold-accent)] leading-none">
              {cleanFollowedBrands.length}
            </div>
            <span className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] mt-1.5 block">
              Following
            </span>
          </button>
        </section>

        {/* 4. Native iOS Segmented Tab Bar */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
          {[
            { id: 'orders', label: 'Orders' },
            { id: 'wishlist', label: 'Wishlist' },
            { id: 'brands', label: 'Brands' },
            { id: 'settings', label: 'Settings' },
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

        {/* ======================================================== */}
        {/* TAB 1: ORDERS */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <section className="space-y-3 animate-fadeIn">
            {isLoadingOrders && effectiveOrders.length === 0 ? (
              <LuxuryLoader fullScreen={false} label="Ì R Í S Í" sublabel="Loading your orders..." />
            ) : effectiveOrders.length === 0 ? (
              <div className="py-12 px-6 rounded-[22px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-4">
                <div className="h-14 w-14 mx-auto rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)]">
                  <Package className="h-6 w-6" strokeWidth={1.4} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-editorial text-xl font-normal text-[var(--text-primary)]">
                    No Orders Yet
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-light max-w-xs mx-auto">
                    Orders you place from verified brands appear here with live delivery tracking and escrow protection.
                  </p>
                </div>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-wider"
                >
                  <span>Explore Shop</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {effectiveOrders.map((order) => {
                  const stage = Number(
                    order.trackingStage ??
                      (order.status === 'delivered'
                        ? 4
                        : order.status === 'dispatched'
                        ? 3
                        : order.status === 'packing' || order.status === 'ready'
                        ? 2
                        : 1)
                  );
                  const statusLabel =
                    stage >= 4
                      ? 'Delivered'
                      : stage === 3
                      ? 'In Transit'
                      : stage === 2
                      ? 'Packed'
                      : 'Escrow Secured';

                  return (
                    <article
                      key={order.id || order.orderNumber}
                      className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between gap-2">
                        <div>
                          <div className="font-editorial text-base text-[var(--text-primary)]">
                            {order.orderNumber || order.id}
                          </div>
                          <span className="text-[11px] text-[var(--text-muted)] font-light">
                            {order.date || 'Recent'}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono-luxury border ${
                            stage >= 4
                              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500'
                              : stage === 3
                              ? 'bg-[var(--gold-subtle)] border-[var(--gold-accent)]/30 text-[var(--gold-accent)]'
                              : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-primary)]'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="divide-y divide-[var(--border-subtle)]">
                          {order.items.slice(0, 3).map((item: any, idx: number) => (
                            <div key={idx} className="px-4 py-2.5 flex items-center gap-3">
                              <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-zinc-900 border border-[var(--border-subtle)] shrink-0">
                                <Image
                                  src={item.imageUrl || '/images/no-product.svg'}
                                  alt={item.productName || 'Piece'}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium text-[var(--text-primary)] truncate">
                                  {item.productName || item.name || 'Piece'}
                                </div>
                                <div className="text-[11px] text-[var(--text-muted)] font-light">
                                  {item.size ? `Size ${item.size} · ` : ''}Qty {item.quantity || 1}
                                </div>
                              </div>
                              <div className="font-editorial text-sm text-[var(--text-primary)] shrink-0">
                                ₦{Number(item.price || 0).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] block">
                            Total Paid
                          </span>
                          <span className="font-editorial text-lg text-[var(--text-primary)]">
                            ₦{Number(order.totalAmount || 0).toLocaleString()}
                          </span>
                        </div>

                        <Link
                          href={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber || order.id)}`}
                          className="h-9 px-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[11px] font-mono-luxury uppercase tracking-wider inline-flex items-center gap-1.5 active:scale-95"
                        >
                          <Truck className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                          <span>{stage >= 4 ? 'Receipt' : 'Track'}</span>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 2: WISHLIST (Previously "Vault") */}
        {/* ======================================================== */}
        {activeTab === 'wishlist' && (
          <section className="space-y-3 animate-fadeIn">
            {vault.length === 0 ? (
              <div className="py-12 px-6 rounded-[22px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-4">
                <div className="h-14 w-14 mx-auto rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)]">
                  <Heart className="h-6 w-6" strokeWidth={1.4} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-editorial text-xl font-normal text-[var(--text-primary)]">
                    Your Wishlist is Empty
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-light max-w-xs mx-auto">
                    Tap the heart on any piece while browsing Shop to save it here for later.
                  </p>
                </div>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-wider"
                >
                  <span>Browse Shop</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {vault.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-[4/5] w-full bg-zinc-900">
                      <Link href={`/shop/${product.id}`} className="block w-full h-full">
                        <Image
                          src={product.imageUrl || '/images/no-product.svg'}
                          alt={product.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleVaultItem(product)}
                        className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/55 backdrop-blur-md text-rose-400 flex items-center justify-center active:scale-90 cursor-pointer"
                        aria-label="Remove from wishlist"
                      >
                        <Heart className="h-3.5 w-3.5 fill-current" />
                      </button>
                    </div>

                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-medium text-[var(--text-primary)] line-clamp-1">
                          {product.name}
                        </div>
                        <div className="font-editorial text-base text-[var(--text-primary)] mt-0.5">
                          ₦{Number(product.price || 0).toLocaleString()}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <Link
                          href={`/shop/${product.id}`}
                          className="h-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[10px] font-mono-luxury text-[var(--text-primary)] flex items-center justify-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setQuickBuyProduct(product)}
                          className="h-8 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] font-mono-luxury flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ShoppingBag className="h-3 w-3" />
                          <span>Bag</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 3: FOLLOWED BRANDS (Strictly Vendors Actually Followed!) */}
        {/* ======================================================== */}
        {activeTab === 'brands' && (
          <section className="space-y-3 animate-fadeIn">
            {cleanFollowedBrands.length === 0 ? (
              <div className="py-12 px-6 rounded-[22px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-4">
                <div className="h-14 w-14 mx-auto rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)]">
                  <Store className="h-6 w-6" strokeWidth={1.4} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-editorial text-xl font-normal text-[var(--text-primary)]">
                    No Followed Brands Yet
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-light max-w-xs mx-auto">
                    Tap Follow on any brand or 24h story on Shop to receive instant alerts when they post new drops.
                  </p>
                </div>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-wider"
                >
                  <span>Discover Brands</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
                {cleanFollowedBrands.map((vId) => {
                  const meta = vendorDirectory[vId] || vendorDirectory[vId.toLowerCase()];
                  const displayBrand = meta?.brandName || vId.replace(/-/g, ' ');
                  const initial = displayBrand.trim().charAt(0).toUpperCase() || 'B';
                  const logoSrc = !brokenLogos[vId] ? (meta?.logoUrl || meta?.fallbackImage || "") : "";
                  const locationLine = [meta?.city, meta?.state].filter(Boolean).join(", ");
                  return (
                    <div
                      key={vId}
                      className="px-4 py-3.5 flex items-center justify-between gap-3"
                    >
                      <Link
                        href={`/brand/${encodeURIComponent(meta?.slug || vId)}`}
                        className="flex items-center gap-3 min-w-0 flex-1 active:opacity-75"
                      >
                        <div className="relative h-11 w-11 rounded-full bg-[var(--bg-primary)] border border-[var(--gold-accent)]/40 text-[var(--gold-accent)] flex items-center justify-center font-editorial text-lg shrink-0 overflow-hidden">
                          {logoSrc ? (
                            <img
                              src={logoSrc}
                              alt={displayBrand}
                              onError={() => setBrokenLogos((prev) => ({ ...prev, [vId]: true }))}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{initial}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-[13.5px] font-medium text-[var(--text-primary)] capitalize truncate">
                              {displayBrand}
                            </span>
                            {meta?.hasPaidPlus && <PlusVerifiedBadge variant="icon" />}
                          </div>
                          <span className="text-[10px] font-mono-luxury text-emerald-500 truncate block">
                            {locationLine ? `Following · ${locationLine}` : "Following · Alerts Active"}
                          </span>
                        </div>
                      </Link>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link
                          href={`/brand/${encodeURIComponent(vId)}`}
                          className="h-8 px-3 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[10px] font-mono-luxury text-[var(--text-primary)] inline-flex items-center"
                        >
                          Visit
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleFollowVendor(vId)}
                          className="h-8 w-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center cursor-pointer"
                          aria-label={`Unfollow ${displayBrand}`}
                          title="Unfollow brand"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 4: SETTINGS & PREFERENCES (Quiet-Luxury Monochrome iOS Lists) */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <section className="space-y-5 animate-fadeIn">
            {/* Group 1: Sizing & Delivery */}
            <div className="space-y-2">
              <div className="px-1 text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Fit &amp; Delivery
              </div>
              <div className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
                {/* Preferred Size */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-primary)]">
                      <Ruler className="h-4 w-4 text-[var(--gold-accent)]" strokeWidth={1.65} />
                      <span>Preferred Garment Size</span>
                    </div>
                    <span className="text-[11px] font-mono-luxury text-[var(--gold-accent)]">
                      {bodyProfile.preferredSize || 'M'}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {(['S', 'M', 'L', 'XL', 'XXL'] as const).map((sz) => {
                      const active = (bodyProfile.preferredSize || 'M') === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setBodyProfile({ preferredSize: sz })}
                          className={`h-9 rounded-xl text-xs font-mono-luxury transition-all cursor-pointer ${
                            active
                              ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                              : 'bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-primary)]">
                      <MapPin className="h-4 w-4 text-[var(--gold-accent)]" strokeWidth={1.65} />
                      <span>Default Delivery Address</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress((v) => !v)}
                      className="text-[11px] font-mono-luxury text-[var(--gold-accent)] cursor-pointer"
                    >
                      {isEditingAddress ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  {isEditingAddress ? (
                    <form onSubmit={handleSaveAddress} className="space-y-2.5 pt-1">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Phone number for courier"
                        className="w-full h-10 px-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City / Area"
                          className="w-full h-10 px-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                        />
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="State / Region"
                          className="w-full h-10 px-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Street address & landmark"
                        className="w-full h-10 px-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="w-full h-10 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-wider cursor-pointer"
                      >
                        Save Address
                      </button>
                    </form>
                  ) : (
                    <div className="text-xs text-[var(--text-secondary)] font-light space-y-0.5 pl-6">
                      <p className="text-[var(--text-primary)]">
                        {bodyProfile.deliveryAddress || 'No street address saved yet'}
                      </p>
                      {(bodyProfile.city || bodyProfile.state || bodyProfile.phone) && (
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {[bodyProfile.city, bodyProfile.state, bodyProfile.phone].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Group 2: Account & Preferences */}
            <div className="space-y-2">
              <div className="px-1 text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Account &amp; Appearance
              </div>
              <div className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {theme === 'dark' ? (
                      <Sun className="h-[18px] w-[18px] text-[var(--text-primary)] shrink-0" strokeWidth={1.6} />
                    ) : (
                      <Moon className="h-[18px] w-[18px] text-[var(--text-primary)] shrink-0" strokeWidth={1.6} />
                    )}
                    <div className="min-w-0">
                      <div className="text-[13px] text-[var(--text-primary)]">Appearance</div>
                      <p className="text-[11px] text-[var(--text-muted)] font-light">
                        Currently {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono-luxury text-[var(--gold-accent)] shrink-0">Switch</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <KeyRound className="h-[18px] w-[18px] text-[var(--text-primary)] shrink-0" strokeWidth={1.6} />
                    <div className="min-w-0">
                      <div className="text-[13px] text-[var(--text-primary)]">Change Password</div>
                      <p className="text-[11px] text-[var(--text-muted)] font-light">
                        Update your account password securely
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)]/70 shrink-0" />
                </button>

                {userAuth.userType === 'vendor' && (
                  <Link
                    href="/vendor-portal"
                    className="px-4 py-3.5 flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Store className="h-[18px] w-[18px] text-[var(--gold-accent)] shrink-0" strokeWidth={1.6} />
                      <div className="min-w-0">
                        <div className="text-[13px] text-[var(--text-primary)]">Open Vendor Studio</div>
                        <p className="text-[11px] text-[var(--text-muted)] font-light">
                          Manage your storefront, stories &amp; orders
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[var(--text-muted)]/70 shrink-0" />
                  </Link>
                )}
              </div>
            </div>

            {/* Group 3: Support, Feedback & Legal */}
            <div className="space-y-2">
              <div className="px-1 text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Support &amp; Policies
              </div>
              <div className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsFaqOpen(true)}
                  className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <HelpCircle className="h-[18px] w-[18px] text-[var(--text-primary)] shrink-0" strokeWidth={1.6} />
                    <div className="min-w-0">
                      <div className="text-[13px] text-[var(--text-primary)]">Help &amp; FAQ</div>
                      <p className="text-[11px] text-[var(--text-muted)] font-light">
                        Escrow protection, delivery &amp; sizing answers
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)]/70 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={openWhatsAppConcierge}
                  className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Phone className="h-[18px] w-[18px] text-[var(--text-primary)] shrink-0" strokeWidth={1.6} />
                    <div className="min-w-0">
                      <div className="text-[13px] text-[var(--text-primary)]">WhatsApp Concierge</div>
                      <p className="text-[11px] text-[var(--text-muted)] font-light">
                        Chat directly with our support team
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsRateAppOpen(true)}
                  className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Star className="h-[18px] w-[18px] text-[var(--text-primary)] shrink-0" strokeWidth={1.6} />
                    <div className="min-w-0">
                      <div className="text-[13px] text-[var(--text-primary)]">Rate ÌRÍSÍ</div>
                      <p className="text-[11px] text-[var(--text-muted)] font-light">
                        Share your shopping experience
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)]/70 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsHelpImproveOpen(true)}
                  className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Lightbulb className="h-[18px] w-[18px] text-[var(--text-primary)] shrink-0" strokeWidth={1.6} />
                    <div className="min-w-0">
                      <div className="text-[13px] text-[var(--text-primary)]">Share Feedback</div>
                      <p className="text-[11px] text-[var(--text-muted)] font-light">
                        Suggest features or report an issue
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)]/70 shrink-0" />
                </button>

                <Link
                  href="/returns?from=settings"
                  className="px-4 py-3.5 flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <RotateCcw className="h-[18px] w-[18px] text-[var(--text-primary)] shrink-0" strokeWidth={1.6} />
                    <span className="text-[13px] text-[var(--text-primary)]">Return &amp; Escrow Policy</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)]/70 shrink-0" />
                </Link>

                <Link
                  href="/terms?from=settings"
                  className="px-4 py-3.5 flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-[18px] w-[18px] text-[var(--text-primary)] shrink-0" strokeWidth={1.6} />
                    <span className="text-[13px] text-[var(--text-primary)]">Terms &amp; Conditions</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)]/70 shrink-0" />
                </Link>

                <Link
                  href="/privacy?from=settings"
                  className="px-4 py-3.5 flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Lock className="h-[18px] w-[18px] text-[var(--text-primary)] shrink-0" strokeWidth={1.6} />
                    <span className="text-[13px] text-[var(--text-primary)]">Privacy Policy</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)]/70 shrink-0" />
                </Link>
              </div>
            </div>

            {/* Clean Sign Out Row */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-rose-500 text-xs font-mono-luxury uppercase tracking-wider flex items-center justify-center gap-2 active:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </section>
        )}
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        userEmail={userAuth.email || bodyProfile.email || ''}
      />
      <FaqHelpModal isOpen={isFaqOpen} onClose={() => setIsFaqOpen(false)} />
      <RateAppModal
        isOpen={isRateAppOpen}
        onClose={() => setIsRateAppOpen(false)}
        userEmail={userAuth.email}
        userName={userAuth.name}
      />
      <HelpImproveModal
        isOpen={isHelpImproveOpen}
        onClose={() => setIsHelpImproveOpen(false)}
        userEmail={userAuth.email}
        userName={userAuth.name}
      />
      {quickBuyProduct && (
        <MobileQuickBuyDrawer
          product={quickBuyProduct}
          onClose={() => setQuickBuyProduct(null)}
        />
      )}
    </div>
  );
}
