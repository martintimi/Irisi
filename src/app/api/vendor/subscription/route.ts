import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchLivePlatformBillingConfig } from '@/lib/config/platformBillingServer';
import {
  getEffectiveCommissionPercent,
  isVendorPlusActive,
} from '@/lib/config/platformBilling';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

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

function normVendorKey(val?: string | null): string {
  return String(val || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

async function computeVendorActiveEscrow(
  adminClient: ReturnType<typeof createAdminClient>,
  vendorId: string,
  brandName?: string
): Promise<{ activeEscrowBalance: number; settledBalance: number }> {
  try {
    const { data: rawOrders } = await adminClient
      .from('orders')
      .select('id, status, customer_measurements, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(200);

    const targetIdNorm = normVendorKey(vendorId);
    const targetNameNorm = normVendorKey(brandName);
    let activeEscrowBalance = 0;
    let settledBalance = 0;

    for (const ord of rawOrders || []) {
      const meas = (ord as any).customer_measurements || {};
      const vendorPkgs = meas.vendorPackages || {};
      const rawItems =
        Array.isArray((ord as any).order_items) && (ord as any).order_items.length > 0
          ? (ord as any).order_items
          : Array.isArray(meas.items)
          ? meas.items
          : [];

      const matchingItems = rawItems.filter((it: any) => {
        const iVid = normVendorKey(it.vendor_id || it.vendorId);
        const iVName = normVendorKey(it.vendorName || it.vendor_name);
        return (
          (targetIdNorm && iVid && (iVid === targetIdNorm || iVid.includes(targetIdNorm) || targetIdNorm.includes(iVid))) ||
          (targetNameNorm && iVName && (iVName === targetNameNorm || iVName.includes(targetNameNorm)))
        );
      });

      if (matchingItems.length === 0) continue;

      // Determine this vendor's package stage cleanly
      let pkgStage = 1;
      for (const [k, pkg] of Object.entries(vendorPkgs)) {
        const kNorm = normVendorKey(k);
        if (
          (targetIdNorm && (kNorm === targetIdNorm || kNorm.includes(targetIdNorm) || targetIdNorm.includes(kNorm))) ||
          (targetNameNorm && kNorm === targetNameNorm)
        ) {
          const pObj = pkg as any;
          pkgStage = Number(
            pObj?.trackingStage ||
              (pObj?.status === 'delivered' ? 4 : pObj?.status === 'dispatched' ? 3 : pObj?.status === 'packing' ? 2 : 1)
          );
          break;
        }
      }
      if (pkgStage === 1 && (ord as any).status === 'delivered') {
        pkgStage = 4;
      }

      const itemsSum = matchingItems.reduce(
        (sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
        0
      );

      if ((ord as any).status === 'disputed' || (ord as any).status === 'cancelled') {
        continue;
      }

      if (pkgStage >= 4) {
        settledBalance += itemsSum;
      } else {
        activeEscrowBalance += itemsSum;
      }
    }

    return { activeEscrowBalance, settledBalance };
  } catch (e) {
    console.warn('Error computing vendor escrow for subscription:', e);
    return { activeEscrowBalance: 0, settledBalance: 0 };
  }
}

// GET /api/vendor/subscription?vendorId=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorKey = searchParams.get('vendorId') || searchParams.get('email') || '';
    const billing = await fetchLivePlatformBillingConfig();

    if (!vendorKey) {
      return NextResponse.json({ success: true, billing, vendorPlan: null }, { headers: NO_STORE_HEADERS });
    }

    const adminClient = createAdminClient();
    const vendor = await resolveVendorRow(adminClient, vendorKey);
    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found', billing }, { status: 404, headers: NO_STORE_HEADERS });
    }

    const bioObj = parseBioJson(vendor.bio);
    const isPlus = isVendorPlusActive(bioObj, billing);
    const effectiveCommissionPercent = getEffectiveCommissionPercent(bioObj, billing);

    const [{ count: publishedProductCount }, escrowTotals] = await Promise.all([
      adminClient
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('vendor_id', vendor.id)
        .eq('is_published', true),
      computeVendorActiveEscrow(adminClient, vendor.id, vendor.brand_name),
    ]);

    const pendingPlusDeductionNgn = Math.max(0, Number(bioObj.pendingPlusDeductionNgn || 0));
    const availableEscrowForPlus = Math.max(0, escrowTotals.activeEscrowBalance - pendingPlusDeductionNgn);

    return NextResponse.json(
      {
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
          storefrontLocked: false,
          storefrontCleanMode: isPlus,
          escrowPlusAutoDeduct: Boolean(bioObj.escrowPlusAutoDeduct),
          pendingPlusDeductionNgn,
          escrowPlusDeductions: Array.isArray(bioObj.escrowPlusDeductions) ? bioObj.escrowPlusDeductions : [],
          activeEscrowBalance: escrowTotals.activeEscrowBalance,
          availableEscrowForPlus,
        },
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error('Vendor subscription GET error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

// POST /api/vendor/subscription — Paystack, Self-Enabled Escrow Deduction, Toggle Opt-In, or Admin Controls
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      vendorId,
      email,
      action = 'activate_plus', // 'activate_plus' | 'activate_plus_from_escrow' | 'toggle_escrow_deduct' | 'admin_clear_escrow_deduction' | 'admin_grant_plus' | 'admin_revoke_plus'
      paymentRef,
      durationDays = 30,
      lifetimeFree = false,
      enabled,
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

    const bioObj = parseBioJson(vendor.bio);
    const now = Date.now();
    const days = Math.max(1, Number(durationDays) || 30);

    // 1. Vendor self-service toggle: Opt-in or opt-out of deducting ÌRÍSÍ Plus from Escrow Payouts
    if (action === 'toggle_escrow_deduct') {
      const nextEnabled = Boolean(enabled);
      bioObj.escrowPlusAutoDeduct = nextEnabled;
      bioObj.escrowPlusAutoDeductUpdatedAt = new Date().toISOString();

      const { error: updateErr } = await adminClient
        .from('vendors')
        .update({ bio: JSON.stringify(bioObj) })
        .eq('id', vendor.id);

      if (updateErr) {
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json(
        {
          success: true,
          escrowPlusAutoDeduct: nextEnabled,
          message: nextEnabled
            ? 'Escrow deduction enabled — you can now activate or renew ÌRÍSÍ Plus directly from your escrow earnings.'
            : 'Escrow auto-deduction turned off. You will only be billed if you choose to pay via Paystack.',
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    // 2. Super Admin clears a pending Plus Escrow deduction after settling payout
    if (action === 'admin_clear_escrow_deduction') {
      const prevPending = Number(bioObj.pendingPlusDeductionNgn || 0);
      bioObj.pendingPlusDeductionNgn = 0;
      if (Array.isArray(bioObj.escrowPlusDeductions)) {
        bioObj.escrowPlusDeductions = bioObj.escrowPlusDeductions.map((d: any) => ({
          ...d,
          status: 'settled',
          settledAt: d.settledAt || new Date().toISOString(),
        }));
      }

      const { error: updateErr } = await adminClient
        .from('vendors')
        .update({ bio: JSON.stringify(bioObj) })
        .eq('id', vendor.id);

      if (updateErr) {
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json(
        {
          success: true,
          message: `Marked ₦${prevPending.toLocaleString()} Plus Escrow deduction as settled for ${vendor.brand_name}.`,
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    // 3. Vendor opts in to activate / renew ÌRÍSÍ Plus directly from their active Escrow balance
    if (action === 'activate_plus_from_escrow') {
      const plusPrice = Math.max(0, Number(billing.plusMonthlyPriceNgn || 5000));
      const { activeEscrowBalance } = await computeVendorActiveEscrow(adminClient, vendor.id, vendor.brand_name);
      const currentPending = Math.max(0, Number(bioObj.pendingPlusDeductionNgn || 0));
      const availableEscrow = Math.max(0, activeEscrowBalance - currentPending);

      if (plusPrice > 0 && availableEscrow < plusPrice) {
        return NextResponse.json(
          {
            success: false,
            error: `You need at least ₦${plusPrice.toLocaleString()} in available Escrow balance (currently ₦${availableEscrow.toLocaleString()}). Complete a sale or activate instantly via Paystack.`,
          },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }

      const currentExpiry = bioObj.plusExpiresAt ? new Date(bioObj.plusExpiresAt).getTime() : 0;
      const baseMs = currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(baseMs + days * 86400000).toISOString();
      const deductionRef = `ESCROW_PLUS_${Date.now()}`;

      bioObj.subscriptionPlan = 'plus';
      bioObj.plusExpiresAt = newExpiry;
      bioObj.plusLifetimeFree = false;
      bioObj.plusLastPaymentRef = deductionRef;
      bioObj.plusActivatedAt = new Date().toISOString();
      bioObj.escrowPlusAutoDeduct = true;
      bioObj.pendingPlusDeductionNgn = currentPending + plusPrice;
      const existingDeductions = Array.isArray(bioObj.escrowPlusDeductions) ? bioObj.escrowPlusDeductions : [];
      bioObj.escrowPlusDeductions = [
        {
          id: deductionRef,
          amountNgn: plusPrice,
          createdAt: new Date().toISOString(),
          status: 'pending_settlement',
          note: `ÌRÍSÍ Plus (${days} days) — Vendor Escrow Opt-In`,
        },
        ...existingDeductions.slice(0, 19),
      ];

      const { error: updateErr } = await adminClient
        .from('vendors')
        .update({ bio: JSON.stringify(bioObj) })
        .eq('id', vendor.id);

      if (updateErr) {
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
      }

      try {
        await adminClient.from('notifications').insert({
          title: `VENDOR_PLUS_ESCROW:${vendor.brand_name}`,
          message: JSON.stringify({
            vendorId: vendor.id,
            brandName: vendor.brand_name,
            action: 'activate_plus_from_escrow',
            paymentRef: deductionRef,
            amountNgn: plusPrice,
            expiresAt: newExpiry,
          }),
          type: 'vendor_subscription',
          read: false,
        });
      } catch {}

      return NextResponse.json(
        {
          success: true,
          message: `ÌRÍSÍ Plus activated! ₦${plusPrice.toLocaleString()} will be deducted from your next Escrow payout.`,
          subscriptionPlan: bioObj.subscriptionPlan,
          plusExpiresAt: bioObj.plusExpiresAt,
          pendingPlusDeductionNgn: bioObj.pendingPlusDeductionNgn,
          isPlus: true,
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    // 4. Paystack self-upgrade verification
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

    return NextResponse.json(
      {
        success: true,
        message:
          action === 'admin_revoke_plus'
            ? `${vendor.brand_name} moved to Free tier.`
            : `${vendor.brand_name} is now active on ÌRÍSÍ Plus!`,
        subscriptionPlan: bioObj.subscriptionPlan,
        plusExpiresAt: bioObj.plusExpiresAt,
        isPlus: isVendorPlusActive(bioObj, billing),
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error('Vendor subscription POST error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
