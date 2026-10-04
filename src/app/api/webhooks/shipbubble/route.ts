import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendDispatchNotificationEmail, sendDeliverySettledEmail, sendOrderDeliveredCustomerEmail } from '@/lib/services/emailService';

/**
 * Shipbubble Live Webhook Listener
 * Receives real-time courier status updates from GIG Logistics, Fez, Red Star, DHL
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log('[Shipbubble Webhook Received]:', JSON.stringify(payload, null, 2));

    const event = payload.event || payload.status;
    const shipmentData = payload.data || payload;
    const trackingNumber = shipmentData.tracking_number || shipmentData.waybill_number;
    const courierStatus = (shipmentData.status || '').toLowerCase();

    if (!trackingNumber) {
      return NextResponse.json({ message: 'No tracking number found' }, { status: 200 });
    }

    const supabase = await createClient();

    // Find order matching this tracking number
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .limit(50);

    if (error || !orders || orders.length === 0) {
      return NextResponse.json({ message: 'Order lookup handled' }, { status: 200 });
    }

    // Match order containing this tracking number in customer_measurements
    const matchingOrder = orders.find((ord: any) => {
      const vendorPackages = ord.customer_measurements?.vendorPackages || {};
      return Object.values(vendorPackages).some((pkg: any) => 
        pkg.waybillNumber === trackingNumber || 
        pkg.trackingNumber === trackingNumber ||
        pkg.shipmentId === shipmentData.id
      );
    });

    if (matchingOrder) {
      const customerMeasurements = matchingOrder.customer_measurements || {};
      const vendorPackages = customerMeasurements.vendorPackages || {};

      let isDelivered = false;
      let isDispatched = false;

      Object.keys(vendorPackages).forEach((vId) => {
        const pkg = vendorPackages[vId];
        if (
          pkg.waybillNumber === trackingNumber || 
          pkg.trackingNumber === trackingNumber ||
          pkg.shipmentId === shipmentData.id
        ) {
          if (courierStatus.includes('deliver') || event === 'shipment.delivered') {
            pkg.status = 'delivered';
            pkg.trackingStage = 4;
            isDelivered = true;
          } else if (
            courierStatus.includes('transit') || 
            courierStatus.includes('pickup') || 
            event === 'shipment.in_transit' ||
            event === 'shipment.pickup_completed'
          ) {
            pkg.status = 'dispatched';
            pkg.trackingStage = 3;
            isDispatched = true;
          }
        }
      });

      const newOrderStatus = isDelivered ? 'delivered' : isDispatched ? 'dispatched' : matchingOrder.status;

      await supabase
        .from('orders')
        .update({
          status: newOrderStatus,
          customer_measurements: {
            ...customerMeasurements,
            vendorPackages
          }
        })
        .eq('id', matchingOrder.id);

      // Send emails
      if (isDelivered) {
        if (matchingOrder.customer_email) {
          console.log(`[SHIPBUBBLE] Order ${matchingOrder.order_number} marked delivered. Sending customer email.`);
          await sendOrderDeliveredCustomerEmail({
            orderNumber: matchingOrder.order_number,
            customerName: matchingOrder.customer_name,
            customerEmail: matchingOrder.customer_email,
            deliveryAddress: matchingOrder.delivery_address || 'Nigeria',
            items: customerMeasurements.items || [],
            totalAmount: matchingOrder.total_amount || 0,
            shippingFee: matchingOrder.shipping_fee || 0
          }).catch(e => console.error('[Shipbubble Webhook] Delivered email error:', e));
        }
      } else if (isDispatched && matchingOrder.customer_email) {
        await sendDispatchNotificationEmail({
          orderNumber: matchingOrder.order_number,
          customerName: matchingOrder.customer_name,
          customerEmail: matchingOrder.customer_email,
          waybillNumber: trackingNumber,
          driverPhone: shipmentData.driver_phone || shipmentData.courier_name || 'Assigned Courier',
          deliveryAddress: matchingOrder.delivery_address || 'Nigeria',
          items: customerMeasurements.items || [],
          totalAmount: matchingOrder.total_amount || 0,
          shippingFee: matchingOrder.shipping_fee || 0
        }).catch(e => console.error('Dispatch notification email error:', e));
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('[Shipbubble Webhook Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
