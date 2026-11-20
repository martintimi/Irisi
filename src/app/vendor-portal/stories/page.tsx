'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useStore } from '@/lib/store/useStore';
import { VendorStory, StoryTextOverlay } from '@/types';
import {
  UploadCloud, CheckCircle2, ExternalLink, Tag, Loader2, Trash2,
  Users, Clock, Crown, Plus, Type, Eye, Heart, ChevronDown, ChevronUp,
  X, Sparkles, RefreshCw, Move
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { compressImageToFile } from '@/lib/utils/imageUtils';
import { getVendorCache, setVendorCache } from '@/lib/cache/vendorPortalCache';

interface DraftSlide {
  id: string;
  mediaUrl: string;
  mediaPublicId?: string;
  mediaType: 'image' | 'video';
  durationSec?: number;
  caption: string;
  textOverlays: StoryTextOverlay[];
  taggedProductId: string;
}

const TEXT_COLORS = [
  { hex: '#ffffff', label: 'White' },
  { hex: '#09090b', label: 'Black' },
  { hex: '#E6C367', label: 'Gold' },
  { hex: '#fda4af', label: 'Rose' },
  { hex: '#6ee7b7', label: 'Emerald' },
];

const MAX_SLIDES = 5;
const MAX_VIDEO_SECONDS = 30;

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(video.duration) ? video.duration : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    video.src = url;
  });
}

function formatTimeRemaining(expiresAt?: string): string {
  if (!expiresAt) return '24h left';
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Expiring';
  const hrs = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hrs >= 1) return `${hrs}h ${mins}m left`;
  return `${Math.max(1, mins)}m left`;
}

export default function VendorStoriesPage() {
  const { vendorProfile, allProducts } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Multi-slide draft composer
  const [slides, setSlides] = useState<DraftSlide[]>([]);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [draggingOverlayId, setDraggingOverlayId] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [notifyFollowers, setNotifyFollowers] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [publishedCount, setPublishedCount] = useState(0);
  const [followersNotified, setFollowersNotified] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [requiresPlus, setRequiresPlus] = useState(false);

  // Live active 24h stories & insights
  const [activeStories, setActiveStories] = useState<VendorStory[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedInsightsId, setExpandedInsightsId] = useState<string | null>(null);

  const activeSlide = slides[activeSlideIdx] || null;
  const activeOverlay =
    activeSlide?.textOverlays.find((o) => o.id === selectedOverlayId) || null;

  const vendorProducts = allProducts.filter(
    (p) =>
      (p.vendorId || '').toLowerCase() === (vendorProfile.email || '').toLowerCase() ||
      (p.vendorId || '').toLowerCase() === (vendorProfile.id || '').toLowerCase() ||
      p.vendorName === vendorProfile.brandName
  );

  const vendorLookupKey =
    vendorProfile.id ||
    vendorProfile.brandName?.toLowerCase().replace(/\s+/g, '-') ||
    vendorProfile.email ||
    '';

  const loadMyStories = useCallback(async () => {
    if (!vendorLookupKey) return;
    const cached = getVendorCache<VendorStory[]>(vendorLookupKey, 'stories');
    if (cached) {
      setActiveStories(cached);
    }
    setLoadingStories(!cached);
    try {
      const res = await fetch(`/api/stories?vendorId=${encodeURIComponent(vendorLookupKey)}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.stories)) {
        setActiveStories(data.stories);
        setVendorCache(vendorLookupKey, 'stories', data.stories);
      }
    } catch {} finally {
      setLoadingStories(false);
    }
  }, [vendorLookupKey]);

  useEffect(() => {
    loadMyStories();
  }, [loadMyStories]);

  const updateActiveSlide = (updater: (slide: DraftSlide) => DraftSlide) => {
    setSlides((prev) =>
      prev.map((s, idx) => (idx === activeSlideIdx ? updater(s) : s))
    );
  };

  // Multi-file upload with 30s video duration guard + Cloudinary irisi_stories folder
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const remainingSlots = MAX_SLIDES - slides.length;
    if (remainingSlots <= 0) {
      setErrorMsg(`You can publish up to ${MAX_SLIDES} slides per story drop.`);
      return;
    }

    const chosenFiles = Array.from(fileList).slice(0, remainingSlots);
    setErrorMsg('');
    setIsUploading(true);

    const newSlides: DraftSlide[] = [];

    try {
      for (let i = 0; i < chosenFiles.length; i++) {
        const file = chosenFiles[i];
        const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(file.name);
        setUploadProgressText(
          `Uploading ${i + 1} of ${chosenFiles.length}${isVideo ? ' (video)' : ''}...`
        );

        let durationSec: number | undefined = undefined;
        if (isVideo) {
          const dur = await getVideoDuration(file);
          if (dur > MAX_VIDEO_SECONDS + 0.8) {
            setErrorMsg(
              `"${file.name}" is ${Math.round(dur)}s long. Story videos must be ${MAX_VIDEO_SECONDS} seconds or less.`
            );
            continue;
          }
          durationSec = dur > 0 ? Math.min(MAX_VIDEO_SECONDS, Math.ceil(dur)) : MAX_VIDEO_SECONDS;
        }

        const uploadFile = isVideo ? file : await compressImageToFile(file, 1280, 0.85);
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('folder', 'irisi_stories');
        if (isVideo) {
          formData.append('maxDuration', String(MAX_VIDEO_SECONDS));
        }

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok && data.url) {
          newSlides.push({
            id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            mediaUrl: data.url,
            mediaPublicId: data.publicId,
            mediaType: isVideo ? 'video' : 'image',
            durationSec: durationSec || data.duration,
            caption: '',
            textOverlays: [],
            taggedProductId: '',
          });
        } else {
          setErrorMsg(data.error || `Failed to upload ${file.name}.`);
        }
      }

      if (newSlides.length > 0) {
        const nextIndex = slides.length;
        setSlides((prev) => [...prev, ...newSlides]);
        setActiveSlideIdx(nextIndex);
        setSelectedOverlayId(null);
      }
    } catch {
      setErrorMsg('Upload failed. Please try a smaller photo or clip (max 30s).');
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveSlide = (idx: number) => {
    setSlides((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setActiveSlideIdx((curr) => Math.max(0, Math.min(curr, next.length - 1)));
      setSelectedOverlayId(null);
      return next;
    });
  };

  // Add Instagram-style text overlay onto active slide
  const handleAddTextOverlay = () => {
    if (!activeSlide) return;
    const newOv: StoryTextOverlay = {
      id: `txt-${Date.now()}`,
      text: 'New Drop Live',
      x: 50,
      y: 50,
      fontStyle: 'editorial',
      color: '#ffffff',
      bgStyle: 'dark',
      size: 'md',
    };
    updateActiveSlide((s) => ({
      ...s,
      textOverlays: [...s.textOverlays, newOv],
    }));
    setSelectedOverlayId(newOv.id);
  };

  const updateSelectedOverlay = (patch: Partial<StoryTextOverlay>) => {
    if (!selectedOverlayId) return;
    updateActiveSlide((s) => ({
      ...s,
      textOverlays: s.textOverlays.map((o) =>
        o.id === selectedOverlayId ? { ...o, ...patch } : o
      ),
    }));
  };

  const deleteSelectedOverlay = (id: string) => {
    updateActiveSlide((s) => ({
      ...s,
      textOverlays: s.textOverlays.filter((o) => o.id !== id),
    }));
    if (selectedOverlayId === id) setSelectedOverlayId(null);
  };

  // Touch & Mouse Drag-to-Position on 9:16 Story Canvas
  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingOverlayId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const xPct = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(14, Math.min(78, ((e.clientY - rect.top) / rect.height) * 100));
    updateActiveSlide((s) => ({
      ...s,
      textOverlays: s.textOverlays.map((o) =>
        o.id === draggingOverlayId ? { ...o, x: Math.round(xPct), y: Math.round(yPct) } : o
      ),
    }));
  };

  const handlePublishAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slides.length === 0) return;

    setErrorMsg('');
    setRequiresPlus(false);
    setIsPublishing(true);

    try {
      const payloadSlides = slides.map((s) => {
        const taggedProd = allProducts.find((p) => p.id === s.taggedProductId);
        return {
          mediaUrl: s.mediaUrl,
          mediaPublicId: s.mediaPublicId,
          mediaType: s.mediaType,
          durationSec: s.durationSec,
          caption: s.caption.trim(),
          textOverlays: s.textOverlays.filter((o) => o.text.trim().length > 0),
          taggedProductId: taggedProd?.id,
          taggedProductName: taggedProd?.name,
          taggedProductPrice: taggedProd?.price,
          taggedProductImage: taggedProd?.imageUrl,
        };
      });

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendorProfile.id || vendorLookupKey,
          vendorEmail: vendorProfile.email,
          vendorName: vendorProfile.brandName || 'Verified Brand',
          vendorAvatar: vendorProfile.logoUrl || slides[0].mediaUrl,
          slides: payloadSlides,
          notifyFollowers,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.requiresPlus) setRequiresPlus(true);
        setErrorMsg(data.error || 'Could not publish story.');
        return;
      }

      const created: VendorStory[] = Array.isArray(data.stories)
        ? data.stories
        : data.story
        ? [data.story]
        : [];
      setPublishedCount(created.length);
      setFollowersNotified(Number(data.followersNotified || 0));
      setActiveStories((prev) => [...created.reverse(), ...prev]);
      setIsSuccess(true);

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#E6C367', '#ffffff', '#10b981'],
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error while publishing story.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteStory = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/stories?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        setActiveStories((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {} finally {
      setDeletingId(null);
    }
  };

  const resetComposer = () => {
    setSlides([]);
    setActiveSlideIdx(0);
    setSelectedOverlayId(null);
    setIsSuccess(false);
    setErrorMsg('');
  };

  const renderOverlayClasses = (ov: StoryTextOverlay) => {
    const fontClass =
      ov.fontStyle === 'editorial'
        ? 'font-editorial italic'
        : ov.fontStyle === 'mono'
        ? 'font-mono-luxury uppercase tracking-wider'
        : 'font-sans font-medium';
    const sizeClass =
      ov.size === 'lg' ? 'text-xl sm:text-2xl' : ov.size === 'sm' ? 'text-xs' : 'text-base';
    const bgClass =
      ov.bgStyle === 'light'
        ? 'bg-white/95 shadow-md px-3 py-1 rounded-xl'
        : ov.bgStyle === 'gold'
        ? 'bg-[#E6C367] shadow-md px-3 py-1 rounded-xl'
        : ov.bgStyle === 'dark'
        ? 'bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/15'
        : 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] px-1.5';

    return `${fontClass} ${sizeClass} ${bgClass}`;
  };

  const taggedPreviewProduct = activeSlide?.taggedProductId
    ? allProducts.find((p) => p.id === activeSlide.taggedProductId)
    : null;

  return (
    <div className="px-0.5 sm:px-6 md:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn pb-10 md:pb-24">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 md:border-b md:border-[var(--border-subtle)] md:pb-5">
        <div>
          <span className="hidden md:inline-flex items-center gap-2 text-[11px] font-mono-luxury uppercase tracking-[0.2em] text-[var(--gold-accent)]">
            24-Hour Story Studio · Auto-Clears Storage
          </span>
          <h1 className="font-editorial text-[26px] sm:text-4xl font-normal text-[var(--text-primary)] leading-tight md:mt-1">
            Lookbook Stories
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-light mt-0.5">
            Upload up to {MAX_SLIDES} photos or clips (max {MAX_VIDEO_SECONDS}s), add text overlays, tag pieces &amp; track live views/reactions. Expires in 24h.
          </p>
        </div>

        <button
          type="button"
          onClick={loadMyStories}
          className="h-9 w-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] flex items-center justify-center active:scale-95 cursor-pointer shrink-0"
          aria-label="Refresh stories"
        >
          <RefreshCw className={`h-4 w-4 ${loadingStories ? 'animate-spin text-[var(--gold-accent)]' : ''}`} />
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>{errorMsg}</span>
          {requiresPlus && (
            <Link
              href="/vendor-portal/plus"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--gold-accent)] text-black font-mono-luxury uppercase text-[11px] shrink-0"
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Upgrade to ÌRÍSÍ Plus</span>
            </Link>
          )}
        </div>
      )}

      {/* Hidden Multi-File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/mp4,video/quicktime,video/webm"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
      />

      {isSuccess ? (
        <div className="p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-5">
          <div className="h-14 w-14 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-editorial text-2xl font-normal text-[var(--text-primary)]">
              {publishedCount > 1 ? `${publishedCount} Story Slides Live` : 'Story Published Live'}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-light max-w-md mx-auto">
              Live on the Shop story rail for 24 hours (auto-deletes from storage once expired). Followers have been alerted in-app
              {followersNotified > 0 ? ` and ${followersNotified} email follower${followersNotified > 1 ? 's' : ''} notified.` : '.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={resetComposer}
              className="px-6 py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-wider cursor-pointer"
            >
              Create Another Story
            </button>
            <Link
              href="/shop"
              className="px-6 py-3 rounded-full border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-primary)] inline-flex items-center gap-1.5"
            >
              <span>View on Shop</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handlePublishAll} className="space-y-6">
          {/* Empty Upload Dropzone OR Interactive 9:16 Studio Editor */}
          {slides.length === 0 ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full py-14 px-6 rounded-3xl bg-[var(--bg-surface)] border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--gold-accent)] transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-9 w-9 text-[var(--gold-accent)] animate-spin" />
                  <span className="text-xs font-mono-luxury text-[var(--gold-accent)]">
                    {uploadProgressText || 'Uploading to Cloudinary...'}
                  </span>
                </>
              ) : (
                <>
                  <div className="h-14 w-14 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)]">
                    <UploadCloud className="h-6 w-6" strokeWidth={1.6} />
                  </div>
                  <div className="space-y-1">
                    <div className="font-editorial text-2xl text-[var(--text-primary)]">
                      Tap to Select Photos or Videos
                    </div>
                    <p className="text-xs text-[var(--text-muted)] font-light max-w-sm">
                      Pick 1 to {MAX_SLIDES} vertical photos or clips (up to {MAX_VIDEO_SECONDS}s per video). You can add text overlays and tag products on every slide.
                    </p>
                  </div>
                  <span className="mt-1 px-5 py-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[11px] font-mono-luxury uppercase tracking-wider">
                    Choose Media
                  </span>
                </>
              )}
            </button>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT: Live 9:16 Instagram Preview Canvas + Slide Filmstrip */}
              <div className="lg:col-span-5 space-y-3 flex flex-col items-center">
                {/* 9:16 Interactive Canvas */}
                <div
                  ref={canvasRef}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={() => setDraggingOverlayId(null)}
                  onPointerLeave={() => setDraggingOverlayId(null)}
                  onClick={() => setSelectedOverlayId(null)}
                  className="relative w-full max-w-[300px] aspect-[9/16] rounded-[28px] overflow-hidden bg-black border border-[var(--border-subtle)] shadow-2xl touch-none select-none"
                >
                  {/* Slide Progress Preview Bar */}
                  <div className="absolute top-3 inset-x-3 z-20 flex items-center gap-1 pointer-events-none">
                    {slides.map((s, idx) => (
                      <div key={s.id} className="h-[2.5px] flex-1 rounded-full bg-white/30 overflow-hidden">
                        <div className={`h-full bg-white ${idx <= activeSlideIdx ? 'w-full' : 'w-0'}`} />
                      </div>
                    ))}
                  </div>

                  {/* Active Slide Media */}
                  {activeSlide?.mediaType === 'video' ? (
                    <video
                      key={activeSlide.mediaUrl}
                      src={activeSlide.mediaUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    activeSlide && (
                      <Image
                        src={activeSlide.mediaUrl}
                        alt="Story slide preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    )
                  )}

                  {/* Draggable Text Overlays */}
                  {activeSlide?.textOverlays.map((ov) => {
                    const isSelected = ov.id === selectedOverlayId;
                    return (
                      <div
                        key={ov.id}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setSelectedOverlayId(ov.id);
                          setDraggingOverlayId(ov.id);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOverlayId(ov.id);
                        }}
                        style={{
                          left: `${ov.x}%`,
                          top: `${ov.y}%`,
                          transform: 'translate(-50%, -50%)',
                          color: ov.color,
                        }}
                        className={`absolute z-30 max-w-[84%] text-center leading-snug cursor-grab active:cursor-grabbing ${renderOverlayClasses(
                          ov
                        )} ${isSelected ? 'ring-2 ring-[#E6C367] ring-offset-2 ring-offset-black/40' : ''}`}
                      >
                        {ov.text || 'Type text...'}
                      </div>
                    );
                  })}

                  {/* Live Tagged Product Sticker Preview */}
                  {taggedPreviewProduct && (
                    <div className="absolute bottom-4 inset-x-3 z-20 p-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 flex items-center gap-2 pointer-events-none">
                      <div className="relative h-8 w-8 rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={taggedPreviewProduct.imageUrl || '/images/no-product.svg'}
                          alt=""
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-white truncate">{taggedPreviewProduct.name}</div>
                        <div className="text-[9px] text-[#E6C367] font-mono-luxury">
                          ₦{Number(taggedPreviewProduct.price || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Floating Quick Add Text Pill */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddTextOverlay();
                    }}
                    className="absolute top-7 right-3 z-30 px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white text-[11px] font-mono-luxury inline-flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Type className="h-3.5 w-3.5 text-[#E6C367]" />
                    <span>+ Text</span>
                  </button>
                </div>

                {/* Multi-Slide Filmstrip Queue */}
                <div className="w-full max-w-[300px] flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {slides.map((s, idx) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setActiveSlideIdx(idx);
                        setSelectedOverlayId(null);
                      }}
                      className={`relative h-14 w-11 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer bg-zinc-900 ${
                        idx === activeSlideIdx
                          ? 'border-[var(--gold-accent)]'
                          : 'border-[var(--border-subtle)] opacity-70'
                      }`}
                    >
                      {s.mediaType === 'video' ? (
                        <video src={s.mediaUrl} muted playsInline className="w-full h-full object-cover" />
                      ) : (
                        <Image src={s.mediaUrl} alt="" fill unoptimized className="object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSlide(idx);
                        }}
                        className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/80 text-white flex items-center justify-center cursor-pointer"
                        aria-label="Remove slide"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}

                  {slides.length < MAX_SLIDES && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="h-14 w-11 rounded-xl border border-dashed border-[var(--border-hover)] hover:border-[var(--gold-accent)] flex flex-col items-center justify-center gap-0.5 text-[var(--text-muted)] hover:text-[var(--gold-accent)] shrink-0 cursor-pointer"
                      title="Add another slide"
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[var(--gold-accent)]" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span className="text-[8px] font-mono-luxury">Add</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* RIGHT: Text Overlay Controls + Caption + Tag Product + Publish */}
              <div className="lg:col-span-7 space-y-4">
                {/* Text Overlay Studio Panel */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4 text-[var(--gold-accent)]" />
                      <span className="text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-primary)]">
                        Text On Slide {activeSlideIdx + 1}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddTextOverlay}
                      className="px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[11px] font-mono-luxury text-[var(--text-primary)] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3 text-[var(--gold-accent)]" />
                      <span>Add Text</span>
                    </button>
                  </div>

                  {activeSlide && activeSlide.textOverlays.length > 0 ? (
                    <div className="space-y-3">
                      {/* Selectable Text Layers */}
                      <div className="flex flex-wrap gap-1.5">
                        {activeSlide.textOverlays.map((ov, i) => (
                          <div
                            key={ov.id}
                            onClick={() => setSelectedOverlayId(ov.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border cursor-pointer ${
                              ov.id === selectedOverlayId
                                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]'
                                : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                            }`}
                          >
                            <span className="max-w-[120px] truncate">{ov.text || `Text ${i + 1}`}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSelectedOverlay(ov.id);
                              }}
                              className="opacity-70 hover:opacity-100 cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {activeOverlay && (
                        <div className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3">
                          <input
                            type="text"
                            maxLength={140}
                            value={activeOverlay.text}
                            onChange={(e) => updateSelectedOverlay({ text: e.target.value })}
                            placeholder="Write overlay text..."
                            className="w-full h-10 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                          />

                          {/* Font & Size Row */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="inline-flex gap-1">
                              {(
                                [
                                  { id: 'editorial', label: 'Editorial' },
                                  { id: 'sans', label: 'Modern' },
                                  { id: 'mono', label: 'Caps' },
                                ] as const
                              ).map((f) => (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => updateSelectedOverlay({ fontStyle: f.id })}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono-luxury cursor-pointer ${
                                    activeOverlay.fontStyle === f.id
                                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                                  }`}
                                >
                                  {f.label}
                                </button>
                              ))}
                            </div>

                            <div className="inline-flex gap-1">
                              {(['sm', 'md', 'lg'] as const).map((sz) => (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => updateSelectedOverlay({ size: sz })}
                                  className={`w-7 h-7 rounded-lg text-[10px] font-mono-luxury uppercase cursor-pointer ${
                                    activeOverlay.size === sz
                                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                                  }`}
                                >
                                  {sz}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Color + Pill Background + Quick Position */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-1.5">
                              {TEXT_COLORS.map((c) => (
                                <button
                                  key={c.hex}
                                  type="button"
                                  onClick={() => updateSelectedOverlay({ color: c.hex })}
                                  style={{ backgroundColor: c.hex }}
                                  className={`h-6 w-6 rounded-full border cursor-pointer ${
                                    activeOverlay.color === c.hex
                                      ? 'ring-2 ring-[var(--gold-accent)] ring-offset-2 ring-offset-[var(--bg-primary)]'
                                      : 'border-black/20 dark:border-white/30'
                                  }`}
                                  title={c.label}
                                />
                              ))}
                            </div>

                            <div className="inline-flex gap-1">
                              {(['none', 'dark', 'light', 'gold'] as const).map((bg) => (
                                <button
                                  key={bg}
                                  type="button"
                                  onClick={() => updateSelectedOverlay({ bgStyle: bg })}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-mono-luxury capitalize cursor-pointer ${
                                    activeOverlay.bgStyle === bg
                                      ? 'bg-[var(--gold-accent)] text-black'
                                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                                  }`}
                                >
                                  {bg}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 text-[10px] font-mono-luxury text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
                            <span className="inline-flex items-center gap-1">
                              <Move className="h-3 w-3" /> Drag on preview or snap:
                            </span>
                            <div className="inline-flex gap-1">
                              {[
                                { label: 'Top', y: 24 },
                                { label: 'Center', y: 50 },
                                { label: 'Bottom', y: 72 },
                              ].map((pos) => (
                                <button
                                  key={pos.label}
                                  type="button"
                                  onClick={() => updateSelectedOverlay({ x: 50, y: pos.y })}
                                  className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] cursor-pointer"
                                >
                                  {pos.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] font-light">
                      Tap <strong>+ Add Text</strong> to place captions, prices, or drop announcements right on top of this slide.
                    </p>
                  )}
                </div>

                {/* Slide Caption & Product Tag */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4">
                  <div>
                    <label className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                      Slide {activeSlideIdx + 1} Bottom Caption (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={180}
                      value={activeSlide?.caption || ''}
                      onChange={(e) => updateActiveSlide((s) => ({ ...s, caption: e.target.value }))}
                      placeholder="e.g. Limited restock now available in sizes S–XXL"
                      className="w-full h-11 px-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono-luxury uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5 mb-1.5">
                      <Tag className="h-3 w-3 text-[var(--gold-accent)]" />
                      <span>Tag a Piece on Slide {activeSlideIdx + 1} (Optional)</span>
                    </label>
                    <select
                      value={activeSlide?.taggedProductId || ''}
                      onChange={(e) => updateActiveSlide((s) => ({ ...s, taggedProductId: e.target.value }))}
                      className="w-full h-11 px-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none cursor-pointer"
                    >
                      <option value="">No product tagged</option>
                      {vendorProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ₦{Number(p.price).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)] cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={notifyFollowers}
                      onChange={(e) => setNotifyFollowers(e.target.checked)}
                      className="h-4 w-4 rounded accent-[var(--gold-accent)] cursor-pointer"
                    />
                    <Users className="h-3.5 w-3.5 text-[var(--gold-accent)] shrink-0" />
                    <span>Notify all followers immediately in-app &amp; by email</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isPublishing || isUploading || slides.length === 0}
                    className="w-full h-12 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Publishing {slides.length} Slide{slides.length > 1 ? 's' : ''}...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-[var(--gold-accent)]" />
                        <span>
                          Publish {slides.length > 1 ? `All ${slides.length} Slides` : 'Story'} (24h Live)
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      )}

      {/* ACTIVE 24H STORIES + LIVE VIEWS & REACTIONS INSIGHTS */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-editorial text-2xl font-normal text-[var(--text-primary)]">
              Live Stories &amp; Insights ({activeStories.length})
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] font-light">
              Auto-deletes from Shop &amp; Cloudinary storage after 24 hours
            </p>
          </div>
        </div>

        {activeStories.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)] font-light">
            No active stories right now. Publish a photo or clip above to appear on Shop for 24 hours.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activeStories.map((st) => {
              const reactionEntries = Object.entries(st.reactions || {}).filter(([, c]) => Number(c) > 0);
              const isExpanded = expandedInsightsId === st.id;

              return (
                <div
                  key={st.id}
                  className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden"
                >
                  <div className="p-3.5 flex items-center gap-3.5">
                    <div className="relative h-20 w-14 rounded-xl overflow-hidden bg-black shrink-0 border border-[var(--border-subtle)]">
                      {st.mediaType === 'video' ? (
                        <video src={st.mediaUrl} muted playsInline className="w-full h-full object-cover" />
                      ) : (
                        <Image src={st.mediaUrl} alt={st.caption || ''} fill unoptimized className="object-cover" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-1">
                        {st.caption || st.textOverlays?.[0]?.text || 'Lookbook Story'}
                      </p>

                      {/* Live Views & Reactions Counters */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-luxury">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                          <Eye className="h-3 w-3 text-[var(--gold-accent)]" />
                          <span>{st.viewCount || 0}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                          <Heart className="h-3 w-3 text-rose-500" />
                          <span>{st.totalReactions || 0}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeRemaining(st.expiresAt)}</span>
                        </span>
                      </div>

                      {/* Emoji Breakdown Pills */}
                      {reactionEntries.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {reactionEntries.map(([emoji, count]) => (
                            <span
                              key={emoji}
                              className="px-2 py-0.5 rounded-full bg-[var(--gold-subtle)] text-[11px] font-mono-luxury text-[var(--text-primary)]"
                            >
                              {emoji} {count}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteStory(st.id)}
                      disabled={deletingId === st.id}
                      className="h-8 w-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-rose-500/40 text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center shrink-0 cursor-pointer"
                      title="Delete story from Shop & Cloudinary"
                    >
                      {deletingId === st.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Expandable Viewers & Reactions Drawer */}
                  <div className="border-t border-[var(--border-subtle)] px-3.5 py-2 bg-[var(--bg-primary)]/40">
                    <button
                      type="button"
                      onClick={() => setExpandedInsightsId(isExpanded ? null : st.id)}
                      className="w-full flex items-center justify-between text-[11px] font-mono-luxury text-[var(--text-secondary)] cursor-pointer"
                    >
                      <span>
                        Viewers &amp; Reactions ({st.recentInteractions?.length || 0})
                      </span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="pt-2.5 space-y-1.5 max-h-40 overflow-y-auto">
                        {!st.recentInteractions || st.recentInteractions.length === 0 ? (
                          <p className="text-[11px] text-[var(--text-muted)] font-light py-1">
                            No shopper views or reactions yet — share your store link to drive traffic!
                          </p>
                        ) : (
                          st.recentInteractions.map((inter, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs py-1 border-t border-[var(--border-subtle)]/50 first:border-0"
                            >
                              <span className="text-[var(--text-primary)] truncate">{inter.viewerName}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                {inter.emoji && <span className="text-sm">{inter.emoji}</span>}
                                <span className="text-[10px] font-mono-luxury text-[var(--text-muted)]">
                                  {new Date(inter.viewedAt).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
