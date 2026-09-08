'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/lib/store/useStore';
import {
  Search, Camera, Sparkles, ArrowRight, Heart,
  ChevronRight, Sun, Moon, ArrowUpRight
} from 'lucide-react';
import MobileQuickBuyDrawer from '@/components/mobile/MobileQuickBuyDrawer';

export default function MobileHomeView() {
  const {
    allProducts,
    vault,
    toggleVaultItem,
    isInVault,
    theme,
    toggleTheme,
    fetchProductsFromDb,
  } = useStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    fetchProductsFromDb();
  }, [fetchProductsFromDb]);

  // Division Tabs (Fashion Nova style: MEN, WOMEN, STREETWEAR, NATIVE, FOOTWEAR)
  const [activeTab, setActiveTab] = useState<'men' | 'women' | 'streetwear' | 'native' | 'footwear'>('men');

  // Search input query
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Buy Modal
  const [quickBuyProduct, setQuickBuyProduct] = useState<any>(null);

  // Dynamic Categories by Tab (Taking Categories Seriously!)
  const categoriesByTab = useMemo(() => {
    switch (activeTab) {
      case 'women':
        return [
          {
            id: 'w-couture',
            title: "Women's Couture",
            subtitle: 'Bespoke Sets & Robes',
            image: '/images/editorial/nigerian_female_couture.jpg',
            link: '/shop?gender=women&category=dresses',
          },
          {
            id: 'w-street',
            title: 'Streetwear & Tops',
            subtitle: 'Oversized Hoodies & Tees',
            image: '/images/uploaded/Streetwear&topsWomen.jpeg',
            link: '/shop?gender=women&category=women-hoodies',
          },
          {
            id: 'w-bags',
            title: 'Artisanal Leather Bags',
            subtitle: 'Crossbodies & Luxury Totes',
            image: '/images/uploaded/LeaderbagsWomen.jpeg',
            link: '/shop?gender=women&department=bags',
          },
          {
            id: 'w-shoes',
            title: 'Footwear & Slides',
            subtitle: 'Handcrafted Slides & Mules',
            image: '/images/uploaded/footwear&slideswomen.jpeg',
            link: '/shop?gender=women&department=footwear',
          },
          {
            id: 'w-jewelry',
            title: 'Fine Jewelry',
            subtitle: 'Statement Chains & Accents',
            image: '/images/uploaded/WomenJewelry.jpeg',
            link: '/shop?gender=women&category=jewelry',
          },
          {
            id: 'w-shirts',
            title: 'Silk & Tailored Tops',
            subtitle: 'Adire & Casual Blouses',
            image: '/images/editorial/female_shirt.jpg',
            link: '/shop?gender=women&category=tops',
          },
        ];

      case 'streetwear':
        return [
          {
            id: 's-hoodies',
            title: '480GSM Hoodies',
            subtitle: 'Heavyweight Boxy Fits',
            image: '/images/products/BlackTrapStarHoodie.jpg',
            link: '/shop?gender=men&category=hoodies',
          },
          {
            id: 's-denim',
            title: 'Pants & Cargo',
            subtitle: 'Wide-Leg Vintage Denim',
            image: '/images/uploaded/pantsandcargo.jpeg',
            link: '/shop?gender=men&category=jeans',
          },
          {
            id: 's-caps',
            title: 'Street Caps',
            subtitle: 'Embroidered Structured Caps',
            image: '/images/products/Cap1.png',
            link: '/shop?gender=men&category=caps',
          },
          {
            id: 's-slides',
            title: 'Artisanal Slides',
            subtitle: 'Leather Street Slides',
            image: '/images/products/UnisexSlides.jpg',
            link: '/shop?category=slides',
          },
        ];

      case 'native':
        return [
          {
            id: 'n-agbada',
            title: 'Royal 3-Piece Agbada',
            subtitle: 'Ceremonial Embroidery',
            image: '/images/products/BlackAgbada.jpg',
            link: '/shop?gender=men&category=agbada',
          },
          {
            id: 'n-senator',
            title: 'Tailored Senator Sets',
            subtitle: 'Geometric Placket Cuts',
            image: '/images/products/BlackSenator.jpg',
            link: '/shop?gender=men&category=senator',
          },
          {
            id: 'n-fila',
            title: 'Aso-Oke Fila Caps',
            subtitle: 'Traditional Royal Headwear',
            image: '/images/products/Cap1.png',
            link: '/shop?gender=men&category=fila',
          },
          {
            id: 'n-shoes',
            title: 'Handcrafted Footwear',
            subtitle: 'Artisanal Calfskin Slides',
            image: '/images/products/UnisexSlides.jpg',
            link: '/shop?gender=men&category=slides',
          },
        ];

      case 'footwear':
        return [
          {
            id: 'f-slides',
            title: 'Handcrafted Slides',
            subtitle: 'Full-Grain Calfskin',
            image: '/images/products/UnisexSlides.jpg',
            link: '/shop?category=slides',
          },
          {
            id: 'f-mules',
            title: 'Artisanal Smart Mules',
            subtitle: 'Modern Slip-On Silhouette',
            image: '/images/products/BlackSmartShoes.jpg',
            link: '/shop?category=loafers',
          },
          {
            id: 'f-palms',
            title: 'Double-Strap Palms',
            subtitle: 'Everyday Luxury Comfort',
            image: '/images/products/AdiletteAquaSlides.jpg',
            link: '/shop?category=slides',
          },
          {
            id: 'f-shoes',
            title: 'Bespoke Dress Shoes',
            subtitle: 'Hand-Burnished Leather',
            image: '/images/products/BlackSmartShoes2.jpg',
            link: '/shop?category=loafers',
          },
        ];

      case 'men':
      default:
        return [
          {
            id: 'm-native',
            title: 'Native & Agbada',
            subtitle: 'Senators & 3-Piece Sets',
            image: '/images/products/BlackAgbada.jpg',
            link: '/shop?gender=men&department=native',
          },
          {
            id: 'm-street',
            title: 'Streetwear Sets',
            subtitle: '480GSM Heavy Hoodies',
            image: '/images/products/BlackTrapStarHoodie.jpg',
            link: '/shop?gender=men&category=hoodies',
          },
          {
            id: 'm-pants',
            title: 'Pants & Cargo',
            subtitle: 'Bespoke Trousers & Denim',
            image: '/images/uploaded/pantsandcargo.jpeg',
            link: '/shop?gender=men&category=jeans',
          },
          {
            id: 'm-tees',
            title: 'T-Shirts & Graphic Tees',
            subtitle: 'Heavyweight Graphic Prints',
            image: '/images/uploaded/t-shirtsandgraphic.jpeg',
            link: '/shop?gender=men&category=tshirts',
          },
          {
            id: 'm-polos',
            title: 'Luxury Polos & Shirts',
            subtitle: 'Tailored Knit & Silk Polos',
            image: '/images/uploaded/poloandshirt.jpeg',
            link: '/shop?gender=men&category=polos',
          },
          {
            id: 'm-shorts',
            title: 'Shorts & Sweatsets',
            subtitle: 'Mesh Court & Tailored Linen',
            image: '/images/uploaded/short.jpeg',
            link: '/shop?gender=men&category=shorts',
          },
          {
            id: 'm-shoes',
            title: 'Leather Footwear',
            subtitle: 'Handcrafted Slides & Mules',
            image: '/images/products/UnisexSlides.jpg',
            link: '/shop?gender=men&department=footwear',
          },
          {
            id: 'm-caps',
            title: 'Caps & Fila',
            subtitle: 'Aso-Oke & Street Caps',
            image: '/images/products/Cap1.png',
            link: '/shop?gender=men&category=caps',
          },
          {
            id: 'm-accessories',
            title: 'Leather Bags & Accents',
            subtitle: 'Crossbodies & Weekend Bags',
            image: '/images/uploaded/leaderBags.jpeg',
            link: '/shop?gender=men&department=bags',
          },
        ];
    }
  }, [activeTab]);

  // Dynamic Hero Slideshow by Tab (Consistent Outfits across Categories)
  const heroSlides = useMemo(() => {
    switch (activeTab) {
      case 'women':
        return [
          {
            id: 'w-slide-1',
            tag: 'RUNWAY COUTURE',
            title: 'CORSETED GOWNS & LACE',
            subtitle: 'SPRING / SUMMER RUNWAY EDIT',
            highlight: 'BESPOKE TAILORED SILHOUETTES',
            image: '/images/editorial/nigerian_female_couture.jpg',
            link: '/shop?gender=women&category=dresses',
          },
          {
            id: 'w-slide-2',
            tag: 'STREET ARCHIVE',
            title: 'OVERSIZED HOODIES & CARGO',
            subtitle: 'STREETWEAR CAPSULE COLLECTION',
            highlight: 'HEAVYWEIGHT RELAXED FITS',
            image: '/images/uploaded/Oversizedhoodie&cargo.jpeg',
            link: '/shop?gender=women&department=clothing',
          },
          {
            id: 'w-slide-3',
            tag: 'RESORT SILK',
            title: 'FLUID SILK BOUBOU',
            subtitle: 'HAND-STONED LUXURY ROBES',
            highlight: 'EFFORTLESS ELEGANCE',
            image: '/images/editorial/female_dress.jpg',
            link: '/shop?gender=women&category=boubou',
          },
          {
            id: 'w-slide-4',
            tag: 'SILK ESSENTIALS',
            title: 'LUXURY LOUNGEWEAR SETS',
            subtitle: 'PURE MULBERRY SILK & LACE',
            highlight: 'CHIC AT-HOME COMFORT',
            image: '/images/products/women_loungewear_luxury.jpg',
            link: '/shop?gender=women&category=women-loungewear',
          },
        ];

      case 'streetwear':
        return [
          {
            id: 's-slide-1',
            tag: 'STREET ARCHIVE',
            title: '480GSM FLEECE HOODIES',
            subtitle: 'LIMITED WORKSHOP RELEASE',
            highlight: 'DOUBLE-LAYERED HOOD & BOXY CUT',
            image: '/images/products/BlackTrapStarHoodie.jpg',
            link: '/shop?category=hoodies',
          },
          {
            id: 's-slide-2',
            tag: 'VINTAGE DENIM',
            title: 'RELAXED BAGGY CARGO',
            subtitle: 'HEAVYWEIGHT VINTAGE WASH',
            highlight: 'WIDE-LEG STACKED SILHOUETTES',
            image: '/images/products/BaggyJean.jpg',
            link: '/shop?category=jeans',
          },
          {
            id: 's-slide-3',
            tag: 'URBAN RUNNER',
            title: 'STREET LOW-TOPS & TRAINERS',
            subtitle: 'LIMITED DROP SNEAKERS',
            highlight: 'CUSHIONED PLATFORM SOLES',
            image: '/images/products/AddidasShoeUnisex.jpg',
            link: '/shop?category=sneakers',
          },
        ];

      case 'native':
        return [
          {
            id: 'n-slide-1',
            tag: 'CEREMONIAL HERITAGE',
            title: 'ROYAL 3-PIECE AGBADA',
            subtitle: 'BESPOKE NIGERIAN MONARCH EDIT',
            highlight: 'INTRICATE HAND-EMBROIDERED ROBES',
            image: '/images/products/BlackAgbada.jpg',
            link: '/shop?gender=men&category=agbada',
          },
          {
            id: 'n-slide-2',
            tag: 'BESPOKE SUITING',
            title: 'TAILORED SENATOR SETS',
            subtitle: 'GEOMETRIC PLACKETS & MODERN WOOL',
            highlight: 'SHARP ARCHITECTURAL CUTS',
            image: '/images/products/BlackSenator.jpg',
            link: '/shop?gender=men&category=senator',
          },
          {
            id: 'n-slide-3',
            tag: 'ROYAL HEADWEAR',
            title: 'HAND-LOOMED FILA CAPS',
            subtitle: 'ASO-OKE & VELVET FINISH',
            highlight: 'TRADITIONAL STATEMENT HEADPIECES',
            image: '/images/products/Cap1.png',
            link: '/shop?category=fila',
          },
        ];

      case 'footwear':
        return [
          {
            id: 'f-slide-1',
            tag: 'ARTISANAL LEATHER',
            title: 'HANDCRAFTED CALFSKIN SLIDES',
            subtitle: 'FULL-GRAIN KANO LEATHER',
            highlight: 'ERGONOMIC MOULDED FOOTBED',
            image: '/images/products/UnisexSlides.jpg',
            link: '/shop?department=footwear',
          },
          {
            id: 'f-slide-2',
            tag: 'BESPOKE DRESS',
            title: 'SMART MULES & LOAFERS',
            subtitle: 'HAND-BURNISHED CALFSKIN',
            highlight: 'SLIP-ON LUXURY SILHOUETTES',
            image: '/images/products/BlackSmartShoes.jpg',
            link: '/shop?category=loafers',
          },
        ];

      case 'men':
      default:
        return [
          {
            id: 'm-slide-1',
            tag: 'NATIVE & CEREMONIAL',
            title: 'ROYAL 3-PIECE AGBADA',
            subtitle: 'HAND-TAILORED NIGERIAN LUXURY',
            highlight: 'EMBROIDERED CEREMONIAL ROBES',
            image: '/images/products/BlackAgbada.jpg',
            link: '/shop?gender=men&category=agbada',
          },
          {
            id: 'm-slide-2',
            tag: 'STREET ARCHIVE',
            title: '480GSM HEAVY HOODIES',
            subtitle: 'BOXY URBAN STREETWEAR',
            highlight: 'HEAVYWEIGHT CUSTOM FLEECE',
            image: '/images/products/BlackTrapStarHoodie.jpg',
            link: '/shop?gender=men&category=hoodies',
          },
          {
            id: 'm-slide-3',
            tag: 'BESPOKE SENATOR',
            title: 'TAILORED SENATOR SUITS',
            subtitle: 'SHARP GEOMETRIC PLACKETS',
            highlight: 'PURE WOOL KAFTAN SETS',
            image: '/images/products/BlackSenator.jpg',
            link: '/shop?gender=men&category=senator',
          },
          {
            id: 'm-slide-4',
            tag: 'HANDMADE LEATHER',
            title: 'CALFSKIN SLIDES & FOOTWEAR',
            subtitle: 'KANO ARTISANAL WORKSHOP',
            highlight: 'FULL-GRAIN LUXURY LEATHER',
            image: '/images/products/UnisexSlides.jpg',
            link: '/shop?gender=men&department=footwear',
          },
        ];
    }
  }, [activeTab]);

  // Slideshow active slide index with auto-rotation
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [activeTab]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Dynamic Occasions Showcase (Strictly matches activeTab gender!)
  const occasions = useMemo(() => {
    if (activeTab === 'women') {
      return [
        {
          title: 'Grand Owambe & Soirée',
          sub: 'Luxury Aso-Ebi, Corseted Gowns & Silk Robes',
          image: '/images/editorial/nigerian_female_couture.jpg',
          link: '/shop?gender=women&department=native',
        },
        {
          title: 'Midnight Underground',
          sub: 'Street Cropped Hoodies, Wide Denim & Sets',
          image: '/images/uploaded/Oversizedhoodie&cargo.jpeg',
          link: '/shop?gender=women&department=clothing',
        },
        {
          title: 'Artisanal Weekend & Resort',
          sub: 'Flowing Silk Boubou, Mules & Chic Handbags',
          image: '/images/uploaded/LeaderbagsWomen.jpeg',
          link: '/shop?gender=women&category=boubou',
        },
      ];
    }

    return [
      {
        title: 'The Grand Owambe',
        sub: 'Ceremonial Agbada, Senators & Velvet Fila',
        image: '/images/editorial/nigerian_male_couture.jpg',
        link: '/shop?gender=men&category=agbada',
      },
      {
        title: 'Midnight Underground',
        sub: '480GSM Boxy Hoodies, Cargo & Heavy Sweats',
        image: '/images/editorial/modern_male_streetwear.jpg',
        link: '/shop?gender=men&category=hoodies',
      },
      {
        title: 'Artisanal Weekend',
        sub: 'Full-Grain Leather Slides & Casual Sets',
        image: '/images/products/UnisexSlides.jpg',
        link: '/shop?gender=men&category=slides',
      },
    ];
  }, [activeTab]);

  // Featured Independent Ateliers
  const featuredAteliers = [
    {
      id: 'at-1',
      name: 'Atelier Sovereign',
      origin: 'Lagos',
      focus: 'Bespoke Ceremonial Agbada',
      image: '/images/products/BlackAgbada.jpg',
    },
    {
      id: 'at-2',
      name: 'Urban Archive',
      origin: 'Yaba',
      focus: '480GSM Heavyweight Streetwear',
      image: '/images/products/BlackTrapStarHoodie.jpg',
    },
    {
      id: 'at-3',
      name: 'Kano Leather Studio',
      origin: 'Kano',
      focus: 'Handcrafted Calfskin Footwear',
      image: '/images/products/UnisexSlides.jpg',
    },
  ];

  // Reactive Product Filtering (Strictly adhering to active tab)
  const productsList = useMemo(() => {
    let list = allProducts && allProducts.length > 0 ? [...allProducts] : [];

    // Fallback seed pieces if DB products not loaded yet
    if (list.length === 0) {
      list = [
        {
          id: 'p-1',
          name: 'Imperial Obsidian Grand Agbada',
          price: 95000,
          vendorName: 'Atelier Sovereign',
          category: 'tops',
          genderTarget: 'male',
          imageUrl: '/images/products/BlackAgbada.jpg',
          stockQuantity: 5,
        } as any,
        {
          id: 'p-2',
          name: '480GSM TrapStar Heavyweight Hoodie',
          price: 42000,
          vendorName: 'Urban Archive',
          category: 'outerwear',
          genderTarget: 'unisex',
          imageUrl: '/images/products/BlackTrapStarHoodie.jpg',
          stockQuantity: 12,
        } as any,
        {
          id: 'p-3',
          name: 'Handcrafted Double-Strap Leather Slides',
          price: 32000,
          vendorName: 'Kano Leather Studio',
          category: 'footwear',
          genderTarget: 'unisex',
          imageUrl: '/images/products/UnisexSlides.jpg',
          stockQuantity: 8,
        } as any,
        {
          id: 'p-4',
          name: 'Midnight Senator Native 2-Piece Suit',
          price: 68000,
          vendorName: 'Atelier Sovereign',
          category: 'tops',
          genderTarget: 'male',
          imageUrl: '/images/products/BlackSenator.jpg',
          stockQuantity: 6,
        } as any,
        {
          id: 'p-5',
          name: 'Relaxed Wide-Leg Baggy Denim Jeans',
          price: 29000,
          vendorName: 'Urban Archive',
          category: 'bottoms',
          genderTarget: 'unisex',
          imageUrl: '/images/products/BaggyJean.jpg',
          stockQuantity: 15,
        } as any,
        {
          id: 'p-6',
          name: 'Hand-Embroidered Velvet Fila Cap',
          price: 18000,
          vendorName: 'Heritage Ateliers',
          category: 'accessories',
          genderTarget: 'male',
          imageUrl: '/images/products/Cap1.png',
          stockQuantity: 20,
        } as any,
        {
          id: 'p-7',
          name: 'Silk Adire Statement Kimono Robe',
          price: 54000,
          vendorName: 'Femme Atelier',
          category: 'tops',
          genderTarget: 'female',
          imageUrl: '/images/editorial/female_dress.jpg',
          stockQuantity: 7,
        } as any,
        {
          id: 'p-8',
          name: 'Handcrafted Structured Leather Shoulder Bag',
          price: 48000,
          vendorName: 'Kano Leather Studio',
          category: 'accessories',
          genderTarget: 'female',
          imageUrl: '/images/uploaded/LeaderbagsWomen.jpeg',
          stockQuantity: 4,
        } as any,
      ];
    }

    // 1. Filter by Active Tab
    if (activeTab === 'men') {
      list = list.filter(p => p.genderTarget === 'male' || p.genderTarget === 'unisex' || !p.genderTarget);
    } else if (activeTab === 'women') {
      list = list.filter(p => p.genderTarget === 'female' || p.genderTarget === 'unisex');
    } else if (activeTab === 'streetwear') {
      list = list.filter(p => {
        const n = (p.name || '').toLowerCase();
        return (p.category as string) === 'outerwear' || n.includes('hoodie') || n.includes('street') || n.includes('trapstar') || n.includes('cargo') || n.includes('jean');
      });
    } else if (activeTab === 'native') {
      list = list.filter(p => {
        const n = (p.name || '').toLowerCase();
        return n.includes('agbada') || n.includes('senator') || n.includes('native') || n.includes('fila') || n.includes('kaftan');
      });
    } else if (activeTab === 'footwear') {
      list = list.filter(p => (p.category as string) === 'footwear');
    }

    // 2. Filter by search query if present
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.vendorName?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allProducts, activeTab, searchQuery]);

  // Cap trending drops to top 6 (NEVER 30 items)
  const trendingPieces = useMemo(() => productsList.slice(0, 6), [productsList]);

  // Recently Viewed Pieces (stored in localStorage or curated fallback)
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('irisi_recently_viewed');
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        if (Array.isArray(ids) && ids.length > 0 && allProducts && allProducts.length > 0) {
          const matched = ids
            .map((id) => allProducts.find((p) => String(p.id) === String(id)))
            .filter(Boolean);
          if (matched.length > 0) {
            setRecentlyViewed(matched.slice(0, 6));
            return;
          }
        }
      }
    } catch (e) {}

    if (productsList && productsList.length > 0) {
      setRecentlyViewed(productsList.slice(0, 4));
    }
  }, [allProducts, productsList]);

  return (
    <div className="md:hidden pb-16 bg-white dark:bg-[#0A0A0C] text-black dark:text-white min-h-screen">

      {/* ── 1. HEADER: ÌRÍSÍ LOGO + WORDMARK + FOR YOU + THEME TOGGLE ── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#0A0A0C] border-b border-neutral-200 dark:border-neutral-800">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Logo Icon + Brand Wordmark */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shrink-0 bg-black shadow-sm">
              <Image
                src="/images/logo/irisi-icon.png"
                alt="ÌRÍSÍ"
                width={36}
                height={36}
                priority
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-sans font-black text-[25px] tracking-tight uppercase text-black dark:text-white leading-none">
              ÌRÍSÍ
            </span>
          </Link>

          {/* Right Actions: Categories Directory + Theme Toggle */}
          <div className="flex items-center gap-2">
            <Link
              href="/categories"
              className="flex items-center gap-1 px-3 py-1 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Categories</span>
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              suppressHydrationWarning
              className="p-1.5 rounded-full text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white cursor-pointer"
              aria-label="Toggle theme"
            >
              {mounted && theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* ── 2. DIVISION TABS (MEN, WOMEN, STREETWEAR, NATIVE...) ── */}
        <nav className="flex items-center justify-between px-4 border-t border-neutral-100 dark:border-neutral-900 overflow-x-auto no-scrollbar">
          {[
            { id: 'men', label: 'MEN' },
            { id: 'women', label: 'WOMEN' },
            { id: 'streetwear', label: 'STREETWEAR' },
            { id: 'native', label: 'NATIVE' },
            { id: 'footwear', label: 'FOOTWEAR' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-2 text-[12px] font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-neutral-500 hover:text-black dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* ── 3. SEARCH BAR (CLEAN PILL INPUT) ──────────────────── */}
        <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder={`Search within ${activeTab.toUpperCase()} clothing...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-xs text-black dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-black dark:focus:border-white shadow-sm"
            />
            <div className="absolute right-3 text-neutral-400">
              <Camera className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      {/* ── 4. FULL-BLEED EDGE-TO-EDGE HERO BANNER (ROTATING SLIDESHOW) ── */}
      <section className="relative w-full aspect-[4/5] max-h-[520px] bg-black overflow-hidden select-none">
        {heroSlides.map((slide, idx) => {
          const isActive = idx === currentSlideIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                unoptimized
                priority={idx === 0}
                className="object-cover opacity-85 scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/15" />

              <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 px-4 text-center z-10 space-y-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[9px] font-mono tracking-widest uppercase font-bold border border-white/20">
                  {slide.tag}
                </span>

                <span className="text-[11px] font-mono tracking-widest text-neutral-300 uppercase font-semibold">
                  {slide.subtitle}
                </span>

                <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight leading-none drop-shadow-md">
                  {slide.title}
                </h1>

                <p className="text-xs font-mono font-bold tracking-widest text-amber-300 uppercase">
                  {slide.highlight}
                </p>

                <div className="pt-2">
                  <Link
                    href={slide.link}
                    className="inline-block px-6 py-2 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-amber-300 transition-colors shadow-lg active:scale-95"
                  >
                    SHOP THIS DROP →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {/* Slideshow Indicator Dots / Bars */}
        <div className="absolute bottom-3 left-0 right-0 z-20 flex items-center justify-center gap-1.5">
          {heroSlides.map((_, dotIdx) => (
            <button
              key={`dot-${dotIdx}`}
              type="button"
              onClick={() => setCurrentSlideIndex(dotIdx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlideIndex === dotIdx
                  ? 'w-6 bg-amber-400 shadow-sm'
                  : 'w-1.5 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Slide ${dotIdx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── 5. SECONDARY HIGH-CONTRAST ANNOUNCEMENT BAR ──────── */}
      <section className="bg-black text-white px-4 py-3 border-y border-neutral-800 flex items-center justify-between">
        <div className="text-left">
          <span className="text-[11px] font-black uppercase tracking-wider block leading-none">
            NEW ATELIER DROPS · READY TO SHIP
          </span>
          <span className="text-[9px] text-neutral-400 tracking-tight">
            Direct courier dispatch & park waybill across states
          </span>
        </div>

        <Link
          href="/shop"
          className="flex items-center gap-0.5 text-[11px] font-black uppercase tracking-wider text-white hover:text-amber-300 transition-colors shrink-0"
        >
          <span>SHOP NOW</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      {/* ── 6. SHOP BY CATEGORY (DYNAMICALLY FILTERED BY TAB) ─── */}
      <section className="px-4 pt-8 space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <h2 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
            Shop by Category · {activeTab.toUpperCase()}
          </h2>
          <Link
            href="/categories"
            className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase hover:text-black dark:hover:text-white flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Dynamic Category Visual Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {categoriesByTab.map((cat) => (
            <Link
              key={cat.id}
              href={cat.link}
              className="relative aspect-[4/5] rounded-xl overflow-hidden bg-black group border border-neutral-200 dark:border-neutral-800"
            >
              <Image
                src={cat.image}
                alt={cat.title}
                fill
                unoptimized
                className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

              <div className="absolute bottom-3 inset-x-3 text-left z-10">
                <h3 className="text-xs font-black uppercase text-white leading-tight drop-shadow-sm">
                  {cat.title}
                </h3>
                <span className="text-[9px] font-medium text-neutral-300 block truncate drop-shadow-sm mt-0.5">
                  {cat.subtitle}
                </span>
                <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider block mt-1">
                  Shop Now →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 7. TRENDING DROPS (CAPPED AT 6 PIECES ONLY) ───────── */}
      <section className="px-4 pt-10 space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
              Trending Drops
            </h2>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
              Curated Editor&apos;s Selection
            </span>
          </div>
          <Link
            href="/shop"
            className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase hover:text-black dark:hover:text-white"
          >
            View All ({productsList.length}) →
          </Link>
        </div>

        {/* 2-Column Grid (Top 6 Items Only) */}
        <div className="grid grid-cols-2 gap-2.5">
          {trendingPieces.map((product) => {
            const isFav = isInVault(product.id);
            const imageSrc = product.imageUrl || (Array.isArray(product.images) && product.images[0]) || '/images/products/BlackTrapStarHoodie.jpg';

            return (
              <div
                key={product.id}
                className="flex flex-col group border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-[#111113]"
              >
                {/* Product Image (Portrait 3:4) */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                  <Link href={`/shop/${product.id}`} className="block h-full w-full relative">
                    <Image
                      src={imageSrc}
                      alt={product.name}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Wishlist Heart Top-Right */}
                  <button
                    type="button"
                    onClick={() => toggleVaultItem(product)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm text-black dark:text-white hover:opacity-80 active:scale-90 transition-all cursor-pointer z-10"
                    aria-label="Wishlist"
                  >
                    <Heart
                      strokeWidth={1.5}
                      className={`h-4 w-4 ${
                        isFav ? 'fill-rose-500 text-rose-500' : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    />
                  </button>

                  {/* 1-Tap Quick Add */}
                  <button
                    type="button"
                    onClick={() => setQuickBuyProduct(product)}
                    className="absolute bottom-2 inset-x-2 py-1.5 rounded bg-black/90 dark:bg-white/90 text-white dark:text-black text-[10px] font-bold uppercase tracking-wider text-center opacity-90 hover:opacity-100 active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    Quick Add +
                  </button>
                </div>

                {/* Meta */}
                <Link href={`/shop/${product.id}`} className="p-2.5 flex flex-col flex-1 justify-between gap-1">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block truncate">
                      {product.vendorName || 'Atelier'}
                    </span>
                    <h3 className="text-xs font-semibold text-black dark:text-white line-clamp-1 mt-0.5">
                      {product.name}
                    </h3>
                  </div>

                  <div className="pt-1 flex items-baseline justify-between">
                    <span className="text-xs font-black text-black dark:text-white">
                      ₦{Number(product.price || 0).toLocaleString()}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* View All Button */}
        {productsList.length > 6 && (
          <div className="pt-2">
            <Link
              href="/shop"
              className="w-full py-3 rounded-full border border-black dark:border-white text-black dark:text-white text-xs font-black uppercase tracking-wider text-center block hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            >
              View All {productsList.length} Drops in Shop
            </Link>
          </div>
        )}
      </section>

      {/* ── 8. CURATED BY OCCASION (EDITORIAL LIFESTYLE) ──────── */}
      <section className="px-4 pt-12 space-y-3">
        <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <h2 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
            Curated by Occasion
          </h2>
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
            Head-to-Toe Nigerian Fashion Edits
          </span>
        </div>

        <div className="space-y-3">
          {occasions.map((occ, i) => (
            <Link
              key={i}
              href={occ.link}
              className="relative h-44 rounded-2xl overflow-hidden bg-black block group border border-neutral-200 dark:border-neutral-800"
            >
              <Image
                src={occ.image}
                alt={occ.title}
                fill
                unoptimized
                className="object-cover opacity-75 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              <div className="absolute bottom-4 inset-x-4 z-10 flex items-end justify-between">
                <div>
                  <h3 className="text-base font-black uppercase text-white leading-tight drop-shadow-md">
                    {occ.title}
                  </h3>
                  <p className="text-[11px] text-neutral-300 mt-0.5 drop-shadow-sm font-light">
                    {occ.sub}
                  </p>
                </div>
                <span className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 9. FEATURED INDEPENDENT BRANDS & STORES ───────────── */}
      <section className="pt-12 space-y-3">
        <div className="px-4 border-b border-neutral-200 dark:border-neutral-800 pb-2 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
              Featured Brands & Stores
            </h2>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
              Verified Independent Nigerian Fashion Brands
            </span>
          </div>
          <Link href="/vendors" className="text-[11px] font-bold text-neutral-500 uppercase hover:text-black dark:hover:text-white flex items-center gap-0.5">
            <span>All Brands</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="flex items-stretch gap-3 overflow-x-auto px-4 no-scrollbar pb-2">
          {featuredAteliers.map((atelier) => (
            <div
              key={atelier.id}
              className="w-60 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 shrink-0 flex flex-col justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-black shrink-0 border border-neutral-200 dark:border-neutral-800">
                  <Image
                    src={atelier.image}
                    alt={atelier.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-black dark:text-white truncate">
                    {atelier.name}
                  </h4>
                  <span className="text-[10px] text-neutral-500 block truncate">
                    {atelier.origin}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed font-light">
                {atelier.focus}
              </p>

              <Link
                href="/vendors"
                className="w-full py-2 rounded border border-neutral-300 dark:border-neutral-700 text-center text-[10px] font-black uppercase tracking-wider text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              >
                Visit Brand Store
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── 10. RECENTLY VIEWED PIECES (FINAL SECTION) ─────────── */}
      {recentlyViewed.length > 0 && (
        <section className="px-4 pt-8 pb-3 space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                Recently Viewed
              </h2>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                Continue Browsing Pieces You Explored
              </span>
            </div>
            <Link
              href="/shop"
              className="text-[11px] font-bold text-neutral-500 uppercase hover:text-black dark:hover:text-white"
            >
              Shop All →
            </Link>
          </div>

          <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar pb-2">
            {recentlyViewed.map((item) => {
              const imageSrc = item.imageUrl || (Array.isArray(item.images) && item.images[0]) || '/images/products/BlackTrapStarHoodie.jpg';
              return (
                <div
                  key={`recent-${item.id}`}
                  className="w-36 shrink-0 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111113] flex flex-col"
                >
                  <Link href={`/shop/${item.id}`} className="relative aspect-[3/4] w-full block bg-neutral-100 dark:bg-neutral-900">
                    <Image
                      src={imageSrc}
                      alt={item.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </Link>
                  <div className="p-2 flex flex-col justify-between flex-1 gap-1">
                    <div>
                      <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-400 block truncate">
                        {item.vendorName || 'Brand'}
                      </span>
                      <h4 className="text-[11px] font-semibold text-black dark:text-white line-clamp-1">
                        {item.name}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[11px] font-black text-black dark:text-white">
                        ₦{Number(item.price || 0).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuickBuyProduct(item)}
                        className="p-1 rounded bg-black dark:bg-white text-white dark:text-black text-[9px] font-bold cursor-pointer hover:opacity-80 active:scale-95"
                        title="Quick Add"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick Buy Drawer */}
      {quickBuyProduct && (
        <MobileQuickBuyDrawer
          product={quickBuyProduct}
          onClose={() => setQuickBuyProduct(null)}
        />
      )}

    </div>
  );
}
