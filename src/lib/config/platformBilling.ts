export interface PlatformBillingConfig {
  /** Global Launch Free Trial switch: while true, all vendors enjoy 0% commission & full Plus features free */
  freeLaunchMode: boolean;
  /** Legacy compatibility mirror: true when commission charging is active (!freeLaunchMode) */
  isEnabled: boolean;
  /** Commission % charged on successful escrow-released orders for Free / Standard vendors */
  freeTierCommissionPercent: number;
  /** Commission % charged on successful escrow-released orders for ÌRÍSÍ Plus vendors */
  plusTierCommissionPercent: number;
  /** Legacy mirror of freeTierCommissionPercent */
  commissionPercent: number;
  /** Monthly subscription price (NGN) for ÌRÍSÍ Plus — editable anytime in Admin */
  plusMonthlyPriceNgn: number;
  /** Max active published products allowed on Free tier once freeLaunchMode is turned OFF */
  freeTierProductLimit: number;
  /** Option B default = false (Free tier keeps basic storefront with marketplace discovery below; Plus gets white-label storefront). Set true to strictly gate storefront links. */
  requirePlusForStorefront: boolean;
  updatedAt: string;
}

export const DEFAULT_PLATFORM_BILLING_CONFIG: PlatformBillingConfig = {
  freeLaunchMode: true,
  isEnabled: false,
  freeTierCommissionPercent: 8,
  plusTierCommissionPercent: 5,
  commissionPercent: 0,
  plusMonthlyPriceNgn: 5000,
  freeTierProductLimit: 12,
  requirePlusForStorefront: false,
  updatedAt: new Date().toISOString(),
};

export function normalizeBillingConfig(raw?: Partial<PlatformBillingConfig> | null): PlatformBillingConfig {
  const input = raw || {};
  // Backwards compatibility: if old config only had isEnabled, derive freeLaunchMode = !isEnabled
  const freeLaunchMode =
    typeof input.freeLaunchMode === 'boolean'
      ? input.freeLaunchMode
      : typeof input.isEnabled === 'boolean'
      ? !input.isEnabled
      : DEFAULT_PLATFORM_BILLING_CONFIG.freeLaunchMode;

  const freeTierCommissionPercent = clampNumber(
    input.freeTierCommissionPercent ?? (input.commissionPercent && input.commissionPercent > 0 ? input.commissionPercent : DEFAULT_PLATFORM_BILLING_CONFIG.freeTierCommissionPercent),
    0,
    40
  );

  const plusTierCommissionPercent = clampNumber(
    input.plusTierCommissionPercent ?? DEFAULT_PLATFORM_BILLING_CONFIG.plusTierCommissionPercent,
    0,
    40
  );

  const plusMonthlyPriceNgn = clampNumber(
    input.plusMonthlyPriceNgn ?? DEFAULT_PLATFORM_BILLING_CONFIG.plusMonthlyPriceNgn,
    0,
    500000
  );

  const freeTierProductLimit = clampNumber(
    input.freeTierProductLimit ?? DEFAULT_PLATFORM_BILLING_CONFIG.freeTierProductLimit,
    1,
    1000
  );

  const requirePlusForStorefront = Boolean(input.requirePlusForStorefront);

  return {
    freeLaunchMode,
    isEnabled: !freeLaunchMode,
    freeTierCommissionPercent,
    plusTierCommissionPercent,
    commissionPercent: freeLaunchMode ? 0 : freeTierCommissionPercent,
    plusMonthlyPriceNgn,
    freeTierProductLimit,
    requirePlusForStorefront,
    updatedAt: input.updatedAt || new Date().toISOString(),
  };
}

export function isVendorPlusActive(vendorBioObj: any, billing: PlatformBillingConfig): boolean {
  if (billing.freeLaunchMode) return true;
  if (!vendorBioObj || typeof vendorBioObj !== 'object') return false;
  if (vendorBioObj.plusLifetimeFree === true) return true;
  if (vendorBioObj.subscriptionPlan === 'plus') {
    if (!vendorBioObj.plusExpiresAt) return true;
    return new Date(vendorBioObj.plusExpiresAt).getTime() > Date.now();
  }
  return false;
}

export function getEffectiveCommissionPercent(vendorBioObj: any, billing: PlatformBillingConfig): number {
  if (billing.freeLaunchMode) return 0;
  if (vendorBioObj?.commissionExempt === true) return 0;
  return isVendorPlusActive(vendorBioObj, billing)
    ? billing.plusTierCommissionPercent
    : billing.freeTierCommissionPercent;
}

function clampNumber(value: unknown, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}
