import { createAdminClient } from '@/lib/supabase/admin';
import {
  DEFAULT_PLATFORM_BILLING_CONFIG,
  normalizeBillingConfig,
  PlatformBillingConfig,
} from '@/lib/config/platformBilling';

export async function fetchLivePlatformBillingConfig(): Promise<PlatformBillingConfig> {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('vendors')
      .select('id, bio')
      .eq('id', 'admin-platform-commission')
      .maybeSingle();

    if (!error && data?.bio) {
      try {
        const parsed = JSON.parse(data.bio);
        return normalizeBillingConfig(parsed);
      } catch (e) {
        console.warn('Failed to parse platform billing config JSON:', e);
      }
    }
  } catch (err) {
    console.warn('Error fetching platform billing config:', err);
  }
  return { ...DEFAULT_PLATFORM_BILLING_CONFIG };
}
