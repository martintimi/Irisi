import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ user: null, authenticated: false }, { status: 200 });
    }

    const adminClient = createAdminClient();

    const isVendor = user.user_metadata?.user_type === 'vendor';

    if (isVendor) {
      const { data: vendorList } = await adminClient
        .from('vendors')
        .select('*')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .order('created_at', { ascending: false });

      const vendor = (vendorList || []).find((v: any) => v.user_id === user.id && v.is_verified)
        || (vendorList || []).find((v: any) => v.user_id === user.id)
        || (vendorList || []).find((v: any) => v.is_verified)
        || vendorList?.[0]
        || null;

      return NextResponse.json({
        authenticated: true,
        user,
        userType: 'vendor',
        vendor: vendor || null,
      });
    } else {
      const { data: profileList } = await adminClient
        .from('profiles')
        .select('*')
        .or(`id.eq.${user.id},email.eq.${user.email}`)
        .order('created_at', { ascending: false });

      const profile = (profileList || []).find((p: any) => p.id === user.id)
        || profileList?.[0]
        || null;

      return NextResponse.json({
        authenticated: true,
        user,
        userType: 'shopper',
        profile: profile ? {
          ...profile,
          name: profile.full_name,
          phone: profile.phone,
          email: profile.email,
          deliveryAddress: profile.delivery_address,
          city: profile.delivery_city,
          state: profile.delivery_state,
        } : {
          name: user.user_metadata?.full_name || user.email?.split('@')[0],
          email: user.email,
          phone: user.user_metadata?.phone || '',
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
