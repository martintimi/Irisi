import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { vendors as staticVendors } from '@/lib/data/vendors';
import { products as staticProducts } from '@/lib/data/products';

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
      // Check static fallback design houses (e.g. Sartorial Lagos, Street Souk Co., Yaba Denim Works, Kano Artisan Footwear)
      const staticMatch = staticVendors.find((v: any) =>
        v.id?.toLowerCase() === decodedSlug ||
        (v.id?.toLowerCase() === 'lagos-streetwear' && (decodedSlug === 'street-souk' || decodedSlug === 'street-souk-co')) ||
        v.name?.toLowerCase() === cleanBrandName ||
        v.name?.toLowerCase().replace(/\s+/g, '-') === decodedSlug ||
        v.id?.toLowerCase().replace(/[-_]/g, '') === decodedSlug.replace(/[-_]/g, '')
      );

      if (!staticMatch) {
        return NextResponse.json({ error: `Brand storefront for "${slug}" not found` }, { status: 404 });
      }

      const matchedProducts = staticProducts
        .filter((p: any) => p.vendorId === staticMatch.id || (staticMatch.id === 'lagos-streetwear' && (p.vendorId === 'street-souk' || p.vendorId === 'lagos-streetwear')))
        .map((p: any) => ({
          id: p.id,
          vendorId: staticMatch.id,
          vendorName: staticMatch.name,
          name: p.name,
          price: Number(p.price),
          description: p.description || '',
          category: p.category || 'tops',
          genderTarget: p.genderTarget || 'unisex',
          garmentOriginType: p.garmentOriginType || 'ready_made_boutique',
          imageUrl: p.imageUrl || '/images/products/BlackTrapStarHoodie.jpg',
          tags: p.tags || [],
          colors: p.colors || [],
          sizes: p.sizes || ['S', 'M', 'L', 'XL'],
          sizeStock: p.sizes ? Object.fromEntries(p.sizes.map((s: string) => [s, { enabled: true, quantity: 15 }])) : { M: { enabled: true, quantity: 15 } },
          stockQuantity: 50,
          rating: p.rating || 4.9,
          reviewCount: p.reviewCount || 24,
          createdAt: new Date().toISOString()
        }));

      const vendorPayload = {
        id: staticMatch.id,
        name: staticMatch.name,
        designerName: 'Lead Designer & Atelier Director',
        vendorType: staticMatch.vendorType || 'fashion_designer',
        origin: staticMatch.origin,
        city: staticMatch.origin?.split(',')?.[0]?.trim() || 'Lagos',
        state: staticMatch.origin?.split(',')?.[1]?.trim() || 'Lagos State',
        bio: staticMatch.description || staticMatch.tagline || '',
        socialLinks: {
          instagram: `@${staticMatch.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          tiktok: '',
          snapchat: '',
          whatsapp: '2348000000000'
        },
        instagram: `@${staticMatch.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        tiktok: '',
        snapchat: '',
        whatsapp: '2348000000000',
        productCount: matchedProducts.length,
        satisfactionRate: staticMatch.satisfactionRate || 99.2,
        deliveryDays: staticMatch.deliveryDays || '1-2 business days',
        isVerified: true
      };

      return NextResponse.json({
        success: true,
        vendor: vendorPayload,
        products: matchedProducts,
        count: matchedProducts.length
      });
    }

    const vendorId = resolvedVendor?.id || decodedSlug.replace(/\s+/g, '-');
    const brandName = resolvedVendor?.brand_name || cleanBrandName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // Parse bio, location, turnaround, logo and multi-social links
    let bioText = resolvedVendor?.bio || '';
    let logoUrl = resolvedVendor?.logo_url || resolvedVendor?.logo || '';
    let city = '';
    let state = '';
    let dispatchDays = '1-2 business days';
    let socialLinks: any = {
      instagram: '',
      tiktok: '',
      snapchat: '',
      whatsapp: resolvedVendor?.phone || ''
    };

    if (bioText.startsWith('{') && bioText.endsWith('}')) {
      try {
        const parsed = JSON.parse(bioText);
        bioText = parsed.bio || '';
        logoUrl = parsed.logoUrl || parsed.logo || logoUrl;
        city = parsed.city || '';
        state = parsed.state || '';
        dispatchDays = parsed.dispatchDays || '1-2 business days';
        if (parsed.socialLinks) {
          socialLinks = { ...socialLinks, ...parsed.socialLinks };
        }
      } catch (e) {}
    }

    // Return exact bio without mock fallbacks
    bioText = typeof bioText === 'string' ? bioText.trim() : '';

    const locationDisplay = resolvedVendor?.location || (city && state ? `${city}, ${state}` : city || state || 'Nigeria');

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
        imageUrl: p.image_url || '/images/products/BlackTrapStarHoodie.jpg',
        tags: Array.isArray(p.tags) ? p.tags : [],
        colors: isAccessory ? [] : normalizedColors,
        sizes: resolvedSizes,
        sizeStock: finalSizeStock,
        stockQuantity: dynamicTotalStock > 0 ? dynamicTotalStock : (isAccessory ? 20 : 85),
        rating: 5.0,
        reviewCount: 18,
        createdAt: p.created_at
      };
    });

    const vendorPayload = {
      id: vendorId,
      name: brandName,
      designerName: resolvedVendor?.designer_name || 'Boutique Manager',
      vendorType: resolvedVendor?.vendor_type || 'fashion_designer',
      origin: locationDisplay,
      city,
      state,
      bio: bioText,
      logoUrl,
      socialLinks,
      instagram: socialLinks.instagram,
      tiktok: socialLinks.tiktok,
      snapchat: socialLinks.snapchat,
      whatsapp: socialLinks.whatsapp || resolvedVendor?.phone,
      productCount: formattedProducts.length,
      satisfactionRate: 99.4,
      deliveryDays: dispatchDays,
      isVerified: true
    };

    return NextResponse.json({
      success: true,
      vendor: vendorPayload,
      products: formattedProducts,
      count: formattedProducts.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
