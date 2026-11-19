'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useStore } from '@/lib/store/useStore';
import { X, ShoppingBag, Plus, Check, Sparkles } from 'lucide-react';
import { VendorStory } from '@/types';

interface StoryViewerProps {
  stories: VendorStory[];       // all stories (each = 1 post from 1 vendor)
  initialIndex: number;         // which story circle was tapped (index into stories[])
  onClose: () => void;
  onShopLook: (product: any) => void;
}

// Group flat story list by vendor, preserving tap order
function groupByVendor(stories: VendorStory[]) {
  const order: string[] = [];
  const map: Record<string, VendorStory[]> = {};
  for (const s of stories) {
    if (!map[s.vendorId]) {
      map[s.vendorId] = [];
      order.push(s.vendorId);
    }
    map[s.vendorId].push(s);
  }
  return order.map((id) => ({ vendorId: id, posts: map[id] }));
}

export default function MobileStoryViewer({
  stories,
  initialIndex,
  onClose,
  onShopLook,
}: StoryViewerProps) {
  const { isFollowingVendor, toggleFollowVendor, allProducts } = useStore();

  // Build vendor groups once
  const vendorGroups = useMemo(() => groupByVendor(stories), [stories]);

  // Find which vendor group the tapped circle belongs to
  const initialVendorIdx = useMemo(() => {
    const tappedVendorId = stories[initialIndex]?.vendorId;
    const idx = vendorGroups.findIndex((g) => g.vendorId === tappedVendorId);
    return Math.max(0, idx);
  }, [stories, initialIndex, vendorGroups]);

  // currentVendorIdx = which person we're watching
  // currentPostIdx   = which of THAT person's posts we're on
  const [currentVendorIdx, setCurrentVendorIdx] = useState(initialVendorIdx);
  const [currentPostIdx, setCurrentPostIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const currentGroup = vendorGroups[currentVendorIdx];
  const currentPost = currentGroup?.posts[currentPostIdx];
  const isFollowed = isFollowingVendor(currentPost?.vendorId ?? '');

  // Deferred close to avoid setState-during-render
  const safeClose = useCallback(() => {
    setTimeout(() => onClose(), 0);
  }, [onClose]);

  // Advance to next post or next vendor or close
  const advanceForward = useCallback(() => {
    const postsInGroup = currentGroup?.posts.length ?? 0;
    if (currentPostIdx < postsInGroup - 1) {
      // More posts from same vendor
      setCurrentPostIdx((p) => p + 1);
      setProgress(0);
    } else if (currentVendorIdx < vendorGroups.length - 1) {
      // Move to next vendor
      setCurrentVendorIdx((v) => v + 1);
      setCurrentPostIdx(0);
      setProgress(0);
    } else {
      // Last vendor, last post — close
      safeClose();
    }
  }, [currentGroup, currentPostIdx, currentVendorIdx, vendorGroups.length, safeClose]);

  // Auto-progress timer: 5s per post
  useEffect(() => {
    setProgress(0);
    const interval = 50; // ms
    const step = 100 / (5000 / interval);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          advanceForward();
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVendorIdx, currentPostIdx]);

  const handleTapRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    advanceForward();
  };

  const handleTapLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Go back: within same vendor first, then to previous vendor
    if (currentPostIdx > 0) {
      setCurrentPostIdx((p) => p - 1);
      setProgress(0);
    } else if (currentVendorIdx > 0) {
      const prevGroup = vendorGroups[currentVendorIdx - 1];
      setCurrentVendorIdx((v) => v - 1);
      setCurrentPostIdx(prevGroup.posts.length - 1);
      setProgress(0);
    }
  };

  const handleShopAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPost) return;
    const matched = allProducts.find(
      (p) =>
        p.id === currentPost.taggedProductId ||
        p.name.toLowerCase() === (currentPost.taggedProductName || '').toLowerCase()
    );
    const payload = matched || {
      id: currentPost.taggedProductId || `story-${currentVendorIdx}-${currentPostIdx}`,
      name: currentPost.taggedProductName || currentPost.caption,
      price: currentPost.taggedProductPrice || 33000,
      imageUrl: currentPost.taggedProductImage || currentPost.mediaUrl,
      vendorId: currentPost.vendorId,
      vendorName: currentPost.vendorName,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [{ name: 'As Featured', hex: '#111111' }],
    };
    onShopLook(payload);
  };

  if (!currentPost) return null;

  const postsInGroup = currentGroup.posts.length;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none">

      {/* ── TOP: Progress bars (one per THIS vendor's posts) + brand header ── */}
      <div className="relative z-20 px-3 pt-10 pb-2 bg-gradient-to-b from-black/80 to-transparent space-y-2.5">

        {/* Progress segments — count = how many posts THIS vendor has */}
        <div className="flex items-center gap-1">
          {currentGroup.posts.map((_, idx) => (
            <div key={idx} className="h-[3px] flex-1 bg-white/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{
                  width:
                    idx < currentPostIdx
                      ? '100%'
                      : idx === currentPostIdx
                      ? `${progress}%`
                      : '0%',
                  transition: idx === currentPostIdx ? 'none' : undefined,
                }}
              />
            </div>
          ))}
        </div>

        {/* Brand header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-[var(--gold-accent)]/80">
              <Image
                src={currentPost.vendorAvatar || currentPost.mediaUrl}
                alt={currentPost.vendorName}
                fill unoptimized className="object-cover"
              />
            </div>
            <div>
              <span className="font-semibold text-xs text-white block">{currentPost.vendorName}</span>
              <span className="text-[9px] text-white/60 block">
                {currentVendorIdx + 1} of {vendorGroups.length} · Just now
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFollowVendor(currentPost.vendorId);
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                isFollowed ? 'bg-white/20 text-white' : 'bg-white text-black'
              }`}
            >
              {isFollowed ? (
                <><Check className="h-3 w-3" /><span>Following</span></>
              ) : (
                <><Plus className="h-3 w-3" /><span>Follow</span></>
              )}
            </button>
            <button
              type="button"
              onClick={safeClose}
              className="h-8 w-8 rounded-full bg-white/15 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── STORY MEDIA (PHOTO OR VIDEO) ── */}
      <div className="relative flex-1 w-full overflow-hidden">
        {currentPost.mediaType === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(currentPost.mediaUrl || '') ? (
          <video
            key={currentPost.mediaUrl}
            src={currentPost.mediaUrl}
            autoPlay
            playsInline
            muted
            loop
            className="w-full h-full object-cover"
          />
        ) : (
          <Image
            src={currentPost.mediaUrl}
            alt={currentPost.caption}
            fill unoptimized priority className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

        {/* Tap zones: left 1/3 = prev, right 1/3 = next, middle = pause (no-op) */}
        <div className="absolute inset-0 flex z-10">
          <div className="w-1/3 h-full cursor-pointer" onClick={handleTapLeft} />
          <div className="w-1/3 h-full" />
          <div className="w-1/3 h-full cursor-pointer" onClick={handleTapRight} />
        </div>
      </div>

      {/* ── BOTTOM: Caption + Tagged product ── */}
      <div className="relative z-20 px-4 pb-10 pt-3 space-y-3 bg-gradient-to-t from-black via-black/90 to-transparent">
        <p className="text-xs text-white/90 text-center leading-relaxed">{currentPost.caption}</p>

        {currentPost.taggedProductName && (
          <div
            onClick={handleShopAction}
            className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 rounded-xl overflow-hidden border border-white/20 shrink-0">
                <Image
                  src={currentPost.taggedProductImage || currentPost.mediaUrl}
                  alt={currentPost.taggedProductName}
                  fill unoptimized className="object-cover"
                />
              </div>
              <div>
                <span className="text-[9px] text-[var(--gold-accent)] font-mono-luxury uppercase font-bold flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 fill-current" /> Featured Drop
                </span>
                <h4 className="text-xs font-medium text-white line-clamp-1">{currentPost.taggedProductName}</h4>
                <p className="text-xs text-[var(--gold-accent)] font-bold">
                  ₦{Number(currentPost.taggedProductPrice || 0).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="px-3 py-2 rounded-full bg-[var(--gold-accent)] text-black text-[11px] font-bold flex items-center gap-1.5 shrink-0"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Shop</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
