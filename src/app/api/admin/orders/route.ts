import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Super Admin Orders Management API
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { orderId, vendorId, status, trackingStage, waybillNumber, courierName, driverPhone, releaseEscrow } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    // Fetch existing order
    const { data: existingOrder, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchErr || !existingOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const updates: Record<string, any> = {};

    if (status) {
      updates.status = status;
    }

    // Update customer_measurements tracking details if provided
    const measurements = existingOrder.customer_measurements || {};
    const trackingDetails = measurements.trackingDetails || {};
    const vendorPackages = measurements.vendorPackages || {};

    if (trackingStage !== undefined) {
      trackingDetails.trackingStage = Number(trackingStage);
      if (trackingStage >= 4) {
        updates.status = 'delivered';
      } else if (trackingStage === 3) {
        updates.status = 'dispatched';
      } else if (trackingStage === 2) {
        updates.status = 'packing';
      }
    }

    if (waybillNumber) trackingDetails.waybillNumber = waybillNumber;
    if (courierName) trackingDetails.courierName = courierName;
    if (driverPhone) trackingDetails.driverPhone = driverPhone;

    if (releaseEscrow) {
      if (vendorId) {
        // Targeted release for a specific vendor's package
        const cleanVId = String(vendorId).toLowerCase().trim();
        let targetKey = Object.keys(vendorPackages).find(k => k.toLowerCase().trim() === cleanVId) || cleanVId;

        if (vendorPackages[targetKey]) {
          vendorPackages[targetKey] = {
            ...vendorPackages[targetKey],
            status: 'delivered',
            trackingStage: 4,
            escrowReleased: true,
            escrowReleasedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          };
        }

        // Update DB order_items strictly for this vendor
        await supabase
          .from('order_items')
          .update({ status: 'delivered' })
          .eq('order_id', orderId)
          .ilike('vendor_id', `%${cleanVId}%`);

        // Check if all packages are now completed
        const allPkgs = Object.values(vendorPackages) as any[];
        const allDelivered = allPkgs.length > 0 && allPkgs.every(p => p.trackingStage >= 4 || p.status === 'delivered');
        if (allDelivered) {
          updates.status = 'delivered';
          trackingDetails.trackingStage = 4;
          trackingDetails.escrowReleased = true;
          trackingDetails.escrowReleasedAt = new Date().toISOString();
        } else {
          updates.status = existingOrder.status || 'dispatched';
        }
      } else {
        // Global order release
        trackingDetails.escrowReleased = true;
        trackingDetails.escrowReleasedAt = new Date().toISOString();
        updates.status = 'delivered';

        Object.keys(vendorPackages).forEach(k => {
          vendorPackages[k] = {
            ...vendorPackages[k],
            status: 'delivered',
            trackingStage: 4,
            escrowReleased: true,
            escrowReleasedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          };
        });

        await supabase
          .from('order_items')
          .update({ status: 'delivered' })
          .eq('order_id', orderId);
      }
    }

    measurements.vendorPackages = vendorPackages;

    measurements.trackingDetails = trackingDetails;
    updates.customer_measurements = measurements;

    const { data: updatedOrder, error: updateErr } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (updateErr) {
      console.error('Super Admin order update error:', updateErr);
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully by Super Admin',
      order: updatedOrder
    });
  } catch (err: any) {
    console.error('Super Admin PATCH orders error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    // Delete related order_items first
    await supabase.from('order_items').delete().eq('order_id', orderId);

    // Delete order
    const { error } = await supabase.from('orders').delete().eq('id', orderId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Order ${orderId} removed from database`
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
