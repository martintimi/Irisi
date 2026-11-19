'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useStore } from '@/lib/store/useStore';
import { VendorStory } from '@/types';
import MobileStoryViewer from './MobileStoryViewer';

export default function MobileStoriesRow({ onOpenQuickBuy }: { onOpenQuickBuy?: (product: any) => void }) {
  const { vendorStories, followedVendors } = useStore();
  const [liveStories, setLiveStories] = useState<VendorStory[]>([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);

  // Fetch live active 48h stories persisted in Supabase
  useEffect(() => {
    let active = true;
    fetch('/api/stories')
      .then((res) => res.json())
      .then((data) => {
        if (active && data?.success && Array.isArray(data.stories)) {
          setLiveStories(data.stories);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const mergedStories = useMemo(() => {
    const localSafe = Array.isArray(vendorStories) ? vendorStories : [];
    const byId = new Map<string, VendorStory>();
    for (const st of liveStories) {
      if (st?.id) byId.set(st.id, st);
    }
    for (const st of localSafe) {
      if (st?.id && !byId.has(st.id)) byId.set(st.id, st);
    }
    return Array.from(byId.values());
  }, [liveStories, vendorStories]);

  const safeFollowed = Array.isArray(followedVendors) ? followedVendors.map((v) => v.toLowerCase()) : [];

  // Deduplicate vendor circles in the horizontal bar (1 ring per vendor, opening all their stories)
  const vendorRings = useMemo(() => {
    const seen = new Map<string, { story: VendorStory; firstIndex: number; count: number; isFollowed: boolean }>();
    const sorted = [...mergedStories].sort((a, b) => {
      const aFollow = safeFollowed.includes((a.vendorId || '').toLowerCase());
      const bFollow = safeFollowed.includes((b.vendorId || '').toLowerCase());
      if (aFollow && !bFollow) return -1;
      if (!aFollow && bFollow) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    sorted.forEach((st, idx) => {
      const key = (st.vendorId || st.vendorName || String(idx)).toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, {
          story: st,
          firstIndex: idx,
          count: 1,
          isFollowed: safeFollowed.includes(key),
        });
      } else {
        seen.get(key)!.count += 1;
      }
    });

    return { sorted, rings: Array.from(seen.values()) };
  }, [mergedStories, safeFollowed]);

  if (vendorRings.rings.length === 0) return null;

  return (
    <div className="select-none pt-3 pb-1">
      <div className="flex items-start gap-3.5 overflow-x-auto pb-1 no-scrollbar overscroll-x-contain px-4">
        {vendorRings.rings.map(({ story, firstIndex, count, isFollowed }) => (
          <button
            key={story.id || story.vendorId}
            type="button"
            onClick={() => setSelectedStoryIndex(firstIndex)}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer active:opacity-70 transition-opacity"
          >
            <div
              className={`relative p-[2px] rounded-full ${
                isFollowed
                  ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-600'
                  : 'bg-gradient-to-tr from-[var(--gold-accent)] via-amber-300 to-yellow-500'
              }`}
            >
              <div className="p-[2px] rounded-full bg-[var(--bg-primary)]">
                <div className="relative h-[56px] w-[56px] rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                  <Image
                    src={story.vendorAvatar || story.mediaUrl || '/images/no-product.svg'}
                    alt={story.vendorName}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              </div>
              {count > 1 && (
                <span className="absolute -bottom-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-zinc-950 text-white border border-white text-[9px] font-mono-luxury flex items-center justify-center">
                  {count}
                </span>
              )}
            </div>
            <span className="text-[10px] text-[var(--text-primary)] font-normal max-w-[64px] truncate text-center leading-tight">
              {story.vendorName}
            </span>
          </button>
        ))}
      </div>

      {selectedStoryIndex !== null && (
        <MobileStoryViewer
          stories={vendorRings.sorted}
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
