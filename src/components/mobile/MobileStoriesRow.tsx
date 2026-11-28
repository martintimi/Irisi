'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { VendorStory } from '@/types';
import MobileStoryViewer from './MobileStoryViewer';
import { getCachedStories, prefetchStories } from '@/lib/cache/storiesCache';

interface StoriesRowProps {
  onOpenQuickBuy?: (product: any) => void;
  variant?: 'mobile' | 'desktop';
}

const VIEWED_STORAGE_KEY = 'irisi_viewed_story_ids';

export default function MobileStoriesRow({ onOpenQuickBuy, variant = 'mobile' }: StoriesRowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { followedVendors } = useStore();
  const [liveStories, setLiveStories] = useState<VendorStory[]>(() => getCachedStories() || []);
  const [hasLoadedStories, setHasLoadedStories] = useState<boolean>(() => getCachedStories() !== null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [viewedIds, setViewedIds] = useState<Record<string, boolean>>({});
  const autoOpenedParamRef = useRef<string | null>(null);

  // Load shopper's seen story IDs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEWED_STORAGE_KEY);
      if (saved) setViewedIds(JSON.parse(saved));
    } catch {}
  }, []);

  const markStoryViewed = useCallback((storyId: string) => {
    if (!storyId) return;
    setViewedIds((prev) => {
      if (prev[storyId]) return prev;
      const next = { ...prev, [storyId]: true };
      // Prune old map entries beyond 250 IDs so localStorage stays tiny
      const keys = Object.keys(next);
      if (keys.length > 250) {
        keys.slice(0, keys.length - 200).forEach((k) => delete next[k]);
      }
      try {
        localStorage.setItem(VIEWED_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Hydrate immediately from SWR cache & revalidate fresh 24h stories silently
  useEffect(() => {
    let active = true;
    const cached = getCachedStories();
    if (cached) {
      setLiveStories(cached);
      setHasLoadedStories(true);
    }
    prefetchStories(true)
      .then((stories) => {
        if (active) {
          setLiveStories(stories);
          setHasLoadedStories(true);
        }
      })
      .catch(() => {
        if (active) setHasLoadedStories(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const safeFollowed = useMemo(
    () => (Array.isArray(followedVendors) ? followedVendors.map((v) => v.toLowerCase()) : []),
    [followedVendors]
  );

  // Group by vendor: Unseen/New stories sort FIRST with bright Gold/Emerald ring;
  // Already-viewed stories cleanly fade to muted monochrome grey ring (just like Instagram!)
  const vendorRings = useMemo(() => {
    const byVendor = new Map<
      string,
      { vendorKey: string; stories: VendorStory[]; latestAt: number; isFollowed: boolean; hasUnseen: boolean }
    >();

    for (const st of liveStories) {
      if (!st?.mediaUrl) continue;
      const key = (st.vendorId || st.vendorSlug || st.vendorName || st.id).toLowerCase().trim();
      const nameSlug = (st.vendorName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const isFollowed = safeFollowed.includes(key) || safeFollowed.includes(nameSlug);
      const ts = new Date(st.createdAt).getTime() || 0;
      const isSlideUnseen = !viewedIds[st.id];

      if (!byVendor.has(key)) {
        byVendor.set(key, {
          vendorKey: key,
          stories: [st],
          latestAt: ts,
          isFollowed,
          hasUnseen: isSlideUnseen,
        });
      } else {
        const entry = byVendor.get(key)!;
        entry.stories.push(st);
        if (ts > entry.latestAt) entry.latestAt = ts;
        if (isSlideUnseen) entry.hasUnseen = true;
      }
    }

    // Sort: Unseen first -> Followed first -> Most recent
    const orderedGroups = Array.from(byVendor.values()).sort((a, b) => {
      if (a.hasUnseen && !b.hasUnseen) return -1;
      if (!a.hasUnseen && b.hasUnseen) return 1;
      if (a.isFollowed && !b.isFollowed) return -1;
      if (!a.isFollowed && b.isFollowed) return 1;
      return b.latestAt - a.latestAt;
    });

    const flatOrdered: VendorStory[] = [];
    const rings: Array<{
      story: VendorStory;
      firstIndex: number;
      count: number;
      unseenCount: number;
      hasUnseen: boolean;
      isFollowed: boolean;
      vendorKey: string;
    }> = [];

    for (const grp of orderedGroups) {
      const chronological = [...grp.stories].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const firstIndex = flatOrdered.length;
      flatOrdered.push(...chronological);
      const unseenCount = chronological.filter((s) => !viewedIds[s.id]).length;

      rings.push({
        story: chronological[chronological.length - 1],
        firstIndex,
        count: chronological.length,
        unseenCount,
        hasUnseen: unseenCount > 0,
        isFollowed: grp.isFollowed,
        vendorKey: grp.vendorKey,
      });
    }

    return { sorted: flatOrdered, rings };
  }, [liveStories, safeFollowed, viewedIds]);

  // Auto-open story if shopper arrived from a follower notification (/shop?story=<vendorId>)
  useEffect(() => {
    const storyParam = (searchParams?.get('story') || '').toLowerCase().trim();
    if (!storyParam || vendorRings.rings.length === 0) return;
    if (autoOpenedParamRef.current === storyParam) return;

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

  // Show sleek quiet-luxury ring shimmer ONLY during the brief cold first fetch so layout never pops/jumps
  if (vendorRings.rings.length === 0) {
    if (!hasLoadedStories) {
      const isDesktopLoading = variant === "desktop";
      return (
        <div className={isDesktopLoading ? "select-none pb-6 border-b border-[var(--border-subtle)]" : "select-none pt-1 pb-1"}>
          <div className={`flex items-center overflow-hidden ${isDesktopLoading ? "gap-5" : "gap-3.5 px-4"}`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex flex-col items-center gap-1.5 shrink-0 animate-pulse">
                <div className={`${isDesktopLoading ? "h-[74px] w-[74px]" : "h-[64px] w-[64px]"} rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)]`} />
                <div className="h-2 w-11 rounded-full bg-[var(--bg-surface)]" />
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  }

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
            Gold ring = New · Grey ring = Viewed
          </span>
        </div>
      )}

      <div
        className={`flex items-start overflow-x-auto pb-1 no-scrollbar overscroll-x-contain ${
          isDesktop ? 'gap-5' : 'gap-3.5 px-4'
        }`}
      >
        {vendorRings.rings.map(({ story, firstIndex, count, hasUnseen, isFollowed }) => (
          <button
            key={story.vendorId || story.id}
            type="button"
            onClick={() => setSelectedStoryIndex(firstIndex)}
            className={`flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group active:opacity-75 transition-opacity ${
              hasUnseen ? 'opacity-100' : 'opacity-70'
            }`}
          >
            <div
              className={`relative p-[2px] rounded-full transition-transform duration-200 group-hover:scale-105 ${
                !hasUnseen
                  ? 'bg-neutral-300 dark:bg-zinc-700'
                  : isFollowed
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

              {/* Unseen NEW badge OR multi-slide count */}
              {hasUnseen && count === 1 && (
                <span className="absolute -bottom-0.5 right-0 h-3 w-3 rounded-full bg-[var(--gold-accent)] ring-2 ring-[var(--bg-primary)]" />
              )}
              {count > 1 && (
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-[18px] min-w-[18px] px-1 rounded-full border border-[var(--bg-primary)] text-[9px] font-mono-luxury flex items-center justify-center ${
                    hasUnseen
                      ? 'bg-[var(--gold-accent)] text-black'
                      : 'bg-zinc-700 text-zinc-200'
                  }`}
                >
                  {count}
                </span>
              )}
            </div>

            <span
              className={`truncate text-center leading-tight ${
                hasUnseen ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)] font-normal'
              } ${isDesktop ? 'text-[11px] max-w-[78px]' : 'text-[10px] max-w-[66px]'}`}
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
          onStoryViewed={markStoryViewed}
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
