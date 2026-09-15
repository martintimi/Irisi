'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useStore } from '@/lib/store/useStore';
import MobileStoryViewer from './MobileStoryViewer';

export default function MobileStoriesRow({ onOpenQuickBuy }: { onOpenQuickBuy?: (product: any) => void }) {
  const { vendorStories, followedVendors } = useStore();
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);

  const safeStories = Array.isArray(vendorStories) ? vendorStories : [];
  const safeFollowed = Array.isArray(followedVendors) ? followedVendors : [];

  const sortedStories = [...safeStories].sort((a, b) => {
    const aFollow = safeFollowed.includes((a.vendorId || '').toLowerCase());
    const bFollow = safeFollowed.includes((b.vendorId || '').toLowerCase());
    if (aFollow && !bFollow) return -1;
    if (!aFollow && bFollow) return 1;
    return 0;
  });

  if (sortedStories.length === 0) return null;

  return (
    <div className="select-none">
      {/* Horizontal smooth scroll */}
      <div className="flex items-start gap-4 overflow-x-auto pb-1 no-scrollbar overscroll-x-contain px-4">
        {sortedStories.map((story, idx) => {
          const isFollowed = safeFollowed.includes((story.vendorId || '').toLowerCase());
          return (
            <button
              key={story.id || idx}
              type="button"
              onClick={() => setSelectedStoryIndex(idx)}
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer active:opacity-70 transition-opacity"
            >
              {/* Gold ring around circle */}
              <div className={`p-[2px] rounded-full ${isFollowed ? 'bg-emerald-500' : 'bg-gradient-to-tr from-[var(--gold-accent)] via-yellow-300 to-amber-500'}`}>
                <div className="p-[2px] rounded-full bg-[var(--bg-primary)]">
                  <div className="relative h-[58px] w-[58px] rounded-full overflow-hidden bg-zinc-200">
                    <Image
                      src={story.vendorAvatar || story.mediaUrl || '/images/no-product.svg'}
                      alt={story.vendorName}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
              {/* Label */}
              <span className="text-[10px] text-[var(--text-primary)] font-medium max-w-[64px] truncate text-center leading-tight">
                {story.vendorName}
              </span>
            </button>
          );
        })}
      </div>

      {selectedStoryIndex !== null && (
        <MobileStoryViewer
          stories={sortedStories}
          initialIndex={selectedStoryIndex}
          onClose={() => setSelectedStoryIndex(null)}
          onShopLook={(product) => {
            setSelectedStoryIndex(null);
            if (onOpenQuickBuy) onOpenQuickBuy(product);
          }}
        />
      )}
    </div>
  );
}
