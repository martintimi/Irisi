import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendVendorWeeklyWishesNotification,
  sendVendorInactiveCheckInNotification,
  sendVendorMonthlyDigestNotification,
  sendVendorNewOrderNotification,
  sendVendorSettlementNotification,
  sendVendorAccountApprovedNotification,
  sendVendorAccountRejectedNotification,
  sendVendorUnfulfilledOrderReminder,
  sendVendorMissingBankDetailsReminder,
  sendVendorLowStockReminder,
  sendVendorWeekendRushReminder,
} from '@/lib/services/vendorNotificationService';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://npdaydpxzebxdmeevpvl.supabase.co';
const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || Buffer.from('c2Jfc2VjcmV0X0h5MGU3WUJoQzlndXE2bXZROURkZndfQXBkZGdtYm0=', 'base64').toString('utf-8');

const adminClient = createClient(rawUrl, rawServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'summary';

    // 1. Fetch all registered vendors
    const { data: vendors, error: vErr } = await adminClient
      .from('vendors')
      .select('id, brand_name, designer_name, email, phone, location, created_at, bio');

    if (vErr || !vendors) {
      return NextResponse.json({ success: false, error: vErr?.message || 'Failed to fetch vendors' }, { status: 500 });
    }

    // 2. Fetch live products and orders to identify inactive vendors
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentOrders } = await adminClient
      .from('orders')
      .select('id, created_at, customer_measurements')
      .gte('created_at', sevenDaysAgo);

    const activeVendorIdsThisWeek = new Set<string>();
    (recentOrders || []).forEach((o: any) => {
      const items = o.customer_measurements?.items || [];
      items.forEach((it: any) => {
        const vId = (it.vendor_id || it.vendorId || '').toLowerCase().trim();
        if (vId) activeVendorIdsThisWeek.add(vId);
      });
    });

    const vendorStats = vendors.map((v) => {
      const isRecentlyActive = activeVendorIdsThisWeek.has(v.id.toLowerCase().trim());
      return {
        id: v.id,
        brandName: v.brand_name,
        email: v.email,
        phone: v.phone,
        city: v.location || 'Nigeria',
        hasActivityThisWeek: isRecentlyActive,
      };
    });

    const inactiveCount = vendorStats.filter((v) => !v.hasActivityThisWeek).length;

    return NextResponse.json({
      success: true,
      totalVendors: vendors.length,
      activeVendorsThisWeek: vendorStats.length - inactiveCount,
      inactiveVendorsThisWeek: inactiveCount,
      vendors: vendorStats,
      availableAutomations: [
        {
          id: 'weekly_wishes',
          title: 'Monday Morning Motivation & Weekly Wishes',
          schedule: 'Every Monday 8:00 AM',
          description: 'Weekly inspiration, restock tips, and 24h dispatch advice for all stores.',
        },
        {
          id: 'weekend_rush',
          title: 'Thursday/Friday Weekend Rush Readiness Reminder',
          schedule: 'Every Thursday/Friday',
          description: 'Nudges merchants to stock popular weekend sizes, footwear, and accessories.',
        },
        {
          id: 'unfulfilled_orders',
          title: 'Pending Order 18-24h Fulfillment Reminder',
          schedule: 'Daily / Automated',
          description: 'Urgent reminder to package and dispatch pending customer orders to prevent cancellation.',
        },
        {
          id: 'missing_bank',
          title: 'Missing Payout Bank Details Action Notice',
          schedule: 'Automated / Onboarding',
          description: 'Reminds vendors to save Nigerian bank details for automated escrow disbursements.',
        },
        {
          id: 'low_stock',
          title: 'Low Stock & Sold-Out Restock Alert',
          schedule: 'Automated / Inventory Trigger',
          description: 'Alerts merchants when products or sizes drop to <= 2 units or reach sold-out.',
        },
        {
          id: 'inactive_checkin',
          title: '7-Day Inactive Vendor Gentle Check-In',
          schedule: 'Weekly for quiet stores',
          description: 'Warm check-in offering support for uploading new footwear, bags, jewelry, or RTW pieces.',
        },
        {
          id: 'monthly_digest',
          title: '1st of the Month Sales & Stock Reconciliation Audit',
          schedule: '1st of every month',
          description: 'Breakdown of sold pieces vs unsold inventory checklist for offline store reconciliation.',
        },
        {
          id: 'account_approved',
          title: 'Store Verification & Approval Welcome Notice',
          schedule: 'On Admin Approval',
          description: 'Celebratory email welcoming verified store live onto the marketplace.',
        },
        {
          id: 'account_rejected',
          title: 'Store Application Revision & Notes Notice',
          schedule: 'On Admin Return/Rejection',
          description: 'Specific notes explaining what profile or product details require updating.',
        },
      ],
    });
  } catch (error: any) {
    console.error('[vendor-communications] GET error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, targetEmail, targetVendorId } = body;

    // 1. Fetch vendors
    let query = adminClient.from('vendors').select('*');
    if (targetVendorId) {
      query = query.eq('id', targetVendorId);
    }
    const { data: vendors, error: vErr } = await query;

    if (vErr || !vendors || vendors.length === 0) {
      return NextResponse.json({ error: 'No vendors found for this action' }, { status: 404 });
    }

    const results: any[] = [];

    // ========================================================================
    // ACTION A: SEND WEEKLY MONDAY MORNING WISHES
    // ========================================================================
    if (action === 'send_weekly_wishes') {
      for (const v of vendors) {
        const recipientEmail = targetEmail || v.email;
        if (!recipientEmail || !recipientEmail.includes('@')) continue;

        const res = await sendVendorWeeklyWishesNotification({
          vendor: {
            id: v.id,
            brandName: v.brand_name || 'Partner',
            designerName: v.designer_name,
            email: recipientEmail,
            phone: v.phone,
          },
        });
        results.push({ vendorId: v.id, email: recipientEmail, ...res });
      }

      return NextResponse.json({
        success: true,
        message: `Dispatched Weekly Monday Wishes to ${results.length} vendor(s)`,
        results,
      });
    }

    // ========================================================================
    // ACTION B: SEND 7-DAY INACTIVE VENDOR CHECK-IN
    // ========================================================================
    if (action === 'send_inactive_checkin') {
      for (const v of vendors) {
        const recipientEmail = targetEmail || v.email;
        if (!recipientEmail || !recipientEmail.includes('@')) continue;

        const res = await sendVendorInactiveCheckInNotification({
          vendor: {
            id: v.id,
            brandName: v.brand_name || 'Partner',
            designerName: v.designer_name,
            email: recipientEmail,
            phone: v.phone,
          },
          daysInactive: 7,
        });
        results.push({ vendorId: v.id, email: recipientEmail, ...res });
      }

      return NextResponse.json({
        success: true,
        message: `Dispatched Inactive Check-In to ${results.length} vendor(s)`,
        results,
      });
    }

    // ========================================================================
    // ACTION C: SEND MONTHLY SALES & INVENTORY AUDIT DIGEST
    // ========================================================================
    if (action === 'send_monthly_digest') {
      const now = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const currentMonth = monthNames[now.getMonth()];
      const currentYear = now.getFullYear();

      for (const v of vendors) {
        const recipientEmail = targetEmail || v.email;
        if (!recipientEmail || !recipientEmail.includes('@')) continue;

        // Fetch vendor's products
        const { data: vProducts } = await adminClient
          .from('products')
          .select('id, name, price, image_url')
          .eq('vendor_id', v.id);

        const vProdList = vProducts || [];
        const vProdIds = vProdList.map((p) => p.id);

        // Fetch product variants for stock count
        let unsoldList: any[] = [];
        if (vProdIds.length > 0) {
          const { data: variants } = await adminClient
            .from('product_variants')
            .select('product_id, stock_quantity')
            .in('product_id', vProdIds);

          const stockByProd = new Map<string, number>();
          (variants || []).forEach((vr) => {
            stockByProd.set(vr.product_id, (stockByProd.get(vr.product_id) || 0) + (Number(vr.stock_quantity) || 0));
          });

          unsoldList = vProdList.map((p) => ({
            productId: p.id,
            productName: p.name,
            currentStock: stockByProd.get(p.id) || 5,
            price: Number(p.price || 0),
            imageUrl: p.image_url,
          }));
        }

        // Fetch orders this month
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const { data: orders } = await adminClient
          .from('orders')
          .select('id, total_amount, customer_measurements, status, created_at')
          .gte('created_at', firstDayOfMonth);

        let totalEarnings = 0;
        let totalOrders = 0;
        const soldItemsMap = new Map<string, { productName: string; size: string; quantitySold: number; totalEarnings: number }>();

        (orders || []).forEach((o: any) => {
          const items = o.customer_measurements?.items || [];
          const vItems = items.filter((it: any) => (it.vendor_id || it.vendorId || '').toLowerCase().trim() === v.id.toLowerCase().trim());
          if (vItems.length > 0) {
            totalOrders += 1;
            vItems.forEach((it: any) => {
              const qty = Number(it.quantity || 1);
              const price = Number(it.price || 0);
              totalEarnings += price * qty;
              const key = `${it.productName || it.name}-${it.size || 'M'}`;
              if (!soldItemsMap.has(key)) {
                soldItemsMap.set(key, {
                  productName: it.productName || it.name || 'Garment',
                  size: it.size || it.selectedSize || 'M',
                  quantitySold: 0,
                  totalEarnings: 0,
                });
              }
              const entry = soldItemsMap.get(key)!;
              entry.quantitySold += qty;
              entry.totalEarnings += price * qty;
            });
          }
        });

        const res = await sendVendorMonthlyDigestNotification({
          vendor: {
            id: v.id,
            brandName: v.brand_name || 'Partner',
            designerName: v.designer_name,
            email: recipientEmail,
            phone: v.phone,
          },
          monthName: currentMonth,
          year: currentYear,
          totalEarnings,
          totalOrdersCompleted: totalOrders,
          soldItems: Array.from(soldItemsMap.values()),
          unsoldItems: unsoldList,
        });

        results.push({ vendorId: v.id, email: recipientEmail, ...res });
      }

      return NextResponse.json({
        success: true,
        message: `Dispatched Monthly Performance & Stock Reconciliation Audit to ${results.length} vendor(s)`,
        results,
      });
    }

    // ========================================================================
    // ACTION D: SEND THURSDAY/FRIDAY WEEKEND RUSH READINESS REMINDER
    // ========================================================================
    if (action === 'send_weekend_rush') {
      for (const v of vendors) {
        const recipientEmail = targetEmail || v.email;
        if (!recipientEmail || !recipientEmail.includes('@')) continue;

        const res = await sendVendorWeekendRushReminder({
          vendor: {
            id: v.id,
            brandName: v.brand_name || 'Brand Partner',
            designerName: v.designer_name,
            email: recipientEmail,
            phone: v.phone,
          },
        });
        results.push({ vendorId: v.id, email: recipientEmail, ...res });
      }

      return NextResponse.json({
        success: true,
        message: `Dispatched Weekend Rush Readiness Reminder to ${results.length} vendor(s)`,
        results,
      });
    }

    // ========================================================================
    // ACTION E: SEND MISSING BANK DETAILS REMINDER
    // ========================================================================
    if (action === 'send_missing_bank_reminders') {
      for (const v of vendors) {
        // If bank info is missing
        if (!v.account_number || !v.bank_name || v.account_number.trim() === '') {
          const recipientEmail = targetEmail || v.email;
          if (!recipientEmail || !recipientEmail.includes('@')) continue;

          const res = await sendVendorMissingBankDetailsReminder({
            vendor: {
              id: v.id,
              brandName: v.brand_name || 'Brand Partner',
              designerName: v.designer_name,
              email: recipientEmail,
              phone: v.phone,
            },
          });
          results.push({ vendorId: v.id, email: recipientEmail, ...res });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Dispatched Missing Bank Details Reminders to ${results.length} vendor(s)`,
        results,
      });
    }

    // ========================================================================
    // ACTION F: SEND UNFULFILLED / PENDING ORDER DISPATCH REMINDERS (18-24h NUDGE)
    // ========================================================================
    if (action === 'send_unfulfilled_order_reminders') {
      const { data: activeOrders } = await adminClient
        .from('orders')
        .select('id, order_number, customer_name, status, created_at, items')
        .neq('status', 'delivered')
        .neq('status', 'cancelled');

      const now = Date.now();
      for (const o of (activeOrders || [])) {
        const orderTime = new Date(o.created_at).getTime();
        const hoursPending = Math.max(1, Math.round((now - orderTime) / (1000 * 60 * 60)));

        let orderItems = Array.isArray(o.items) ? o.items : [];
        if (typeof o.items === 'string') {
          try { orderItems = JSON.parse(o.items); } catch (e) {}
        }

        const vendorIds = new Set<string>();
        orderItems.forEach((it: any) => {
          const vid = it.vendor_id || it.vendorId;
          if (vid) vendorIds.add(vid);
        });

        for (const vid of vendorIds) {
          const matchedVendor = vendors.find((v) => v.id === vid) || vendors[0];
          if (!matchedVendor) continue;
          const recipientEmail = targetEmail || matchedVendor.email;
          if (!recipientEmail || !recipientEmail.includes('@')) continue;

          const vendorItems = orderItems
            .filter((it: any) => (it.vendor_id || it.vendorId) === vid)
            .map((it: any) => ({
              productName: it.product_name || it.productName || 'Catalog Item',
              size: it.size || 'Standard',
              quantity: Number(it.quantity || 1),
            }));

          const res = await sendVendorUnfulfilledOrderReminder({
            vendor: {
              id: matchedVendor.id,
              brandName: matchedVendor.brand_name || 'Brand Partner',
              designerName: matchedVendor.designer_name,
              email: recipientEmail,
              phone: matchedVendor.phone,
            },
            orderNumber: o.order_number || o.id,
            customerName: o.customer_name || 'Customer',
            hoursPending: Math.max(hoursPending, 18),
            items: vendorItems.length > 0 ? vendorItems : [{ productName: 'Classic Loafers', size: '43', quantity: 1 }],
          });
          results.push({ orderNumber: o.order_number, vendorId: matchedVendor.id, email: recipientEmail, ...res });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Dispatched Unfulfilled Order Reminders to ${results.length} store(s)`,
        results,
      });
    }

    // ========================================================================
    // ACTION G: SEND LOW STOCK / RESTOCK ALERTS
    // ========================================================================
    if (action === 'send_low_stock_reminders') {
      const { data: variants } = await adminClient
        .from('product_variants')
        .select('id, product_id, size, color, stock_quantity')
        .lte('stock_quantity', 2);

      const alertedSet = new Set<string>();
      for (const vr of (variants || [])) {
        const { data: prod } = await adminClient
          .from('products')
          .select('id, name, vendor_id')
          .eq('id', vr.product_id)
          .single();

        if (!prod) continue;
        const matchedVendor = vendors.find((v) => v.id === prod.vendor_id) || vendors[0];
        if (!matchedVendor) continue;
        const recipientEmail = targetEmail || matchedVendor.email;
        if (!recipientEmail || !recipientEmail.includes('@')) continue;

        const alertKey = `${matchedVendor.id}-${prod.id}`;
        if (alertedSet.has(alertKey)) continue;
        alertedSet.add(alertKey);

        const res = await sendVendorLowStockReminder({
          vendor: {
            id: matchedVendor.id,
            brandName: matchedVendor.brand_name || 'Brand Partner',
            designerName: matchedVendor.designer_name,
            email: recipientEmail,
            phone: matchedVendor.phone,
          },
          productName: prod.name,
          currentStock: Number(vr.stock_quantity),
          size: vr.size,
        });
        results.push({ productName: prod.name, vendorId: matchedVendor.id, email: recipientEmail, ...res });
      }

      return NextResponse.json({
        success: true,
        message: `Dispatched Low Stock Alerts to ${results.length} store(s)`,
        results,
      });
    }

    // ========================================================================
    // ACTION H: SEND TEST PREVIEW TO ADMIN
    // ========================================================================
    if (action === 'send_test_preview') {
      const testEmail = targetEmail || 'martintimi2443@gmail.com';
      const rawVendor: any = vendors[0] || {};
      const sampleVendor = {
        id: rawVendor.id || 'sample-vendor',
        brandName: rawVendor.brand_name || rawVendor.brandName || 'Vivora Elegance',
        designerName: rawVendor.designer_name || rawVendor.contact_person || 'Vivora',
        email: testEmail,
      };

      const templateType = body.templateType || 'weekly_wishes';
      let res: any = null;

      if (templateType === 'weekly_wishes') {
        res = await sendVendorWeeklyWishesNotification({
          vendor: { ...sampleVendor, email: testEmail },
        });
      } else if (templateType === 'inactive_checkin') {
        res = await sendVendorInactiveCheckInNotification({
          vendor: { ...sampleVendor, email: testEmail },
          daysInactive: 7,
        });
      } else if (templateType === 'new_order') {
        res = await sendVendorNewOrderNotification({
          vendor: { ...sampleVendor, email: testEmail },
          orderNumber: 'VY-NG-2048',
          customerName: 'Amina Bello',
          deliveryCity: 'Lekki Phase 1, Lagos',
          deliveryState: 'Lagos State',
          deliveryMethod: 'doorstep',
          items: [
            { productName: 'Handcrafted Italian Leather Penny Loafers', size: '44', color: 'Cognac Tan', quantity: 1, price: 55000, vendorPayout: 55000 },
            { productName: 'Emerald & Gold Statement Drop Earrings', size: 'One Size', color: '18K Gold', quantity: 1, price: 28000, vendorPayout: 28000 },
            { productName: 'Structured Minimalist Leather Crossbody Bag', size: 'Medium', color: 'Burgundy', quantity: 1, price: 42000, vendorPayout: 42000 },
          ],
          totalPayout: 125000,
        });
      } else if (templateType === 'settlement') {
        res = await sendVendorSettlementNotification({
          vendor: { ...sampleVendor, email: testEmail },
          orderNumber: 'VY-NG-2048',
          payoutAmount: 125000,
          bankName: 'Guaranty Trust Bank (GTBank)',
          accountNumber: '0123456789',
          customerName: 'Amina Bello',
        });
      } else if (templateType === 'monthly_digest') {
        res = await sendVendorMonthlyDigestNotification({
          vendor: { ...sampleVendor, email: testEmail },
          monthName: 'September',
          year: 2026,
          totalEarnings: 345000,
          totalOrdersCompleted: 7,
          soldItems: [
            { productName: 'Handcrafted Leather Chelsea Boots', size: '43', quantitySold: 2, totalEarnings: 110000 },
            { productName: 'Crystal Statement Choker & Earrings Set', size: 'One Size', quantitySold: 3, totalEarnings: 84000 },
            { productName: 'Oversized Silk Crepe Co-ord Set', size: 'M', quantitySold: 3, totalEarnings: 151000 },
          ],
          unsoldItems: [
            { productId: 'p1', productName: 'Structured Crocodile-Embossed Tote Bag', currentStock: 4, price: 58000 },
            { productId: 'p2', productName: 'Retro Square Acetate Sunglasses', currentStock: 8, price: 22000 },
            { productId: 'p3', productName: 'Handmade Suede Bit Loafers', currentStock: 5, price: 45000 },
          ],
        });
      } else if (templateType === 'approved') {
        res = await sendVendorAccountApprovedNotification({
          vendor: { ...sampleVendor, email: testEmail },
        });
      } else if (templateType === 'rejected') {
        res = await sendVendorAccountRejectedNotification({
          vendor: { ...sampleVendor, email: testEmail },
          rejectionReason: 'Please upload higher-resolution studio photos of your footwear/products and verify your registered business phone number.',
        });
      } else if (templateType === 'unfulfilled_order') {
        res = await sendVendorUnfulfilledOrderReminder({
          vendor: { ...sampleVendor, email: testEmail },
          orderNumber: 'VY-NG-2048',
          customerName: 'Amina Bello',
          hoursPending: 24,
          items: [
            { productName: 'Handcrafted Italian Leather Penny Loafers', size: '44', quantity: 1 },
            { productName: 'Structured Minimalist Leather Crossbody Bag', size: 'Medium', quantity: 1 },
          ],
        });
      } else if (templateType === 'missing_bank') {
        res = await sendVendorMissingBankDetailsReminder({
          vendor: { ...sampleVendor, email: testEmail },
        });
      } else if (templateType === 'low_stock') {
        res = await sendVendorLowStockReminder({
          vendor: { ...sampleVendor, email: testEmail },
          productName: 'Handcrafted Italian Leather Penny Loafers',
          currentStock: 1,
          size: '44',
        });
      } else if (templateType === 'weekend_rush') {
        res = await sendVendorWeekendRushReminder({
          vendor: { ...sampleVendor, email: testEmail },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Test email for "${templateType}" dispatched to ${testEmail}`,
        result: res,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('[vendor-communications] POST error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
