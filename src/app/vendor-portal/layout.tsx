'use client';

import { vendorFetch } from '@/lib/services/apiClient';
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
  Gem, Footprints, Shirt, Crown, Plus, Grid2X2, HelpCircle,
  CheckCircle2, ChevronRight, Camera, ShieldCheck
} from 'lucide-react';
import VendorNotificationBell from '@/components/vendor/VendorNotificationBell';
import VendorTourGuide from '@/components/vendor/VendorTourGuide';
import { useBodyScrollLock } from '@/lib/utils/useBodyScrollLock';
import { getConciergeConfig, generateWhatsAppUrl } from '@/lib/config/concierge';
import { isBoutiqueVendor, getVendorSpecialty, getVendorSpecialtyInfo } from '@/types';

export default function VendorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    vendorLogout,
    vendorProfile,
    setVendorProfile,
    theme,
    toggleTheme,
  } = useStore();

  const [liveStatus, setLiveStatus] = useState<{
    isVerified: boolean;
    approvalStatus: string;
  }>({
    isVerified: false,
    approvalStatus: 'pending',
  });

  // Native mobile app sheets (replaces clunky web sidebar drawer on mobile)
  const [isStudioSheetOpen, setIsStudioSheetOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsStudioSheetOpen(false);
    setIsQuickCreateOpen(false);
  }, [pathname]);

  useBodyScrollLock(isStudioSheetOpen || isQuickCreateOpen);

  const checkVendorStatus = useCallback(async () => {
    try {
      const res = await vendorFetch('/api/vendor/profile');
      const data = await res.json();

      if (res.status === 403 || data.isSuspended || data.approvalStatus === 'suspended') {
        const reason = encodeURIComponent(data.suspensionReason || data.error || 'Account suspended by administration.');
        vendorLogout();
        router.push(`/vendor-portal/auth?suspended=true&reason=${reason}`);
        return;
      }

      if (res.ok && data.success && data.vendor) {
        const v = data.vendor;
        const verified = !!v.is_verified || !!v.isVerified;
        setLiveStatus({
          isVerified: verified,
          approvalStatus: verified ? 'approved' : (v.approvalStatus || 'pending'),
        });
        const normalizedType = isBoutiqueVendor(v) ? 'boutique_seller' : 'fashion_designer';
        const rawSpec = v.specialty || v.vendorSpecialty || (normalizedType === 'fashion_designer' ? 'native_tailoring' : 'streetwear');
        const spec = rawSpec === 'apparel' ? 'streetwear' : rawSpec === 'jewelry' ? 'accessories' : rawSpec;
        setVendorProfile({
          id: v.id || '',
          brandName: v.brandName || v.brand_name || 'My Brand',
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
      }
    } catch {}
  }, [setVendorProfile, vendorLogout, router]);

  useEffect(() => {
    checkVendorStatus();
  }, [pathname, checkVendorStatus]);

  useEffect(() => {
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
              checkVendorStatus();
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
  }, [vendorProfile.email, checkVendorStatus]);

  if (pathname === '/vendor-portal/auth') {
    return <>{children}</>;
  }

  const isBoutique = isBoutiqueVendor(vendorProfile);
  const specialty = getVendorSpecialty(vendorProfile);
  const specialtyInfo = getVendorSpecialtyInfo(specialty, isBoutique);
  const storeSlug = encodeURIComponent(vendorProfile.id || vendorProfile.brandName || 'store');
  const brandInitial = (vendorProfile.brandName || 'I').trim().charAt(0).toUpperCase();

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

  // Mobile Studio Hub — Quiet-Luxury Monochrome iOS Grouped Sections (Zero Rainbow Boxes)
  const studioGroups: Array<{
    title: string;
    items: Array<{
      label: string;
      sub: string;
      href?: string;
      external?: boolean;
      badge?: string;
      action?: () => void;
      icon: any;
    }>;
  }> = [
    {
      title: 'Growth & Showcase',
      items: [
        {
          label: 'Lookbook Stories',
          sub: 'Post 48h drops & alert followers',
          href: '/vendor-portal/stories',
          icon: Camera,
        },
        {
          label: 'ÌRÍSÍ Plus & Plan',
          sub: 'Commission rates & white-label store',
          href: '/vendor-portal/plus',
          badge: 'Plus',
          icon: Crown,
        },
        {
          label: 'Direct Sales POS',
          sub: 'Create escrow checkout links for DMs',
          href: '/vendor-portal/direct-sales',
          icon: MessageSquare,
        },
        {
          label: 'View Live Storefront',
          sub: 'Open your public brand link',
          href: `/brand/${storeSlug}`,
          external: true,
          icon: ExternalLink,
        },
      ],
    },
    {
      title: 'Finance & Insights',
      items: [
        {
          label: 'Settlements & Payouts',
          sub: 'Escrow vault & bank account',
          href: '/vendor-portal/settlements',
          icon: DollarSign,
        },
        {
          label: 'Sales & Analytics',
          sub: 'Revenue, AOV & ledger export',
          href: '/vendor-portal/reports',
          icon: BarChart3,
        },
        {
          label: 'Client Reviews',
          sub: 'Verified ratings & fit scores',
          href: '/vendor-portal/reviews',
          icon: Star,
        },
      ],
    },
    {
      title: 'Atelier & Support',
      items: [
        {
          label: 'Store Profile & Hubs',
          sub: 'Logo, bio, socials & dispatch city',
          href: '/vendor-portal/atelier',
          icon: Building,
        },
        {
          label: 'Interactive Tour',
          sub: 'Quick walkthrough of your studio',
          action: () => {
            setIsStudioSheetOpen(false);
            setShowTour(true);
          },
          icon: HelpCircle,
        },
        {
          label: 'Vendor Support (WhatsApp)',
          sub: 'Chat directly with ÌRÍSÍ concierge',
          action: () => {
            setIsStudioSheetOpen(false);
            openVendorWhatsAppSupport();
          },
          external: true,
          icon: ShieldCheck,
        },
      ],
    },
  ];

  const isStudioRouteActive = [
    '/vendor-portal/stories',
    '/vendor-portal/plus',
    '/vendor-portal/settlements',
    '/vendor-portal/reports',
    '/vendor-portal/direct-sales',
    '/vendor-portal/reviews',
    '/vendor-portal/atelier',
  ].some((r) => pathname.startsWith(r));

  const handleLogout = () => {
    vendorLogout();
    router.push('/vendor-portal/auth');
  };

  const openVendorWhatsAppSupport = () => {
    const cfg = getConciergeConfig();
    const url = generateWhatsAppUrl(
      cfg.whatsappNumber,
      `Hi ÌRÍSÍ Vendor Support, I'm reaching out from ${vendorProfile.brandName || 'my store'} (${vendorProfile.email || ''}).`
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors flex flex-col">
      {/* ======================================================== */}
      {/* 1A. MOBILE NATIVE APP TOP HEADER (< md) — ZERO HAMBURGER */}
      {/* ======================================================== */}
      <header className="md:hidden sticky top-0 z-30 h-14 px-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-xl flex items-center justify-between gap-3">
        {/* Left: Brand Avatar + Name + Live Status Dot */}
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
              {vendorProfile.brandName || 'My Brand'}
            </div>
            <div className="text-[10px] font-mono-luxury text-[var(--text-muted)] truncate leading-tight flex items-center gap-1">
              <span>{liveStatus.isVerified ? 'Verified Seller' : 'Pending Review'}</span>
              <span>·</span>
              <span className="text-[var(--gold-accent)]">Studio</span>
            </div>
          </div>
        </Link>

        {/* Right: Compact Native App Icon Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={`/brand/${storeSlug}`}
            target="_blank"
            className="h-9 w-9 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--gold-accent)] flex items-center justify-center active:scale-95 transition-all"
            aria-label="Open live storefront"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>

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
        {/* Desktop-Only Left Sidebar (Mobile uses Native Bottom Tab Dock + App Sheets) */}
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

        {/* Main Content Area (Extra pb-28 on mobile for clean clearance above Native Bottom Tab Dock) */}
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
              onClick={() => {
                setIsStudioSheetOpen(false);
                setIsQuickCreateOpen((prev) => !prev);
              }}
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

          {/* Tab 5: Studio Hub Sheet */}
          <button
            type="button"
            onClick={() => {
              setIsQuickCreateOpen(false);
              setIsStudioSheetOpen((prev) => !prev);
            }}
            className={`flex flex-col items-center justify-center gap-1 h-full transition-colors cursor-pointer ${
              isStudioSheetOpen || isStudioRouteActive
                ? 'text-[var(--gold-accent)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            <Grid2X2 className="h-[20px] w-[20px]" strokeWidth={isStudioSheetOpen || isStudioRouteActive ? 2.1 : 1.7} />
            <span className="text-[10px] font-mono-luxury tracking-wide">Studio</span>
          </button>
        </div>
      </nav>

      {/* ======================================================== */}
      {/* 4A. MOBILE NATIVE QUICK-CREATE SHEET (FAB +) */}
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
                        Post 48h Lookbook Story
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] font-light truncate">
                        Share a photo or clip &amp; alert your followers
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

      {/* ======================================================== */}
      {/* 4B. MOBILE NATIVE STUDIO APP LAUNCHER SHEET */}
      {/* ======================================================== */}
      {mounted &&
        isStudioSheetOpen &&
        createPortal(
          <div
            className="md:hidden fixed inset-0 z-[75] flex flex-col justify-end bg-black/60 backdrop-blur-md animate-fadeIn"
            onClick={() => setIsStudioSheetOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              data-lenis-prevent="true"
              className="w-full max-h-[86vh] rounded-t-[30px] bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex flex-col overflow-hidden shadow-[0_-20px_60px_rgba(0,0,0,0.45)]"
            >
              {/* Drag Handle */}
              <div className="pt-3 pb-1 flex justify-center shrink-0">
                <span className="h-1 w-10 rounded-full bg-[var(--border-hover)]" />
              </div>

              {/* Brand Identity Summary Header */}
              <div className="px-5 pt-2 pb-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-11 w-11 rounded-2xl overflow-hidden bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 flex items-center justify-center shrink-0">
                    {vendorProfile.logoUrl ? (
                      <Image
                        src={vendorProfile.logoUrl}
                        alt={vendorProfile.brandName}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <span className="font-editorial text-xl text-[var(--gold-accent)]">
                        {brandInitial}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-editorial text-xl font-normal text-[var(--text-primary)] truncate">
                      {vendorProfile.brandName}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono-luxury">
                      <span className={liveStatus.isVerified ? 'text-emerald-500 flex items-center gap-1' : 'text-amber-500'}>
                        {liveStatus.isVerified ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Verified
                          </>
                        ) : (
                          'Pending Review'
                        )}
                      </span>
                      <span className="text-[var(--text-muted)]">·</span>
                      <span className="text-[var(--gold-accent)] flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Escrow Active
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsStudioSheetOpen(false)}
                  className="h-8 w-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] shrink-0 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Quiet-Luxury Native iOS Grouped List Sections (Zero Noisy Colors) */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5 bg-[var(--bg-primary)]">
                {studioGroups.map((group) => (
                  <div key={group.title} className="space-y-1.5">
                    <div className="px-2 text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      {group.title}
                    </div>
                    <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActiveRow = item.href && pathname === item.href;
                        const rowInner = (
                          <div
                            className={`px-4 py-3.5 flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)] transition-colors ${
                              isActiveRow ? 'bg-[var(--gold-accent)]/[0.06]' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <Icon
                                className={`h-[18px] w-[18px] shrink-0 ${
                                  isActiveRow || item.badge
                                    ? 'text-[var(--gold-accent)]'
                                    : 'text-[var(--text-primary)]'
                                }`}
                                strokeWidth={1.65}
                              />
                              <div className="min-w-0">
                                <div className="text-[13px] font-medium text-[var(--text-primary)] truncate leading-snug">
                                  {item.label}
                                </div>
                                <div className="text-[11px] text-[var(--text-muted)] font-light truncate leading-snug">
                                  {item.sub}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {item.badge && (
                                <span className="px-2 py-0.5 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[10px] font-mono-luxury text-[var(--gold-accent)]">
                                  {item.badge}
                                </span>
                              )}
                              <ChevronRight className="h-4 w-4 text-[var(--text-muted)]/70" strokeWidth={1.6} />
                            </div>
                          </div>
                        );

                        if (item.action) {
                          return (
                            <button
                              key={item.label}
                              type="button"
                              onClick={item.action}
                              className="w-full text-left cursor-pointer block"
                            >
                              {rowInner}
                            </button>
                          );
                        }

                        return (
                          <Link
                            key={item.label}
                            href={item.href!}
                            target={item.external ? '_blank' : undefined}
                            onClick={() => setIsStudioSheetOpen(false)}
                            className="block"
                          >
                            {rowInner}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Clean Sign Out Row */}
                <div className="pt-1 pb-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-rose-500 text-xs font-mono-luxury uppercase tracking-wider flex items-center justify-center gap-2 active:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.7} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              <div className="h-[env(safe-area-inset-bottom)] shrink-0" />
            </div>
          </div>,
          document.body
        )}

      {/* Interactive Vendor Tour Guide */}
      <VendorTourGuide
        isOpen={showTour ? true : undefined}
        onClose={() => setShowTour(false)}
      />
    </div>
  );
}
