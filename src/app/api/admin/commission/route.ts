import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeBillingConfig } from '@/lib/config/platformBilling';
import { fetchLivePlatformBillingConfig } from '@/lib/config/platformBillingServer';

export const dynamic = 'force-dynamic';

// GET: Retrieve live platform billing, Free Launch Kill-Switch, Plus price & commission rates
export async function GET() {
  const config = await fetchLivePlatformBillingConfig();
  return NextResponse.json(
    { success: true, config },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}

// POST: Save updated billing rules from Super Admin (anytime, live globally)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const existing = await fetchLivePlatformBillingConfig();

    const freeLaunchMode =
      typeof body?.freeLaunchMode === 'boolean'
        ? body.freeLaunchMode
        : typeof body?.isEnabled === 'boolean'
        ? !body.isEnabled
        : existing.freeLaunchMode;

    const newConfig = normalizeBillingConfig({
      ...existing,
      freeLaunchMode,
      isEnabled: !freeLaunchMode,
      freeTierCommissionPercent:
        body?.freeTierCommissionPercent !== undefined
          ? Number(body.freeTierCommissionPercent)
          : body?.commissionPercent !== undefined
          ? Number(body.commissionPercent)
          : existing.freeTierCommissionPercent,
      plusTierCommissionPercent:
        body?.plusTierCommissionPercent !== undefined
          ? Number(body.plusTierCommissionPercent)
          : existing.plusTierCommissionPercent,
      plusMonthlyPriceNgn:
        body?.plusMonthlyPriceNgn !== undefined
          ? Number(body.plusMonthlyPriceNgn)
          : existing.plusMonthlyPriceNgn,
      freeTierProductLimit:
        body?.freeTierProductLimit !== undefined
          ? Number(body.freeTierProductLimit)
          : existing.freeTierProductLimit,
      requirePlusForStorefront:
        typeof body?.requirePlusForStorefront === 'boolean'
          ? body.requirePlusForStorefront
          : existing.requirePlusForStorefront,
      updatedAt: new Date().toISOString(),
    });

    const adminClient = createAdminClient();
    const { error: dbError } = await adminClient
      .from('vendors')
      .upsert({
        id: 'admin-platform-commission',
        brand_name: 'Platform Billing & Commission Settings',
        bio: JSON.stringify(newConfig),
      }, { onConflict: 'id' });

    if (dbError) {
      console.error('Failed to save platform billing config:', dbError);
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    const modeSummary = newConfig.freeLaunchMode
      ? 'Global Free Launch Period ACTIVE (0% commission · Free Plus access)'
      : `Billing LIVE: Free ${newConfig.freeTierCommissionPercent}% | Plus ₦${newConfig.plusMonthlyPriceNgn.toLocaleString()}/mo (${newConfig.plusTierCommissionPercent}%)`;

    return NextResponse.json({
      success: true,
      message: modeSummary,
      config: newConfig,
    });
  } catch (err: any) {
    console.error('Error saving platform billing setting:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
