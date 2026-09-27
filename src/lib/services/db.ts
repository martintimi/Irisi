import { supabase } from '@/lib/supabase/client';
import { Product, VendorProfile, Order, NotificationItem } from '@/types';

// 1. Fetch Products
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, vendors(brand_name, designer_name, location)')
      .eq('is_published', true);

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      vendorId: item.vendor_id,
      vendorName: item.vendors?.brand_name || 'Ìrísí Partner Brand',
      name: item.name,
      price: Number(item.price),
      description: item.description,
      category: item.category,
      genderTarget: item.gender_target,
      garmentOriginType: item.garment_origin_type,
      imageUrl: item.image_url,
      tags: item.tags || [],
      colors: item.colors || [],
      sizes: item.sizes || ['S', 'M', 'L', 'XL', 'XXL'],
      sizeChart: item.size_chart || {},
      fabricComposition: item.fabric_composition || 'Premium Cotton Blend',
      fitNotes: item.fit_notes || 'Fits true to size',
      rating: item.rating || 0,
      reviewCount: item.review_count || 0,
      layerZIndex: 1,
    }));
  } catch (err) {
    console.error('Supabase fetch error:', err);
    return [];
  }
}

// 2. Fetch Vendors
export async function getVendors(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from('vendors').select('*');
    if (error || !data || data.length === 0) {
      return [];
    }
    return data.map((v: any) => ({
      id: v.id,
      name: v.brand_name,
      code: v.id.slice(0, 3).toUpperCase(),
      avatarUrl: '/images/products/BlackSenator.jpg',
      bannerUrl: '/images/products/BlackAgbada.jpg',
      bio: v.bio,
      location: v.location,
      rating: Number(v.rating) || 5.0,
      reviewCount: 48,
      leadTimeDays: v.vendor_type === 'fashion_designer' ? '4 - 7 Business Days' : 'Same-Day Dispatch',
      shippingFee: 2500,
      deliveryDays: '1 - 2 business days (Lagos Hub)',
      isVerified: v.is_verified,
      specialties: ['Native Senator Sets', 'Ceremonial Agbada'],
      featuredProducts: [],
    }));
  } catch {
    return [];
  }
}

// 3. Create Order
export async function createOrder(order: any) {
  try {
    const { data, error } = await supabase.from('orders').insert({
      id: order.id,
      order_number: order.orderNumber,
      customer_name: order.customerName,
      customer_email: order.customerEmail,
      customer_phone: order.customerPhone,
      delivery_address: order.deliveryAddress,
      delivery_city: order.deliveryCity,
      subtotal: order.subtotal || order.totalAmount,
      shipping_fee: order.shippingFee || 0,
      total_amount: order.totalAmount,
      status: order.status || 'calibrated',
      payment_ref: order.paymentRef || order.paystackRef,
      customer_measurements: order.customerMeasurements || {},
    }).select().single();

    if (error) {
      console.warn('Could not save order to Supabase:', error.message);
    }
    return data;
  } catch (err) {
    console.error('Order creation error:', err);
  }
}

// 4. Curated Wardrobe Vault Sync
export async function syncVaultItem(userId: string, productId: string, action: 'add' | 'remove') {
  try {
    if (action === 'add') {
      await supabase.from('vault_items').upsert({ user_id: userId, product_id: productId });
    } else {
      await supabase.from('vault_items').delete().match({ user_id: userId, product_id: productId });
    }
  } catch (err) {
    console.error('Vault sync error:', err);
  }
}
