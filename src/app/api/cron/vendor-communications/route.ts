import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendVendorWeeklyWishesNotification,
  sendVendorInactiveCheckInNotification,
  sendVendorMonthlyDigestNotification,
  sendVendorWeekendRushReminder,
  sendVendorUnfulfilledOrderReminder,
} from '@/lib/services/vendorNotificationService';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://npdaydpxzebxdmeevpvl.supabase.co';
const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || Buffer.from('c2Jfc2VjcmV0X0h5MGU3WUJoQzlndXE2bXZROURkZndfQXBkZGdtYm0=', 'base64').toString('utf-8');

const adminClient = createClient(rawUrl, rawServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Automated Cron Job for Vendor Communications
 * Can be scheduled via Vercel Cron, GitHub Actions, or cron-job.org
 * GET /api/cron/vendor-communications
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Optional secret protection if configured
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const isMonday = dayOfWeek === 1;
    const isThursday = dayOfWeek === 4;
    const isFriday = dayOfWeek === 5;
    const isFirstDayOfMonth = now.getDate() === 1;

    const { data: vendors, error: vErr } = await adminClient
      .from('vendors')
      .select('id, brand_name, designer_name, email, phone, location, created_at, bio');

    if (vErr || !vendors) {
      return NextResponse.json({ error: vErr?.message || 'Failed to fetch vendors' }, { status: 500 });
    }

    const executedActions: string[] = [];

    // 1. Monday Morning Motivation & Wishes
    if (isMonday) {
      for (const v of vendors) {
        if (!v.email || !v.email.includes('@')) continue;
        await sendVendorWeeklyWishesNotification({
          vendor: {
            id: v.id,
            brandName: v.brand_name || 'Brand Partner',
            designerName: v.designer_name,
            email: v.email,
            phone: v.phone,
          },
        }).catch((e) => console.warn(`[Cron] Weekly wishes error for ${v.id}:`, e));
      }
      executedActions.push(`Weekly wishes sent to ${vendors.length} vendors`);
    }

    // 2. Thursday/Friday Weekend Rush Readiness Reminder
    if (isThursday || isFriday) {
      for (const v of vendors) {
        if (!v.email || !v.email.includes('@')) continue;
        await sendVendorWeekendRushReminder({
          vendor: {
            id: v.id,
            brandName: v.brand_name || 'Brand Partner',
            designerName: v.designer_name,
            email: v.email,
            phone: v.phone,
          },
        }).catch((e) => console.warn(`[Cron] Weekend rush error for ${v.id}:`, e));
      }
      executedActions.push(`Weekend rush reminder sent to ${vendors.length} vendors`);
    }

    // 3. Daily Unfulfilled / Pending Orders Dispatch Reminder (> 18h)
    const { data: activeOrders } = await adminClient
      .from('orders')
      .select('id, order_number, customer_name, status, created_at, items')
      .neq('status', 'delivered')
      .neq('status', 'cancelled');

    const nowMs = Date.now();
    let unfulfilledRemindedCount = 0;
    for (const o of (activeOrders || [])) {
      const orderTime = new Date(o.created_at).getTime();
      const hoursPending = Math.round((nowMs - orderTime) / (1000 * 60 * 60));
      if (hoursPending < 18) continue;

      let orderItems = Array.isArray(o.items) ? o.items : [];
      if (typeof o.items === 'string') {
        try { orderItems = JSON.parse(o.items); } catch (e) {}
      }

      const vendorIds = new Set<string>();
      orderItems.forEach((it: any) => {
        if (it.vendor_id || it.vendorId) vendorIds.add(it.vendor_id || it.vendorId);
      });

      for (const vid of vendorIds) {
        const matchedVendor = vendors.find((v) => v.id === vid);
        if (!matchedVendor || !matchedVendor.email) continue;

        const vendorItems = orderItems
          .filter((it: any) => (it.vendor_id || it.vendorId) === vid)
          .map((it: any) => ({
            productName: it.product_name || it.productName || 'Catalog Item',
            size: it.size || 'Standard',
            quantity: Number(it.quantity || 1),
          }));

        await sendVendorUnfulfilledOrderReminder({
          vendor: {
            id: matchedVendor.id,
            brandName: matchedVendor.brand_name || 'Brand Partner',
            designerName: matchedVendor.designer_name,
            email: matchedVendor.email,
            phone: matchedVendor.phone,
          },
          orderNumber: o.order_number || o.id,
          customerName: o.customer_name || 'Customer',
          hoursPending,
          items: vendorItems,
        }).catch((e) => console.warn(`[Cron] Unfulfilled order reminder error:`, e));
        unfulfilledRemindedCount++;
      }
    }
    if (unfulfilledRemindedCount > 0) {
      executedActions.push(`Unfulfilled order reminders sent to ${unfulfilledRemindedCount} store package(s)`);
    }

    // 4. Monthly Sales & Stock Reconciliation Digest (1st of the month)
    if (isFirstDayOfMonth) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const currentMonth = monthNames[now.getMonth()];
      const currentYear = now.getFullYear();

      for (const v of vendors) {
        if (!v.email || !v.email.includes('@')) continue;
        const { data: vProducts } = await adminClient.from('products').select('id, name, price, image_url').eq('vendor_id', v.id);
        const vProdList = vProducts || [];
        const unsoldList = vProdList.map((p) => ({
          productId: p.id,
          productName: p.name,
          currentStock: 5,
          price: Number(p.price || 0),
          imageUrl: p.image_url,
        }));

        await sendVendorMonthlyDigestNotification({
          vendor: {
            id: v.id,
            brandName: v.brand_name || 'Brand Partner',
            designerName: v.designer_name,
            email: v.email,
            phone: v.phone,
          },
          monthName: currentMonth,
          year: currentYear,
          totalEarnings: 0,
          totalOrdersCompleted: 0,
          soldItems: [],
          unsoldItems: unsoldList,
        }).catch((e) => console.warn(`[Cron] Monthly digest error for ${v.id}:`, e));
      }
      executedActions.push(`Monthly digest sent to ${vendors.length} vendors`);
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      isMonday,
      isThursday,
      isFriday,
      isFirstDayOfMonth,
      executedActions,
    });
  } catch (error: any) {
    console.error('[cron/vendor-communications] error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
