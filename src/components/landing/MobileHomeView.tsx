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
            title: 'Dresses & Gowns',
            subtitle: 'Evening Gowns & Bodycons',
            image: '/images/categories/dressesforwomen.jpeg',
            link: '/shop?gender=women&category=dresses',
          },
          {
            id: 'w-coord',
            title: 'Two-Piece Sets',
            subtitle: 'Matching Co-ords & Sets',
            image: '/images/categories/women_coord.jpg',
            link: '/shop?gender=women&category=two-piece',
          },
          {
            id: 'w-tops',
            title: 'Tops & Corset',
            subtitle: 'Corsets, Tops & Blouses',
            image: '/images/uploaded/Streetwear&topsWomen.jpeg',
            link: '/shop?gender=women&category=tops',
          },
          {
            id: 'w-jeans',
            title: 'Jeans & Cargo',
            subtitle: 'Wide-Leg Denim & Cargo',
            image: '/images/categories/jeanforwomen.jpeg',
            link: '/shop?gender=women&category=women-jeans',
          },
          {
            id: 'w-skirts',
            title: 'Skirts & Minis',
            subtitle: 'Pleated Minis & Midis',
            image: '/images/categories/skirtandminishirts.jpeg',
            link: '/shop?gender=women&category=skirts',
          },
          {
            id: 'w-boubou',
            title: 'Boubou & Kaftans',
            subtitle: 'Adire Silk & Flowing Robes',
            image: '/images/editorial/nigerian_female_couture.jpg',
            link: '/shop?gender=women&category=boubou',
          },
          {
            id: 'w-abaya',
            title: 'Abaya & Kimonos',
            subtitle: 'Flowing Abayas & Modest Robes',
            image: '/images/editorial/female_dress.jpg',
            link: '/shop?gender=women&category=abayas',
          },
          {
            id: 'w-heels',
            title: 'Heels & Pumps',
            subtitle: 'Stilettos, Blocks & Mules',
            image: '/images/categories/women_heels.jpg',
            link: '/shop?gender=women&category=heels',
          },
          {
            id: 'w-crocs',
            title: 'Crocs & Casual Slides',
            subtitle: 'Platform Crocs & Slides',
            image: '/images/categories/crocs_women.jpg',
            link: '/shop?gender=women&category=clogs',
          },
          {
            id: 'w-bags',
            title: 'Handbags & Totes',
            subtitle: 'Shoulder Bags & Clutches',
            image: '/images/uploaded/LeaderbagsWomen.jpeg',
            link: '/shop?gender=women&department=bags',
          },
          {
            id: 'w-clutches',
            title: 'Clutches & Mini Bags',
            subtitle: 'Evening Clutches & Handbags',
            image: '/images/categories/women_clutches.jpg',
            link: '/shop?gender=women&category=clutches',
          },
          {
            id: 'w-jewelry',
            title: 'Jewelry',
            subtitle: 'Necklaces, Rings & Wristwear',
            image: '/images/uploaded/WomenJewelry.jpeg',
            link: '/shop?gender=women&category=jewelry',
          },
          {
            id: 'w-slides',
            title: 'Slides & Flats',
            subtitle: 'Comfortable Slides & Flats',
            image: '/images/uploaded/footwear&slideswomen.jpeg',
            link: '/shop?gender=women&category=women-slides',
          },
        ];

      case 'streetwear':
        return [
          {
            id: 's-hoodies',
            title: 'Hoodies & Sweats',
            subtitle: 'Heavyweight Boxy Hoodies',
            image: '/images/products/BlackTrapStarHoodie.jpg',
            link: '/shop?gender=men&category=hoodies',
          },
          {
            id: 's-cargo',
            title: 'Cargo Pants & Sweats',
            subtitle: 'Multi-Pocket Tactical Pants',
            image: '/images/uploaded/pantsandcargo.jpeg',
            link: '/shop?gender=men&category=cargo',
          },
          {
            id: 's-denim',
            title: 'Jeans & Denim',
            subtitle: 'Baggy & Straight Cut Jeans',
            image: '/images/products/BaggyJean.jpg',
            link: '/shop?gender=men&category=jeans',
          },
          {
            id: 's-tees',
            title: 'Graphic Tees & Tops',
            subtitle: 'Oversized Street Prints',
            image: '/images/uploaded/t-shirtsandgraphic.jpeg',
            link: '/shop?gender=men&category=tshirts',
          },
          {
            id: 's-shorts',
            title: 'Tactical Shorts',
            subtitle: 'Multi-Pocket Utility Shorts',
            image: '/images/uploaded/short.jpeg',
            link: '/shop?gender=men&category=shorts',
          },
          {
            id: 's-sneakers',
            title: 'Street Shoes & Canvas',
            subtitle: 'Retro Trainers & Low-Tops',
            image: '/images/products/AddidasShoeUnisex.jpg',
            link: '/shop?category=sneakers',
          },
          {
            id: 's-caps',
            title: 'Caps & Beanies',
            subtitle: 'Street Caps & Beanies',
            image: '/images/uploaded/capshatbeanies.jpeg',
            link: '/shop?gender=men&category=caps',
          },
          {
            id: 's-slides',
            title: 'Slides & Slip-Ons',
            subtitle: 'Casual Comfort Slides',
            image: '/images/products/UnisexSlides.jpg',
            link: '/shop?category=slides',
          },
        ];

      case 'native':
        return [
          {
            id: 'n-agbada',
            title: '3-Piece Agbada',
            subtitle: 'Embroidered Native Robes',
            image: '/images/products/BlackAgbada.jpg',
            link: '/shop?gender=men&category=agbada',
          },
          {
            id: 'n-senator',
            title: 'Senator Sets & Kaftans',
            subtitle: 'Tailored Native 2-Piece',
            image: '/images/products/BlackSenator.jpg',
            link: '/shop?gender=men&category=senator',
          },
          {
            id: 'n-fila',
            title: 'Native Caps (Fila)',
            subtitle: 'Traditional Aso-Oke Caps',
            image: '/images/products/Cap1.png',
            link: '/shop?gender=men&category=fila',
          },
          {
            id: 'n-shoes',
            title: 'Native Leather Shoes',
            subtitle: 'Traditional Leather Slides',
            image: '/images/products/UnisexSlides.jpg',
            link: '/shop?gender=men&category=slides',
          },
        ];

      case 'footwear':
        return [
          {
            id: 'f-slides',
            title: 'Leather Slides',
            subtitle: 'Handcrafted Casual Slides',
            image: '/images/products/UnisexSlides.jpg',
            link: '/shop?category=slides',
          },
          {
            id: 'f-crocs',
            title: 'Crocs & Foam Clogs',
            subtitle: 'Platform Foam Slip-Ons',
            image: '/images/categories/crocs_men.jpg',
            link: '/shop?category=clogs',
          },
          {
            id: 'f-sneakers',
            title: 'Street Shoes & Canvas',
            subtitle: 'Casual Sneakers & Runners',
            image: '/images/products/AddidasShoeUnisex.jpg',
            link: '/shop?category=sneakers',
          },
          {
            id: 'f-mules',
            title: 'Mules & Loafers',
            subtitle: 'Smart Slip-On Shoes',
            image: '/images/products/BlackSmartShoes.jpg',
            link: '/shop?category=loafers',
          },
          {
            id: 'f-palms',
            title: 'Palm Slippers',
            subtitle: 'Everyday Leather Palms',
            image: '/images/products/AdiletteAquaSlides.jpg',
            link: '/shop?category=slides',
          },
          {
            id: 'f-shoes',
            title: 'Dress & Formal Shoes',
            subtitle: 'Oxford & Derby Leather Shoes',
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
            subtitle: 'Senators & 3-Piece Agbada',
            image: '/images/products/BlackAgbada.jpg',
            link: '/shop?gender=men&department=native',
          },
          {
            id: 'm-street',
            title: 'Streetwear & Hoodies',
            subtitle: 'Heavy Hoodies & Sweats',
            image: '/images/products/BlackTrapStarHoodie.jpg',
            link: '/shop?gender=men&category=hoodies',
          },
          {
            id: 'm-shoes',
            title: 'Shoes & Footwear',
            subtitle: 'Slides, Loafers & Sneakers',
            image: '/images/products/UnisexSlides.jpg',
            link: '/shop?gender=men&department=footwear',
          },
          {
            id: 'm-tees',
            title: 'T-Shirts & Polos',
            subtitle: 'Graphic Tees & Polos',
            image: '/images/uploaded/t-shirtsandgraphic.jpeg',
            link: '/shop?gender=men&category=tshirts',
          },
          {
            id: 'm-accessories',
            title: 'Bags & Accessories',
            subtitle: 'Crossbodies & Weekend Bags',
            image: '/images/uploaded/leaderBags.jpeg',
            link: '/shop?gender=men&department=bags',
          },
          {
            id: 'm-jewelry',
            title: 'Jewelry & Watches',
            subtitle: 'Gold Chains, Rings & Watches',
            image: '/images/products/men_gold_chain.jpg',
            link: '/shop?gender=men&category=chains',
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
            id: 'w-slide-tops',
            tag: 'TOPS & CORSET',
            title: 'CORSETS & CASUAL TOPS',
            subtitle: 'STRUCTURED CORSETS & CHIC TOPS',
            highlight: 'DAY-TO-NIGHT STATEMENT FIT',
            image: '/images/uploaded/Streetwear&topsWomen.jpeg',
            link: '/shop?gender=women&category=tops',
          },
          {
            id: 'w-slide-jeans',
            tag: 'JEANS & CARGO',
            title: 'WIDE-LEG JEANS & CARGO PANTS',
            subtitle: 'HIGH-WAISTED DENIM & STREETWEAR',
            highlight: 'RELAXED & FLATTERING SILHOUETTES',
            image: '/images/categories/jeanforwomen.jpeg',
            link: '/shop?gender=women&category=women-jeans',
          },
          {
            id: 'w-slide-abaya',
            tag: 'ABAYA & KIMONOS',
            title: 'FLOWING ABAYAS & KIMONOS',
            subtitle: 'MODEST SILKS & EMBROIDERED ROBES',
            highlight: 'REGAL OCCASION & LUXURY COMFORT',
            image: '/images/editorial/female_dress.jpg',
            link: '/shop?gender=women&category=abayas',
          },
          {
            id: 'w-slide-heels',
            tag: 'HEELS & PUMPS',
            title: 'HEELS, PUMPS & ELEGANT MULES',
            subtitle: 'STILETTO HEELS & STRAPPY DRESS SANDALS',
            highlight: 'HEAD-TO-TOE OCCASION GLAMOUR',
            image: '/images/categories/women_heels.jpg',
            link: '/shop?gender=women&category=heels',
          },
          {
            id: 'w-slide-clutches',
            tag: 'CLUTCHES & MINI BAGS',
            title: 'LUXURY CLUTCHES & MINI BAGS',
            subtitle: 'EVENING CLUTCHES & STRUCTURED MINIS',
            highlight: 'STATEMENT LEATHER ACCESSORIES',
            image: '/images/categories/women_clutches.jpg',
            link: '/shop?gender=women&category=clutches',
          },
          {
            id: 'w-slide-jewelry',
            tag: 'JEWELRY',
            title: 'FINE JEWELRY & ACCENTS',
            subtitle: 'NECKLACES, RINGS & WRISTWEAR',
            highlight: 'ELEGANT FINISHING TOUCHES',
            image: '/images/uploaded/WomenJewelry.jpeg',
            link: '/shop?gender=women&category=jewelry',
          },
          {
            id: 'w-slide-coord',
            tag: 'TWO-PIECE SETS',
            title: 'MATCHING CO-ORD SETS',
            subtitle: 'MATCHING TOPS & TROUSERS',
            highlight: 'CHIC RESORT & BRUNCH WEAR',
            image: '/images/categories/women_coord.jpg',
            link: '/shop?gender=women&category=two-piece',
          },
          {
            id: 'w-slide-slides',
            tag: 'SLIDES & FLATS',
            title: 'COMFORT SLIDES & FLAT SLIPPERS',
            subtitle: 'CASUAL LEATHER SLIDES & FLATS',
            highlight: 'LIGHTWEIGHT EVERYDAY COMFORT',
            image: '/images/uploaded/footwear&slideswomen.jpeg',
            link: '/shop?gender=women&category=women-slides',
          },
        ];

      case 'streetwear':
        return [
          {
            id: 's-slide-1',
            tag: 'STREETWEAR',
            title: 'HOODIES & SWEATSHIRTS',
            subtitle: 'HEAVYWEIGHT FLEECE DROPS',
            highlight: 'OVERSIZED & BOXY CUTS',
            image: '/images/products/BlackTrapStarHoodie.jpg',
            link: '/shop?category=hoodies',
          },
          {
            id: 's-slide-2',
            tag: 'JEANS & CARGO',
            title: 'BAGGY JEANS & CARGO PANTS',
            subtitle: 'WIDE-LEG STREET STYLES',
            highlight: 'DURABLE URBAN DENIM',
            image: '/images/products/BaggyJean.jpg',
            link: '/shop?category=jeans',
          },
          {
            id: 's-slide-3',
            tag: 'GRAPHIC TEES',
            title: 'OVERSIZED GRAPHIC TEES',
            subtitle: 'VINTAGE WASH & STREET CUTS',
            highlight: 'HEAVYWEIGHT 240GSM COTTON',
            image: '/images/uploaded/t-shirtsandgraphic.jpeg',
            link: '/shop?category=tshirts',
          },
          {
            id: 's-slide-4',
            tag: 'TWO-PIECE SETS',
            title: 'OVERSIZED HOODIE & CARGO SETS',
            subtitle: 'MATCHING TWO-PIECE STREETWEAR',
            highlight: 'COORDINATED STREETWEAR FIT',
            image: '/images/uploaded/Oversizedhoodie&cargo.jpeg',
            link: '/shop?category=cargo',
          },
          {
            id: 's-slide-5',
            tag: 'CARGO SHORTS',
            title: 'TACTICAL UTILITY SHORTS',
            subtitle: 'MULTI-POCKET SUMMER DROPS',
            highlight: 'RELAXED STREETWEAR COMFORT',
            image: '/images/uploaded/short.jpeg',
            link: '/shop?category=shorts',
          },
          {
            id: 's-slide-6',
            tag: 'SNEAKERS & CANVAS',
            title: 'CANVAS & STREET SNEAKERS',
            subtitle: 'RETRO TRAINERS & PLATFORMS',
            highlight: 'CUSHIONED EVERYDAY COMFORT',
            image: '/images/products/AddidasShoeUnisex.jpg',
            link: '/shop?category=sneakers',
          },
          {
            id: 's-slide-7',
            tag: 'CAPS & BEANIES',
            title: 'STREET TRUCKERS & BEANIES',
            subtitle: 'STRUCTURED STREETWEAR HEADWEAR',
            highlight: 'EMBROIDERED ACCENTS',
            image: '/images/uploaded/capshatbeanies.jpeg',
            link: '/shop?category=caps',
          },
        ];

      case 'native':
        return [
          {
            id: 'n-slide-1',
            tag: 'TRADITIONAL & NATIVE',
            title: 'ROYAL 3-PIECE AGBADA',
            subtitle: 'WEDDINGS & OWAMBE CELEBRATIONS',
            highlight: 'EMBROIDERED CEREMONIAL ROBES',
            image: '/images/products/BlackAgbada.jpg',
            link: '/shop?gender=men&category=agbada',
          },
          {
            id: 'n-slide-2',
            tag: 'SENATOR & KAFTAN',
            title: 'TAILORED SENATOR SETS',
            subtitle: 'OFFICE & SUNDAY BEST',
            highlight: 'CLEAN TWO-PIECE OUTFITS',
            image: '/images/products/BlackSenator.jpg',
            link: '/shop?gender=men&category=senator',
          },
          {
            id: 'n-slide-3',
            tag: 'NATIVE HEADWEAR',
            title: 'ASO-OKE FILA CAPS',
            subtitle: 'TRADITIONAL EMBROIDERED CAPS',
            highlight: 'MATCHING WEDDING ACCESSORIES',
            image: '/images/products/Cap1.png',
            link: '/shop?category=fila',
          },
        ];

      case 'footwear':
        return [
          {
            id: 'f-slide-1',
            tag: 'LEATHER SLIDES',
            title: 'HANDMADE LEATHER SLIDES',
            subtitle: 'GENUINE NIGERIAN LEATHER',
            highlight: 'COMFORTABLE SLIP-ON FOOTBED',
            image: '/images/products/UnisexSlides.jpg',
            link: '/shop?department=footwear',
          },
          {
            id: 'f-slide-crocs',
            tag: 'CROCS & CLOGS',
            title: 'PLATFORM CROCS & CLOGS',
            subtitle: 'LIGHTWEIGHT FOAM COMFORT',
            highlight: 'CASUAL ALL-DAY SLIP-ONS',
            image: '/images/categories/crocs_men.jpg',
            link: '/shop?category=clogs',
          },
          {
            id: 'f-slide-sneakers',
            tag: 'STREET SHOES & CANVAS',
            title: 'CANVAS & STREET SNEAKERS',
            subtitle: 'RETRO RUNNERS & LOW-TOPS',
            highlight: 'CUSHIONED PLATFORM SOLES',
            image: '/images/products/AddidasShoeUnisex.jpg',
            link: '/shop?category=sneakers',
          },
          {
            id: 'f-slide-2',
            tag: 'FORMAL SHOES',
            title: 'SMART MULES & LOAFERS',
            subtitle: 'OCCASION & SUNDAY BEST',
            highlight: 'ELEGANT LEATHER SILHOUETTES',
            image: '/images/products/BlackSmartShoes.jpg',
            link: '/shop?category=loafers',
          },
          {
            id: 'f-slide-palms',
            tag: 'PALM SLIPPERS',
            title: 'DOUBLE-STRAP PALM SLIDES',
            subtitle: 'EVERYDAY COMFORT WEAR',
            highlight: 'LIGHTWEIGHT CUSHIONED SOLE',
            image: '/images/products/AdiletteAquaSlides.jpg',
            link: '/shop?category=slides',
          },
        ];

      case 'men':
      default:
        return [
          {
            id: 'm-slide-1',
            tag: 'TRADITIONAL & NATIVE',
            title: 'ROYAL 3-PIECE AGBADA',
            subtitle: 'WEDDINGS & CELEBRATIONS',
            highlight: 'EMBROIDERED NIGERIAN ROBES',
            image: '/images/products/BlackAgbada.jpg',
            link: '/shop?gender=men&category=agbada',
          },
          {
            id: 'm-slide-2',
            tag: 'STREETWEAR',
            title: 'HOODIES & SWEATSHIRTS',
            subtitle: 'EVERYDAY CASUAL STREETWEAR',
            highlight: 'HEAVYWEIGHT RELAXED FITS',
            image: '/images/products/BlackTrapStarHoodie.jpg',
            link: '/shop?gender=men&category=hoodies',
          },
          {
            id: 'm-slide-3',
            tag: 'SENATOR & KAFTAN',
            title: 'TAILORED SENATOR SETS',
            subtitle: 'OFFICE & SUNDAY BEST',
            highlight: 'CLEAN TWO-PIECE KAFTANS',
            image: '/images/products/BlackSenator.jpg',
            link: '/shop?gender=men&category=senator',
          },
          {
            id: 'm-slide-4',
            tag: 'LEATHER FOOTWEAR',
            title: 'LEATHER SLIDES & SHOES',
            subtitle: 'HANDMADE CALFSKIN FOOTWEAR',
            highlight: 'DURABLE GENUINE LEATHER',
            image: '/images/products/UnisexSlides.jpg',
            link: '/shop?gender=men&department=footwear',
          },
          {
            id: 'm-slide-5',
            tag: 'POLO & CASUAL',
            title: 'POLOS & CASUAL SHIRTS',
            subtitle: 'SMART COLLAR SHIRTS & POLOS',
            highlight: 'REFINED EVERYDAY CASUALS',
            image: '/images/uploaded/poloandshirt.jpeg',
            link: '/shop?gender=men&category=polos',
          },
          {
            id: 'm-slide-6',
            tag: 'JALABIYA & ROBES',
            title: 'EMBROIDERED JALABIYAS',
            subtitle: 'COMFORTABLE FLOWING ROBES',
            highlight: 'REGAL LEISURE COMFORT',
            image: '/images/uploaded/jalabmen.jpeg',
            link: '/shop?gender=men&category=jalabiya',
          },
          {
            id: 'm-slide-7',
            tag: 'BACKPACKS & BAGS',
            title: 'LUXURY LEATHER BACKPACKS',
            subtitle: 'COMMUTER BACKPACKS & DUFFELS',
            highlight: 'PRACTICAL EVERYDAY UTILITY',
            image: '/images/uploaded/leaderBags.jpeg',
            link: '/shop?gender=men&department=bags',
          },
          {
            id: 'm-slide-8',
            tag: 'CAPS & HATS',
            title: 'TRUCKERS & STREET CAPS',
            subtitle: 'DESIGNER BASEBALL CAPS & BEANIES',
            highlight: 'STATEMENT HEADWEAR ACCENTS',
            image: '/images/uploaded/capshatbeanies.jpeg',
            link: '/shop?gender=men&category=caps',
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
          title: 'Weddings & Owambe',
          sub: 'Aso-Ebi, Corseted Gowns & Lace Styles',
          image: '/images/editorial/nigerian_female_couture.jpg',
          link: '/shop?gender=women&department=native',
        },
        {
          title: 'Streetwear & Casual',
          sub: 'Cropped Hoodies, Cargo Pants & Denim',
          image: '/images/uploaded/Oversizedhoodie&cargo.jpeg',
          link: '/shop?gender=women&department=clothing',
        },
        {
          title: 'Weekend & Resort',
          sub: 'Flowing Silk Boubou, Leather Slides & Bags',
          image: '/images/uploaded/LeaderbagsWomen.jpeg',
          link: '/shop?gender=women&category=boubou',
        },
      ];
    }

    return [
      {
        title: 'Weddings & Owambe',
        sub: 'Ceremonial Agbada, Senator Sets & Fila Caps',
        image: '/images/editorial/nigerian_male_couture.jpg',
        link: '/shop?gender=men&category=agbada',
      },
      {
        title: 'Streetwear & Casual',
        sub: 'Heavyweight Hoodies, Cargo & Graphic Tees',
        image: '/images/editorial/modern_male_streetwear.jpg',
        link: '/shop?gender=men&category=hoodies',
      },
      {
        title: 'Office & Sunday Best',
        sub: 'Clean Senator Sets, Dress Trousers & Leather Slides',
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

  // Recently Viewed Pieces (strictly from user's local browsing history)
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

    setRecentlyViewed([]);
  }, [allProducts]);

  useEffect(() => {
    const handleSync = () => {
      try {
        const raw = localStorage.getItem('irisi_recently_viewed');
        if (!raw) setRecentlyViewed([]);
      } catch (e) {}
    };
    window.addEventListener('irisi_recently_viewed_updated', handleSync);
    return () => window.removeEventListener('irisi_recently_viewed_updated', handleSync);
  }, []);

  const handleClearRecentlyViewed = () => {
    try {
      localStorage.removeItem('irisi_recently_viewed');
      window.dispatchEvent(new Event('irisi_recently_viewed_updated'));
    } catch (e) {}
    setRecentlyViewed([]);
  };

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
            NEW ARRIVALS · READY TO SHIP
          </span>
          <span className="text-[9px] text-neutral-400 tracking-tight">
            Direct courier delivery & waybill across all 36 states
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
              Trending Pieces
            </h2>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
              Popular Clothes, Shoes & Bags
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

      {/* ── 8. SHOP BY OCCASION ──────────────────────────────── */}
      <section className="px-4 pt-12 space-y-3">
        <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <h2 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
            Shop by Occasion
          </h2>
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
            Outfits for Weddings, Streetwear, Work & Weekends
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
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClearRecentlyViewed}
                className="text-[10px] font-bold text-neutral-400 hover:text-rose-500 uppercase tracking-wider transition-colors cursor-pointer"
              >
                Clear
              </button>
              <Link
                href="/shop"
                className="text-[11px] font-bold text-neutral-500 uppercase hover:text-black dark:hover:text-white"
              >
                Shop All →
              </Link>
            </div>
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
