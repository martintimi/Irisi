'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/lib/store/useStore';
import {
  Search, Camera, Sparkles, ArrowRight, Heart,
  ChevronRight, Sun, Moon, ShoppingBag, Store, ArrowUpRight
} from 'lucide-react';

type TabId = 'men' | 'women' | 'streetwear' | 'native' | 'footwear';

const TABS: { id: TabId; label: string }[] = [
  { id: 'men', label: 'MEN' },
  { id: 'women', label: 'WOMEN' },
  { id: 'streetwear', label: 'STREETWEAR' },
  { id: 'native', label: 'NATIVE' },
  { id: 'footwear', label: 'FOOTWEAR' },
];

export default function DesktopHomeView() {
  const {
    allProducts,
    toggleVaultItem,
    isInVault,
    theme,
    toggleTheme,
    fetchProductsFromDb,
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('men');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    fetchProductsFromDb();
  }, [fetchProductsFromDb]);

  // Reset slide on tab change
  useEffect(() => { setCurrentSlideIndex(0); }, [activeTab]);

  // ── Hero Slides (same data as mobile) ──────────────────────────────────────
  const heroSlides = useMemo(() => {
    switch (activeTab) {
      case 'women': return [
        { id: 'w-1', tag: 'DRESSES & GOWNS', title: 'EVENING GOWNS & BODYCONS', subtitle: 'NIGERIAN WOMEN\'S LUXURY', highlight: 'ASO-EBI & COUTURE STYLES', image: '/images/categories/dressesforwomen.jpeg', link: '/shop?gender=women&category=dresses' },
        { id: 'w-2', tag: 'TWO-PIECE SETS', title: 'MATCHING COORD SETS', subtitle: 'TAILORED CO-ORDS & SETS', highlight: 'PREMIUM FABRIC QUALITY', image: '/images/categories/women_coord.jpg', link: '/shop?gender=women&category=two-piece' },
        { id: 'w-3', tag: 'SHOES & HEELS', title: 'HEELS, SLIDES & FLATS', subtitle: 'STATEMENT WOMEN\'S FOOTWEAR', highlight: 'EVERYDAY & OCCASION WEAR', image: '/images/categories/women_heels.jpg', link: '/shop?gender=women&department=footwear' },
      ];
      case 'streetwear': return [
        { id: 's-1', tag: 'HOODIES & SWEATS', title: 'HEAVYWEIGHT BOXY HOODIES', subtitle: 'OVERSIZED STREET SILHOUETTES', highlight: '480GSM PREMIUM FLEECE', image: 'https://res.cloudinary.com/dvnj8idde/image/upload/v1789123514/veyra_categories/prod_1788316482065_1_489.jpg', link: '/shop?gender=men&category=hoodies' },
        { id: 's-2', tag: 'CARGO & JOGGERS', title: 'STREET CARGO TROUSERS', subtitle: 'UTILITY POCKET SILHOUETTES', highlight: 'RELAXED WIDE-LEG FIT', image: '/images/uploaded/Oversizedhoodie&cargo.jpeg', link: '/shop?category=cargo' },
        { id: 's-3', tag: 'GRAPHIC TEES', title: 'STATEMENT GRAPHIC TEES', subtitle: 'STREET ART & CULTURE PRINTS', highlight: 'HEAVYWEIGHT COTTON DROPS', image: '/images/uploaded/t-shirtsandgraphic.jpeg', link: '/shop?category=tshirts' },
      ];
      case 'native': return [
        { id: 'n-1', tag: 'TRADITIONAL & NATIVE', title: 'ROYAL 3-PIECE AGBADA', subtitle: 'WEDDINGS & OWAMBE CELEBRATIONS', highlight: 'EMBROIDERED CEREMONIAL ROBES', image: '/images/uploaded/agbadaformen.jpeg', link: '/shop?gender=men&category=agbada' },
        { id: 'n-2', tag: 'SENATOR & KAFTAN', title: 'TAILORED SENATOR SETS', subtitle: 'OFFICE & SUNDAY BEST', highlight: 'CLEAN TWO-PIECE OUTFITS', image: '/images/uploaded/senatorformen.jpeg', link: '/shop?gender=men&category=senator' },
      ];
      case 'footwear': return [
        { id: 'f-1', tag: 'SLIDES & PALMS', title: 'SLIDES & COMFORT PALMS', subtitle: 'CASUAL ALL-DAY SLIP-ONS', highlight: 'CUSHIONED SLIP-ON FOOTBED', image: 'https://res.cloudinary.com/dvnj8idde/image/upload/v1789123513/veyra_categories/sides_palm.jpg', link: '/shop?department=footwear' },
        { id: 'f-2', tag: 'STREET SHOES', title: 'CANVAS & STREET SNEAKERS', subtitle: 'RETRO RUNNERS & LOW-TOPS', highlight: 'CUSHIONED PLATFORM SOLES', image: 'https://res.cloudinary.com/dvnj8idde/image/upload/v1789123512/veyra_categories/shoefootwareformen.jpg', link: '/shop?category=sneakers' },
        { id: 'f-3', tag: 'FORMAL SHOES', title: 'SMART MULES & LOAFERS', subtitle: 'OCCASION & SUNDAY BEST', highlight: 'ELEGANT LEATHER SILHOUETTES', image: '/images/products/BlackSmartShoes.jpg', link: '/shop?category=sneakers' },
      ];
      case 'men':
      default: return [
        { id: 'm-1', tag: 'TRADITIONAL & NATIVE', title: 'ROYAL 3-PIECE AGBADA', subtitle: 'WEDDINGS & CELEBRATIONS', highlight: 'EMBROIDERED NIGERIAN ROBES', image: 'https://res.cloudinary.com/dvnj8idde/image/upload/v1789123515/veyra_categories/agbadaformen.jpg', link: '/shop?gender=men&category=agbada' },
        { id: 'm-2', tag: 'STREETWEAR', title: 'HOODIES & SWEATSHIRTS', subtitle: 'EVERYDAY CASUAL STREETWEAR', highlight: 'HEAVYWEIGHT RELAXED FITS', image: 'https://res.cloudinary.com/dvnj8idde/image/upload/v1789123514/veyra_categories/prod_1788316482065_1_489.jpg', link: '/shop?gender=men&category=hoodies' },
        { id: 'm-3', tag: 'SENATOR & KAFTAN', title: 'TAILORED SENATOR SETS', subtitle: 'OFFICE & SUNDAY BEST', highlight: 'CLEAN TWO-PIECE KAFTANS', image: 'https://res.cloudinary.com/dvnj8idde/image/upload/v1789123516/veyra_categories/senatorformen.jpg', link: '/shop?gender=men&category=senator' },
        { id: 'm-4', tag: 'SNEAKERS & FOOTWEAR', title: 'STREET SNEAKERS & SHOES', subtitle: 'URBAN TRAINERS & CASUAL FOOTWEAR', highlight: 'PREMIUM COMFORT & FIT', image: 'https://res.cloudinary.com/dvnj8idde/image/upload/v1789123512/veyra_categories/shoefootwareformen.jpg', link: '/shop?gender=men&department=footwear' },
      ];
    }
  }, [activeTab]);

  // Auto-rotate slides
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const t = setInterval(() => setCurrentSlideIndex(p => (p + 1) % heroSlides.length), 4500);
    return () => clearInterval(t);
  }, [heroSlides.length]);

  // ── Categories by Tab ───────────────────────────────────────────────────────
  const categoriesByTab = useMemo(() => {
    switch (activeTab) {
      case 'women': return [
        { id: 'w-couture', title: 'Dresses & Gowns', subtitle: 'Evening Gowns & Bodycons', image: '/images/categories/dressesforwomen.jpeg', link: '/shop?gender=women&category=dresses' },
        { id: 'w-coord', title: 'Two-Piece Sets', subtitle: 'Matching Sets & Co-ords', image: '/images/categories/women_coord.jpg', link: '/shop?gender=women&category=two-piece' },
        { id: 'w-tops', title: 'Tops & Corset', subtitle: 'Corsets, Tops & Blouses', image: '/images/uploaded/Streetwear&topsWomen.jpeg', link: '/shop?gender=women&category=tops' },
        { id: 'w-shoes', title: 'Shoes & Heels', subtitle: 'Heels, Slides & Flats', image: '/images/categories/women_heels.jpg', link: '/shop?gender=women&department=footwear' },
        { id: 'w-bags', title: 'Handbags & Totes', subtitle: 'Shoulder Bags & Clutches', image: '/images/uploaded/LeaderbagsWomen.jpeg', link: '/shop?gender=women&department=bags' },
        { id: 'w-jewelry', title: 'Jewelry & Watches', subtitle: 'Necklaces, Rings & Watches', image: '/images/uploaded/WomenJewelry.jpeg', link: '/shop?gender=women&category=jewelry' },
      ];
      case 'streetwear': return [
        { id: 's-hoodies', title: 'Hoodies & Sweats', subtitle: 'Heavyweight Boxy Hoodies', image: 'https://res.cloudinary.com/dvnj8idde/image/upload/v1789123514/veyra_categories/prod_1788316482065_1_489.jpg', link: '/shop?gender=men&category=hoodies' },
        { id: 's-cargo', title: 'Joggers & Sweatpants', subtitle: 'Relaxed Fleece & Street Joggers', image: '/images/uploaded/Oversizedhoodie&cargo.jpeg', link: '/shop?category=cargo' },
        { id: 's-tees', title: 'Graphic Tees', subtitle: 'Statement Street Tees', image: '/images/uploaded/t-shirtsandgraphic.jpeg', link: '/shop?category=tshirts' },
        { id: 's-denim', title: 'Baggy Denim', subtitle: 'Wide-Leg & Straight Jeans', image: '/images/products/BaggyJean.jpg', link: '/shop?category=denim' },
        { id: 's-caps', title: 'Caps & Beanies', subtitle: 'Street Truckers & Snapbacks', image: '/images/uploaded/capshatbeanies.jpeg', link: '/shop?gender=men&category=caps' },
        { id: 's-bags', title: 'Backpacks & Bags', subtitle: 'Commuter Backpacks & Duffels', image: '/images/uploaded/leaderBags.jpeg', link: '/shop?gender=men&department=bags' },
      ];
      case 'native': return [
        { id: 'n-agbada', title: 'Agbada & Robes', subtitle: 'Ceremonial 3-Piece Sets', image: '/images/uploaded/agbadaformen.jpeg', link: '/shop?gender=men&category=agbada' },
        { id: 'n-senator', title: 'Senator & Kaftan', subtitle: 'Clean Two-Piece Sets', image: '/images/uploaded/senatorformen.jpeg', link: '/shop?gender=men&category=senator' },
        { id: 'n-jalabiya', title: 'Jalabiya & Robes', subtitle: 'Comfortable Flowing Robes', image: '/images/uploaded/jalabmen.jpeg', link: '/shop?gender=men&category=jalabiya' },
        { id: 'n-caps', title: 'Fila & Native Caps', subtitle: 'Aso-Oke Embroidered Caps', image: '/images/products/Cap1.png', link: '/shop?category=fila' },
      ];
      case 'footwear': return [
        { id: 'f-slides', title: 'Slides & Palms', subtitle: 'Casual All-Day Slip-Ons', image: 'https://res.cloudinary.com/dvnj8idde/image/upload/v1789123513/veyra_categories/sides_palm.jpg', link: '/shop?department=footwear' },
        { id: 'f-sneakers', title: 'Canvas & Sneakers', subtitle: 'Retro Runners & Low-Tops', image: 'https://res.cloudinary.com/dvnj8idde/image/upload/v1789123512/veyra_categories/shoefootwareformen.jpg', link: '/shop?category=sneakers' },
        { id: 'f-loafers', title: 'Mules & Loafers', subtitle: 'Smart Occasion Footwear', image: '/images/products/BlackSmartShoes.jpg', link: '/shop?category=sneakers' },
        { id: 'f-crocs', title: 'Crocs & Clogs', subtitle: 'Lightweight Foam Comfort', image: 'https://res.cloudinary.com/dvnj8idde/image/upload/v1789123513/veyra_categories/crocsformen.jpg', link: '/shop?category=clogs' },
      ];
      case 'men':
      default: return [
        { id: 'm-agbada', title: 'Agbada & Native', subtitle: 'Ceremonial 3-Piece Robes', image: 'https://res.cloudinary.com/dvnj8idde/image/upload/v1789123515/veyra_categories/agbadaformen.jpg', link: '/shop?gender=men&category=agbada' },
        { id: 'm-hoodies', title: 'Hoodies & Sweats', subtitle: 'Heavyweight Casual Drops', image: 'https://res.cloudinary.com/dvnj8idde/image/upload/v1789123514/veyra_categories/prod_1788316482065_1_489.jpg', link: '/shop?gender=men&category=hoodies' },
        { id: 'm-senator', title: 'Senator & Kaftan', subtitle: 'Office & Sunday Best', image: 'https://res.cloudinary.com/dvnj8idde/image/upload/v1789123516/veyra_categories/senatorformen.jpg', link: '/shop?gender=men&category=senator' },
        { id: 'm-polos', title: 'Polos & Shirts', subtitle: 'Smart Casual Collar Shirts', image: 'https://res.cloudinary.com/dvnj8idde/image/upload/v1789123518/veyra_categories/tshirtandpoloformen.jpg', link: '/shop?gender=men&category=polos' },
        { id: 'm-footwear', title: 'Shoes & Sneakers', subtitle: 'Street Trainers & Loafers', image: 'https://res.cloudinary.com/dvnj8idde/image/upload/v1789123512/veyra_categories/shoefootwareformen.jpg', link: '/shop?gender=men&department=footwear' },
        { id: 'm-bags', title: 'Bags & Backpacks', subtitle: 'Leather & Canvas Carryalls', image: '/images/uploaded/leaderBags.jpeg', link: '/shop?gender=men&department=bags' },
      ];
    }
  }, [activeTab]);

  // ── Occasions ───────────────────────────────────────────────────────────────
  const occasions = useMemo(() => {
    if (activeTab === 'women') return [
      { title: 'Weddings & Owambe', sub: 'Aso-Ebi, Corseted Gowns & Lace Styles', image: '/images/editorial/nigerian_female_couture.jpg', link: '/shop?gender=women&department=native' },
      { title: 'Streetwear & Casual', sub: 'Cropped Hoodies, Cargo Pants & Denim', image: '/images/uploaded/Oversizedhoodie&cargo.jpeg', link: '/shop?gender=women&department=clothing' },
      { title: 'Weekend & Resort', sub: 'Flowing Silk Boubou, Leather Slides & Bags', image: '/images/uploaded/LeaderbagsWomen.jpeg', link: '/shop?gender=women&category=boubou' },
    ];
    return [
      { title: 'Weddings & Owambe', sub: 'Ceremonial Agbada, Senator Sets & Fila Caps', image: '/images/editorial/nigerian_male_couture.jpg', link: '/shop?gender=men&category=agbada' },
      { title: 'Streetwear & Casual', sub: 'Heavyweight Hoodies, Cargo & Graphic Tees', image: '/images/editorial/modern_male_streetwear.jpg', link: '/shop?gender=men&category=hoodies' },
      { title: 'Office & Sunday Best', sub: 'Clean Senator Sets, Dress Trousers & Leather Slides', image: '/images/products/UnisexSlides.jpg', link: '/shop?gender=men&category=slides' },
    ];
  }, [activeTab]);

  // ── Products ────────────────────────────────────────────────────────────────
  const productsList = useMemo(() => {
    let list = allProducts && allProducts.length > 0 ? [...allProducts] : [
      { id: 'p-1', name: 'Imperial Obsidian Grand Agbada', price: 95000, vendorName: 'Atelier Sovereign', category: 'tops', genderTarget: 'male', imageUrl: '/images/products/BlackAgbada.jpg', stockQuantity: 5 } as any,
      { id: 'p-2', name: '480GSM Heavyweight Hoodie', price: 42000, vendorName: 'Urban Archive', category: 'outerwear', genderTarget: 'unisex', imageUrl: '/images/no-product.svg', stockQuantity: 12 } as any,
      { id: 'p-3', name: 'Handcrafted Leather Slides', price: 32000, vendorName: 'Kano Leather Studio', category: 'footwear', genderTarget: 'unisex', imageUrl: '/images/products/UnisexSlides.jpg', stockQuantity: 8 } as any,
      { id: 'p-4', name: 'Midnight Senator 2-Piece', price: 68000, vendorName: 'Atelier Sovereign', category: 'tops', genderTarget: 'male', imageUrl: '/images/products/BlackSenator.jpg', stockQuantity: 6 } as any,
      { id: 'p-5', name: 'Wide-Leg Baggy Denim', price: 29000, vendorName: 'Urban Archive', category: 'bottoms', genderTarget: 'unisex', imageUrl: '/images/products/BaggyJean.jpg', stockQuantity: 15 } as any,
      { id: 'p-6', name: 'Embroidered Velvet Fila Cap', price: 18000, vendorName: 'Heritage Ateliers', category: 'accessories', genderTarget: 'male', imageUrl: '/images/products/Cap1.png', stockQuantity: 20 } as any,
      { id: 'p-7', name: 'Silk Adire Statement Kimono', price: 54000, vendorName: 'Femme Atelier', category: 'tops', genderTarget: 'female', imageUrl: '/images/editorial/female_dress.jpg', stockQuantity: 7 } as any,
      { id: 'p-8', name: 'Structured Leather Shoulder Bag', price: 48000, vendorName: 'Kano Leather Studio', category: 'accessories', genderTarget: 'female', imageUrl: '/images/uploaded/LeaderbagsWomen.jpeg', stockQuantity: 4 } as any,
    ];

    if (activeTab === 'men') list = list.filter(p => p.genderTarget === 'male' || p.genderTarget === 'unisex' || !p.genderTarget);
    else if (activeTab === 'women') list = list.filter(p => p.genderTarget === 'female' || p.genderTarget === 'unisex');
    else if (activeTab === 'streetwear') list = list.filter(p => { const n = (p.name || '').toLowerCase(); return p.category === 'outerwear' || n.includes('hoodie') || n.includes('street') || n.includes('cargo') || n.includes('jean'); });
    else if (activeTab === 'native') list = list.filter(p => { const n = (p.name || '').toLowerCase(); return n.includes('agbada') || n.includes('senator') || n.includes('native') || n.includes('fila') || n.includes('kaftan'); });
    else if (activeTab === 'footwear') list = list.filter(p => p.category === 'footwear');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name?.toLowerCase().includes(q) || p.vendorName?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }

    return list;
  }, [allProducts, activeTab, searchQuery]);

  const trendingPieces = useMemo(() => productsList.slice(0, 8), [productsList]);

  // Recently Viewed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('irisi_recently_viewed');
      if (raw && allProducts?.length > 0) {
        const ids: string[] = JSON.parse(raw);
        const matched = ids.map(id => allProducts.find(p => String(p.id) === String(id))).filter(Boolean);
        setRecentlyViewed(matched.slice(0, 6));
      }
    } catch (e) {}
  }, [allProducts]);

  return (
    <div className="hidden md:block min-h-screen bg-white dark:bg-[#0A0A0C] text-black dark:text-white">

      {/* ── 1. STICKY TOP NAV BAR ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0A0A0C]/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="relative h-9 w-9 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-black shadow-sm">
              <Image src="/images/logo/irisi-icon.png" alt="IRISI" width={36} height={36} priority className="w-full h-full object-cover" />
            </div>
            <span className="font-sans font-black text-[22px] tracking-tight uppercase text-black dark:text-white leading-none">ÌRÍSÍ</span>
          </Link>

          {/* Divider */}
          <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800 shrink-0" />

          {/* Division Tabs */}
          <nav className="flex items-center gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab.toUpperCase()}...`}
              className="w-full pl-9 pr-10 py-2 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-black dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
            />
            <Camera className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 ml-auto shrink-0">
            <Link href="/categories" className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Categories</span>
            </Link>
            <Link href="/shop" className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black text-[11px] font-black uppercase tracking-wide hover:opacity-85 transition-opacity shadow-sm">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Shop All</span>
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              suppressHydrationWarning
              className="p-2 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              {mounted && theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. SPLIT HERO: Slideshow LEFT + Category Grid RIGHT ──────────── */}
      <section className="max-w-[1400px] mx-auto px-6 pt-6">
        <div className="flex gap-4 h-[520px]">

          {/* LEFT — Slideshow (60%) */}
          <div className="relative flex-[3] rounded-2xl overflow-hidden bg-black">
            {heroSlides.map((slide, idx) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ${idx === currentSlideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <Image src={slide.image} alt={slide.title} fill unoptimized priority={idx === 0} className="object-cover scale-105 transition-transform duration-1000" />
                <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end pb-10 px-10 z-10 space-y-2">
                  <span className="inline-flex w-fit px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[9px] font-mono tracking-widest uppercase border border-white/30">
                    {slide.tag}
                  </span>
                  <p className="text-xs font-mono tracking-widest text-neutral-300 uppercase">{slide.subtitle}</p>
                  <h2 className="text-4xl xl:text-5xl font-black text-white uppercase tracking-tight leading-none drop-shadow-[0_4px_14px_rgba(0,0,0,1)]">
                    {slide.title}
                  </h2>
                  <span className="inline-flex w-fit px-3 py-1 rounded-full bg-black/55 backdrop-blur-md text-xs font-mono font-bold tracking-widest text-amber-300 uppercase border border-amber-400/30">
                    {slide.highlight}
                  </span>
                  <div className="pt-2">
                    <Link href={slide.link} className="inline-block px-8 py-3 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-amber-300 transition-colors shadow-2xl">
                      SHOP THIS DROP →
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Slide dots */}
            <div className="absolute bottom-4 left-10 z-20 flex items-center gap-1.5">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentSlideIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i === currentSlideIndex ? 'w-6 bg-amber-400' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
                />
              ))}
            </div>
          </div>

          {/* RIGHT — Category Grid (40%) */}
          <div className="flex-[2] grid grid-cols-2 gap-2.5 overflow-hidden">
            {categoriesByTab.slice(0, 6).map(cat => (
              <Link
                key={cat.id}
                href={cat.link}
                className="relative rounded-xl overflow-hidden bg-black group border border-neutral-200 dark:border-neutral-800 min-h-0"
              >
                <Image src={cat.image} alt={cat.title} fill unoptimized className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-2 inset-x-2 z-10">
                  <p className="text-[10px] font-black uppercase text-white leading-tight drop-shadow-sm">{cat.title}</p>
                  <p className="text-[8px] text-neutral-300 truncate drop-shadow-sm">{cat.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. ANNOUNCEMENT BAR ──────────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 mt-5">
        <div className="bg-black dark:bg-neutral-900 rounded-xl px-6 py-3.5 flex items-center justify-between border border-neutral-800">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-white block leading-none">
              NEW ARRIVALS · READY TO SHIP
            </span>
            <span className="text-[9px] text-neutral-400 tracking-tight">
              Direct courier delivery across all 36 states · Fast waybill dispatch
            </span>
          </div>
          <Link href="/shop" className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-white hover:text-amber-300 transition-colors shrink-0">
            <span>SHOP NOW</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* ── 4. TRENDING DROPS (4-col product grid) ──────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 mt-10">
        <div className="flex items-end justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 mb-5">
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-black dark:text-white">Trending Pieces</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Popular Clothes, Shoes & Bags · {activeTab.toUpperCase()}</p>
          </div>
          <Link href="/shop" className="flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
            <span>View All {productsList.length > 0 ? `(${productsList.length})` : ''}</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {trendingPieces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="h-10 w-10 text-neutral-300 dark:text-neutral-700 mb-3" />
            <p className="text-sm font-bold text-neutral-500 uppercase tracking-wide">No products yet in {activeTab.toUpperCase()}</p>
            <Link href="/shop" className="mt-4 px-6 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-wide hover:opacity-85 transition-opacity">
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {trendingPieces.map(product => {
              const isFav = isInVault(product.id);
              const imageSrc = product.imageUrl || (Array.isArray(product.images) && product.images[0]) || '/images/no-product.svg';
              return (
                <div key={product.id} className="group flex flex-col border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-950 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors">
                  {/* Image */}
                  <div className="relative aspect-[3/4] bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                    <Link href={`/shop/${product.id}`} className="block h-full w-full">
                      <Image
                        src={imageSrc}
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>
                    {/* Wishlist */}
                    <button
                      type="button"
                      onClick={() => toggleVaultItem(product)}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Heart className={`h-3.5 w-3.5 transition-colors ${isFav ? 'fill-rose-500 stroke-rose-500' : 'stroke-neutral-600 dark:stroke-neutral-300'}`} />
                    </button>
                    {/* Quick Buy */}
                    <div className="absolute bottom-2 inset-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setQuickBuyProduct(product)}
                        className="w-full py-2 rounded-lg bg-black/85 dark:bg-white/90 backdrop-blur-sm text-white dark:text-black text-[10px] font-black uppercase tracking-wider hover:bg-black dark:hover:bg-white transition-colors cursor-pointer"
                      >
                        Quick Buy
                      </button>
                    </div>
                  </div>
                  {/* Meta */}
                  <Link href={`/shop/${product.id}`} className="p-3 flex flex-col flex-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 truncate">{product.vendorName || 'Atelier'}</span>
                    <span className="text-xs font-bold text-black dark:text-white leading-tight mt-0.5 line-clamp-2">{product.name}</span>
                    <span className="text-sm font-black text-black dark:text-white mt-auto pt-2">
                      ₦{Number(product.price || 0).toLocaleString()}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 5. SHOP BY OCCASION (3 horizontal cards) ─────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 mt-14">
        <div className="flex items-end justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 mb-5">
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-black dark:text-white">Shop by Occasion</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Curated looks for every moment</p>
          </div>
          <Link href="/shop" className="flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
            <span>Browse All</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {occasions.map((occ, i) => (
            <Link
              key={i}
              href={occ.link}
              className="group relative flex items-end rounded-2xl overflow-hidden h-56 bg-black border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
            >
              <Image src={occ.image} alt={occ.title} fill unoptimized className="object-cover opacity-75 group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="relative z-10 p-5">
                <h3 className="text-sm font-black uppercase text-white leading-tight">{occ.title}</h3>
                <p className="text-[10px] text-neutral-300 mt-1 leading-snug">{occ.sub}</p>
                <span className="inline-flex items-center gap-1 mt-2.5 text-[10px] font-black uppercase text-amber-300 tracking-wider">
                  Shop Now <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 6. FEATURED BRANDS ───────────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 mt-14">
        <div className="flex items-end justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 mb-5">
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-black dark:text-white">Featured Brands & Stores</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Independent Nigerian designers on Ìrísí</p>
          </div>
          <Link href="/vendors" className="flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
            <span>View All Brands</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { name: 'Atelier Sovereign', origin: 'Lagos Island', focus: 'Bespoke Ceremonial Agbada', image: '/images/products/BlackAgbada.jpg', slug: 'atelier-sovereign' },
            { name: 'Urban Archive', origin: 'Yaba, Lagos', focus: '480GSM Heavyweight Streetwear', image: '/images/no-product.svg', slug: 'urban-archive' },
            { name: 'Kano Leather Studio', origin: 'Kano', focus: 'Handcrafted Calfskin Footwear', image: '/images/products/UnisexSlides.jpg', slug: 'kano-leather-studio' },
          ].map((brand, i) => (
            <Link
              key={i}
              href={`/brand/${brand.slug}`}
              className="group flex items-center gap-4 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-neutral-950 transition-all hover:shadow-md"
            >
              <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 shrink-0 border border-neutral-200 dark:border-neutral-800">
                <Image src={brand.image} alt={brand.name} fill unoptimized className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm font-black text-black dark:text-white truncate">{brand.name}</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">{brand.origin}</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5 truncate">{brand.focus}</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── 7. RECENTLY VIEWED (only if user has browsed) ──────────────────── */}
      {recentlyViewed.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 mt-14 pb-16">
          <div className="flex items-end justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 mb-5">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-black dark:text-white">Recently Viewed</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Pieces you browsed recently</p>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-3">
            {recentlyViewed.map(item => {
              const imgSrc = item.imageUrl || (Array.isArray(item.images) && item.images[0]) || '/images/no-product.svg';
              return (
                <Link key={item.id} href={`/shop/${item.id}`} className="group flex flex-col border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors">
                  <div className="relative aspect-square bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                    <Image src={imgSrc} alt={item.name} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-2.5">
                    <p className="text-[9px] text-neutral-400 truncate">{item.vendorName}</p>
                    <p className="text-[10px] font-bold text-black dark:text-white truncate mt-0.5">{item.name}</p>
                    <p className="text-xs font-black text-black dark:text-white mt-1">₦{Number(item.price || 0).toLocaleString()}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Bottom padding if no recently viewed */}
      {recentlyViewed.length === 0 && <div className="pb-16" />}

    </div>
  );
}
