'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import {
  X, Copy, Check, ExternalLink, Share2, ShieldCheck, MessageCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useBodyScrollLock } from '@/lib/utils/useBodyScrollLock';

interface ShareStoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  brandName: string;
  logoUrl?: string;
  storeSlug: string;
  storeUrl: string;
}

export default function ShareStoreSheet({
  isOpen,
  onClose,
  brandName,
  logoUrl,
  storeSlug,
  storeUrl,
}: ShareStoreSheetProps) {
  const [copied, setCopied] = useState(false);
  useBodyScrollLock(isOpen);

  if (!isOpen || typeof document === 'undefined') return null;

  const cleanDisplayUrl = storeUrl.replace(/^https?:\/\//, '');
  const shareMessage = `Shop ${brandName} on ÌRÍSÍ — verified pieces with 100% Escrow protection: ${storeUrl}`;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      confetti({ particleCount: 30, spread: 45, origin: { y: 0.7 } });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${brandName} on ÌRÍSÍ`,
          text: `Shop ${brandName} with 100% Escrow protection on ÌRÍSÍ`,
          url: storeUrl,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  const brandInitial = (brandName || 'I').trim().charAt(0).toUpperCase();

  return createPortal(
    <div
      className="fixed inset-0 z-[85] bg-black/65 backdrop-blur-md flex items-end md:items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
        className="w-full md:max-w-md rounded-t-[30px] md:rounded-[28px] bg-[var(--bg-surface)] border-t md:border border-[var(--border-subtle)] p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:p-6 space-y-5 shadow-[0_-24px_65px_rgba(0,0,0,0.45)]"
      >
        {/* Drag Handle (Mobile) */}
        <div className="md:hidden flex justify-center">
          <span className="h-1 w-10 rounded-full bg-[var(--border-hover)]" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono-luxury uppercase tracking-[0.2em] text-[var(--gold-accent)]">
              Share Your Storefront
            </span>
            <h3 className="font-editorial text-2xl font-normal text-[var(--text-primary)] leading-tight mt-0.5">
              Send Your Store Link
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-light mt-0.5">
              Buyers who tap this link browse your full catalog and pay securely with Escrow.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] shrink-0 cursor-pointer"
            aria-label="Close share sheet"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Clear Link Preview Card so Vendor Knows EXACTLY What They Are Sharing */}
        <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 rounded-full overflow-hidden border border-[var(--gold-accent)]/40 bg-[var(--gold-subtle)] flex items-center justify-center shrink-0">
              {logoUrl ? (
                <Image src={logoUrl} alt={brandName} fill unoptimized className="object-cover" />
              ) : (
                <span className="font-editorial text-lg text-[var(--gold-accent)]">{brandInitial}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[var(--text-primary)] truncate">{brandName}</div>
              <div className="inline-flex items-center gap-1 text-[10px] font-mono-luxury text-emerald-500">
                <ShieldCheck className="h-3 w-3" />
                <span>Verified ÌRÍSÍ Storefront</span>
              </div>
            </div>
          </div>

          <div className="px-3 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between gap-2">
            <span className="text-xs font-mono-luxury text-[var(--text-primary)] truncate select-all">
              {cleanDisplayUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className={`px-3 py-1 rounded-full text-[10px] font-mono-luxury uppercase tracking-wider shrink-0 transition-colors cursor-pointer ${
                copied
                  ? 'bg-emerald-500 text-black'
                  : 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
              }`}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {copied && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-light">
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span>Your store link ({cleanDisplayUrl}) is copied — paste it on Instagram bio, WhatsApp, or TikTok!</span>
            </div>
          )}
        </div>

        {/* Share Channel Actions */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono-luxury uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Share Store Link on WhatsApp</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleNativeShare}
              className="h-11 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-mono-luxury flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
              <span>More Apps</span>
            </button>

            <Link
              href={`/brand/${storeSlug}`}
              target="_blank"
              onClick={onClose}
              className="h-11 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-mono-luxury flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
              <span>Open Store</span>
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
