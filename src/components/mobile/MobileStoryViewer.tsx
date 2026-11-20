'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useStore } from '@/lib/store/useStore';
import {
  X, ShoppingBag, Plus, Check, Sparkles,
  Volume2, VolumeX, ChevronLeft, ChevronRight, Eye
} from 'lucide-react';
import { VendorStory, StoryTextOverlay } from '@/types';
import { useBodyScrollLock } from '@/lib/utils/useBodyScrollLock';

interface StoryViewerProps {
  stories: VendorStory[];
  initialIndex: number;
  onClose: () => void;
  onShopLook: (product: any) => void;
}

const REACTION_EMOJIS = ['🔥', '❤️', '😍', '👏', '✨'];

function groupByVendor(stories: VendorStory[]) {
  const order: string[] = [];
  const map: Record<string, VendorStory[]> = {};
  for (const s of stories) {
    const key = (s.vendorId || s.vendorName || 'brand').toLowerCase();
    if (!map[key]) {
      map[key] = [];
      order.push(key);
    }
    map[key].push(s);
  }
  return order.map((id) => ({ vendorId: id, posts: map[id] }));
}

function getOrCreateViewerKey(email?: string): string {
  if (email && email.includes('@')) return email.toLowerCase().trim();
  if (typeof window === 'undefined') return 'guest';
  let id = localStorage.getItem('irisi_viewer_uid');
  if (!id) {
    id = `guest-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    try {
      localStorage.setItem('irisi_viewer_uid', id);
    } catch {}
  }
  return id;
}

function formatAge(iso?: string): string {
  if (!iso) return 'Just now';
  const diffMin = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;
  const h = Math.floor(diffMin / 60);
  return `${h}h`;
}

export default function MobileStoryViewer({
  stories,
  initialIndex,
  onClose,
  onShopLook,
}: StoryViewerProps) {
  const { isFollowingVendor, toggleFollowVendor, allProducts, userAuth } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useBodyScrollLock(true);

  const vendorGroups = useMemo(() => groupByVendor(stories), [stories]);

  const initialVendorIdx = useMemo(() => {
    const tappedVendorId = (stories[initialIndex]?.vendorId || stories[initialIndex]?.vendorName || '').toLowerCase();
    const idx = vendorGroups.findIndex((g) => g.vendorId === tappedVendorId);
    return Math.max(0, idx);
  }, [stories, initialIndex, vendorGroups]);

  const [currentVendorIdx, setCurrentVendorIdx] = useState(initialVendorIdx);
  const [currentPostIdx, setCurrentPostIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Live reaction state per storyId
  const [myReactions, setMyReactions] = useState<Record<string, string | null>>({});
  const [liveCounts, setLiveCounts] = useState<
    Record<string, { viewCount: number; reactions: Record<string, number>; totalReactions: number }>
  >({});
  const [floatingBursts, setFloatingBursts] = useState<Array<{ id: number; emoji: string }>>([]);

  const viewedIdsRef = useRef<Set<string>>(new Set());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isPausedRef = useRef(false);
  isPausedRef.current = isPaused;

  const currentGroup = vendorGroups[currentVendorIdx];
  const currentPost = currentGroup?.posts[currentPostIdx];
  const isVideo = Boolean(
    currentPost &&
      (currentPost.mediaType === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(currentPost.mediaUrl || ''))
  );
  const currentVendorSlug = (currentPost?.vendorName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const isFollowed =
    isFollowingVendor(currentPost?.vendorId ?? '') ||
    (currentPost?.vendorSlug ? isFollowingVendor(currentPost.vendorSlug) : false) ||
    (currentVendorSlug ? isFollowingVendor(currentVendorSlug) : false);

  const safeClose = useCallback(() => {
    setTimeout(() => onClose(), 0);
  }, [onClose]);

  const advanceForward = useCallback(() => {
    const postsInGroup = currentGroup?.posts.length ?? 0;
    if (currentPostIdx < postsInGroup - 1) {
      setCurrentPostIdx((p) => p + 1);
      setProgress(0);
    } else if (currentVendorIdx < vendorGroups.length - 1) {
      setCurrentVendorIdx((v) => v + 1);
      setCurrentPostIdx(0);
      setProgress(0);
    } else {
      safeClose();
    }
  }, [currentGroup, currentPostIdx, currentVendorIdx, vendorGroups.length, safeClose]);

  const goBack = useCallback(() => {
    if (currentPostIdx > 0) {
      setCurrentPostIdx((p) => p - 1);
      setProgress(0);
    } else if (currentVendorIdx > 0) {
      const prevGroup = vendorGroups[currentVendorIdx - 1];
      setCurrentVendorIdx((v) => v - 1);
      setCurrentPostIdx(prevGroup.posts.length - 1);
      setProgress(0);
    }
  }, [currentPostIdx, currentVendorIdx, vendorGroups]);

  // Keyboard navigation on Desktop (ArrowLeft, ArrowRight, Escape, Space)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') safeClose();
      else if (e.key === 'ArrowRight') advanceForward();
      else if (e.key === 'ArrowLeft') goBack();
      else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [advanceForward, goBack, safeClose]);

  // Record a live View once per storyId
  useEffect(() => {
    if (!currentPost?.id || viewedIdsRef.current.has(currentPost.id)) return;
    viewedIdsRef.current.add(currentPost.id);
    const viewerKey = getOrCreateViewerKey(userAuth?.email);
    const viewerName = userAuth?.name || (userAuth?.email ? userAuth.email.split('@')[0] : 'Shopper');

    fetch('/api/stories/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storyId: currentPost.id,
        action: 'view',
        viewerKey,
        viewerName,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success) {
          setLiveCounts((prev) => ({
            ...prev,
            [currentPost.id]: {
              viewCount: data.viewCount,
              reactions: data.reactions || {},
              totalReactions: data.totalReactions || 0,
            },
          }));
          if (data.viewerReaction !== undefined) {
            setMyReactions((prev) => ({ ...prev, [currentPost.id]: data.viewerReaction }));
          }
        }
      })
      .catch(() => {});
  }, [currentPost?.id, userAuth?.email, userAuth?.name]);

  // Pause/play video when press-and-hold changes & fallback to muted if mobile browser blocks unmuted autoplay
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    const vid = videoRef.current;
    if (isPaused) {
      vid.pause();
    } else {
      vid.play().catch(() => {
        if (!vid.muted) {
          vid.muted = true;
          setIsMuted(true);
          vid.play().catch(() => {});
        }
      });
    }
  }, [isPaused, isVideo, currentPost?.mediaUrl]);

  // Auto-progress timer for PHOTO stories (5.5s). Video stories sync directly to <video> onTimeUpdate (up to 30s).
  useEffect(() => {
    setProgress(0);
    if (isVideo) return;

    const interval = 50;
    const durationMs = 5500;
    const step = 100 / (durationMs / interval);

    const timer = setInterval(() => {
      if (isPausedRef.current) return;
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
  }, [currentVendorIdx, currentPostIdx, isVideo]);

  const handleReact = async (emoji: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPost?.id) return;

    const burstId = Date.now() + Math.random();
    setFloatingBursts((prev) => [...prev, { id: burstId, emoji }]);
    setTimeout(() => {
      setFloatingBursts((prev) => prev.filter((b) => b.id !== burstId));
    }, 950);

    // Optimistic toggle
    setMyReactions((prev) => ({
      ...prev,
      [currentPost.id]: prev[currentPost.id] === emoji ? null : emoji,
    }));

    const viewerKey = getOrCreateViewerKey(userAuth?.email);
    const viewerName = userAuth?.name || (userAuth?.email ? userAuth.email.split('@')[0] : 'Shopper');

    try {
      const res = await fetch('/api/stories/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: currentPost.id,
          action: 'react',
          emoji,
          viewerKey,
          viewerName,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setMyReactions((prev) => ({ ...prev, [currentPost.id]: data.viewerReaction }));
        setLiveCounts((prev) => ({
          ...prev,
          [currentPost.id]: {
            viewCount: data.viewCount,
            reactions: data.reactions || {},
            totalReactions: data.totalReactions || 0,
          },
        }));
      }
    } catch {}
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
      price: currentPost.taggedProductPrice || 0,
      imageUrl: currentPost.taggedProductImage || currentPost.mediaUrl,
      vendorId: currentPost.vendorId,
      vendorName: currentPost.vendorName,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [{ name: 'As Featured', hex: '#111111' }],
    };
    onShopLook(payload);
  };

  if (!mounted || !currentPost) return null;

  const activeCounts = liveCounts[currentPost.id] || {
    viewCount: currentPost.viewCount || 0,
    reactions: currentPost.reactions || {},
    totalReactions: currentPost.totalReactions || 0,
  };
  const activeMyReaction = myReactions[currentPost.id] || null;

  const renderOverlayStyle = (ov: StoryTextOverlay) => {
    const fontClass =
      ov.fontStyle === 'editorial'
        ? 'font-editorial italic'
        : ov.fontStyle === 'mono'
        ? 'font-mono-luxury uppercase tracking-wider'
        : 'font-sans font-medium';
    const sizeClass =
      ov.size === 'lg' ? 'text-2xl sm:text-[26px]' : ov.size === 'sm' ? 'text-xs' : 'text-base sm:text-lg';
    const bgClass =
      ov.bgStyle === 'light'
        ? 'bg-white/95 shadow-lg px-3.5 py-1.5 rounded-xl'
        : ov.bgStyle === 'gold'
        ? 'bg-[#E6C367] shadow-lg px-3.5 py-1.5 rounded-xl'
        : ov.bgStyle === 'dark'
        ? 'bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15'
        : 'drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] px-2';

    return `${fontClass} ${sizeClass} ${bgClass}`;
  };

  const canGoPrev = currentPostIdx > 0 || currentVendorIdx > 0;
  const canGoNext =
    currentPostIdx < (currentGroup?.posts.length ?? 0) - 1 || currentVendorIdx < vendorGroups.length - 1;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] bg-black/95 md:bg-black/85 md:backdrop-blur-2xl flex items-center justify-center select-none"
      onClick={safeClose}
    >
      {/* Desktop Left Navigation Arrow */}
      {canGoPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goBack();
          }}
          className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white items-center justify-center transition-all cursor-pointer z-30"
          aria-label="Previous story"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Desktop Right Navigation Arrow */}
      {canGoNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            advanceForward();
          }}
          className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white items-center justify-center transition-all cursor-pointer z-30"
          aria-label="Next story"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Main 9:16 Story Frame (Full-screen on Mobile, Sleek Centered Cinema Card on Desktop) */}
      <div
        onClick={(e) => e.stopPropagation()}
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => setIsPaused(false)}
        onPointerLeave={() => setIsPaused(false)}
        className="relative w-full h-full md:w-[410px] md:h-[88vh] md:max-h-[780px] md:rounded-[28px] bg-black flex flex-col overflow-hidden md:border md:border-white/15 md:shadow-[0_32px_90px_rgba(0,0,0,0.85)]"
      >
        {/* TOP OVERLAY: Progress Segments + Brand Header */}
        <div className="absolute top-0 inset-x-0 z-30 px-3.5 pt-[calc(0.85rem+env(safe-area-inset-top))] md:pt-3.5 pb-6 bg-gradient-to-b from-black/80 via-black/35 to-transparent space-y-2.5">
          {/* Progress segments */}
          <div className="flex items-center gap-1">
            {currentGroup.posts.map((_, idx) => (
              <div key={idx} className="h-[2.5px] flex-1 bg-white/25 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{
                    width:
                      idx < currentPostIdx
                        ? '100%'
                        : idx === currentPostIdx
                        ? `${Math.min(100, progress)}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Brand Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative h-9 w-9 rounded-full overflow-hidden border border-[#E6C367]/80 shrink-0">
                <Image
                  src={currentPost.vendorAvatar || currentPost.mediaUrl}
                  alt={currentPost.vendorName}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-medium text-white block truncate">{currentPost.vendorName}</span>
                <span className="text-[10px] text-white/70 flex items-center gap-1.5">
                  <span>{formatAge(currentPost.createdAt)}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-0.5">
                    <Eye className="h-2.5 w-2.5" /> {Math.max(1, activeCounts.viewCount)}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFollowVendor(currentPost.vendorId);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className={`px-3 py-1.5 rounded-full text-[10px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
                  isFollowed ? 'bg-white/20 text-white' : 'bg-white text-black'
                }`}
              >
                {isFollowed ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3" />
                    <span>Follow</span>
                  </>
                )}
              </button>

              {isVideo && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted((m) => !m);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="h-8 w-8 rounded-full bg-white/15 text-white flex items-center justify-center cursor-pointer"
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                >
                  {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  safeClose();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="h-8 w-8 rounded-full bg-white/15 text-white flex items-center justify-center cursor-pointer"
                aria-label="Close story"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* MEDIA CANVAS (Full-bleed Photo or 30s Video + Vendor Text Overlays) */}
        <div className="relative flex-1 w-full h-full overflow-hidden bg-black">
          {isVideo ? (
            <video
              ref={videoRef}
              key={currentPost.mediaUrl}
              src={currentPost.mediaUrl}
              autoPlay
              playsInline
              muted={isMuted}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                const capDur = Math.min(30, v.duration || currentPost.durationSec || 30);
                if (capDur > 0) {
                  const pct = (v.currentTime / capDur) * 100;
                  setProgress(Math.min(100, pct));
                  if (v.currentTime >= 30) {
                    advanceForward();
                  }
                }
              }}
              onEnded={() => advanceForward()}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={currentPost.mediaUrl}
              alt={currentPost.caption || currentPost.vendorName}
              fill
              unoptimized
              priority
              className="object-cover"
            />
          )}

          {/* Render Vendor's Custom Instagram-Style Text Overlays */}
          {Array.isArray(currentPost.textOverlays) &&
            currentPost.textOverlays.map((ov) => (
              <div
                key={ov.id}
                style={{
                  left: `${ov.x}%`,
                  top: `${ov.y}%`,
                  transform: 'translate(-50%, -50%)',
                  color: ov.color,
                }}
                className={`absolute z-20 max-w-[84%] text-center pointer-events-none leading-snug ${renderOverlayStyle(ov)}`}
              >
                {ov.text}
              </div>
            ))}

          {/* Floating Reaction Burst Animations */}
          <div className="pointer-events-none absolute inset-x-0 bottom-28 z-30 flex justify-center">
            {floatingBursts.map((b) => (
              <span
                key={b.id}
                className="text-4xl animate-bounce drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
              >
                {b.emoji}
              </span>
            ))}
          </div>

          {/* Tap Zones: Left 30% Back · Right 35% Next */}
          <div className="absolute inset-0 flex z-10">
            <div
              className="w-[30%] h-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                goBack();
              }}
            />
            <div className="w-[35%] h-full" />
            <div
              className="w-[35%] h-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                advanceForward();
              }}
            />
          </div>
        </div>

        {/* BOTTOM OVERLAY: Caption + Tagged Product + Shopper Reaction Dock */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-0 inset-x-0 z-30 px-4 pb-[calc(1.2rem+env(safe-area-inset-bottom))] md:pb-5 pt-10 space-y-3 bg-gradient-to-t from-black/95 via-black/65 to-transparent"
        >
          {currentPost.caption && (
            <p className="text-xs text-white/95 text-center leading-relaxed drop-shadow">
              {currentPost.caption}
            </p>
          )}

          {currentPost.taggedProductName && (
            <div
              onClick={handleShopAction}
              className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative h-10 w-10 rounded-xl overflow-hidden border border-white/20 shrink-0">
                  <Image
                    src={currentPost.taggedProductImage || currentPost.mediaUrl}
                    alt={currentPost.taggedProductName}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] text-[#E6C367] font-mono-luxury uppercase flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5 fill-current" /> Shop Piece
                  </span>
                  <div className="text-xs font-medium text-white truncate">{currentPost.taggedProductName}</div>
                  {Number(currentPost.taggedProductPrice || 0) > 0 && (
                    <div className="text-[11px] text-[#E6C367] font-mono-luxury">
                      ₦{Number(currentPost.taggedProductPrice).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="px-3.5 py-2 rounded-full bg-white text-black text-[11px] font-medium flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Shop</span>
              </button>
            </div>
          )}

          {/* Interactive Shopper Reaction Bar */}
          <div className="flex items-center justify-center gap-2 pt-0.5">
            <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/55 backdrop-blur-xl border border-white/15">
              {REACTION_EMOJIS.map((emoji) => {
                const count = activeCounts.reactions?.[emoji] || 0;
                const isSelected = activeMyReaction === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={(e) => handleReact(emoji, e)}
                    className={`h-8 px-2.5 rounded-full flex items-center gap-1 text-base transition-all active:scale-125 cursor-pointer ${
                      isSelected
                        ? 'bg-[#E6C367]/30 ring-1 ring-[#E6C367]'
                        : 'hover:bg-white/10'
                    }`}
                    aria-label={`React with ${emoji}`}
                  >
                    <span>{emoji}</span>
                    {count > 0 && (
                      <span className="text-[10px] font-mono-luxury text-white/90">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
