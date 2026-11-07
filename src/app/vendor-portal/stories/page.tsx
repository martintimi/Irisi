'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useStore } from '@/lib/store/useStore';
import { Sparkles, UploadCloud, CheckCircle2, ShoppingBag, ExternalLink, ArrowRight, Tag, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { compressImageToFile } from '@/lib/utils/imageUtils';

export default function VendorStoriesPage() {
  const { vendorProfile, allProducts, addVendorStory } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Vendor's own products to tag
  const vendorProducts = allProducts.filter(
    (p) => (p.vendorId || '').toLowerCase() === (vendorProfile.email || '').toLowerCase() || p.vendorName === vendorProfile.brandName
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setIsUploading(true);
      try {
        const compressed = await compressImageToFile(file, 1400, 0.85);
        const formData = new FormData();
        formData.append('file', compressed);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok && data.url) {
          setImagePreview(data.url);
        }
      } catch (err) {
        console.error('Story image upload to Cloudinary failed:', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handlePublishStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview) return;

    const taggedProd = allProducts.find((p) => p.id === selectedProductId);

    const newStory = {
      id: `story-${Date.now()}`,
      vendorId: vendorProfile.email || 'moji-wears',
      vendorName: vendorProfile.brandName || 'Boutique Merchant',
      vendorAvatar: imagePreview,
      mediaUrl: imagePreview,
      caption: caption.trim() || `New drop from ${vendorProfile.brandName}`,
      taggedProductId: taggedProd?.id,
      taggedProductName: taggedProd?.name,
      taggedProductPrice: taggedProd?.price,
      taggedProductImage: taggedProd?.imageUrl,
      createdAt: new Date().toISOString()
    };

    addVendorStory(newStory);
    setIsSuccess(true);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#e6c367', '#ffffff', '#10b981']
    });
  };

  const resetForm = () => {
    setImageFile(null);
    setImagePreview(null);
    setCaption('');
    setSelectedProductId('');
    setIsSuccess(false);
  };

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-8 animate-fadeIn pb-24">
      
      {/* Top Header */}
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--gold-accent)] animate-ping" />
          <span className="text-xs font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold">
            Mobile Discovery Engine
          </span>
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-1">
          Post Lookbook Drop Story
        </h1>
        <p className="text-xs font-mono-luxury text-[var(--text-secondary)] mt-1">
          Publish vertical stories that appear directly on customer smartphone feeds. Tag garments for 1-tap shopping.
        </p>
      </div>

      {isSuccess ? (
        <div className="p-8 sm:p-12 rounded-3xl surface-card border border-emerald-500/40 text-center space-y-6 animate-fadeIn shadow-2xl">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <span className="text-xs font-mono-luxury text-emerald-400 uppercase font-bold tracking-widest">
              Live in Mobile Stories Bar
            </span>
            <h2 className="font-editorial text-3xl font-bold text-[var(--text-primary)] mt-1">
              Story Published!
            </h2>
            <p className="text-xs font-mono-luxury text-[var(--text-secondary)] mt-2 max-w-md mx-auto">
              Your lookbook story is now featured in the glowing mobile discovery bar. Followers will see it first.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/shop"
              target="_blank"
              className="px-6 py-3 rounded-full bg-[var(--gold-accent)] text-black text-xs font-mono-luxury uppercase font-bold hover:bg-[#d8b357] transition-all shadow-md flex items-center gap-2"
            >
              <span>View Mobile Stories</span>
              <ExternalLink className="h-4 w-4 text-black" />
            </Link>

            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-mono-luxury uppercase font-bold hover:border-[var(--gold-accent)] transition-all cursor-pointer"
            >
              + Post Another Story
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handlePublishStory} className="space-y-6">
          
          {/* 1. Media Upload */}
          <div className="p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-lg font-bold text-[var(--text-primary)]">
                1. Lookbook Story Photo <span className="text-rose-500">*</span>
              </h3>
              <span className="text-[11px] font-mono-luxury text-[var(--text-muted)]">Vertical 9:16 or Portrait</span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--gold-accent)] transition-all rounded-3xl p-8 text-center cursor-pointer bg-[var(--bg-primary)]/50 group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {imagePreview ? (
                <div className="space-y-4">
                  <div className="relative h-72 max-w-xs mx-auto rounded-2xl overflow-hidden shadow-2xl border border-[var(--border-subtle)]">
                    <Image src={imagePreview} alt="Preview" fill unoptimized className="object-cover" />
                  </div>
                  <p className="text-xs font-mono-luxury text-[var(--gold-accent)] font-bold">
                    Click to replace photo
                  </p>
                </div>
              ) : (
                <div className="space-y-3 py-6">
                  <div className="h-14 w-14 rounded-2xl bg-[var(--gold-subtle)] text-[var(--gold-accent)] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-mono-luxury font-bold text-[var(--text-primary)]">
                      Upload Lookbook Photo
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] font-mono-luxury">
                      Behind-the-scenes, fitting showcase, or drop teaser
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Tagged Garment & Caption */}
          <div className="p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-5">
            <h3 className="font-editorial text-lg font-bold text-[var(--text-primary)]">
              2. Story Caption & Tagged Piece
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1.5 font-bold">
                  Story Caption / Drop Teaser
                </label>
                <input
                  type="text"
                  required
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Midnight TrapStar Drop ⚡ Limited pieces available in Lagos now."
                  className="w-full p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono-luxury focus:border-[var(--gold-accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-luxury uppercase text-[var(--text-secondary)] mb-1.5 font-bold flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
                  <span>Tag a Published Piece for 1-Tap Quick Buy</span>
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono-luxury font-bold focus:border-[var(--gold-accent)] focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select a garment to tag (Optional) --</option>
                  {(vendorProducts.length > 0 ? vendorProducts : allProducts).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₦{Number(p.price || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!imagePreview}
            className="w-full py-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            <span>Publish Lookbook Story to Mobile Feed</span>
          </button>

        </form>
      )}

    </div>
  );
}
