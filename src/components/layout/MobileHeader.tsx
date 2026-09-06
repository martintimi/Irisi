'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import {
  ShoppingBag, Sun, Moon, Bookmark
} from 'lucide-react';
import BrandWordmark from '@/components/common/BrandWordmark';

export default function MobileHeader() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    theme,
    toggleTheme,
    cart,
    setIsCartOpen,
    vault,
    setIsVaultOpen,
  } = useStore();

  const isStandalonePage =
    pathname.startsWith('/auth') ||
    pathname.startsWith('/vendor') ||
    pathname.startsWith('/admin');

  if (isStandalonePage) return null;

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 w-full md:hidden bg-[var(--bg-primary)]/95 backdrop-blur-xl border-b border-[var(--border-subtle)] transition-all">
      <div className="h-16 flex items-center justify-between px-4">
        
        {/* Left: Official Brand Wordmark */}
        <BrandWordmark size="sm" withSubtitle={false} />

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            suppressHydrationWarning
            className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Toggle theme"
          >
            {mounted ? (
              theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
            ) : (
              <div className="h-4 w-4" />
            )}
          </button>

          {/* Curated Wardrobe Vault */}
          <button
            onClick={() => setIsVaultOpen(true)}
            className="relative p-2 rounded-full text-[var(--text-primary)] transition-all"
            title="Curated Vault"
            aria-label="Vault"
          >
            <Bookmark className="h-5 w-5" />
            {vault.length > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--gold-accent)] text-[9px] font-bold text-black shadow-md">
                {vault.length}
              </span>
            )}
          </button>

          {/* Shopping Bag */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-full text-[var(--text-primary)] transition-all"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {totalCartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--gold-accent)] text-[9px] font-bold text-black shadow-md">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
