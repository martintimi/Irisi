import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

const DEFAULT_COMMISSION_CONFIG = {
  commissionPercent: 0,
  isEnabled: false,
  updatedAt: new Date().toISOString()
};

// GET: Retrieve the platform commission rate (defaults to 0%)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('id, bio')
      .eq('id', 'admin-platform-commission')
      .single();

    if (!error && data && data.bio) {
      try {
        const parsed = JSON.parse(data.bio);
        return NextResponse.json({
          success: true,
          config: {
            ...DEFAULT_COMMISSION_CONFIG,
            ...parsed,
            commissionPercent: Number(parsed.commissionPercent || 0),
            isEnabled: Boolean(parsed.isEnabled)
          }
        }, {
          headers: { 'Cache-Control': 'no-store, max-age=0' }
        });
      } catch (e) {
        console.warn('Failed to parse commission config json:', e);
      }
    }

    return NextResponse.json({
      success: true,
      config: DEFAULT_COMMISSION_CONFIG
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (err: any) {
    console.error('Error fetching commission settings:', err);
    return NextResponse.json({
      success: true,
      config: DEFAULT_COMMISSION_CONFIG
    });
  }
}

// POST: Save new commission rate configured by Super Admin
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPercent = Number(body?.commissionPercent ?? 0);
    const isEnabled = Boolean(body?.isEnabled);

    // Keep commission between 0% and 50% max for safety
    const commissionPercent = Math.max(0, Math.min(50, isNaN(rawPercent) ? 0 : rawPercent));

    const newConfig = {
      commissionPercent,
      isEnabled,
      updatedAt: new Date().toISOString()
    };

    // Persist to Supabase so all serverless routes and frontend immediately see it
    const { error: dbError } = await supabase
      .from('vendors')
      .upsert({
        id: 'admin-platform-commission',
        brand_name: 'Platform Commission Settings',
        bio: JSON.stringify(newConfig)
      });

    if (dbError) {
      console.error('Failed to save commission config to Supabase:', dbError);
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Platform commission set to ${commissionPercent}% (${isEnabled ? 'Active' : 'Inactive'}).`,
      config: newConfig
    });
  } catch (err: any) {
    console.error('Error saving commission setting:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
