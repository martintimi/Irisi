import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 20;

const ALERT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // Keep last 7 days of follower drop/story alerts

function slugifyKey(v: string): string {
  return (v || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// GET /api/shopper/notifications?followedVendors=id1,id2&email=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawFollowed = searchParams.get('followedVendors') || '';
    const shopperEmail = (searchParams.get('email') || '').toLowerCase().trim();

    const followedSet = new Set<string>();
    rawFollowed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => {
        followedSet.add(s.toLowerCase());
        const slug = slugifyKey(s);
        if (slug) followedSet.add(slug);
      });

    const adminClient = createAdminClient();

    // Also pull DB-persisted follows for logged-in shopper email (works across devices!)
    if (shopperEmail && shopperEmail.includes('@')) {
      try {
        const { data: vfRows } = await adminClient
          .from('vendor_followers')
          .select('vendor_id')
          .eq('shopper_email', shopperEmail)
          .limit(100);
        for (const vf of vfRows || []) {
          const key = String(vf.vendor_id || '').toLowerCase().trim();
          if (key) {
            followedSet.add(key);
            const slug = slugifyKey(key);
            if (slug) followedSet.add(slug);
          }
        }
      } catch {}

      const { data: followRows } = await adminClient
        .from('notifications')
        .select('title')
        .eq('type', 'vendor_follow')
        .eq('message', shopperEmail)
        .limit(100);

      for (const r of followRows || []) {
        const key = (r.title || '').replace(/^FOLLOW:/i, '').toLowerCase().trim();
        if (key) {
          followedSet.add(key);
          const slug = slugifyKey(key);
          if (slug) followedSet.add(slug);
        }
      }
    }

    if (followedSet.size === 0 && !shopperEmail) {
      return NextResponse.json({ success: true, notifications: [] });
    }

    const [{ data: alertRows, error }, { data: orderAlertRows }] = await Promise.all([
      adminClient
        .from('notifications')
        .select('id, title, message, action_url, created_at')
        .eq('type', 'follower_alert')
        .order('created_at', { ascending: false })
        .limit(80),
      shopperEmail
        ? adminClient
            .from('notifications')
            .select('id, title, message, action_url, created_at')
            .eq('type', 'shopper_order_alert')
            .eq('title', `ORDER_ALERT:${shopperEmail}`)
            .order('created_at', { ascending: false })
            .limit(30)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    if (error && (!orderAlertRows || orderAlertRows.length === 0)) {
      return NextResponse.json({ success: true, notifications: [] });
    }

    const cutoff = Date.now() - ALERT_WINDOW_MS;
    const matched: any[] = [];

    // 1. Live Order Status Updates (Packed / Dispatched / Delivered)
    for (const row of orderAlertRows || []) {
      const createdMs = new Date(row.created_at).getTime();
      if (Number.isFinite(createdMs) && createdMs < cutoff) continue;
      try {
        const parsed = JSON.parse(row.message || '{}');
        matched.push({
          id: `order-alert-${row.id}`,
          kind: parsed.kind || 'order_status',
          vendorName: parsed.vendorName || 'ÌRÍSÍ',
          title: parsed.title || `Order ${parsed.orderNumber || ''} Updated`,
          message: parsed.message || 'Tap to track your order live.',
          actionUrl: row.action_url || '/track-order',
          createdAt: parsed.createdAt || row.created_at,
        });
      } catch {}
    }

    for (const row of alertRows || []) {
      const createdMs = new Date(row.created_at).getTime();
      if (Number.isFinite(createdMs) && createdMs < cutoff) continue;

      try {
        const parsed = JSON.parse(row.message || '{}');
        const vId = String(parsed.vendorId || '').toLowerCase().trim();
        const vSlug = slugifyKey(parsed.vendorSlug || parsed.vendorName || vId);
        const vNameLower = String(parsed.vendorName || '').toLowerCase().trim();
        const vEmail = String(parsed.vendorEmail || '').toLowerCase().trim();
        const targetEmails: string[] = Array.isArray(parsed.targetEmails)
          ? parsed.targetEmails.map((e: any) => String(e || '').toLowerCase().trim())
          : [];

        const isFollowingVendor =
          (vId && followedSet.has(vId)) ||
          (vSlug && followedSet.has(vSlug)) ||
          (vNameLower && followedSet.has(vNameLower)) ||
          (vEmail && followedSet.has(vEmail)) ||
          (shopperEmail && targetEmails.includes(shopperEmail));

        if (!isFollowingVendor) continue;

        matched.push({
          id: `alert-${row.id}`,
          kind: parsed.kind || 'vendor_story',
          vendorId: parsed.vendorId || vId,
          vendorName: parsed.vendorName || 'Followed Brand',
          vendorAvatar: parsed.vendorAvatar || parsed.previewImage || '',
          title: parsed.title || `${parsed.vendorName || 'Brand'} posted an update`,
          message: parsed.message || 'Tap to view on Shop.',
          actionUrl: row.action_url || (parsed.kind === 'new_product' ? '/shop' : `/shop?story=${encodeURIComponent(parsed.vendorId || vId)}`),
          createdAt: parsed.createdAt || row.created_at,
        });
      } catch {}
    }

    matched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(
      { success: true, notifications: matched.slice(0, 35) },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: any) {
    console.error('GET /api/shopper/notifications error:', err);
    return NextResponse.json({ success: false, notifications: [] }, { status: 500 });
  }
}
