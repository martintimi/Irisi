'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/lib/store/useStore';
import { vendorFetch, getActiveVendorId } from '@/lib/services/apiClient';
import EditProductModal from '@/components/vendor/EditProductModal';
import VendorLuxuryLoader from '@/components/vendor/VendorLuxuryLoader';
import {
  ShoppingBag, Plus, Search, Filter, ExternalLink, Edit3,
  TrendingUp, AlertTriangle, CheckCircle2, RefreshCw, Package,
  Layers, ChevronRight, Store, ArrowUpDown, SlidersHorizontal
} from 'lucide-react';
import { isBoutiqueVendor, getVendorSpecialty, getVendorSpecialtyInfo } from '@/types';

export default function VendorProductsCatalogPage() {
  const { vendorProfile } = useStore();
  const isBoutique = isBoutiqueVendor(vendorProfile);
  const specialty = getVendorSpecialty(vendorProfile);
  const specialtyInfo = getVendorSpecialtyInfo(specialty, isBoutique);

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'sold_out'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Edit Modal State
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch all products for the active vendor
  const loadVendorProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const activeVid = getActiveVendorId();
      let currentVendorId = activeVid || vendorProfile.email || '';

      // First query vendor profile to verify active ID
      const profRes = await vendorFetch('/api/vendor/profile');
      let profVendor: any = null;
      if (profRes.ok) {
        const profData = await profRes.json();
        if (profData.success && profData.vendor) {
          profVendor = profData.vendor;
          currentVendorId = profVendor.id || currentVendorId;
          if (typeof window !== 'undefined' && profVendor.id) {
            localStorage.setItem('irisi_vendor_id', profVendor.id);
            localStorage.setItem('veyra_vendor_id', profVendor.id);
          }
        }
      }

      // Fetch products
      const res = await vendorFetch(`/api/products?vendorId=${encodeURIComponent(currentVendorId || 'all')}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.products)) {
        // Filter strictly for this vendor's catalog
        const filtered = currentVendorId && currentVendorId !== 'all'
          ? data.products.filter((p: any) => {
              const pVid = (p.vendorId || p.vendor_id || '').toLowerCase().trim();
              const pVName = (p.vendorName || p.vendor_name || '').toLowerCase().trim();
              const bName = (profVendor?.brand_name || profVendor?.brandName || vendorProfile.brandName || '').toLowerCase().trim();
              const vEmail = (profVendor?.email || vendorProfile.email || '').toLowerCase().trim();
              const targetVid = currentVendorId.toLowerCase().trim();

              return (
                pVid === targetVid ||
                pVid.includes(targetVid) ||
                targetVid.includes(pVid) ||
                (vEmail && pVid === vEmail) ||
                (bName && (pVName.includes(bName) || bName.includes(pVName)))
              );
            })
          : data.products;

        setProducts(filtered);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching vendor products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [vendorProfile.email, vendorProfile.brandName]);

  useEffect(() => {
    loadVendorProducts();
  }, [loadVendorProducts]);

  // Overall Catalog Statistics
  const stats = useMemo(() => {
    let totalStockUnits = 0;
    let inStockCount = 0;
    let lowStockCount = 0;
    let soldOutCount = 0;

    products.forEach((p) => {
      const qty = typeof p.stockQuantity === 'number'
        ? p.stockQuantity
        : typeof p.stock_quantity === 'number'
        ? p.stock_quantity
        : 0;

      totalStockUnits += qty;
      if (qty === 0) {
        soldOutCount++;
      } else if (qty <= 3) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
    });

    return {
      totalProducts: products.length,
      totalStockUnits,
      inStockCount,
      lowStockCount,
      soldOutCount,
    };
  }, [products]);

  // Filtered products based on user query and tabs
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchQuery === '' ||
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || p.category === categoryFilter;

      const qty = typeof p.stockQuantity === 'number'
        ? p.stockQuantity
        : typeof p.stock_quantity === 'number'
        ? p.stock_quantity
        : 0;

      let matchesStatus = true;
      if (statusFilter === 'sold_out') {
        matchesStatus = qty === 0;
      } else if (statusFilter === 'low_stock') {
        matchesStatus = qty > 0 && qty <= 3;
      } else if (statusFilter === 'in_stock') {
        matchesStatus = qty > 3;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, categoryFilter, statusFilter]);

  const handleOpenEdit = (product: any) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleProductUpdated = (updated: any) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    );
  };

  const handleProductDeleted = (deletedId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  if (isLoading) {
    return <VendorLuxuryLoader label="Loading Live Product Catalog & Inventory..." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn max-w-7xl pb-20">
      
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-xs font-mono-luxury uppercase font-bold border border-[var(--gold-accent)]/20 mb-2">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Storefront Inventory Intelligence</span>
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--text-primary)]">
            My Catalog & Stock Management
          </h1>
          <p className="text-xs sm:text-sm font-mono-luxury text-[var(--text-secondary)] mt-1">
            Monitor physical stock units, adjust prices, edit descriptions, and update sizing variant availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadVendorProducts}
            className="p-3 rounded-full surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[var(--text-secondary)] hover:text-white transition-all cursor-pointer"
            title="Refresh Live Data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <Link
            href="/vendor-portal/publish"
            className="px-5 py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold tracking-wider hover:opacity-90 transition-all shadow-xl flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add New Drop</span>
          </Link>
        </div>
      </div>

      {/* 2. 4 Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono-luxury">
        <div className="p-4 sm:p-5 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-1 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">Live Product Drops</span>
          <div className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--gold-accent)]">{stats.totalProducts}</div>
          <span className="text-[10px] text-[var(--text-secondary)]">Active catalog listings</span>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-1 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">Total Stock Units</span>
          <div className="font-editorial text-2xl sm:text-3xl font-bold text-emerald-400">{stats.totalStockUnits.toLocaleString()}</div>
          <span className="text-[10px] text-[var(--text-secondary)]">Units across all colorways</span>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-1 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">Low Stock Alerts</span>
          <div className="font-editorial text-2xl sm:text-3xl font-bold text-amber-400">{stats.lowStockCount}</div>
          <span className="text-[10px] text-amber-400/80">3 or fewer units remaining</span>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-1 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">Sold Out Pieces</span>
          <div className="font-editorial text-2xl sm:text-3xl font-bold text-rose-400">{stats.soldOutCount}</div>
          <span className="text-[10px] text-rose-400/80">0 units left in stock</span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3 font-mono-luxury shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by piece title or category..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-xs focus:outline-none focus:border-[var(--gold-accent)] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Department Category Select */}
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--gold-accent)] transition-colors"
            >
              <option value="all">All Categories</option>
              <option value="tops">Tops & Shirts</option>
              <option value="outerwear">Outerwear & Hoodies</option>
              <option value="bottoms">Bottoms & Trousers</option>
              <option value="footwear">Footwear & Boots</option>
              <option value="accessories">Jewelry & Accessories</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-[10px] uppercase font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                : 'surface-card border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            All Drops ({stats.totalProducts})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('in_stock')}
            className={`px-3.5 py-1.5 rounded-full text-[10px] uppercase font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'in_stock'
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'surface-card border border-[var(--border-subtle)] text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            🟢 In Stock ({stats.inStockCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('low_stock')}
            className={`px-3.5 py-1.5 rounded-full text-[10px] uppercase font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'low_stock'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'surface-card border border-[var(--border-subtle)] text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            ⚠️ Low Stock ({stats.lowStockCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('sold_out')}
            className={`px-3.5 py-1.5 rounded-full text-[10px] uppercase font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'sold_out'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'surface-card border border-[var(--border-subtle)] text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            🔴 Sold Out ({stats.soldOutCount})
          </button>
        </div>
      </div>

      {/* 4. Products List / Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 sm:p-16 rounded-3xl surface-card border border-[var(--border-subtle)] text-center space-y-4 font-mono-luxury shadow-sm">
          <Store className="h-12 w-12 text-[var(--gold-accent)] mx-auto opacity-50" />
          <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
            No Products Found
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'No products match your current search and filter criteria. Try resetting your filters.'
              : 'You have not added any pieces to your catalog yet. Click below to add your first ready-to-wear piece.'}
          </p>
          {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all') ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setStatusFilter('all');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--gold-accent)] text-xs font-bold uppercase hover:border-[var(--gold-accent)] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          ) : (
            <Link
              href="/vendor-portal/publish"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-bold uppercase shadow-lg hover:opacity-90 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Product Drop</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProducts.map((piece) => {
            const qty = typeof piece.stockQuantity === 'number'
              ? piece.stockQuantity
              : typeof piece.stock_quantity === 'number'
              ? piece.stock_quantity
              : 0;

            const isSoldOut = qty === 0;
            const isLowStock = qty > 0 && qty <= 3;
            const productImg = piece.imageUrl || piece.image_url || '/images/products/BlackTrapStarHoodie.jpg';

            // Extract sizing variant tags
            const sizeStock = piece.sizeStock || piece.size_stock;
            const sizeEntries = sizeStock && typeof sizeStock === 'object'
              ? Object.entries(sizeStock).filter(([k]) => k !== 'variants')
              : [];

            return (
              <div
                key={piece.id}
                className="surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/60 rounded-3xl overflow-hidden flex flex-col transition-all duration-300 shadow-sm hover:shadow-xl group"
              >
                {/* Image & Badges */}
                <div className="relative aspect-4/3 w-full bg-black overflow-hidden">
                  <Image
                    src={productImg}
                    alt={piece.name}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                    <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[9px] font-mono-luxury uppercase font-bold text-[var(--gold-accent)]">
                      {piece.category || 'Ready-to-Wear'}
                    </span>

                    {isSoldOut ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/90 text-white text-[9px] font-mono-luxury uppercase font-bold shadow-md">
                        🔴 Sold Out
                      </span>
                    ) : isLowStock ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500 text-black text-[9px] font-mono-luxury uppercase font-bold shadow-md animate-pulse">
                        ⚠️ Only {qty} Left
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-black text-[9px] font-mono-luxury uppercase font-bold shadow-md">
                        🟢 {qty} in Stock
                      </span>
                    )}
                  </div>

                  {/* Bottom Price & Sold Count on Image */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between z-10">
                    <div>
                      <span className="text-[10px] font-mono-luxury uppercase text-zinc-300 block">Retail Price</span>
                      <span className="font-editorial text-xl font-bold text-white leading-tight">
                        ₦{Number(piece.price || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-white text-[10px] font-mono-luxury font-bold">
                        {piece.unitsSold ?? 0} Units Sold
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4 font-mono-luxury">
                  <div className="space-y-2.5">
                    <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--gold-accent)] transition-colors">
                      {piece.name}
                    </h3>

                    {piece.description && (
                      <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {piece.description}
                      </p>
                    )}

                    {/* Variant Stock Preview */}
                    {sizeEntries.length > 0 && (
                      <div className="pt-1.5 space-y-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] block">
                          Stock by Size
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {sizeEntries.slice(0, 5).map(([sz, val]: [string, any]) => {
                            const sizeQty = typeof val === 'object' ? Number(val?.quantity) || 0 : Number(val) || 0;
                            return (
                              <span
                                key={sz}
                                className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${
                                  sizeQty === 0
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    : sizeQty <= 2
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-subtle)]'
                                }`}
                              >
                                {sz}: {sizeQty}
                              </span>
                            );
                          })}
                          {sizeEntries.length > 5 && (
                            <span className="text-[9px] text-[var(--text-muted)] self-center">
                              +{sizeEntries.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                    <a
                      href={`/product/${piece.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white text-[10px] uppercase font-bold flex items-center gap-1 transition-colors"
                      title="Preview piece on public storefront"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>View</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(piece)}
                      className="flex-1 py-2 px-4 rounded-xl bg-[var(--text-primary)] hover:opacity-90 text-[var(--bg-primary)] text-[11px] font-bold uppercase flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit Piece & Stock</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Interactive Edit Product Modal */}
      <EditProductModal
        product={selectedProduct}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProduct(null);
        }}
        onProductUpdated={handleProductUpdated}
        onProductDeleted={handleProductDeleted}
      />

    </div>
  );
}
