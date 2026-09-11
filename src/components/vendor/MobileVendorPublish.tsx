'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GarmentCategory, GenderTarget, VendorSpecialty, getVendorSpecialty } from '@/types';
import {
  UploadCloud, Sparkles, Plus, Trash2,
  Tag, ArrowRight, X, Palette,
  Check, AlertTriangle, ShieldCheck, Camera,
  RefreshCw, Minus, ChevronDown, Sparkle,
  Shirt, Footprints, Gem, Layers, CheckCircle2, ExternalLink,
  Video, Play, Store
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { useStore } from '@/lib/store/useStore';
import { vendorFetch } from '@/lib/services/apiClient';
import { compressImage, compressImageToFile } from '@/lib/utils/imageUtils';
import { detectGarmentColor, FASHION_COLOR_PALETTE } from '@/lib/utils/colorDetector';
import { trimVideoInBrowser } from '@/lib/utils/clientVideoTrimmer';

const STANDARD_COLORS = [
  { name: 'Black', hex: '#111111' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Gold', hex: '#d4af37' },
  { name: 'Silver', hex: '#c0c0c0' },
  { name: 'Rose Gold', hex: '#b76e79' },
  { name: 'Black & White', hex: '#111111' },
  { name: 'Multi-Color / Pattern', hex: '#6366f1' },
  { name: 'Khaki / Beige', hex: '#d4b996' },
  { name: 'Chocolate Brown', hex: '#451a03' },
  { name: 'Tan / Camel', hex: '#c19a6b' },
  { name: 'Navy Blue', hex: '#1e3a8a' },
  { name: 'Heather Grey', hex: '#9ca3af' },
  { name: 'Charcoal Grey', hex: '#374151' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Sky Blue', hex: '#38bdf8' },
  { name: 'Forest Green', hex: '#065f46' },
  { name: 'Olive Green', hex: '#4d7c0f' },
  { name: 'Wine / Burgundy', hex: '#831843' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Emerald Gold', hex: '#e6c367' },
];

const MALE_CATEGORIES = [
  // Native & Cultural
  { id: 'senator_kaftan', label: 'Senator Sets & Kaftans', generalCat: 'tops' as GarmentCategory, group: 'native' },
  { id: 'agbada_robes', label: 'Grand Agbada 3-Piece', generalCat: 'outerwear' as GarmentCategory, group: 'native' },
  { id: 'jalabiya_tunics', label: 'Jalabiya & Tunics', generalCat: 'tops' as GarmentCategory, group: 'native' },
  { id: 'men_caps_fila', label: 'Aso-Oke Fila & Caps', generalCat: 'accessories' as GarmentCategory, group: 'native' },
  // Apparel
  { id: 'streetwear_hoodie', label: 'Streetwear Hoodies & Sweats', generalCat: 'outerwear' as GarmentCategory, group: 'apparel' },
  { id: 'suits_blazers', label: 'Suits, Tuxedos & Blazers', generalCat: 'outerwear' as GarmentCategory, group: 'apparel' },
  { id: 'tshirts_tees', label: 'T-Shirts & Graphic Tees', generalCat: 'tops' as GarmentCategory, group: 'apparel' },
  { id: 'shirts_polos', label: 'Luxury Shirts & Polos', generalCat: 'tops' as GarmentCategory, group: 'apparel' },
  { id: 'jackets_coats', label: 'Jackets & Windbreakers', generalCat: 'outerwear' as GarmentCategory, group: 'apparel' },
  { id: 'jeans_trousers', label: 'Baggy Jeans & Cargo Pants', generalCat: 'bottoms' as GarmentCategory, group: 'apparel' },
  { id: 'joggers_sweats', label: 'Joggers & Sweatpants', generalCat: 'bottoms' as GarmentCategory, group: 'apparel' },
  { id: 'shorts_sets', label: 'Shorts & Casual Sets', generalCat: 'bottoms' as GarmentCategory, group: 'apparel' },
  { id: 'men_underwears', label: 'Underwear & Loungewear', generalCat: 'bottoms' as GarmentCategory, group: 'apparel' },
  // Footwear
  { id: 'men_slides_palms', label: 'Slides, Palms & Slippers', generalCat: 'footwear' as GarmentCategory, group: 'footwear' },
  { id: 'men_shoes_sneakers', label: 'Sneakers & Street Trainers', generalCat: 'footwear' as GarmentCategory, group: 'footwear' },
  { id: 'men_shoes_loafers', label: 'Loafers, Shoes & Mules', generalCat: 'footwear' as GarmentCategory, group: 'footwear' },
  // Bags
  { id: 'men_bags_backpacks', label: 'Backpacks & Travel Bags', generalCat: 'accessories' as GarmentCategory, group: 'bags' },
  { id: 'men_bags_crossbody', label: 'Crossbody & Chest Rigs', generalCat: 'accessories' as GarmentCategory, group: 'bags' },
  // Accessories & Jewelry
  { id: 'men_jewelry_chains', label: 'Chains, Rings & Jewelry', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
  { id: 'men_watches', label: 'Luxury Wristwatches', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
  { id: 'men_eyewear', label: 'Sunglasses & Glasses', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
  { id: 'men_caps_hats', label: 'Caps, Hats & Beanies', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
];

const FEMALE_CATEGORIES = [
  // Native & Cultural
  { id: 'boubou_kaftans', label: 'Silk Boubou, Kaftans & Abayas', generalCat: 'outerwear' as GarmentCategory, group: 'native' },
  { id: 'lace_ankara', label: 'Lace & Ankara Tailored Sets', generalCat: 'tops' as GarmentCategory, group: 'native' },
  // Apparel
  { id: 'dresses_gowns', label: 'Dresses, Gowns & Maxis', generalCat: 'tops' as GarmentCategory, group: 'apparel' },
  { id: 'two_piece_sets', label: 'Two-Piece Co-ord Sets', generalCat: 'tops' as GarmentCategory, group: 'apparel' },
  { id: 'corsets_tops', label: 'Corsets, Tops & Blouses', generalCat: 'tops' as GarmentCategory, group: 'apparel' },
  { id: 'female_streetwear', label: 'Female Streetwear & Hoodies', generalCat: 'outerwear' as GarmentCategory, group: 'apparel' },
  { id: 'women_jeans_trousers', label: 'Jeans, Cargo & Pants', generalCat: 'bottoms' as GarmentCategory, group: 'apparel' },
  { id: 'skirts_minis', label: 'Skirts & Mini Skirts', generalCat: 'bottoms' as GarmentCategory, group: 'apparel' },
  { id: 'women_shorts', label: 'Shorts & Biker Sets', generalCat: 'bottoms' as GarmentCategory, group: 'apparel' },
  { id: 'women_underwears', label: 'Underwear, Shapewear & Loungewear', generalCat: 'bottoms' as GarmentCategory, group: 'apparel' },
  // Footwear
  { id: 'women_heels_mules', label: 'Heels, Pumps & Mules', generalCat: 'footwear' as GarmentCategory, group: 'footwear' },
  { id: 'women_slides_palms', label: 'Slides, Palms & Flats', generalCat: 'footwear' as GarmentCategory, group: 'footwear' },
  { id: 'women_sneakers', label: 'Designer Sneakers', generalCat: 'footwear' as GarmentCategory, group: 'footwear' },
  // Bags
  { id: 'women_bags_handbags', label: 'Handbags & Totes', generalCat: 'accessories' as GarmentCategory, group: 'bags' },
  { id: 'women_bags_clutches', label: 'Clutches & Crossbody Minis', generalCat: 'accessories' as GarmentCategory, group: 'bags' },
  // Accessories & Jewelry
  { id: 'women_jewelry', label: 'Jewelry, Necklaces & Bangles', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
  { id: 'women_watches', label: 'Women’s Luxury Watches', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
  { id: 'women_sunglasses', label: 'Sunglasses & Shades', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
  { id: 'women_caps_scarves', label: 'Headbands, Scarves & Caps', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
];

const UNISEX_CATEGORIES = [
  // Apparel
  { id: 'unisex_hoodie', label: 'Streetwear Hoodies & Sweaters', generalCat: 'outerwear' as GarmentCategory, group: 'apparel' },
  { id: 'unisex_tees', label: 'Graphic Tees & Oversized Shirts', generalCat: 'tops' as GarmentCategory, group: 'apparel' },
  { id: 'unisex_denim', label: 'Denim Jeans & Cargo Pants', generalCat: 'bottoms' as GarmentCategory, group: 'apparel' },
  // Footwear
  { id: 'unisex_slides_palms', label: 'Slides, Palms & Crocs', generalCat: 'footwear' as GarmentCategory, group: 'footwear' },
  { id: 'unisex_sneakers', label: 'Sneakers & Casual Shoes', generalCat: 'footwear' as GarmentCategory, group: 'footwear' },
  // Accessories & Jewelry
  { id: 'unisex_jewelry', label: 'Chains, Rings & Jewelry', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
  { id: 'unisex_watches', label: 'Wristwatches & Timepieces', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
  { id: 'unisex_sunglasses', label: 'Sunglasses & Eyewear', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
  { id: 'unisex_caps_hats', label: 'Caps, Beanies & Hats', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
  { id: 'unisex_bags', label: 'Crossbody Bags & Backpacks', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
];

const APPAREL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const FOOTWEAR_SIZES = ['39', '40', '41', '42', '43', '44', '45', '46'];
const ACCESSORY_SIZES = ['One Size'];

interface MobileVendorPublishProps {
  onPublishSuccess: (productId: string) => void;
  vendorProfile: any;
  getActiveVendorId: () => string;
  onSwitchToBatch?: () => void;
}

export default function MobileVendorPublish({
  onPublishSuccess,
  vendorProfile,
  getActiveVendorId,
  onSwitchToBatch
}: MobileVendorPublishProps) {
  const vendorSpecialty: VendorSpecialty = getVendorSpecialty(vendorProfile);

  const [genderTarget, setGenderTarget] = useState<GenderTarget>('male');
  const [catFilterTab, setCatFilterTab] = useState<'all' | 'apparel' | 'footwear' | 'accessories'>(
    vendorSpecialty === 'caps' || vendorSpecialty === 'accessories' || vendorSpecialty === 'jewelry' ? 'accessories' :
    vendorSpecialty === 'footwear' ? 'footwear' :
    vendorSpecialty === 'apparel' || vendorSpecialty === 'native_tailoring' || vendorSpecialty === 'streetwear' ? 'apparel' : 'all'
  );
  const [name, setName] = useState('');
  const [subCategory, setSubCategory] = useState(
    vendorSpecialty === 'caps' ? 'men_caps_fila' :
    vendorSpecialty === 'jewelry' ? 'men_jewelry_chains' :
    vendorSpecialty === 'accessories' ? 'men_bags_wallets' :
    vendorSpecialty === 'footwear' ? 'men_slides_palms' :
    vendorSpecialty === 'native_tailoring' ? 'senator_kaftan' :
    MALE_CATEGORIES[0].id
  );
  const [category, setCategory] = useState<GarmentCategory>(
    vendorSpecialty === 'caps' || vendorSpecialty === 'accessories' || vendorSpecialty === 'jewelry' ? 'accessories' :
    vendorSpecialty === 'footwear' ? 'footwear' :
    MALE_CATEGORIES[0].generalCat
  );
  const [rawPrice, setRawPrice] = useState<string>('');
  
  // Colors (for apparel and footwear)
  const [selectedColors, setSelectedColors] = useState<{ name: string; hex: string }[]>([]);
  const [customHex, setCustomHex] = useState('#2563eb');
  const [customName, setCustomName] = useState('');
  const [showCustomColor, setShowCustomColor] = useState(false);

  // Description, Tags & AI Generator
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiToast, setAiToast] = useState('');

  // Sizing & Stock
  const [sizeStock, setSizeStock] = useState<{ [size: string]: { enabled: boolean; quantity: number | string } }>(
    vendorSpecialty === 'caps' || vendorSpecialty === 'accessories' || vendorSpecialty === 'jewelry'
      ? { 'One Size': { enabled: true, quantity: 20 } }
      : vendorSpecialty === 'footwear'
      ? {
          '39': { enabled: true, quantity: 5 },
          '40': { enabled: true, quantity: 10 },
          '41': { enabled: true, quantity: 10 },
          '42': { enabled: true, quantity: 10 },
          '43': { enabled: true, quantity: 10 },
          '44': { enabled: true, quantity: 5 },
          '45': { enabled: false, quantity: 0 },
          '46': { enabled: false, quantity: 0 },
        }
      : {
          'S': { enabled: true, quantity: 10 },
          'M': { enabled: true, quantity: 20 },
          'L': { enabled: true, quantity: 20 },
          'XL': { enabled: true, quantity: 10 },
          'XXL': { enabled: false, quantity: 0 },
        }
  );

  // Photos (Multi-angle & multi-view support: Front, Back, Details, Jewelry, Bags, optional Colorway)
  const [uploadedImages, setUploadedImages] = useState<Array<{
    id: string;
    url: string;
    label?: string;
    colorName?: string;
    colorHex?: string;
    isCover?: boolean;
    showColorTag?: boolean;
    isDetectingColor?: boolean;
    isUploading?: boolean;
  }>>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unique colorways derived strictly from uploaded photos with assigned colors
  const photoDerivedColors = useMemo(() => {
    const map = new Map<string, { name: string; hex: string; imageUrl?: string }>();
    uploadedImages.forEach((img) => {
      if (img.colorName && img.colorName.trim() && img.colorName !== 'none' && img.colorName !== 'General / All Colors') {
        const key = img.colorName.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            name: img.colorName.trim(),
            hex: img.colorHex || '#111111',
            imageUrl: img.url,
          });
        }
      }
    });
    return Array.from(map.values());
  }, [uploadedImages]);

  // Catwalk / Movement Video (3-5s micro-clip)
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [pendingTrimFile, setPendingTrimFile] = useState<File | null>(null);
  const [isTrimmingVideo, setIsTrimmingVideo] = useState(false);
  const [trimProgress, setTrimProgress] = useState(0);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPublishSuccess, setIsPublishSuccess] = useState(false);
  const [publishedProductId, setPublishedProductId] = useState<string | null>(null);
  const [lastPublishedName, setLastPublishedName] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Auto-scroll to top whenever an error is encountered
  useEffect(() => {
    if (errorMessage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [errorMessage]);

  const currentCategoryList = genderTarget === 'male' ? MALE_CATEGORIES : genderTarget === 'female' ? FEMALE_CATEGORIES : UNISEX_CATEGORIES;

  const filteredCategoryList = useMemo(() => {
    return currentCategoryList.filter((c) => {
      if (vendorSpecialty === 'native_tailoring') {
        return c.group === 'native' || c.id.includes('senator') || c.id.includes('agbada') || c.id.includes('kaftan') || c.id.includes('boubou') || c.id.includes('lace') || c.id.includes('fila');
      }
      if (vendorSpecialty === 'streetwear') {
        return c.group === 'apparel' && !c.id.includes('fila');
      }
      if (vendorSpecialty === 'footwear') {
        return c.group === 'footwear';
      }
      if (vendorSpecialty === 'caps') {
        return c.id.includes('cap') || c.id.includes('hat') || c.id.includes('fila') || c.id.includes('beanie');
      }
      if (vendorSpecialty === 'jewelry') {
        return c.id.includes('jewelry') || c.id.includes('chains') || c.id.includes('watches') || c.id.includes('ring') || c.id.includes('necklace') || c.id.includes('bangle');
      }
      if (vendorSpecialty === 'accessories') {
        return c.group === 'accessories' || c.group === 'bags';
      }
      // multi_department or general
      if (catFilterTab === 'all') return true;
      if (catFilterTab === 'apparel') return c.group === 'apparel' || c.group === 'native';
      if (catFilterTab === 'footwear') return c.group === 'footwear';
      if (catFilterTab === 'accessories') return c.group === 'accessories' || c.group === 'bags';
      return true;
    });
  }, [currentCategoryList, vendorSpecialty, catFilterTab]);

  const [smartDetectedCat, setSmartDetectedCat] = useState<string | null>(null);

  const detectCategoryFromTitle = (title: string, list: typeof MALE_CATEGORIES) => {
    const lower = title.toLowerCase().trim();
    if (!lower || lower.length < 3) return null;

    const rules: { keywords: string[]; match: (id: string) => boolean }[] = [
      // Footwear
      { keywords: ['slide', 'palm', 'slipper', 'croc', 'flat', 'clog'], match: id => id.includes('slides_palms') },
      { keywords: ['sneaker', 'trainer', 'kicks', 'runner', 'dunk'], match: id => id.includes('sneakers') },
      { keywords: ['heel', 'pump', 'stiletto', 'mule', 'wedge'], match: id => id.includes('heels') || id.includes('mules') },
      { keywords: ['loafer', 'shoe', 'derby', 'oxford', 'brogue', 'boot'], match: id => id.includes('loafers') || id.includes('shoes') },
      
      // Native
      { keywords: ['agbada'], match: id => id.includes('agbada') },
      { keywords: ['senator', 'kaftan', 'dashiki'], match: id => id.includes('senator') || id.includes('kaftan') },
      { keywords: ['jalabiya', 'jalab', 'thobe', 'tunic', 'loungewear'], match: id => id.includes('jalabiya') },
      { keywords: ['boubou', 'bubu', 'abaya'], match: id => id.includes('boubou') },
      { keywords: ['lace', 'ankara', 'iro', 'buba'], match: id => id.includes('lace') || id.includes('ankara') },
      
      // Accessories / Headwear / Watches / Jewelry / Bags
      { keywords: ['fila', 'aso-oke', 'asooke'], match: id => id.includes('caps_fila') },
      { keywords: ['cap', 'hat', 'beanie', 'snapback', 'beret', 'bucket hat'], match: id => id.includes('caps') || id.includes('hats') },
      { keywords: ['watch', 'wristwatch', 'rolex', 'timepiece', 'chronograph'], match: id => id.includes('watches') },
      { keywords: ['sunglasses', 'glasses', 'shades', 'eyewear', 'spectacles'], match: id => id.includes('sunglasses') || id.includes('eyewear') },
      { keywords: ['chain', 'necklace', 'pendant', 'cuban', 'ring', 'bangle', 'bracelet', 'earring', 'jewelry', 'jewellery'], match: id => id.includes('jewelry') || id.includes('chains') },
      { keywords: ['crossbody', 'chest rig', 'waist bag', 'fanny pack', 'clutch'], match: id => id.includes('crossbody') || id.includes('clutches') },
      { keywords: ['backpack', 'tote', 'handbag', 'duffle', 'travel bag', 'briefcase', 'leather bag'], match: id => id.includes('backpacks') || id.includes('handbags') || id.includes('bags') },
      
      // Apparel
      { keywords: ['hoodie', 'sweatshirt', 'sweat jacket', 'pullover'], match: id => id.includes('hoodie') || id.includes('streetwear') },
      { keywords: ['suit', 'blazer', 'tuxedo', 'waistcoat'], match: id => id.includes('suits_blazers') },
      { keywords: ['tee', 't-shirt', 'graphic tee', 'oversized tee'], match: id => id.includes('tees') || id.includes('tshirts') },
      { keywords: ['polo', 'button down', 'oxford shirt', 'dress shirt', 'collar shirt', 'shirt'], match: id => id.includes('polos') || id.includes('shirts') },
      { keywords: ['jacket', 'windbreaker', 'bomber', 'varsity', 'coat'], match: id => id.includes('jackets') },
      { keywords: ['cargo', 'jeans', 'denim', 'baggy'], match: id => id.includes('jeans') || id.includes('denim') },
      { keywords: ['jogger', 'sweatpants', 'track pants'], match: id => id.includes('joggers') },
      { keywords: ['shorts', 'short set', 'biker short'], match: id => id.includes('shorts') },
      { keywords: ['dress', 'gown', 'maxi', 'midi', 'mini dress'], match: id => id.includes('dresses') },
      { keywords: ['two piece', 'two-piece', 'co-ord', 'set'], match: id => id.includes('two_piece') },
      { keywords: ['corset', 'blouse', 'crop top'], match: id => id.includes('corsets') },
    ];

    for (const rule of rules) {
      const isMatch = rule.keywords.some(kw => {
        const regex = new RegExp(`\\b${kw}`, 'i');
        return regex.test(lower);
      });
      if (isMatch) {
        const found = list.find(c => rule.match(c.id));
        if (found) return found;
      }
    }
    return null;
  };

  const handleTitleChange = (val: string) => {
    setName(val);
    const detected = detectCategoryFromTitle(val, filteredCategoryList);
    if (detected && detected.id !== subCategory) {
      handleCategorySelect(detected.id, detected.generalCat);
      setSmartDetectedCat(detected.label);
    } else if (!val.trim()) {
      setSmartDetectedCat(null);
    }
  };
  const currentSizeList = category === 'footwear' ? FOOTWEAR_SIZES : category === 'accessories' ? ACCESSORY_SIZES : APPAREL_SIZES;

  const handleCategorySelect = (selectedSubCatId: string, generalCat: GarmentCategory) => {
    setSubCategory(selectedSubCatId);
    setCategory(generalCat);

    if (generalCat === 'footwear') {
      setSizeStock({
        '39': { enabled: true, quantity: 5 },
        '40': { enabled: true, quantity: 10 },
        '41': { enabled: true, quantity: 10 },
        '42': { enabled: true, quantity: 10 },
        '43': { enabled: true, quantity: 10 },
        '44': { enabled: true, quantity: 5 },
        '45': { enabled: false, quantity: 0 },
        '46': { enabled: false, quantity: 0 },
      });
    } else if (generalCat === 'accessories') {
      setSizeStock({
        'One Size': { enabled: true, quantity: 20 }
      });
    } else {
      setSizeStock({
        'S': { enabled: true, quantity: 10 },
        'M': { enabled: true, quantity: 20 },
        'L': { enabled: true, quantity: 20 },
        'XL': { enabled: true, quantity: 10 },
        'XXL': { enabled: false, quantity: 0 },
      });
    }
  };

  const handlePriceChange = (val: string) => {
    const cleanDigits = val.replace(/\D/g, '');
    if (!cleanDigits) {
      setRawPrice('');
      return;
    }
    const formatted = Number(cleanDigits).toLocaleString('en-NG');
    setRawPrice(formatted);
  };

  const handleGenerateAiDescription = async () => {
    if (!name.trim()) {
      setAiToast('Enter product title first (e.g. Leather Palms or Senator Kaftan)');
      setTimeout(() => setAiToast(''), 3500);
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: name.trim(),
          category: subCategory,
          genderTarget,
          vendorType: vendorProfile.vendorType,
          brandName: vendorProfile.brandName,
          imageUrl: uploadedImages[0]?.url || imagePreview || null
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.description) setDescription(data.description);
        if (data.tags && Array.isArray(data.tags)) setTags(prev => Array.from(new Set([...prev, ...data.tags])));
        if (!rawPrice && data.suggestedPrice) setRawPrice(Number(data.suggestedPrice).toLocaleString('en-NG'));
        setAiToast('AI generated description & tags!');
        setTimeout(() => setAiToast(''), 3500);
      }
    } catch (e) {
      console.error(e);
      setAiToast('AI generation timed out');
      setTimeout(() => setAiToast(''), 3000);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImages(true);
    try {
      const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
      if (fileList.length === 0) return;

      for (const file of fileList) {
        const tempId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const localPreview = URL.createObjectURL(file);

        // Instantly display preview in UI with upload state
        setUploadedImages((prev) => {
          const newItem = {
            id: tempId,
            url: localPreview,
            label: '',
            colorName: undefined,
            colorHex: undefined,
            isCover: prev.length === 0,
            showColorTag: false,
            isDetectingColor: false,
            isUploading: true,
          };
          return [...prev, newItem];
        });

        // Compress and upload directly to Cloudinary CDN
        (async () => {
          try {
            const compressedFile = await compressImageToFile(file, 1400, 0.85);
            const formData = new FormData();
            formData.append('file', compressedFile);

            const res = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });

            const data = await res.json();
            if (res.ok && data.url) {
              setUploadedImages((prev) =>
                prev.map((img) =>
                  img.id === tempId
                    ? { ...img, url: data.url, isUploading: false }
                    : img
                )
              );
            } else {
              setUploadedImages((prev) => prev.filter((img) => img.id !== tempId));
              setErrorMessage('Photo upload failed: ' + (data.error || 'Server error. Please try again.'));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          } catch (uploadErr: any) {
            console.error('Direct upload to CDN failed:', uploadErr);
            setUploadedImages((prev) => prev.filter((img) => img.id !== tempId));
            setErrorMessage('Photo upload failed. Please check your internet connection and re-upload.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        })();
      }

      if (e.target) e.target.value = '';
    } catch (err) {
      console.error('Image upload/compression error:', err);
      setErrorMessage('Failed to optimize some uploaded photos. Please try again.');
    } finally {
      setIsProcessingImages(false);
    }
  };

  const handleUpdateImageLabel = (id: string, label: string) => {
    setUploadedImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, label: img.label === label ? '' : label } : img))
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

  const handleSetCover = (id: string) => {
    setUploadedImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (!target) return prev;
      const rest = prev.filter((img) => img.id !== id);
      return [{ ...target, isCover: true }, ...rest.map((img) => ({ ...img, isCover: false }))];
    });
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

  const handleAssignColor = (id: string, colorName: string, customHex?: string) => {
    const matched = FASHION_COLOR_PALETTE.find(
      (c) => c.name.toLowerCase() === colorName.toLowerCase()
    );
    const existingImg = uploadedImages.find((i) => i.id === id);
    const resolvedHex = customHex || (matched ? matched.hex : existingImg?.colorHex || '#111111');

    setUploadedImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, colorName, colorHex: resolvedHex } : img
      )
    );

    if (colorName && colorName !== 'none' && colorName !== 'General / All Colors') {
      setSelectedColors((prev) => {
        if (prev.some((c) => c.name.toLowerCase() === colorName.toLowerCase())) {
          return prev.map((c) =>
            c.name.toLowerCase() === colorName.toLowerCase()
              ? { ...c, hex: resolvedHex }
              : c
          );
        }
        return [...prev, { name: colorName, hex: resolvedHex }];
      });
    }
  };

  const handleUpdateColorHex = (id: string, hex: string) => {
    setUploadedImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, colorHex: hex } : img))
    );

    const img = uploadedImages.find((i) => i.id === id);
    if (img && img.colorName) {
      setSelectedColors((prev) =>
        prev.map((c) =>
          c.name.toLowerCase() === img.colorName?.toLowerCase() ? { ...c, hex } : c
        )
      );
    }
  };

  const handleAiDetectForImage = async (id: string) => {
    const img = uploadedImages.find((i) => i.id === id);
    if (!img) return;

    setUploadedImages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isDetectingColor: true } : item))
    );

    try {
      const detected = await detectGarmentColor(img.url);
      handleAssignColor(id, detected.name, detected.hex);
    } catch (e) {
      console.error('AI color detection error:', e);
    } finally {
      setUploadedImages((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isDetectingColor: false } : item))
      );
    }
  };

  const processAndUploadVideo = async (fileToUpload: File, fallbackTrim = false) => {
    setIsVideoUploading(true);
    setVideoError('');
    setPendingTrimFile(null);
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      if (fallbackTrim) {
        formData.append('trim', 'true');
      }
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setVideoPreview(data.url);
        setVideoFile(fileToUpload);
        setVideoError('');
        setPendingTrimFile(null);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setVideoPreview(reader.result as string);
          setVideoFile(fileToUpload);
          setVideoError('');
          setPendingTrimFile(null);
        };
        reader.readAsDataURL(fileToUpload);
      }
    } catch (err) {
      console.error('Video upload error:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
        setVideoFile(fileToUpload);
        setVideoError('');
        setPendingTrimFile(null);
      };
      reader.readAsDataURL(fileToUpload);
    } finally {
      setIsVideoUploading(false);
      setVideoError('');
      setPendingTrimFile(null);
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoError('');
    setPendingTrimFile(null);

    // 1. Enforce file size limit (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setVideoError('Video must be under 15MB. Please upload a short 3–5s clip.');
      return;
    }

    // 2. Validate video duration using in-memory video element
    const tempUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = tempUrl;

    video.onloadedmetadata = async () => {
      URL.revokeObjectURL(tempUrl);
      const roundedDur = Math.round(video.duration);
      if (video.duration > 5.5) {
        setPendingTrimFile(file);
        setVideoError(`Video is ${roundedDur}s long (recommended catalog length is 3–5s for fast loading).`);
        return;
      }

      setPendingTrimFile(null);
      await processAndUploadVideo(file);
    };

    video.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      setVideoError('Could not read video file. Please use MP4 or WebM format.');
    };
  };

  const handleAutoTrimVideo = async () => {
    if (!pendingTrimFile) return;
    const fileToTrim = pendingTrimFile;
    setIsTrimmingVideo(true);
    setTrimProgress(0);
    setVideoError('');
    setPendingTrimFile(null);
    try {
      const trimmed = await trimVideoInBrowser(fileToTrim, {
        targetSeconds: 5,
        onProgress: (p) => setTrimProgress(p)
      });
      await processAndUploadVideo(trimmed);
    } catch (err: any) {
      console.warn('Browser video trimming fallback to server-side trim:', err);
      await processAndUploadVideo(fileToTrim, true);
    } finally {
      setIsTrimmingVideo(false);
      setTrimProgress(0);
      setVideoError('');
      setPendingTrimFile(null);
    }
  };

  const toggleColor = (color: { name: string; hex: string }) => {
    const exists = selectedColors.some(c => c.name.toLowerCase() === color.name.toLowerCase());
    if (exists) {
      setSelectedColors(selectedColors.filter(c => c.name.toLowerCase() !== color.name.toLowerCase()));
    } else {
      setSelectedColors([...selectedColors, color]);
    }
  };

  const handleAddCustomColor = () => {
    if (!customName.trim()) return;
    setSelectedColors([...selectedColors, { name: customName.trim(), hex: customHex }]);
    setCustomName('');
    setShowCustomColor(false);
  };

  const handleSizeStockChange = (size: string, rawQuantity: number | string) => {
    const cleanQty = typeof rawQuantity === 'string'
      ? (rawQuantity.trim() === '' ? '' : parseInt(rawQuantity.replace(/[^0-9]/g, ''), 10))
      : rawQuantity;
    setSizeStock(prev => ({
      ...prev,
      [size]: {
        ...prev[size],
        quantity: typeof cleanQty === 'number' && isNaN(cleanQty) ? '' : cleanQty
      }
    }));
  };

  const handleToggleSize = (size: string) => {
    setSizeStock(prev => ({
      ...prev,
      [size]: { ...prev[size], enabled: !prev[size]?.enabled }
    }));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setTagInput('');
      }
    }
  };

  const totalStock = Object.values(sizeStock)
    .filter(s => s?.enabled)
    .reduce((sum, s) => sum + (s?.quantity === '' ? 0 : Number(s?.quantity || 0)), 0);

  const handleResetForm = () => {
    setName('');
    setRawPrice('');
    setDescription('');
    setTags([]);
    setTagInput('');
    setUploadedImages([]);
    setImageFile(null);
    setImagePreview(null);
    setVideoFile(null);
    setVideoPreview(null);
    setVideoError('');
    setSelectedColors([]);
    setSizeStock(
      category === 'footwear'
        ? {
            '39': { enabled: true, quantity: 5 },
            '40': { enabled: true, quantity: 10 },
            '41': { enabled: true, quantity: 10 },
            '42': { enabled: true, quantity: 10 },
            '43': { enabled: true, quantity: 10 },
            '44': { enabled: true, quantity: 5 },
            '45': { enabled: false, quantity: 0 },
            '46': { enabled: false, quantity: 0 },
          }
        : category === 'accessories'
        ? { 'One Size': { enabled: true, quantity: 20 } }
        : {
            'S': { enabled: true, quantity: 10 },
            'M': { enabled: true, quantity: 20 },
            'L': { enabled: true, quantity: 20 },
            'XL': { enabled: true, quantity: 10 },
            'XXL': { enabled: false, quantity: 0 },
          }
    );
    setIsPublishSuccess(false);
    setPublishedProductId(null);
    setErrorMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double-clicks
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter product title');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const numericPrice = Number(rawPrice.replace(/,/g, ''));
    if (!rawPrice || isNaN(numericPrice) || numericPrice <= 0) {
      setErrorMessage('Please enter valid price in Naira');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const enabledSizes = Object.keys(sizeStock).filter(s => sizeStock[s]?.enabled && Number(sizeStock[s]?.quantity) > 0);
    if (enabledSizes.length === 0) {
      setErrorMessage(category === 'accessories' ? 'Please set stock quantity' : 'Enable at least one size with stock');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (uploadedImages.length === 0 && !imagePreview) {
      setErrorMessage('Please upload at least one product photo for your piece');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (uploadedImages.some(img => img.isUploading)) {
      setErrorMessage('Photos are currently optimizing and uploading to the Cloud CDN. Please wait a moment...');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    const activeVendorId = getActiveVendorId();

    try {
      const coverImg = uploadedImages.find((i) => i.isCover) || uploadedImages[0];
      const finalImg = coverImg?.url || imagePreview;
      if (!finalImg || typeof finalImg !== 'string' || !finalImg.trim() || finalImg.startsWith('/images/products/BlackTrapStar')) {
        setErrorMessage('A valid uploaded product photo is required before publishing.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsSubmitting(false);
        return;
      }

      const enrichedColorsToSubmit = photoDerivedColors.length > 0
        ? photoDerivedColors
        : (selectedColors.length > 0 ? selectedColors.map(c => {
            const matchedImg = uploadedImages.find(img => img.colorName && img.colorName.toLowerCase() === c.name.toLowerCase());
            return {
              name: c.name,
              hex: c.hex,
              imageUrl: matchedImg?.url || finalImg
            };
          }) : (category === 'accessories' ? [] : [{ name: 'As Pictured', hex: '#111111', imageUrl: finalImg }])
        );

      const enhancedTags = Array.from(new Set([
        ...tags,
        subCategory,
        category,
        ...(subCategory.includes('bag') || subCategory.includes('backpack') ? ['bag', 'backpack', 'travel bag', 'luggage'] : []),
        ...(subCategory.includes('cap') || subCategory.includes('fila') ? ['cap', 'hat', 'fila'] : []),
        ...(subCategory.includes('shoe') || subCategory.includes('slide') || subCategory.includes('sneaker') ? ['footwear', 'shoes'] : []),
      ].filter(Boolean)));

      const payload = {
        name: name.trim(),
        price: numericPrice,
        category,
        subcategory: subCategory,
        genderTarget,
        garmentOriginType: 'ready_made_boutique',
        imageUrl: finalImg,
        image_url: finalImg,
        images: uploadedImages.map(img => ({
          url: img.url,
          label: img.label || (img.isCover ? 'Cover' : ''),
          colorName: img.colorName || undefined,
        })),
        videoUrl: videoPreview || undefined,
        description: description.trim(),
        tags: enhancedTags,
        colors: enrichedColorsToSubmit,
        sizes: enabledSizes,
        sizeStock,
        stockQuantity: totalStock,
        vendorId: activeVendorId,
        vendorName: vendorProfile.brandName || 'Verified Partner',
        is_published: true,
      };

      const res = await vendorFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const prodId = data.product?.id || `prod-${Date.now()}`;
        setPublishedProductId(prodId);
        setLastPublishedName(name.trim());
        setIsPublishSuccess(true);
        try {
          useStore.getState().fetchProductsFromDb();
        } catch (e) {}
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        onPublishSuccess(prodId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMessage(data.error || 'Failed to publish piece');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Network error while publishing piece');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If successfully published, render celebration confirmation screen
  if (isPublishSuccess) {
    return (
      <div className="p-2 sm:p-4 space-y-6 animate-fadeIn text-center pb-24 select-none">
        <div className="p-6 sm:p-8 rounded-3xl surface-card border border-emerald-500/30 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="h-16 w-16 rounded-3xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono-luxury font-bold uppercase tracking-wider">
              Live on Storefront
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Piece Published!
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-mono-luxury leading-relaxed max-w-sm mx-auto">
              <strong className="text-[var(--text-primary)]">{lastPublishedName}</strong> is now live on your catalog with real-time stock sync and verified checkout.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            {publishedProductId && (
              <Link
                href={`/shop/${publishedProductId}`}
                className="w-full py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold shadow-xl hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>View Live in Shop</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}

            <Link
              href="/vendor-portal/products"
              className="w-full py-3.5 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono-luxury uppercase text-xs font-bold hover:border-[var(--gold-accent)] active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Manage Inventory Drops</span>
            </Link>

            {vendorProfile?.brandName && (
              <Link
                href={`/brand/${encodeURIComponent(vendorProfile.brandName)}`}
                className="w-full py-3.5 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono-luxury uppercase text-xs font-bold hover:border-[var(--gold-accent)] active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Store className="h-3.5 w-3.5" />
                <span>View Brand Storefront</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}

            <button
              type="button"
              onClick={handleResetForm}
              className="w-full py-3 text-[var(--text-secondary)] hover:text-[var(--gold-accent)] text-xs font-mono-luxury uppercase font-bold transition-colors inline-flex items-center justify-center gap-1.5 pt-2 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Publish Another Piece</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn pb-24 select-none">
      
      {/* 1. Header & Department Switcher */}
      <div className="space-y-3">
        {/* Mode Switcher */}
        {onSwitchToBatch && (
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono-luxury font-bold">
            <button
              type="button"
              className="py-2 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm text-center cursor-pointer"
            >
              Single Piece
            </button>
            <button
              type="button"
              onClick={onSwitchToBatch}
              className="py-2 rounded-xl text-[var(--gold-accent)] hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Sparkles className="h-3 w-3 fill-current" />
              <span>Multi-Photo Batch</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold block">
              Catalog Publisher
            </span>
            <h2 className="font-editorial text-2xl font-bold text-[var(--text-primary)] leading-tight">
              Add New Piece
            </h2>
          </div>
          <span className="text-[10px] font-mono-luxury text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            {totalStock} in Stock
          </span>
        </div>

        {/* Gender Tabs (Clean Luxury Underline, No Background Color) */}
        <div className="flex items-center justify-around border-b border-[var(--border-subtle)] pt-1 pb-0">
          {(['male', 'female', 'unisex'] as GenderTarget[]).map((gt) => (
            <button
              key={gt}
              type="button"
              onClick={() => {
                setGenderTarget(gt);
                const list = gt === 'male' ? MALE_CATEGORIES : gt === 'female' ? FEMALE_CATEGORIES : UNISEX_CATEGORIES;
                handleCategorySelect(list[0].id, list[0].generalCat);
              }}
              className={`pb-2.5 px-4 text-xs font-mono-luxury uppercase font-bold tracking-wider transition-all cursor-pointer ${
                genderTarget === gt
                  ? 'text-[var(--gold-accent)] border-b-2 border-[var(--gold-accent)] font-extrabold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border-b-2 border-transparent'
              }`}
            >
              {gt === 'male' ? 'Men' : gt === 'female' ? 'Women' : 'Unisex'}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono-luxury flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Multi-Photo Showcase (Multiple Views & Angles) */}
      <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-[var(--text-primary)] font-mono-luxury flex items-center gap-1.5">
            <Camera className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
            <span>1. Product Showcase Photos <strong className="text-rose-400">*</strong></span>
          </span>
          <span className="text-[10px] font-mono-luxury text-[var(--gold-accent)] font-bold">
            {uploadedImages.length > 0 ? `${uploadedImages.length} ${uploadedImages.length === 1 ? 'Photo' : 'Photos'} Added` : 'Multi-Angle Supported'}
          </span>
        </div>

        <p className="text-[10px] text-[var(--text-muted)] font-mono-luxury leading-relaxed">
          Upload multiple photos to showcase your piece: Front view, back view, styling angles, or close-up craftsmanship (jewelry, shoes, bags & apparel). First photo is your main cover.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="hidden"
        />

        {uploadedImages.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/60 rounded-2xl p-6 text-center cursor-pointer transition-all bg-[var(--bg-primary)] flex flex-col items-center justify-center min-h-[160px]"
          >
            {isProcessingImages ? (
              <div className="space-y-2 py-4 flex flex-col items-center">
                <Sparkles className="h-7 w-7 text-[var(--gold-accent)] animate-spin" />
                <span className="text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)]">
                  Optimizing Photos...
                </span>
              </div>
            ) : (
              <div className="space-y-2 py-3">
                <div className="h-12 w-12 rounded-2xl bg-[var(--gold-subtle)] text-[var(--gold-accent)] flex items-center justify-center mx-auto shadow-sm">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <span className="text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] block">
                  Tap to Select Photos
                </span>
                <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] block max-w-xs mx-auto">
                  Select multiple photos at once: Front view, back view, side profile, fabric or metal details
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
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
                          Syncing to CDN...
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
                        View {idx + 1} {img.isCover ? '(Cover)' : ''}
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

                    {/* Optional Color Tagging (Only shown if vendor taps + Color Tag) */}
                    {(img.showColorTag || img.colorName) && (
                      <div className="pt-1.5 border-t border-[var(--border-subtle)]/60 space-y-1.5 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono-luxury uppercase text-[var(--gold-accent)] font-bold">
                            Optional Colorway
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAiDetectForImage(img.id)}
                            disabled={img.isDetectingColor}
                            className="text-[9px] font-mono-luxury font-bold text-[var(--gold-accent)] hover:text-amber-300 flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
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

                        <div className="flex items-center gap-1.5">
                          <label
                            className="relative flex-shrink-0 h-6 w-6 rounded-md border border-white/20 shadow-inner cursor-pointer overflow-hidden"
                            style={{ backgroundColor: img.colorHex || '#111111' }}
                            title="Click to adjust color shade"
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
                            list="fashion-colors-list-mobile"
                            placeholder="e.g. Red, Black, Gold"
                            value={img.colorName || ''}
                            onChange={(e) => handleAssignColor(img.id, e.target.value)}
                            className="flex-1 min-w-0 px-2 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[10px] font-mono-luxury font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <datalist id="fashion-colors-list-mobile">
                {FASHION_COLOR_PALETTE.map((c) => (
                  <option key={c.name} value={c.name} />
                ))}
              </datalist>

              {/* Add More Photos Card */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-full min-h-[160px] rounded-2xl border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--gold-accent)] bg-[var(--bg-primary)] flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all active:scale-95"
              >
                {isProcessingImages ? (
                  <Sparkles className="h-6 w-6 text-[var(--gold-accent)] animate-spin" />
                ) : (
                  <>
                    <div className="h-8 w-8 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] flex items-center justify-center mb-1.5">
                      <Plus className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-mono-luxury uppercase font-bold text-[var(--text-primary)] block">
                      + Add Photo
                    </span>
                    <span className="text-[9px] font-mono-luxury text-[var(--text-muted)]">
                      View or angle
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Product Video (Optional 3-5s clip) */}
      <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-[var(--text-primary)] font-mono-luxury flex items-center gap-1.5">
            <Video className="h-3.5 w-3.5 text-[var(--gold-accent)]" />
            <span>2. Product Video (Optional)</span>
          </span>
          <span className="text-[10px] font-mono-luxury text-[var(--gold-accent)] font-bold">
            3–5s micro-clip
          </span>
        </div>

        {!videoPreview && videoError && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono-luxury space-y-2 animate-fadeIn">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="flex-1 space-y-0.5">
                <p className="font-bold text-amber-300">{videoError}</p>
                {pendingTrimFile && (
                  <p className="text-[10px] text-[var(--text-secondary)]">
                    We can automatically trim the first 5 seconds for you right now so it loads instantly for shoppers.
                  </p>
                )}
              </div>
            </div>

            {pendingTrimFile && (
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={handleAutoTrimVideo}
                  disabled={isTrimmingVideo}
                  className="px-3 py-1.5 rounded-xl bg-[var(--gold-accent)] text-black font-bold text-xs hover:bg-amber-400 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isTrimmingVideo ? (
                    <>
                      <Sparkles className="h-3.5 w-3.5 animate-spin" />
                      <span>Trimming to 5s ({trimProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Auto-Trim to 5s &amp; Use</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingTrimFile(null);
                    setVideoError('');
                    videoInputRef.current?.click();
                  }}
                  disabled={isTrimmingVideo}
                  className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white text-xs cursor-pointer disabled:opacity-50"
                >
                  Choose Different Video
                </button>
              </div>
            )}
          </div>
        )}

        <div
          onClick={() => {
            if (!videoPreview && !isVideoUploading) videoInputRef.current?.click();
          }}
          className="border-2 border-dashed border-[var(--border-subtle)] rounded-2xl p-4 text-center cursor-pointer transition-all bg-[var(--bg-primary)] flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden"
        >
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleVideoChange}
            className="hidden"
          />

          {isVideoUploading ? (
            <div className="space-y-2 py-4 flex flex-col items-center">
              <Sparkles className="h-7 w-7 text-[var(--gold-accent)] animate-spin" />
              <span className="text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)]">
                Processing Video Clip...
              </span>
            </div>
          ) : videoPreview ? (
            <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-[16/9] max-h-56">
              <video
                src={videoPreview}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-mono-luxury text-emerald-400 uppercase font-bold flex items-center gap-1 border border-emerald-500/30">
                <Check className="h-3 w-3" />
                <span>Product Video Ready</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setVideoPreview(null);
                  setVideoFile(null);
                }}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/80 text-rose-400 hover:text-rose-300 border border-rose-500/30 cursor-pointer shadow-lg active:scale-90 transition-transform"
                aria-label="Remove video"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-1 py-3">
              <Video className="h-7 w-7 text-[var(--gold-accent)] mx-auto" />
              <span className="text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] block">
                Tap to Add Product Video
              </span>
              <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] block max-w-xs mx-auto">
                Short 3–5 second clip of product or movement (Max 15MB)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Title, Price & Category */}
      <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3 shadow-sm font-mono-luxury text-xs">
        <span className="text-xs uppercase font-bold text-[var(--text-primary)] block">
          2. Piece Details & Category
        </span>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[var(--text-secondary)] uppercase font-bold">
              Piece Name / Title <strong className="text-rose-400">*</strong>
            </label>
            {smartDetectedCat && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-fadeIn">
                <Sparkles className="h-3 w-3" />
                <span>Auto-Locked: {smartDetectedCat}</span>
              </span>
            )}
          </div>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Leather Crocodile Palms, Velvet Fila, Silk Boubou, Cuban Chain"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-bold"
          />
          {smartDetectedCat && (
            <p className="mt-1 text-[10px] text-emerald-400/90 font-mono-luxury">
              ✨ Sizing format auto-adjusted to: <strong>{category === 'footwear' ? 'Shoe Sizes (39-46)' : category === 'accessories' ? 'One Size (Jewelry/Accessories)' : 'Apparel Sizes (S-XXL)'}</strong>
            </p>
          )}
        </div>

        <div>
          <label className="block text-[var(--text-secondary)] uppercase mb-1 font-bold">
            Price (₦ NGN) <strong className="text-rose-400">*</strong>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--gold-accent)] font-bold">₦</span>
            <input
              type="text"
              inputMode="numeric"
              required
              value={rawPrice}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="35,000"
              className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-bold"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[var(--text-secondary)] uppercase font-bold text-[10px]">
              Category / Piece Type <strong className="text-rose-400">*</strong>
            </label>
            <span className="text-[9px] text-[var(--gold-accent)] font-bold uppercase">
              {category === 'footwear' ? 'Shoe Sizing' : category === 'accessories' ? 'Jewelry / One-Size' : 'Apparel Sizing'}
            </span>
          </div>

          <select
            value={subCategory}
            onChange={(e) => {
              const selectedId = e.target.value;
              const matched = currentCategoryList.find(c => c.id === selectedId) || UNISEX_CATEGORIES.find(c => c.id === selectedId);
              if (matched) {
                handleCategorySelect(matched.id, matched.generalCat);
                setSmartDetectedCat(matched.label);
              }
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-mono-luxury font-bold focus:border-[var(--gold-accent)] focus:outline-none cursor-pointer"
          >
            {filteredCategoryList.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* AI Generator Button */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[var(--text-secondary)] uppercase font-bold text-[10px]">Description</span>
            <button
              type="button"
              onClick={handleGenerateAiDescription}
              disabled={isGeneratingAi}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 text-[10px] font-bold"
            >
              {isGeneratingAi ? <Sparkles className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              <span>Auto-Write</span>
            </button>
          </div>

          {aiToast && (
            <div className="p-2 rounded-lg bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-[10px] mb-2 animate-fadeIn">
              {aiToast}
            </div>
          )}

          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Fabric specs, tailoring notes, occasion..."
            className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none min-h-[120px] leading-relaxed resize-y overflow-y-auto text-xs"
          />
        </div>
      </div>

      {/* 4. Adaptive Size Stocks */}
      <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-3 shadow-sm font-mono-luxury text-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-[var(--text-primary)] block">
            {category === 'footwear' ? '3. Shoe / Slide Sizing (EU)' : category === 'accessories' ? '3. Inventory Stock' : '3. Ready-to-Wear Sizes'}
          </span>
          <span className="text-[10px] text-[var(--gold-accent)] font-bold">{totalStock} Units</span>
        </div>

        {category === 'accessories' ? (
          <div>
            <label className="block text-[var(--text-secondary)] uppercase mb-1 font-bold text-[11px]">
              Total Available Units
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={sizeStock['One Size']?.quantity === '' ? '' : (sizeStock['One Size']?.quantity ?? 20)}
              placeholder="0"
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleSizeStockChange('One Size', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
            />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {currentSizeList.map((sz) => {
              const isEn = sizeStock[sz]?.enabled;
              const qty = sizeStock[sz]?.quantity;
              return (
                <div
                  key={sz}
                  className={`p-2 rounded-xl border text-center ${
                    isEn ? 'border-[var(--gold-accent)] bg-[var(--bg-primary)]' : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-[var(--text-primary)]">{sz}</span>
                    <input
                      type="checkbox"
                      checked={isEn}
                      onChange={() => handleToggleSize(sz)}
                      className="rounded text-[var(--gold-accent)] cursor-pointer"
                    />
                  </div>
                  {isEn && (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={qty === '' ? '' : (qty ?? 0)}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleSizeStockChange(sz, e.target.value)}
                      className="w-full text-center px-1 py-1 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)] font-mono-luxury"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Colorways & Finishes (Optional for all pieces, including jewelry, bags & footwear) */}
      <div className="p-4 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-2.5 shadow-sm font-mono-luxury text-xs">
        {photoDerivedColors.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>4. Tagged Colorways ({photoDerivedColors.length} Linked From Photos)</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">Linked</span>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
              Linked directly to your uploaded photos. Shoppers will see these exact shades, and tapping each color displays its matching photo.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {photoDerivedColors.map((c: { name: string; hex: string; imageUrl?: string }) => (
                <div
                  key={c.name}
                  className="px-2.5 py-1.5 rounded-xl border border-[var(--gold-accent)]/50 bg-[var(--gold-subtle)] text-[var(--text-primary)] text-[11px] font-bold flex items-center gap-2 shadow-sm"
                >
                  <span
                    className="h-3 w-3 rounded-full border border-white/30 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.name}</span>
                  <span className="text-[9px] text-emerald-400 font-normal">✓ Linked</span>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-[var(--text-muted)] pt-1">
              💡 Change any color name or shade directly on each photo card in Section 1 above.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs uppercase font-bold text-[var(--text-primary)] block">
                4. Colorways &amp; Finishes (Optional)
              </span>
              <button
                type="button"
                onClick={() => setShowCustomColor(!showCustomColor)}
                className="text-[10px] text-[var(--gold-accent)] font-bold hover:underline cursor-pointer"
              >
                {showCustomColor ? 'Close' : '+ Custom Color'}
              </button>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mb-2.5 leading-relaxed">
              Select the shade or finish for this piece (e.g. Gold, Silver, Black, Tan). Leave unselected for single-piece / as pictured.
            </p>

            <div className="flex flex-wrap gap-1.5 items-center">
              {STANDARD_COLORS.map((c) => {
                const isSel = selectedColors.some(sc => sc.name.toLowerCase() === c.name.toLowerCase());
                const isMulti = c.name.toLowerCase().includes('multi');
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => toggleColor(c)}
                    className={`px-2.5 py-1 rounded-xl border text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSel ? 'border-[var(--gold-accent)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-bold ring-1 ring-[var(--gold-accent)] shadow-sm' : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-white/20 shrink-0"
                      style={{
                        background: isMulti
                          ? 'conic-gradient(from 180deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #f59e0b, #ef4444, #ec4899)'
                          : c.hex
                      }}
                    />
                    <span>{c.name}</span>
                  </button>
                );
              })}

              {/* Native Visual Color Wheel Trigger */}
              <label
                title="Pick exact shade"
                className="px-2.5 py-1 rounded-xl border border-[var(--border-subtle)] text-[11px] flex items-center gap-1.5 cursor-pointer hover:border-[var(--gold-accent)] bg-[var(--bg-secondary)]"
              >
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    setShowCustomColor(true);
                  }}
                  className="sr-only"
                />
                <span
                  className="h-2.5 w-2.5 rounded-full border border-white/20 shrink-0"
                  style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                />
                <span className="text-[var(--gold-accent)] font-bold">Color Wheel</span>
              </label>
            </div>

            {/* Custom Color Input */}
            {showCustomColor && (
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--gold-accent)]/50 mt-2 animate-fadeIn">
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  className="h-7 w-7 rounded-lg border border-white/20 cursor-pointer bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Type custom color (e.g. Sage Green, Tie Dye)"
                  className="w-full px-2 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomColor}
                  disabled={!customName.trim()}
                  className="px-3 py-1 rounded-lg bg-[var(--gold-accent)] text-black font-bold text-[10px] uppercase tracking-wider shrink-0 cursor-pointer disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="fixed top-6 left-4 right-4 z-50 p-4 rounded-2xl bg-emerald-500 text-black font-mono-luxury font-bold text-xs flex items-center gap-2 shadow-2xl animate-slideDown">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Submit Buttons */}
      <div className="pt-2 space-y-2.5">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold shadow-xl hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Sparkles className="h-4 w-4 animate-spin text-[var(--gold-accent)]" />
              <span>Publishing Piece...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Publish Piece to Catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={async (e) => {
            e.preventDefault();
            if (isSubmitting) return;
            // Execute quick submit & reset
            const numericPrice = Number(rawPrice.replace(/[^0-9.]/g, ''));
            if (!name.trim()) {
              setErrorMessage('Please enter garment title.');
              return;
            }
            if (!rawPrice || isNaN(numericPrice) || numericPrice <= 0) {
              setErrorMessage('Please enter a valid price in Naira.');
              return;
            }
            setIsSubmitting(true);
            setErrorMessage('');
            try {
              const activeVendorId = getActiveVendorId();
              const finalImageUrl = imagePreview || '/images/products/BlackTrapStarHoodie.jpg';
              const enabledSizes = Object.keys(sizeStock).filter(s => sizeStock[s]?.enabled && Number(sizeStock[s]?.quantity) > 0);
              
              const payload = {
                name: name.trim(),
                price: numericPrice,
                category,
                genderTarget,
                garmentOriginType: 'ready_made_boutique',
                imageUrl: finalImageUrl,
                image_url: finalImageUrl,
                description: description.trim(),
                tags,
                colors: category === 'accessories' ? [] : selectedColors.map(c => ({ name: c.name, hex: c.hex })),
                sizes: enabledSizes.length > 0 ? enabledSizes : ['M', 'L', 'XL'],
                sizeStock,
                stockQuantity: totalStock,
                vendorId: activeVendorId,
                vendorName: vendorProfile.brandName || 'Verified Partner',
                is_published: true,
              };

              const res = await vendorFetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              const data = await res.json();
              if (res.ok && data.success) {
                confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
                setSuccessToast(`"${name.trim()}" published! Form cleared for your next piece.`);
                setTimeout(() => setSuccessToast(''), 4000);
                setName('');
                setRawPrice('');
                setDescription('');
                setImageFile(null);
                setImagePreview(null);
                setTags([]);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                setErrorMessage(data.error || 'Failed to publish piece');
              }
            } catch (err) {
              setErrorMessage('Network error while publishing');
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="w-full py-3.5 rounded-full surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[var(--gold-accent)] font-mono-luxury uppercase text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Publish &amp; Add Another Piece</span>
        </button>
      </div>

    </form>
  );
}
