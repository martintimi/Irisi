import { sendOrderConfirmationEmail, sendVendorNewOrderEmail, sendDispatchNotificationEmail, sendDeliverySettledEmail } from '@/lib/services/emailService';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { computeVendorPackageMetrics, checkLocationServiceability, createShipbubbleShipment } from '@/lib/services/logistics';

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
          const pName = item.product_name || item.productName || 'Garment';
          const matchedImage = item.image_url || item.imageUrl || productImageMap.get(pId) || '/images/products/BlackTrapStarHoodie.jpg';
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
    const supabase = await createClient();

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
          : (isPark ? 0 : Math.round(Number(body.shippingFee || 4500) / totalVendorCount));

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
            ? 'Package garment and drop at local motor park. Customer pays collection fee upon arrival.'
            : (courierServiceType === 'pickup'
              ? `${resolvedCourier} dispatch rider will arrive at your registered atelier address to collect the parcel.`
              : `Doorstep pickup unavailable in ${vCity}. Drop off at ${serviceability.nearestStationRecommendation}.`),
          dropoffStation: isPark
            ? (body.selectedParkTerminals?.[vId] || `${body.deliveryState || 'Destination'} Central Terminal`)
            : (courierServiceType === 'dropoff' ? serviceability.nearestStationRecommendation : undefined),
          selectedParkTerminal: isPark ? (body.selectedParkTerminals?.[vId] || `${body.deliveryState || 'Destination'} Central Terminal`) : undefined,
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
      customer_name: body.customerName,
      customer_email: body.customerEmail || '',
      customer_phone: body.customerPhone,
      delivery_address: body.deliveryAddress,
      delivery_city: body.deliveryCity || 'Lagos',
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

    // 2. Insert order items into order_items table without invalid image_url column
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      const itemsToInsert = body.items.map((item: any) => {
        const qty = Number(item.quantity || 1);
        const itemPrice = Number(item.price || 0);
        return {
          order_id: orderId,
          product_id: item.productId || item.id || `item-${Date.now()}`,
          vendor_id: (item.vendorId || item.vendor_id || 'vendor').toLowerCase().trim(),
          product_name: item.productName || item.name || 'Garment',
          price: itemPrice,
          size: item.size || item.selectedSize || 'M',
          color: typeof item.color === 'string' ? item.color : (item.color?.hex || '#111111'),
          quantity: qty,
          vendor_payout_amount: itemPrice * qty * 0.9,
          platform_commission_amount: itemPrice * qty * 0.1,
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
      if (body.customerEmail) {
        sendOrderConfirmationEmail({
          orderNumber,
          customerName: body.customerName,
          customerEmail: body.customerEmail,
          deliveryAddress: body.deliveryAddress,
          items: body.items || [],
          totalAmount: Number(body.totalAmount || 0),
          shippingFee: Number(body.shippingFee || 0)
        }).catch(e => console.error('Email error:', e));
      }

      // Notify each unique vendor if an email is provided
      const uniqueVendorIds: string[] = Array.from(new Set<string>((body.items || []).map((i: any) => String(i.vendorId || i.vendor_id || '').toLowerCase().trim())));
      uniqueVendorIds.forEach((vId: string) => {
        if (vId && typeof vId === 'string' && vId.includes('@')) {
          sendVendorNewOrderEmail(vId, {
            orderNumber,
            customerName: body.customerName,
            customerEmail: body.customerEmail || '',
            deliveryAddress: body.deliveryAddress,
            items: (body.items || []).filter((i: any) => (i.vendorId || i.vendor_id || '').toLowerCase().trim() === vId),
            totalAmount: Number(body.totalAmount || 0),
            shippingFee: Number(body.shippingFee || 0)
          }).catch(e => console.error('Vendor email error:', e));
        }
      });
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
    const { orderNumber, orderId, status, trackingStage, waybillNumber, driverPhone, driverName, vendorId } = body;

    if (!orderNumber && !orderId) {
      return NextResponse.json({ error: 'Missing orderNumber or orderId' }, { status: 400 });
    }

    const headerVendorId = request.headers.get('x-vendor-id');
    const targetVendorId = (vendorId || headerVendorId || '').toLowerCase().trim();

    const supabase = await createClient();

    let query = supabase.from('orders').select('*');
    if (orderNumber) {
      query = query.eq('order_number', orderNumber);
    } else {
      query = query.eq('id', orderId);
    }

    const { data: existingOrder, error: fetchErr } = await query.maybeSingle();
    if (fetchErr || !existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const existingMeasurements = existingOrder.customer_measurements || {};
    const existingVendorPackages = { ...(existingMeasurements.vendorPackages || {}) };

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

    if (targetVendorId && targetVendorId !== 'all') {
      // Find matching vendor key among known vendors
      let matchedVendorKey = targetVendorId;
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

    // Dispatch automated dispatch or settlement email alerts
    try {
      if (status === 'dispatched' && existingOrder.customer_email) {
        sendDispatchNotificationEmail({
          orderNumber: existingOrder.order_number,
          customerName: existingOrder.customer_name,
          customerEmail: existingOrder.customer_email,
          deliveryAddress: existingOrder.delivery_address,
          items: existingOrder.order_items || [],
          totalAmount: Number(existingOrder.total_amount || 0),
          shippingFee: Number(existingOrder.shipping_fee || 0),
          driverPhone: driverPhone || '',
          waybillNumber: waybillNumber || '',
          vendorName: targetVendorId || 'Store Merchant'
        }).catch(e => console.error('Dispatch email error:', e));
      } else if (status === 'delivered') {
        const recipient = targetVendorId && targetVendorId.includes('@') ? targetVendorId : '';
        if (recipient) {
          sendDeliverySettledEmail(recipient, {
            orderNumber: existingOrder.order_number,
            customerName: existingOrder.customer_name,
            customerEmail: existingOrder.customer_email || '',
            deliveryAddress: existingOrder.delivery_address,
            items: existingOrder.order_items || [],
            totalAmount: Number(existingOrder.total_amount || 0),
            shippingFee: Number(existingOrder.shipping_fee || 0),
            vendorName: targetVendorId || 'Store Merchant'
          }).catch(e => console.error('Settled email error:', e));
        }
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
