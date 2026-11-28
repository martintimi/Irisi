'use client';

import React from 'react';
import { BadgeCheck, Crown } from 'lucide-react';

interface PlusVerifiedBadgeProps {
  variant?: 'pill' | 'compact' | 'icon';
  label?: string;
  className?: string;
}

/**
 * Quiet-luxury Gold Verified Seal for active ÌRÍSÍ Plus brands.
 * Works consistently across brand storefronts, product detail headers, shop cards, and directories.
 */
export default function PlusVerifiedBadge({
  variant = 'pill',
  label = 'ÌRÍSÍ Plus',
  className = '',
}: PlusVerifiedBadgeProps) {
  if (variant === 'icon') {
    return (
      <span
        className={`inline-flex items-center justify-center text-[var(--gold-accent)] shrink-0 ${className}`}
        title="ÌRÍSÍ Plus Verified Brand"
        aria-label="ÌRÍSÍ Plus Verified Brand"
      >
        <BadgeCheck className="h-3.5 w-3.5 fill-[var(--gold-accent)]/15" />
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/40 text-[9px] font-mono-luxury uppercase tracking-wider text-[var(--gold-accent)] shrink-0 ${className}`}
        title="ÌRÍSÍ Plus Verified Brand"
      >
        <BadgeCheck className="h-2.5 w-2.5 shrink-0" />
        <span>Plus</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/45 text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--gold-accent)] shrink-0 ${className}`}
      title="ÌRÍSÍ Plus Verified Brand"
    >
      <Crown className="h-3 w-3 shrink-0" />
      <span>{label}</span>
      <BadgeCheck className="h-3 w-3 shrink-0" />
    </span>
  );
}
