'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { XCircle, Save, ExternalLink, Star, Check } from 'lucide-react';

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
      if (!res.ok || !data.success) { setSaveError(data.error || 'Failed to save.'); return; }
      setSaveSuccess(true);
      setTimeout(() => {
        onSaved({ ...product, name: editName.trim(), price: Number(editPrice), gender_target: editGender, genderTarget: editGender, category: editCategory, description: editDescription.trim(), in_stock: editInStock, is_featured: editFeatured, colors: colorsPayload });
      }, 600);
    } catch (err: any) {
      setSaveError(err.message || 'Network error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl surface-card rounded-3xl border border-[var(--border-subtle)] shadow-2xl max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--bg-secondary)] z-10 rounded-t-3xl">
          <div>
            <span className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold block">Admin — Edit Product</span>
            <h3 className="font-editorial text-xl font-bold text-[var(--text-primary)] line-clamp-1">{product.name}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"><XCircle className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="relative aspect-[16/7] w-full rounded-2xl overflow-hidden bg-black border border-[var(--border-subtle)]">
            <Image src={product.imageUrl || product.image_url || '/images/no-product.svg'} alt={product.name} fill unoptimized className="object-contain" />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-[9px] font-mono-luxury text-white uppercase">{product.vendorName || product.vendor_name || 'Unknown Vendor'}</div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold block">Product Name</label>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm font-mono-luxury text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)] transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold block">Price (NGN)</label>
              <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm font-mono-luxury text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)] transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold block">Category</label>
              <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm font-mono-luxury text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)] transition-colors cursor-pointer">
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold block">Gender Target <span className="ml-2 text-[9px] text-rose-400 normal-case font-normal">Fix wrong gender here</span></label>
            <div className="flex gap-2">
              {GENDER_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setEditGender(opt.value)} className={`flex-1 py-2.5 rounded-xl text-xs font-mono-luxury font-bold uppercase tracking-wider border transition-all cursor-pointer ${editGender === opt.value ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)]' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--gold-accent)]'}`}>{opt.label}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold block">Colors <span className="ml-2 text-[9px] text-[var(--text-muted)] normal-case font-normal">{selectedColors.length > 0 ? selectedColors.join(', ') : 'None selected'}</span></label>
            <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              {ADMIN_COLOR_PALETTE.map(c => {
                const isSelected = selectedColors.includes(c.name);
                return (
                  <button key={c.name} type="button" title={c.name} onClick={() => toggleColor(c.name)} className={`relative h-7 w-7 rounded-full border-2 transition-all cursor-pointer active:scale-90 ${isSelected ? 'border-[var(--gold-accent)] scale-110 shadow-md' : 'border-transparent hover:border-white/40'}`} style={{ backgroundColor: c.hex }}>
                    {isSelected && <span className="absolute inset-0 flex items-center justify-center"><Check className="h-3 w-3 text-white drop-shadow" strokeWidth={3} /></span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold block">Description</label>
            <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs font-mono-luxury text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)] transition-colors resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setEditInStock(p => !p)} className={`flex-1 py-2.5 rounded-xl text-xs font-mono-luxury font-bold uppercase border transition-all cursor-pointer ${editInStock ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>{editInStock ? 'In Stock' : 'Out of Stock'}</button>
            <button type="button" onClick={() => setEditFeatured(p => !p)} className={`flex-1 py-2.5 rounded-xl text-xs font-mono-luxury font-bold uppercase border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${editFeatured ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-subtle)]'}`}>
              <Star className={`h-3.5 w-3.5 ${editFeatured ? 'fill-amber-400' : ''}`} />{editFeatured ? 'In Lookbook' : 'Not Featured'}
            </button>
          </div>
          {saveError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono-luxury">{saveError}</div>}
          <div className="flex items-center gap-3 pt-2 border-t border-[var(--border-subtle)]">
            <button onClick={handleSave} disabled={isSaving || saveSuccess} className="flex-1 py-3 rounded-xl bg-[var(--gold-accent)] text-black text-xs font-mono-luxury font-black uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2">
              {saveSuccess ? <><Check className="h-4 w-4 stroke-[3]" /><span>Saved!</span></> : isSaving ? <span>Saving...</span> : <><Save className="h-3.5 w-3.5" /><span>Save Changes</span></>}
            </button>
            <Link href={`/shop/${product.id}`} target="_blank" className="px-4 py-3 rounded-xl border border-[var(--border-subtle)] text-xs font-mono-luxury font-bold uppercase text-[var(--text-secondary)] hover:border-[var(--gold-accent)] transition-all flex items-center gap-1.5 cursor-pointer">
              <ExternalLink className="h-3.5 w-3.5" /><span>Preview</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}