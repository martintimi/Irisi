'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GarmentCategory, GenderTarget, getVendorSpecialty, VendorSpecialty } from '@/types';
import {
  UploadCloud, Sparkles, Plus, Trash2, Check,
  Layers, ChevronDown, CheckCircle2, ArrowRight,
  AlertCircle, AlertTriangle, Eye, RefreshCw, X, ShieldCheck, Edit3, Palette,
  Shirt, Footprints, Gem, SlidersHorizontal, ChevronUp, Video, Play
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { vendorFetch } from '@/lib/services/apiClient';
import { compressImage, compressImageToFile } from '@/lib/utils/imageUtils';
import { trimVideoInBrowser } from '@/lib/utils/clientVideoTrimmer';

interface BatchItemImage {
  id: string;
  url: string;
  label?: string;
}

interface BatchItem {
  id: string;
  name: string;
  price: string;
  category: GarmentCategory;
  subCategory: string;
  genderTarget: GenderTarget;
  imageFile: File | null;
  imagePreview: string;
  additionalImages?: BatchItemImage[];
  videoFile?: File | null;
  videoPreview?: string | null;
  isVideoUploading?: boolean;
  videoError?: string;
  pendingTrimVideo?: File | null;
  isTrimmingVideo?: boolean;
  trimProgress?: number;
  selectedColors: { name: string; hex: string }[];
  isCustomColorOpen?: boolean;
  customColorText?: string;
  customColorHex?: string;
  sizeStock: { [size: string]: number | string };
}

interface BatchProductUploadViewProps {
  vendorProfile: any;
  getActiveVendorId: () => string;
  onSwitchToSingle?: () => void;
}

type DropMode = 'apparel' | 'footwear' | 'jewelry';

const ALL_CATEGORY_OPTIONS = [
  // Tops / Streetwear
  { id: 'streetwear_hoodie', label: 'Streetwear Hoodies & Sweaters', generalCat: 'outerwear' as GarmentCategory, dept: 'unisex' as GenderTarget, group: 'apparel' },
  { id: 'unisex_tees', label: 'Graphic Tees & Shirts', generalCat: 'tops' as GarmentCategory, dept: 'unisex' as GenderTarget, group: 'apparel' },
  { id: 'senator_kaftan', label: 'Senator & Kaftan Sets', generalCat: 'tops' as GarmentCategory, dept: 'male' as GenderTarget, group: 'apparel' },
  { id: 'boubou_kaftans', label: 'Silk Boubou & Kaftans', generalCat: 'outerwear' as GarmentCategory, dept: 'female' as GenderTarget, group: 'apparel' },
  { id: 'two_piece_sets', label: 'Two-Piece Co-ord Sets', generalCat: 'tops' as GarmentCategory, dept: 'female' as GenderTarget, group: 'apparel' },
  { id: 'dresses_gowns', label: 'Dresses, Gowns & Maxis', generalCat: 'tops' as GarmentCategory, dept: 'female' as GenderTarget, group: 'apparel' },
  { id: 'suits_blazers', label: 'Suits, Tuxedos & Blazers', generalCat: 'outerwear' as GarmentCategory, dept: 'male' as GenderTarget, group: 'apparel' },
  // Bottoms
  { id: 'unisex_denim', label: 'Denim Jeans & Cargo Pants', generalCat: 'bottoms' as GarmentCategory, dept: 'unisex' as GenderTarget, group: 'apparel' },
  { id: 'skirts_minis', label: 'Skirts & Mini Skirts', generalCat: 'bottoms' as GarmentCategory, dept: 'female' as GenderTarget, group: 'apparel' },
  // Footwear
  { id: 'unisex_slides_palms', label: 'Slides, Palms & Slippers', generalCat: 'footwear' as GarmentCategory, dept: 'unisex' as GenderTarget, group: 'footwear' },
  { id: 'unisex_sneakers', label: 'Sneakers & Shoes', generalCat: 'footwear' as GarmentCategory, dept: 'unisex' as GenderTarget, group: 'footwear' },
  { id: 'women_heels_mules', label: 'Heels & Mules', generalCat: 'footwear' as GarmentCategory, dept: 'female' as GenderTarget, group: 'footwear' },
  // Accessories & Jewelry
  { id: 'unisex_jewelry', label: 'Jewelry, Chains & Bracelets', generalCat: 'accessories' as GarmentCategory, dept: 'unisex' as GenderTarget, group: 'jewelry' },
  { id: 'unisex_watches', label: 'Luxury Watches & Timepieces', generalCat: 'accessories' as GarmentCategory, dept: 'unisex' as GenderTarget, group: 'jewelry' },
  { id: 'unisex_caps_hats', label: 'Caps, Beanies & Hats', generalCat: 'accessories' as GarmentCategory, dept: 'unisex' as GenderTarget, group: 'jewelry' },
  { id: 'unisex_bags', label: 'Bags & Backpacks', generalCat: 'accessories' as GarmentCategory, dept: 'unisex' as GenderTarget, group: 'jewelry' },
];

const POPULAR_SWATCHES = [
  { name: 'Black', hex: '#111111' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Off-White / Cream', hex: '#fdfbf7' },
  { name: 'Khaki / Beige', hex: '#d4b996' },
  { name: 'Chocolate Brown', hex: '#451a03' },
  { name: 'Navy Blue', hex: '#1e3a8a' },
  { name: 'Olive Green', hex: '#556b2f' },
  { name: 'Forest Green', hex: '#065f46' },
  { name: 'Wine / Burgundy', hex: '#831843' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Heather Grey', hex: '#9ca3af' },
  { name: 'Multi-Color / Pattern', hex: '#6366f1' },
];

const APPAREL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const FOOTWEAR_SIZES = ['39', '40', '41', '42', '43', '44', '45', '46'];

function cleanFileNameToTitle(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  const clean = withoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return 'Collection Piece';
  return clean
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function formatPriceString(val: string): string {
  const digits = (val || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString();
}

export default function BatchProductUploadView({
  vendorProfile,
  getActiveVendorId,
  onSwitchToSingle,
}: BatchProductUploadViewProps) {
  const vendorSpecialty: VendorSpecialty = getVendorSpecialty(vendorProfile);

  // Initial Drop Mode based on store profile
  const initialDropMode: DropMode = 
    vendorSpecialty === 'caps' || vendorSpecialty === 'accessories' || vendorSpecialty === 'jewelry' ? 'jewelry' :
    vendorSpecialty === 'footwear' ? 'footwear' : 'apparel';

  const [dropMode, setDropMode] = useState<DropMode>(initialDropMode);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishProgress, setPublishProgress] = useState<{ current: number; total: number } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [publishedCount, setPublishedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPresetsExpanded, setIsPresetsExpanded] = useState(true);

  // Auto-scroll to top when error occurs so vendor sees message immediately
  useEffect(() => {
    if (errorMessage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [errorMessage]);

  // Filter Categories by Active Drop Mode / Specialty
  const availableCategories = ALL_CATEGORY_OPTIONS.filter(c => {
    if (vendorSpecialty === 'caps') return c.group === 'jewelry' && (c.id.includes('cap') || c.id.includes('hat') || c.id.includes('fila'));
    if (vendorSpecialty === 'jewelry' || vendorSpecialty === 'accessories' || dropMode === 'jewelry') return c.group === 'jewelry';
    if (vendorSpecialty === 'footwear' || dropMode === 'footwear') return c.group === 'footwear';
    if (vendorSpecialty === 'native_tailoring' || vendorSpecialty === 'streetwear' || vendorSpecialty === 'apparel' || dropMode === 'apparel') return c.group === 'apparel';
    return true;
  });

  // Bulk Apply Toolbar State
  const [bulkGender, setBulkGender] = useState<GenderTarget>('unisex');
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkQuantity, setBulkQuantity] = useState('15');
  const [bulkCategory, setBulkCategory] = useState(availableCategories[0]?.id || 'unisex_slides_palms');
  const [bulkSizes, setBulkSizes] = useState<string[]>(
    dropMode === 'footwear' ? ['40', '41', '42', '43', '44'] :
    dropMode === 'jewelry' ? ['One Size'] : ['M', 'L', 'XL']
  );

  // Handle Drop Mode Switch
  const handleSwitchDropMode = (mode: DropMode) => {
    setDropMode(mode);
    const modeCats = ALL_CATEGORY_OPTIONS.filter(c => c.group === mode);
    if (modeCats.length > 0) {
      setBulkCategory(modeCats[0].id);
    }
    if (mode === 'footwear') {
      setBulkSizes(['40', '41', '42', '43', '44']);
    } else if (mode === 'jewelry') {
      setBulkSizes(['One Size']);
    } else {
      setBulkSizes(['M', 'L', 'XL']);
    }
  };

  // Handle multi-file selection from gallery / camera / desktop
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    const defaultQty = bulkQuantity === '' ? 15 : (Number(bulkQuantity) || 15);
    const matchedCat = availableCategories.find(c => c.id === bulkCategory) || availableCategories[0];

    fileList.forEach((file, index) => {
      const tempId = `batch-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`;
      const localPreview = URL.createObjectURL(file);

      const initSizeStock: { [sz: string]: number | string } = {};
      if (matchedCat.generalCat === 'accessories') {
        initSizeStock['One Size'] = defaultQty;
      } else {
        const defaultSizes = bulkSizes.length > 0 ? [...bulkSizes] : (dropMode === 'footwear' ? ['40', '41', '42', '43', '44'] : ['M', 'L', 'XL']);
        defaultSizes.forEach(sz => {
          initSizeStock[sz] = defaultQty;
        });
      }

      setItems(prev => [
        ...prev,
        {
          id: tempId,
          name: cleanFileNameToTitle(file.name),
          price: bulkPrice || '',
          category: matchedCat.generalCat,
          subCategory: matchedCat.id,
          genderTarget: bulkGender || matchedCat.dept || 'unisex',
          imageFile: file,
          imagePreview: localPreview,
          additionalImages: [],
          videoFile: null,
          videoPreview: null,
          selectedColors: [],
          isCustomColorOpen: false,
          customColorText: '',
          customColorHex: '#2563eb',
          sizeStock: initSizeStock,
        }
      ]);

      // Upload directly to Cloudinary CDN in background
      (async () => {
        try {
          const compressed = await compressImageToFile(file, 1400, 0.85);
          const formData = new FormData();
          formData.append('file', compressed);
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (res.ok && data.url) {
            setItems(prev => prev.map(item => item.id === tempId ? { ...item, imagePreview: data.url } : item));
          }
        } catch (err) {
          console.warn('Batch image CDN upload error, using local fallback:', err);
        }
      })();
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Update a single item field
  const updateItem = (id: string, updates: Partial<BatchItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  // Remove an item from the batch
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Extra images handlers for a batch item
  const handleAddExtraImagesToItem = async (itemId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
      for (const f of validFiles) {
        const extraId = `extra-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const localPreview = URL.createObjectURL(f);

        setItems(prev => prev.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            additionalImages: [...(item.additionalImages || []), { id: extraId, url: localPreview, label: '' }]
          };
        }));

        (async () => {
          try {
            const compressed = await compressImageToFile(f, 1400, 0.85);
            const formData = new FormData();
            formData.append('file', compressed);
            const res = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });
            const data = await res.json();
            if (res.ok && data.url) {
              setItems(prev => prev.map(item => {
                if (item.id !== itemId) return item;
                return {
                  ...item,
                  additionalImages: (item.additionalImages || []).map(img => img.id === extraId ? { ...img, url: data.url } : img)
                };
              }));
            }
          } catch (err) {
            console.warn('Extra image CDN upload failed:', err);
          }
        })();
      }
    } catch (e) {
      console.error('Error adding extra photos to batch item:', e);
    }
  };

  const handleRemoveExtraImageFromItem = (itemId: string, extraImgId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        additionalImages: (item.additionalImages || []).filter(img => img.id !== extraImgId)
      };
    }));
  };

  // Video handlers for a batch item
  const processAndUploadBatchVideo = async (itemId: string, fileToUpload: File, fallbackTrim = false) => {
    updateItem(itemId, { isVideoUploading: true, videoError: '', pendingTrimVideo: null });
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
        updateItem(itemId, {
          videoPreview: data.url,
          videoFile: fileToUpload,
          isVideoUploading: false,
          videoError: '',
          pendingTrimVideo: null,
        });
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          updateItem(itemId, {
            videoPreview: reader.result as string,
            videoFile: fileToUpload,
            isVideoUploading: false,
            videoError: '',
            pendingTrimVideo: null,
          });
        };
        reader.readAsDataURL(fileToUpload);
      }
    } catch (err) {
      console.error('Batch video upload error:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        updateItem(itemId, {
          videoPreview: reader.result as string,
          videoFile: fileToUpload,
          isVideoUploading: false,
          videoError: '',
          pendingTrimVideo: null,
        });
      };
      reader.readAsDataURL(fileToUpload);
    }
  };

  const handleBatchItemVideoSelect = async (itemId: string, file: File | null) => {
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      updateItem(itemId, { videoError: 'Video must be under 15MB. Please upload a short 3–5s clip.' });
      return;
    }

    const tempUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = tempUrl;

    video.onloadedmetadata = async () => {
      URL.revokeObjectURL(tempUrl);
      const roundedDur = Math.round(video.duration);
      if (video.duration > 5.5) {
        updateItem(itemId, {
          pendingTrimVideo: file,
          videoError: `Video is ${roundedDur}s long (recommended is 3–5s).`,
        });
        return;
      }
      await processAndUploadBatchVideo(itemId, file);
    };

    video.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      updateItem(itemId, { videoError: 'Could not read video file. Please use MP4 or WebM format.' });
    };
  };

  const handleAutoTrimBatchVideo = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item || !item.pendingTrimVideo) return;

    const fileToTrim = item.pendingTrimVideo;
    updateItem(itemId, { isTrimmingVideo: true, trimProgress: 0, videoError: '', pendingTrimVideo: null });

    try {
      const trimmed = await trimVideoInBrowser(fileToTrim, {
        targetSeconds: 5,
        onProgress: (p) => updateItem(itemId, { trimProgress: p })
      });
      await processAndUploadBatchVideo(itemId, trimmed);
    } catch (err) {
      console.warn('Batch video trimming fallback to server-side trim:', err);
      await processAndUploadBatchVideo(itemId, fileToTrim, true);
    } finally {
      updateItem(itemId, { isTrimmingVideo: false, trimProgress: 0, videoError: '', pendingTrimVideo: null });
    }
  };

  const handleRemoveBatchVideo = (itemId: string) => {
    updateItem(itemId, {
      videoPreview: null,
      videoFile: null,
      videoError: '',
      pendingTrimVideo: null,
    });
  };

  // Multi-Color Toggle for an Item
  const toggleItemColor = (itemId: string, color: { name: string; hex: string }) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const exists = item.selectedColors.some(sc => sc.name.toLowerCase() === color.name.toLowerCase());
      const updatedColors = exists
        ? item.selectedColors.filter(sc => sc.name.toLowerCase() !== color.name.toLowerCase())
        : [...item.selectedColors, color];
      return { ...item, selectedColors: updatedColors };
    }));
  };

  // Add Custom Color from Color Wheel
  const addCustomColorToItem = (itemId: string, colorName: string, hex: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const cleanName = colorName.trim() || 'Custom Shade';
      const exists = item.selectedColors.some(sc => sc.name.toLowerCase() === cleanName.toLowerCase());
      const updatedColors = exists
        ? item.selectedColors.map(sc => sc.name.toLowerCase() === cleanName.toLowerCase() ? { name: cleanName, hex } : sc)
        : [...item.selectedColors, { name: cleanName, hex }];
      return { ...item, selectedColors: updatedColors, isCustomColorOpen: false, customColorText: '' };
    }));
  };

  // Update size stock for an item
  const setItemSizeQty = (itemId: string, size: string, rawVal: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const cleanVal = typeof rawVal === 'string'
        ? (rawVal.trim() === '' ? '' : parseInt(rawVal.replace(/[^0-9]/g, ''), 10))
        : rawVal;
      const updated = { ...item.sizeStock, [size]: isNaN(cleanVal as number) ? '' : cleanVal };
      return { ...item, sizeStock: updated };
    }));
  };

  // Toggle size active/inactive for an item
  const toggleItemSize = (itemId: string, size: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const updated = { ...item.sizeStock };
      if (updated[size] !== undefined) {
        delete updated[size];
      } else {
        const defaultQty = bulkQuantity === '' ? 15 : (Number(bulkQuantity) || 15);
        updated[size] = defaultQty;
      }
      return { ...item, sizeStock: updated };
    }));
  };

  // UNIFIED 1-TAP APPLY ALL PRESETS
  const handleApplyAllPresets = () => {
    const matched = ALL_CATEGORY_OPTIONS.find(c => c.id === bulkCategory);
    const qty = bulkQuantity === '' ? 15 : Math.max(1, Number(bulkQuantity) || 15);

    setItems(prev => prev.map(item => {
      const updatedSizeStock: { [sz: string]: number | string } = {};

      if (dropMode === 'jewelry' || matched?.generalCat === 'accessories') {
        updatedSizeStock['One Size'] = qty;
      } else {
        bulkSizes.forEach(sz => {
          updatedSizeStock[sz] = qty;
        });
      }

      return {
        ...item,
        price: bulkPrice || item.price,
        genderTarget: bulkGender,
        category: matched ? matched.generalCat : item.category,
        subCategory: matched ? matched.id : item.subCategory,
        sizeStock: Object.keys(updatedSizeStock).length > 0 ? updatedSizeStock : item.sizeStock
      };
    }));
  };

  const toggleBulkSize = (sz: string) => {
    setBulkSizes(prev => prev.includes(sz) ? prev.filter(s => s !== sz) : [...prev, sz]);
  };

  // Calculate total piece stock
  const calculateTotalStock = (item: BatchItem): number => {
    if (item.category === 'accessories') {
      const q = item.sizeStock['One Size'];
      return q === '' ? 0 : Number(q) || 20;
    }
    return Object.values(item.sizeStock).reduce((sum: number, q) => sum + (q === '' ? 0 : Number(q) || 0), 0);
  };

  // PUBLISH ALL ITEMS TO DATABASE
  const handlePublishAll = async () => {
    if (items.length === 0) return;

    const invalidItem = items.find(i => !i.name.trim() || !i.price || Number(String(i.price).replace(/[^0-9.]/g, '')) <= 0);
    if (invalidItem) {
      setErrorMessage(`Please make sure every item has a title and a valid price in Naira.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setPublishProgress({ current: 0, total: items.length });

    try {
      const activeVendorId = getActiveVendorId();

      const payloadItems = items.map(item => {
        const cleanPrice = Number(String(item.price).replace(/[^0-9.]/g, '')) || 10000;
        const sizeStockObj: { [k: string]: { enabled: boolean; quantity: number } } = {};
        
        if (item.category === 'accessories') {
          const accQty = item.sizeStock['One Size'] === '' ? 20 : (Number(item.sizeStock['One Size']) || 20);
          sizeStockObj['One Size'] = { enabled: true, quantity: accQty };
        } else {
          Object.entries(item.sizeStock).forEach(([sz, qty]) => {
            const numQty = qty === '' ? 0 : Number(qty) || 0;
            if (numQty > 0) {
              sizeStockObj[sz] = { enabled: true, quantity: numQty };
            }
          });
        }

        const totalItemStock = calculateTotalStock(item);
        const activeSizes = Object.keys(sizeStockObj);

        const extraImgs = (item.additionalImages || []).map(img => ({
          url: img.url,
          label: img.label || 'Additional View'
        }));

        return {
          name: item.name.trim(),
          price: cleanPrice,
          category: item.category,
          genderTarget: item.genderTarget || 'unisex',
          garmentOriginType: 'ready_made_boutique',
          imageUrl: item.imagePreview,
          image_url: item.imagePreview,
          images: [
            { url: item.imagePreview, isCover: true },
            ...extraImgs
          ],
          videoUrl: item.videoPreview || undefined,
          description: '',
          tags: ['Ready-to-Wear', 'Collection Drop'],
          colors: item.category === 'accessories' ? [] : (item.selectedColors.length > 0 ? item.selectedColors.map(c => ({ name: c.name.trim() || 'Standard', hex: c.hex || '#111111' })) : [{ name: 'As Pictured', hex: '#111111' }]),
          sizes: item.category === 'accessories' ? ['One Size'] : (activeSizes.length > 0 ? activeSizes : (item.category === 'footwear' ? ['40', '41', '42'] : ['M', 'L', 'XL'])),
          sizeStock: sizeStockObj,
          stockQuantity: totalItemStock,
          vendorId: activeVendorId,
          vendorName: vendorProfile?.brandName || 'Verified Partner',
          is_published: true,
        };
      });

      const res = await vendorFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: payloadItems,
          vendorId: activeVendorId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish batch collection.');
      }

      setPublishedCount(items.length);
      setIsSuccess(true);

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#e6c367', '#10b981', '#ffffff']
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during batch publishing.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
      setPublishProgress(null);
    }
  };

  // SUCCESS SCREEN
  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto p-6 sm:p-10 surface-card rounded-3xl border border-[var(--border-subtle)] text-center space-y-6 animate-fadeIn my-6">
        <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="font-editorial text-3xl font-bold text-[var(--text-primary)]">
            {publishedCount} Pieces Published Live
          </h2>
          <p className="text-xs font-mono-luxury text-[var(--text-secondary)] max-w-md mx-auto">
            Your collection has been published and is now live across the Ìrísí catalog, available for orders and Shipbubble courier delivery.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/shop"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:opacity-90"
          >
            <span>View Live Catalog</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={() => {
              setItems([]);
              setIsSuccess(false);
              setPublishedCount(0);
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-full surface-card border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono-luxury font-bold text-xs uppercase tracking-wider hover:border-[var(--gold-accent)] cursor-pointer"
          >
            Upload Another Batch
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn max-w-4xl mx-auto pb-28 px-1 sm:px-0">
      
      {/* Hidden Multi-File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFilesSelected}
        className="hidden"
      />

      {/* Header & Mode Switch */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[var(--gold-accent)] font-bold">
              Batch Drop Creator
            </span>
          </div>
          <h1 className="font-editorial text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            Quick Upload Drop
          </h1>
        </div>

        {onSwitchToSingle && (
          <button
            type="button"
            onClick={onSwitchToSingle}
            className="px-3 py-1.5 rounded-xl surface-card border border-[var(--border-subtle)] text-[11px] font-mono-luxury text-[var(--text-primary)] hover:border-[var(--gold-accent)] shrink-0 font-bold"
          >
            Single Form
          </button>
        )}
      </div>

      {/* 1-TAP DROP TYPE SELECTOR (Apparel / Slides & Footwear / Jewelry & Accessories) */}
      {(vendorSpecialty === 'multi_department' || items.length === 0) && (
        <div className="p-1.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center gap-1.5 overflow-x-auto no-scrollbar font-mono-luxury text-xs">
          {(vendorSpecialty === 'multi_department' || vendorSpecialty === 'footwear') && (
            <button
              type="button"
              onClick={() => handleSwitchDropMode('footwear')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer shrink-0 text-xs ${
                dropMode === 'footwear'
                  ? 'bg-[var(--gold-accent)] text-black shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Footprints className="h-3.5 w-3.5" />
              <span>Slides &amp; Footwear</span>
            </button>
          )}

          {(vendorSpecialty === 'multi_department' || vendorSpecialty === 'apparel' || vendorSpecialty === 'native_tailoring' || vendorSpecialty === 'streetwear') && (
            <button
              type="button"
              onClick={() => handleSwitchDropMode('apparel')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer shrink-0 text-xs ${
                dropMode === 'apparel'
                  ? 'bg-[var(--gold-accent)] text-black shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Shirt className="h-3.5 w-3.5" />
              <span>Clothing Drop</span>
            </button>
          )}

          {(vendorSpecialty === 'multi_department' || vendorSpecialty === 'jewelry' || vendorSpecialty === 'caps' || vendorSpecialty === 'accessories') && (
            <button
              type="button"
              onClick={() => handleSwitchDropMode('jewelry')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer shrink-0 text-xs ${
                dropMode === 'jewelry'
                  ? 'bg-[var(--gold-accent)] text-black shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Caps, Bags &amp; Accessories</span>
            </button>
          )}
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-xs font-mono-luxury animate-fadeIn">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="ml-auto text-xs hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* STEP 1: DROPZONE / SELECT PHOTOS BUTTON */}
      {items.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--gold-accent)] surface-card rounded-3xl p-8 sm:p-14 text-center cursor-pointer transition-all space-y-4 group"
        >
          <div className="h-14 w-14 mx-auto rounded-full bg-[var(--gold-subtle)] border border-[var(--gold-accent)]/30 text-[var(--gold-accent)] flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
            <UploadCloud className="h-7 w-7" />
          </div>

          <div className="space-y-1">
            <h3 className="font-editorial text-lg sm:text-xl font-bold text-[var(--text-primary)]">
              Tap to Select Multiple Photos
            </h3>
            <p className="text-xs font-mono-luxury text-[var(--text-secondary)] max-w-sm mx-auto">
              Select 2 to 20 product pictures directly from your phone gallery to launch a collection in seconds.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono-luxury text-xs font-bold uppercase tracking-wider shadow-lg">
            <Plus className="h-3.5 w-3.5" />
            <span>Choose Photos</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">

          {/* STREAMLINED QUICK BULK TOOLBAR (Clean, Compact & Effortless on Mobile) */}
          <div className="p-4 rounded-2xl surface-card border border-[var(--border-subtle)] space-y-3 shadow-sm">
            <button
              type="button"
              onClick={() => setIsPresetsExpanded(!isPresetsExpanded)}
              className="w-full flex items-center justify-between font-mono-luxury font-bold text-xs uppercase tracking-wider text-[var(--gold-accent)] cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Bulk Presets ({items.length} Pieces)</span>
              </div>
              {isPresetsExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {isPresetsExpanded && (
              <div className="space-y-3 pt-1 animate-fadeIn text-xs font-mono-luxury">
                
                {/* Row 1: Department (Men/Women/Unisex) + Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Department Underline Selector */}
                  <div>
                    <label className="text-[10px] text-[var(--text-secondary)] uppercase font-bold block mb-1">
                      Department / Gender Target
                    </label>
                    <div className="flex items-center justify-around border-b border-[var(--border-subtle)] pb-1">
                      {(['unisex', 'male', 'female'] as GenderTarget[]).map((gender) => (
                        <button
                          key={gender}
                          type="button"
                          onClick={() => setBulkGender(gender)}
                          className={`pb-1 px-2 text-[11px] font-bold uppercase transition-all cursor-pointer ${
                            bulkGender === gender
                              ? 'text-[var(--gold-accent)] border-b-2 border-[var(--gold-accent)] font-extrabold'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border-b-2 border-transparent'
                          }`}
                        >
                          {gender === 'male' ? 'Men' : gender === 'female' ? 'Women' : 'Unisex'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Preset */}
                  <div>
                    <label className="text-[10px] text-[var(--text-secondary)] uppercase font-bold block mb-1">
                      Category Preset
                    </label>
                    <select
                      value={bulkCategory}
                      onChange={(e) => setBulkCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)] font-bold cursor-pointer"
                    >
                      {availableCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Price & Stock Qty */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-[var(--text-secondary)] uppercase font-bold block mb-1">
                      Standard Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gold-accent)] font-bold">₦</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={bulkPrice}
                        onChange={(e) => setBulkPrice(formatPriceString(e.target.value))}
                        placeholder="30,000"
                        onFocus={(e) => e.target.select()}
                        className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--gold-accent)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-[var(--text-secondary)] uppercase font-bold block mb-1">
                      {dropMode === 'jewelry' ? 'Stock Units' : 'Stock Qty / Size'}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={bulkQuantity}
                      onChange={(e) => setBulkQuantity(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="15"
                      onFocus={(e) => e.target.select()}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--gold-accent)]"
                    />
                  </div>
                </div>

                {/* Row 3: Active Sizing Chips */}
                {dropMode !== 'jewelry' && (
                  <div>
                    <label className="text-[10px] text-[var(--text-secondary)] uppercase font-bold block mb-1">
                      {dropMode === 'footwear' ? 'EU Shoe Sizing (Tap to Toggle)' : 'Garment Sizes (Tap to Toggle)'}
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(dropMode === 'footwear' ? FOOTWEAR_SIZES : APPAREL_SIZES).map(sz => {
                        const isSelected = bulkSizes.includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => toggleBulkSize(sz)}
                            className={`h-7 px-2.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? 'bg-transparent border-[var(--gold-accent)] text-[var(--gold-accent)] font-extrabold shadow-sm ring-1 ring-[var(--gold-accent)]'
                                : 'bg-transparent border-[var(--border-subtle)] text-[var(--text-muted)]'
                            }`}
                          >
                            <span>{sz}</span>
                            {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 1-Tap "Apply to All" Button */}
                <button
                  type="button"
                  onClick={handleApplyAllPresets}
                  className="w-full py-2.5 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold text-xs uppercase tracking-wider hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Apply Presets to All ({items.length} Pieces)</span>
                </button>

              </div>
            )}
          </div>

          {/* BATCH ITEMS LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono-luxury px-1">
              <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider">
                {items.length} {items.length === 1 ? 'Piece in Batch' : 'Pieces in Batch'}
              </span>
              <button
                type="button"
                onClick={() => setItems([])}
                className="text-rose-400 hover:underline text-[11px] font-bold cursor-pointer"
              >
                Clear All
              </button>
            </div>

            {/* PRODUCT CARDS: Mobile-First Compact Architecture */}
            <div className="space-y-3">
              {items.map((item, index) => {
                const totalItemStock = calculateTotalStock(item);
                const sizeList = item.category === 'footwear' ? FOOTWEAR_SIZES : APPAREL_SIZES;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 rounded-2xl surface-card border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-all space-y-3 shadow-sm"
                  >
                    {/* Top Row: Thumbnail + Title + Price + Delete */}
                    <div className="flex items-start gap-3">
                      
                      {/* Crisp Thumbnail */}
                      <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-xl overflow-hidden bg-black border border-[var(--border-subtle)] shrink-0 shadow-sm">
                        <Image
                          src={item.imagePreview}
                          alt={item.name}
                          fill
                          unoptimized
                          className="object-cover object-center"
                        />
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[8px] font-mono-luxury font-bold text-white">
                          #{index + 1}
                        </span>
                      </div>

                      {/* Title & Price Column */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-1.5">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, { name: e.target.value })}
                            placeholder="Piece Title (e.g. Handmade Leather Slides)"
                            className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none"
                          />

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Price Input with Naira */}
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gold-accent)] font-bold text-xs">₦</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={item.price}
                            onChange={(e) => updateItem(item.id, { price: formatPriceString(e.target.value) })}
                            placeholder="Price in ₦"
                            onFocus={(e) => e.target.select()}
                            className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:border-[var(--gold-accent)] focus:outline-none font-bold font-mono-luxury"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Category & Department (Men/Women/Unisex) Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono-luxury">
                      
                      {/* Category Dropdown */}
                      <select
                        value={item.subCategory}
                        onChange={(e) => {
                          const subId = e.target.value;
                          const matched = ALL_CATEGORY_OPTIONS.find(c => c.id === subId);
                          if (matched) {
                            updateItem(item.id, {
                              subCategory: subId,
                              category: matched.generalCat,
                              genderTarget: item.genderTarget || matched.dept,
                            });
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-primary)] focus:outline-none font-bold cursor-pointer"
                      >
                        {availableCategories.map(c => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>

                      {/* Gender Target 3-Way Underline Selector */}
                      <div className="flex items-center justify-around border-b border-[var(--border-subtle)] px-1">
                        {(['unisex', 'male', 'female'] as GenderTarget[]).map((gender) => (
                          <button
                            key={gender}
                            type="button"
                            onClick={() => updateItem(item.id, { genderTarget: gender })}
                            className={`pb-1 px-1.5 text-[10px] font-bold uppercase transition-all cursor-pointer ${
                              item.genderTarget === gender
                                ? 'text-[var(--gold-accent)] border-b-2 border-[var(--gold-accent)] font-extrabold'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border-b-2 border-transparent'
                            }`}
                          >
                            {gender === 'male' ? 'Men' : gender === 'female' ? 'Women' : 'Unisex'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Multi-Color Swatches (Apparel & Footwear only) */}
                    {item.category !== 'accessories' && (
                      <div className="space-y-1.5 pt-0.5">
                        <div className="flex items-center justify-between text-xs font-mono-luxury">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">
                              Color:
                            </span>
                            {item.selectedColors.length === 0 ? (
                              <span className="text-[10px] text-[var(--text-muted)] italic font-bold">
                                As Pictured (Single / Unique)
                              </span>
                            ) : (
                              <div className="flex items-center gap-1 flex-wrap">
                                {item.selectedColors.map((sc, scIdx) => (
                                  <span
                                    key={scIdx}
                                    className="font-bold text-[var(--text-primary)] text-[10px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)]"
                                  >
                                    <span
                                      className="inline-block h-2 w-2 rounded-full border border-white/20"
                                      style={{
                                        background: sc.name.toLowerCase().includes('multi')
                                          ? 'conic-gradient(from 180deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #f59e0b, #ef4444, #ec4899)'
                                          : sc.hex
                                      }}
                                    />
                                    <span>{sc.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => toggleItemColor(item.id, sc)}
                                      className="text-[var(--text-muted)] hover:text-rose-400 text-[10px] font-bold cursor-pointer ml-0.5"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => updateItem(item.id, {
                              isCustomColorOpen: !item.isCustomColorOpen,
                              customColorText: ''
                            })}
                            className="text-[10px] text-[var(--gold-accent)] hover:underline font-bold flex items-center gap-0.5 cursor-pointer shrink-0"
                          >
                            <Plus className="h-2.5 w-2.5" />
                            <span>{item.isCustomColorOpen ? 'Close' : 'Custom'}</span>
                          </button>
                        </div>

                        {/* Swatches Horizontal Row */}
                        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
                          {POPULAR_SWATCHES.map(c => {
                            const isSelected = item.selectedColors.some(sc => sc.name.toLowerCase() === c.name.toLowerCase());
                            const isSwatchMulti = c.name.toLowerCase().includes('multi');
                            return (
                              <button
                                key={c.name}
                                type="button"
                                title={c.name}
                                onClick={() => toggleItemColor(item.id, c)}
                                className={`h-5 w-5 rounded-full shrink-0 transition-all cursor-pointer relative flex items-center justify-center ${
                                  isSelected
                                    ? 'ring-2 ring-[var(--gold-accent)] ring-offset-1 ring-offset-black scale-110 shadow-sm'
                                    : 'hover:scale-105 border border-white/20 opacity-60 hover:opacity-100'
                                }`}
                                style={{
                                  background: isSwatchMulti
                                    ? 'conic-gradient(from 180deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #f59e0b, #ef4444, #ec4899)'
                                    : c.hex
                                }}
                              >
                                {isSelected && (
                                  <Check className={`h-2.5 w-2.5 stroke-[3] ${c.name === 'White' || c.name === 'Off-White / Cream' ? 'text-black' : 'text-white'}`} />
                                )}
                              </button>
                            );
                          })}

                          {/* Native Visual Color Wheel Swatch */}
                          <label
                            title="Pick custom color"
                            className="relative h-5 w-5 rounded-full shrink-0 border border-white/30 cursor-pointer overflow-hidden flex items-center justify-center shadow-sm"
                            style={{
                              background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'
                            }}
                          >
                            <input
                              type="color"
                              value={item.customColorHex || '#2563eb'}
                              onChange={(e) => {
                                const hex = e.target.value;
                                updateItem(item.id, {
                                  customColorHex: hex,
                                  isCustomColorOpen: true
                                });
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <Palette className="h-2.5 w-2.5 text-white drop-shadow pointer-events-none" />
                          </label>
                        </div>

                        {/* Inline Custom Color Name Input */}
                        {item.isCustomColorOpen && (
                          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--gold-accent)]/40 animate-fadeIn">
                            <input
                              type="color"
                              value={item.customColorHex || '#2563eb'}
                              onChange={(e) => updateItem(item.id, { customColorHex: e.target.value })}
                              className="h-5 w-5 rounded border border-white/20 cursor-pointer bg-transparent shrink-0"
                            />
                            <input
                              type="text"
                              value={item.customColorText || ''}
                              onChange={(e) => updateItem(item.id, { customColorText: e.target.value })}
                              placeholder="Color name (e.g. Olive, Royal Blue)"
                              className="w-full px-2 py-0.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-accent)]"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => addCustomColorToItem(item.id, item.customColorText || 'Custom Shade', item.customColorHex || '#2563eb')}
                              className="px-2.5 py-1 rounded-lg bg-[var(--gold-accent)] text-black text-[10px] font-bold uppercase tracking-wider shrink-0 cursor-pointer"
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sizing & Stock Selector: Ultra-Clean Compact Chips */}
                    <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono-luxury">
                        <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">
                          {item.category === 'accessories' ? 'Stock Units' : item.category === 'footwear' ? 'EU Sizes (Tap to toggle)' : 'Sizes (Tap to toggle)'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          {totalItemStock} in Stock
                        </span>
                      </div>

                      {item.category === 'accessories' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--text-primary)]">Total Stock:</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={item.sizeStock['One Size'] === '' ? '' : (item.sizeStock['One Size'] ?? 20)}
                            placeholder="20"
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setItemSizeQty(item.id, 'One Size', e.target.value)}
                            className="w-20 px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] text-center focus:outline-none focus:border-[var(--gold-accent)] font-mono-luxury"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {sizeList.map(sz => {
                            const isEnabled = item.sizeStock[sz] !== undefined;
                            const qty = item.sizeStock[sz];

                            return (
                              <div
                                key={sz}
                                className={`flex items-center rounded-lg border transition-all ${
                                  isEnabled
                                    ? 'bg-transparent border-[var(--gold-accent)] shadow-sm ring-1 ring-[var(--gold-accent)]'
                                    : 'bg-transparent border-[var(--border-subtle)] opacity-40'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleItemSize(item.id, sz)}
                                  className={`px-2 py-1 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                    isEnabled ? 'text-[var(--gold-accent)] font-extrabold' : 'text-[var(--text-muted)]'
                                  }`}
                                >
                                  <span>{sz}</span>
                                  {isEnabled && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                                </button>

                                {isEnabled && (
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={qty === '' ? '' : (qty ?? 0)}
                                    placeholder="0"
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => setItemSizeQty(item.id, sz, e.target.value)}
                                    className="w-10 text-center py-1 pr-1 bg-transparent border-l border-[var(--border-subtle)] text-[11px] font-bold text-[var(--text-primary)] focus:outline-none font-mono-luxury"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Showcase Media: Extra Angles & Video Micro-Clip */}
                    <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono-luxury">
                        <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold flex items-center gap-1.5">
                          <Layers className="h-3 w-3 text-[var(--gold-accent)]" />
                          <span>Product Views &amp; Video</span>
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono-luxury">
                          1 Cover + {(item.additionalImages || []).length} Extra Views {item.videoPreview ? '+ 1 Video' : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Additional Photos Strip */}
                        {(item.additionalImages || []).map((img, extraIdx) => (
                          <div key={img.id} className="relative h-12 w-12 rounded-lg overflow-hidden bg-black border border-[var(--border-subtle)] shrink-0 group">
                            <Image src={img.url} alt={`View ${extraIdx + 2}`} fill unoptimized className="object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveExtraImageFromItem(item.id, img.id)}
                              className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/80 text-rose-400 hover:text-rose-300 flex items-center justify-center text-[10px] font-bold cursor-pointer"
                              title="Remove Photo"
                            >
                              ×
                            </button>
                          </div>
                        ))}

                        {/* Add Extra Photos Button */}
                        <label className="h-12 px-2.5 rounded-lg border border-dashed border-[var(--border-subtle)] hover:border-[var(--gold-accent)] bg-[var(--bg-primary)] flex items-center gap-1 text-[10px] font-mono-luxury font-bold text-[var(--text-muted)] hover:text-white cursor-pointer transition-colors shrink-0">
                          <Plus className="h-3 w-3 text-[var(--gold-accent)]" />
                          <span>+ Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              handleAddExtraImagesToItem(item.id, e.target.files);
                              e.target.value = '';
                            }}
                          />
                        </label>

                        {/* Video Slot */}
                        {item.videoPreview ? (
                          <div className="relative h-12 w-16 rounded-lg overflow-hidden bg-black border border-emerald-500/40 shrink-0 group">
                            <video src={item.videoPreview} className="w-full h-full object-cover" muted playsInline />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                              <Play className="h-3 w-3 text-white/80 fill-current" />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveBatchVideo(item.id)}
                              className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/80 text-rose-400 hover:text-rose-300 flex items-center justify-center text-[10px] font-bold cursor-pointer"
                              title="Remove Video"
                            >
                              ×
                            </button>
                          </div>
                        ) : item.isVideoUploading || item.isTrimmingVideo ? (
                          <div className="h-12 px-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center gap-1.5 text-[10px] font-mono-luxury text-[var(--gold-accent)] shrink-0">
                            <Sparkles className="h-3 w-3 animate-spin text-[var(--gold-accent)]" />
                            <span>{item.isTrimmingVideo ? `Trimming (${item.trimProgress || 0}%)...` : 'Processing video...'}</span>
                          </div>
                        ) : (
                          <label className="h-12 px-2.5 rounded-lg border border-dashed border-[var(--border-subtle)] hover:border-[var(--gold-accent)] bg-[var(--bg-primary)] flex items-center gap-1 text-[10px] font-mono-luxury font-bold text-[var(--text-muted)] hover:text-white cursor-pointer transition-colors shrink-0">
                            <Video className="h-3 w-3 text-[var(--gold-accent)]" />
                            <span>+ Video</span>
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0] || null;
                                handleBatchItemVideoSelect(item.id, f);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {/* Video Error & Auto-Trim Prompt for Batch Item */}
                      {!item.videoPreview && item.videoError && (
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono-luxury space-y-1.5 animate-fadeIn">
                          <div className="flex items-start gap-1.5">
                            <AlertTriangle className="h-3 w-3 shrink-0 text-amber-400 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-bold text-amber-300">{item.videoError}</p>
                              {item.pendingTrimVideo && (
                                <p className="text-[9px] text-[var(--text-secondary)]">
                                  Automatically trim to first 5 seconds?
                                </p>
                              )}
                            </div>
                          </div>
                          {item.pendingTrimVideo && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAutoTrimBatchVideo(item.id)}
                                disabled={item.isTrimmingVideo}
                                className="px-2 py-1 rounded bg-[var(--gold-accent)] text-black font-bold text-[9px] hover:bg-amber-400 flex items-center gap-1 cursor-pointer shadow-sm disabled:opacity-50"
                              >
                                {item.isTrimmingVideo ? (
                                  <>
                                    <Sparkles className="h-2.5 w-2.5 animate-spin" />
                                    <span>Trimming ({item.trimProgress || 0}%)...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-2.5 w-2.5" />
                                    <span>Auto-Trim to 5s &amp; Use</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, { videoError: '', pendingTrimVideo: null })}
                                className="px-1.5 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white text-[9px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

            {/* STICKY BOTTOM ACTION BAR (Compact & Sleek) */}
            <div className="sticky bottom-3 z-20 p-2 rounded-xl surface-card border border-[var(--border-subtle)] shadow-xl flex items-center justify-between gap-2 backdrop-blur-xl bg-[var(--bg-primary)]/95 max-w-lg mx-auto">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-lg surface-card border border-[var(--border-subtle)] text-[11px] font-mono-luxury text-[var(--text-primary)] font-bold hover:border-[var(--gold-accent)] cursor-pointer whitespace-nowrap"
              >
                + Add Photos
              </button>

              <button
                type="button"
                onClick={handlePublishAll}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 rounded-lg bg-[var(--gold-accent)] text-black font-mono-luxury font-bold text-[11px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5 animate-spin" />
                    <span>Publishing ({publishProgress?.current || 1}/{publishProgress?.total || items.length})...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 fill-black" />
                    <span>Publish ({items.length} {items.length === 1 ? 'Piece' : 'Pieces'})</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
