'use client';

import { vendorFetch, getActiveVendorId } from '@/lib/services/apiClient';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@/lib/store/useStore';
import { GarmentCategory, GenderTarget, VendorSpecialty, getVendorSpecialty, isBoutiqueVendor } from '@/types';
import {
  UploadCloud, CheckCircle2, Sparkles, Plus, Trash2,
  ShoppingBag, Tag, ArrowRight, ExternalLink,
  Wand2, X, Palette, Store, Clock,
  Check, AlertTriangle, ShieldCheck, Shirt, Info, Sparkle, Lock, RotateCcw,
  Footprints, Gem, Crown, Watch, Layers, Video, Play
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import MobileVendorPublish from '@/components/vendor/MobileVendorPublish';
import BatchProductUploadView from '@/components/vendor/BatchProductUploadView';
import VendorLuxuryLoader from '@/components/vendor/VendorLuxuryLoader';
import { compressImage, compressImageToFile } from '@/lib/utils/imageUtils';
import { detectGarmentColor, FASHION_COLOR_PALETTE } from '@/lib/utils/colorDetector';
import { trimVideoInBrowser } from '@/lib/utils/clientVideoTrimmer';

// Standard Apparel Colors Palette for Boutiques & Designers
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

// Department-Specific Categories
export const MALE_CATEGORIES = [
  // Native & Cultural
  { id: 'senator_kaftan', label: 'Senator Sets & Kaftans', generalCat: 'tops' as GarmentCategory, group: 'native' },
  { id: 'agbada_robes', label: 'Grand Agbada 3-Piece', generalCat: 'outerwear' as GarmentCategory, group: 'native' },
  { id: 'jalabiya_tunics', label: 'Jalabiya & Tunics', generalCat: 'tops' as GarmentCategory, group: 'native' },
  { id: 'men_caps_fila', label: 'Aso-Oke Fila & Traditional Caps', generalCat: 'accessories' as GarmentCategory, group: 'native' },
  // Apparel
  { id: 'streetwear_hoodie', label: 'Streetwear Hoodies & Sweatshirts', generalCat: 'outerwear' as GarmentCategory, group: 'apparel' },
  { id: 'suits_blazers', label: 'Suits, Tuxedos & Blazers', generalCat: 'outerwear' as GarmentCategory, group: 'apparel' },
  { id: 'tshirts_tees', label: 'T-Shirts & Graphic Tees', generalCat: 'tops' as GarmentCategory, group: 'apparel' },
  { id: 'shirts_polos', label: 'Luxury Polos & Button-Downs', generalCat: 'tops' as GarmentCategory, group: 'apparel' },
  { id: 'jackets_coats', label: 'Jackets, Bombers & Coats', generalCat: 'outerwear' as GarmentCategory, group: 'apparel' },
  { id: 'jeans_trousers', label: 'Baggy Jeans, Cargo & Denim', generalCat: 'bottoms' as GarmentCategory, group: 'apparel' },
  { id: 'joggers_sweats', label: 'Joggers & Sweatpants', generalCat: 'bottoms' as GarmentCategory, group: 'apparel' },
  { id: 'shorts_sets', label: 'Shorts & Casual Sets', generalCat: 'bottoms' as GarmentCategory, group: 'apparel' },
  { id: 'men_underwears', label: 'Underwear & Loungewear', generalCat: 'bottoms' as GarmentCategory, group: 'apparel' },
  // Footwear
  { id: 'men_slides_palms', label: 'Slides, Palms & Slippers', generalCat: 'footwear' as GarmentCategory, group: 'footwear' },
  { id: 'men_shoes_sneakers', label: 'Sneakers & Casual Trainers', generalCat: 'footwear' as GarmentCategory, group: 'footwear' },
  { id: 'men_shoes_loafers', label: 'Loafers & Dress Shoes', generalCat: 'footwear' as GarmentCategory, group: 'footwear' },
  // Bags
  { id: 'men_bags_backpacks', label: 'Backpacks & Duffels', generalCat: 'accessories' as GarmentCategory, group: 'bags' },
  { id: 'men_bags_crossbody', label: 'Crossbody & Chest Rigs', generalCat: 'accessories' as GarmentCategory, group: 'bags' },
  // Accessories & Jewelry
  { id: 'men_jewelry_chains', label: 'Chains, Necklaces & Rings', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
  { id: 'men_watches', label: 'Luxury Wristwatches', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
  { id: 'men_eyewear', label: 'Sunglasses & Glasses', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
  { id: 'men_caps_hats', label: 'Caps, Hats & Beanies', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
];

export const FEMALE_CATEGORIES = [
  // Native & Cultural
  { id: 'boubou_kaftans', label: 'Silk Boubou, Kaftans & Abayas', generalCat: 'outerwear' as GarmentCategory, group: 'native' },
  { id: 'lace_ankara', label: 'Lace & Ankara Tailored Sets', generalCat: 'tops' as GarmentCategory, group: 'native' },
  // Apparel
  { id: 'dresses_gowns', label: 'Dresses, Gowns & Maxis', generalCat: 'tops' as GarmentCategory, group: 'apparel' },
  { id: 'two_piece_sets', label: 'Two-Piece Co-ord Sets', generalCat: 'tops' as GarmentCategory, group: 'apparel' },
  { id: 'corsets_tops', label: 'Corsets, Crop Tops & Blouses', generalCat: 'tops' as GarmentCategory, group: 'apparel' },
  { id: 'female_streetwear', label: 'Female Hoodies & Sweats', generalCat: 'outerwear' as GarmentCategory, group: 'apparel' },
  { id: 'women_jeans_trousers', label: 'High-Waist Jeans & Cargo', generalCat: 'bottoms' as GarmentCategory, group: 'apparel' },
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

export const UNISEX_CATEGORIES = [
  // Apparel
  { id: 'unisex_hoodie', label: 'Streetwear Hoodies & Sweaters', generalCat: 'outerwear' as GarmentCategory, group: 'apparel' },
  { id: 'unisex_tees', label: 'Graphic Tees & Oversized Shirts', generalCat: 'tops' as GarmentCategory, group: 'apparel' },
  { id: 'unisex_denim', label: 'Denim Jeans & Cargo Pants', generalCat: 'bottoms' as GarmentCategory, group: 'apparel' },
  { id: 'unisex_jackets', label: 'Jackets & Windbreakers', generalCat: 'outerwear' as GarmentCategory, group: 'apparel' },
  // Footwear
  { id: 'unisex_slides_palms', label: 'Slides, Palms & Crocs', generalCat: 'footwear' as GarmentCategory, group: 'footwear' },
  { id: 'unisex_sneakers', label: 'Sneakers & Casual Shoes', generalCat: 'footwear' as GarmentCategory, group: 'footwear' },
  // Accessories & Jewelry
  { id: 'unisex_jewelry', label: 'Chains, Rings & Jewelry', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
  { id: 'unisex_watches', label: 'Wristwatches & Timepieces', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
  { id: 'unisex_sunglasses', label: 'Sunglasses & Eyewear', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
  { id: 'unisex_caps_hats', label: 'Caps, Beanies & Bucket Hats', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
  { id: 'unisex_bags', label: 'Crossbody Bags & Backpacks', generalCat: 'accessories' as GarmentCategory, group: 'accessories' },
];

const APPAREL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const FOOTWEAR_SIZES = ['39', '40', '41', '42', '43', '44', '45', '46'];
const ACCESSORY_SIZES = ['One Size'];

export default function PublishGarmentPage() {
  const { vendorProfile, setVendorProfile } = useStore();

  const vendorSpecialty: VendorSpecialty = getVendorSpecialty(vendorProfile);

  // Verification & Profile Status State
  const [profileStatus, setProfileStatus] = useState<{
    isProfileSaved: boolean;
    isVerified: boolean;
    approvalStatus: string;
    rejectionReason: string;
  } | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Mode: single garment or multi-photo batch drop
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single');

  // Department / Gender Filter: male | female | unisex
  const [genderTarget, setGenderTarget] = useState<GenderTarget>('male');
  const [catFilterTab, setCatFilterTab] = useState<'all' | 'apparel' | 'footwear' | 'accessories'>(
    vendorSpecialty === 'caps' || vendorSpecialty === 'accessories' || vendorSpecialty === 'jewelry' ? 'accessories' :
    vendorSpecialty === 'footwear' ? 'footwear' :
    vendorSpecialty === 'apparel' || vendorSpecialty === 'native_tailoring' || vendorSpecialty === 'streetwear' ? 'apparel' : 'all'
  );

  // Core Form State
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
  const [weightKg, setWeightKg] = useState<string>('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiToast, setAiToast] = useState('');

  // Interactive Colorway State (Apparel & Footwear only)
  const [selectedColors, setSelectedColors] = useState<{ name: string; hex: string }[]>([]);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#2563eb');
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);

  // Dynamic Adaptive Size Stock State
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

  // Photo Upload State (Multi-image support with AI colorway linking)
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

  // Catwalk / Movement Video (Optional 3-5s micro-clip)
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
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Check vendor verification status on mount
  const checkVerification = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      const res = await vendorFetch('/api/vendor/profile');
      const data = await res.json();
      if (res.ok && data.success && data.vendor) {
        const v = data.vendor;
        const verified = !!v.is_verified || !!v.isVerified;
        const spec = v.specialty || v.vendorSpecialty || (isBoutiqueVendor(v) ? 'multi_department' : 'apparel');
        
        setVendorProfile({
          ...v,
          specialty: spec,
          vendorSpecialty: spec
        });

        setProfileStatus({
          isProfileSaved: !!v.isProfileSaved,
          isVerified: verified,
          approvalStatus: verified ? 'approved' : (v.approvalStatus || 'pending'),
          rejectionReason: v.rejectionReason || ''
        });

        if (spec === 'jewelry') {
          setCatFilterTab('accessories');
          setCategory('accessories');
          setSubCategory('men_jewelry_chains');
          setSizeStock({ 'One Size': { enabled: true, quantity: 20 } });
        } else if (spec === 'footwear') {
          setCatFilterTab('footwear');
          setCategory('footwear');
          setSubCategory('men_slides_palms');
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
        }
      }
    } catch (e) {
      console.error('Error verifying vendor status:', e);
    } finally {
      setIsLoadingAuth(false);
    }
  }, [setVendorProfile]);

  useEffect(() => {
    checkVerification();
  }, [checkVerification]);

  // Auto-scroll to top whenever an error is encountered so user sees it instantly
  useEffect(() => {
    if (errorMessage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [errorMessage]);

  // Update categories when genderTarget or vendorSpecialty changes
  useEffect(() => {
    const list = genderTarget === 'male' ? MALE_CATEGORIES : genderTarget === 'female' ? FEMALE_CATEGORIES : UNISEX_CATEGORIES;
    const allowed = list.filter(c => {
      if (vendorSpecialty === 'caps') return c.group === 'accessories' && (c.id.includes('cap') || c.id.includes('hat') || c.id.includes('fila'));
      if (vendorSpecialty === 'accessories' || vendorSpecialty === 'jewelry') return c.group === 'accessories';
      if (vendorSpecialty === 'footwear') return c.group === 'footwear';
      if (vendorSpecialty === 'native_tailoring' || vendorSpecialty === 'streetwear' || vendorSpecialty === 'apparel') return c.group === 'apparel';
      if (catFilterTab === 'all') return true;
      return c.group === catFilterTab;
    });

    if (allowed.length > 0 && !allowed.some(c => c.id === subCategory)) {
      handleCategorySelect(allowed[0].id, allowed[0].generalCat);
    }
  }, [genderTarget, vendorSpecialty, catFilterTab]);

  // Adaptive Sizing Initializer based on category type
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
      setAiToast('Please enter a product title first to generate description with AI.');
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
        if (data.description) {
          setDescription(data.description);
        }
        if (data.tags && Array.isArray(data.tags)) {
          setTags(prev => Array.from(new Set([...prev, ...data.tags])));
        }
        if (!rawPrice && data.suggestedPrice) {
          setRawPrice(Number(data.suggestedPrice).toLocaleString('en-NG'));
        }
        setAiToast('AI generated product description, material specs, and tags!');
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
        setTimeout(() => setAiToast(''), 4000);
      }
    } catch (e) {
      console.error('AI generation error:', e);
      setAiToast('AI generation timed out. Please try again.');
      setTimeout(() => setAiToast(''), 3500);
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
    if (!customColorName.trim()) return;
    const newColor = { name: customColorName.trim(), hex: customColorHex };
    setSelectedColors([...selectedColors, newColor]);
    setCustomColorName('');
    setShowCustomColorPicker(false);
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
      const cleanTag = tagInput.trim().replace(/^#/, '');
      if (cleanTag && !tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tToRemove: string) => {
    setTags(tags.filter(t => t !== tToRemove));
  };

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter a product title.');
      return;
    }
    const numericPrice = Number(rawPrice.replace(/,/g, ''));
    if (!rawPrice || isNaN(numericPrice) || numericPrice <= 0) {
      setErrorMessage('Please enter a valid price in Naira.');
      return;
    }

    const enabledSizes = Object.keys(sizeStock).filter(s => sizeStock[s]?.enabled && Number(sizeStock[s]?.quantity) > 0);
    if (enabledSizes.length === 0) {
      setErrorMessage(category === 'accessories' ? 'Please specify available stock quantity.' : 'Please enable at least one size with stock quantity.');
      return;
    }

    if (uploadedImages.length === 0 && !imagePreview) {
      setErrorMessage('Please upload at least one product photo for your piece.');
      return;
    }

    setIsSubmitting(true);
    const activeVendorId = getActiveVendorId();

    try {
      const coverImg = uploadedImages.find((i) => i.isCover) || uploadedImages[0];
      const finalImageUrl = coverImg?.url || imagePreview;
      if (!finalImageUrl || typeof finalImageUrl !== 'string' || !finalImageUrl.trim() || finalImageUrl.startsWith('/images/products/BlackTrapStar')) {
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
              imageUrl: matchedImg?.url || finalImageUrl
            };
          }) : (category === 'accessories' ? [] : [{ name: 'As Pictured', hex: '#111111', imageUrl: finalImageUrl }])
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
        imageUrl: finalImageUrl,
        image_url: finalImageUrl,
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
        stockQuantity: totalStockCount,
        weightKg: weightKg && !isNaN(parseFloat(weightKg)) ? parseFloat(weightKg) : undefined,
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
        setCreatedProductId(data.product?.id || `prod-${Date.now()}`);
        setIsSuccess(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e6c367', '#ffffff', '#10b981']
        });
      } else {
        setErrorMessage(data.error || 'Failed to publish piece to catalog.');
      }
    } catch (err: any) {
      console.error('Publish error:', err);
      setErrorMessage('Error connecting to publishing service. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setRawPrice('');
    setWeightKg('');
    setDescription('');
    setImageFile(null);
    setImagePreview(null);
    setVideoFile(null);
    setVideoPreview(null);
    setVideoError('');
    setTags([]);
    setUploadedImages([]);
    setSelectedColors([]);
    setIsSuccess(false);
    setCreatedProductId(null);
    setErrorMessage('');
  };

  const currentCategoryList = genderTarget === 'male' ? MALE_CATEGORIES : genderTarget === 'female' ? FEMALE_CATEGORIES : UNISEX_CATEGORIES;
  const filteredCategoryList = currentCategoryList.filter(c => {
    if (vendorSpecialty === 'caps') return c.group === 'accessories' && (c.id.includes('cap') || c.id.includes('hat') || c.id.includes('fila'));
    if (vendorSpecialty === 'accessories' || vendorSpecialty === 'jewelry') return c.group === 'accessories';
    if (vendorSpecialty === 'footwear') return c.group === 'footwear';
    if (vendorSpecialty === 'native_tailoring' || vendorSpecialty === 'streetwear' || vendorSpecialty === 'apparel') return c.group === 'apparel';
    if (catFilterTab === 'all') return true;
    return c.group === catFilterTab;
  });
  const currentSizeList = category === 'footwear' ? FOOTWEAR_SIZES : category === 'accessories' ? ACCESSORY_SIZES : APPAREL_SIZES;
  const enabledSizes = Object.keys(sizeStock).filter(s => sizeStock[s]?.enabled);

  const totalStockCount = Object.values(sizeStock)
    .filter(s => s?.enabled)
    .reduce((sum, s) => sum + (s?.quantity === '' ? 0 : Number(s?.quantity || 0)), 0);

  const isVerified = profileStatus?.isVerified || profileStatus?.approvalStatus === 'approved';
  const isRejected = profileStatus?.approvalStatus === 'rejected';
  const isPending = profileStatus?.approvalStatus === 'pending' || (profileStatus?.isProfileSaved && !isVerified && !isRejected);

  if (isLoadingAuth) {
    return <VendorLuxuryLoader label="Verifying Boutique Authorization & Status..." />;
  }

  // =========================================================================
  // STRICT VERIFICATION GATE: If vendor is not approved, block publishing!
  // =========================================================================
  if (!isVerified) {
    return (
      <div className="p-6 sm:p-12 max-w-3xl mx-auto space-y-8 animate-fadeIn text-center">
        {isRejected ? (
          <div className="p-8 sm:p-12 rounded-3xl surface-card border border-rose-500/30 space-y-6 shadow-xl relative overflow-hidden">
            <div className="h-16 w-16 rounded-2xl bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="h-8 w-8 text-rose-500" />
            </div>

            <div className="space-y-3 max-w-lg mx-auto">
              <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-mono-luxury font-bold uppercase tracking-wider">
                Action Required · Store Profile Returned
              </span>
              <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                Store Profile Returned For Correction
              </h1>
              
              {profileStatus?.rejectionReason && (
                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-rose-500/30 text-left space-y-1 mt-2">
                  <span className="text-[10px] font-mono-luxury uppercase text-rose-400 font-bold block">
                    Admin Feedback
                  </span>
                  <p className="text-xs text-[var(--text-primary)] font-mono-luxury leading-relaxed font-semibold">
                    "{profileStatus.rejectionReason}"
                  </p>
                </div>
              )}

              <p className="text-xs text-[var(--text-secondary)] font-mono-luxury leading-relaxed pt-1">
                You cannot publish products or create drops until your store profile is updated and approved by Super Admin.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/vendor-portal/atelier"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-mono-luxury uppercase text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Update Store Profile & Resubmit</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : isPending ? (
          <div className="p-8 sm:p-12 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-6 shadow-xl">
            <div className="h-16 w-16 rounded-2xl bg-[var(--bg-secondary)] text-amber-400 border border-[var(--border-subtle)] flex items-center justify-center mx-auto shadow-sm">
              <Clock className="h-8 w-8 animate-pulse" />
            </div>

            <div className="space-y-3 max-w-lg mx-auto">
              <span className="px-3 py-1 rounded-full bg-[var(--bg-secondary)] text-amber-400 border border-amber-500/30 text-[10px] font-mono-luxury font-bold uppercase tracking-wider">
                Account Status · Pending Review
              </span>
              <h1 className="font-editorial text-2xl sm:text-3xl font-normal text-[var(--text-primary)]">
                Store Profile Under Executive Review
              </h1>
              <p className="text-xs text-[var(--text-secondary)] font-mono-luxury leading-relaxed">
                Your store details and delivery rates have been submitted. Super Admin is reviewing your account. Product publishing will unlock automatically once approved.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/vendor-portal/atelier"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono-luxury uppercase text-xs font-bold hover:border-[var(--gold-accent)] transition-all shadow-sm"
              >
                <span>View Submitted Profile</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={checkVerification}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold hover:opacity-90 transition-all shadow-sm cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Check Status</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 sm:p-12 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-6 shadow-xl">
            <div className="h-16 w-16 rounded-2xl bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 flex items-center justify-center mx-auto shadow-sm">
              <Store className="h-8 w-8" />
            </div>

            <div className="space-y-3 max-w-lg mx-auto">
              <span className="px-3 py-1 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 text-[10px] font-mono-luxury font-bold uppercase tracking-wider">
                Setup Required · Profile Incomplete
              </span>
              <h1 className="font-editorial text-2xl sm:text-3xl font-normal text-[var(--text-primary)]">
                Complete Store Profile to Enable Publishing
              </h1>
              <p className="text-xs text-[var(--text-secondary)] font-mono-luxury leading-relaxed">
                You must set up your brand identity, turnaround times, and delivery zone rates before publishing pieces to the catalog.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/vendor-portal/atelier"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold hover:opacity-90 transition-all shadow-md hover:scale-105 active:scale-95"
              >
                <span>Complete Store Profile</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // AUTHORIZED / APPROVED PUBLISHING FORM
  // =========================================================================
  if (uploadMode === 'batch') {
    return (
      <div className="p-4 sm:p-10 max-w-5xl mx-auto">
        <BatchProductUploadView
          vendorProfile={vendorProfile}
          getActiveVendorId={getActiveVendorId}
          onSwitchToSingle={() => setUploadMode('single')}
        />
      </div>
    );
  }

  return (
    <>
      {/* 1. DEDICATED MOBILE VENDOR PUBLISH */}
      <div className="block md:hidden">
        <MobileVendorPublish
          onPublishSuccess={(productId) => {
            setCreatedProductId(productId);
          }}
          vendorProfile={vendorProfile}
          getActiveVendorId={getActiveVendorId}
          onSwitchToBatch={() => setUploadMode('batch')}
        />
      </div>

      {/* 2. DESKTOP LUXURY VENDOR PUBLISH */}
      <div className="hidden md:block p-6 sm:p-10 max-w-5xl mx-auto space-y-8 animate-fadeIn pb-24">
      
      {/* Mode Switcher */}
      <div className="flex items-center justify-between gap-4 p-1.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] w-fit">
        <button
          type="button"
          onClick={() => setUploadMode('single')}
          className={`px-5 py-2.5 rounded-xl text-xs font-mono-luxury font-bold transition-all cursor-pointer ${
            uploadMode === 'single'
              ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Single Piece Form
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('batch')}
          className="px-5 py-2.5 rounded-xl text-xs font-mono-luxury font-bold text-[var(--gold-accent)] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 fill-current" />
          <span>Multi-Photo Batch Drop (Bulk Upload)</span>
        </button>
      </div>

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold">
              Product & Collection Catalog Publisher
            </span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-1">
            Add Product / Drop Piece
          </h1>
          <p className="text-xs font-mono-luxury text-[var(--text-secondary)] mt-1">
            Publish apparel, footwear, slides, caps, jewelry, and luxury accessories to your live storefront.
          </p>
        </div>

        {/* Gender / Department Switcher (Clean Underline Tabs, No Background Color) */}
        <div className="flex items-center gap-6 border-b border-[var(--border-subtle)] shrink-0 pb-0">
          {(['male', 'female', 'unisex'] as GenderTarget[]).map((gt) => (
            <button
              key={gt}
              type="button"
              onClick={() => setGenderTarget(gt)}
              className={`pb-2 px-1 text-xs font-mono-luxury uppercase font-bold tracking-wider transition-all cursor-pointer ${
                genderTarget === gt
                  ? 'text-[var(--gold-accent)] border-b-2 border-[var(--gold-accent)] font-extrabold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border-b-2 border-transparent'
              }`}
            >
              <span>{gt === 'male' ? 'Men' : gt === 'female' ? 'Women' : 'Unisex'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono-luxury flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Modal / Banner */}
      {isSuccess && (
        <div className="p-6 sm:p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-editorial text-2xl font-bold text-[var(--text-primary)]">
                Piece Published to Catalog!
              </h3>
              <p className="text-xs font-mono-luxury text-[var(--text-secondary)]">
                Your piece is live with real-time stock sync and verified checkout.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {createdProductId && (
              <Link
                href={`/shop/${createdProductId}`}
                target="_blank"
                className="px-5 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold hover:opacity-90 transition-all shadow-md flex items-center gap-2"
              >
                <span>View Live Product</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}

            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono-luxury uppercase text-xs font-bold hover:border-[var(--gold-accent)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Publish Another Piece</span>
            </button>
          </div>
        </div>
      )}

      {/* Publishing Form */}
      {!isSuccess && (
        <form onSubmit={handlePublishSubmit} className="space-y-8">
          
          {/* Section 1: Showcase Photos (Multiple Angles & Views) */}
          <div className="p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-primary)] font-bold flex items-center gap-2">
                <span>1. Product Showcase Photos (Multiple Views & Angles)</span>
                <strong className="text-rose-400">*</strong>
              </label>
              <span className="text-[10px] font-mono-luxury text-[var(--gold-accent)] font-bold">
                {uploadedImages.length > 0
                  ? `${uploadedImages.length} ${uploadedImages.length === 1 ? 'Photo' : 'Photos'} Added`
                  : 'Multi-Angle & High-Res Supported'}
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] font-mono-luxury leading-relaxed">
              Upload multiple photos to showcase your piece: Front view, back view, styling angles, or close-up craftsmanship (jewelry, shoes, bags & apparel). The first photo is your main catalog cover.
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
                className="border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/60 rounded-3xl p-10 text-center cursor-pointer transition-all bg-[var(--bg-primary)] group relative overflow-hidden"
              >
                {isProcessingImages ? (
                  <div className="space-y-3 py-6 flex flex-col items-center">
                    <Sparkles className="h-9 w-9 text-[var(--gold-accent)] animate-spin" />
                    <span className="text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)]">
                      Optimizing Photos for Fast Loading...
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3 py-6">
                    <div className="h-14 w-14 rounded-2xl bg-[var(--gold-subtle)] text-[var(--gold-accent)] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-sm">
                      <UploadCloud className="h-7 w-7" />
                    </div>
                    <div>
                      <span className="text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] block">
                        Click to Upload Product Photos
                      </span>
                      <span className="text-[11px] font-mono-luxury text-[var(--text-secondary)]">
                        Select multiple photos at once: Front view, back view, side profile, fabric or metal details
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {uploadedImages.map((img, idx) => (
                    <div
                      key={img.id}
                      className="relative rounded-2xl overflow-hidden surface-card border border-[var(--border-subtle)] flex flex-col group/card shadow-sm"
                    >
                      <div className="relative h-44 w-full bg-black/40 overflow-hidden">
                        <Image
                          src={img.url}
                          alt={`Product view ${idx + 1}`}
                          fill
                          unoptimized
                          className="object-cover"
                        />

                        {/* Main Cover Badge or Set Cover Button */}
                        {idx === 0 ? (
                          <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-full bg-[var(--gold-accent)] text-black text-[9px] font-mono-luxury font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-md">
                            <Check className="h-3 w-3 stroke-[3]" />
                            <span>Main Cover</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetCover(img.id)}
                            className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-full bg-black/80 hover:bg-black text-white text-[9px] font-mono-luxury font-bold uppercase tracking-wider border border-white/20 transition-all cursor-pointer shadow-md"
                          >
                            Set as Cover
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/80 text-rose-400 hover:text-rose-300 border border-rose-500/30 cursor-pointer shadow-lg active:scale-90 transition-transform"
                          title="Remove photo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Photo View Label & Optional Color Tag */}
                      <div className="p-2.5 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono-luxury uppercase text-[var(--text-muted)] font-bold">
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

                        {/* Quick View Presets (Front, Back, Detail, Side, Model) */}
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

                        {/* Optional Color Tagging (Only shown if vendor clicks + Color Tag) */}
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
                                list="fashion-colors-list-desktop"
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

                  <datalist id="fashion-colors-list-desktop">
                    {FASHION_COLOR_PALETTE.map((c) => (
                      <option key={c.name} value={c.name} />
                    ))}
                  </datalist>

                  {/* Add More Photos Card */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="h-full min-h-[180px] rounded-2xl border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--gold-accent)] bg-[var(--bg-primary)] flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all active:scale-95 group"
                  >
                    {isProcessingImages ? (
                      <Sparkles className="h-7 w-7 text-[var(--gold-accent)] animate-spin" />
                    ) : (
                      <>
                        <div className="h-10 w-10 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Plus className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] block">
                          + Add Photo
                        </span>
                        <span className="text-[10px] font-mono-luxury text-[var(--text-muted)]">
                          Front, back, angle, or detail view
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Product Video (Optional 3–5s micro-clip) */}
          <div className="p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-[var(--text-primary)] font-mono-luxury flex items-center gap-2">
                <Video className="h-4 w-4 text-[var(--gold-accent)]" />
                <span>2. Product Video (Optional)</span>
              </span>
              <span className="text-[11px] font-mono-luxury text-[var(--gold-accent)] font-bold">
                3–5s micro-clip
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] font-mono-luxury leading-relaxed">
              Upload a short 3–5 second video clip of the product in motion. This video autoplays smoothly in the catalog to showcase the piece.
            </p>

            {!videoPreview && videoError && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono-luxury space-y-2.5 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="font-bold text-amber-300">{videoError}</p>
                    {pendingTrimFile && (
                      <p className="text-[11px] text-[var(--text-secondary)]">
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
                          <span>Auto-Trim to First 5s &amp; Use</span>
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
                      className="px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white text-xs cursor-pointer disabled:opacity-50"
                    >
                      Choose Different Video
                    </button>
                  </div>
                )}
              </div>
            )}

            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleVideoChange}
              className="hidden"
            />

            <div
              onClick={() => {
                if (!videoPreview && !isVideoUploading) videoInputRef.current?.click();
              }}
              className="border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--gold-accent)]/60 rounded-2xl p-6 text-center cursor-pointer transition-all bg-[var(--bg-primary)] flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden"
            >
              {isVideoUploading ? (
                <div className="space-y-2 py-4 flex flex-col items-center">
                  <Sparkles className="h-8 w-8 text-[var(--gold-accent)] animate-spin" />
                  <span className="text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)]">
                    Processing Video Clip...
                  </span>
                </div>
              ) : videoPreview ? (
                <div className="relative w-full max-w-md mx-auto rounded-xl overflow-hidden bg-black aspect-[16/9]">
                  <video
                    src={videoPreview}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono-luxury text-emerald-400 uppercase font-bold flex items-center gap-1 border border-emerald-500/30">
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
                    title="Remove video"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2 py-3">
                  <div className="h-12 w-12 rounded-2xl bg-[var(--gold-subtle)] text-[var(--gold-accent)] flex items-center justify-center mx-auto shadow-sm">
                    <Video className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-mono-luxury uppercase font-bold text-[var(--text-primary)] block">
                    Click to Upload Product Video
                  </span>
                  <span className="text-[11px] font-mono-luxury text-[var(--text-secondary)] block max-w-sm mx-auto">
                    Short 3–5s video clip of the product (Max 15MB, MP4 / WebM / MOV)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Piece Details & Pricing */}
          <div className="p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-6">
            <span className="text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-primary)] font-bold block">
              3. Piece Details & Pricing
            </span>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-bold">
                  Piece Title / Name <strong className="text-rose-400">*</strong>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cuban Chain, Leather Palms, Puffer Jacket, Silk Boubou"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-bold focus:border-[var(--gold-accent)] focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-bold">
                  Retail Price (₦ NGN) <strong className="text-rose-400">*</strong>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono-luxury text-[var(--gold-accent)] font-bold">
                    ₦
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={rawPrice}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder="35,000"
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-bold focus:border-[var(--gold-accent)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] font-bold">
                    Shipping Weight (kg)
                  </label>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono-luxury">
                    Optional
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="30"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="e.g. 0.15 or 1.2"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-bold focus:border-[var(--gold-accent)] focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono-luxury text-[var(--text-muted)] font-bold">
                    KG
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] font-mono-luxury -mt-3">
              💡 <strong>Weight Note:</strong> Enter actual parcel weight (e.g. 0.15kg for 150g Cuban chain, 0.8kg for slides, 2.2kg for heavy jacket/backpack). Couriers bill by exact scale weight. If left blank, our system uses a safe category estimate.
            </p>

            {/* Department Category Select */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] font-bold">
                  Garment / Accessory Category <strong className="text-rose-400">*</strong>
                </label>
                <span className="text-[10px] font-mono-luxury text-[var(--gold-accent)] font-bold uppercase">
                  {category === 'footwear' ? 'Shoe Sizing Active' : category === 'accessories' ? 'Jewelry / One-Size Stock Active' : 'Apparel Sizing Active'}
                </span>
              </div>

              {/* Category Segment Tabs with Lucide Icons */}
              <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-none pb-1">
                {[
                  { id: 'all', label: 'All Categories', icon: Layers, allowed: vendorSpecialty === 'multi_department' },
                  { id: 'apparel', label: 'Apparel & Sets', icon: Shirt, allowed: vendorSpecialty === 'multi_department' || vendorSpecialty === 'apparel' || vendorSpecialty === 'native_tailoring' || vendorSpecialty === 'streetwear' },
                  { id: 'footwear', label: 'Footwear & Slides', icon: Footprints, allowed: vendorSpecialty === 'multi_department' || vendorSpecialty === 'footwear' },
                  { id: 'accessories', label: 'Caps, Bags & Jewelry', icon: Sparkles, allowed: vendorSpecialty === 'multi_department' || vendorSpecialty === 'jewelry' || vendorSpecialty === 'caps' || vendorSpecialty === 'accessories' },
                ].filter(t => t.allowed).map((tab) => {
                  const IconComp = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCatFilterTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono-luxury uppercase font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        catFilterTab === tab.id
                          ? 'bg-[var(--gold-accent)] text-black shadow-sm'
                          : 'bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white'
                      }`}
                    >
                      <IconComp className="h-3.5 w-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {filteredCategoryList.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id, cat.generalCat)}
                    className={`p-3 rounded-xl border text-left text-xs font-mono-luxury transition-all cursor-pointer ${
                      subCategory === cat.id
                        ? 'border-[var(--gold-accent)] bg-[var(--gold-subtle)] text-[var(--text-primary)] font-bold shadow-sm ring-1 ring-[var(--gold-accent)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--gold-accent)]/50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Generator Button & Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-secondary)] font-bold">
                  Editorial Description & Material Notes
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAiDescription}
                  disabled={isGeneratingAi}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 text-[11px] font-mono-luxury uppercase font-bold hover:bg-[var(--gold-accent)] hover:text-black transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingAi ? (
                    <>
                      <Sparkles className="h-3 w-3 animate-spin" />
                      <span>Writing with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      <span>Auto-Generate with AI</span>
                    </>
                  )}
                </button>
              </div>

              {aiToast && (
                <div className="p-2.5 rounded-xl bg-[var(--gold-subtle)] text-[var(--gold-accent)] text-[11px] font-mono-luxury flex items-center gap-2 animate-fadeIn">
                  <Sparkle className="h-3.5 w-3.5 shrink-0" />
                  <span>{aiToast}</span>
                </div>
              )}

              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe material quality, leather grade, metal type, occasion, and care instructions..."
                className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none min-h-[140px] leading-relaxed resize-y overflow-y-auto"
              />
            </div>

          </div>

          {/* Section 4: Colorway / Metal Tone Variations */}
          <div className="p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4">
            {photoDerivedColors.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-primary)] font-bold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>4. Tagged Colorways ({photoDerivedColors.length} Linked From Photos)</span>
                    </span>
                    <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)] mt-1">
                      These colorways are linked to your uploaded photos. Shoppers tapping each color will view its matching photo.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  {photoDerivedColors.map((c: { name: string; hex: string; imageUrl?: string }) => (
                    <div
                      key={c.name}
                      className="px-3.5 py-2 rounded-xl border border-[var(--gold-accent)]/50 bg-[var(--gold-subtle)] text-[var(--text-primary)] text-xs font-mono-luxury font-bold flex items-center gap-2.5 shadow-sm"
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-white/30 shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                      <span className="text-[10px] text-emerald-400 font-normal">✓ Linked</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div>
                  <span className="text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-primary)] font-bold block">
                    4. Available Colors / Metal Tone (Optional)
                  </span>
                  <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)] mt-0.5">
                    Select the shade or finish for this piece (e.g. Gold, Silver, Black, Tan). Leave unselected for single-piece / as pictured.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {STANDARD_COLORS.map((c) => {
                    const isSelected = selectedColors.some(sc => sc.name.toLowerCase() === c.name.toLowerCase());
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => toggleColor(c)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-mono-luxury flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--gold-accent)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-bold shadow-sm ring-1 ring-[var(--gold-accent)]'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'
                        }`}
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-white/20 shrink-0"
                          style={{
                            background: c.name.toLowerCase().includes('multi')
                              ? 'conic-gradient(from 180deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #f59e0b, #ef4444, #ec4899)'
                              : c.hex
                          }}
                        />
                        <span>{c.name}</span>
                        {isSelected && <Check className="h-3 w-3 text-[var(--gold-accent)]" />}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setShowCustomColorPicker(!showCustomColorPicker)}
                    className="px-3 py-1.5 rounded-xl border border-dashed border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-xs font-mono-luxury text-[var(--gold-accent)] flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Custom Shade</span>
                  </button>
                </div>

                {showCustomColorPicker && (
                  <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center gap-3 animate-fadeIn mt-3">
                    <input
                      type="color"
                      value={customColorHex}
                      onChange={(e) => setCustomColorHex(e.target.value)}
                      className="h-9 w-9 rounded-lg border border-[var(--border-subtle)] cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={customColorName}
                      onChange={(e) => setCustomColorName(e.target.value)}
                      placeholder="e.g. Royal Emerald, 18K Yellow Gold"
                      className="px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none flex-1 font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomColor}
                      className="px-4 py-2 rounded-xl bg-[var(--gold-accent)] text-black text-xs font-mono-luxury uppercase font-bold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 5: Adaptive Size Stock & Inventory */}
          <div className="p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-primary)] font-bold block">
                  {category === 'footwear'
                    ? '5. Shoe / Slide Sizing & Inventory (EU Sizes)'
                    : category === 'accessories'
                    ? '4. Accessory / Jewelry Stock Units'
                    : '5. Ready-to-Wear Size Stocks & Units'}
                </span>
                <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)] mt-0.5">
                  {category === 'footwear'
                    ? 'Enable available shoe sizes and specify stock units per pair.'
                    : category === 'accessories'
                    ? 'No size complexity. Simply specify total units available in inventory.'
                    : 'Set available quantity per standard ready-to-wear sizing.'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono-luxury text-[var(--text-muted)] uppercase block">Total Available</span>
                <span className="text-base font-editorial font-bold text-[var(--gold-accent)]">{totalStockCount} Units</span>
              </div>
            </div>

            {/* If Accessory: Super Simple Single Quantity Input */}
            {category === 'accessories' ? (
              <div className="p-5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] max-w-sm">
                <label className="block text-[11px] font-mono-luxury uppercase font-bold text-[var(--text-secondary)] mb-2">
                  Total Units in Stock
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={sizeStock['One Size']?.quantity === '' ? '' : (sizeStock['One Size']?.quantity ?? 20)}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleSizeStockChange('One Size', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-mono-luxury"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono-luxury text-[var(--text-muted)] font-bold">
                    One Size
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {/* Size Cards with Direct Quantity Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                  {currentSizeList.map((size) => {
                    const isEnabled = sizeStock[size]?.enabled;
                    const qty = sizeStock[size]?.quantity;

                    return (
                      <div
                        key={size}
                        className={`p-3 rounded-2xl border transition-all ${
                          isEnabled
                            ? 'border-[var(--gold-accent)] bg-[var(--bg-primary)] shadow-sm'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-editorial text-base font-bold text-[var(--text-primary)]">{size}</span>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => handleToggleSize(size)}
                            className="rounded text-[var(--gold-accent)] border-[var(--border-subtle)] cursor-pointer"
                          />
                        </div>

                        {isEnabled && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono-luxury uppercase text-[var(--text-secondary)] block">Qty</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={qty === '' ? '' : (qty ?? 0)}
                              placeholder="0"
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleSizeStockChange(size, e.target.value)}
                              className="w-full px-2 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-bold focus:outline-none text-center font-mono-luxury focus:border-[var(--gold-accent)]"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Discovery Tags */}
          <div className="p-6 sm:p-8 rounded-3xl surface-card border border-[var(--border-subtle)] space-y-4">
            <div>
              <span className="text-xs font-mono-luxury uppercase tracking-wider text-[var(--text-primary)] font-bold block">
                {category === 'accessories' ? '4. Search & Discovery Tags' : '5. Search & Discovery Tags'}
              </span>
              <p className="text-[11px] font-mono-luxury text-[var(--text-secondary)] mt-0.5">
                Type a keyword and press <strong className="text-[var(--text-primary)]">Enter</strong> (e.g. Palms, Slides, Fila, Kaftan, Chains, Agbada).
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tag and press enter..."
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
              />

              <div className="flex flex-wrap items-center gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--gold-subtle)] text-[var(--gold-accent)] border border-[var(--gold-accent)]/30 text-xs font-mono-luxury font-bold"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="pt-4 flex items-center justify-between gap-4 border-t border-[var(--border-subtle)]">
            <Link
              href="/vendor-portal"
              className="px-6 py-3.5 rounded-full surface-card border border-[var(--border-subtle)] text-xs font-mono-luxury uppercase font-bold text-[var(--text-secondary)] hover:text-white transition-all"
            >
              Cancel
            </Link>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={async (e) => {
                  e.preventDefault();
                  if (isSubmitting) return;
                  const numericPrice = Number(rawPrice.replace(/[^0-9.]/g, ''));
                  if (!name.trim()) {
                    setErrorMessage('Please enter garment name.');
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
                      stockQuantity: totalStockCount,
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
                      confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
                      resetForm();
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
                className="px-6 py-4 rounded-full surface-card border border-[var(--border-subtle)] hover:border-[var(--gold-accent)] text-[var(--gold-accent)] font-mono-luxury uppercase text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Publish &amp; Add Another Piece</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury uppercase text-xs font-bold tracking-wider hover:opacity-90 transition-all shadow-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin text-[var(--gold-accent)]" />
                    <span>Publishing Piece to Catalog...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Publish Piece to Catalog</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      )}

    </div>
    </>
  );
}
