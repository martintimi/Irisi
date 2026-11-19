'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { VendorStory } from '@/types';
import MobileStoryViewer from './MobileStoryViewer';

interface StoriesRowProps {
  onOpenQuickBuy?: (product: any) => void;
  variant?: 'mobile' | 'desktop';
}

export default function MobileStoriesRow({ onOpenQuickBuy, variant = 'mobile' }: StoriesRowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { followedVendors } = useStore();
  const [liveStories, setLiveStories] = useState<VendorStory[]>([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const autoOpenedParamRef = useRef<string | null>(null);

  // Fetch live active 24h stories persisted in Supabase
  useEffect(() => {
    let active = true;
    fetch('/api/stories', { headers: { 'Cache-Control': 'no-cache' } })
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

  const safeFollowed = useMemo(
    () => (Array.isArray(followedVendors) ? followedVendors.map((v) => v.toLowerCase()) : []),
    [followedVendors]
  );

  // Deduplicate vendor rings (1 ring per brand, opening all their slides in chronological order)
  const vendorRings = useMemo(() => {
    const byVendor = new Map<
      string,
      { vendorKey: string; stories: VendorStory[]; latestAt: number; isFollowed: boolean }
    >();

    for (const st of liveStories) {
      if (!st?.mediaUrl) continue;
      const key = (st.vendorId || st.vendorSlug || st.vendorName || st.id).toLowerCase().trim();
      const nameSlug = (st.vendorName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const isFollowed = safeFollowed.includes(key) || safeFollowed.includes(nameSlug);
      const ts = new Date(st.createdAt).getTime() || 0;

      if (!byVendor.has(key)) {
        byVendor.set(key, { vendorKey: key, stories: [st], latestAt: ts, isFollowed });
      } else {
        const entry = byVendor.get(key)!;
        entry.stories.push(st);
        if (ts > entry.latestAt) entry.latestAt = ts;
      }
    }

    // Order vendors: followed brands first, then most recently posted
    const orderedGroups = Array.from(byVendor.values()).sort((a, b) => {
      if (a.isFollowed && !b.isFollowed) return -1;
      if (!a.isFollowed && b.isFollowed) return 1;
      return b.latestAt - a.latestAt;
    });

    // Within each vendor, play oldest-to-newest like Instagram
    const flatOrdered: VendorStory[] = [];
    const rings: Array<{
      story: VendorStory;
      firstIndex: number;
      count: number;
      isFollowed: boolean;
      vendorKey: string;
    }> = [];

    for (const grp of orderedGroups) {
      const chronological = [...grp.stories].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const firstIndex = flatOrdered.length;
      flatOrdered.push(...chronological);
      rings.push({
        story: chronological[chronological.length - 1], // Latest slide preview avatar
        firstIndex,
        count: chronological.length,
        isFollowed: grp.isFollowed,
        vendorKey: grp.vendorKey,
      });
    }

    return { sorted: flatOrdered, rings };
  }, [liveStories, safeFollowed]);

  // Auto-open story if shopper arrived from a follower notification (/shop?story=<vendorId>)
  useEffect(() => {
    const storyParam = (searchParams?.get('story') || '').toLowerCase().trim();
    if (!storyParam || vendorRings.rings.length === 0) return;
    if (autoOpenedParamRef.current === storyParam) return;

    // Prevent both mobile & desktop mounted instances from opening duplicate portals simultaneously
    if (typeof window !== 'undefined') {
      const isDesktopViewport = window.innerWidth >= 768;
      if (variant === 'desktop' && !isDesktopViewport) return;
      if (variant === 'mobile' && isDesktopViewport) return;
    }

    const match = vendorRings.rings.find(
      (r) =>
        r.vendorKey === storyParam ||
        (r.story.vendorSlug || '').toLowerCase() === storyParam ||
        r.story.vendorName.toLowerCase().replace(/[^a-z0-9]+/g, '-') === storyParam
    );

    if (match) {
      autoOpenedParamRef.current = storyParam;
      setSelectedStoryIndex(match.firstIndex);
    }
  }, [searchParams, vendorRings.rings, variant]);

  const handleCloseViewer = () => {
    setSelectedStoryIndex(null);
    autoOpenedParamRef.current = null;
    if (searchParams?.get('story')) {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete('story');
      const qs = nextParams.toString();
      router.replace(qs ? `/shop?${qs}` : '/shop', { scroll: false });
    }
  };

  if (vendorRings.rings.length === 0) return null;

  const isDesktop = variant === 'desktop';

  return (
    <div className={isDesktop ? 'select-none pb-6 border-b border-[var(--border-subtle)]' : 'select-none pt-1 pb-1'}>
      {isDesktop && (
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold-accent)]" />
            <span className="text-[11px] font-mono-luxury uppercase tracking-[0.2em] text-[var(--text-muted)]">
              24h Brand Stories
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] font-light">
            Tap any brand to watch &amp; react
          </span>
        </div>
      )}

      <div
        className={`flex items-start overflow-x-auto pb-1 no-scrollbar overscroll-x-contain ${
          isDesktop ? 'gap-5' : 'gap-3.5 px-4'
        }`}
      >
        {vendorRings.rings.map(({ story, firstIndex, count, isFollowed }) => (
          <button
            key={story.vendorId || story.id}
            type="button"
            onClick={() => setSelectedStoryIndex(firstIndex)}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group active:opacity-75 transition-opacity"
          >
            <div
              className={`relative p-[2px] rounded-full transition-transform duration-200 group-hover:scale-105 ${
                isFollowed
                  ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-600'
                  : 'bg-gradient-to-tr from-[#B89035] via-[#E6C367] to-[#D4AF37]'
              }`}
            >
              <div className="p-[2px] rounded-full bg-[var(--bg-primary)]">
                <div
                  className={`relative rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 ${
                    isDesktop ? 'h-[66px] w-[66px]' : 'h-[58px] w-[58px]'
                  }`}
                >
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
                <span className="absolute -bottom-0.5 -right-0.5 h-[18px] min-w-[18px] px-1 rounded-full bg-zinc-950 text-white border border-white text-[9px] font-mono-luxury flex items-center justify-center">
                  {count}
                </span>
              )}
            </div>
            <span
              className={`text-[var(--text-primary)] font-normal truncate text-center leading-tight ${
                isDesktop ? 'text-[11px] max-w-[78px]' : 'text-[10px] max-w-[66px]'
              }`}
            >
              {story.vendorName}
            </span>
          </button>
        ))}
      </div>

      {selectedStoryIndex !== null && (
        <MobileStoryViewer
          stories={vendorRings.sorted}
          initialIndex={selectedStoryIndex}
          onClose={handleCloseViewer}
          onShopLook={(product) => {
            handleCloseViewer();
            if (onOpenQuickBuy) {
              onOpenQuickBuy(product);
            } else if (product?.id && !String(product.id).startsWith('story-')) {
              router.push(`/shop/${product.id}`);
            }
          }}
        />
      )}
    </div>
  );
}
