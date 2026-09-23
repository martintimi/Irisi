'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  X, Save, Trash2, Plus, Minus, AlertTriangle, CheckCircle2,
  Package, ShoppingBag, Layers, Loader2, Sparkles, ExternalLink, RefreshCw,
  UploadCloud, Camera, Star, Check, Palette
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { parseAndNormalizeColors, STANDARD_FASHION_COLORS, resolveColorNameToHex } from '@/lib/utils/colorUtils';
import { detectGarmentColor, FASHION_COLOR_PALETTE } from '@/lib/utils/colorDetector';

export interface EditProductImageItem {
  id: string;
  url: string;
  label?: string; // 'Front' | 'Back' | 'Side' | 'Detail' | 'Model'
  colorName?: string;
  colorHex?: string;
  isCover?: boolean;
  showColorTag?: boolean;
  isDetectingColor?: boolean;
  isAiDetected?: boolean;
  isUploading?: boolean;
}

interface VariantStockItem {
  id?: string;
  size: string;
  color?: string;
  stock_quantity: number;
}

interface EditProductModalProps {
  product: any | null;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated?: (updatedProduct: any) => void;
  onProductDeleted?: (productId: string) => void;
}

function initializeImageItems(p: any): EditProductImageItem[] {
  if (!p) return [];
  const rawList: Array<string | any> = Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : Array.isArray(p.gallery) && p.gallery.length > 0
    ? p.gallery
    : [p.imageUrl || p.image_url].filter(Boolean);

  const colorMap = new Map<string, { colorName: string; colorHex: string }>();

  // Extract from tags
  const rawTags: string[] = Array.isArray(p.tags) ? p.tags : [];
  rawTags.forEach(t => {
    if (typeof t === 'string' && t.startsWith('color_img:')) {
      const parts = t.slice('color_img:'.length).split(':');
      if (parts.length >= 2) {
        const cName = parts[0].trim();
        const url = parts.slice(1).join(':').trim();
        if (url && cName) {
          const hex = resolveColorNameToHex(cName) || '#111111';
          colorMap.set(url.toLowerCase(), { colorName: cName, colorHex: hex });
        }
      }
    }
  });

  // Extract from colors array
  const normColors = parseAndNormalizeColors(p.colors);
  normColors.forEach(c => {
    if (c.imageUrl && typeof c.imageUrl === 'string') {
      colorMap.set(c.imageUrl.toLowerCase(), { colorName: c.name, colorHex: c.hex || resolveColorNameToHex(c.name) });
    }
  });

  return rawList.map((item, idx) => {
    const url = typeof item === 'string' ? item : item?.url || '';
    const assigned = colorMap.get(url.toLowerCase());
    const itemColorName = (typeof item === 'object' && item?.colorName) ? item.colorName : assigned?.colorName;
    const itemColorHex = (typeof item === 'object' && item?.colorHex) ? item.colorHex : (assigned?.colorHex || (itemColorName ? resolveColorNameToHex(itemColorName) : '#111111'));
    const itemLabel = (typeof item === 'object' && item?.label) ? item.label : (idx === 0 ? 'Front' : (idx === 1 ? 'Back' : undefined));

    return {
      id: (typeof item === 'object' && item?.id) ? item.id : `img-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      url,
      label: itemLabel,
      colorName: itemColorName,
      colorHex: itemColorHex,
      isCover: idx === 0,
      showColorTag: !!itemColorName,
      isDetectingColor: false,
      isAiDetected: false,
      isUploading: false,
    };
  }).filter(img => Boolean(img.url));
}

export default function EditProductModal({
  product,
  isOpen,
  onClose,
  onProductUpdated,
  onProductDeleted,
}: EditProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Editable fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [category, setCategory] = useState('tops');
  const [genderTarget, setGenderTarget] = useState('unisex');
  const [description, setDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState<EditProductImageItem[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [customColorInput, setCustomColorInput] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#2563eb');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [variants, setVariants] = useState<VariantStockItem[]>([]);
  const [singleStock, setSingleStock] = useState<number>(10);
  const [showAddCustomSize, setShowAddCustomSize] = useState(false);
  const [newSizeInput, setNewSizeInput] = useState('');
  const [newSizeStock, setNewSizeStock] = useState('10');

  // Complete background scroll lock on both body and html
  useEffect(() => {
    if (!isOpen) return;
    const origBody = document.body.style.overflow;
    const origHtml = document.documentElement.style.overflow;
    const origTouch = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = origBody;
      document.documentElement.style.overflow = origHtml;
      document.body.style.touchAction = origTouch;
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Initialize or load fresh product details
  useEffect(() => {
    if (!isOpen || !product) {
      setConfirmDelete(false);
      setErrorMessage('');
      setSuccessMessage('');
      return;
    }

    setName(product.name || '');
    setPrice(product.price || '');
    setCategory(product.category || 'tops');
    setGenderTarget(product.genderTarget || product.gender_target || 'unisex');
    setDescription(product.description || '');

    setUploadedImages(initializeImageItems(product));

    const normalizedCols = parseAndNormalizeColors(product.colors).map(c => c.name);
    setSelectedColors(normalizedCols);

    setConfirmDelete(false);
    setErrorMessage('');
    setSuccessMessage('');

    // Fetch full product details including variants & all images
    async function loadFreshDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${product.id}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await res.json();
        const p = data.product || product;

        setName(p.name || '');
        setPrice(p.price || '');
        setCategory(p.category || 'tops');
        setGenderTarget(p.genderTarget || p.gender_target || 'unisex');
        setDescription(p.description || '');

        setUploadedImages(initializeImageItems(p));

        const fetchedNormalizedCols = parseAndNormalizeColors(p.colors).map(c => c.name);
        setSelectedColors(fetchedNormalizedCols);

    const isFootwear = (cat?: string, n?: string) => {
      const c = String(cat || '').toLowerCase();
      const nm = String(n || '').toLowerCase();
      return (
        c === 'footwear' || c === 'clogs' || c === 'slides' || c === 'sneakers' || c === 'loafers' || c === 'heels' ||
        c.includes('shoe') || c.includes('footwear') || c.includes('clog') || c.includes('croc') ||
        c.includes('sneaker') || c.includes('slide') || c.includes('palm') || c.includes('heel') || c.includes('slipper') ||
        nm.includes('croc') || nm.includes('clog') || nm.includes('shoe') || nm.includes('sneaker') || nm.includes('slide') || nm.includes('palm')
      );
    };

    const isAccessory = (cat?: string, n?: string) => {
      const c = String(cat || '').toLowerCase();
      return c === 'accessories' || c === 'bags' || c === 'jewelry' || c === 'watches' || c === 'caps' || c.includes('bag') || c.includes('watch') || c.includes('chain') || c.includes('cap');
    };

    // Extract variants
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      setVariants(
        p.variants.map((v: any) => ({
          id: v.id,
          size: v.size || 'Standard',
          color: v.color || 'Standard',
          stock_quantity: Number(v.stock_quantity) || 0,
        }))
      );
    } else if (p.sizeStock && typeof p.sizeStock === 'object') {
      const varMap = p.sizeStock.variants || {};
      const vList: VariantStockItem[] = [];

      if (Object.keys(varMap).length > 0) {
        Object.entries(varMap).forEach(([key, qty]: [string, any]) => {
          const parts = key.split('_');
          const col = parts.length > 1 ? parts[0] : 'Standard';
          const sz = parts.length > 1 ? parts.slice(1).join('_') : parts[0];
          vList.push({
            size: sz,
            color: col,
            stock_quantity: Number(qty) || 0,
          });
        });
      } else {
        Object.entries(p.sizeStock).forEach(([sz, val]: [string, any]) => {
          if (sz === 'variants') return;
          const q = typeof val === 'object' ? Number(val?.quantity) : Number(val);
          vList.push({
            size: sz,
            color: 'Standard',
            stock_quantity: isNaN(q) ? 0 : q,
          });
        });
      }

      if (vList.length > 0) {
        setVariants(vList);
      } else if (isAccessory(p.category, p.name)) {
        setVariants([{ size: 'One Size', color: 'Standard', stock_quantity: 20 }]);
      } else if (isFootwear(p.category, p.name)) {
        setVariants([
          { size: '40', color: 'Standard', stock_quantity: 10 },
          { size: '41', color: 'Standard', stock_quantity: 10 },
          { size: '42', color: 'Standard', stock_quantity: 10 },
          { size: '43', color: 'Standard', stock_quantity: 10 },
          { size: '44', color: 'Standard', stock_quantity: 10 },
        ]);
      } else {
        setVariants([
          { size: 'S', color: 'Standard', stock_quantity: 10 },
          { size: 'M', color: 'Standard', stock_quantity: 10 },
          { size: 'L', color: 'Standard', stock_quantity: 10 },
          { size: 'XL', color: 'Standard', stock_quantity: 10 },
        ]);
      }
    } else if (isAccessory(p.category, p.name)) {
      setVariants([{ size: 'One Size', color: 'Standard', stock_quantity: 20 }]);
    } else if (isFootwear(p.category, p.name)) {
      setVariants([
        { size: '40', color: 'Standard', stock_quantity: 10 },
        { size: '41', color: 'Standard', stock_quantity: 10 },
        { size: '42', color: 'Standard', stock_quantity: 10 },
        { size: '43', color: 'Standard', stock_quantity: 10 },
        { size: '44', color: 'Standard', stock_quantity: 10 },
      ]);
    } else {
      setVariants([
        { size: 'S', color: 'Standard', stock_quantity: 10 },
        { size: 'M', color: 'Standard', stock_quantity: 10 },
        { size: 'L', color: 'Standard', stock_quantity: 10 },
        { size: 'XL', color: 'Standard', stock_quantity: 10 },
      ]);
    }
  } catch (err) {
    console.error('Error loading product details:', err);
  } finally {
    setLoading(false);
  }
}

loadFreshDetails();
}, [isOpen, product]);

if (!isOpen || !product) return null;

// Calculate total inventory live
const computedTotalStock = variants.length > 0
? variants.reduce((acc, v) => acc + (Number(v.stock_quantity) || 0), 0)
: Number(singleStock) || 0;

const handleVariantStockChange = (index: number, newQty: number) => {
const updated = [...variants];
updated[index].stock_quantity = Math.max(0, newQty);
setVariants(updated);
};

const handleQuickAdd = (index: number, delta: number) => {
const updated = [...variants];
const cur = Number(updated[index].stock_quantity) || 0;
updated[index].stock_quantity = Math.max(0, cur + delta);
setVariants(updated);
};

const handleSetSoldOut = (index: number) => {
const updated = [...variants];
updated[index].stock_quantity = 0;
setVariants(updated);
};

const handleVariantSizeNameChange = (index: number, newSize: string) => {
const updated = [...variants];
updated[index].size = newSize;
setVariants(updated);
};

const handleAddCustomVariant = () => {
const trimmed = newSizeInput.trim();
if (!trimmed) return;
const qty = Math.max(0, parseInt(newSizeStock, 10) || 0);

setVariants([
  ...variants,
  {
    size: trimmed,
    color: variants[0]?.color || 'Standard',
    stock_quantity: qty,
  }
]);
setNewSizeInput('');
setNewSizeStock('10');
setShowAddCustomSize(false);
};

const handleRemoveVariant = (indexToRemove: number) => {
setVariants(prev => prev.filter((_, idx) => idx !== indexToRemove));
};

const handleAddNewSizeVariant = () => {
const isFootwearCat = category.toLowerCase().includes('footwear') || category.toLowerCase().includes('shoe') || category.toLowerCase().includes('clog') || category.toLowerCase().includes('croc') || category.toLowerCase().includes('slide') || category.toLowerCase().includes('sneaker') || category.toLowerCase().includes('heel') || (product?.name || '').toLowerCase().includes('croc') || (product?.name || '').toLowerCase().includes('shoe');
const defaultSizes = isFootwearCat ? ['38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'] : ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const existingSizes = new Set(variants.map(v => v.size.toUpperCase()));
const nextAvailable = defaultSizes.find(s => !existingSizes.has(s.toUpperCase())) || `Size-${variants.length + 1}`;

setVariants([
  ...variants,
  {
    size: nextAvailable,
    color: variants[0]?.color || 'Standard',
    stock_quantity: 10,
  }
]);
};

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
const files = e.target.files;
if (!files || files.length === 0) return;
setUploadingImage(true);
setErrorMessage('');
setSuccessMessage('');
try {
  const newItems: EditProductImageItem[] = [];
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
      const isFirst = uploadedImages.length === 0 && newItems.length === 0;
      newItems.push({
        id: `img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        url: data.url,
        label: isFirst ? 'Front' : undefined,
        isCover: isFirst,
        colorHex: '#111111',
        showColorTag: false,
        isDetectingColor: false,
        isAiDetected: false,
      });
    } else {
      throw new Error(data.error || 'Failed to upload photo');
    }
  }
  setUploadedImages(prev => [...prev, ...newItems]);
  setSuccessMessage(`${newItems.length} new photo${newItems.length > 1 ? 's' : ''} added! Remember to click "Save Changes".`);
} catch (err: any) {
  setErrorMessage('Upload error: ' + err.message);
} finally {
  setUploadingImage(false);
  if (e.target) e.target.value = '';
}
};

const handleRemoveImage = (id: string) => {
setUploadedImages((prev) => {
  const filtered = prev.filter((img) => img.id !== id);
  if (filtered.length > 0 && !filtered.some((img) => img.isCover)) {
    filtered[0].isCover = true;
  }
  return filtered;
});
};

const handleSetCover = (id: string) => {
setUploadedImages((prev) => {
  const target = prev.find((img) => img.id === id);
  if (!target) return prev;
  const rest = prev.filter((img) => img.id !== id);
  return [{ ...target, isCover: true }, ...rest.map((img) => ({ ...img, isCover: false }))];
});
};

const handleUpdateImageLabel = (id: string, preset: string) => {
setUploadedImages((prev) =>
  prev.map((img) => (img.id === id ? { ...img, label: img.label === preset ? undefined : preset } : img))
);
};

const handleToggleColorTag = (id: string) => {
setUploadedImages((prev) =>
  prev.map((img) =>
    img.id === id
      ? {
          ...img,
          showColorTag: !img.showColorTag,
          colorName: img.showColorTag ? undefined : (img.colorName || ''),
        }
      : img
  )
);
};

// Updates the typing string in real-time WITHOUT polluting selectedColors with partial keystrokes
const handleImageColorNameChange = (id: string, colorName: string) => {
const matched = FASHION_COLOR_PALETTE.find(
  (c) => c.name.toLowerCase() === colorName.trim().toLowerCase()
);
const existingImg = uploadedImages.find((i) => i.id === id);
const resolvedHex = matched ? matched.hex : (resolveColorNameToHex(colorName) || existingImg?.colorHex || '#111111');

setUploadedImages((prev) =>
  prev.map((img) =>
    img.id === id ? { ...img, colorName, colorHex: resolvedHex } : img
  )
);

if (matched) {
  handleCommitImageColor(id, matched.name, matched.hex);
}
};

// Commits a clean color name to selectedColors and image
const handleCommitImageColor = (id: string, colorName: string, customHex?: string) => {
const clean = colorName.trim();
const matched = FASHION_COLOR_PALETTE.find(
  (c) => c.name.toLowerCase() === clean.toLowerCase()
);
const existingImg = uploadedImages.find((i) => i.id === id);
const resolvedHex = customHex || (matched ? matched.hex : (resolveColorNameToHex(clean) || existingImg?.colorHex || '#111111'));

setUploadedImages((prev) =>
  prev.map((img) =>
    img.id === id ? { ...img, colorName: clean, colorHex: resolvedHex, showColorTag: Boolean(clean) } : img
  )
);

if (clean && clean !== 'none' && clean !== 'General / All Colors') {
  setSelectedColors((prev) => {
    if (!prev.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      return [...prev, clean];
    }
    return prev;
  });
}
};

const handleRemoveImageColorTag = (id: string) => {
const target = uploadedImages.find(i => i.id === id);
const removedName = target?.colorName;

setUploadedImages(prev =>
  prev.map(img => (img.id === id ? { ...img, colorName: '', showColorTag: false } : img))
);

if (removedName) {
  const isUsedElsewhere = uploadedImages.some(img => img.id !== id && img.colorName?.toLowerCase() === removedName.toLowerCase());
  if (!isUsedElsewhere) {
    setSelectedColors(prev => prev.filter(c => c.toLowerCase() !== removedName.toLowerCase()));
  }
}
};

const handleUpdateColorHex = (id: string, hex: string) => {
setUploadedImages((prev) =>
  prev.map((img) => (img.id === id ? { ...img, colorHex: hex } : img))
);
};

const handleAiDetectForImage = async (id: string) => {
const img = uploadedImages.find((i) => i.id === id);
if (!img) return;

setUploadedImages((prev) =>
  prev.map((item) => (item.id === id ? { ...item, isDetectingColor: true, isAiDetected: false } : item))
);

try {
  const detected = await detectGarmentColor(img.url);
  handleCommitImageColor(id, detected.name, detected.hex);
  setUploadedImages((prev) =>
    prev.map((item) => (item.id === id ? { ...item, isAiDetected: true } : item))
  );
} catch (e) {
  console.error('AI color detection error:', e);
} finally {
  setUploadedImages((prev) =>
    prev.map((item) => (item.id === id ? { ...item, isDetectingColor: false } : item))
  );
}
};

  const handleToggleColor = (colorName: string) => {
    const clean = colorName.trim();
    if (!clean) return;
    setSelectedColors(prev => {
      const exists = prev.some(c => c.toLowerCase() === clean.toLowerCase());
      if (exists) {
        return prev.filter(c => c.toLowerCase() !== clean.toLowerCase());
      } else {
        return [...prev, clean];
      }
    });
  };

  const handleRemoveColor = (colorName: string) => {
    setSelectedColors(prev => prev.filter(c => c.toLowerCase() !== colorName.toLowerCase()));
  };

  const handleAddCustomColor = () => {
    const trimmed = customColorInput.trim();
    if (!trimmed) return;
    if (!selectedColors.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedColors(prev => [...prev, trimmed]);
    }
    setCustomColorInput('');
    setShowCustomColor(false);
  };

  // Submit edits
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const cleanImgPayload = uploadedImages.map(img => ({
        url: img.url,
        colorName: (img.colorName && img.colorName.trim() && img.colorName !== 'none' && img.colorName !== 'General / All Colors') ? img.colorName.trim() : undefined,
        colorHex: img.colorHex,
        label: img.label,
        isCover: img.isCover,
      }));

      const payload: any = {
        name: name.trim(),
        price: Number(price) || 0,
        category,
        description: description.trim(),
        images: cleanImgPayload,
        imageUrl: cleanImgPayload[0]?.url || undefined,
        colors: selectedColors,
      };

      if (variants.length > 0) {
        payload.variants = variants.map(v => ({
          id: v.id,
          size: v.size,
          color: v.color || 'Standard',
          stock_quantity: Number(v.stock_quantity) || 0,
        }));
      } else {
        payload.variants = [
          {
            size: 'Standard',
            color: 'Standard',
            stock_quantity: Math.max(0, Number(singleStock) || 0),
          }
        ];
      }

      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update product');
      }

      setSuccessMessage('Product & Stock successfully updated!');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

      if (onProductUpdated) {
        onProductUpdated({
          ...product,
          name: payload.name,
          price: payload.price,
          category: payload.category,
          description: payload.description,
          images: cleanImgPayload.map(i => i.url),
          imageUrl: cleanImgPayload[0]?.url || product.imageUrl,
          colors: selectedColors,
          stockQuantity: computedTotalStock,
          stock_quantity: computedTotalStock,
        });
      }

      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating product');
    } finally {
      setSaving(false);
    }
  };

  // Delete product
  const handleDelete = async () => {
    setDeleting(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to remove product');
      }

      if (onProductDeleted) {
        onProductDeleted(product.id);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error deleting product');
      setDeleting(false);
    }
  };

  const productImg = uploadedImages[0]?.url || product.imageUrl || product.image_url || '/images/no-product.svg';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none overflow-hidden"
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className="surface-card border border-[var(--border-subtle)] rounded-3xl w-full max-w-2xl h-[88vh] max-h-[88vh] min-h-0 flex flex-col shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 bg-[var(--bg-secondary)]/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-black border border-[var(--border-subtle)] shrink-0">
              <Image
                src={productImg}
                alt={product.name}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold tracking-wider block">
                Catalog Editor
              </span>
              <h3 className="font-editorial text-lg sm:text-xl font-bold text-[var(--text-primary)] truncate">
                {product.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body with smooth scrolling and min-h-0 */}
        <div
          className="p-4 sm:p-6 overflow-y-auto overscroll-contain min-h-0 space-y-6 flex-1 text-xs font-mono-luxury"
          onWheel={(e) => e.stopPropagation()}
        >
          
          {/* Status Messages */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-[var(--text-secondary)]">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--gold-accent)]" />
              <span>Loading Piece Inventory & Variants...</span>
            </div>
          ) : (
            <form id="edit-product-form" onSubmit={handleSave} className="space-y-6">
              
              {/* 1. Basic Product Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4 text-[var(--gold-accent)]" />
                    <span>Piece Details & Pricing</span>
                  </span>
                  <a
                    href={`/shop/${product.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[var(--gold-accent)] hover:underline flex items-center gap-1"
                  >
                    <span>Preview Storefront</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Multi-Photo Gallery Manager */}
                  <div className="sm:col-span-2 space-y-3 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold tracking-wider flex items-center gap-1.5">
                        <Camera className="h-3.5 w-3.5" />
                        <span>Product Photos & Gallery ({uploadedImages.length})</span>
                      </label>
                      <span className="text-[10px] text-[var(--text-secondary)]">
                        {uploadedImages.length === 0 ? 'No photos' : `${uploadedImages.length} photo${uploadedImages.length > 1 ? 's' : ''} (First is Cover)`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {uploadedImages.map((img, idx) => (
                        <div
                          key={img.id}
                          className="relative rounded-2xl overflow-hidden surface-card border border-[var(--border-subtle)] flex flex-col group/card shadow-sm"
                        >
                          <div className="relative h-36 w-full bg-black/40 overflow-hidden">
                            <Image
                              src={img.url}
                              alt={`Product view ${idx + 1}`}
                              fill
                              unoptimized
                              className="object-cover"
                            />

                            {/* Syncing to CDN Overlay */}
                            {img.isUploading && (
                              <div className="absolute inset-0 z-20 bg-black/75 flex flex-col items-center justify-center gap-1 backdrop-blur-[2px]">
                                <RefreshCw className="h-4 w-4 text-[var(--gold-accent)] animate-spin" />
                                <span className="text-[8px] font-mono-luxury font-bold text-white uppercase tracking-wider">
                                  Syncing...
                                </span>
                              </div>
                            )}

                            {/* Cover Photo Badge / Set Cover Button */}
                            {idx === 0 ? (
                              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-[var(--gold-accent)] text-black text-[9px] font-mono-luxury font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-md">
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                                <span>Main Cover</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetCover(img.id)}
                                className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/80 hover:bg-black text-white text-[9px] font-mono-luxury font-bold uppercase tracking-wider border border-white/20 transition-all cursor-pointer shadow-md"
                              >
                                Set Cover
                              </button>
                            )}

                            {/* Delete Photo Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(img.id)}
                              className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/80 text-rose-400 hover:text-rose-300 border border-rose-500/30 cursor-pointer shadow-lg active:scale-90 transition-transform"
                              title="Remove photo"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Photo View Label & Optional Color Tag */}
                          <div className="p-2.5 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)] space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold">
                                View {idx + 1} {idx === 0 ? '(Cover)' : ''}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleToggleColorTag(img.id)}
                                className="text-[9px] font-mono-luxury font-bold text-[var(--text-secondary)] hover:text-[var(--gold-accent)] transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Palette className="h-2.5 w-2.5" />
                                <span>{img.showColorTag || img.colorName ? 'Color Tagged' : '+ Color Tag'}</span>
                              </button>
                            </div>

                            {/* Quick View Presets (Front, Back, Side, Detail, Model) */}
                            <div className="flex items-center gap-1 flex-wrap">
                              {['Front', 'Back', 'Side', 'Detail', 'Model'].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => handleUpdateImageLabel(img.id, preset)}
                                  className={`px-2 py-0.5 rounded text-[9px] font-mono-luxury font-bold transition-all cursor-pointer ${
                                    img.label === preset
                                      ? 'bg-[var(--gold-accent)] text-black shadow-sm'
                                      : 'bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white'
                                  }`}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>

                            {/* Optional Color Tagging */}
                            {(img.showColorTag || img.colorName) && (
                              <div className="pt-2 border-t border-[var(--border-subtle)]/60 space-y-2 animate-fadeIn">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold">
                                    Colorway
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleAiDetectForImage(img.id)}
                                    disabled={img.isDetectingColor}
                                    className="text-[9px] font-mono-luxury font-bold text-[var(--gold-accent)] hover:text-amber-300 flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer px-2 py-0.5 rounded bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/20"
                                  >
                                    {img.isDetectingColor ? (
                                      <>
                                        <Sparkles className="h-2.5 w-2.5 animate-spin" />
                                        <span>Detecting...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="h-2.5 w-2.5" />
                                        <span>AI Detect</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                {/* AI Detection Success Feedback Badge */}
                                {img.isAiDetected && img.colorName && (
                                  <div className="flex items-center gap-1 text-[8px] font-mono-luxury font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded animate-fadeIn">
                                    <Sparkles className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                                    <span>AI Detected: {img.colorName}</span>
                                  </div>
                                )}

                                {/* Clean Color Picker & Name Row */}
                                <div className="flex items-center gap-1.5">
                                  <label
                                    className="relative flex-shrink-0 h-6 w-6 rounded-md border border-white/20 shadow-inner cursor-pointer overflow-hidden transition-transform active:scale-90"
                                    style={{ backgroundColor: img.colorHex || '#111111' }}
                                    title="Tap to adjust color shade"
                                  >
                                    <input
                                      type="color"
                                      value={img.colorHex || '#111111'}
                                      onChange={(e) => handleUpdateColorHex(img.id, e.target.value)}
                                      className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                                    />
                                  </label>

                                  <input
                                    type="text"
                                    list="fashion-colors-list-edit-vendor"
                                    placeholder="e.g. Black, Navy Blue, Wine"
                                    value={img.colorName || ''}
                                    onChange={(e) => handleImageColorNameChange(img.id, e.target.value)}
                                    onBlur={(e) => {
                                      if (e.target.value.trim()) {
                                        handleCommitImageColor(img.id, e.target.value);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleCommitImageColor(img.id, (e.target as HTMLInputElement).value);
                                      }
                                    }}
                                    className="flex-1 min-w-0 px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[10px] font-mono-luxury font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)]"
                                  />

                                  {img.colorName && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImageColorTag(img.id)}
                                      className="p-1 rounded text-neutral-400 hover:text-rose-400 text-xs cursor-pointer"
                                      title="Remove color tag"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Upload New Photo(s) Box */}
                      <label
                        className={`h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer ${
                          uploadingImage
                            ? 'border-[var(--gold-accent)] bg-[var(--gold-accent)]/5 cursor-wait'
                            : 'border-[var(--border-subtle)] hover:border-[var(--gold-accent)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)]'
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
                            <Loader2 className="h-6 w-6 animate-spin text-[var(--gold-accent)] mb-1" />
                            <span className="text-[10px] font-bold text-[var(--gold-accent)]">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <div className="h-8 w-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center mb-1 text-[var(--gold-accent)]">
                              <Plus className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-bold text-[var(--text-primary)] leading-tight">
                              Add Photos
                            </span>
                            <span className="text-[8px] text-[var(--text-secondary)] mt-0.5">
                              1 or multiple
                            </span>
                          </>
                        )}
                      </label>
                    </div>

                    <datalist id="fashion-colors-list-edit-vendor">
                      {FASHION_COLOR_PALETTE.map((c) => (
                        <option key={c.name} value={c.name} />
                      ))}
                    </datalist>

                    <p className="text-[9px] text-[var(--text-secondary)] italic">
                      Click the red trash icon to remove. Set main cover, select angle presets (Front, Back, Side), or tag colors with AI Detect.
                    </p>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] uppercase text-[var(--text-secondary)]">Piece Title / Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Vintage Silk Agbada"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)] transition-colors text-xs font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-[var(--text-secondary)]">Price (₦ NGN)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 45000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)] transition-colors text-xs font-sans font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-[var(--text-secondary)]">Department Category</label>
                    <select
                      value={category === 'tops' || category === 'bottoms' || category === 'outerwear' ? 'clothing' : category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)] transition-colors text-xs font-sans"
                    >
                      <option value="clothing">Clothing (Apparel, Hoodies, Shirts, Pants)</option>
                      <option value="native">Native & Cultural (Senators, Agbada, Kaftans)</option>
                      <option value="footwear">Shoes & Footwear (Slides, Sneakers, Clogs)</option>
                      <option value="bags">Bags & Luggage (Backpacks, Handbags, Crossbody)</option>
                      <option value="accessories">Accessories & Jewelry (Watches, Glasses, Caps)</option>
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] uppercase text-[var(--text-secondary)]">Description / Tailoring Notes</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Garment composition, fit guidelines, or care instructions..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)] transition-colors text-xs font-sans resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Colorways & Finishes */}
              {category !== 'accessories' && category !== 'bags' && (
                <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Palette className="h-4 w-4 text-[var(--gold-accent)]" />
                      <span>Colorways &amp; Finishes</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCustomColor(!showCustomColor)}
                        className="text-[10px] text-[var(--gold-accent)] font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>{showCustomColor ? 'Close' : '+ Custom Shade'}</span>
                      </button>
                      <span className="text-[10px] text-[var(--text-secondary)]">
                        {selectedColors.length === 0 ? 'Default / As Pictured' : `${selectedColors.length} selected`}
                      </span>
                    </div>
                  </div>

                  {/* Active Selected Colors Pills with remove X */}
                  {selectedColors.length > 0 && (
                    <div className="p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1.5">
                      <label className="text-[9px] uppercase font-bold text-[var(--text-secondary)] block">
                        Active Piece Colors (Shoppers will pick from these)
                      </label>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {selectedColors.map((colName) => {
                          const hex = resolveColorNameToHex(colName);
                          const isMulti = colName.toLowerCase().includes('multi');
                          return (
                            <div
                              key={colName}
                              className="px-2.5 py-1 rounded-xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/50 text-[var(--text-primary)] text-xs font-bold flex items-center gap-1.5 shadow-sm"
                            >
                              <span
                                className="h-3 w-3 rounded-full border border-white/20 shrink-0 shadow-xs"
                                style={{
                                  background: isMulti
                                    ? 'conic-gradient(from 180deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #f59e0b, #ef4444, #ec4899)'
                                    : hex
                                }}
                              />
                              <span>{colName}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveColor(colName)}
                                className="p-0.5 rounded-full hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-400 cursor-pointer ml-0.5"
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

                  {/* Custom Shade Adder Form */}
                  {showCustomColor && (
                    <div className="p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--gold-accent)]/50 flex items-center gap-2 animate-fadeIn">
                      <input
                        type="color"
                        value={customColorHex}
                        onChange={(e) => setCustomColorHex(e.target.value)}
                        className="h-8 w-8 rounded-lg border border-white/20 cursor-pointer bg-transparent shrink-0"
                        title="Pick visual color shade"
                      />
                      <input
                        type="text"
                        value={customColorInput}
                        onChange={(e) => setCustomColorInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomColor();
                          }
                        }}
                        placeholder="Type color name (e.g. Sage Green, Peach, Baby Pink, Neon Lime)"
                        className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-sans"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomColor}
                        disabled={!customColorInput.trim()}
                        className="px-3.5 py-1.5 rounded-xl bg-[var(--gold-accent)] text-black font-bold text-xs uppercase cursor-pointer disabled:opacity-40 hover:bg-amber-400"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomColor(false);
                          setCustomColorInput('');
                        }}
                        className="p-1.5 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-white cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Standard Quick Palette Swatches */}
                  <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-[var(--text-secondary)] block">
                      Quick Palette Selector (Tap to toggle)
                    </label>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {STANDARD_FASHION_COLORS.map((c) => {
                        const isSel = selectedColors.some(sc => sc.toLowerCase() === c.name.toLowerCase());
                        const isMulti = c.name.toLowerCase().includes('multi');
                        return (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => handleToggleColor(c.name)}
                            className={`px-2.5 py-1 rounded-xl border text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                              isSel
                                ? 'border-[var(--gold-accent)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-bold ring-1 ring-[var(--gold-accent)] shadow-sm'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'
                            }`}
                          >
                            <span
                              className="h-3 w-3 rounded-full border border-white/20 shrink-0"
                              style={{
                                background: isMulti
                                  ? 'conic-gradient(from 180deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #f59e0b, #ef4444, #ec4899)'
                                  : c.hex
                              }}
                            />
                            <span>{c.name}</span>
                            {isSel && <Check className="h-3 w-3 text-[var(--gold-accent)] stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Variant Inventory & Stock Management */}
              <div className="space-y-4 pt-2 border-t border-[var(--border-subtle)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs uppercase font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-[var(--gold-accent)]" />
                      <span>Live Stock & Sizing Inventory</span>
                    </span>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                      Units are deducted in real-time when buyers complete checkout orders.
                    </p>
                  </div>

                  {/* Real-time Inventory Counter Badge */}
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold border ${
                      computedTotalStock === 0
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        : computedTotalStock <= 3
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {computedTotalStock === 0 ? '🔴 Sold Out' : computedTotalStock <= 3 ? `⚠️ Low: ${computedTotalStock} Units` : `🟢 ${computedTotalStock} Units in Stock`}
                    </span>
                  </div>
                </div>

                {variants.length > 0 ? (
                  <div className="space-y-2.5">
                    {variants.map((v, idx) => (
                      <div
                        key={v.id || idx}
                        className="p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="text"
                            value={v.size}
                            onChange={(e) => handleVariantSizeNameChange(idx, e.target.value)}
                            title="Edit size label"
                            className="h-8 w-16 px-2 text-center rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] font-bold text-xs text-[var(--gold-accent)] focus:outline-none focus:border-[var(--gold-accent)]"
                          />
                          <div>
                            <span className="font-bold text-[var(--text-primary)] block text-xs">
                              {v.color && v.color !== 'Standard' ? `${v.color} · Size ${v.size}` : `Size ${v.size}`}
                            </span>
                            <span className="text-[10px] text-[var(--text-secondary)]">
                              {v.stock_quantity === 0 ? 'Out of stock' : `${v.stock_quantity} available to buy`}
                            </span>
                          </div>
                        </div>

                        {/* Increment / Decrement / Quick Chips / Delete */}
                        <div className="flex items-center gap-2 justify-end flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(idx, -1)}
                            disabled={v.stock_quantity <= 0}
                            className="h-8 w-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] disabled:opacity-40 flex items-center justify-center text-[var(--text-primary)] transition-colors cursor-pointer"
                            title="Decrease by 1"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={v.stock_quantity}
                            onChange={(e) => handleVariantStockChange(idx, Number(e.target.value) || 0)}
                            className="h-8 w-16 text-center rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold text-xs focus:outline-none focus:border-[var(--gold-accent)]"
                          />

                          <button
                            type="button"
                            onClick={() => handleQuickAdd(idx, 1)}
                            className="h-8 w-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] flex items-center justify-center text-[var(--text-primary)] transition-colors cursor-pointer"
                            title="Increase by 1"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickAdd(idx, 10)}
                            className="h-8 px-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[9px] uppercase font-bold text-emerald-400 cursor-pointer"
                            title="Restock +10 units"
                          >
                            +10
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetSoldOut(idx)}
                            className="h-8 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[9px] uppercase font-bold cursor-pointer"
                            title="Set to 0 (Sold out)"
                          >
                            Sold Out
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="h-8 w-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-rose-500 text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete this size variant"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Custom Size Adder Form */}
                    {showAddCustomSize && (
                      <div className="p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--gold-accent)]/50 flex flex-col sm:flex-row items-center gap-2.5 animate-fadeIn">
                        <div className="flex-1 w-full">
                          <label className="text-[10px] text-[var(--text-secondary)] uppercase block mb-1 font-bold">Custom Size Name</label>
                          <input
                            type="text"
                            value={newSizeInput}
                            onChange={(e) => setNewSizeInput(e.target.value)}
                            placeholder={category === 'footwear' ? "e.g. 41.5, 47, 11 US, Bespoke" : "e.g. 3XL, Petite, Custom"}
                            className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-bold focus:border-[var(--gold-accent)] focus:outline-none"
                            autoFocus
                          />
                        </div>
                        <div className="w-full sm:w-28">
                          <label className="text-[10px] text-[var(--text-secondary)] uppercase block mb-1 font-bold">Initial Stock</label>
                          <input
                            type="number"
                            min="0"
                            value={newSizeStock}
                            onChange={(e) => setNewSizeStock(e.target.value)}
                            placeholder="10"
                            className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-bold focus:border-[var(--gold-accent)] focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-4 sm:pt-4 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            onClick={handleAddCustomVariant}
                            className="px-3.5 py-2 rounded-xl bg-[var(--gold-accent)] text-black font-bold text-xs uppercase cursor-pointer hover:bg-amber-400"
                          >
                            Add Size
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowAddCustomSize(false); setNewSizeInput(''); }}
                            className="p-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-white cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="pt-1 flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setShowAddCustomSize(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/40 hover:border-[var(--gold-accent)] text-[10px] font-bold text-[var(--gold-accent)] uppercase transition-colors cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>{category === 'footwear' ? '+ Add Custom Shoe Size' : '+ Add Custom Size'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAddNewSizeVariant}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl surface-card border border-dashed border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] uppercase transition-colors cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>+ Standard Next Size</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3">
                    <label className="text-[10px] uppercase text-[var(--text-secondary)] block">Available Stock Quantity</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSingleStock(Math.max(0, singleStock - 1))}
                        className="h-9 w-9 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] cursor-pointer"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={singleStock}
                        onChange={(e) => setSingleStock(Math.max(0, Number(e.target.value) || 0))}
                        className="h-9 w-24 text-center rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setSingleStock(singleStock + 1)}
                        className="h-9 w-9 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSingleStock(singleStock + 10)}
                        className="h-9 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[10px] uppercase font-bold text-emerald-400 cursor-pointer"
                      >
                        +10 Units
                      </button>
                      <button
                        type="button"
                        onClick={() => setSingleStock(0)}
                        className="h-9 px-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] uppercase font-bold cursor-pointer"
                      >
                        Mark Sold Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Delete Section */}
              <div className="pt-4 border-t border-[var(--border-subtle)]">
                {confirmDelete ? (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center gap-2 text-rose-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-bold text-xs uppercase">Remove Piece From Catalog?</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      This will permanently unpublish this garment and remove its stock records from the store.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase text-[10px] flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                      >
                        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        <span>{deleting ? 'Removing...' : 'Yes, Delete Piece'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-4 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white uppercase text-[10px] font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Need to remove this style completely?
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1.5 text-rose-400 hover:text-rose-300 text-[10px] uppercase font-bold hover:underline cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Style</span>
                    </button>
                  </div>
                )}
              </div>

            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3 bg-[var(--bg-secondary)]/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-full surface-card border border-[var(--border-subtle)] hover:border-[var(--text-secondary)] text-[var(--text-secondary)] font-mono-luxury uppercase text-[11px] font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="edit-product-form"
            disabled={saving || loading}
            className="px-6 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 font-mono-luxury uppercase text-[11px] font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
