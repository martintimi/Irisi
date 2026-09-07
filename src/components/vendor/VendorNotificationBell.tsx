'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Package, DollarSign, Star, CheckCircle, ExternalLink, RefreshCw, AlertCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getActiveVendorId } from '@/lib/services/apiClient';

export default function VendorNotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [readIds, setReadIds] = useState<Record<string, boolean>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeVendorId = getActiveVendorId();

  // Load read notification IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`veyra_read_notifs_${activeVendorId}`);
      if (stored) {
        setReadIds(JSON.parse(stored));
      }
    } catch (e) {}
  }, [activeVendorId]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/vendor/notifications?vendorId=${encodeURIComponent(activeVendorId)}`, {
        headers: { 'Cache-Control': 'no-cache' }
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
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s for live updates
    return () => clearInterval(interval);
  }, [activeVendorId]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !readIds[n.id]).length;

  const markAllRead = () => {
    const newReadMap: Record<string, boolean> = { ...readIds };
    notifications.forEach(n => {
      newReadMap[n.id] = true;
    });
    setReadIds(newReadMap);
    try {
      localStorage.setItem(`veyra_read_notifs_${activeVendorId}`, JSON.stringify(newReadMap));
    } catch (e) {}
  };

  const handleNotificationClick = (notif: any) => {
    // Mark as read
    const newReadMap = { ...readIds, [notif.id]: true };
    setReadIds(newReadMap);
    try {
      localStorage.setItem(`veyra_read_notifs_${activeVendorId}`, JSON.stringify(newReadMap));
    } catch (e) {}

    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--gold-accent)] transition-all cursor-pointer shadow-sm"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-[var(--gold-accent)] text-black text-[9px] font-mono-luxury font-bold flex items-center justify-center animate-pulse shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl surface-card border border-[var(--border-subtle)] shadow-2xl z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
            <div className="flex items-center gap-2">
              <span className="font-editorial text-sm font-bold text-[var(--text-primary)]">
                Live Store Activity
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-[10px] font-mono-luxury font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[10px] font-mono-luxury text-[var(--gold-accent)] hover:underline uppercase font-bold cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={fetchNotifications}
                disabled={isLoading}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border-subtle)]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono-luxury text-[var(--text-muted)]">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-[var(--border-subtle)]" />
                No store notifications yet.
              </div>
            ) : (
              notifications.map((n) => {
                const isRead = !!readIds[n.id];
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 transition-colors cursor-pointer flex items-start gap-3 hover:bg-[var(--bg-secondary)] ${
                      !isRead ? 'bg-[var(--gold-accent)]/[0.04]' : ''
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs ${
                      n.type === 'stock_out'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : n.type === 'stock_low' || n.type === 'variant_sold_out'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : n.type === 'escrow_released'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : n.type === 'review_received'
                        ? 'bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {n.type === 'stock_out' ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : n.type === 'stock_low' || n.type === 'variant_sold_out' ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : n.type === 'escrow_released' ? (
                        <DollarSign className="h-4 w-4" />
                      ) : n.type === 'review_received' ? (
                        <Star className="h-4 w-4 fill-current" />
                      ) : (
                        <Package className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-[var(--text-primary)] truncate">
                          {n.title}
                        </span>
                        {!isRead && (
                          <span className="h-2 w-2 rounded-full bg-[var(--gold-accent)] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] font-mono-luxury mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <div className="text-[9px] font-mono-luxury text-[var(--text-muted)] mt-1">
                        {new Date(n.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-[var(--border-subtle)] text-center bg-[var(--bg-secondary)]/30">
            <Link
              href="/vendor-portal/orders"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold hover:underline"
            >
              View All Orders & Deliveries →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
