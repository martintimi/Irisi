import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseProductMetaFromTags } from '@/lib/utils/productMetadata';
import { fetchLivePlatformBillingConfig } from '@/lib/config/platformBillingServer';
import { isVendorPlusActive } from '@/lib/config/platformBilling';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Brand slug is required' }, { status: 400 });
    }

    const decodedSlug = decodeURIComponent(slug).toLowerCase().trim();
    const cleanBrandName = decodedSlug.replace(/[-_]/g, ' ');

    const supabase = await createClient();

    // 1. Find Vendor in Database
    const { data: vendorList } = await supabase
      .from('vendors')
      .select('*');

    let resolvedVendor = vendorList?.find((v: any) => 
      v.id?.toLowerCase() === decodedSlug ||
      v.id?.toLowerCase().replace(/-/g, ' ') === cleanBrandName ||
      v.id?.toLowerCase().replace(/[-_\s]/g, '') === decodedSlug.replace(/[-_\s]/g, '') ||
      v.brand_name?.toLowerCase() === cleanBrandName ||
      v.brand_name?.toLowerCase() === decodedSlug ||
      v.brand_name?.toLowerCase().replace(/\s+/g, '-') === decodedSlug ||
      v.email?.toLowerCase() === decodedSlug
    );

    if (!resolvedVendor) {
      return NextResponse.json({ error: `Brand storefront for "${slug}" not found` }, { status: 404 });
    }

    const vendorId = resolvedVendor?.id || decodedSlug.replace(/\s+/g, '-');
    const brandName = resolvedVendor?.brand_name || cleanBrandName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // Parse bio, location, turnaround, logo and multi-social links
    let bioText = resolvedVendor?.bio || '';
    let parsedVendorBio: Record<string, any> = {};
    let logoUrl = resolvedVendor?.logo_url || resolvedVendor?.logo || '';
    let city = '';
    let state = '';
    let country = '';
    let dispatchDays = '1-2 business days';
    let isSuspended = false;
    let socialLinks: any = {
      instagram: '',
      tiktok: '',
      snapchat: '',
      whatsapp: resolvedVendor?.phone || ''
    };

    if (bioText.startsWith('{') && bioText.endsWith('}')) {
      try {
        const parsed = JSON.parse(bioText);
        parsedVendorBio = parsed;
        if (parsed.approvalStatus === 'suspended') {
          isSuspended = true;
        }
        bioText = parsed.bio || '';
        logoUrl = parsed.logoUrl || parsed.logo || logoUrl;
        city = parsed.city || '';
        state = parsed.state || '';
        country = parsed.country || '';
        dispatchDays = parsed.dispatchDays || '1-2 business days';
        if (parsed.socialLinks) {
          socialLinks = { ...socialLinks, ...parsed.socialLinks };
        }
      } catch (e) {}
    }

    if (isSuspended) {
      return NextResponse.json({ error: `Brand storefront for "${slug}" is currently unavailable` }, { status: 404 });
    }

    // Return exact bio without mock fallbacks
    bioText = typeof bioText === 'string' ? bioText.trim() : '';

    const locationDisplay = resolvedVendor?.location || ([city, state, country].filter(Boolean).join(', ')) || 'Verified Studio';

    // 2. Fetch Products strictly for this Brand from Database
    const { data: dbProducts } = await supabase
      .from('products')
      .select('*')
      .or(`vendor_id.eq.${vendorId},vendor_id.eq.${decodedSlug}`)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    // Fetch product variants for sizing & stock
    const productIds = (dbProducts || []).map((p: any) => p.id);
    const variantsMap = new Map<string, any[]>();
    if (productIds.length > 0) {
      const { data: variantsList } = await supabase
        .from('product_variants')
        .select('*')
        .in('product_id', productIds);
      if (variantsList && Array.isArray(variantsList)) {
        variantsList.forEach((v) => {
          if (!variantsMap.has(v.product_id)) {
            variantsMap.set(v.product_id, []);
          }
          variantsMap.get(v.product_id)!.push(v);
        });
      }
    }

    const formattedProducts = (dbProducts || []).map((p: any) => {
      let normalizedColors = [];
      if (Array.isArray(p.colors)) {
        normalizedColors = p.colors.map((c: any, idx: number) => 
          typeof c === 'string' ? { name: c === '#111111' ? 'Black' : c === '#ffffff' ? 'White' : `Color ${idx+1}`, hex: c } : c
        );
      }

      const pVariants = variantsMap.get(p.id) || [];
      const dynamicSizeStock: Record<string, { enabled: boolean; quantity: number }> = {};
      let dynamicTotalStock = 0;
      if (pVariants.length > 0) {
        pVariants.forEach((v) => {
          dynamicSizeStock[v.size] = { enabled: true, quantity: Number(v.stock_quantity) || 0 };
          dynamicTotalStock += Number(v.stock_quantity) || 0;
        });
      }

      const isAccessory = p.category === 'accessories';
      const resolvedSizes = isAccessory
        ? ['One Size']
        : Object.keys(dynamicSizeStock).length > 0
        ? Object.keys(dynamicSizeStock)
        : (p.category === 'footwear' ? ['40', '41', '42', '43', '44'] : ['S', 'M', 'L', 'XL', 'XXL']);

      const finalSizeStock = isAccessory
        ? { 'One Size': dynamicSizeStock['One Size'] || { enabled: true, quantity: 20 } }
        : Object.keys(dynamicSizeStock).length > 0
        ? dynamicSizeStock
        : (p.category === 'footwear'
          ? { '40': { enabled: true, quantity: 10 }, '41': { enabled: true, quantity: 10 }, '42': { enabled: true, quantity: 10 } }
          : { S: { enabled: true, quantity: 10 }, M: { enabled: true, quantity: 25 }, L: { enabled: true, quantity: 30 }, XL: { enabled: true, quantity: 15 }, XXL: { enabled: true, quantity: 5 } });

      const productMeta = parseProductMetaFromTags(Array.isArray(p.tags) ? p.tags : []);
      const cleanTags = (Array.isArray(p.tags) ? p.tags : []).filter(
        (t: string) =>
          typeof t === 'string' &&
          !t.startsWith('video:') &&
          !t.startsWith('img:') &&
          !t.startsWith('color_img:') &&
          !t.startsWith('ships_from:') &&
          !t.startsWith('subcat:') &&
          !t.startsWith('__')
      );
      return {
        id: p.id,
        vendorId: p.vendor_id,
        vendorName: brandName,
        name: p.name,
        price: Number(p.price),
        description: p.description || '',
        category: p.category || 'tops',
        genderTarget: p.gender_target || 'unisex',
        garmentOriginType: p.garment_origin_type || 'ready_made_boutique',
        fulfillmentType: productMeta.fulfillmentType,
        productionLeadTime: productMeta.productionLeadTime,
        imageUrl: p.image_url || '/images/no-product.svg',
        tags: cleanTags,
        colors: isAccessory ? [] : normalizedColors,
        sizes: resolvedSizes,
        sizeStock: finalSizeStock,
        stockQuantity: dynamicTotalStock > 0 ? dynamicTotalStock : (isAccessory ? 20 : 85),
        rating: 5.0,
        reviewCount: 18,
        createdAt: p.created_at
      };
    });

    const billingConfig = await fetchLivePlatformBillingConfig();
    const isPlus = isVendorPlusActive(parsedVendorBio, billingConfig);
    const storefrontLocked = !isPlus && billingConfig.requirePlusForStorefront;

    const vendorPayload = {
      id: vendorId,
      name: brandName,
      designerName: resolvedVendor?.designer_name || 'Boutique Manager',
      vendorType: resolvedVendor?.vendor_type || 'fashion_designer',
      origin: locationDisplay,
      city,
      state,
      country,
      bio: bioText,
      logoUrl,
      socialLinks,
      instagram: socialLinks.instagram,
      tiktok: socialLinks.tiktok,
      snapchat: socialLinks.snapchat,
      whatsapp: socialLinks.whatsapp || resolvedVendor?.phone,
      productCount: formattedProducts.length,
      satisfactionRate: null,
      deliveryDays: dispatchDays,
      isVerified: !!resolvedVendor?.is_verified,
      isPlus,
      storefrontCleanMode: isPlus,
      storefrontLocked,
    };

    return NextResponse.json({
      success: true,
      vendor: vendorPayload,
      products: storefrontLocked ? [] : formattedProducts,
      count: storefrontLocked ? 0 : formattedProducts.length,
      plan: {
        isPlus,
        freeLaunchMode: billingConfig.freeLaunchMode,
        storefrontCleanMode: isPlus,
        storefrontLocked,
        plusMonthlyPriceNgn: billingConfig.plusMonthlyPriceNgn,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
