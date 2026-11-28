'use client';

import { vendorFetch, getActiveVendorId } from '@/lib/services/apiClient';
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/lib/store/useStore';
import { supabase } from '@/lib/supabase/client';
import {
  LayoutDashboard, UploadCloud, PackageCheck, BarChart3,
  Building, MessageSquare, DollarSign, LogOut, Sun, Moon,
  ExternalLink, Sparkles, ShoppingBag, Scissors, Star, X,
  Gem, Footprints, Shirt, Crown, Plus, Grid2X2,
  ChevronRight, ChevronLeft, Camera, Share2, Users
} from 'lucide-react';
import VendorNotificationBell from '@/components/vendor/VendorNotificationBell';
import VendorTourGuide from '@/components/vendor/VendorTourGuide';
import ShareStoreSheet from '@/components/vendor/ShareStoreSheet';
import VendorLuxuryLoader from '@/components/vendor/VendorLuxuryLoader';
import { useBodyScrollLock } from '@/lib/utils/useBodyScrollLock';
import { getVendorCache, getVendorCacheAgeMs, setVendorCache, clearVendorCache, hydrateVendorCacheFromSession } from '@/lib/cache/vendorPortalCache';
import { isBoutiqueVendor, getVendorSpecialty, getVendorSpecialtyInfo } from '@/types';

const STUDIO_SUB_ROUTES: Array<{ prefix: string; title: string }> = [
  { prefix: '/vendor-portal/stories', title: 'Lookbook Stories' },
  { prefix: '/vendor-portal/audience', title: 'Followers & VIPs' },
  { prefix: '/vendor-portal/plus', title: 'ÌRÍSÍ Plus' },
  { prefix: '/vendor-portal/settlements', title: 'Payouts & Bank' },
  { prefix: '/vendor-portal/reports', title: 'Analytics' },
  { prefix: '/vendor-portal/direct-sales', title: 'Direct POS' },
  { prefix: '/vendor-portal/reviews', title: 'Client Reviews' },
  { prefix: '/vendor-portal/atelier', title: 'Store Profile' },
];

export default function VendorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    vendorLogout,
    isVendorLoggedIn,
    setIsVendorLoggedIn,
    vendorProfile,
    setVendorProfile,
    theme,
    toggleTheme,
  } = useStore();

  const [authState, setAuthState] = useState<'checking' | 'authorized' | 'redirecting'>(() =>
    pathname === '/vendor-portal/auth' ? 'authorized' : 'checking'
  );

  const [liveStatus, setLiveStatus] = useState<{
    isVerified: boolean;
    approvalStatus: string;
  }>(() => {
    const cached = getVendorCache<{ isVerified: boolean; approvalStatus: string }>('global', 'layout_status');
    return cached || { isVerified: false, approvalStatus: 'pending' };
  });

  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [livePlan, setLivePlan] = useState<{
    freeLaunchMode: boolean;
    isPlus: boolean;
    effectiveCommissionPercent: number;
    publishedProductCount: number;
    productLimit: number | null;
    plusMonthlyPriceNgn: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    hydrateVendorCacheFromSession();
    const cached = getVendorCache<{ isVerified: boolean; approvalStatus: string }>('global', 'layout_status');
    if (cached) setLiveStatus(cached);
  }, []);

  useEffect(() => {
    setIsQuickCreateOpen(false);
  }, [pathname]);

  useBodyScrollLock(isQuickCreateOpen);

  const checkVendorStatus = useCallback(async (force = false) => {
    const storedVendorId = getActiveVendorId();
    // If cached recently AND we actually have a stored vendor ID & real brand name, trust cache briefly
    if (
      !force &&
      storedVendorId &&
      vendorProfile?.id &&
      vendorProfile?.brandName &&
      vendorProfile.brandName !== 'My Brand' &&
      getVendorCacheAgeMs(storedVendorId, 'layout_status') < 90_000
    ) {
      setAuthState('authorized');
      return;
    }
    try {
      const res = await vendorFetch('/api/vendor/profile');
      const data = await res.json().catch(() => ({}));

      if (res.status === 403 || data.isSuspended || data.approvalStatus === 'suspended') {
        const reason = encodeURIComponent(data.suspensionReason || data.error || 'Account suspended by administration.');
        clearVendorCache();
        vendorLogout();
        setAuthState('redirecting');
        router.replace(`/vendor-portal/auth?suspended=true&reason=${reason}`);
        return;
      }

      if (res.status === 401 || res.status === 404 || !res.ok || !data.success || !data.vendor || !data.vendor.id) {
        clearVendorCache();
        vendorLogout();
        setAuthState('redirecting');
        router.replace('/vendor-portal/auth');
        return;
      }

      const v = data.vendor;
      const verified = !!v.is_verified || !!v.isVerified;
      const statusObj = {
        isVerified: verified,
        approvalStatus: verified ? 'approved' : (v.approvalStatus || 'pending'),
      };
      setLiveStatus(statusObj);
      setVendorCache('global', 'layout_status', statusObj);
      setVendorCache(v.id, 'layout_status', statusObj);

      if (typeof window !== 'undefined' && v.id) {
        localStorage.setItem('irisi_vendor_id', v.id);
        localStorage.setItem('veyra_vendor_id', v.id);
        if (v.email) {
          localStorage.setItem('irisi_vendor_email', v.email);
          localStorage.setItem('veyra_vendor_email', v.email);
        }
      }

      setVendorCache(v.id, 'profile_raw', v);

      const normalizedType = isBoutiqueVendor(v) ? 'boutique_seller' : 'fashion_designer';
      const rawSpec = v.specialty || v.vendorSpecialty || (normalizedType === 'fashion_designer' ? 'native_tailoring' : 'streetwear');
      const spec = rawSpec === 'apparel' ? 'streetwear' : rawSpec === 'jewelry' ? 'accessories' : rawSpec;
      setIsVendorLoggedIn(true);
      setVendorProfile({
        id: v.id || '',
        brandName: v.brandName || v.brand_name || 'Your Brand',
        designerName: v.designerName || v.designer_name || v.contact_person || 'Manager',
        contactPerson: v.contactPerson || v.contact_person || v.designerName || v.designer_name || '',
        email: v.email || '',
        phone: v.phone || '',
        location: v.location || (v.city && v.state ? `${v.city}, ${v.state}` : '') || '',
        vendorType: normalizedType,
        specialty: spec,
        vendorSpecialty: spec,
        bankName: v.bankName || v.bank_name || '',
        accountNumber: v.accountNumber || v.account_number || '',
        accountName: v.accountName || v.account_name || '',
        instagram: v.instagram || '',
        bio: v.bio || '',
        logoUrl: v.logoUrl || v.logo || '',
      });
      setAuthState('authorized');
    } catch {
      if (!storedVendorId) {
        clearVendorCache();
        vendorLogout();
        setAuthState('redirecting');
        router.replace('/vendor-portal/auth');
      } else {
        setAuthState('authorized');
      }
    }
  }, [setVendorProfile, setIsVendorLoggedIn, vendorLogout, router, vendorProfile?.id, vendorProfile?.brandName]);

  // Verify live vendor session immediately whenever entering /vendor-portal (prevents placeholder "My Brand" access!)
  useEffect(() => {
    if (pathname === '/vendor-portal/auth') {
      setAuthState('authorized');
      return;
    }
    const storedVendorId = getActiveVendorId();
    if (!storedVendorId && !isVendorLoggedIn) {
      setAuthState('checking');
    }
    checkVendorStatus(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Fetch live billing & plan status (Free Launch Trial vs Free Plan vs ÌRÍSÍ Plus) so vendors always know their tier
  useEffect(() => {
    if (pathname === '/vendor-portal/auth') return;
    let active = true;
    const vKey = vendorProfile.id || getActiveVendorId() || vendorProfile.email || "";
    const qs = vKey ? `?vendorId=${encodeURIComponent(vKey)}` : "";
    fetch(`/api/vendor/subscription${qs}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data?.success || !data?.billing) return;
        const b = data.billing;
        const vp = data.vendorPlan;
        setLivePlan({
          freeLaunchMode: Boolean(b.freeLaunchMode),
          isPlus: Boolean(vp?.isPlus),
          effectiveCommissionPercent: Number(vp?.effectiveCommissionPercent ?? (b.freeLaunchMode ? 0 : b.freeTierCommissionPercent ?? 8)),
          publishedProductCount: Number(vp?.publishedProductCount ?? 0),
          productLimit: vp?.productLimit ?? (b.freeLaunchMode ? null : Number(b.freeTierProductLimit ?? 12)),
          plusMonthlyPriceNgn: Number(b.plusMonthlyPriceNgn ?? 5000),
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [vendorProfile.id, vendorProfile.email, pathname]);

  useEffect(() => {
    if (pathname === '/vendor-portal/auth') return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      const chanId = `vendor-live-status-sync-${Math.random().toString(36).slice(2, 8)}`;
      channel = supabase
        .channel(chanId)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'vendors' },
          (payload) => {
            const updated = payload.new as any;
            if (
              !vendorProfile.email ||
              !updated.email ||
              updated.email.toLowerCase() === vendorProfile.email.toLowerCase()
            ) {
              checkVendorStatus(true);
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Vendor status realtime subscription skipped:', err);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, [vendorProfile.email, checkVendorStatus, pathname]);

  if (pathname === '/vendor-portal/auth') {
    return <>{children}</>;
  }

  if (authState !== 'authorized') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
        <VendorLuxuryLoader
          label={authState === 'redirecting' ? 'Redirecting to Seller Sign-In...' : 'Verifying Seller Session...'}
        />
      </div>
    );
  }

  const isBoutique = isBoutiqueVendor(vendorProfile);
  const specialty = getVendorSpecialty(vendorProfile);
  const specialtyInfo = getVendorSpecialtyInfo(specialty, isBoutique);
  const storeSlug = encodeURIComponent(vendorProfile.id || vendorProfile.brandName || 'store');
  const storeUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/brand/${storeSlug}`
      : `https://irisimi.ng/brand/${storeSlug}`;
  const brandInitial = (vendorProfile.brandName || 'I').trim().charAt(0).toUpperCase();

  const planShortLabel = !livePlan
    ? 'Studio'
    : livePlan.freeLaunchMode
    ? 'Free Trial · 0%'
    : livePlan.isPlus
    ? `ÌRÍSÍ Plus · ${livePlan.effectiveCommissionPercent}%`
    : `Free Plan · ${livePlan.effectiveCommissionPercent}%`;
  const activeStudioSubRoute = STUDIO_SUB_ROUTES.find((r) => pathname.startsWith(r.prefix)) || null;
  const isStudioTabActive = pathname === '/vendor-portal/studio' || Boolean(activeStudioSubRoute);

  const navItems = [
    {
      id: 'tour-nav-overview',
      label: 'Overview',
      href: '/vendor-portal',
      icon: LayoutDashboard,
      active: pathname === '/vendor-portal',
    },
    {
      id: 'tour-nav-products',
      label: 'Catalog & Stock',
      href: '/vendor-portal/products',
      icon: ShoppingBag,
      active: pathname.startsWith('/vendor-portal/products'),
    },
    {
      id: 'tour-nav-publish',
      label: specialtyInfo.publishLabel || 'Add Drop',
      href: '/vendor-portal/publish',
      icon: UploadCloud,
      active: pathname === '/vendor-portal/publish',
    },
    {
      id: 'tour-nav-stories',
      label: 'Post Drop Story',
      href: '/vendor-portal/stories',
      icon: Sparkles,
      active: pathname === '/vendor-portal/stories',
    },
    {
      id: 'tour-nav-audience',
      label: 'Followers & VIPs',
      href: '/vendor-portal/audience',
      icon: Users,
      active: pathname === '/vendor-portal/audience',
    },
    {
      id: 'tour-nav-orders',
      label: 'Orders',
      href: '/vendor-portal/orders',
      icon: PackageCheck,
      active: pathname === '/vendor-portal/orders',
    },
    {
      id: 'tour-nav-reports',
      label: 'Reports & Sales',
      href: '/vendor-portal/reports',
      icon: BarChart3,
      active: pathname === '/vendor-portal/reports',
    },
    {
      id: 'tour-nav-atelier',
      label: 'Store Profile',
      href: '/vendor-portal/atelier',
      icon: Building,
      active: pathname === '/vendor-portal/atelier',
    },
    {
      id: 'tour-nav-direct-sales',
      label: 'Direct Sales Assistant',
      href: '/vendor-portal/direct-sales',
      icon: MessageSquare,
      active: pathname === '/vendor-portal/direct-sales',
    },
    {
      id: 'tour-nav-settlements',
      label: 'Settlements & Banking',
      href: '/vendor-portal/settlements',
      icon: DollarSign,
      active: pathname === '/vendor-portal/settlements',
    },
    {
      id: 'tour-nav-plus',
      label: 'ÌRÍSÍ Plus & Plan',
      href: '/vendor-portal/plus',
      icon: Crown,
      active: pathname === '/vendor-portal/plus',
    },
    {
      label: 'Client Reviews & Ratings',
      href: '/vendor-portal/reviews',
      icon: Star,
      active: pathname === '/vendor-portal/reviews',
    },
  ];

  const handleLogout = () => {
    clearVendorCache();
    vendorLogout();
    router.push('/vendor-portal/auth');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors flex flex-col">
      {/* ======================================================== */}
      {/* 1A. MOBILE NATIVE APP TOP HEADER (< md) */}
      {/* ======================================================== */}
      <header className="md:hidden sticky top-0 z-30 h-14 px-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-xl flex items-center justify-between gap-3">
        {/* Left: Native "← Studio" Back Pill on Studio sub-pages, OR Brand Identity on root tabs */}
        {activeStudioSubRoute ? (
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Link
              href="/vendor-portal/studio"
              className="inline-flex items-center gap-1 pr-2.5 pl-1.5 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono-luxury text-[var(--text-primary)] active:scale-95 transition-transform shrink-0"
              aria-label="Back to Studio menu"
            >
              <ChevronLeft className="h-4 w-4 text-[var(--gold-accent)]" />
              <span>Studio</span>
            </Link>
            <span className="font-editorial text-[17px] font-normal text-[var(--text-primary)] truncate">
              {activeStudioSubRoute.title}
            </span>
          </div>
        ) : (
          <Link
            href="/vendor-portal/atelier"
            className="flex items-center gap-2.5 min-w-0 flex-1 active:opacity-80 transition-opacity"
          >
            <div className="relative h-9 w-9 rounded-full overflow-hidden border border-[var(--gold-accent)]/40 bg-[var(--gold-subtle)] flex items-center justify-center shrink-0">
              {vendorProfile.logoUrl ? (
                <Image
                  src={vendorProfile.logoUrl}
                  alt={vendorProfile.brandName}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <span className="font-editorial text-base text-[var(--gold-accent)]">
                  {brandInitial}
                </span>
              )}
              <span
                className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-[var(--bg-primary)] ${
                  liveStatus.isVerified
                    ? 'bg-emerald-500'
                    : liveStatus.approvalStatus === 'rejected'
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
            </div>

            <div className="min-w-0">
              <div className="font-editorial text-[17px] font-normal text-[var(--text-primary)] truncate leading-tight">
                {vendorProfile.brandName || 'Your Brand'}
              </div>
              <div className="text-[10px] font-mono-luxury text-[var(--text-muted)] truncate leading-tight flex items-center gap-1">
                <span>{liveStatus.isVerified ? 'Verified Seller' : 'Pending Review'}</span>
                <span>·</span>
                <span className={livePlan && !livePlan.freeLaunchMode && !livePlan.isPlus ? "text-amber-500" : "text-[var(--gold-accent)]"}>{planShortLabel}</span>
              </div>
            </div>
          </Link>
        )}

        {/* Right: Share Store + Theme Toggle + Notifications */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="h-9 w-9 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--gold-accent)] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            aria-label="Share your storefront link"
            title="Share Storefront Link"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            suppressHydrationWarning
            className="h-9 w-9 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            aria-label="Toggle color theme"
          >
            {mounted ? (
              theme === 'dark' ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-zinc-500" />
            ) : (
              <div className="h-4 w-4" />
            )}
          </button>

          <VendorNotificationBell />
        </div>
      </header>

      {/* ======================================================== */}
      {/* 1B. DESKTOP TOP HEADER (md+) */}
      {/* ======================================================== */}
      <header className="hidden md:flex sticky top-0 z-30 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-md px-10 py-3.5 items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/vendor-portal" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-sm border border-black/15 dark:border-white/15 shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src="/images/logo/irisi-icon.png"
                alt="ÌRÍSÍ Logo"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-[10px] font-mono-luxury uppercase border border-[var(--gold-accent)]/20">
              {specialtyInfo.badge}
            </span>
          </Link>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-mono-luxury truncate">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                liveStatus.isVerified
                  ? 'bg-emerald-500 animate-pulse'
                  : liveStatus.approvalStatus === 'rejected'
                  ? 'bg-rose-500'
                  : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span className="font-medium text-[var(--text-primary)] truncate max-w-[180px]">
              {vendorProfile.brandName}
            </span>
          </div>

          {livePlan && (
            <Link
              href="/vendor-portal/plus"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono-luxury uppercase tracking-wider border transition-colors shrink-0 ${
                livePlan.freeLaunchMode
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : livePlan.isPlus
                  ? 'bg-[var(--gold-subtle)] border-[var(--gold-accent)]/40 text-[var(--gold-accent)]'
                  : 'bg-amber-500/10 border-amber-500/35 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15'
              }`}
              title="View your current plan & commission rate"
            >
              <Crown className="h-3 w-3 shrink-0" />
              <span>
                {livePlan.freeLaunchMode
                  ? 'Free Launch Trial · 0% Fee'
                  : livePlan.isPlus
                  ? `ÌRÍSÍ Plus · ${livePlan.effectiveCommissionPercent}% Fee`
                  : `Free Plan · ${livePlan.effectiveCommissionPercent}% Fee · Upgrade`}
              </span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowTour(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--gold-subtle)] hover:bg-[var(--gold-accent)]/20 border border-[var(--gold-accent)]/40 text-xs font-mono-luxury uppercase text-[var(--gold-accent)] transition-all cursor-pointer shadow-sm"
            title="Take interactive tour"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Tour Guide</span>
          </button>

          <VendorNotificationBell />

          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase text-[var(--text-primary)] transition-all cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
            <span>Share Store</span>
          </button>

          <Link
            href={`/brand/${storeSlug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase text-[var(--text-primary)] transition-all"
          >
            <span>{isBoutique ? 'View Boutique' : 'View Atelier'}</span>
            <ExternalLink className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
          </Link>

          <button
            onClick={toggleTheme}
            suppressHydrationWarning
            className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
            title="Toggle theme"
            aria-label="Toggle color theme"
          >
            {mounted ? (
              theme === 'dark' ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-zinc-400" />
            ) : (
              <div className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={handleLogout}
            className="flex p-2 rounded-xl border border-[var(--border-subtle)] hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-all cursor-pointer"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. BODY LAYOUT (DESKTOP SIDEBAR + ACTIVE PAGE CONTENT) */}
      {/* ======================================================== */}
      <div className="flex-1 flex">
        <aside className="hidden md:flex w-72 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] flex-col justify-between p-6 shrink-0 sticky top-[60px] h-[calc(100vh-60px)] self-start overflow-y-auto">
          <div className="space-y-5">
            <div className="p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--gold-accent)]/15 text-[var(--gold-accent)] flex items-center justify-center font-editorial text-lg shrink-0">
                  {specialty === 'perfume' ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 2h4v3h-4z" />
                      <path d="M12 5v2" />
                      <path d="M14 3.5h3" />
                      <rect x="6" y="7" width="12" height="14" rx="3" />
                      <path d="M9 12h6" />
                    </svg>
                  ) : specialty === 'wigs' || specialty === 'caps' ? (
                    <Crown className="h-5 w-5" />
                  ) : specialty === 'accessories' ? (
                    <Sparkles className="h-5 w-5" />
                  ) : specialty === 'jewelry' ? (
                    <Gem className="h-5 w-5" />
                  ) : specialty === 'footwear' ? (
                    <Footprints className="h-5 w-5" />
                  ) : specialty === 'native_tailoring' ? (
                    <Scissors className="h-5 w-5" />
                  ) : specialty === 'streetwear' || specialty === 'apparel' ? (
                    <Shirt className="h-5 w-5" />
                  ) : isBoutique ? (
                    <ShoppingBag className="h-5 w-5" />
                  ) : (
                    <Scissors className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-[var(--text-primary)] truncate font-editorial">
                    {vendorProfile.brandName}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono-luxury truncate">
                    {vendorProfile.location || 'Location not set'}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono-luxury">
                <span className="text-[var(--text-muted)]">Type:</span>
                <span className="text-[var(--gold-accent)] truncate">
                  {specialtyInfo.badge}
                </span>
              </div>
              {livePlan && (
                <Link
                  href="/vendor-portal/plus"
                  className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono-luxury hover:opacity-85 transition-opacity"
                >
                  <span className="text-[var(--text-muted)]">Plan:</span>
                  <span
                    className={
                      livePlan.freeLaunchMode
                        ? 'text-emerald-500'
                        : livePlan.isPlus
                        ? 'text-[var(--gold-accent)]'
                        : 'text-amber-500'
                    }
                  >
                    {planShortLabel} ›
                  </span>
                </Link>
              )}
            </div>

            <nav className="space-y-1 font-mono-luxury text-xs uppercase tracking-wider">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    id={item.id}
                    href={item.href}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                      item.active
                        ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${item.active ? '' : 'text-[var(--gold-accent)]'}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3 mt-6">
            <div className="text-[11px] font-mono-luxury text-[var(--text-muted)] space-y-1">
              <div className="flex items-center justify-between">
                <span>Settlement Escrow:</span>
                <span className="text-emerald-500">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <span
                  className={
                    liveStatus.isVerified
                      ? 'text-emerald-500'
                      : liveStatus.approvalStatus === 'rejected'
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }
                >
                  {liveStatus.isVerified ? 'Verified' : liveStatus.approvalStatus === 'rejected' ? 'Action Needed' : 'Pending Review'}
                </span>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-3.5 sm:p-8 lg:p-12 pb-28 md:pb-12 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>

      {/* ======================================================== */}
      {/* 3. MOBILE NATIVE APP BOTTOM TAB DOCK (< md) */}
      {/* ======================================================== */}
      <nav
        aria-label="Vendor App Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-2xl shadow-[0_-10px_35px_rgba(0,0,0,0.12)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 items-end h-[64px] px-1.5 max-w-lg mx-auto">
          {/* Tab 1: Home */}
          <Link
            href="/vendor-portal"
            className={`flex flex-col items-center justify-center gap-1 h-full transition-colors ${
              pathname === '/vendor-portal'
                ? 'text-[var(--gold-accent)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            <LayoutDashboard className="h-[20px] w-[20px]" strokeWidth={pathname === '/vendor-portal' ? 2.1 : 1.7} />
            <span className="text-[10px] font-mono-luxury tracking-wide">Home</span>
          </Link>

          {/* Tab 2: Orders */}
          <Link
            href="/vendor-portal/orders"
            className={`flex flex-col items-center justify-center gap-1 h-full transition-colors ${
              pathname === '/vendor-portal/orders'
                ? 'text-[var(--gold-accent)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            <PackageCheck className="h-[20px] w-[20px]" strokeWidth={pathname === '/vendor-portal/orders' ? 2.1 : 1.7} />
            <span className="text-[10px] font-mono-luxury tracking-wide">Orders</span>
          </Link>

          {/* Center Tab 3: Elevated Gold + Quick Create FAB */}
          <div className="flex flex-col items-center justify-end pb-1.5 h-full">
            <button
              type="button"
              onClick={() => setIsQuickCreateOpen((prev) => !prev)}
              className={`-mt-6 h-[52px] w-[52px] rounded-full bg-gradient-to-tr from-[#B89035] via-[#E6C367] to-[#F5E6B8] text-black shadow-[0_8px_24px_rgba(196,151,46,0.45)] ring-4 ring-[var(--bg-surface)] flex items-center justify-center active:scale-95 transition-transform cursor-pointer ${
                isQuickCreateOpen ? 'rotate-45' : ''
              }`}
              aria-label="Create new product or story"
            >
              <Plus className="h-6 w-6 stroke-[2.4]" />
            </button>
            <span className="text-[9px] font-mono-luxury tracking-wider text-[var(--gold-accent)] mt-0.5">
              Create
            </span>
          </div>

          {/* Tab 4: Catalog */}
          <Link
            href="/vendor-portal/products"
            className={`flex flex-col items-center justify-center gap-1 h-full transition-colors ${
              pathname.startsWith('/vendor-portal/products')
                ? 'text-[var(--gold-accent)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            <ShoppingBag className="h-[20px] w-[20px]" strokeWidth={pathname.startsWith('/vendor-portal/products') ? 2.1 : 1.7} />
            <span className="text-[10px] font-mono-luxury tracking-wide">Catalog</span>
          </Link>

          {/* Tab 5: Real Studio Hub Route (preserves Back button history from all Studio sub-pages!) */}
          <Link
            href="/vendor-portal/studio"
            className={`flex flex-col items-center justify-center gap-1 h-full transition-colors ${
              isStudioTabActive ? 'text-[var(--gold-accent)]' : 'text-[var(--text-muted)]'
            }`}
          >
            <Grid2X2 className="h-[20px] w-[20px]" strokeWidth={isStudioTabActive ? 2.1 : 1.7} />
            <span className="text-[10px] font-mono-luxury tracking-wide">Studio</span>
          </Link>
        </div>
      </nav>

      {/* ======================================================== */}
      {/* 4. MOBILE NATIVE QUICK-CREATE SHEET (FAB +) */}
      {/* ======================================================== */}
      {mounted &&
        isQuickCreateOpen &&
        createPortal(
          <div
            className="md:hidden fixed inset-0 z-[75] flex flex-col justify-end bg-black/60 backdrop-blur-md animate-fadeIn"
            onClick={() => setIsQuickCreateOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-t-[30px] bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-4 shadow-[0_-20px_60px_rgba(0,0,0,0.4)]"
            >
              <div className="flex justify-center pb-1">
                <span className="h-1 w-10 rounded-full bg-[var(--border-hover)]" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono-luxury uppercase tracking-[0.2em] text-[var(--gold-accent)]">
                    Quick Create
                  </span>
                  <h3 className="font-editorial text-2xl font-normal text-[var(--text-primary)]">
                    What would you like to post?
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="h-8 w-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="divide-y divide-[var(--border-subtle)] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-hidden">
                <Link
                  href="/vendor-portal/publish"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-4 py-4 flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center justify-center shrink-0">
                      <UploadCloud className="h-[18px] w-[18px]" strokeWidth={1.65} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        Publish New Piece
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] font-light truncate">
                        Ready-to-Ship or Made-to-Order catalog listing
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
                </Link>

                <Link
                  href="/vendor-portal/stories"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-4 py-4 flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--gold-accent)] flex items-center justify-center shrink-0">
                      <Camera className="h-[18px] w-[18px]" strokeWidth={1.65} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        Post 24h Lookbook Story
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] font-light truncate">
                        Multi-slide photos or clips with text overlays
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Transparent Share Storefront Link Sheet */}
      <ShareStoreSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        brandName={vendorProfile.brandName || 'My Brand'}
        logoUrl={vendorProfile.logoUrl}
        storeSlug={storeSlug}
        storeUrl={storeUrl}
      />

      {/* Interactive Vendor Tour Guide */}
      <VendorTourGuide
        isOpen={showTour ? true : undefined}
        onClose={() => setShowTour(false)}
      />
    </div>
  );
}
