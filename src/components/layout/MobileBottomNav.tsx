'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { Home, Search, ShoppingBag, Heart, CircleUserRound } from 'lucide-react';

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
    (pathname.startsWith('/shop/') && pathname.split('/').length >= 3 && pathname.split('/')[2] !== '');

  useEffect(() => {
    if (typeof window === 'undefined' || isStandalonePage) return;

    const resetInactivityTimer = () => {
      setIsVisible(true);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        if (window.scrollY > 120) setIsVisible(false);
      }, 4000);
    };

    const handleScroll = () => {
      const y = window.scrollY;
      if (y <= 30) {
        setIsVisible(true);
        resetInactivityTimer();
        lastScrollY.current = y;
        return;
      }
      if (y > lastScrollY.current + 12) {
        setIsVisible(false);
      } else if (y < lastScrollY.current - 12) {
        setIsVisible(true);
        resetInactivityTimer();
      }
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
  const isLoggedIn = userAuth?.isLoggedIn;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav
      className={`fixed bottom-0 inset-x-0 z-40 md:hidden transition-transform duration-300 ease-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-white/95 dark:bg-[#0A0A0C]/95 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800">
        <div className="grid grid-cols-5 h-[54px] max-w-md mx-auto items-center px-2">

          {/* 1. Home */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              isActive('/')
                ? 'text-black dark:text-white font-semibold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Home
              strokeWidth={isActive('/') ? 2 : 1.3}
              className={`h-[21px] w-[21px] ${isActive('/') ? 'fill-current' : ''}`}
            />
            <span className="text-[10px] tracking-tight leading-none">Home</span>
          </Link>

          {/* 2. Shop */}
          <Link
            href="/shop"
            className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              isActive('/shop')
                ? 'text-black dark:text-white font-semibold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Search
              strokeWidth={isActive('/shop') ? 2.2 : 1.4}
              className="h-[21px] w-[21px]"
            />
            <span className="text-[10px] tracking-tight leading-none">Shop</span>
          </Link>

          {/* 3. Bag */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-1 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer relative"
            aria-label="Shopping Bag"
          >
            <div className="relative">
              <ShoppingBag
                strokeWidth={1.4}
                className="h-[21px] w-[21px]"
              />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1.5 h-3.5 min-w-[14px] px-1 rounded-full bg-black dark:bg-white text-white dark:text-black text-[8px] font-bold flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight leading-none">Bag</span>
          </button>

          {/* 4. Wishlist */}
          <button
            type="button"
            onClick={() => setIsVaultOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-1 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer relative"
            aria-label="Wishlist"
          >
            <div className="relative">
              <Heart
                strokeWidth={1.4}
                className="h-[21px] w-[21px]"
              />
              {vaultCount > 0 && (
                <span className="absolute -top-1 -right-1.5 h-3.5 min-w-[14px] px-1 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center">
                  {vaultCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight leading-none">Wishlist</span>
          </button>

          {/* 5. Me */}
          <Link
            href={isLoggedIn ? '/profile' : '/auth'}
            className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              isActive('/profile') || isActive('/auth')
                ? 'text-black dark:text-white font-semibold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <CircleUserRound
              strokeWidth={isActive('/profile') || isActive('/auth') ? 2 : 1.4}
              className="h-[21px] w-[21px]"
            />
            <span className="text-[10px] tracking-tight leading-none">Me</span>
          </Link>

        </div>
        {/* iOS safe area spacing */}
        <div className="h-safe-area-bottom" />
      </div>
    </nav>
  );
}
