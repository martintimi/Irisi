import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Shipbubble & Nigerian Logistics Service Health Check
 */
export async function GET() {
  const key = process.env.SHIPBUBBLE_API_KEY;

  if (!key) {
    return NextResponse.json({
      status: 'vendor_matrix_active',
      carrierGateway: 'Vendor Atelier Rates & Regional Logistics Matrix Active',
      shipbubbleConnected: false,
      message: 'Operating on vendor-configured atelier rates and regional logistics matrix.'
    });
  }

  try {
    const res = await fetch('https://api.shipbubble.com/v1/shipping/labels/categories', {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(4000)
    });
    const data = await res.json();

    return NextResponse.json({
      status: 'healthy',
      carrierGateway: 'Shipbubble Live Carrier Engine',
      shipbubbleConnected: data.status === 'success',
      keyPrefix: key.slice(0, 10) + '...',
      fashionCategoryId: 74794423,
      verifiedCategories: data.data?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'vendor_matrix_active',
      carrierGateway: 'Vendor Atelier Rates & Regional Logistics Matrix Active',
      shipbubbleConnected: false,
      error: err.message
    });
  }
}
