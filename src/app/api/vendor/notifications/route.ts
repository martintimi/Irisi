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
