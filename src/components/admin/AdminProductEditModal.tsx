'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Save, ExternalLink, Star, Check, Sparkles, AlertCircle } from 'lucide-react';

const ADMIN_COLOR_PALETTE = [
  { name: 'Black', hex: '#111111' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Gold', hex: '#d4af37' },
  { name: 'Silver', hex: '#c0c0c0' },
  { name: 'Rose Gold', hex: '#b76e79' },
  { name: 'Navy Blue', hex: '#1e3a8a' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Sky Blue', hex: '#38bdf8' },
  { name: 'Heather Grey', hex: '#9ca3af' },
  { name: 'Charcoal Grey', hex: '#374151' },
  { name: 'Khaki / Beige', hex: '#d4b996' },
  { name: 'Chocolate Brown', hex: '#451a03' },
  { name: 'Tan / Camel', hex: '#c19a6b' },
  { name: 'Forest Green', hex: '#065f46' },
  { name: 'Olive Green', hex: '#4d7c0f' },
  { name: 'Wine / Burgundy', hex: '#831843' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Multi-Color / Pattern', hex: '#6366f1' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'unisex', label: 'Unisex' },
];

const CATEGORY_OPTIONS = [
  'tops', 'bottoms', 'outerwear', 'footwear', 'accessories', 'native', 'bags',
];

interface Props {
  product: any;
  onClose: () => void;
  onSaved: (updated: any) => void;
}

export default function AdminProductEditModal({ product, onClose, onSaved }: Props) {
  const [editName, setEditName] = useState(product.name || '');
  const [editPrice, setEditPrice] = useState(String(product.price || ''));
  const [editGender, setEditGender] = useState(product.genderTarget || product.gender_target || 'unisex');
  const [editCategory, setEditCategory] = useState(product.category || 'tops');
  const [editDescription, setEditDescription] = useState(product.description || '');
  const [editInStock, setEditInStock] = useState(product.in_stock !== false);
  const [editFeatured, setEditFeatured] = useState(!!product.is_featured);

  const initialColors: string[] = Array.isArray(product.colors)
    ? product.colors.map((c: any) => (typeof c === 'string' ? c : c.name || '')).filter(Boolean)
    : [];
  const [selectedColors, setSelectedColors] = useState<string[]>(initialColors);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Strict scroll lock on mount
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const toggleColor = (colorName: string) => {
    setSelectedColors(prev =>
      prev.includes(colorName) ? prev.filter(c => c !== colorName) : [...prev, colorName]
    );
  };

  const handleSave = async () => {
    if (!editName.trim()) { setSaveError('Product name is required'); return; }
    if (!editPrice || isNaN(Number(editPrice))) { setSaveError('Enter a valid price'); return; }
    setSaveError('');
    setIsSaving(true);
    try {
      const colorsPayload = selectedColors.map(name => {
        const match = ADMIN_COLOR_PALETTE.find(c => c.name === name);
        return { name, hex: match?.hex || '#111111' };
      });

      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          name: editName.trim(),
          price: Number(editPrice),
          genderTarget: editGender,
          category: editCategory,
          description: editDescription.trim(),
          inStock: editInStock,
          isFeatured: editFeatured,
          colors: colorsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSaveError(data.error || 'Failed to save.');
        return;
      }

      setSaveSuccess(true);
      setTimeout(() => {
        onSaved({
          ...product,
          name: editName.trim(),
          price: Number(editPrice),
          gender_target: editGender,
          genderTarget: editGender,
          category: editCategory,
          description: editDescription.trim(),
          in_stock: editInStock,
          is_featured: editFeatured,
          colors: colorsPayload,
        });
      }, 500);
    } catch (err: any) {
      setSaveError(err.message || 'Network error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* 1. STICKY TOP HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm shrink-0">
          <div>
            <span className="text-[10px] font-mono-luxury uppercase text-amber-400 font-bold tracking-wider block">
              Super Admin Control
            </span>
            <h3 className="font-editorial text-lg sm:text-xl font-bold text-white line-clamp-1">
              Edit: {product.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2. SCROLLABLE EDIT BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 overscroll-contain">

          {/* Compact Product Header Card (Image + Quick Info) */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800">
            <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-black shrink-0 border border-neutral-800">
              <Image
                src={product.imageUrl || product.image_url || '/images/no-product.svg'}
                alt={product.name}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono-luxury uppercase font-bold text-amber-400 block">
                Vendor: {product.vendorName || product.vendor_name || 'Independent Atelier'}
              </span>
              <p className="text-xs text-neutral-300 truncate font-bold mt-0.5">{product.name}</p>
              <p className="text-xs text-neutral-400 font-mono-luxury mt-1">
                Current: <span className="text-white font-bold uppercase">{product.gender_target || product.genderTarget || 'Unisex'}</span> · ₦{Number(product.price || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Product Name Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono-luxury uppercase text-amber-400 font-bold block tracking-wider">
              Product Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Price + Category Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono-luxury uppercase text-amber-400 font-bold block tracking-wider">
                Price (₦)
              </label>
              <input
                type="number"
                value={editPrice}
                onChange={e => setEditPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors font-mono-luxury"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono-luxury uppercase text-amber-400 font-bold block tracking-wider">
                Category
              </label>
              <select
                value={editCategory}
                onChange={e => setEditCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
              >
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* GENDER TARGET — MAIN FIX */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-neutral-950/60 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono-luxury uppercase text-amber-400 font-bold tracking-wider block">
                Target Gender
              </label>
              <span className="text-[10px] text-amber-300 font-medium">
                Fix misplaced female / male items
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {GENDER_OPTIONS.map(opt => {
                const isSelected = editGender === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEditGender(opt.value)}
                    className={`py-3 rounded-xl text-xs font-mono-luxury font-black uppercase tracking-wider transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-400 text-black border-amber-400 shadow-md scale-[1.02]'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLOR PALETTE SWATCHES */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono-luxury uppercase text-amber-400 font-bold tracking-wider block">
                Available Colors
              </label>
              <span className="text-[10px] font-mono-luxury text-neutral-400">
                {selectedColors.length > 0 ? selectedColors.join(', ') : 'None selected'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5 p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
              {ADMIN_COLOR_PALETTE.map(c => {
                const isSelected = selectedColors.includes(c.name);
                return (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    onClick={() => toggleColor(c.name)}
                    className={`relative h-7 w-7 rounded-full border-2 transition-all cursor-pointer active:scale-90 ${
                      isSelected
                        ? 'border-amber-400 scale-110 shadow-lg ring-2 ring-amber-400/40'
                        : 'border-transparent hover:border-white/50'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono-luxury uppercase text-amber-400 font-bold tracking-wider block">
              Product Description
            </label>
            <textarea
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-400 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* In Stock & Featured Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setEditInStock(p => !p)}
              className={`py-3 px-4 rounded-xl text-xs font-mono-luxury font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                editInStock
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
              }`}
            >
              {editInStock ? '✓ In Stock' : '✕ Out of Stock'}
            </button>

            <button
              type="button"
              onClick={() => setEditFeatured(p => !p)}
              className={`py-3 px-4 rounded-xl text-xs font-mono-luxury font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                editFeatured
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${editFeatured ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{editFeatured ? 'In Lookbook' : 'Standard'}</span>
            </button>
          </div>

          {saveError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}
        </div>

        {/* 3. STICKY BOTTOM FOOTER (Always visible without scrolling!) */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center gap-3 shrink-0 rounded-b-3xl">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || saveSuccess}
            className="flex-1 py-3 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-mono-luxury font-black uppercase tracking-wider transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-[0.99]"
          >
            {saveSuccess ? (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Saved & Updated!</span>
              </>
            ) : isSaving ? (
              <span>Saving to Catalog...</span>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>

          <Link
            href={`/shop/${product.id}`}
            target="_blank"
            className="px-4 py-3 rounded-xl border border-neutral-800 hover:border-amber-400/50 bg-neutral-900 text-xs font-mono-luxury font-bold uppercase text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Live Shop</span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-xs font-mono-luxury font-bold uppercase text-neutral-400 hover:text-white transition-all cursor-pointer shrink-0"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}