import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchLivePlatformBillingConfig } from '@/lib/config/platformBillingServer';
import {
  getEffectiveCommissionPercent,
  isVendorPlusActive,
} from '@/lib/config/platformBilling';

export const dynamic = 'force-dynamic';

async function resolveVendorRow(adminClient: ReturnType<typeof createAdminClient>, vendorIdOrEmail: string) {
  const key = vendorIdOrEmail.trim();
  if (!key) return null;

  if (key.includes('@')) {
    const { data } = await adminClient
      .from('vendors')
      .select('*')
      .ilike('email', key.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1);
    return data?.[0] || null;
  }

  const { data } = await adminClient
    .from('vendors')
    .select('*')
    .eq('id', key)
    .maybeSingle();
  return data || null;
}

function parseBioJson(rawBio?: string | null): Record<string, any> {
  if (!rawBio) return {};
  const trimmed = rawBio.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed);
    } catch {}
  }
  return { bio: rawBio };
}

// GET /api/vendor/subscription?vendorId=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorKey = searchParams.get('vendorId') || searchParams.get('email') || '';
    const billing = await fetchLivePlatformBillingConfig();

    if (!vendorKey) {
      return NextResponse.json({ success: true, billing, vendorPlan: null });
    }

    const adminClient = createAdminClient();
    const vendor = await resolveVendorRow(adminClient, vendorKey);
    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found', billing }, { status: 404 });
    }

    const bioObj = parseBioJson(vendor.bio);
    const isPlus = isVendorPlusActive(bioObj, billing);
    const effectiveCommissionPercent = getEffectiveCommissionPercent(bioObj, billing);

    const { count: publishedProductCount } = await adminClient
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)
      .eq('is_published', true);

    return NextResponse.json({
      success: true,
      billing,
      vendorPlan: {
        vendorId: vendor.id,
        brandName: vendor.brand_name,
        subscriptionPlan: bioObj.subscriptionPlan || 'free',
        isPlus,
        plusExpiresAt: bioObj.plusExpiresAt || null,
        plusLifetimeFree: Boolean(bioObj.plusLifetimeFree),
        effectiveCommissionPercent,
        publishedProductCount: publishedProductCount || 0,
        productLimit: isPlus ? null : billing.freeTierProductLimit,
        storefrontLocked: !isPlus && billing.requirePlusForStorefront,
        storefrontCleanMode: isPlus,
      },
    });
  } catch (err: any) {
    console.error('Vendor subscription GET error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/vendor/subscription — Activate Plus via Paystack reference OR Admin Grant/Revoke
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      vendorId,
      email,
      action = 'activate_plus', // 'activate_plus' | 'admin_grant_plus' | 'admin_revoke_plus'
      paymentRef,
      durationDays = 30,
      lifetimeFree = false,
    } = body;

    const vendorKey = (vendorId || email || '').trim();
    if (!vendorKey) {
      return NextResponse.json({ success: false, error: 'Vendor ID or email is required.' }, { status: 400 });
    }

    const billing = await fetchLivePlatformBillingConfig();
    const adminClient = createAdminClient();
    const vendor = await resolveVendorRow(adminClient, vendorKey);

    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor record not found.' }, { status: 404 });
    }

    // If vendor self-upgrading via Paystack, verify payment reference when Paystack secret is configured
    if (action === 'activate_plus') {
      if (!paymentRef) {
        return NextResponse.json({ success: false, error: 'Payment reference is required.' }, { status: 400 });
      }
      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
      if (paystackSecret && !String(paymentRef).startsWith('MOCK_')) {
        const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(paymentRef)}`, {
          headers: { Authorization: `Bearer ${paystackSecret}` },
        });
        const verifyJson = await verifyRes.json().catch(() => ({}));
        if (!verifyRes.ok || !verifyJson?.status || verifyJson?.data?.status !== 'success') {
          return NextResponse.json(
            { success: false, error: verifyJson?.message || 'Could not verify Paystack subscription payment.' },
            { status: 400 }
          );
        }
        const paidNgn = Number(verifyJson.data.amount || 0) / 100;
        if (billing.plusMonthlyPriceNgn > 0 && paidNgn + 1 < billing.plusMonthlyPriceNgn) {
          return NextResponse.json(
            { success: false, error: `Paid amount (₦${paidNgn}) is less than Plus plan price (₦${billing.plusMonthlyPriceNgn}).` },
            { status: 400 }
          );
        }
      }
    }

    const bioObj = parseBioJson(vendor.bio);
    const now = Date.now();
    const days = Math.max(1, Number(durationDays) || 30);

    if (action === 'admin_revoke_plus') {
      bioObj.subscriptionPlan = 'free';
      bioObj.plusExpiresAt = null;
      bioObj.plusLifetimeFree = false;
      bioObj.plusUpdatedAt = new Date().toISOString();
    } else {
      const currentExpiry = bioObj.plusExpiresAt ? new Date(bioObj.plusExpiresAt).getTime() : 0;
      const baseMs = currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(baseMs + days * 86400000).toISOString();

      bioObj.subscriptionPlan = 'plus';
      bioObj.plusExpiresAt = lifetimeFree ? null : newExpiry;
      bioObj.plusLifetimeFree = Boolean(lifetimeFree);
      bioObj.plusLastPaymentRef = paymentRef || (action === 'admin_grant_plus' ? 'ADMIN_GRANTED' : null);
      bioObj.plusActivatedAt = new Date().toISOString();
    }

    const { error: updateErr } = await adminClient
      .from('vendors')
      .update({ bio: JSON.stringify(bioObj) })
      .eq('id', vendor.id);

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    // Log subscription event to notifications for Admin audit
    try {
      await adminClient.from('notifications').insert({
        title: `VENDOR_PLUS:${vendor.brand_name}`,
        message: JSON.stringify({
          vendorId: vendor.id,
          brandName: vendor.brand_name,
          action,
          paymentRef: paymentRef || null,
          amountNgn: action === 'activate_plus' ? billing.plusMonthlyPriceNgn : 0,
          expiresAt: bioObj.plusExpiresAt || null,
          lifetimeFree: bioObj.plusLifetimeFree,
        }),
        type: 'vendor_subscription',
        read: false,
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message:
        action === 'admin_revoke_plus'
          ? `${vendor.brand_name} moved to Free tier.`
          : `${vendor.brand_name} is now active on ÌRÍSÍ Plus!`,
      subscriptionPlan: bioObj.subscriptionPlan,
      plusExpiresAt: bioObj.plusExpiresAt,
      isPlus: isVendorPlusActive(bioObj, billing),
    });
  } catch (err: any) {
    console.error('Vendor subscription POST error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
