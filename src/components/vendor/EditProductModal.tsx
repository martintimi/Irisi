'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X, Save, Trash2, Plus, Minus, AlertTriangle, CheckCircle2,
  Package, ShoppingBag, Layers, Loader2, Sparkles, ExternalLink, RefreshCw,
  UploadCloud, Camera
} from 'lucide-react';
import confetti from 'canvas-confetti';

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
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [variants, setVariants] = useState<VariantStockItem[]>([]);
  const [singleStock, setSingleStock] = useState<number>(10);

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
    setDescription(product.description || '');
    setImageUrl(product.imageUrl || product.image_url || '');
    setConfirmDelete(false);
    setErrorMessage('');
    setSuccessMessage('');

    // Fetch full product details including variants
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
        setDescription(p.description || '');
        setImageUrl(p.imageUrl || p.image_url || '');

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
          } else {
            setSingleStock(Number(p.stockQuantity ?? p.stock_quantity) || 10);
          }
        } else {
          setSingleStock(Number(p.stockQuantity ?? p.stock_quantity) || 10);
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

  const handleAddNewSizeVariant = () => {
    const defaultSizes = category === 'footwear' ? ['40', '41', '42', '43', '44', '45'] : ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const existingSizes = new Set(variants.map(v => v.size));
    const nextAvailable = defaultSizes.find(s => !existingSizes.has(s)) || `Size-${variants.length + 1}`;
    
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
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setImageUrl(data.url);
        setSuccessMessage('New photo uploaded! Click "Save Changes" to apply.');
      } else {
        setErrorMessage('Failed to upload photo: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      setErrorMessage('Upload error: ' + err.message);
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  // Submit edits
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload: any = {
        name: name.trim(),
        price: Number(price) || 0,
        category,
        description: description.trim(),
        imageUrl: imageUrl || undefined,
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

  const productImg = product.imageUrl || product.image_url || '/images/products/BlackTrapStarHoodie.jpg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="surface-card border border-[var(--border-subtle)] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs font-mono-luxury">
          
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
                    href={`/product/${product.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[var(--gold-accent)] hover:underline flex items-center gap-1"
                  >
                    <span>Preview Storefront</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Photo Upload Card */}
                  <div className="sm:col-span-2 p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-black border border-[var(--border-subtle)] shrink-0">
                        {imageUrl ? (
                          <Image src={imageUrl} alt={name || 'Product'} fill unoptimized className="object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[var(--text-muted)]">
                            <Camera className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-[var(--text-primary)] block">
                          Product Display Photo
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)] block truncate">
                          {uploadingImage ? 'Uploading photo to CDN...' : 'Upload genuine high-resolution photo'}
                        </span>
                      </div>
                    </div>

                    <label className="px-3 py-1.5 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity shrink-0">
                      {uploadingImage ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Camera className="h-3.5 w-3.5" />
                      )}
                      <span>{uploadingImage ? 'Uploading...' : 'Change Photo'}</span>
                      <input type="file" accept="image/*" disabled={uploadingImage} onChange={handleImageUpload} className="hidden" />
                    </label>
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
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)] transition-colors text-xs font-sans"
                    >
                      <option value="tops">Tops & Shirts</option>
                      <option value="outerwear">Outerwear & Hoodies</option>
                      <option value="bottoms">Bottoms & Trousers</option>
                      <option value="footwear">Footwear & Boots</option>
                      <option value="accessories">Jewelry & Accessories</option>
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

              {/* 2. Variant Inventory & Stock Management */}
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
                          <span className="h-8 px-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center font-bold text-xs text-[var(--gold-accent)]">
                            {v.size}
                          </span>
                          <div>
                            <span className="font-bold text-[var(--text-primary)] block text-xs">
                              {v.color && v.color !== 'Standard' ? `${v.color} · Size ${v.size}` : `Size ${v.size}`}
                            </span>
                            <span className="text-[10px] text-[var(--text-secondary)]">
                              {v.stock_quantity === 0 ? 'Out of stock' : `${v.stock_quantity} available to buy`}
                            </span>
                          </div>
                        </div>

                        {/* Increment / Decrement / Quick Chips */}
                        <div className="flex items-center gap-2 justify-end">
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
                        </div>
                      </div>
                    ))}

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleAddNewSizeVariant}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl surface-card border border-dashed border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[10px] font-bold text-[var(--gold-accent)] uppercase transition-colors cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Another Size Option</span>
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
