'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ShieldCheck, FileText, Lock } from 'lucide-react';
import BrandWordmark from '@/components/common/BrandWordmark';

interface LegalShellProps {
  activePage: 'returns' | 'terms' | 'privacy';
  eyebrow: string;
  title: string;
  subtitle: string;
  highlights: { label: string; value: string }[];
  children: React.ReactNode;
}

const NAV_TABS = [
  { id: 'returns' as const, label: 'Returns & Escrow', href: '/returns', icon: ShieldCheck },
  { id: 'terms' as const, label: 'Terms of Service', href: '/terms', icon: FileText },
  { id: 'privacy' as const, label: 'Privacy Policy', href: '/privacy', icon: Lock },
];

function LegalShellHeader({ activePage }: { activePage: 'returns' | 'terms' | 'privacy' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get('from') || '';
  const fromSettings = fromParam === 'settings';

  const handleBack = () => {
    if (fromSettings) {
      router.push('/profile?tab=settings');
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/85 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-[11px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {fromSettings ? 'Back to Settings' : 'Back'}
          </span>
          <span className="sm:hidden">
            {fromSettings ? 'Settings' : 'Back'}
          </span>
        </button>

        <BrandWordmark size="sm" withSubtitle={false} />

        <Link
          href="/track-order"
          className="text-[11px] font-mono-luxury uppercase tracking-[0.16em] text-[var(--gold-accent)] hover:opacity-80 transition-opacity"
        >
          Track Order
        </Link>
      </div>

      {/* Seamless Policy Switcher Bar (preserves ?from=settings across tab switches) */}
      <div className="border-t border-[var(--border-subtle)]/60 bg-[var(--bg-secondary)]/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto no-scrollbar">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activePage === tab.id;
            const targetHref = fromSettings ? `${tab.href}?from=settings` : tab.href;
            return (
              <Link
                key={tab.id}
                href={targetHref}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-mono-luxury uppercase tracking-wider whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--badge-bg)]'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

export default function LegalShell({
  activePage,
  eyebrow,
  title,
  subtitle,
  highlights,
  children,
}: LegalShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-x-hidden">
      {/* Subtle Ambient Gold Top Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 inset-x-0 h-[360px] opacity-35 dark:opacity-25"
        style={{
          background:
            'radial-gradient(ellipse 65% 50% at 50% 0%, rgba(196, 151, 46, 0.22), transparent 72%)',
        }}
      />

      {/* Minimal Luxury Top Masthead */}
      <Suspense fallback={<div className="h-28 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]" />}>
        <LegalShellHeader activePage={activePage} />
      </Suspense>

      {/* Main Editorial Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10 sm:space-y-12">
        {/* Masthead Header */}
        <section className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[var(--gold-accent)]/30 bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-[10px] font-mono-luxury uppercase tracking-[0.22em]">
            <span>{eyebrow}</span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-5xl font-normal tracking-tight text-[var(--text-primary)] leading-[1.12]">
            {title}
          </h1>

          <div className="mx-auto w-20 h-[1px] bg-gradient-to-r from-transparent via-[var(--gold-accent)]/70 to-transparent" />

          <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed pt-1">
            {subtitle}
          </p>
        </section>

        {/* Key Metadata Bar */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {highlights.map((item) => (
            <div
              key={item.label}
              className="px-5 py-4 rounded-2xl surface-card border border-[var(--border-subtle)] text-center sm:text-left"
            >
              <span className="text-[10px] font-mono-luxury uppercase tracking-[0.18em] text-[var(--text-muted)] block">
                {item.label}
              </span>
              <span className="font-editorial text-lg sm:text-xl text-[var(--text-primary)] mt-0.5 block">
                {item.value}
              </span>
            </div>
          ))}
        </section>

        {/* Document Clauses */}
        <div className="space-y-5">{children}</div>

        {/* Luxury Closing Footer Strip */}
        <section className="pt-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="font-editorial text-lg text-[var(--text-primary)]">
              Questions about an order or brand charter?
            </p>
            <p className="text-xs text-[var(--text-muted)] font-light mt-0.5">
              Our dispute &amp; concierge desk responds within 24–48 business hours.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/track-order"
              className="px-5 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[11px] font-mono-luxury uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Track or Report Order
            </Link>
            <Link
              href="/shop"
              className="px-5 py-2.5 rounded-full border border-[var(--border-subtle)] text-[var(--text-primary)] text-[11px] font-mono-luxury uppercase tracking-wider hover:border-[var(--gold-accent)]/60 transition-colors"
            >
              Explore ÌRÍSÍ
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
