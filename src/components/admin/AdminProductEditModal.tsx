'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Save, ExternalLink, Star, Check, AlertCircle, Layers, CheckCircle2, Camera, Trash2, Plus, Loader2, Palette } from 'lucide-react';
import { INITIAL_CATEGORIES } from '@/lib/data/categories';
import { parseAndNormalizeColors, STANDARD_FASHION_COLORS, resolveColorNameToHex } from '@/lib/utils/colorUtils';

const ADMIN_COLOR_PALETTE = STANDARD_FASHION_COLORS;

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'unisex', label: 'Unisex' },
];

const DEFAULT_CATEGORIES_BY_GENDER = {
  male: [
    { id: 'senator_kaftan', label: 'Senator Sets & Kaftans (Native)' },
    { id: 'agbada_robes', label: 'Grand Agbada 3-Piece (Native)' },
    { id: 'jalabiya_tunics', label: 'Jalabiya & Tunics (Native)' },
    { id: 'men_caps_fila', label: 'Aso-Oke Fila & Caps (Native)' },
    { id: 'streetwear_hoodie', label: 'Streetwear Hoodies & Sweats' },
    { id: 'suits_blazers', label: 'Suits, Tuxedos & Blazers' },
    { id: 'tshirts_tees', label: 'T-Shirts & Graphic Tees' },
    { id: 'shirts_polos', label: 'Luxury Shirts & Polos' },
    { id: 'jackets_coats', label: 'Jackets & Windbreakers' },
    { id: 'jeans_trousers', label: 'Baggy Jeans & Cargo Pants' },
    { id: 'joggers_sweats', label: 'Joggers & Sweatpants' },
    { id: 'shorts_sets', label: 'Shorts & Casual Sets' },
    { id: 'men_underwears', label: 'Underwear & Loungewear' },
    { id: 'men_slides_palms', label: 'Slides, Palms & Slippers' },
    { id: 'men_shoes_sneakers', label: 'Sneakers & Street Trainers' },
    { id: 'men_shoes_loafers', label: 'Loafers, Shoes & Mules' },
    { id: 'men_shoes_clogs', label: 'Crocs & Foam Clogs (Footwear)' },
    { id: 'men_bags_backpacks', label: 'Backpacks & Travel Bags' },
    { id: 'men_bags_crossbody', label: 'Crossbody & Chest Rigs' },
    { id: 'men_jewelry_chains', label: 'Chains, Rings & Jewelry' },
    { id: 'men_watches', label: 'Luxury Wristwatches' },
    { id: 'men_eyewear', label: 'Sunglasses & Glasses' },
  ],
  female: [
    { id: 'dresses_gowns', label: 'Dresses, Gowns & Maxis (Apparel)' },
    { id: 'boubou_kaftans', label: 'Silk Boubou, Kaftans & Abayas (Native)' },
    { id: 'lace_ankara', label: 'Lace & Ankara Tailored Sets (Native)' },
    { id: 'two_piece_sets', label: 'Two-Piece Co-ord Sets' },
    { id: 'corsets_tops', label: 'Corsets, Tops & Blouses' },
    { id: 'female_streetwear', label: 'Female Streetwear & Hoodies' },
    { id: 'women_jeans_trousers', label: 'Jeans, Cargo & Pants' },
    { id: 'skirts_minis', label: 'Skirts & Mini Skirts' },
    { id: 'women_shorts', label: 'Shorts & Biker Sets' },
    { id: 'women_underwears', label: 'Underwear, Shapewear & Loungewear' },
    { id: 'women_heels_mules', label: 'Heels, Pumps & Mules' },
    { id: 'women_slides_palms', label: 'Slides, Palms & Flats' },
    { id: 'women_sneakers', label: 'Designer Sneakers' },
    { id: 'women_shoes_clogs', label: 'Crocs & Foam Clogs (Footwear)' },
    { id: 'women_bags_handbags', label: 'Handbags & Totes' },
    { id: 'women_bags_clutches', label: 'Clutches & Crossbody Minis' },
    { id: 'women_jewelry', label: 'Jewelry, Necklaces & Bangles' },
    { id: 'women_watches', label: 'Women’s Luxury Watches' },
    { id: 'women_sunglasses', label: 'Sunglasses & Shades' },
    { id: 'women_caps_scarves', label: 'Headbands, Scarves & Caps' },
  ],
  unisex: [
    { id: 'unisex_hoodie', label: 'Streetwear Hoodies & Sweaters' },
    { id: 'unisex_tees', label: 'Graphic Tees & Oversized Shirts' },
    { id: 'unisex_denim', label: 'Denim Jeans & Cargo Pants' },
    { id: 'unisex_slides_palms', label: 'Slides, Palms & Flats' },
    { id: 'unisex_shoes_clogs', label: 'Crocs & Foam Clogs (Footwear)' },
    { id: 'unisex_sneakers', label: 'Sneakers & Casual Shoes' },
    { id: 'unisex_jewelry', label: 'Chains, Rings & Jewelry' },
    { id: 'unisex_watches', label: 'Wristwatches & Timepieces' },
    { id: 'unisex_sunglasses', label: 'Sunglasses & Eyewear' },
    { id: 'unisex_caps_hats', label: 'Caps, Beanies & Hats' },
    { id: 'unisex_bags', label: 'Crossbody Bags & Backpacks' },
  ]
};

interface Props {
  product: any;
  onClose: () => void;
  onSaved: (updated: any) => void;
}

export default function AdminProductEditModal({ product, onClose, onSaved }: Props) {
  const [editName, setEditName] = useState(product.name || '');
  const [editPrice, setEditPrice] = useState(String(product.price || ''));
  const [editGender, setEditGender] = useState<'male' | 'female' | 'unisex'>(
    (product.genderTarget || product.gender_target || 'unisex').toLowerCase() as any
  );
  const [editCategory, setEditCategory] = useState(product.category || product.subCategory || 'tops');
  const [editDescription, setEditDescription] = useState(product.description || '');
  const [editInStock, setEditInStock] = useState(product.is_published !== false && product.in_stock !== false);
  const [editFeatured, setEditFeatured] = useState(
    Array.isArray(product.tags) ? product.tags.includes('featured') : !!product.is_featured
  );

  // Gallery Images State
  const rawImages: string[] = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : Array.isArray(product.gallery) && product.gallery.length > 0
    ? product.gallery
    : [product.imageUrl || product.image_url].filter(Boolean);
  const [editImages, setEditImages] = useState<string[]>(rawImages);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Live Categories state
  const [apiCategories, setApiCategories] = useState<any[]>([]);

  // Fetch live categories from /api/admin/categories endpoint
  useEffect(() => {
    fetch('/api/admin/categories')
      .then(res => res.json())
      .then(data => {
        if (data?.success && Array.isArray(data.categories)) {
          setApiCategories(data.categories);
        }
      })
      .catch(() => {});
  }, []);

  // Compute available category options based on active gender target
  const categoryOptions = useMemo(() => {
    const list: { id: string; label: string }[] = [];
    const seen = new Set<string>();

    // 1. Add predefined publish categories for the active gender
    const preset = DEFAULT_CATEGORIES_BY_GENDER[editGender] || DEFAULT_CATEGORIES_BY_GENDER.unisex;
    preset.forEach(c => {
      seen.add(c.id.toLowerCase());
      list.push(c);
    });

    // 2. Add dynamic categories fetched from /api/admin/categories
    apiCategories.forEach(c => {
      const id = c.slug || c.id;
      const key = id.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ id, label: `${c.name} (${c.department || 'general'})` });
      }
    });

    // 3. Fallback INITIAL_CATEGORIES
    INITIAL_CATEGORIES.forEach(c => {
      const id = c.slug || c.id;
      const key = id.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ id, label: `${c.name} (${c.department})` });
      }
    });

    // 4. If product currently has a category not in the list, keep it as an option
    if (editCategory && !seen.has(editCategory.toLowerCase())) {
      list.unshift({ id: editCategory, label: `${editCategory.toUpperCase()} (Current)` });
    }

    return list;
  }, [editGender, apiCategories, editCategory]);

  const initialColors: string[] = useMemo(() => {
    return parseAndNormalizeColors(product.colors).map(c => c.name);
  }, [product.colors]);

  const [selectedColors, setSelectedColors] = useState<string[]>(initialColors);
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#2563eb');

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Complete background scroll lock on both body and html
  useEffect(() => {
    const origBody = document.body.style.overflow;
    const origHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origBody;
      document.documentElement.style.overflow = origHtml;
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
    const clean = colorName.trim();
    if (!clean) return;
    setSelectedColors(prev =>
      prev.some(c => c.toLowerCase() === clean.toLowerCase())
        ? prev.filter(c => c.toLowerCase() !== clean.toLowerCase())
        : [...prev, clean]
    );
  };

  const removeColor = (colorName: string) => {
    setSelectedColors(prev => prev.filter(c => c.toLowerCase() !== colorName.toLowerCase()));
  };

  const addCustomColor = () => {
    const clean = customColorName.trim();
    if (!clean) return;
    if (!selectedColors.some(c => c.toLowerCase() === clean.toLowerCase())) {
      setSelectedColors(prev => [...prev, clean]);
    }
    setCustomColorName('');
    setShowCustomColor(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    setSaveError('');
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          uploadedUrls.push(data.url);
        } else {
          throw new Error(data.error || 'Failed to upload photo');
        }
      }
      setEditImages(prev => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      setSaveError('Upload error: ' + err.message);
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setEditImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetCover = (indexToCover: number) => {
    setEditImages(prev => {
      if (indexToCover === 0) return prev;
      const target = prev[indexToCover];
      const rest = prev.filter((_, idx) => idx !== indexToCover);
      return [target, ...rest];
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) { setSaveError('Product name is required'); return; }
    if (!editPrice || isNaN(Number(editPrice))) { setSaveError('Enter a valid price in Naira'); return; }
    setSaveError('');
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const colorsPayload = selectedColors;

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
          isPublished: editInStock,
          isFeatured: editFeatured,
          colors: colorsPayload,
          images: editImages,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSaveError(data.error || 'Failed to update product in database.');
        setIsSaving(false);
        return;
      }

      setSaveSuccess(true);
      setIsSaving(false);

      setTimeout(() => {
        onSaved({
          ...product,
          name: editName.trim(),
          price: Number(editPrice),
          gender_target: editGender,
          genderTarget: editGender,
          category: editCategory,
          description: editDescription.trim(),
          is_published: editInStock,
          in_stock: editInStock,
          is_featured: editFeatured,
          colors: parseAndNormalizeColors(selectedColors),
          images: editImages,
          imageUrl: editImages[0] || product.imageUrl,
        });
      }, 700);
    } catch (err: any) {
      console.error('Admin edit save error:', err);
      setSaveError(err.message || 'Network connection error');
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Modal Card with fixed height & flex column */}
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#121214] text-neutral-900 dark:text-white rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col h-[88vh] max-h-[88vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* 1. STICKY TOP HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-luxury uppercase text-amber-600 dark:text-amber-400 font-bold tracking-wider block">
                Super Admin Control
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[9px] font-mono-luxury font-bold">
                Live Edit
              </span>
            </div>
            <h3 className="font-editorial text-lg sm:text-xl font-bold text-neutral-900 dark:text-white line-clamp-1 mt-0.5">
              Edit: {product.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2. SCROLLABLE EDIT BODY (Isolated scroll container with min-h-0) */}
        <form
          id="admin-product-edit-form"
          onSubmit={handleSave}
          className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5 overscroll-contain"
        >
          {/* Top Error Alert if save failed */}
          {saveError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-semibold">{saveError}</span>
            </div>
          )}

          {/* Top Success Alert when saved */}
          {saveSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="font-semibold">Product updated in database successfully!</span>
            </div>
          )}

          {/* Multi-Photo Gallery Manager */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono-luxury uppercase text-amber-700 dark:text-amber-400 font-bold tracking-wider flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5" />
                <span>Product Photos & Gallery ({editImages.length})</span>
              </label>
              <span className="text-[10px] font-mono-luxury text-neutral-500 dark:text-neutral-400">
                {editImages.length === 0 ? 'No photos' : `${editImages.length} photo${editImages.length > 1 ? 's' : ''} (First is Cover)`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {editImages.map((imgUrl, idx) => (
                <div
                  key={`${imgUrl}-${idx}`}
                  className={`group relative aspect-square rounded-2xl overflow-hidden border transition-all ${
                    idx === 0
                      ? 'border-amber-500 ring-2 ring-amber-400/40 shadow-md'
                      : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-400'
                  }`}
                >
                  <Image
                    src={imgUrl}
                    alt={`Product photo ${idx + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />

                  {/* Index / Cover badge */}
                  <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1">
                    {idx === 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-400 text-black text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-black" />
                        <span>Cover</span>
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold">
                        #{idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Action buttons (Delete & Make Cover) */}
                  <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetCover(idx)}
                        className="p-1.5 rounded-lg bg-black/75 hover:bg-amber-400 text-white hover:text-black transition-colors shadow-sm cursor-pointer"
                        title="Make this photo the primary cover"
                      >
                        <Star className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-sm cursor-pointer"
                      title="Delete this photo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Bottom hover bar to set cover */}
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSetCover(idx)}
                      className="absolute inset-x-0 bottom-0 py-1 bg-black/80 text-[9px] text-amber-200 text-center font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      Set as Cover
                    </button>
                  )}
                </div>
              ))}

              {/* Upload New Photo(s) Box */}
              <label
                className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer ${
                  uploadingImage
                    ? 'border-amber-500 bg-amber-500/5 cursor-wait'
                    : 'border-neutral-300 dark:border-neutral-700 hover:border-amber-500 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750'
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={uploadingImage}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {uploadingImage ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin text-amber-500 mb-1" />
                    <span className="text-[10px] font-bold text-amber-500">Uploading...</span>
                  </>
                ) : (
                  <>
                    <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 flex items-center justify-center mb-1 text-amber-500">
                      <Plus className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold text-neutral-800 dark:text-neutral-200 leading-tight">
                      Add Photos
                    </span>
                    <span className="text-[8px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      1 or multiple
                    </span>
                  </>
                )}
              </label>
            </div>
            <p className="text-[9px] text-neutral-500 dark:text-neutral-400 italic">
              Click the red trash icon on any unwanted photo to remove it. Click the star icon to set as primary storefront cover.
            </p>
          </div>

          {/* Compact Product Summary Header */}
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800">
            <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-neutral-200 dark:bg-black shrink-0 border border-neutral-300 dark:border-neutral-700">
              <Image
                src={editImages[0] || product.imageUrl || product.image_url || '/images/no-product.svg'}
                alt={product.name}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono-luxury uppercase font-bold text-amber-600 dark:text-amber-400 block">
                Vendor: {product.vendorName || product.vendor_name || 'Independent Atelier'}
              </span>
              <p className="text-xs text-neutral-800 dark:text-neutral-200 truncate font-bold mt-0.5">{product.name}</p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono-luxury mt-0.5">
                Current: <span className="font-bold uppercase text-neutral-900 dark:text-white">{product.gender_target || product.genderTarget || 'Unisex'}</span> · ₦{Number(product.price || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Product Name Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono-luxury uppercase text-amber-700 dark:text-amber-400 font-bold block tracking-wider">
              Product Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 transition-colors font-medium shadow-sm"
            />
          </div>

          {/* Price + Category Row (Dynamically populated from /api/admin/categories) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono-luxury uppercase text-amber-700 dark:text-amber-400 font-bold block tracking-wider">
                Price (₦)
              </label>
              <input
                type="number"
                value={editPrice}
                onChange={e => setEditPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors font-mono-luxury font-bold shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono-luxury uppercase text-amber-700 dark:text-amber-400 font-bold block tracking-wider flex items-center gap-1">
                <Layers className="h-3 w-3" />
                <span>Category ({categoryOptions.length} available)</span>
              </label>
              <select
                value={editCategory}
                onChange={e => setEditCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer shadow-sm font-medium"
              >
                {categoryOptions.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* GENDER TARGET — MAIN FIX */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-amber-50/60 dark:bg-neutral-900/60 border border-amber-300 dark:border-amber-500/30">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono-luxury uppercase text-amber-700 dark:text-amber-400 font-bold tracking-wider block">
                Target Gender
              </label>
              <span className="text-[10px] text-amber-600 dark:text-amber-300 font-semibold">
                Auto-switches category presets
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {GENDER_OPTIONS.map(opt => {
                const isSelected = editGender === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setEditGender(opt.value as any);
                      const nextPresets = DEFAULT_CATEGORIES_BY_GENDER[opt.value as 'male' | 'female' | 'unisex'];
                      if (nextPresets && nextPresets.length > 0) {
                        setEditCategory(nextPresets[0].id);
                      }
                    }}
                    className={`py-2.5 rounded-xl text-xs font-mono-luxury font-black uppercase tracking-wider transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-400 text-black border-amber-500 shadow-md font-black scale-[1.02]'
                        : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-800 hover:border-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLOR MANAGEMENT SECTION */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono-luxury uppercase text-amber-700 dark:text-amber-400 font-bold tracking-wider flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" />
                <span>Available Colors ({selectedColors.length})</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCustomColor(!showCustomColor)}
                className="text-[10px] font-mono-luxury font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>{showCustomColor ? 'Close' : '+ Custom Shade'}</span>
              </button>
            </div>

            {/* Active Selected Colors with Remove Buttons */}
            {selectedColors.length > 0 && (
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                <span className="text-[9px] font-mono-luxury uppercase font-bold text-neutral-500 block">
                  Active Piece Colorways
                </span>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {selectedColors.map((colName) => {
                    const hex = resolveColorNameToHex(colName);
                    const isMulti = colName.toLowerCase().includes('multi');
                    return (
                      <div
                        key={colName}
                        className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-neutral-900 dark:text-white text-xs font-mono-luxury font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <span
                          className="h-3 w-3 rounded-full border border-white/20 shrink-0"
                          style={{
                            background: isMulti
                              ? 'conic-gradient(from 180deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #f59e0b, #ef4444, #ec4899)'
                              : hex
                          }}
                        />
                        <span>{colName}</span>
                        <button
                          type="button"
                          onClick={() => removeColor(colName)}
                          className="p-0.5 rounded-full hover:bg-rose-500/20 text-neutral-400 hover:text-rose-500 cursor-pointer ml-0.5"
                          title={`Remove ${colName}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Shade Input */}
            {showCustomColor && (
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-amber-500/40 flex items-center gap-2 animate-fadeIn">
                <input
                  type="color"
                  value={customColorHex}
                  onChange={(e) => setCustomColorHex(e.target.value)}
                  className="h-8 w-8 rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={customColorName}
                  onChange={(e) => setCustomColorName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomColor();
                    }
                  }}
                  placeholder="Type custom color name (e.g. Sage Green, Pale Pink)"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#121214] border border-neutral-300 dark:border-neutral-800 text-xs font-bold text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={addCustomColor}
                  disabled={!customColorName.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-black font-mono-luxury font-bold text-xs uppercase cursor-pointer disabled:opacity-40 hover:bg-amber-300"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomColor(false);
                    setCustomColorName('');
                  }}
                  className="p-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Standard Color Swatches */}
            <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              {ADMIN_COLOR_PALETTE.map(c => {
                const isSelected = selectedColors.some(sc => sc.toLowerCase() === c.name.toLowerCase());
                const isMulti = c.name.toLowerCase().includes('multi');
                return (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    onClick={() => toggleColor(c.name)}
                    className={`relative h-7 w-7 rounded-full border-2 transition-all cursor-pointer active:scale-90 ${
                      isSelected
                        ? 'border-amber-500 scale-110 shadow-lg ring-2 ring-amber-400/50'
                        : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-500'
                    }`}
                    style={{
                      background: isMulti
                        ? 'conic-gradient(from 180deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #f59e0b, #ef4444, #ec4899)'
                        : c.hex
                    }}
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
            <label className="text-[10px] font-mono-luxury uppercase text-amber-700 dark:text-amber-400 font-bold tracking-wider block">
              Product Description
            </label>
            <textarea
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 transition-colors resize-none leading-relaxed font-medium"
            />
          </div>

          {/* In Stock & Featured Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setEditInStock((prev: boolean) => !prev)}
              className={`py-3 px-4 rounded-xl text-xs font-mono-luxury font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                editInStock
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40'
              }`}
            >
              {editInStock ? '✓ In Stock' : '✕ Out of Stock'}
            </button>

            <button
              type="button"
              onClick={() => setEditFeatured((prev: boolean) => !prev)}
              className={`py-3 px-4 rounded-xl text-xs font-mono-luxury font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                editFeatured
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40'
                  : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-800 hover:border-neutral-400'
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${editFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>{editFeatured ? 'In Lookbook' : 'Standard'}</span>
            </button>
          </div>
        </form>

        {/* 3. STICKY BOTTOM FOOTER */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center gap-3 shrink-0">
          <button
            type="submit"
            form="admin-product-edit-form"
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
            className="px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:border-amber-500 bg-white dark:bg-neutral-800 text-xs font-mono-luxury font-bold uppercase text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Live Shop</span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs font-mono-luxury font-bold uppercase text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer shrink-0"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}