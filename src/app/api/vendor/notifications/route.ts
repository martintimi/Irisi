import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const headerVendorId = request.headers.get('x-vendor-id');
    const vendorId = (searchParams.get('vendorId') || headerVendorId || 'moji-wears').toLowerCase().trim();

    const supabase = await createClient();

    // 1. Fetch live orders
    const { data: rawOrders } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, total_amount, shipping_fee, status, created_at, customer_measurements, order_items(*)');

    const notifications: any[] = [];

    if (rawOrders && Array.isArray(rawOrders)) {
      rawOrders.forEach((o: any) => {
        const orderItems = o.order_items || o.customer_measurements?.items || [];
        const vendorItems = orderItems.filter((item: any) => {
          const itemVId = (item.vendor_id || item.vendorId || '').toLowerCase().trim();
          return itemVId === vendorId || itemVId.includes(vendorId) || vendorId.includes(itemVId);
        });

        if (vendorItems.length === 0) return;

        const vendorPackages = o.customer_measurements?.vendorPackages || {};
        const thisVendorPkg = vendorPackages[vendorId] || {};
        const stage = Number(thisVendorPkg.trackingStage || (
          thisVendorPkg.status === 'delivered' ? 4 :
          thisVendorPkg.status === 'dispatched' ? 3 :
          thisVendorPkg.status === 'packing' ? 2 :
          (o.status === 'delivered' ? 4 : o.status === 'dispatched' ? 3 : o.status === 'packing' ? 2 : 1)
        ));

        const vendorSubtotal = vendorItems.reduce((sum: number, it: any) => sum + (Number(it.price || 0) * (it.quantity || 1)), 0);
        // Vendor payout is strictly their garments escrow earnings. Delivery fees belong to couriers / transport drivers.
        const totalPayout = vendorSubtotal;

        // Notification A: New Order Pending Pack
        if (stage === 1) {
          notifications.push({
            id: `notif-new-${o.id}`,
            type: 'order_new',
            title: '📦 New Order Received',
            message: `Order ${o.order_number} from ${o.customer_name || 'Customer'} (${vendorItems.length} item(s)). Please pack & mark ready.`,
            orderNumber: o.order_number,
            orderId: o.id,
            amount: totalPayout,
            createdAt: o.created_at || new Date().toISOString(),
            link: '/vendor-portal/orders?tab=pending'
          });
        }

        // Notification B: Delivered & Escrow Released
        if (stage >= 4) {
          notifications.push({
            id: `notif-settled-${o.id}`,
            type: 'escrow_released',
            title: '💰 Payment Settled & Released',
            message: `${o.customer_name || 'Customer'} confirmed receipt for ${o.order_number}! ₦${totalPayout.toLocaleString()} has been credited to your available payout balance.`,
            orderNumber: o.order_number,
            orderId: o.id,
            amount: totalPayout,
            createdAt: thisVendorPkg.lastUpdated || o.created_at || new Date().toISOString(),
            link: '/vendor-portal/settlements'
          });
        }

        // Notification C: Customer Reviews on this order
        const reviews = o.customer_measurements?.reviews || [];
        reviews.forEach((rev: any) => {
          const revVId = (rev.vendorId || '').toLowerCase().trim();
          if (revVId === vendorId || revVId.includes(vendorId) || vendorId.includes(revVId)) {
            notifications.push({
              id: `notif-rev-${rev.id || o.id}`,
              type: 'review_received',
              title: `⭐ ${rev.rating}.0★ Review Received`,
              message: `${rev.customerName || 'Verified Buyer'} reviewed "${rev.productName || 'Garment'}": "${(rev.comment || 'Great quality!').substring(0, 60)}..."`,
              orderNumber: o.order_number,
              orderId: o.id,
              rating: rev.rating,
              fitRating: rev.fitRating,
              createdAt: rev.createdAt || o.created_at || new Date().toISOString(),
              link: '/vendor-portal/reviews'
            });
          }
        });
      });
    }

    // 2. Fetch vendor's products & variants to generate low-stock & sold-out alerts
    try {
      const { data: vendorProducts } = await supabase
        .from('products')
        .select('id, name, image_url, vendor_id')
        .or(`vendor_id.eq.${vendorId},vendor_id.ilike.%${vendorId}%`);

      if (vendorProducts && vendorProducts.length > 0) {
        const vProdIds = vendorProducts.map(p => p.id);
        const { data: prodVariants } = await supabase
          .from('product_variants')
          .select('*')
          .in('product_id', vProdIds);

        const variantsByProd = new Map<string, any[]>();
        (prodVariants || []).forEach(v => {
          if (!variantsByProd.has(v.product_id)) variantsByProd.set(v.product_id, []);
          variantsByProd.get(v.product_id)!.push(v);
        });

        vendorProducts.forEach(p => {
          const variants = variantsByProd.get(p.id) || [];
          if (variants.length === 0) return;

          const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0);

          if (totalStock === 0) {
            notifications.push({
              id: `notif-soldout-${p.id}`,
              type: 'stock_out',
              title: '🔴 Piece Completely Sold Out!',
              message: `"${p.name}" has 0 units remaining across all sizes and colors. Restock soon to keep receiving orders.`,
              productId: p.id,
              productName: p.name,
              imageUrl: p.image_url,
              createdAt: new Date().toISOString(),
              link: '/vendor-portal/publish'
            });
          } else if (totalStock <= 3) {
            notifications.push({
              id: `notif-lowstock-${p.id}`,
              type: 'stock_low',
              title: '⚠️ Low Stock Warning',
              message: `Only ${totalStock} unit(s) remaining for "${p.name}". Consider adding more stock.`,
              productId: p.id,
              productName: p.name,
              imageUrl: p.image_url,
              createdAt: new Date().toISOString(),
              link: '/vendor-portal/publish'
            });
          } else {
            // Check if any individual variant (color/size) is 0
            const soldOutVariants = variants.filter(v => Number(v.stock_quantity) === 0);
            if (soldOutVariants.length > 0 && soldOutVariants.length < variants.length) {
              const variantLabels = soldOutVariants.map(v => `${v.size}${v.color ? ` (${v.color})` : ''}`).slice(0, 2).join(', ');
              notifications.push({
                id: `notif-varout-${p.id}-${soldOutVariants[0].id}`,
                type: 'variant_sold_out',
                title: '⚠️ Variant Sold Out',
                message: `Variant ${variantLabels} for "${p.name}" is sold out (0 left). Restock to satisfy customer demand.`,
                productId: p.id,
                productName: p.name,
                imageUrl: p.image_url,
                createdAt: new Date().toISOString(),
                link: '/vendor-portal/publish'
              });
            }
          }
        });
      }
    } catch (invNotifErr) {
      console.warn('Error fetching inventory notifications:', invNotifErr);
    }

    // Sort newest first
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error: any) {
    console.error('API /api/vendor/notifications error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
