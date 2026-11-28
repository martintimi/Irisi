'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import {
  Camera, Crown, MessageSquare, ExternalLink, DollarSign,
  BarChart3, Star, Building, HelpCircle, ShieldCheck,
  ChevronRight, LogOut, CheckCircle2, Share2, Users
} from 'lucide-react';
import ShareStoreSheet from '@/components/vendor/ShareStoreSheet';
import VendorTourGuide from '@/components/vendor/VendorTourGuide';
import { getConciergeConfig, generateWhatsAppUrl } from '@/lib/config/concierge';
import { clearVendorCache } from '@/lib/cache/vendorPortalCache';

/**
 * Dedicated Native Mobile App "Studio" Hub Page (/vendor-portal/studio)
 * Being a real route ensures that pressing Back from ANY Studio sub-page
 * (Stories, Store Profile, Analytics, Payouts, Plus, Direct POS, Reviews)
 * always returns cleanly to Studio — just like a real iOS/Android app!
 */
export default function VendorStudioHubPage() {
  const router = useRouter();
  const { vendorProfile, vendorLogout } = useStore();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const brandName = vendorProfile?.brandName || 'My Brand';
  const brandInitial = brandName.trim().charAt(0).toUpperCase();
  const storeSlug = encodeURIComponent(vendorProfile?.id || brandName || 'store');
  const storeUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/brand/${storeSlug}`
      : `https://irisimi.ng/brand/${storeSlug}`;
  const isVerified = Boolean((vendorProfile as any)?.is_verified || (vendorProfile as any)?.isVerified || vendorProfile?.approvalStatus === 'approved');

  const openVendorWhatsAppSupport = () => {
    const cfg = getConciergeConfig();
    const url = generateWhatsAppUrl(
      cfg.whatsappNumber,
      `Hi ÌRÍSÍ Vendor Support, I'm reaching out from ${brandName} (${vendorProfile.email || ''}).`
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLogout = () => {
    clearVendorCache();
    vendorLogout();
    router.push('/vendor-portal/auth');
  };

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
          label: 'Followers & VIPs',
          sub: 'Followers, top buyers & story interactions',
          href: '/vendor-portal/audience',
          badge: 'Plus',
          icon: Users,
        },
        {
          label: 'Lookbook Stories',
          sub: 'Post 24h multi-slide drops & view insights',
          href: '/vendor-portal/stories',
          icon: Camera,
        },
        {
          label: 'ÌRÍSÍ Plus & Plan',
          sub: 'Commission rates & white-label store link',
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
          label: 'Share Storefront Link',
          sub: 'Copy or share your store link to WhatsApp',
          action: () => setIsShareOpen(true),
          icon: Share2,
        },
        {
          label: 'Preview Live Storefront',
          sub: 'View your brand as shoppers see it',
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
          sub: 'Escrow vault & payout bank account',
          href: '/vendor-portal/settlements',
          icon: DollarSign,
        },
        {
          label: 'Sales & Analytics',
          sub: 'Revenue, AOV & performance breakdown',
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
          sub: 'Logo, bio, socials & dispatch cities',
          href: '/vendor-portal/atelier',
          icon: Building,
        },
        {
          label: 'Interactive Tour',
          sub: 'Quick walkthrough of your studio tools',
          action: () => setShowTour(true),
          icon: HelpCircle,
        },
        {
          label: 'Vendor Support (WhatsApp)',
          sub: 'Chat directly with ÌRÍSÍ concierge',
          action: openVendorWhatsAppSupport,
          external: true,
          icon: ShieldCheck,
        },
      ],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fadeIn pb-8 select-none">
      {/* Identity Header Card */}
      <Link
        href="/vendor-portal/atelier"
        className="p-4 rounded-[22px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)] transition-colors"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative h-12 w-12 rounded-full overflow-hidden bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/40 flex items-center justify-center shrink-0">
            {vendorProfile.logoUrl ? (
              <Image src={vendorProfile.logoUrl} alt={brandName} fill unoptimized className="object-cover" />
            ) : (
              <span className="font-editorial text-xl text-[var(--gold-accent)]">{brandInitial}</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-editorial text-2xl font-normal text-[var(--text-primary)] truncate leading-tight">
              {brandName}
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] font-mono-luxury mt-0.5">
              <span className={isVerified ? 'text-emerald-500 inline-flex items-center gap-1' : 'text-[var(--gold-accent)]'}>
                {isVerified ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" /> Verified Studio
                  </>
                ) : (
                  'Studio Profile'
                )}
              </span>
              <span className="text-[var(--text-muted)]">·</span>
              <span className="text-[var(--text-muted)]">Edit profile</span>
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
      </Link>

      {/* Monochrome Grouped iOS Settings Lists */}
      {studioGroups.map((group) => (
        <section key={group.title} className="space-y-2">
          <div className="px-1 text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {group.title}
          </div>
          <div className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            {group.items.map((item) => {
              const Icon = item.icon;
              const inner = (
                <>
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Icon className="h-[18px] w-[18px] text-[var(--text-primary)] shrink-0" strokeWidth={1.6} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-normal text-[var(--text-primary)] truncate">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-[9px] font-mono-luxury uppercase">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] font-light truncate mt-0.5">
                        {item.sub}
                      </p>
                    </div>
                  </div>
                  {item.external ? (
                    <ExternalLink className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[var(--text-muted)]/70 shrink-0" />
                  )}
                </>
              );

              if (item.action) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                  >
                    {inner}
                  </button>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href || '/vendor-portal'}
                  target={item.external ? '_blank' : undefined}
                  className="px-4 py-3.5 flex items-center justify-between gap-3 active:bg-[var(--bg-secondary)] transition-colors"
                >
                  {inner}
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {/* Clean Sign Out Row */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-rose-500 text-xs font-mono-luxury uppercase tracking-wider flex items-center justify-center gap-2 active:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out of Seller Account</span>
        </button>
      </div>

      <ShareStoreSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        brandName={brandName}
        logoUrl={vendorProfile.logoUrl}
        storeSlug={storeSlug}
        storeUrl={storeUrl}
      />

      <VendorTourGuide
        isOpen={showTour ? true : undefined}
        onClose={() => setShowTour(false)}
      />
    </div>
  );
}
