'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { Home, Tag, ShoppingBag, Bookmark, CircleUserRound, LogIn, Heart } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cart, setIsCartOpen, userAuth, vault, setIsVaultOpen } = useStore();
  const [isVisible, setIsVisible] = useState(true);

  const lastScrollY = useRef(0);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isStandalonePage =
    pathname.startsWith('/auth') ||
    pathname.startsWith('/vendor') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/checkout') ||
    // Hide on individual product pages — too much overlap with buy buttons
    (pathname.startsWith('/shop/') && pathname.split('/').length >= 3 && pathname.split('/')[2] !== '');

  useEffect(() => {
    if (typeof window === 'undefined' || isStandalonePage) return;

    const resetInactivityTimer = () => {
      setIsVisible(true);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        if (window.scrollY > 80) setIsVisible(false);
      }, 3500);
    };

    const handleScroll = () => {
      const y = window.scrollY;
      if (y <= 20) { setIsVisible(true); resetInactivityTimer(); lastScrollY.current = y; return; }
      if (y > lastScrollY.current + 8) setIsVisible(false);
      else if (y < lastScrollY.current - 8) { setIsVisible(true); resetInactivityTimer(); }
      lastScrollY.current = y;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', resetInactivityTimer, { passive: true });
    window.addEventListener('click', resetInactivityTimer, { passive: true });
    resetInactivityTimer();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', resetInactivityTimer);
      window.removeEventListener('click', resetInactivityTimer);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [isStandalonePage, pathname]);

  if (isStandalonePage) return null;

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const vaultCount = vault.length;
  const isLoggedIn = userAuth.isLoggedIn;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <nav
        className={`fixed bottom-0 inset-x-0 z-40 md:hidden transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="relative bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] shadow-[0_-1px_12px_rgba(0,0,0,0.08)]">

          {/* Thin gold shimmer line across top */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--gold-accent)]/30 to-transparent" />

          <div className="flex items-end justify-around h-[62px] px-1 max-w-md mx-auto pb-1">

            {/* Feed / Home */}
            <Link href="/" className="flex flex-col items-center justify-center gap-[3px] w-14 pt-2 relative group">
              {isActive('/') && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full bg-[var(--gold-accent)]" />
              )}
              <Home
                strokeWidth={isActive('/') ? 2 : 1.5}
                className={`h-[21px] w-[21px] transition-all ${isActive('/') ? 'text-[var(--gold-accent)]' : 'text-[var(--text-secondary)]'}`}
              />
              <span className={`text-[9px] uppercase tracking-wider font-medium transition-colors ${isActive('/') ? 'text-[var(--gold-accent)]' : 'text-[var(--text-secondary)]'}`}>
                Feed
              </span>
            </Link>

            {/* Shop */}
            <Link href="/shop" className="flex flex-col items-center justify-center gap-[3px] w-14 pt-2 relative">
              {isActive('/shop') && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full bg-[var(--gold-accent)]" />
              )}
              <Tag
                strokeWidth={isActive('/shop') ? 2 : 1.5}
                className={`h-[21px] w-[21px] transition-all ${isActive('/shop') ? 'text-[var(--gold-accent)]' : 'text-[var(--text-secondary)]'}`}
              />
              <span className={`text-[9px] uppercase tracking-wider font-medium transition-colors ${isActive('/shop') ? 'text-[var(--gold-accent)]' : 'text-[var(--text-secondary)]'}`}>
                Shop
              </span>
            </Link>

            {/* Vault / Saved — elevated center CTA */}
            <button
              type="button"
              onClick={() => setIsVaultOpen(true)}
              className="flex flex-col items-center justify-center gap-[3px] w-16 relative -mt-5 cursor-pointer"
              aria-label="Wardrobe Vault"
            >
              <div className="relative h-[52px] w-[52px] rounded-2xl bg-gradient-to-br from-[var(--gold-accent)] to-amber-700 shadow-[0_6px_24px_rgba(196,151,46,0.4)] flex items-center justify-center active:scale-95 transition-transform">
                <Bookmark className="h-[22px] w-[22px] text-black" strokeWidth={2} />
                {vaultCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-[18px] min-w-[18px] px-1 rounded-full bg-white text-black text-[9px] font-bold flex items-center justify-center shadow-md">
                    {vaultCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--gold-accent)]">
                Vault
              </span>
            </button>

            {/* Bag */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex flex-col items-center justify-center gap-[3px] w-14 pt-2 relative cursor-pointer"
              aria-label="Shopping Bag"
            >
              <div className="relative">
                <ShoppingBag
                  strokeWidth={1.5}
                  className="h-[21px] w-[21px] text-[var(--text-secondary)]"
                />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-[14px] min-w-[14px] px-0.5 rounded-full bg-[var(--gold-accent)] text-black text-[8px] font-bold flex items-center justify-center">
                    {totalCartCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] uppercase tracking-wider font-medium text-[var(--text-secondary)]">Bag</span>
            </button>

            {/* Account / Login */}
            <Link
              href={isLoggedIn ? '/profile' : '/auth'}
              className="flex flex-col items-center justify-center gap-[3px] w-14 pt-2 relative"
            >
              {(isActive('/profile') || isActive('/auth')) && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full bg-[var(--gold-accent)]" />
              )}
              {isLoggedIn ? (
                <>
                  <div className="h-[21px] w-[21px] rounded-full bg-[var(--gold-accent)] flex items-center justify-center">
                    <span className="text-[9px] font-bold text-black leading-none">
                      {(userAuth.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className={`text-[9px] uppercase tracking-wider font-medium transition-colors ${isActive('/profile') ? 'text-[var(--gold-accent)]' : 'text-[var(--text-secondary)]'}`}>
                    Profile
                  </span>
                </>
              ) : (
                <>
                  <LogIn strokeWidth={1.5} className="h-[21px] w-[21px] text-[var(--text-secondary)]" />
                  <span className="text-[9px] uppercase tracking-wider font-medium text-[var(--text-secondary)]">Login</span>
                </>
              )}
            </Link>

          </div>
          {/* iOS safe area */}
          <div className="h-safe-area-bottom" />
        </div>
      </nav>
    </>
  );
}
