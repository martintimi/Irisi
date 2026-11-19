'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell, Package, DollarSign, Star, CheckCircle, RefreshCw,
  AlertCircle, AlertTriangle, X, CheckCheck, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getActiveVendorId } from '@/lib/services/apiClient';
import { supabase } from '@/lib/supabase/client';
import { useBodyScrollLock } from '@/lib/utils/useBodyScrollLock';

function stripLeadingEmojis(text: string): string {
  return String(text || '')
    .replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/gu, '')
    .replace(/⭐/g, '★')
    .trim();
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return 'Just now';
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return '';
  const diffMin = Math.floor((Date.now() - ts) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function VendorNotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [readIds, setReadIds] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeVendorId = getActiveVendorId();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background page scroll on mobile while native sheet is open
  const isMobileViewport = mounted && typeof window !== 'undefined' && window.innerWidth < 768;
  useBodyScrollLock(isOpen && isMobileViewport);

  // Load read notification IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`veyra_read_notifs_${activeVendorId}`);
      if (stored) {
        setReadIds(JSON.parse(stored));
      }
    } catch {}
  }, [activeVendorId]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/vendor/notifications?vendorId=${encodeURIComponent(activeVendorId)}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel(`vendor-notifs-${activeVendorId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchNotifications();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeVendorId]);

  // Close desktop popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (typeof window !== 'undefined' && window.innerWidth < 768) return;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !readIds[n.id]).length;
  const visibleNotifications =
    filterTab === 'unread' ? notifications.filter((n) => !readIds[n.id]) : notifications;

  const markAllRead = () => {
    const newReadMap: Record<string, boolean> = { ...readIds };
    notifications.forEach((n) => {
      newReadMap[n.id] = true;
    });
    setReadIds(newReadMap);
    try {
      localStorage.setItem(`veyra_read_notifs_${activeVendorId}`, JSON.stringify(newReadMap));
    } catch {}
  };

  const handleNotificationClick = (notif: any) => {
    const newReadMap = { ...readIds, [notif.id]: true };
    setReadIds(newReadMap);
    try {
      localStorage.setItem(`veyra_read_notifs_${activeVendorId}`, JSON.stringify(newReadMap));
    } catch {}

    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const renderIcon = (type: string) => {
    if (type === 'stock_out') {
      return (
        <div className="h-10 w-10 rounded-2xl bg-rose-500/15 text-rose-500 border border-rose-500/25 flex items-center justify-center shrink-0">
          <AlertCircle className="h-4 w-4" />
        </div>
      );
    }
    if (type === 'stock_low' || type === 'variant_sold_out') {
      return (
        <div className="h-10 w-10 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/25 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-4 w-4" />
        </div>
      );
    }
    if (type === 'escrow_released') {
      return (
        <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 flex items-center justify-center shrink-0">
          <DollarSign className="h-4 w-4" />
        </div>
      );
    }
    if (type === 'review_received') {
      return (
        <div className="h-10 w-10 rounded-2xl bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/25 flex items-center justify-center shrink-0">
          <Star className="h-4 w-4 fill-current" />
        </div>
      );
    }
    return (
      <div className="h-10 w-10 rounded-2xl bg-sky-500/15 text-sky-500 border border-sky-500/25 flex items-center justify-center shrink-0">
        <Package className="h-4 w-4" />
      </div>
    );
  };

  const renderListItems = () => {
    if (visibleNotifications.length === 0) {
      return (
        <div className="py-12 px-6 text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
            <CheckCircle className="h-5 w-5" />
          </div>
          <p className="font-editorial text-lg text-[var(--text-primary)]">
            {filterTab === 'unread' ? 'All Caught Up' : 'No Activity Yet'}
          </p>
          <p className="text-xs text-[var(--text-muted)] font-light">
            {filterTab === 'unread'
              ? 'You have reviewed every recent store alert.'
              : 'New orders, escrow payouts, reviews, and stock alerts will appear here live.'}
          </p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-[var(--border-subtle)]">
        {visibleNotifications.map((n) => {
          const isRead = !!readIds[n.id];
          const cleanTitle = stripLeadingEmojis(n.title);
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => handleNotificationClick(n)}
              className={`w-full text-left px-4 sm:px-5 py-3.5 transition-colors cursor-pointer flex items-start gap-3.5 active:bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/70 ${
                !isRead ? 'bg-[var(--gold-accent)]/[0.04]' : ''
              }`}
            >
              {renderIcon(n.type)}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13px] font-medium text-[var(--text-primary)] leading-snug line-clamp-1">
                    {cleanTitle}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    <span className="text-[10px] font-mono-luxury text-[var(--text-muted)]">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                    {!isRead && (
                      <span className="h-2 w-2 rounded-full bg-[var(--gold-accent)]" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-light mt-0.5 leading-relaxed line-clamp-2">
                  {n.message}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Clean Native-Style Bell Trigger */}
      <button
        type="button"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) fetchNotifications();
        }}
        className="relative h-9 w-9 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--gold-accent)] hover:border-[var(--gold-accent)]/40 flex items-center justify-center transition-all cursor-pointer active:scale-95"
        aria-label="Store Activity Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] px-1 rounded-full bg-[var(--gold-accent)] text-black text-[9px] font-mono-luxury font-medium flex items-center justify-center ring-2 ring-[var(--bg-primary)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* DESKTOP (md+): Refined Right-Aligned Popover */}
      {isOpen && (
        <div className="hidden md:block absolute right-0 mt-3 w-[390px] rounded-3xl surface-card border border-[var(--border-subtle)] shadow-[0_24px_60px_rgba(0,0,0,0.22)] z-50 overflow-hidden animate-fadeIn">
          <div className="px-5 pt-4 pb-3 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-editorial text-xl font-normal text-[var(--text-primary)]">
                  Store Activity
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-[10px] font-mono-luxury">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={fetchNotifications}
                disabled={isLoading}
                className="h-7 w-7 rounded-full border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                title="Refresh activity"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex p-0.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[10px] font-mono-luxury uppercase">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                    filterTab === 'all'
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('unread')}
                  className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                    filterTab === 'unread'
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--gold-accent)] hover:underline cursor-pointer"
                >
                  <CheckCheck className="h-3 w-3" />
                  <span>Mark read</span>
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">{renderListItems()}</div>

          <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30">
            <Link
              href="/vendor-portal/orders"
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/50 text-[11px] font-mono-luxury uppercase tracking-wider text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-all"
            >
              <span>View All Orders &amp; Deliveries</span>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
            </Link>
          </div>
        </div>
      )}

      {/* MOBILE (< md): Native App Slide-Up Activity Sheet (Portaled to document.body) */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            className="md:hidden fixed inset-0 z-[80] flex flex-col justify-end bg-black/60 backdrop-blur-md animate-fadeIn"
            onClick={() => setIsOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              data-lenis-prevent="true"
              className="w-full max-h-[84vh] rounded-t-[30px] bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] shadow-[0_-20px_60px_rgba(0,0,0,0.45)] flex flex-col overflow-hidden"
            >
              {/* iOS-Style Grab Handle */}
              <div className="pt-3 pb-1 flex justify-center shrink-0">
                <span className="h-1 w-10 rounded-full bg-[var(--border-hover)]" />
              </div>

              {/* Native App Sheet Header */}
              <div className="px-5 pt-2 pb-3.5 border-b border-[var(--border-subtle)] space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-editorial text-2xl font-normal text-[var(--text-primary)]">
                      Activity
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/25 text-[var(--gold-accent)] text-[10px] font-mono-luxury">
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchNotifications}
                      disabled={isLoading}
                      className="h-8 w-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] cursor-pointer"
                      aria-label="Refresh notifications"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] cursor-pointer"
                      aria-label="Close notifications"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Filter Tabs + Mark Read */}
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex p-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[11px] font-mono-luxury">
                    <button
                      type="button"
                      onClick={() => setFilterTab('all')}
                      className={`px-3.5 py-1 rounded-full transition-colors cursor-pointer ${
                        filterTab === 'all'
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTab('unread')}
                      className={`px-3.5 py-1 rounded-full transition-colors cursor-pointer ${
                        filterTab === 'unread'
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      Unread ({unreadCount})
                    </button>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="inline-flex items-center gap-1 text-[11px] font-mono-luxury text-[var(--gold-accent)] cursor-pointer"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Notification Feed */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {renderListItems()}
              </div>

              {/* Sticky Native Sheet Bottom CTA */}
              <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
                <Link
                  href="/vendor-portal/orders"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <span>View All Orders &amp; Deliveries</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
