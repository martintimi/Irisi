import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeVideoUrl } from '@/lib/utils/videoUtils';
import { persistMedia } from '@/lib/services/mediaStorage';
import { products as fallbackCatalog } from '@/lib/data/products';

const NIGERIAN_STATES = [
  'Lagos', 'Ogun', 'Oyo', 'Abuja', 'FCT - Abuja', 'Rivers', 'Anambra', 'Enugu', 'Delta',
  'Edo', 'Kano', 'Kaduna', 'Ondo', 'Osun', 'Ekiti', 'Kwara', 'Abia', 'Akwa Ibom',
  'Bayelsa', 'Benue', 'Cross River', 'Ebonyi', 'Gombe', 'Imo', 'Jigawa', 'Katsina',
  'Kebbi', 'Kogi', 'Nasarawa', 'Niger', 'Plateau', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'Bauchi', 'Borno', 'Adamawa'
];



interface CacheEntry {
  data: any;
  timestamp: number;
}
const apiProductsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60000; // 60 seconds (cleared automatically on new uploads)

export function invalidateProductsCache() {
  apiProductsCache.clear();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Note: Vendor filtering must be explicit via query param (?vendorId= or ?id=),
    // NEVER via ambient x-vendor-id header, to prevent browser HTTP cache poisoning of public /api/products
    const vendorId = 
      searchParams.get('vendorId') || 
      searchParams.get('id');
    const category = searchParams.get('category');
    const gender = searchParams.get('gender');
    const origin = searchParams.get('origin');
    const limit = parseInt(searchParams.get('limit') || '50');

    const cacheKey = `${vendorId || ''}_${category || ''}_${gender || ''}_${origin || ''}_${limit}`;
    const cached = apiProductsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      const cacheHeader = (vendorId && vendorId !== 'all')
        ? 'private, no-cache, no-store, max-age=0, must-revalidate'
        : 'public, max-age=0, s-maxage=10, stale-while-revalidate=30';

      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': cacheHeader,
          'Vary': 'Accept-Encoding, x-vendor-id',
          'X-Cache': 'HIT',
        },
      });
    }

    const supabase = await createClient();

    let query = supabase
      .from('products')
      .select('id, name, price, category, gender_target, garment_origin_type, image_url, description, tags, colors, vendor_id, is_published, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (vendorId && vendorId !== 'all') {
      let resolvedVId = vendorId.trim();
      if (resolvedVId.includes('@')) {
        const { data: vRec } = await supabase.from('vendors').select('id').eq('email', resolvedVId.toLowerCase()).maybeSingle();
        if (vRec?.id) {
          resolvedVId = vRec.id;
        }
      }
      query = query.or(`vendor_id.eq.${resolvedVId},vendor_id.ilike.%${resolvedVId}%`);
    }
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (gender && gender !== 'all' && gender !== 'unisex') {
      query = query.or(`gender_target.eq.${gender},gender_target.eq.unisex`);
    }
    if (origin) {
      query = query.eq('garment_origin_type', origin);
    }

    const [productsResult, vendorsResult] = await Promise.all([
      query,
      supabase.from('vendors').select('id, brand_name, designer_name, location, bio'),
    ]);

    const { data: products, error } = productsResult;
    const { data: vendorsList } = vendorsResult;

    if (error || !products) {
      console.warn('Supabase query restricted or failed (e.g. egress quota):', error?.message);
      let list = [...fallbackCatalog];
      if (gender && gender !== 'all') {
        list = list.filter(p => p.genderTarget === gender || p.genderTarget === 'unisex');
      }
      if (category && category !== 'all') {
        list = list.filter(p => p.category === category || (p as any).subCategory === category);
      }
      if (origin && origin !== 'all') {
        list = list.filter(p => p.garmentOriginType === origin);
      }
      return NextResponse.json({
        success: true,
        products: list.slice(0, limit),
        count: list.length,
        fromFallback: true,
        notice: 'Serving verified cache while database quota refills'
      }, {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=10, stale-while-revalidate=30',
          'Vary': 'Accept-Encoding, x-vendor-id',
        }
      });
    }

    const vendorMap = new Map<string, any>();

    // Fetch product variants for sizing & stock and order_items for sold quantities
    const productIds = (products || []).map((p) => p.id);
    const variantsMap = new Map<string, any[]>();
    const soldMap = new Map<string, number>();

    if (productIds.length > 0) {
      const [variantsRes, orderItemsRes] = await Promise.all([
        supabase.from('product_variants').select('product_id, size, color, stock_quantity').in('product_id', productIds),
        supabase.from('order_items').select('product_id, quantity').in('product_id', productIds),
      ]);

      if (variantsRes.data && Array.isArray(variantsRes.data)) {
        variantsRes.data.forEach((v) => {
          if (!variantsMap.has(v.product_id)) {
            variantsMap.set(v.product_id, []);
          }
          variantsMap.get(v.product_id)!.push(v);
        });
      }

      if (orderItemsRes.data && Array.isArray(orderItemsRes.data)) {
        orderItemsRes.data.forEach((oi) => {
          const prev = soldMap.get(oi.product_id) || 0;
          soldMap.set(oi.product_id, prev + (Number(oi.quantity) || 1));
        });
      }
    }

    if (vendorsList && Array.isArray(vendorsList)) {
      vendorsList.forEach((v) => {
        let city = '';
        let state = '';
        let dispatchDays = '1-2 business days';
        let shippingRates = {
          sameCity: 1000,
          closeHub: 2500,
          interstate: 4500,
          parkPickup: 1500,
          parkPickupEnabled: true,
        };

        if (v.bio && v.bio.startsWith('{') && v.bio.endsWith('}')) {
          try {
            const parsed = JSON.parse(v.bio);
            city = parsed.city || '';
            state = parsed.state || '';
            dispatchDays = parsed.dispatchDays || '1-2 business days';
            if (parsed.shippingRates) {
              shippingRates = { ...shippingRates, ...parsed.shippingRates };
            }
          } catch (e) {}
        }

        if (!city && v.location) {
          const matched = NIGERIAN_STATES.find(s => v.location.toLowerCase().includes(s.toLowerCase()));
          if (matched) {
            city = matched;
            state = matched;
          } else {
            const parts = v.location.split(',').map((p: string) => p.trim());
            city = parts[0] || 'Lagos';
            state = parts[1] || parts[0] || 'Lagos';
          }
        }

        vendorMap.set(v.id, {
          brand_name: v.brand_name,
          designer_name: v.designer_name,
          location: v.location,
          city: city || 'Lagos',
          state: state || 'Lagos',
          dispatchDays,
          shippingRates,
        });
      });
    }

    const formatted = (products || []).map((p) => {
      const vendorInfo = vendorMap.get(p.vendor_id);
      const resolvedImg = p.image_url ? p.image_url.trim() : '';

      const isAccessory = p.category === 'accessories';

      const COLOR_HEX_MAP: Record<string, string> = {
        black: '#111111',
        'onyx black': '#111111',
        'jet black': '#0a0a0a',
        white: '#ffffff',
        'pure white': '#ffffff',
        'off white': '#f5f5f5',
        grey: '#6b7280',
        gray: '#6b7280',
        'heather grey': '#9ca3af',
        'charcoal grey': '#374151',
        'charcoal gray': '#374151',
        'light grey': '#d1d5db',
        'light gray': '#d1d5db',
        navy: '#1e3a8a',
        'navy blue': '#1e3a8a',
        'royal blue': '#2563eb',
        'sky blue': '#38bdf8',
        blue: '#2563eb',
        red: '#dc2626',
        'crimson red': '#991b1b',
        green: '#16a34a',
        'forest green': '#14532d',
        'emerald green': '#059669',
        olive: '#556b2f',
        'olive green': '#556b2f',
        brown: '#78350f',
        'chocolate brown': '#451a03',
        beige: '#d4b996',
        'khaki / beige': '#d4b996',
        'khaki/beige': '#d4b996',
        khaki: '#d4b996',
        tan: '#d2b48c',
        cream: '#fdfbf7',
        gold: '#d97706',
        'emerald gold': '#e6c367',
        yellow: '#eab308',
        'mustard yellow': '#d97706',
        orange: '#ea580c',
        'vibrant orange': '#ea580c',
        purple: '#7e22ce',
        'lavender purple': '#9333ea',
        pink: '#ec4899',
        'pastel pink': '#f472b6',
        burgundy: '#800020',
        'wine / burgundy': '#831843',
        'wine/burgundy': '#831843',
        wine: '#722f37',
        maroon: '#800000',
        teal: '#0d9488',
        turquoise: '#06b6d4',
        silver: '#e5e7eb',
      };

      function resolveColorHex(name: string = '', fallbackHex?: string): string {
        const lower = name.toLowerCase().trim();
        if (lower === 'as pictured' || lower === 'standard' || lower === 'default' || lower === 'none') {
          return (fallbackHex && fallbackHex.startsWith('#')) ? fallbackHex : '#111111';
        }
        if (fallbackHex && fallbackHex.startsWith('#') && fallbackHex !== '#111111' && fallbackHex !== '#000000') {
          return fallbackHex;
        }
        if (COLOR_HEX_MAP[lower]) return COLOR_HEX_MAP[lower];
        if (lower.includes('khaki') || lower.includes('beige') || lower.includes('cream') || /\bsand\b/i.test(lower)) return '#d4b996';
        if (lower.includes('brown') || lower.includes('chocolate') || lower.includes('coffee')) return '#78350f';
        if (lower.includes('white') || lower.includes('off-white') || lower.includes('off white')) return '#ffffff';
        if (lower.includes('black') || lower.includes('onyx') || lower.includes('noir')) return '#111111';
        if (lower.includes('charcoal') || lower.includes('grey') || lower.includes('gray')) return '#374151';
        if (lower.includes('navy')) return '#1e3a8a';
        if (/\bsky\b/i.test(lower)) return '#38bdf8';
        if (lower.includes('blue')) return '#2563eb';
        if (lower.includes('olive')) return '#556b2f';
        if (lower.includes('forest') || lower.includes('emerald') || lower.includes('green')) return '#16a34a';
        if (lower.includes('wine') || lower.includes('burgundy') || lower.includes('maroon')) return '#831843';
        if (/\bred\b/i.test(lower) || lower.includes('crimson')) return '#dc2626';
        if (lower.includes('gold') || lower.includes('mustard') || lower.includes('yellow')) return '#d97706';
        if (lower.includes('purple') || lower.includes('lavender') || lower.includes('violet')) return '#7e22ce';
        if (/\bpink\b/i.test(lower) || lower.includes('rose') || lower.includes('blush')) return '#f472b6';
        if (lower.includes('orange')) return '#ea580c';
        if (lower.includes('teal') || lower.includes('turquoise')) return '#0d9488';
        return fallbackHex || '#111111';
      }

      let normalizedColors: { name: string; hex: string }[] = [];
      if (Array.isArray(p.colors) && p.colors.length > 0) {
        normalizedColors = p.colors.map((c: any) => {
          if (typeof c === 'string') {
            const trimmed = c.trim();
            if (trimmed.startsWith('#')) {
              const hexLower = trimmed.toLowerCase();
              const foundKey = Object.keys(COLOR_HEX_MAP).find(k => COLOR_HEX_MAP[k] === hexLower);
              const name = foundKey ? foundKey.charAt(0).toUpperCase() + foundKey.slice(1) : trimmed;
              return { name, hex: trimmed };
            }
            const hex = resolveColorHex(trimmed);
            const formattedName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
            return { name: formattedName, hex };
          }
          if (typeof c === 'object' && c !== null) {
            const rawName = String(c.name || '').trim();
            if (rawName && !rawName.toLowerCase().startsWith('colorway')) {
              const hex = resolveColorHex(rawName, c.hex);
              return { name: rawName, hex };
            }
            if (c.hex) {
              const hexLower = String(c.hex).toLowerCase().trim();
              const foundKey = Object.keys(COLOR_HEX_MAP).find(k => COLOR_HEX_MAP[k] === hexLower);
              const name = foundKey ? foundKey.charAt(0).toUpperCase() + foundKey.slice(1) : (rawName || 'Standard');
              return { name, hex: c.hex };
            }
            return { name: rawName || 'Standard', hex: resolveColorHex(rawName) };
          }
          return { name: 'Standard', hex: '#111111' };
        });
      }

      if (normalizedColors.length === 0) {
        normalizedColors = [{ name: 'As Featured', hex: '#111111' }];
      }

      const pVariants = variantsMap.get(p.id) || [];
      const dynamicSizeStock: Record<string, any> = {};
      const variantStockMap: Record<string, number> = {};
      let dynamicTotalStock = 0;

      if (pVariants.length > 0) {
        pVariants.forEach((v) => {
          const qty = Number(v.stock_quantity) || 0;
          const currentSizeQty = dynamicSizeStock[v.size]?.quantity || 0;
          dynamicSizeStock[v.size] = { 
            enabled: true, 
            quantity: currentSizeQty + qty 
          };
          dynamicTotalStock += qty;

          if (v.color && v.size) {
            variantStockMap[`${v.color.trim()}_${v.size.trim()}`] = qty;
          }
        });
        dynamicSizeStock.variants = variantStockMap;
      }

      let resolvedSizes: string[] = ['M', 'L', 'XL'];
      if (isAccessory) {
        resolvedSizes = ['One Size'];
      } else if (Object.keys(dynamicSizeStock).filter(k => k !== 'variants').length > 0) {
        resolvedSizes = Object.keys(dynamicSizeStock).filter(k => k !== 'variants');
      } else if (p.category === 'footwear') {
        resolvedSizes = ['40', '41', '42', '43', '44'];
      }

      const finalSizeStock = isAccessory
        ? { 'One Size': dynamicSizeStock['One Size'] || { enabled: true, quantity: 20 }, variants: variantStockMap }
        : Object.keys(dynamicSizeStock).length > 0
        ? dynamicSizeStock
        : (p.category === 'footwear'
          ? { '40': { enabled: true, quantity: 10 }, '41': { enabled: true, quantity: 10 }, '42': { enabled: true, quantity: 10 } }
          : { S: { enabled: true, quantity: 10 }, M: { enabled: true, quantity: 20 }, L: { enabled: true, quantity: 20 } });

      const rawTags: string[] = Array.isArray(p.tags) ? p.tags : [];
      const videoTag = rawTags.find((t: string) => typeof t === 'string' && t.startsWith('video:'));
      const rawVideoUrl = videoTag ? videoTag.replace(/^video:/, '') : ((p as any).video_url || undefined);
      const videoUrl = normalizeVideoUrl(rawVideoUrl);

      // Extract gallery images stored in tags as 'img:<url>'
      const galleryImgTags = rawTags
        .filter((t: string) => typeof t === 'string' && t.startsWith('img:'))
        .map((t: string) => t.replace(/^img:/, ''));

      // Extract color-specific images stored in tags as 'color_img:<colorName>:<url>'
      const colorImgMap = new Map<string, string>();
      rawTags
        .filter((t: string) => typeof t === 'string' && t.startsWith('color_img:'))
        .forEach((t: string) => {
          const parts = t.slice('color_img:'.length).split(':');
          if (parts.length >= 2) {
            const colorName = parts[0].trim().toLowerCase();
            const url = parts.slice(1).join(':');
            colorImgMap.set(colorName, url);
          }
        });

      // Combine images (resolvedImg first, then gallery images, plus any color images)
      const colorImgs = Array.from(colorImgMap.values());
      const rawImages = Array.isArray((p as any).images)
        ? (p as any).images.map((img: any) => typeof img === 'string' ? img : img?.url).filter(Boolean)
        : [];
      const combinedImages = Array.from(
        new Set([resolvedImg, ...rawImages, ...galleryImgTags, ...colorImgs].filter(Boolean))
      );

      // Attach imageUrl to matching colors
      const enrichedColors = normalizedColors.map(col => {
        const colNameLower = col.name.toLowerCase();
        const matchedImg = colorImgMap.get(colNameLower);
        return matchedImg ? { ...col, imageUrl: matchedImg } : col;
      });

      // Filter out internal system tags (video:, img:, color_img:) from public customer tags
      const cleanTags = rawTags.filter(
        (t: string) =>
          typeof t === 'string' &&
          !t.startsWith('video:') &&
          !t.startsWith('img:') &&
          !t.startsWith('color_img:')
      );

      return {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        category: p.category,
        genderTarget: p.gender_target,
        garmentOriginType: p.garment_origin_type,
        imageUrl: resolvedImg,
        image_url: resolvedImg,
        images: combinedImages.length > 0 ? combinedImages : (resolvedImg ? [resolvedImg] : []),
        videoUrl: videoUrl,
        description: p.description,
        tags: cleanTags,
        colors: isAccessory ? [] : enrichedColors,
        sizes: resolvedSizes,
        sizeStock: finalSizeStock,
        stockQuantity: pVariants.length > 0 ? dynamicTotalStock : (isAccessory ? 20 : 50),
        unitsSold: soldMap.get(p.id) || 0,
        isCustomizable: Boolean((p as any).is_customizable),
        vendorId: p.vendor_id,
        vendor_id: p.vendor_id,
        vendorName: vendorInfo?.brand_name || p.vendor_id?.replace(/-/g, ' ').toUpperCase() || 'Ìrísí Partner',
        vendor_name: vendorInfo?.brand_name || p.vendor_id?.replace(/-/g, ' ').toUpperCase() || 'Ìrísí Partner',
        vendorLocation: vendorInfo?.location || 'Lagos, Nigeria',
        vendorCity: vendorInfo?.city || 'Lagos',
        vendorState: vendorInfo?.state || 'Lagos',
        vendorDispatchDays: vendorInfo?.dispatchDays || '1-2 business days',
        vendorShippingRates: vendorInfo?.shippingRates || {
          sameCity: 1000,
          closeHub: 2500,
          interstate: 4500,
          parkPickup: 1500,
          parkPickupEnabled: true,
        }
      };
    });

    const responsePayload = {
      success: true,
      count: formatted.length,
      products: formatted,
    };
    apiProductsCache.set(cacheKey, { data: responsePayload, timestamp: Date.now() });

    const cacheHeader = (vendorId && vendorId !== 'all')
      ? 'private, no-cache, no-store, max-age=0, must-revalidate'
      : 'public, max-age=0, s-maxage=10, stale-while-revalidate=30';

    return NextResponse.json(
      responsePayload,
      {
        headers: {
          'Cache-Control': cacheHeader,
          'Vary': 'Accept-Encoding, x-vendor-id',
          'X-Cache': 'MISS',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    apiProductsCache.clear();
    const body = await request.json();
    const resolvedVendorId = 
      body.vendorId || 
      request.headers.get('x-vendor-id') || 
      '';

    const supabase = await createClient();

    // Check vendor verification status before permitting publication
    if (resolvedVendorId) {
      const { data: vendorRecord } = await supabase
        .from('vendors')
        .select('*')
        .or(`id.eq.${resolvedVendorId},email.eq.${resolvedVendorId}`)
        .maybeSingle();

      if (vendorRecord) {
        let isApproved = !!vendorRecord.is_verified;
        let approvalStatus = isApproved ? 'approved' : 'pending';

        if (vendorRecord.bio && vendorRecord.bio.startsWith('{')) {
          try {
            const parsed = JSON.parse(vendorRecord.bio);
            if (parsed.approvalStatus) {
              approvalStatus = parsed.approvalStatus;
              isApproved = parsed.approvalStatus === 'approved';
            }
          } catch (e) {}
        }

        if (!isApproved) {
          const reason = approvalStatus === 'rejected'
            ? 'Your store profile was returned for correction. Please update your store details and get Super Admin approval before publishing pieces.'
            : 'Your store profile is under review. Product publishing will be unlocked once approved by Super Admin.';
          return NextResponse.json({ error: reason }, { status: 403 });
        }
      }
    }

    // BATCH INSERTION MODE (Multiple Products at once)
    if (Array.isArray(body.items) && body.items.length > 0) {
      const rows = await Promise.all(body.items.map(async (item: any, idx: number) => {
        const pId = `prod-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
        const colorsList = Array.isArray(item.colors)
          ? item.colors.map((c: any) => typeof c === 'string' ? c : (c.name || c.hex || 'Black'))
          : [];
        const tagsList = Array.isArray(item.tags)
          ? item.tags.map((t: any) => typeof t === 'string' ? t.replace(/^#/, '') : String(t))
          : ['Ready-to-Wear'];

        const rawVideoToSave = item.videoUrl || item.video_url;
        const videoToSave = normalizeVideoUrl(rawVideoToSave);
        if (videoToSave && typeof videoToSave === 'string' && videoToSave.trim()) {
          const cleanVideo = await persistMedia(videoToSave.trim(), `${pId}-video`);
          tagsList.push(`video:${cleanVideo}`);
        }

        const firstImageInList = Array.isArray(item.images) && item.images.length > 0
          ? (typeof item.images[0] === 'string' ? item.images[0] : item.images[0]?.url)
          : undefined;

        const rawCover = item.imageUrl || item.image_url || firstImageInList;
        if (!rawCover) {
          throw new Error(`Product "${item.name || 'item'}" requires an uploaded image.`);
        }
        const finalImage = await persistMedia(rawCover, `${pId}-cover`);

        const rawImagesToSave = item.images;
        if (Array.isArray(rawImagesToSave)) {
          for (let imgIdx = 0; imgIdx < rawImagesToSave.length; imgIdx++) {
            const imgItem = rawImagesToSave[imgIdx];
            const rawImgUrl = typeof imgItem === 'string' ? imgItem : imgItem?.url;
            const colorName = typeof imgItem === 'object' ? imgItem?.colorName : undefined;
            if (rawImgUrl && typeof rawImgUrl === 'string' && rawImgUrl.trim()) {
              const cleanImg = await persistMedia(rawImgUrl.trim(), `${pId}-gallery-${imgIdx}`);
              if (cleanImg !== finalImage) {
                tagsList.push(`img:${cleanImg}`);
              }
              if (colorName && typeof colorName === 'string' && colorName.trim()) {
                tagsList.push(`color_img:${colorName.trim()}:${cleanImg}`);
              }
            }
          }
        }
        
        return {
          id: pId,
          name: item.name || `Collection Piece #${idx + 1}`,
          price: Number(item.price || 0),
          category: item.category || 'tops',
          gender_target: item.genderTarget || 'unisex',
          garment_origin_type: item.garmentOriginType || 'ready_made_boutique',
          image_url: finalImage,
          description: item.description && item.description.trim().toLowerCase() !== (item.name || '').trim().toLowerCase() ? item.description : '',
          tags: tagsList,
          colors: colorsList,
          vendor_id: resolvedVendorId,
          is_published: true,
        };
      }));

      const { data, error } = await supabase.from('products').insert(rows).select();
      if (error) {
        console.error('Error inserting batch into products table:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Invalidate products cache
      apiProductsCache.clear();

      // Insert size variants into product_variants
      try {
        const allVariants: any[] = [];
        body.items.forEach((item: any, idx: number) => {
          const pId = rows[idx].id;
          const rawColors = Array.isArray(item.colors) && item.colors.length > 0
            ? item.colors.map((c: any) => typeof c === 'string' ? c : (c.name || c.hex || 'Standard'))
            : ['Standard'];
          const effectiveColors = rawColors.length > 0 ? rawColors : ['Standard'];

          if (item.category === 'accessories') {
            const accQty = item.sizeStock?.['One Size'] === '' ? 20 : (Number(item.sizeStock?.['One Size']?.quantity ?? item.sizeStock?.['One Size']) || 20);
            const perColorQty = Math.max(1, Math.floor(accQty / effectiveColors.length));
            const remainder = accQty - (perColorQty * effectiveColors.length);

            effectiveColors.forEach((colorName: string, cIdx: number) => {
              allVariants.push({
                product_id: pId,
                size: 'One Size',
                color: colorName,
                stock_quantity: perColorQty + (cIdx === 0 ? remainder : 0),
              });
            });
          } else if (item.sizeStock && typeof item.sizeStock === 'object') {
            Object.entries(item.sizeStock).forEach(([sz, val]: [string, any]) => {
              const qty = typeof val === 'object' ? (val.quantity === '' ? 0 : Number(val.quantity) || 0) : (val === '' ? 0 : Number(val) || 0);
              const enabled = typeof val === 'object' ? val.enabled !== false : qty > 0;
              if (enabled && qty > 0) {
                const perColorQty = Math.max(1, Math.floor(qty / effectiveColors.length));
                const remainder = qty - (perColorQty * effectiveColors.length);

                effectiveColors.forEach((colorName: string, cIdx: number) => {
                  allVariants.push({
                    product_id: pId,
                    size: sz,
                    color: colorName,
                    stock_quantity: perColorQty + (cIdx === 0 ? remainder : 0),
                  });
                });
              }
            });
          }
        });

        if (allVariants.length > 0) {
          await supabase.from('product_variants').insert(allVariants);
        }
      } catch (varErr) {
        console.warn('Error inserting batch variants:', varErr);
      }

      return NextResponse.json({
        success: true,
        count: data?.length || rows.length,
        products: data || rows,
      });
    }

    // SINGLE PRODUCT INSERTION MODE
    const {
      name,
      price,
      category,
      genderTarget,
      garmentOriginType,
      imageUrl,
      image_url,
      description,
      tags,
      colors,
      sizes,
      sizeStock,
      stockQuantity,
      tailoringSpecs,
      vendorName,
    } = body;
    const vendorId = resolvedVendorId;

    if (!name || !price || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const productId = `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const colorsList = Array.isArray(colors)
      ? colors.map((c: any) => typeof c === 'string' ? c : (c.name || c.hex || 'Black'))
      : [];

    const tagsList = Array.isArray(tags)
      ? tags.map((t: any) => typeof t === 'string' ? t.replace(/^#/, '') : String(t))
      : [];

    const rawVideoToSave = body.videoUrl || body.video_url;
    const videoToSave = normalizeVideoUrl(rawVideoToSave);
    if (videoToSave && typeof videoToSave === 'string' && videoToSave.trim()) {
      const cleanVideo = await persistMedia(videoToSave.trim(), `${productId}-video`);
      tagsList.push(`video:${cleanVideo}`);
    }

    const firstImageInList = Array.isArray(body.images) && body.images.length > 0
      ? (typeof body.images[0] === 'string' ? body.images[0] : body.images[0]?.url)
      : undefined;

    const rawCover = imageUrl || image_url || firstImageInList;
    if (!rawCover || typeof rawCover !== 'string' || !rawCover.trim()) {
      return NextResponse.json({ error: 'A valid product image is required. Please upload an image for your piece.' }, { status: 400 });
    }
    const finalImage = await persistMedia(rawCover, `${productId}-cover`);

    // Save additional gallery images & color-linked images into tagsList
    const rawImagesToSave = body.images;
    if (Array.isArray(rawImagesToSave)) {
      for (let imgIdx = 0; imgIdx < rawImagesToSave.length; imgIdx++) {
        const item = rawImagesToSave[imgIdx];
        const rawImgUrl = typeof item === 'string' ? item : item?.url;
        const colorName = typeof item === 'object' ? item?.colorName : undefined;
        if (rawImgUrl && typeof rawImgUrl === 'string' && rawImgUrl.trim()) {
          const cleanImg = await persistMedia(rawImgUrl.trim(), `${productId}-gallery-${imgIdx}`);
          if (cleanImg !== finalImage) {
            tagsList.push(`img:${cleanImg}`);
          }
          if (colorName && typeof colorName === 'string' && colorName.trim()) {
            tagsList.push(`color_img:${colorName.trim()}:${cleanImg}`);
          }
        }
      }
    }

    if (Array.isArray(colors)) {
      for (const c of colors) {
        if (typeof c === 'object' && c?.name && c?.imageUrl) {
          const cleanColorImg = await persistMedia(c.imageUrl.trim(), `${productId}-color-${c.name}`);
          tagsList.push(`color_img:${c.name.trim()}:${cleanColorImg}`);
        }
      }
    }

    const { data, error } = await supabase.from('products').insert({
      id: productId,
      name,
      price: Number(price),
      category,
      gender_target: genderTarget || 'unisex',
      garment_origin_type: garmentOriginType || 'ready_made_boutique',
      image_url: finalImage,
      description: description && description.trim().toLowerCase() !== name.trim().toLowerCase() ? description : '',
      tags: tagsList,
      colors: colorsList,
      vendor_id: vendorId,
      is_published: true,
    }).select().single();

    if (error) {
      console.error('Error inserting into products table:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidate products cache
    apiProductsCache.clear();

    // Insert size & color variants into product_variants
    try {
      if (sizeStock && typeof sizeStock === 'object') {
        const variantsToInsert: any[] = [];
        const effectiveColors = colorsList.length > 0 ? colorsList : ['Standard'];

        if (category === 'accessories') {
          const accQty = sizeStock['One Size'] === '' ? 20 : (Number(sizeStock['One Size']?.quantity ?? sizeStock['One Size']) || 20);
          const perColorQty = Math.max(1, Math.floor(accQty / effectiveColors.length));
          const remainder = accQty - (perColorQty * effectiveColors.length);

          effectiveColors.forEach((colorName: string, cIdx: number) => {
            variantsToInsert.push({
              product_id: productId,
              size: 'One Size',
              color: colorName,
              stock_quantity: perColorQty + (cIdx === 0 ? remainder : 0),
            });
          });
        } else {
          Object.entries(sizeStock).forEach(([sz, val]: [string, any]) => {
            const qty = typeof val === 'object' ? (val.quantity === '' ? 0 : Number(val.quantity) || 0) : (val === '' ? 0 : Number(val) || 0);
            const enabled = typeof val === 'object' ? val.enabled !== false : qty > 0;
            if (enabled && qty > 0) {
              const perColorQty = Math.max(1, Math.floor(qty / effectiveColors.length));
              const remainder = qty - (perColorQty * effectiveColors.length);

              effectiveColors.forEach((colorName: string, cIdx: number) => {
                variantsToInsert.push({
                  product_id: productId,
                  size: sz,
                  color: colorName,
                  stock_quantity: perColorQty + (cIdx === 0 ? remainder : 0),
                });
              });
            }
          });
        }

        if (variantsToInsert.length > 0) {
          await supabase.from('product_variants').insert(variantsToInsert);
        }
      }
    } catch (variantErr) {
      console.warn('Optional product_variants insert skipped:', variantErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Product published to store catalog successfully',
      product: data || { id: productId, name, price: Number(price), category, image_url: finalImage, is_published: true },
    });
  } catch (error: any) {
    console.error('Products POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
