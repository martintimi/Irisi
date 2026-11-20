import React, { Suspense } from 'react';
import MarketplaceGrid from '@/components/shop/MarketplaceGrid';
import MobileShopView from '@/components/shop/MobileShopView';
import MobileStoriesRow from '@/components/mobile/MobileStoriesRow';

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)] animate-pulse" />}>
      {/* 1. DEDICATED MOBILE SHOP VIEW (Instant 2-column feed, clean filters) */}
      <div className="block md:hidden px-4 py-4">
        <MobileShopView />
      </div>

      {/* 2. DESKTOP SHOP CATALOG (24h Brand Stories + Full width grid with desktop filters) */}
      <div className="hidden md:block mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <MobileStoriesRow variant="desktop" />
        <MarketplaceGrid />
      </div>
    </Suspense>
  );
}

