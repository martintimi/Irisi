'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useStore } from '@/lib/store/useStore';
import { VendorStory } from '@/types';
import {
  Sparkles, UploadCloud, CheckCircle2, ShoppingBag, ExternalLink,
  Tag, Loader2, Trash2, Users, Clock, Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { compressImageToFile } from '@/lib/utils/imageUtils';

export default function VendorStoriesPage() {
  const { vendorProfile, allProducts, addVendorStory } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [notifyFollowers, setNotifyFollowers] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [followersNotified, setFollowersNotified] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [requiresPlus, setRequiresPlus] = useState(false);
  const [activeStories, setActiveStories] = useState<VendorStory[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const vendorProducts = allProducts.filter(
    (p) =>
      (p.vendorId || '').toLowerCase() === (vendorProfile.email || '').toLowerCase() ||
      (p.vendorId || '').toLowerCase() === (vendorProfile.id || '').toLowerCase() ||
      p.vendorName === vendorProfile.brandName
  );

  const vendorLookupKey = vendorProfile.id || vendorProfile.brandName?.toLowerCase().replace(/\s+/g, '-') || vendorProfile.email || '';

  const loadMyStories = useCallback(async () => {
    if (!vendorLookupKey) return;
    try {
      const res = await fetch(`/api/stories?vendorId=${encodeURIComponent(vendorLookupKey)}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.stories)) {
        setActiveStories(data.stories);
      }
    } catch {}
  }, [vendorLookupKey]);

  useEffect(() => {
    loadMyStories();
  }, [loadMyStories]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isVideo = file.type.startsWith('video/');
      setErrorMsg('');
      setIsUploading(true);
      try {
        const uploadFile = isVideo ? file : await compressImageToFile(file, 1400, 0.85);
        const formData = new FormData();
        formData.append('file', uploadFile);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok && data.url) {
          setMediaPreview(data.url);
          setMediaType(isVideo ? 'video' : 'image');
        } else {
          setErrorMsg(data.error || 'Could not upload story media.');
        }
      } catch (err) {
        console.error('Story media upload failed:', err);
        setErrorMsg('Upload failed. Please try a smaller photo or short clip.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handlePublishStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaPreview) return;
    setErrorMsg('');
    setRequiresPlus(false);
    setIsPublishing(true);

    const taggedProd = allProducts.find((p) => p.id === selectedProductId);

    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendorProfile.id || vendorLookupKey,
          vendorEmail: vendorProfile.email,
          vendorName: vendorProfile.brandName || 'Verified Brand',
          vendorAvatar: vendorProfile.logoUrl || mediaPreview,
          mediaUrl: mediaPreview,
          mediaType,
          caption: caption.trim() || `New drop from ${vendorProfile.brandName}`,
          taggedProductId: taggedProd?.id,
          taggedProductName: taggedProd?.name,
          taggedProductPrice: taggedProd?.price,
          taggedProductImage: taggedProd?.imageUrl,
          notifyFollowers,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.requiresPlus) setRequiresPlus(true);
        setErrorMsg(data.error || 'Could not publish story.');
        return;
      }

      if (data.story) {
        addVendorStory(data.story);
        setActiveStories((prev) => [data.story, ...prev]);
      }
      setFollowersNotified(Number(data.followersNotified || 0));
      setIsSuccess(true);

      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#e6c367', '#ffffff', '#10b981'],
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

  const resetForm = () => {
    setMediaPreview(null);
    setMediaType('image');
    setCaption('');
    setSelectedProductId('');
    setIsSuccess(false);
    setErrorMsg('');
  };

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-8 animate-fadeIn pb-24">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--gold-accent)] animate-ping" />
          <span className="text-xs font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)]">
            Live Brand Stories · 48h Feed
          </span>
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-normal text-[var(--text-primary)] mt-1">
          Post Lookbook Drop Story
        </h1>
        <p className="text-xs text-[var(--text-secondary)] font-light mt-1">
          Share new arrivals, behind-the-scenes workshop clips, or restock teasers directly to shoppers and your followers.
        </p>
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

      {isSuccess ? (
        <div className="p-8 rounded-3xl surface-card border border-emerald-500/30 text-center space-y-5">
          <div className="h-14 w-14 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="font-editorial text-2xl font-normal text-[var(--text-primary)]">
              Story Published Live
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-light">
              Your story is now live on the discovery feed and your brand storefront for 48 hours
              {followersNotified > 0 ? ` — ${followersNotified} follower${followersNotified > 1 ? 's' : ''} alerted.` : '.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase tracking-wider cursor-pointer"
            >
              Post Another Story
            </button>
            <Link
              href="/"
              className="px-6 py-3 rounded-full border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-primary)] inline-flex items-center gap-1.5"
            >
              <span>View Feed</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handlePublishStory} className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-xl font-normal text-[var(--text-primary)]">
                1. Story Photo or Short Clip <span className="text-rose-500">*</span>
              </h3>
              <span className="text-[11px] font-mono-luxury text-[var(--text-muted)]">Portrait Photo or ≤15s Video</span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--gold-accent)] transition-all rounded-3xl p-8 text-center cursor-pointer bg-[var(--bg-primary)]/50 group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/mp4,video/quicktime,video/webm"
                className="hidden"
              />

              {isUploading ? (
                <div className="py-10 flex flex-col items-center gap-3">
                  <Loader2 className="h-7 w-7 animate-spin text-[var(--gold-accent)]" />
                  <span className="text-xs font-mono-luxury text-[var(--text-secondary)]">Uploading story media...</span>
                </div>
              ) : mediaPreview ? (
                <div className="space-y-4">
                  <div className="relative h-72 max-w-xs mx-auto rounded-2xl overflow-hidden shadow-xl border border-[var(--border-subtle)] bg-black">
                    {mediaType === 'video' ? (
                      <video src={mediaPreview} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : (
                      <Image src={mediaPreview} alt="Story preview" fill unoptimized className="object-cover" />
                    )}
                  </div>
                  <p className="text-xs font-mono-luxury text-[var(--gold-accent)]">
                    Click to replace media
                  </p>
                </div>
              ) : (
                <div className="space-y-3 py-6">
                  <div className="h-14 w-14 rounded-2xl bg-[var(--gold-subtle)] text-[var(--gold-accent)] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-mono-luxury text-[var(--text-primary)]">
                      Upload Lookbook Photo or Video
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] font-light">
                      New drop preview, studio fitting, or fresh stock update
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-5">
            <h3 className="font-editorial text-xl font-normal text-[var(--text-primary)]">
              2. Caption, Product Tag &amp; Follower Alert
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1.5">
                  Story Caption / Drop Teaser
                </label>
                <input
                  type="text"
                  required
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Fresh studio drop just went live — limited pieces available."
                  className="w-full p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono-luxury focus:border-[var(--gold-accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                  <span>Tag a Published Piece for 1-Tap Quick Buy</span>
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono-luxury focus:border-[var(--gold-accent)] focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select a piece to tag (Optional) --</option>
                  {(vendorProducts.length > 0 ? vendorProducts : allProducts).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₦{Number(p.price || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)] cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={notifyFollowers}
                  onChange={(e) => setNotifyFollowers(e.target.checked)}
                  className="rounded border-[var(--border-subtle)] accent-[var(--gold-accent)]"
                />
                <Users className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                <span>Notify shoppers following my brand about this new drop</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={!mediaPreview || isPublishing || isUploading}
            className="w-full py-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs tracking-wider hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>{isPublishing ? 'Publishing Story...' : 'Publish Live Story (48h)'}</span>
          </button>
        </form>
      )}

      {/* Active Stories Manager */}
      {activeStories.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-2xl font-normal text-[var(--text-primary)]">
              Your Active Stories ({activeStories.length})
            </h2>
            <span className="text-[11px] font-mono-luxury text-[var(--text-muted)] flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Auto-expires after 48h</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {activeStories.map((story) => (
              <div key={story.id} className="rounded-2xl overflow-hidden surface-card border border-[var(--border-subtle)] flex flex-col">
                <div className="relative aspect-[3/4] bg-black">
                  {story.mediaType === 'video' ? (
                    <video src={story.mediaUrl} muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <Image src={story.mediaUrl} alt={story.caption} fill unoptimized className="object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteStory(story.id)}
                    disabled={deletingId === story.id}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                    aria-label="Delete story"
                  >
                    {deletingId === story.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-xs text-[var(--text-primary)] line-clamp-2 font-light">{story.caption}</p>
                  {story.taggedProductName && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono-luxury text-[var(--gold-accent)] truncate max-w-full">
                      <ShoppingBag className="h-3 w-3 shrink-0" />
                      <span className="truncate">{story.taggedProductName}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
