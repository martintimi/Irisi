import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Shipbubble & Nigerian Logistics Service Health Check
 */
export async function GET() {
  const key = process.env.SHIPBUBBLE_API_KEY;

  if (!key) {
    return NextResponse.json({
      status: 'fallback_only',
      carrierGateway: 'Nigerian Distance Matrix Active',
      shipbubbleConnected: false,
      message: 'No SHIPBUBBLE_API_KEY detected in environment. Using high-precision Nigerian courier matrix.'
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
      status: 'degraded',
      carrierGateway: 'Nigerian Distance Matrix Fallback Active',
      shipbubbleConnected: false,
      error: err.message
    });
  }
}
