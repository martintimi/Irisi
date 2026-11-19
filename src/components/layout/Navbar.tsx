'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import {
  ShoppingBag, Sun, Moon, SlidersHorizontal, User, LogOut, Heart
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import BrandWordmark from '@/components/common/BrandWordmark';
import ShopperNotificationBell from '@/components/common/ShopperNotificationBell';

export default function Navbar() {
  const pathname = usePathname();
  const {
    theme,
    toggleTheme,
    cart,
    setIsCartOpen,
    vault,
    setIsVaultOpen,
    userAuth,
    logout,
  } = useStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Consumer shopper navigation links
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/studio', label: 'Outfit Studio', badge: 'Coming Soon' },
    { href: '/shop', label: 'Shop Catalog' },
  ];

  return (
    <header className="w-full border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/98 backdrop-blur-2xl transition-all shadow-xs">
      {/* 100% Full-Width Edge-to-Edge Navigation Bar (Taller & Larger Typography) */}
      <div className="w-full flex h-20 items-center justify-between px-4 sm:px-8 lg:px-12">
        
        {/* Left: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7">
          <div className="flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-sm tracking-wider uppercase font-normal transition-all py-1.5 ${
                    isActive
                      ? 'text-[var(--text-primary)] font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono-luxury bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 font-normal">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Center: Official Brand Wordmark (Ì R Í S Í) */}
        <div className="flex items-center justify-center">
          <BrandWordmark size="md" />
        </div>

        {/* Right Actions: Notifications + Theme Toggle + User Profile + Shopping Bag */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Light / Dark Mode Switcher */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--badge-bg)] transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-amber-300 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="h-5 w-5 text-zinc-700 transition-transform hover:-rotate-12" />
              )}
            </button>
          )}

          {/* Live Shopper Notifications Bell (Followed Vendor Stories, Drops & Order Updates) */}
          <ShopperNotificationBell />

          {/* User Profile / Dashboard Link */}
          {userAuth.isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] hover:border-[var(--gold-accent)] transition-all group shadow-sm"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] font-bold text-xs">
                  {userAuth.name.charAt(0)}
                </div>
                <span className="font-bold text-xs truncate max-w-[100px]">
                  {userAuth.name.split(' ')[0]}
                </span>
                <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--text-muted)] group-hover:text-[var(--gold-accent)] transition-colors" />
              </Link>

              <button
                onClick={logout}
                className="p-2 rounded-full text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury text-xs uppercase tracking-wider font-bold hover:opacity-90 transition-all shadow-md"
            >
              <User className="h-4 w-4" />
              <span>Sign In / Join</span>
            </Link>
          )}

          {/* Wishlist */}
          <Link
            href="/wishlist"
            className="relative flex items-center justify-center h-11 w-11 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--gold-accent)] hover:text-[var(--gold-accent)] transition-all shadow-sm"
            title="My Wishlist"
            aria-label="Open Wishlist"
          >
            <Heart className="h-5 w-5" strokeWidth={1.5} />
            {vault.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white shadow-md">
                {vault.length}
              </span>
            )}
          </Link>

          {/* Shopping Bag */}
          <Link
            href="/cart"
            className="relative flex items-center justify-center h-11 w-11 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-all shadow-sm"
            title="Shopping Bag"
            aria-label="Open Shopping Bag"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black dark:bg-white text-[11px] font-bold text-white dark:text-black shadow-md">
                {totalCartCount}
              </span>
            )}
          </Link>
        </div>

      </div>
    </header>
  );
}
