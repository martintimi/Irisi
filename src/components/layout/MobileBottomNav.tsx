'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { Home, Search, ShoppingBag, Heart, CircleUserRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cart, userAuth, vault, lastAddedCartItem, clearLastAddedCartItem } = useStore();
  const [isVisible, setIsVisible] = useState(true);
  const [bagBounce, setBagBounce] = useState(false);
  const [flyingItem, setFlyingItem] = useState<{ name: string; imageUrl?: string } | null>(null);

  const lastScrollY = useRef(0);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isStandalonePage =
    pathname.startsWith('/auth') ||
    pathname.startsWith('/vendor') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/checkout') ||
    (pathname.startsWith('/shop/') && pathname.split('/').length >= 3 && pathname.split('/')[2] !== '');

  // Handle Add to Bag micro-animation ("throw to bag")
  useEffect(() => {
    if (!lastAddedCartItem) return;

    setFlyingItem({
      name: lastAddedCartItem.name,
      imageUrl: lastAddedCartItem.imageUrl,
    });

    const bounceTimer = setTimeout(() => {
      setBagBounce(true);
      setTimeout(() => setBagBounce(false), 450);
    }, 400);

    const cleanupTimer = setTimeout(() => {
      setFlyingItem(null);
      clearLastAddedCartItem();
    }, 550);

    return () => {
      clearTimeout(bounceTimer);
      clearTimeout(cleanupTimer);
    };
  }, [lastAddedCartItem, clearLastAddedCartItem]);

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
    <>
      {/* Flying Item Throw to Bag at Bottom Nav */}
      <AnimatePresence>
        {flyingItem && (
          <motion.div
            initial={{ top: '45%', left: '50%', scale: 1, opacity: 1, x: '-50%', y: '-50%' }}
            animate={{
              top: 'calc(100vh - 35px)',
              left: '50%',
              scale: 0.18,
              opacity: 0.15,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
            className="fixed z-50 pointer-events-none"
          >
            <div className="relative h-16 w-16 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-2xl bg-black">
              {flyingItem.imageUrl ? (
                <Image
                  src={flyingItem.imageUrl}
                  alt={flyingItem.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-amber-400 text-black">
                  <ShoppingBag className="h-6 w-6" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      <nav
        className={`fixed bottom-0 inset-x-0 z-40 md:hidden transition-transform duration-300 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-white/95 dark:bg-[#0A0A0C]/95 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800">
          <div className="grid grid-cols-5 h-[62px] max-w-md mx-auto items-center px-2 py-1">

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

            {/* 3. Bag (with dynamic bounce on add-to-bag) */}
            <Link
              href="/cart"
              className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors relative ${
                isActive('/cart')
                  ? 'text-black dark:text-white font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
              aria-label="Shopping Bag"
            >
              <div className={`relative transition-transform duration-300 ${bagBounce ? 'scale-125' : 'scale-100'}`}>
                <ShoppingBag
                  strokeWidth={isActive('/cart') ? 2 : 1.3}
                  className={`h-[21px] w-[21px] transition-colors ${bagBounce ? 'text-amber-500 fill-amber-500/20' : ''}`}
                />
                {totalCartCount > 0 && (
                  <span className={`absolute -top-1 -right-1.5 h-3.5 min-w-[14px] px-1 rounded-full text-[8px] font-bold flex items-center justify-center transition-all ${
                    bagBounce ? 'bg-amber-500 text-black scale-110' : 'bg-black dark:bg-white text-white dark:text-black'
                  }`}>
                    {totalCartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight leading-none">Bag</span>
            </Link>

            {/* 4. Wishlist */}
            <Link
              href="/wishlist"
              className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors relative ${
                isActive('/wishlist')
                  ? 'text-black dark:text-white font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
              aria-label="Wishlist"
            >
              <div className="relative">
                <Heart
                  strokeWidth={isActive('/wishlist') ? 2 : 1.3}
                  className={`h-[21px] w-[21px] ${isActive('/wishlist') ? 'fill-current text-rose-500' : ''}`}
                />
                {vaultCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 h-3.5 min-w-[14px] px-1 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center">
                    {vaultCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight leading-none">Wishlist</span>
            </Link>

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
    </>
  );
}
