import { NextResponse } from 'next/server';
import { createShipbubbleShipment, ShipmentBookingRequest } from '@/lib/services/logistics';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookingReq = body as ShipmentBookingRequest;

    if (!bookingReq.orderNumber || !bookingReq.vendorId) {
      return NextResponse.json({ error: 'orderNumber and vendorId are required' }, { status: 400 });
    }

    // 1. Create courier shipment booking / waybill
    const shipmentResult = await createShipbubbleShipment(bookingReq);

    // 2. Persist booking info into Supabase order record
    try {
      const supabase = await createClient();
      const { data: order } = await supabase
        .from('orders')
        .select('id, customer_measurements')
        .eq('order_number', bookingReq.orderNumber)
        .maybeSingle();

      if (order) {
        const measurements = order.customer_measurements || {};
        const vendorPkgs = { ...(measurements.vendorPackages || {}) };
        const vKey = bookingReq.vendorId.toLowerCase().trim();

        vendorPkgs[vKey] = {
          ...(vendorPkgs[vKey] || {}),
          vendorId: vKey,
          vendorName: bookingReq.vendorName,
          waybillNumber: shipmentResult.waybillNumber,
          trackingNumber: shipmentResult.trackingNumber,
          courierName: shipmentResult.courierName,
          deliveryMethod: shipmentResult.deliveryMethod,
          courierServiceType: shipmentResult.courierServiceType,
          trackingUrl: shipmentResult.trackingUrl,
          instructions: shipmentResult.instructions,
          dropoffStation: shipmentResult.dropoffStation,
          status: shipmentResult.status,
          lastUpdated: new Date().toISOString()
        };

        await supabase
          .from('orders')
          .update({
            customer_measurements: {
              ...measurements,
              vendorPackages: vendorPkgs
            }
          })
          .eq('id', order.id);
      }
    } catch (dbErr) {
      console.warn('Failed to persist shipment update to Supabase:', dbErr);
    }

    return NextResponse.json({
      success: true,
      shipment: shipmentResult
    });
  } catch (error: any) {
    console.error('API /api/logistics/shipment error:', error);
    return NextResponse.json({ error: error.message || 'Failed to book shipment' }, { status: 500 });
  }
}
