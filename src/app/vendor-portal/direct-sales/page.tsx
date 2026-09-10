'use client';

import { vendorFetch } from '@/lib/services/apiClient';


import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store/useStore';
import { Product, GarmentCategory } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles, Download, Copy, Check, Send,
  CheckCircle2, ShoppingBag,
  Search, EyeOff, Tag, Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import MobileVendorDirectSales from '@/components/vendor/MobileVendorDirectSales';
import VendorLuxuryLoader from '@/components/vendor/VendorLuxuryLoader';

export default function DirectSalesAssistantPage() {
  const { vendorProfile } = useStore();

  // 1. Live Vendor Data State
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // 2. Search & Category Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<GarmentCategory | 'all'>('all');

  // 3. Card Configuration State (Show/Hide Price)
  const [includePrice, setIncludePrice] = useState<boolean>(false);
  const [promoPrice, setPromoPrice] = useState<string>('');

  // 4. DM Message State (Empty by default)
  const [customerName, setCustomerName] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('');
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  // Fetch only this logged-in vendor's own products from DB
  useEffect(() => {
    async function loadVendorCatalog() {
      try {
        setIsLoadingProducts(true);

        const resProf = await vendorFetch('/api/vendor/profile');
        const profData = await resProf.json();
        let targetVendorId = vendorProfile.email || '';

        if (resProf.ok && profData.success && profData.vendor) {
          targetVendorId = profData.vendor.email || profData.vendor.id || vendorProfile.email || '';
        }

        const resProd = await vendorFetch('/api/products');
        const prodData = await resProd.json();

        if (prodData.success && Array.isArray(prodData.products)) {
          const mapped: Product[] = prodData.products.map((p: any) => ({
            id: p.id,
            vendorId: p.vendor_id || targetVendorId,
            vendorName: p.vendor_name || vendorProfile.brandName || 'Brand',
            name: p.name,
            price: Number(p.price) || 0,
            description: p.description || '',
            category: p.category || 'tops',
            genderTarget: p.gender_target || 'unisex',
            garmentOriginType: p.garment_origin_type || 'ready_made_boutique',
            imageUrl: p.imageUrl || p.image_url || '/images/products/BlackTrapStarHoodie.jpg',
            tags: Array.isArray(p.tags) ? p.tags : [],
            colors: Array.isArray(p.colors) ? p.colors : [{ name: 'Black', hex: '#111111' }],
            sizes: Array.isArray(p.sizes) ? p.sizes : ['Custom Fit'],
            sizeChart: {},
            stockQuantity: p.stock_quantity || 10,
            isPublished: true,
          }));

          setVendorProducts(mapped);
          if (mapped.length > 0) {
            setSelectedProductId(mapped[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading vendor products for direct sales:', err);
      } finally {
        setIsLoadingProducts(false);
      }
    }

    loadVendorCatalog();
  }, [vendorProfile.email, vendorProfile.brandName]);

  const categoryTabs: { id: GarmentCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Garments' },
    { id: 'tops', label: 'Tops & Senators' },
    { id: 'bottoms', label: 'Trousers & Pants' },
    { id: 'outerwear', label: 'Agbadas & Robes' },
    { id: 'footwear', label: 'Shoes & Slides' },
    { id: 'accessories', label: 'Caps & Accessories' },
  ];

  const filteredProducts = useMemo(() => {
    return vendorProducts.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q)));

      return matchesCategory && matchesQuery;
    });
  }, [vendorProducts, selectedCategory, searchQuery]);

  const activeProduct = useMemo(() => {
    if (vendorProducts.length === 0) return null;
    return vendorProducts.find(p => p.id === selectedProductId) || vendorProducts[0];
  }, [vendorProducts, selectedProductId]);

  const productLink = typeof window !== 'undefined' && activeProduct
    ? `${window.location.origin}/shop/${activeProduct.id}`
    : activeProduct ? `https://irisi.ng/shop/${activeProduct.id}` : '';

  const displayPrice = useMemo(() => {
    if (!activeProduct) return 0;
    if (promoPrice && Number(promoPrice.replace(/[^0-9]/g, '')) > 0) {
      return Number(promoPrice.replace(/[^0-9]/g, ''));
    }
    return activeProduct.price;
  }, [activeProduct, promoPrice]);

  const generatedMessage = useMemo(() => {
    if (!activeProduct) return '';
    const greeting = customerName.trim() ? `Hi ${customerName.trim()}!` : 'Hi!';
    const hasPromo = promoPrice && Number(promoPrice.replace(/[^0-9]/g, '')) > 0 && Number(promoPrice.replace(/[^0-9]/g, '')) !== activeProduct.price;
    const priceText = hasPromo
      ? `Special Deal: ₦${Number(promoPrice.replace(/[^0-9]/g, '')).toLocaleString()} (Regular: ₦${Number(activeProduct.price).toLocaleString()})`
      : `₦${Number(activeProduct.price).toLocaleString()}`;

    return `${greeting} ✨ Thanks for reaching out about the ${activeProduct.name} (${priceText}).\n\nTo see how this fits your exact body measurements in 3D and order with 24h Lagos delivery, tap this direct link:\n${productLink}\n\n${customNote.trim() ? `Note: ${customNote.trim()}` : ''}`.trim();
  }, [activeProduct, customerName, promoPrice, productLink, customNote]);

  const downloadBrandedCard = async (product: Product, withPrice: boolean) => {
    try {
      setIsDownloading(true);

      if (typeof navigator !== 'undefined' && navigator.clipboard && productLink) {
        navigator.clipboard.writeText(productLink);
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = product.imageUrl;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => {
          const fallback = new window.Image();
          fallback.src = product.imageUrl;
          fallback.onload = () => resolve();
          fallback.onerror = () => reject(new Error('Image failed to load'));
        };
      });

      canvas.width = 1080;
      canvas.height = 1350;

      ctx.drawImage(img, 0, 0, 1080, 1350);

      const gradient = ctx.createLinearGradient(0, 820, 0, 1350);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.35, 'rgba(10, 10, 10, 0.90)');
      gradient.addColorStop(1, 'rgba(5, 5, 5, 0.98)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 780, 1080, 570);

      // Top Left Brand Badge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.beginPath();
      ctx.roundRect(50, 50, 420, 68, 34);
      ctx.fill();
      ctx.strokeStyle = 'rgba(230, 195, 103, 0.5)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#e6c367';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText((vendorProfile?.brandName || 'BRAND').toUpperCase(), 80, 93);

      // Top Right Irisi Badge
      try {
        const logoImg = new (window as any).Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.src = '/images/logo/irisi-logo.png';
        await new Promise((res) => {
          logoImg.onload = res;
          logoImg.onerror = res;
        });
        if (logoImg.width > 0) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.beginPath();
          ctx.roundRect(760, 48, 270, 72, 36);
          ctx.fill();
          ctx.strokeStyle = 'rgba(230, 195, 103, 0.6)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.drawImage(logoImg, 810, 56, 170, 54);
        }
      } catch (e) {
        console.error('Logo render error', e);
      }

      // Bottom Product Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px serif';
      ctx.fillText(product.name, 50, withPrice ? 1120 : 1180);

      if (withPrice) {
        const priceToPrint = displayPrice || product.price;
        ctx.fillStyle = '#e6c367';
        ctx.font = 'bold 42px sans-serif';
        ctx.fillText(`₦${Number(priceToPrint).toLocaleString()}`, 50, 1195);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('● Secure Escrow & Doorstep Nationwide Dispatch · irisi.ng', 50, 1265);
      } else {
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText('● Verified Brand on Ìrísí · Tap Link in Bio to Order', 50, 1245);
      }

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      const fileSuffix = withPrice ? 'with-price' : 'no-price';
      a.download = `irisi-${(vendorProfile?.brandName || 'brand').toLowerCase().replace(/\s+/g, '-')}-${product.id}-${fileSuffix}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      const toastMsg = withPrice
        ? 'Card with Price downloaded & link copied to clipboard!'
        : 'Clean photo downloaded (No Price) & link copied to clipboard!';
      setDownloadToast(toastMsg);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
      setTimeout(() => setDownloadToast(null), 4000);
    } catch (err) {
      console.error('Error generating card image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {/* 1. DEDICATED MOBILE DIRECT SALES SUITE */}
      <div className="block md:hidden">
        <MobileVendorDirectSales
          vendorProducts={vendorProducts}
          isLoadingProducts={isLoadingProducts}
          selectedProductId={selectedProductId}
          setSelectedProductId={setSelectedProductId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          includePrice={includePrice}
          setIncludePrice={setIncludePrice}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customNote={customNote}
          setCustomNote={setCustomNote}
          downloadBrandedCard={downloadBrandedCard}
          isDownloading={isDownloading}
          downloadToast={downloadToast}
          productLink={productLink}
          activeProduct={activeProduct}
          generatedMessage={generatedMessage}
        />
      </div>

      {/* 2. DESKTOP LUXURY DIRECT SALES SUITE */}
      <div className="hidden md:block space-y-8 animate-fadeIn max-w-7xl pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--gold-accent)] animate-pulse" />
            <span className="text-xs font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold">
              Direct Sales Suite
            </span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-1">
            Direct Sales & Social Order Assistant
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-mono-luxury mt-1 max-w-2xl">
            Generate high-resolution branded lookbook cards with Ìrísí watermarks and 1-tap direct checkout links to close customer sales across Instagram, WhatsApp, and messaging in seconds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-xs font-mono-luxury font-bold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Direct Checkout Enabled</span>
          </span>
        </div>
      </div>

      {/* STEP 1: SELECT GARMENT */}
      <div className="p-6 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4 shadow-sm">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold block">
              Step 1: Select Garment from Your Catalog
            </span>
            <span className="text-[11px] font-mono-luxury text-[var(--text-muted)]">
              Showing {filteredProducts.length} of {vendorProducts.length} published pieces
            </span>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Senator, Ankara, Hoodies..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono-luxury focus:border-[var(--gold-accent)] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categoryTabs.map((tab) => {
            const isTabActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono-luxury uppercase transition-all whitespace-nowrap cursor-pointer ${
                  isTabActive
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold shadow-sm'
                    : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {isLoadingProducts ? (
          <div className="py-8 flex items-center justify-center gap-2 text-xs font-mono-luxury text-[var(--text-muted)]">
            <Sparkles className="h-4 w-4 animate-spin text-[var(--gold-accent)]" />
            <span>Loading your catalog...</span>
          </div>
        ) : vendorProducts.length === 0 ? (
          <div className="py-8 text-center space-y-3 p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
            <ShoppingBag className="h-8 w-8 text-[var(--text-muted)] mx-auto opacity-50" />
            <p className="text-xs font-mono-luxury text-[var(--text-secondary)] font-bold">
              You have not published any garments yet under {vendorProfile.brandName || 'your brand'}.
            </p>
            <Link
              href="/vendor-portal/publish"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono-luxury uppercase font-bold"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Publish Your First Piece</span>
            </Link>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono-luxury text-[var(--text-muted)]">
            No garments match &quot;{searchQuery}&quot; in this category.
          </div>
        ) : (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none">
            {filteredProducts.map((p) => {
              const isSelected = activeProduct?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 shrink-0 ${
                    isSelected
                      ? 'bg-[var(--gold-subtle)]/40 border-[var(--gold-accent)] ring-2 ring-[var(--gold-accent)]/40 shadow-md'
                      : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-[var(--bg-secondary)] shrink-0 shadow-inner">
                    <Image src={p.imageUrl} alt={p.name} fill unoptimized className="object-cover" />
                  </div>
                  <div className="pr-2 space-y-0.5">
                    <div className="font-bold text-xs text-[var(--text-primary)] max-w-[150px] truncate">{p.name}</div>
                    <div className="text-[11px] font-mono-luxury text-[var(--gold-accent)] font-bold">₦{Number(p.price).toLocaleString()}</div>
                    <div className="text-[9px] font-mono-luxury text-[var(--text-muted)] uppercase">{p.category}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {activeProduct && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT 5 COLS: BRANDED LOOKBOOK CARD */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4 shadow-xl">
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold">
                Branded Lookbook Card
              </span>
              <span className="text-[10px] font-mono-luxury text-emerald-500 font-bold">● High Resolution</span>
            </div>

            {/* Price Visibility Option */}
            <div className="p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono-luxury text-[var(--text-primary)] font-bold">
                {includePrice ? <Tag className="h-4 w-4 text-[var(--gold-accent)]" /> : <EyeOff className="h-4 w-4 text-[var(--text-muted)]" />}
                <span>Card Price Mode:</span>
              </div>

              <div className="flex items-center p-0.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIncludePrice(true)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono-luxury uppercase font-bold transition-all cursor-pointer ${
                    includePrice
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Show Price
                </button>
                <button
                  type="button"
                  onClick={() => setIncludePrice(false)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono-luxury uppercase font-bold transition-all cursor-pointer ${
                    !includePrice
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Hide Price
                </button>
              </div>
            </div>

            {/* The Generated Lookbook Card Preview */}
            <div className="relative w-full h-84 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 group select-none">
              <Image
                src={activeProduct.imageUrl}
                alt={activeProduct.name}
                fill
                unoptimized
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />

              {/* Top Left Brand Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-white/20">
                <span className="text-[10px] font-mono-luxury uppercase font-bold text-amber-300">
                  {vendorProfile?.brandName || 'BRAND'}
                </span>
              </div>

              {/* Top Right Veyra Watermark */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-[var(--gold-accent)]/60 shadow-lg">
                <span className="font-editorial text-xs font-bold text-white tracking-wider">
                  ÌRÍSÍ
                </span>
                <span className="text-[9px] font-mono-luxury font-bold text-[var(--gold-accent)]">
                  ● 3D STORE
                </span>
              </div>

              {/* Bottom Luxury Overlay Bar Embedded on Photo */}
              <div className="absolute bottom-3 left-3 right-3 p-3 rounded-2xl bg-black/90 backdrop-blur-md border border-white/15 flex items-center justify-between">
                <div className="truncate pr-2">
                  <h4 className="font-editorial text-xs font-bold text-white truncate">{activeProduct.name}</h4>
                  {includePrice ? (
                    <div className="text-[10px] font-mono-luxury text-amber-300 font-bold">
                      ₦{Number(displayPrice).toLocaleString()} · <span className="text-emerald-400">3D Fit on Ìrísí</span>
                    </div>
                  ) : (
                    <div className="text-[10px] font-mono-luxury text-emerald-400 font-bold">
                      ● 3D Custom Fit on Ìrísí
                    </div>
                  )}
                </div>

                <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black text-[9px] font-mono-luxury font-bold uppercase shrink-0">
                  Tap Link to Fit
                </span>
              </div>
            </div>

            {/* Original Download Button */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => downloadBrandedCard(activeProduct, includePrice)}
                disabled={isDownloading}
                className="w-full py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isDownloading ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin text-[var(--gold-accent)]" />
                    <span>Generating Card...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>{includePrice ? 'Download Card (With Price)' : 'Download Clean Card (No Price)'}</span>
                  </>
                )}
              </button>

              {downloadToast && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-mono-luxury font-bold flex items-center justify-center gap-2 animate-fadeIn text-center">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{downloadToast}</span>
                </div>
              )}

              <p className="text-[10px] font-mono-luxury text-[var(--text-muted)] text-center">
                Downloads high-res card with Ìrísí watermark & automatically copies the direct checkout link!
              </p>
            </div>

          </div>

          {/* RIGHT 7 COLS: 1-TAP DM CLOSER */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-5 shadow-xl">
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-luxury uppercase text-[var(--gold-accent)] font-bold">
                1-Tap Direct Checkout Message
              </span>
              <span className="text-[10px] font-mono-luxury text-zinc-400">Copy & Send in 1-Click</span>
            </div>

            {/* Quick Customizer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Customer Name / Handle
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Buyer's name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono-luxury font-bold focus:border-[var(--gold-accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono-luxury uppercase text-[var(--text-secondary)] mb-1 font-bold">
                  Quick Deal Note / Perks
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Free 24h Lagos delivery"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono-luxury focus:border-[var(--gold-accent)] focus:outline-none"
                />
              </div>
            </div>

            {/* Formatted Pitch Message */}
            <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3 font-mono-luxury text-xs text-[var(--text-primary)] leading-relaxed relative">
              <p>
                {customerName.trim() ? (
                  <>Hi <strong className="text-[var(--gold-accent)]">{customerName.trim()}</strong>! ✨ </>
                ) : (
                  <>Hi! ✨ </>
                )}
                Thanks for reaching out about the <strong>{activeProduct.name}</strong> (₦{Number(displayPrice).toLocaleString()}).
              </p>
              <p>To see how this fits your exact body measurements in 3D and order with 24h Lagos delivery, tap this direct link:</p>
              <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[11px] text-[var(--gold-accent)] break-all font-bold select-all">
                {productLink}
              </div>
              {customNote.trim() && (
                <p className="text-emerald-400 font-bold">Note: {customNote.trim()}</p>
              )}
            </div>

            {/* Original Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(generatedMessage);
                    setCopiedMessage(true);
                    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
                    setTimeout(() => setCopiedMessage(false), 3000);
                  }
                }}
                className="py-3 px-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {copiedMessage ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span>{copiedMessage ? 'Message Copied!' : 'Copy DM Message'}</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(generatedMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-full bg-emerald-500 text-black font-mono-luxury uppercase text-xs font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-md text-center"
              >
                <Send className="h-4 w-4 shrink-0" />
                <span>Send via WhatsApp</span>
              </a>
            </div>

          </div>

        </div>
      )}

      </div>
    </>
  );
}
