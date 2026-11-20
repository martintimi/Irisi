'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCheck, RefreshCw, X, Sparkles, ShoppingBag, ChevronRight, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { supabase } from '@/lib/supabase/client';
import { useBodyScrollLock } from '@/lib/utils/useBodyScrollLock';

interface LiveShopperAlert {
  id: string;
  kind: 'vendor_story' | 'new_product' | 'order_status' | string;
  vendorId?: string;
  vendorName?: string;
  vendorAvatar?: string;
  title: string;
  message: string;
  actionUrl?: string;
  createdAt: string;
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return 'Just now';
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return iso;
  const diffMin = Math.floor((Date.now() - ts) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ShopperNotificationBell({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const {
    followedVendors,
    userAuth,
    userNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const [liveAlerts, setLiveAlerts] = useState<LiveShopperAlert[]>([]);
  const [readIds, setReadIds] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const instanceIdRef = useRef<string>(Math.random().toString(36).slice(2, 9));

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('irisi_shopper_read_alerts');
      if (saved) setReadIds(JSON.parse(saved));
    } catch {}
  }, []);

  const isMobileViewport = mounted && typeof window !== 'undefined' && window.innerWidth < 768;
  useBodyScrollLock(isOpen && isMobileViewport);

  const followedKey = Array.isArray(followedVendors) ? followedVendors.join(',') : '';
  const shopperEmail = (userAuth?.email || '').trim().toLowerCase();

  const fetchAlerts = useCallback(async () => {
    if (!followedKey && !shopperEmail) {
      setLiveAlerts([]);
      return;
    }
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (followedKey) params.set('followedVendors', followedKey);
      if (shopperEmail) params.set('email', shopperEmail);
      const res = await fetch(`/api/shopper/notifications?${params.toString()}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.notifications)) {
        setLiveAlerts(data.notifications);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  }, [followedKey, shopperEmail]);

  useEffect(() => {
    fetchAlerts();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(`shopper-alerts-${instanceIdRef.current}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload) => {
            const row = payload.new as any;
            if (row?.type === 'follower_alert') {
              fetchAlerts();
            }
          }
        )
        .subscribe();
    } catch {}

    const handleReturnFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchAlerts();
      }
    };
    window.addEventListener('focus', fetchAlerts);
    document.addEventListener('visibilitychange', handleReturnFocus);

    return () => {
      window.removeEventListener('focus', fetchAlerts);
      document.removeEventListener('visibilitychange', handleReturnFocus);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, [fetchAlerts]);

  // Close desktop popover on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (typeof window !== 'undefined' && window.innerWidth < 768) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Combine live DB follower alerts + local order/system notifications
  const combinedItems: Array<LiveShopperAlert & { isRead: boolean; isLocal?: boolean }> = [
    ...liveAlerts.map((a) => ({
      ...a,
      isRead: !!readIds[a.id],
    })),
    ...(userNotifications || []).map((n) => ({
      id: n.id,
      kind: n.type || 'order_status',
      title: n.title,
      message: n.message,
      actionUrl: n.actionUrl || '/track-order',
      createdAt: n.timestamp,
      isRead: !!n.read || !!readIds[n.id],
      isLocal: true,
    })),
  ];

  const unreadCount = combinedItems.filter((item) => !item.isRead).length;
  const visibleItems =
    filterTab === 'unread' ? combinedItems.filter((item) => !item.isRead) : combinedItems;

  const markRead = (item: LiveShopperAlert & { isLocal?: boolean }) => {
    const next = { ...readIds, [item.id]: true };
    setReadIds(next);
    try {
      localStorage.setItem('irisi_shopper_read_alerts', JSON.stringify(next));
    } catch {}
    if (item.isLocal) {
      markNotificationAsRead(item.id);
    }
  };

  const handleMarkAllRead = () => {
    const next: Record<string, boolean> = { ...readIds };
    combinedItems.forEach((it) => {
      next[it.id] = true;
    });
    setReadIds(next);
    try {
      localStorage.setItem('irisi_shopper_read_alerts', JSON.stringify(next));
    } catch {}
    markAllNotificationsAsRead();
  };

  const handleItemClick = (item: LiveShopperAlert & { isLocal?: boolean }) => {
    markRead(item);
    setIsOpen(false);
    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  const renderRows = () => {
    if (visibleItems.length === 0) {
      return (
        <div className="py-12 px-6 text-center space-y-2">
          <div className="h-11 w-11 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
            <CheckCircle className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <p className="font-editorial text-lg text-[var(--text-primary)]">
            {filterTab === 'unread' ? 'All Caught Up' : 'No Updates Yet'}
          </p>
          <p className="text-xs text-[var(--text-muted)] font-light max-w-[240px] mx-auto">
            Follow brands on Shop to get instant alerts whenever they post new stories or drop new pieces.
          </p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-[var(--border-subtle)]">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleItemClick(item)}
            className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors active:bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/70 cursor-pointer ${
              !item.isRead ? 'bg-[var(--gold-accent)]/[0.04]' : ''
            }`}
          >
            {item.vendorAvatar ? (
              <div className="relative h-10 w-10 rounded-full overflow-hidden border border-[var(--gold-accent)]/40 shrink-0 bg-zinc-900">
                <Image src={item.vendorAvatar} alt={item.vendorName || ''} fill unoptimized className="object-cover" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--gold-accent)] flex items-center justify-center shrink-0">
                {item.kind === 'vendor_story' ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <ShoppingBag className="h-4 w-4" />
                )}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[13px] font-medium text-[var(--text-primary)] leading-snug line-clamp-1">
                  {item.title}
                </span>
                <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                  <span className="text-[10px] font-mono-luxury text-[var(--text-muted)]">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                  {!item.isRead && <span className="h-2 w-2 rounded-full bg-[var(--gold-accent)]" />}
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-light mt-0.5 leading-relaxed line-clamp-2">
                {item.message}
              </p>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) fetchAlerts();
        }}
        className={`relative rounded-full flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
          compact
            ? 'h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            : 'p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--badge-bg)]'
        }`}
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className={compact ? 'h-[18px] w-[18px]' : 'h-5 w-5'} strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-[var(--gold-accent)] text-black text-[9px] font-mono-luxury flex items-center justify-center ring-2 ring-[var(--bg-primary)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* DESKTOP POPOVER (md+) */}
      {isOpen && (
        <div className="hidden md:block absolute right-0 mt-3 w-[380px] rounded-3xl surface-card border border-[var(--border-subtle)] shadow-[0_24px_60px_rgba(0,0,0,0.22)] z-50 overflow-hidden animate-fadeIn">
          <div className="px-5 pt-4 pb-3 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-editorial text-xl font-normal text-[var(--text-primary)]">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-[10px] font-mono-luxury">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={fetchAlerts}
                disabled={isLoading}
                className="h-7 w-7 rounded-full border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex p-0.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[10px] font-mono-luxury uppercase">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`px-3 py-1 rounded-full cursor-pointer ${
                    filterTab === 'all'
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  All ({combinedItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('unread')}
                  className={`px-3 py-1 rounded-full cursor-pointer ${
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
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] hover:underline cursor-pointer"
                >
                  <CheckCheck className="h-3 w-3" />
                  <span>Mark read</span>
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">{renderRows()}</div>

          <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30">
            <Link
              href="/shop"
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[11px] font-mono-luxury uppercase tracking-wider text-[var(--text-primary)] flex items-center justify-center gap-1"
            >
              <span>Browse Live Stories &amp; Drops</span>
              <ChevronRight className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
            </Link>
          </div>
        </div>
      )}

      {/* MOBILE NATIVE SLIDE-UP ACTIVITY SHEET (< md) */}
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
              className="w-full max-h-[82vh] rounded-t-[30px] bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] shadow-[0_-20px_60px_rgba(0,0,0,0.45)] flex flex-col overflow-hidden"
            >
              <div className="pt-3 pb-1 flex justify-center shrink-0">
                <span className="h-1 w-10 rounded-full bg-[var(--border-hover)]" />
              </div>

              <div className="px-5 pt-2 pb-3.5 border-b border-[var(--border-subtle)] space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-editorial text-2xl font-normal text-[var(--text-primary)]">
                      Activity
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-[10px] font-mono-luxury">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchAlerts}
                      disabled={isLoading}
                      className="h-8 w-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex p-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[11px] font-mono-luxury">
                    <button
                      type="button"
                      onClick={() => setFilterTab('all')}
                      className={`px-3.5 py-1 rounded-full cursor-pointer ${
                        filterTab === 'all'
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      All ({combinedItems.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTab('unread')}
                      className={`px-3.5 py-1 rounded-full cursor-pointer ${
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
                      onClick={handleMarkAllRead}
                      className="inline-flex items-center gap-1 text-[11px] font-mono-luxury text-[var(--gold-accent)] cursor-pointer"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      <span>Mark read</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain">{renderRows()}</div>

              <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
                <Link
                  href="/shop"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <span>Explore Shop &amp; Stories</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
