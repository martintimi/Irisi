import { sendOrderConfirmationEmail, sendDispatchNotificationEmail, sendOrderPackedEmail, sendOrderDeliveredCustomerEmail } from '@/lib/services/emailService';
import { sendVendorNewOrderNotification, sendVendorSettlementNotification } from '@/lib/services/vendorNotificationService';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeVendorPackageMetrics, checkLocationServiceability, createShipbubbleShipment } from '@/lib/services/logistics';
import { fetchLivePlatformBillingConfig } from '@/lib/config/platformBillingServer';
import { getEffectiveCommissionPercent } from '@/lib/config/platformBilling';
import {
  sendVendorNewOrderSms,
  sendBuyerOrderConfirmedSms,
  sendBuyerOrderDispatchedSms,
  sendBuyerOrderDeliveredSms,
  sendVendorPayoutReleasedSms,
} from '@/lib/services/smsService';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const emailParam = searchParams.get('email');
    const orderNumberParam = searchParams.get('orderNumber');
    
    // Resolve vendorId from Query -> Header
    let vendorIdParam = 
      searchParams.get('vendorId') || 
      request.headers.get('x-vendor-id');

    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(limit);

    if (orderNumberParam) {
      query = query.or(`order_number.ilike.%${orderNumberParam}%,id.eq.${orderNumberParam}`);
    } else if (emailParam) {
      query = query.ilike('customer_email', `%${emailParam}%`);
    }

    const { data: rawOrders, error } = await query;

    if (error) {
      console.error('Error fetching orders from DB:', error);
      return NextResponse.json({ success: false, orders: [] });
    }

    // Query products table to map actual image_url by product_id
    const { data: allDbProducts } = await supabase.from('products').select('id, image_url, name');
    const productImageMap = new Map<string, string>();
    if (allDbProducts && Array.isArray(allDbProducts)) {
      allDbProducts.forEach(p => {
        if (p.id && p.image_url) {
          productImageMap.set(p.id, p.image_url);
        }
      });
    }

    let filtered = rawOrders || [];

    // If vendorId is specified, filter for orders containing this vendor's items
    if (vendorIdParam && vendorIdParam !== 'all') {
      const cleanVendorId = vendorIdParam.toLowerCase().trim();
      filtered = filtered.filter((ord: any) => {
        return (ord.order_items || []).some((item: any) => {
          const itemVId = (item.vendor_id || '').toLowerCase().trim();
          return itemVId === cleanVendorId || itemVId.includes(cleanVendorId) || cleanVendorId.includes(itemVId);
        });
      });
    }

    // Format orders for standard frontend consumption
    const formattedOrders = filtered.map((o: any) => {
      const dateObj = new Date(o.created_at || Date.now());
      const dateStr = dateObj.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
      const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

      const vendorPackages = o.customer_measurements?.vendorPackages || {};
      const trackingDetails = o.customer_measurements?.trackingDetails || {};

      // Resilient items lookup: use order_items from DB or fallback to customer_measurements.items
      let sourceItems = (o.order_items && o.order_items.length > 0)
        ? o.order_items
        : (o.customer_measurements?.items || []);

      // Filter items strictly for this vendor if vendorId is requested
      let relevantItems = sourceItems;
      if (vendorIdParam && vendorIdParam !== 'all') {
        const cleanVendorId = vendorIdParam.toLowerCase().trim();
        const vendorSpecificItems = sourceItems.filter((item: any) => {
          const itemVId = (item.vendor_id || item.vendorId || '').toLowerCase().trim();
          return itemVId === cleanVendorId || itemVId.includes(cleanVendorId) || cleanVendorId.includes(itemVId);
        });
        relevantItems = vendorSpecificItems;
      }

      // Per-vendor scoping: when a vendor calls this API, use THEIR package status & stage!
      let resolvedStatus = o.status || 'escrow_secured';
      let resolvedStage = o.status === 'delivered' ? 4 : o.status === 'dispatched' ? 3 : (o.status === 'packing' || o.status === 'ready') ? 2 : 1;
      let resolvedTrackingDetails = trackingDetails;

      if (vendorIdParam && vendorIdParam !== 'all') {
        const cleanVId = vendorIdParam.toLowerCase().trim();
        const thisVendorPkg = vendorPackages[cleanVId];

        if (thisVendorPkg) {
          resolvedStage = Number(thisVendorPkg.trackingStage || 1);
          resolvedStatus = thisVendorPkg.status || (resolvedStage === 4 ? 'delivered' : resolvedStage === 3 ? 'dispatched' : resolvedStage === 2 ? 'packing' : 'escrow_secured');
          resolvedTrackingDetails = {
            status: resolvedStatus,
            trackingStage: resolvedStage,
            waybillNumber: thisVendorPkg.waybillNumber || '',
            driverPhone: thisVendorPkg.driverPhone || '',
            driverName: thisVendorPkg.driverName || '',
            lastUpdated: thisVendorPkg.lastUpdated || ''
          };
        } else {
          // If vendor has no package record yet in vendorPackages, look at their items' status
          const firstItem = relevantItems[0];
          const itmStatus = firstItem?.status || 'escrow_secured';
          resolvedStage = itmStatus === 'delivered' ? 4 : itmStatus === 'dispatched' ? 3 : itmStatus === 'packing' ? 2 : 1;
          resolvedStatus = itmStatus;
          resolvedTrackingDetails = {
            status: resolvedStatus,
            trackingStage: resolvedStage,
            waybillNumber: '',
            driverPhone: '',
            driverName: '',
            lastUpdated: ''
          };
        }
      }

      return {
        id: o.id,
        orderNumber: o.order_number || o.id,
        customerName: o.customer_name || 'Valued Client',
        customerEmail: o.customer_email || '',
        customerPhone: o.customer_phone || '',
        deliveryAddress: o.delivery_address || 'Lagos, Nigeria',
        deliveryCity: o.delivery_city || 'Lagos',
        deliveryState: o.customer_measurements?.deliveryState || o.customer_measurements?.state || o.delivery_state || '',
        subtotal: Number(o.subtotal || 0),
        shippingFee: Number(o.shipping_fee || 0),
        totalAmount: Number(o.total_amount || 0),
        status: resolvedStatus,
        trackingStage: resolvedStage,
        date: `${dateStr}, ${timeStr}`,
        createdAt: o.created_at,
        vendorPackages,
        trackingDetails: resolvedTrackingDetails,
        items: relevantItems.map((item: any) => {
          const pId = item.product_id || item.productId;
          const vId = item.vendor_id || item.vendorId || 'moji-wears';
          const pName = item.product_name || item.productName || 'Item';
          const matchedImage = item.image_url || item.imageUrl || productImageMap.get(pId) || '/images/no-product.svg';
          const rawColor = item.color || item.colorName || 'As Pictured';
          const isHex = typeof rawColor === 'string' && rawColor.startsWith('#');
          const colorName = item.colorName || (isHex ? 'Standard' : rawColor);
          const colorHex = item.colorHex || (isHex ? rawColor : '#111111');
          return {
            id: item.id || `item-${pId}`,
            productId: pId,
            vendorId: vId,
            vendorName: item.vendorName || (vId ? vId.replace(/-/g, ' ').toUpperCase() : 'MOJI WEARS'),
            productName: pName,
            price: Number(item.price || 0),
            size: item.size || item.selectedSize || 'M',
            color: colorName,
            colorName: colorName,
            colorHex: colorHex,
            quantity: Number(item.quantity || 1),
            imageUrl: matchedImage,
            status: item.status || o.status || 'escrow_secured'
          };
        })
      };
    });

    return NextResponse.json({
      success: true,
      count: formattedOrders.length,
      orders: formattedOrders,
    });
  } catch (error: any) {
    console.error('API /api/orders GET error:', error);
    return NextResponse.json({ success: false, orders: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Always use adminClient in POST so guest & authenticated checkout orders never fail under RLS
    const adminClient = createAdminClient();
    const supabase = adminClient;

    const orderNumber = body.orderNumber || `#VY-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderId = body.id || `ord-${Date.now()}`;

    // Initialize explicit per-vendor packages for every item's vendor in the order
    const initialVendorPackages: Record<string, any> = { ...(body.vendorPackages || {}) };
    if (body.items && Array.isArray(body.items)) {
      // Group items by vendorId to compute cumulative metrics
      const itemsByVendor: Record<string, any[]> = {};
      body.items.forEach((item: any) => {
        const vId = (item.vendorId || item.vendor_id || 'vendor').toLowerCase().trim();
        if (!itemsByVendor[vId]) itemsByVendor[vId] = [];
        itemsByVendor[vId].push(item);
      });

      const totalVendorCount = Object.keys(itemsByVendor).length || 1;

      for (const [vId, vItems] of Object.entries(itemsByVendor)) {
        const firstItem = vItems[0] || {};
        const vCity = firstItem.vendorCity || 'Lagos';
        const vState = firstItem.vendorState || 'Lagos';
        const serviceability = checkLocationServiceability(vCity, vState);
        const metrics = computeVendorPackageMetrics(vItems.map(i => ({ product: i, quantity: i.quantity || 1 })));

        const passedPkg = initialVendorPackages[vId];
        const method = passedPkg?.deliveryMethod || body.packageMethods?.[vId] || 'doorstep';
        const isPark = method === 'park_pickup';
        const courierServiceType: 'pickup' | 'dropoff' = (!isPark && serviceability.hasDoorstepPickup) ? 'pickup' : 'dropoff';
        const chosenCourierName = passedPkg?.courierName || (isPark ? 'Motor Park Bus Waybill' : (courierServiceType === 'pickup' ? 'Fez delivery' : 'Station Drop-off'));
        const pkgFee = passedPkg?.shippingFee !== undefined
          ? Number(passedPkg.shippingFee)
          : (isPark ? 0 : (totalVendorCount > 0 ? Math.round(Number(body.shippingFee || 0) / totalVendorCount) : 0));

        // Attempt live Shipbubble shipment creation if tokens are present
        let bookedShipment: any = null;
        if (!isPark && passedPkg?.requestToken && passedPkg?.serviceCode && passedPkg?.courierId) {
          try {
            bookedShipment = await createShipbubbleShipment({
              orderNumber,
              orderId,
              customerName: body.customerName,
              customerPhone: body.customerPhone,
              deliveryAddress: body.deliveryAddress,
              deliveryCity: body.deliveryCity || body.city || 'Lagos',
              deliveryState: body.deliveryState || body.state || 'Lagos',
              vendorName: firstItem.vendorName || vId,
              vendorAddress: `${vCity}, ${vState}`,
              vendorCity: vCity,
              vendorState: vState,
              vendorPhone: '+2348012345678',
              deliveryMethod: 'doorstep',
              courierName: chosenCourierName,
              requestToken: passedPkg.requestToken,
              serviceCode: passedPkg.serviceCode,
              courierId: passedPkg.courierId,
              items: vItems,
              totalWeightKg: metrics.totalWeightKg,
            });
          } catch (err) {
            console.warn(`[Shipbubble] Booking call for ${vId} encountered:`, err);
          }
        }

        const trackingCode = bookedShipment?.trackingNumber || '';
        const resolvedCourier = bookedShipment?.courierName || chosenCourierName;

        initialVendorPackages[vId] = {
          vendorId: vId,
          vendorName: firstItem.vendorName || vId.replace(/-/g, ' ').toUpperCase(),
          vendorCity: vCity,
          vendorState: vState,
          status: 'escrow_secured',
          deliveryMethod: method,
          courierServiceType,
          courierName: resolvedCourier,
          shippingFee: pkgFee,
          trackingStage: 1,
          waybillNumber: trackingCode,
          trackingNumber: trackingCode,
          labelStatus: bookedShipment?.status || (isPark ? 'awaiting_park_dropoff' : 'label_pending'),
          labelError: bookedShipment?.error || null,
          trackingUrl: bookedShipment?.trackingUrl || '',
          driverPhone: '',
          driverName: '',
          packageWeightKg: metrics.totalWeightKg,
          packageDimensions: `${metrics.lengthCm}×${metrics.widthCm}×${metrics.heightCm}cm`,
          packagingType: metrics.packagingType,
          hasDoorstepPickup: courierServiceType === 'pickup',
          instructions: isPark
            ? 'Package item(s) securely and take to local motor park. Customer pays driver collection fee upon arrival.'
            : (courierServiceType === 'pickup'
              ? `${resolvedCourier} dispatch rider will arrive at your registered atelier address to collect the parcel.`
              : `Doorstep pickup unavailable in ${vCity}. Drop off at ${serviceability.nearestStationRecommendation}.`),
          dropoffStation: isPark
            ? (body.selectedParkTerminals?.[vId]?.replace(/Terminal/gi, 'Motor Park') || `${body.deliveryState || body.deliveryCity || 'Destination'} Motor Park`)
            : (courierServiceType === 'dropoff' ? serviceability.nearestStationRecommendation : undefined),
          selectedParkTerminal: isPark ? (body.selectedParkTerminals?.[vId]?.replace(/Terminal/gi, 'Motor Park') || `${body.deliveryState || body.deliveryCity || 'Destination'} Motor Park`) : undefined,
          pickupStatus: 'pending_packaging',
          requestToken: passedPkg?.requestToken,
          serviceCode: passedPkg?.serviceCode,
          courierId: passedPkg?.courierId,
          lastUpdated: new Date().toISOString()
        };
      }
    }

    // Package metadata with per-vendor delivery fee allocations
    // Ensure order items do not contain large base64 strings to prevent DB egress bloat
    const sanitizedItems = (body.items || []).map((it: any) => {
      const clean = { ...it };
      if (typeof clean.imageUrl === 'string' && clean.imageUrl.startsWith('data:')) {
        clean.imageUrl = `/images/products/uploaded/${clean.productId || clean.id || 'default'}.jpg`;
      }
      if (typeof clean.image === 'string' && clean.image.startsWith('data:')) {
        clean.image = `/images/products/uploaded/${clean.productId || clean.id || 'default'}.jpg`;
      }
      return clean;
    });

    const measurementsData = {
      ...(body.customerMeasurements || {}),
      items: sanitizedItems,
      vendorPackages: initialVendorPackages,
      packageMethods: body.packageMethods || {},
      selectedParkTerminals: body.selectedParkTerminals || {},
      deliveryState: body.deliveryState || body.state || '',
      trackingDetails: {}
    };

    // 1. Insert master order into PostgreSQL
    const { data: orderData, error: orderError } = await supabase.from('orders').insert({
      id: orderId,
      order_number: orderNumber,
      customer_name: body.customerName || body.name || 'Shopper Client',
      customer_email: body.customerEmail || '',
      customer_phone: body.customerPhone || body.phone || '+2348000000000',
      delivery_address: body.deliveryAddress || body.address || 'Lagos, Nigeria',
      delivery_city: body.deliveryCity || body.city || 'Lagos',
      subtotal: Number(body.subtotal || 0),
      shipping_fee: Number(body.shippingFee || 0),
      total_amount: Number(body.totalAmount || 0),
      status: 'escrow_secured',
      payment_ref: body.paymentRef || `vy_ref_${Date.now()}`,
      customer_measurements: measurementsData,
      created_at: new Date().toISOString()
    }).select().single();

    if (orderError) {
      console.error('Error inserting into orders table:', orderError);
      return NextResponse.json({ error: orderError.message }, { status: 400 });
    }

    // 2. Fetch live platform billing config (Free Launch Kill-Switch + per-tier Free vs Plus commission)
    const billingConfig = await fetchLivePlatformBillingConfig();
    const vendorBioCache = new Map<string, any>();

    if (!billingConfig.freeLaunchMode && Array.isArray(body.items) && body.items.length > 0) {
      try {
        const uniqueVendorIds = Array.from(
          new Set(body.items.map((it: any) => String(it.vendorId || it.vendor_id || '').toLowerCase().trim()).filter(Boolean))
        );
        if (uniqueVendorIds.length > 0) {
          const adminClientForComm = createAdminClient();
          const { data: vRows } = await adminClientForComm
            .from('vendors')
            .select('id, bio')
            .in('id', uniqueVendorIds);
          for (const vr of vRows || []) {
            let parsedBio: any = {};
            if (vr.bio && String(vr.bio).trim().startsWith('{')) {
              try { parsedBio = JSON.parse(vr.bio); } catch {}
            }
            vendorBioCache.set(String(vr.id).toLowerCase(), parsedBio);
          }
        }
      } catch (_) {}
    }

    // Insert order items into order_items table without invalid image_url column
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      const itemsToInsert = body.items.map((item: any) => {
        const qty = Number(item.quantity || 1);
        const itemPrice = Number(item.price || 0);
        const itemTotal = itemPrice * qty;
        const itemVId = String(item.vendorId || item.vendor_id || 'vendor').toLowerCase().trim();
        const effectiveCommPercent = getEffectiveCommissionPercent(vendorBioCache.get(itemVId), billingConfig);
        const platformComm = effectiveCommPercent > 0 ? Math.round(itemTotal * (effectiveCommPercent / 100)) : 0;
        const vendorPayout = itemTotal - platformComm;

        return {
          order_id: orderId,
          product_id: item.productId || item.id || `item-${Date.now()}`,
          vendor_id: (item.vendorId || item.vendor_id || 'vendor').toLowerCase().trim(),
          product_name: item.productName || item.name || 'Garment',
          price: itemPrice,
          size: item.size || item.selectedSize || 'M',
          color: typeof item.color === 'string' ? item.color : (item.color?.hex || '#111111'),
          quantity: qty,
          vendor_payout_amount: vendorPayout,
          platform_commission_amount: platformComm,
          status: 'escrow_secured',
        };
      });

      const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsError) {
        console.error('Error inserting into order_items table:', itemsError);
      }

      // 3. Deduct purchased quantities from product_variants
      try {
        for (const item of body.items) {
          const pId = item.productId || item.id;
          const qty = Number(item.quantity || 1);
          const itemSize = (item.size || item.selectedSize || 'M').trim();
          const rawColor = typeof item.color === 'string' ? item.color : (item.color?.name || item.colorName || '');
          const itemColor = rawColor.trim();

          if (!pId) continue;

          // Fetch all variants for this product
          const { data: variants } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', pId);

          if (variants && variants.length > 0) {
            // Match priority:
            // 1. Exact Size AND Color match
            let matched = variants.find(v => 
              v.size?.toLowerCase() === itemSize.toLowerCase() && 
              itemColor && (v.color?.toLowerCase() === itemColor.toLowerCase() || itemColor.toLowerCase().includes(v.color?.toLowerCase()))
            );

            // 2. Size match with available stock
            if (!matched) {
              matched = variants.find(v => v.size?.toLowerCase() === itemSize.toLowerCase() && Number(v.stock_quantity) > 0);
            }

            // 3. Any size match
            if (!matched) {
              matched = variants.find(v => v.size?.toLowerCase() === itemSize.toLowerCase());
            }

            // 4. Color match with available stock
            if (!matched && itemColor) {
              matched = variants.find(v => v.color?.toLowerCase() === itemColor.toLowerCase() && Number(v.stock_quantity) > 0);
            }

            // 5. First available variant with stock > 0
            if (!matched) {
              matched = variants.find(v => Number(v.stock_quantity) > 0);
            }

            // 6. Fallback to first variant
            if (!matched) {
              matched = variants[0];
            }

            if (matched) {
              const currentStock = Number(matched.stock_quantity) || 0;
              const newStock = Math.max(0, currentStock - qty);
              await supabase
                .from('product_variants')
                .update({ stock_quantity: newStock })
                .eq('id', matched.id);

              console.log(`[Inventory] Deducted ${qty} units of ${pId} (Variant: ${matched.size || 'Standard'}, ${matched.color || 'Default'}). Stock: ${currentStock} -> ${newStock}`);
            }
          } else {
            // If product had no variants in database yet, auto-create one and deduct immediately
            const initialDefaultStock = 10;
            const newStock = Math.max(0, initialDefaultStock - qty);
            await supabase
              .from('product_variants')
              .insert({
                product_id: pId,
                size: itemSize || 'One Size',
                color: itemColor || 'Standard',
                stock_quantity: newStock,
              });

            console.log(`[Inventory] Initialized variant for ${pId} and deducted ${qty} units. Stock: ${initialDefaultStock} -> ${newStock}`);
          }
        }
      } catch (stockErr) {
        console.warn('[Inventory] Error decrementing variant stock:', stockErr);
      }
    }

    // Dispatch automated background email alerts
    try {
      const emailTasks: Array<() => Promise<any>> = [];

      // 1. Queue Order Confirmation Email to Buyer
      if (body.customerEmail && body.customerEmail.includes('@')) {
        emailTasks.push(async () => {
          console.log(`[Orders POST] 🛒 Sending customer order confirmation email to ${body.customerEmail}`);
          try {
            const res = await sendOrderConfirmationEmail({
              orderNumber,
              customerName: body.customerName,
              customerEmail: body.customerEmail,
              deliveryAddress: body.deliveryAddress,
              items: body.items || [],
              totalAmount: Number(body.totalAmount || 0),
              shippingFee: Number(body.shippingFee || 0)
            });
            console.log(`[Order Confirmation] ✅ Customer email successfully sent to ${body.customerEmail}:`, res);
            return res;
          } catch (err: any) {
            console.error(`[Order Confirmation] ❌ Customer email failed for ${body.customerEmail}:`, err);
            return { success: false, error: err?.message };
          }
        });
      }

      // 2. Fetch all registered vendors with adminClient to bypass RLS and guarantee email retrieval

      const { data: allDbVendors, error: vendorFetchErr } = await adminClient
        .from('vendors')
        .select('id, brand_name, designer_name, email, phone, location');

      if (vendorFetchErr) {
        console.warn('[Orders POST] ⚠️ Warning fetching vendors with adminClient:', vendorFetchErr.message);
      } else {
        console.log(`[Orders POST] 🔍 Retrieved ${allDbVendors?.length || 0} registered vendors for email dispatch.`);
      }

      // Also fetch products for any item without explicit vendorId using adminClient
      const itemProductIds = (body.items || []).map((i: any) => i.productId || i.id).filter(Boolean);
      const productVendorMap = new Map<string, string>();
      if (itemProductIds.length > 0) {
        const { data: dbProducts } = await adminClient
          .from('products')
          .select('id, vendor_id')
          .in('id', itemProductIds);
        (dbProducts || []).forEach((p: any) => {
          if (p.id && p.vendor_id) productVendorMap.set(p.id, p.vendor_id);
        });
      }

      const findVendorRecord = (rawId: string, rawName: string, productId?: string) => {
        if (!allDbVendors || allDbVendors.length === 0) return null;
        const vIdClean = (rawId || '').toLowerCase().trim();
        const vNameClean = (rawName || '').toLowerCase().trim();
        const vSlug = vIdClean.replace(/[^a-z0-9]/g, '');

        // Match 1: Direct ID match
        let found = allDbVendors.find(v => v.id.toLowerCase().trim() === vIdClean);
        if (found) return found;

        // Match 2: Normalized slug match
        if (vSlug) {
          found = allDbVendors.find(v => v.id.toLowerCase().replace(/[^a-z0-9]/g, '') === vSlug);
          if (found) return found;
        }

        // Match 3: Brand name match
        if (vNameClean) {
          found = allDbVendors.find(v => (v.brand_name || '').toLowerCase().trim() === vNameClean);
          if (found) return found;
          const nameSlug = vNameClean.replace(/[^a-z0-9]/g, '');
          found = allDbVendors.find(v => (v.brand_name || '').toLowerCase().replace(/[^a-z0-9]/g, '') === nameSlug);
          if (found) return found;
        }

        // Match 4: Database Product vendor_id
        if (productId && productVendorMap.has(productId)) {
          const dbVId = productVendorMap.get(productId)!.toLowerCase().trim();
          found = allDbVendors.find(v => v.id.toLowerCase().trim() === dbVId || v.id.toLowerCase().replace(/[^a-z0-9]/g, '') === dbVId.replace(/[^a-z0-9]/g, ''));
          if (found) return found;
        }

        // Match 5: Substring / partial match
        if (vIdClean && vIdClean.length >= 3) {
          found = allDbVendors.find(v => v.id.toLowerCase().includes(vIdClean) || vIdClean.includes(v.id.toLowerCase()));
          if (found) return found;
        }

        return null;
      };

      // Group items by matched vendor
      const vendorGroups = new Map<string, { vendor: any; items: any[]; pkg: any }>();

      (body.items || []).forEach((item: any) => {
        const rawVId = String(item.vendorId || item.vendor_id || '').trim();
        const rawVName = String(item.vendorName || item.vendor_name || '').trim();
        const pId = item.productId || item.id;
        const vRec = findVendorRecord(rawVId, rawVName, pId);

        const vKey = vRec ? vRec.id : (rawVId || 'store-merchant');
        const vEmail = vRec?.email || (rawVId.includes('@') ? rawVId : '');

        if (!vendorGroups.has(vKey)) {
          const vPkg = initialVendorPackages[vKey] ||
            initialVendorPackages[rawVId] ||
            Object.entries(initialVendorPackages).find(([k]) => k.toLowerCase() === vKey.toLowerCase() || k.toLowerCase() === rawVId.toLowerCase())?.[1];

          vendorGroups.set(vKey, {
            vendor: {
              id: vKey,
              brandName: vRec?.brand_name || rawVName || vKey,
              designerName: vRec?.designer_name,
              email: vEmail,
              phone: vRec?.phone,
              location: vRec?.location,
            },
            items: [],
            pkg: vPkg
          });
        }

        vendorGroups.get(vKey)!.items.push(item);
      });

      // 3. Queue New Order Notification for each vendor
      for (const [vKey, group] of vendorGroups.entries()) {
        let vEmail = group.vendor.email;
        if (!vEmail || !vEmail.includes('@')) {
          // Direct fallback query to vendors table with adminClient
          try {
            const { data: directVendor } = await adminClient
              .from('vendors')
              .select('id, brand_name, email, phone, designer_name')
              .or(`id.eq.${vKey},brand_name.ilike.%${vKey}%`)
              .limit(1)
              .maybeSingle();
            if (directVendor?.email) {
              vEmail = directVendor.email;
              group.vendor.email = directVendor.email;
              group.vendor.brandName = directVendor.brand_name || group.vendor.brandName;
              group.vendor.designerName = directVendor.designer_name || group.vendor.designerName;
            }
          } catch (_) {}
        }

        if (group.vendor.phone) {
          const vItemsForSms = group.items;
          const vSubForSms = vItemsForSms.reduce((sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
          const hasMto = vItemsForSms.some((it: any) => it.fulfillmentType === 'made_to_order');
          emailTasks.push(async () => {
            try {
              return await sendVendorNewOrderSms({
                phone: group.vendor.phone,
                brandName: group.vendor.brandName,
                orderNumber,
                amountNgn: vSubForSms,
                itemCount: vItemsForSms.reduce((s: number, it: any) => s + Number(it.quantity || 1), 0),
                dispatchNote: hasMto ? 'Made-to-Order item — upload finished proof before dispatch' : undefined,
              });
            } catch (smsErr: any) {
              return { success: false, error: smsErr?.message };
            }
          });
        }

        if (!vEmail || !vEmail.includes('@')) {
          console.warn(`[Orders POST] ⚠️ Vendor "${group.vendor.brandName}" (${vKey}) does not have a registered email address. Skipping email.`);
          continue;
        }

        const vItems = group.items;
        const vSubtotal = vItems.reduce((sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
        const deliveryMethod = group.pkg?.deliveryMethod || body.packageMethods?.[vKey] || 'doorstep';

        emailTasks.push(async () => {
          console.log(`[Orders POST] 📦 Sending vendor new order notification to ${group.vendor.brandName} (${vEmail}) for order ${orderNumber}`);
          try {
            const res = await sendVendorNewOrderNotification({
              vendor: {
                id: group.vendor.id,
                brandName: group.vendor.brandName,
                designerName: group.vendor.designerName,
                email: vEmail,
                phone: group.vendor.phone,
              },
              orderNumber,
              customerName: body.customerName,
              deliveryCity: body.deliveryCity || body.city || 'Lagos',
              deliveryState: body.deliveryState || body.state || 'Lagos',
              deliveryMethod,
              items: vItems.map((it: any) => ({
                productName: it.productName || it.name || 'Item',
                size: it.size || it.selectedSize || 'M',
                color: typeof it.color === 'string' ? it.color : (it.color?.name || 'Standard'),
                quantity: Number(it.quantity || 1),
                price: Number(it.price || 0),
                vendorPayout: Number(it.price || 0),
              })),
              totalPayout: vSubtotal,
            });
            console.log(`[Vendor Notification] ✅ Vendor email successfully sent to ${vEmail} (${group.vendor.brandName}):`, res);
            return res;
          } catch (err: any) {
            console.error(`[Vendor Notification] ❌ Vendor email failed for ${vEmail}:`, err);
            return { success: false, error: err?.message };
          }
        });
      }

      // Queue instant transactional SMS to buyer so serverless runtime awaits completion
      if (body.customerPhone || body.phone) {
        emailTasks.push(async () => {
          try {
            return await sendBuyerOrderConfirmedSms({
              phone: body.customerPhone || body.phone,
              customerName: body.customerName || body.name || 'Shopper',
              orderNumber,
              amountNgn: Number(body.totalAmount || 0),
            });
          } catch (smsErr: any) {
            return { success: false, error: smsErr?.message };
          }
        });
      }

      // Execute all emails sequentially to ensure 100% reliable single-socket delivery
      if (emailTasks.length > 0) {
        console.log(`[Orders POST] ⏳ Dispatching ${emailTasks.length} outgoing emails sequentially...`);
        for (let i = 0; i < emailTasks.length; i++) {
          await emailTasks[i]();
          if (i < emailTasks.length - 1) {
            await new Promise(r => setTimeout(r, 600));
          }
        }
        console.log(`[Orders POST] 🚀 Finished dispatching all ${emailTasks.length} emails.`);
      }
    } catch (e) {
      console.error('Email dispatch wrapper error:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Order recorded in live database and escrow locked',
      order: {
        ...orderData,
        orderNumber,
        items: body.items || [],
      }
    });
  } catch (error: any) {
    console.error('API /api/orders POST error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderNumber, orderId, status, trackingStage, waybillNumber, driverPhone, driverName, vendorId, action, preDispatchProofUrl, disputeReason, disputeDetails, disputeProofUrls } = body;

    if (!orderNumber && !orderId) {
      return NextResponse.json({ error: 'Missing orderNumber or orderId' }, { status: 400 });
    }

    const headerVendorId = request.headers.get('x-vendor-id');
    const targetVendorId = (vendorId || headerVendorId || '').toLowerCase().trim();

    // Always use adminClient in PATCH so vendor status updates & shopper email resolution never fail under RLS
    const adminClient = createAdminClient();
    const supabase = adminClient;

    let existingOrder: any = null;
    let fetchErr: any = null;
    if (orderNumber) {
      const resByNum = await supabase.from('orders').select('*, order_items(*)').eq('order_number', orderNumber).maybeSingle();
      existingOrder = resByNum.data;
      fetchErr = resByNum.error;
    }
    if (!existingOrder && orderId) {
      const resById = await supabase.from('orders').select('*, order_items(*)').eq('id', orderId).maybeSingle();
      existingOrder = resById.data;
      fetchErr = resById.error;
    }
    if (fetchErr || !existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const existingMeasurements = existingOrder.customer_measurements || {};
    const existingVendorPackages = { ...(existingMeasurements.vendorPackages || {}) };

    // Handle Buyer 48-Hour Dispute / Issue Report (Freezes Escrow Immediately)
    if (action === 'open_dispute') {
      const disputePayload = {
        status: 'open',
        reason: String(disputeReason || 'Item issue reported').trim(),
        details: String(disputeDetails || '').trim(),
        proofUrls: Array.isArray(disputeProofUrls) ? disputeProofUrls.filter((u: any) => typeof u === 'string' && u.startsWith('http')) : [],
        openedAt: new Date().toISOString(),
        openedBy: existingOrder.customer_email || 'buyer',
      };

      const disputedMeasurements = {
        ...existingMeasurements,
        escrowStatus: 'disputed',
        dispute: disputePayload,
      };

      const { data: disputedOrder, error: dispErr } = await adminClient
        .from('orders')
        .update({
          status: 'disputed',
          customer_measurements: disputedMeasurements,
        })
        .eq('id', existingOrder.id)
        .select()
        .single();

      if (dispErr) {
        return NextResponse.json({ error: dispErr.message }, { status: 500 });
      }

      try {
        await adminClient.from('notifications').insert({
          title: `ORDER_DISPUTE:${existingOrder.order_number}`,
          message: JSON.stringify({
            orderId: existingOrder.id,
            orderNumber: existingOrder.order_number,
            customerName: existingOrder.customer_name,
            customerEmail: existingOrder.customer_email,
            customerPhone: existingOrder.customer_phone,
            totalAmount: existingOrder.total_amount,
            ...disputePayload,
          }),
          type: 'order_dispute',
          read: false,
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: 'Dispute opened. Escrow funds are frozen while our team reviews your evidence within 24-48 hours.',
        order: disputedOrder,
      });
    }

    // Handle Explicit Buyer Approval (Releases Escrow Immediately)
    if (action === 'buyer_approve_escrow') {
      const approvedMeasurements = {
        ...existingMeasurements,
        escrowStatus: 'released',
        buyerApprovedAt: new Date().toISOString(),
      };
      const { data: approvedOrder, error: appErr } = await adminClient
        .from('orders')
        .update({
          status: 'delivered',
          customer_measurements: approvedMeasurements,
        })
        .eq('id', existingOrder.id)
        .select()
        .single();

      if (appErr) {
        return NextResponse.json({ error: appErr.message }, { status: 500 });
      }
      await adminClient.from('order_items').update({ status: 'delivered' }).eq('order_id', existingOrder.id);

      return NextResponse.json({
        success: true,
        message: 'Delivery confirmed! Escrow funds have been approved for vendor settlement.',
        order: approvedOrder,
      });
    }

    // Fetch order items to discover all vendor IDs in this order
    const sourceItems = (existingMeasurements.items && Array.isArray(existingMeasurements.items))
      ? existingMeasurements.items
      : [];
    const { data: dbItems } = await supabase.from('order_items').select('id, vendor_id').eq('order_id', existingOrder.id);

    const allVendorIds = new Set<string>();
    if (dbItems && Array.isArray(dbItems)) {
      dbItems.forEach(i => {
        if (i.vendor_id) allVendorIds.add(i.vendor_id.toLowerCase().trim());
      });
    }
    sourceItems.forEach((i: any) => {
      const vid = (i.vendorId || i.vendor_id || '').toLowerCase().trim();
      if (vid) allVendorIds.add(vid);
    });

    // Ensure all vendors in this order are initialized with their existing or default stage 1
    allVendorIds.forEach(vId => {
      if (!existingVendorPackages[vId]) {
        existingVendorPackages[vId] = {
          vendorId: vId,
          status: 'escrow_secured',
          trackingStage: 1,
          waybillNumber: '',
          driverPhone: '',
          driverName: '',
          lastUpdated: existingOrder.created_at || new Date().toISOString()
        };
      }
    });

    let matchedVendorKey = targetVendorId;
    if (targetVendorId && targetVendorId !== 'all') {
      // Find matching vendor key among known vendors
      const cleanTarget = targetVendorId.replace(/[^a-z0-9]/g, '');

      for (const vId of allVendorIds) {
        const cleanV = vId.replace(/[^a-z0-9]/g, '');
        if (cleanV === cleanTarget || cleanV.includes(cleanTarget) || cleanTarget.includes(cleanV)) {
          matchedVendorKey = vId;
          break;
        }
      }

      // 1. Update ONLY this vendor's package
      existingVendorPackages[matchedVendorKey] = {
        ...(existingVendorPackages[matchedVendorKey] || {}),
        status,
        trackingStage: Number(trackingStage || 1),
        waybillNumber: waybillNumber !== undefined ? waybillNumber : (existingVendorPackages[matchedVendorKey]?.waybillNumber || ''),
        courierName: body.courierName !== undefined ? body.courierName : (existingVendorPackages[matchedVendorKey]?.courierName || ''),
        driverPhone: driverPhone !== undefined ? driverPhone : (existingVendorPackages[matchedVendorKey]?.driverPhone || ''),
        driverName: driverName !== undefined ? driverName : (existingVendorPackages[matchedVendorKey]?.driverName || ''),
        pickupStatus: body.pickupStatus !== undefined ? body.pickupStatus : (existingVendorPackages[matchedVendorKey]?.pickupStatus || (Number(trackingStage) === 2 ? 'ready_for_pickup' : Number(trackingStage) === 3 ? 'in_transit' : Number(trackingStage) === 4 ? 'delivered' : 'pending_packaging')),
        deliveryIssue: body.deliveryIssue !== undefined ? body.deliveryIssue : (existingVendorPackages[matchedVendorKey]?.deliveryIssue || null),
        preDispatchProofUrl: preDispatchProofUrl !== undefined ? preDispatchProofUrl : (existingVendorPackages[matchedVendorKey]?.preDispatchProofUrl || null),
        deliveredAt: Number(trackingStage) === 4 ? (existingVendorPackages[matchedVendorKey]?.deliveredAt || new Date().toISOString()) : existingVendorPackages[matchedVendorKey]?.deliveredAt,
        lastUpdated: new Date().toISOString()
      };

      if (matchedVendorKey !== targetVendorId) {
        existingVendorPackages[targetVendorId] = existingVendorPackages[matchedVendorKey];
      }

      // Update order_items strictly for this vendor
      await supabase.from('order_items')
        .update({ status })
        .eq('order_id', existingOrder.id)
        .ilike('vendor_id', `%${matchedVendorKey}%`);
    } else {
      // Global update (e.g. buyer confirms whole order)
      await supabase.from('order_items')
        .update({ status })
        .eq('order_id', existingOrder.id);

      Object.keys(existingVendorPackages).forEach(vKey => {
        existingVendorPackages[vKey] = {
          ...existingVendorPackages[vKey],
          status,
          trackingStage: Number(trackingStage || 1),
          lastUpdated: new Date().toISOString()
        };
      });
    }

    // Determine smart overall order status
    const allPkgs = Object.values(existingVendorPackages) as any[];
    let masterStatus = status;
    let masterStage = Number(trackingStage || 1);

    if (allPkgs.length > 0) {
      const allDelivered = allPkgs.every(p => p.trackingStage >= 4);
      const anyDispatched = allPkgs.some(p => p.trackingStage >= 3);
      const anyPacking = allPkgs.some(p => p.trackingStage >= 2);

      if (allDelivered) {
        masterStatus = 'delivered';
        masterStage = 4;
      } else if (anyDispatched) {
        masterStatus = 'dispatched';
        masterStage = 3;
      } else if (anyPacking) {
        masterStatus = 'packing';
        masterStage = 2;
      } else {
        masterStatus = 'escrow_secured';
        masterStage = 1;
      }
    }

    const updatedMeasurements = {
      ...existingMeasurements,
      vendorPackages: existingVendorPackages,
      trackingDetails: {
        ...(existingMeasurements.trackingDetails || {}),
        status: masterStatus,
        trackingStage: masterStage,
        waybillNumber: waybillNumber || existingMeasurements.trackingDetails?.waybillNumber || '',
        driverPhone: driverPhone || existingMeasurements.trackingDetails?.driverPhone || '',
        driverName: driverName || existingMeasurements.trackingDetails?.driverName || '',
        lastUpdated: new Date().toISOString()
      }
    };

    const { data: updatedOrder, error: updateErr } = await supabase
      .from('orders')
      .update({
        status: masterStatus,
        customer_measurements: updatedMeasurements
      })
      .eq('id', existingOrder.id)
      .select()
      .single();

    if (updateErr) {
      console.error('Error updating order status in DB:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Dispatch automated lifecycle email alerts (Packaging, Dispatch, Delivery, Settlement) + live in-app shopper alert
    try {
      const patchEmailPromises: Promise<any>[] = [];
      const stageNum = Number(trackingStage || 1);
      const pkgForVendor = existingVendorPackages[targetVendorId] ||
        (matchedVendorKey ? existingVendorPackages[matchedVendorKey] : null) ||
        Object.values(existingVendorPackages)[0] || {};

      // Robustly resolve shopper email (orders.customer_email -> customer_measurements -> body -> profiles -> auth.users)
      let resolvedCustomerEmail = (
        existingOrder.customer_email ||
        existingMeasurements.customerEmail ||
        existingMeasurements.email ||
        body.customerEmail ||
        ''
      ).toLowerCase().trim();

      if (!resolvedCustomerEmail || !resolvedCustomerEmail.includes('@')) {
        try {
          if (existingOrder.user_id) {
            const { data: prof } = await adminClient
              .from('profiles')
              .select('email')
              .eq('id', existingOrder.user_id)
              .maybeSingle();
            if (prof?.email) resolvedCustomerEmail = prof.email.toLowerCase().trim();
            if (!resolvedCustomerEmail || !resolvedCustomerEmail.includes('@')) {
              const { data: authUser } = await adminClient.auth.admin.getUserById(existingOrder.user_id);
              if (authUser?.user?.email) resolvedCustomerEmail = authUser.user.email.toLowerCase().trim();
            }
          }
          if ((!resolvedCustomerEmail || !resolvedCustomerEmail.includes('@')) && existingOrder.customer_phone) {
            const { data: profByPhone } = await adminClient
              .from('profiles')
              .select('email')
              .eq('phone', existingOrder.customer_phone)
              .limit(1)
              .maybeSingle();
            if (profByPhone?.email) resolvedCustomerEmail = profByPhone.email.toLowerCase().trim();
          }
        } catch {}
      }

      // Resolve human-friendly Brand Name for emails & notifications
      let resolvedBrandName = (pkgForVendor as any).vendorName || '';
      const lookupVendorKey = matchedVendorKey || targetVendorId || '';
      if (!resolvedBrandName && lookupVendorKey && lookupVendorKey !== 'all') {
        try {
          const { data: vRow } = await adminClient
            .from('vendors')
            .select('brand_name')
            .eq('id', lookupVendorKey)
            .maybeSingle();
          if (vRow?.brand_name) resolvedBrandName = vRow.brand_name;
        } catch {}
      }
      resolvedBrandName = resolvedBrandName || (lookupVendorKey ? lookupVendorKey.replace(/-/g, ' ') : 'Your Brand');

      // Helper to also persist a live in-app Shopper Order Alert (rings/chimes shopper bell in real-time)
      const saveShopperOrderAlert = async (alertKind: string, titleText: string, messageText: string) => {
        if (!resolvedCustomerEmail) return;
        try {
          await adminClient.from('notifications').insert({
            title: `ORDER_ALERT:${resolvedCustomerEmail}`,
            message: JSON.stringify({
              kind: alertKind,
              customerEmail: resolvedCustomerEmail,
              orderNumber: existingOrder.order_number,
              vendorName: resolvedBrandName,
              title: titleText,
              message: messageText,
              createdAt: new Date().toISOString(),
            }),
            type: 'shopper_order_alert',
            read: false,
            action_url: `/track-order?orderNumber=${encodeURIComponent(existingOrder.order_number)}`,
          });
        } catch {}
      };

      // Stage 3: Dispatched with waybill & rider details
      if (status === 'dispatched' || stageNum === 3) {
        if (existingOrder.customer_phone) {
          const waybillTxt = waybillNumber || (pkgForVendor as any).waybillNumber || '';
          patchEmailPromises.push(
            sendBuyerOrderDispatchedSms({
              phone: existingOrder.customer_phone,
              customerName: existingOrder.customer_name || 'Shopper',
              orderNumber: existingOrder.order_number,
              waybillInfo: waybillTxt ? `Waybill ${waybillTxt}` : undefined,
            }).catch((e) => ({ success: false, error: e?.message }))
          );
        }
      }
      if ((status === 'dispatched' || stageNum === 3) && resolvedCustomerEmail) {
        const waybillTxt = waybillNumber || (pkgForVendor as any).waybillNumber || '';
        const driverTxt = driverPhone || (pkgForVendor as any).driverPhone || '';
        console.log(`[Orders PATCH] 🚚 Queuing dispatch notification email to customer ${resolvedCustomerEmail}`);
        patchEmailPromises.push(
          saveShopperOrderAlert(
            'order_dispatched',
            `Order ${existingOrder.order_number} Dispatched`,
            `${resolvedBrandName} handed off your package for delivery${waybillTxt ? ` (Waybill: ${waybillTxt})` : ''}. Tap to track live.`
          )
        );
        patchEmailPromises.push(
          sendDispatchNotificationEmail({
            orderNumber: existingOrder.order_number,
            customerName: existingOrder.customer_name,
            customerEmail: resolvedCustomerEmail,
            deliveryAddress: existingOrder.delivery_address,
            items: existingOrder.order_items || sourceItems || [],
            totalAmount: Number(existingOrder.total_amount || 0),
            shippingFee: Number(existingOrder.shipping_fee || 0),
            driverPhone: driverTxt,
            waybillNumber: waybillTxt,
            vendorName: resolvedBrandName
          }).then(res => {
            console.log(`[Dispatch Email] ✅ Sent to customer ${resolvedCustomerEmail}:`, res);
            return res;
          }).catch(e => {
            console.error('[Dispatch Email] ❌ Failed:', e);
            return { success: false, error: e?.message };
          })
        );
      }
      // Stage 2: Packaged & quality-checked
      else if ((status === 'packing' || stageNum === 2) && resolvedCustomerEmail) {
        console.log(`[Orders PATCH] 📦 Queuing order packed email to customer ${resolvedCustomerEmail}`);
        patchEmailPromises.push(
          saveShopperOrderAlert(
            'order_packed',
            `Order ${existingOrder.order_number} Packed & Ready`,
            `${resolvedBrandName} finished inspecting and sealing your order. Courier dispatch is next.`
          )
        );
        patchEmailPromises.push(
          sendOrderPackedEmail({
            orderNumber: existingOrder.order_number,
            customerName: existingOrder.customer_name,
            customerEmail: resolvedCustomerEmail,
            deliveryAddress: existingOrder.delivery_address,
            items: existingOrder.order_items || sourceItems || [],
            totalAmount: Number(existingOrder.total_amount || 0),
            shippingFee: Number(existingOrder.shipping_fee || 0),
            vendorName: resolvedBrandName
          }).then(res => {
            console.log(`[Packed Email] ✅ Sent to customer ${resolvedCustomerEmail}:`, res);
            return res;
          }).catch(e => {
            console.error('[Packed Email] ❌ Failed:', e);
            return { success: false, error: e?.message };
          })
        );
      }
      // Stage 4: Delivered & escrow settlement released
      else if (status === 'delivered' || stageNum === 4) {
        if (existingOrder.customer_phone) {
          patchEmailPromises.push(
            sendBuyerOrderDeliveredSms({
              phone: existingOrder.customer_phone,
              customerName: existingOrder.customer_name || 'Shopper',
              orderNumber: existingOrder.order_number,
            }).catch((e) => ({ success: false, error: e?.message }))
          );
        }
        // Customer email & live alert: order delivered confirmation
        if (resolvedCustomerEmail) {
          console.log(`[Orders PATCH] ✅ Queuing order delivered email to customer ${resolvedCustomerEmail}`);
          patchEmailPromises.push(
            saveShopperOrderAlert(
              'order_delivered',
              `Order ${existingOrder.order_number} Delivered`,
              `Your package from ${resolvedBrandName} has arrived. Inspect your pieces & confirm receipt.`
            )
          );
          patchEmailPromises.push(
            sendOrderDeliveredCustomerEmail({
              orderNumber: existingOrder.order_number,
              customerName: existingOrder.customer_name,
              customerEmail: resolvedCustomerEmail,
              deliveryAddress: existingOrder.delivery_address,
              items: existingOrder.order_items || sourceItems || [],
              totalAmount: Number(existingOrder.total_amount || 0),
              shippingFee: Number(existingOrder.shipping_fee || 0),
              vendorName: resolvedBrandName
            }).then(res => {
              console.log(`[Delivered Customer Email] ✅ Sent to ${resolvedCustomerEmail}:`, res);
              return res;
            }).catch(e => {
              console.error('[Delivered Customer Email] ❌ Failed:', e);
              return { success: false, error: e?.message };
            })
          );
        }

        // Vendor email: payment settlement released
        const vIdToNotify = targetVendorId || (allVendorIds.size === 1 ? Array.from(allVendorIds)[0] : '');
        if (vIdToNotify) {
          const { data: vRecord } = await adminClient
            .from('vendors')
            .select('id, brand_name, designer_name, email, phone, bank_name, account_number')
            .eq('id', vIdToNotify)
            .maybeSingle();

          if (vRecord?.email) {
            const vItems = sourceItems.filter((i: any) => (i.vendor_id || i.vendorId || '').toLowerCase().trim() === vIdToNotify.toLowerCase().trim());
            const vPayout = vItems.reduce((sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);

            console.log(`[Orders PATCH] 💰 Queuing settlement email to vendor ${vRecord.brand_name} (${vRecord.email})`);
            patchEmailPromises.push(
              sendVendorSettlementNotification({
                vendor: {
                  id: vRecord.id,
                  brandName: vRecord.brand_name || vIdToNotify,
                  designerName: vRecord.designer_name,
                  email: vRecord.email,
                  phone: vRecord.phone,
                  bankName: vRecord.bank_name,
                  accountNumber: vRecord.account_number,
                },
                orderNumber: existingOrder.order_number,
                payoutAmount: vPayout || Number(existingOrder.total_amount || 0),
                bankName: vRecord.bank_name,
                accountNumber: vRecord.account_number,
                customerName: existingOrder.customer_name,
              }).then(async (res) => {
                console.log(`[Settlement Email] ✅ Sent to vendor ${vRecord.email}:`, res);
                if (vRecord.phone) {
                  await sendVendorPayoutReleasedSms({
                    phone: vRecord.phone,
                    brandName: vRecord.brand_name || vIdToNotify,
                    orderNumber: existingOrder.order_number,
                    payoutAmountNgn: vPayout || Number(existingOrder.total_amount || 0),
                  }).catch(() => {});
                }
                return res;
              }).catch(e => {
                console.error('[Settlement Email] ❌ Failed:', e);
                return { success: false, error: e?.message };
              })
            );
          }
        }
      }

      // CRITICAL: Await all patch email promises before returning response
      if (patchEmailPromises.length > 0) {
        console.log(`[Orders PATCH] ⏳ Awaiting ${patchEmailPromises.length} outgoing emails...`);
        const patchResults = await Promise.allSettled(patchEmailPromises);
        console.log(`[Orders PATCH] 🚀 Finished dispatching ${patchResults.length} notification emails:`,
          patchResults.map(r => r.status === 'fulfilled' ? r.value : r.reason)
        );
      }
    } catch (e) {
      console.error('Patch email dispatch error:', e);
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated successfully`,
      order: updatedOrder
    });
  } catch (error: any) {
    console.error('API /api/orders PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
