'use client';

import { vendorFetch } from '@/lib/services/apiClient';


import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store/useStore';
import {
  LayoutDashboard, UploadCloud, PackageCheck, BarChart3,
  Building, MessageSquare, DollarSign, LogOut, Sun, Moon,
  ExternalLink, Sparkles, ShieldCheck, ShoppingBag, Scissors, Clock, AlertTriangle, Star, Menu, X,
  Gem, Footprints, Shirt, Crown
} from 'lucide-react';
import VendorNotificationBell from '@/components/vendor/VendorNotificationBell';
import VendorTourGuide from '@/components/vendor/VendorTourGuide';
import Image from 'next/image';

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
    toggleTheme
  } = useStore();

  const [liveStatus, setLiveStatus] = useState<{
    isVerified: boolean;
    approvalStatus: string;
  }>({
    isVerified: false,
    approvalStatus: 'pending'
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Close mobile menu when route changes
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    async function checkVendorStatus() {
      try {
        const res = await vendorFetch('/api/vendor/profile');
        const data = await res.json();
        if (res.ok && data.success && data.vendor) {
          const v = data.vendor;
          const verified = !!v.is_verified || !!v.isVerified;
          setLiveStatus({
            isVerified: verified,
            approvalStatus: verified ? 'approved' : (v.approvalStatus || 'pending')
          });
          const normalizedType = isBoutiqueVendor(v) ? 'boutique_seller' : 'fashion_designer';
          const spec = v.specialty || v.vendorSpecialty || (normalizedType === 'fashion_designer' ? 'apparel' : 'multi_department');
          setVendorProfile({
            brandName: v.brandName || v.brand_name || vendorProfile.brandName || 'My Brand',
            designerName: v.designerName || v.designer_name || v.contact_person || vendorProfile.designerName || 'Manager',
            contactPerson: v.contactPerson || v.contact_person || v.designerName || v.designer_name || vendorProfile.contactPerson,
            email: v.email || vendorProfile.email,
            phone: v.phone || vendorProfile.phone,
            location: v.location || (v.city && v.state ? `${v.city}, ${v.state}` : vendorProfile.location) || '',
            vendorType: normalizedType,
            specialty: spec,
            vendorSpecialty: spec,
            bankName: v.bankName || v.bank_name || vendorProfile.bankName,
            accountNumber: v.accountNumber || v.account_number || vendorProfile.accountNumber,
            accountName: v.accountName || v.account_name || vendorProfile.accountName,
            instagram: v.instagram || vendorProfile.instagram,
            bio: v.bio || vendorProfile.bio
          });
        }
      } catch (e) {}
    }
    checkVendorStatus();
  }, [pathname, setVendorProfile]);

  // If on the auth page, render without the dashboard shell
  if (pathname === '/vendor-portal/auth') {
    return <>{children}</>;
  }

  const isBoutique = isBoutiqueVendor(vendorProfile);
  const specialty = getVendorSpecialty(vendorProfile);
  const specialtyInfo = getVendorSpecialtyInfo(specialty, isBoutique);

  const navItems = [
    {
      id: 'tour-nav-overview',
      label: 'Overview',
      href: '/vendor-portal',
      icon: LayoutDashboard,
      active: pathname === '/vendor-portal'
    },
    {
      id: 'tour-nav-publish',
      label: specialtyInfo.publishLabel,
      href: '/vendor-portal/publish',
      icon: UploadCloud,
      active: pathname === '/vendor-portal/publish'
    },
    {
      id: 'tour-nav-stories',
      label: 'Post Drop Story',
      href: '/vendor-portal/stories',
      icon: Sparkles,
      active: pathname === '/vendor-portal/stories'
    },
    {
      id: 'tour-nav-orders',
      label: specialtyInfo.ordersLabel,
      href: '/vendor-portal/orders',
      icon: PackageCheck,
      active: pathname === '/vendor-portal/orders'
    },
    {
      id: 'tour-nav-reports',
      label: 'Reports & Sales',
      href: '/vendor-portal/reports',
      icon: BarChart3,
      active: pathname === '/vendor-portal/reports'
    },
    {
      id: 'tour-nav-atelier',
      label: specialtyInfo.storeProfileLabel,
      href: '/vendor-portal/atelier',
      icon: Building,
      active: pathname === '/vendor-portal/atelier'
    },
    {
      id: 'tour-nav-direct-sales',
      label: 'Direct Sales Assistant',
      href: '/vendor-portal/direct-sales',
      icon: MessageSquare,
      active: pathname === '/vendor-portal/direct-sales'
    },
    {
      id: 'tour-nav-settlements',
      label: 'Settlements & Banking',
      href: '/vendor-portal/settlements',
      icon: DollarSign,
      active: pathname === '/vendor-portal/settlements'
    },
    {
      label: 'Client Reviews & Ratings',
      href: '/vendor-portal/reviews',
      icon: Star,
      active: pathname === '/vendor-portal/reviews'
    },
  ];

  const handleLogout = () => {
    vendorLogout();
    router.push('/vendor-portal/auth');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors flex flex-col">
      
      {/* ======================================================== */}
      {/* 1. TOP HEADER (FULL-WIDTH LUXURY BAR) */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-30 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-md px-3.5 sm:px-10 py-2.5 sm:py-3.5 flex items-center justify-between">
        
        {/* Left: Menu Toggle + Brand Identity */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] transition-all cursor-pointer shrink-0"
            title="Toggle menu"
            aria-label="Toggle vendor menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-[var(--gold-accent)]" /> : <Menu className="h-5 w-5" />}
          </button>
          
          <Link href="/vendor-portal" className="flex items-center gap-2 sm:gap-3 group shrink-0">
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
            <span className="font-editorial text-xl sm:text-2xl font-bold tracking-[0.24em] text-[var(--text-primary)] group-hover:text-[var(--gold-accent)] transition-colors">
              Ì R Í S Í
            </span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-[10px] font-mono-luxury uppercase font-bold border border-[var(--gold-accent)]/20">
              {specialtyInfo.badge}
            </span>
          </Link>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-mono-luxury truncate">
            <span className={`h-2 w-2 rounded-full shrink-0 ${liveStatus.isVerified ? 'bg-emerald-500 animate-pulse' : liveStatus.approvalStatus === 'rejected' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'}`} />
            <span className="font-bold text-[var(--text-primary)] truncate max-w-[100px] sm:max-w-[180px]">{vendorProfile.brandName}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Quick Interactive Tour Button */}
          <button
            type="button"
            onClick={() => setShowTour(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--gold-subtle)] hover:bg-[var(--gold-accent)]/20 border border-[var(--gold-accent)]/40 text-xs font-mono-luxury uppercase font-bold text-[var(--gold-accent)] transition-all cursor-pointer shadow-sm"
            title="Take interactive tour"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tour Guide</span>
          </button>

          {/* In-App Live Notification Bell */}
          <VendorNotificationBell />

          <Link
            href={`/brand/${encodeURIComponent(vendorProfile.brandName)}`}
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] transition-all"
          >
            <span>{isBoutique ? 'View Boutique' : 'View Atelier'}</span>
            <ExternalLink className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
            title="Toggle theme"
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            onClick={handleLogout}
            className="hidden md:flex p-2 rounded-xl border border-[var(--border-subtle)] hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-all cursor-pointer"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>

        </div>

      </header>

      {/* ======================================================== */}
      {/* 2. BODY LAYOUT (SIDEBAR + ACTIVE PAGE CONTENT) */}
      {/* ======================================================== */}
      <div className="flex-1 flex">
        
        {/* Mobile Overlay Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fadeIn"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        {/* Left Sidebar - Desktop Fixed | Mobile Drawer */}
        <aside className={`
          w-72 max-w-[85vw] border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]
          flex flex-col justify-between p-4 sm:p-6 shrink-0 
          transition-all duration-300 ease-in-out shadow-2xl md:shadow-none
          
          md:relative md:flex md:sticky md:top-[60px] md:h-[calc(100vh-60px)] md:self-start md:overflow-y-auto
          
          fixed inset-y-0 left-0 top-0 h-full z-50 overflow-y-auto
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}>
          
          <div className="space-y-5">
            
            {/* Mobile Drawer Top Header (Close button & Logo) */}
            <div className="flex items-center justify-between md:hidden pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <span className="font-editorial text-lg font-bold text-[var(--text-primary)] tracking-widest uppercase">
                  Ì R Í S Í
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Store / Atelier Card */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--gold-accent)]/15 text-[var(--gold-accent)] flex items-center justify-center font-editorial font-bold text-lg shrink-0">
                  {specialty === 'caps' ? (
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
                  <div className="font-bold text-xs text-[var(--text-primary)] truncate font-editorial">
                    {vendorProfile.brandName}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono-luxury truncate">
                    {vendorProfile.location || 'Location not set'}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono-luxury">
                <span className="text-[var(--text-muted)]">Type:</span>
                <span className="text-[var(--gold-accent)] font-bold truncate">
                  {specialtyInfo.badge}
                </span>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1 font-mono-luxury text-xs uppercase tracking-wider">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    id={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-bold ${
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

          {/* Bottom Info & Logout */}
          <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3 mt-6">
            <div className="text-[11px] font-mono-luxury text-[var(--text-muted)] space-y-1">
              <div className="flex items-center justify-between">
                <span>Settlement Escrow:</span>
                <strong className="text-emerald-500">Active</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <strong className={liveStatus.isVerified ? 'text-emerald-500' : liveStatus.approvalStatus === 'rejected' ? 'text-rose-400' : 'text-amber-400'}>
                  {liveStatus.isVerified ? 'Verified' : liveStatus.approvalStatus === 'rejected' ? 'Action Needed' : 'Pending Review'}
                </strong>
              </div>
            </div>
            
            {/* Mobile Logout Button */}
            <button
              onClick={handleLogout}
              className="md:hidden w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-mono-luxury uppercase font-bold transition-all cursor-pointer"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-3.5 sm:p-8 lg:p-12 overflow-y-auto min-w-0">
          {children}
        </main>

      </div>

      {/* Interactive Vendor Tour Guide with Nigerian Onboarding Banter */}
      <VendorTourGuide
        isOpen={showTour ? true : undefined}
        onClose={() => setShowTour(false)}
      />

    </div>
  );
}
