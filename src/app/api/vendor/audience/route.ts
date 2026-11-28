import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchLivePlatformBillingConfig } from '@/lib/config/platformBillingServer';
import { isVendorPlusActive } from '@/lib/config/platformBilling';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

function normKey(v?: string | null): string {
  return String(v || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

function parseBioJson(rawBio?: string | null): Record<string, any> {
  if (!rawBio) return {};
  const trimmed = rawBio.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed);
    } catch {}
  }
  return {};
}

function prettyNameFromEmail(email: string): string {
  const local = (email || '').split('@')[0] || 'Shopper';
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\d+/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'Verified Shopper';
}

function maskName(name: string): string {
  const parts = (name || 'VIP Shopper').trim().split(/\s+/);
  return parts
    .map((p) => (p.length <= 2 ? `${p[0] || ''}*` : `${p.slice(0, 2)}${'•'.repeat(Math.min(4, p.length - 2))}`))
    .join(' ');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorKey = (
      searchParams.get('vendorId') ||
      searchParams.get('email') ||
      request.headers.get('x-vendor-id') ||
      ''
    ).trim();

    if (!vendorKey || vendorKey === 'all' || vendorKey === 'undefined' || vendorKey === 'null') {
      return NextResponse.json({ success: false, error: 'Vendor authentication required.' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    const adminClient = createAdminClient();
    const billing = await fetchLivePlatformBillingConfig();

    // 1. Resolve vendor record
    const { data: vRows } = await adminClient
      .from('vendors')
      .select('*')
      .or(`id.eq.${vendorKey},email.eq.${vendorKey.toLowerCase()}`)
      .order('created_at', { ascending: false })
      .limit(3);

    const vendor = (vRows || []).find((v: any) => v.id === vendorKey) || vRows?.[0] || null;
    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor account not found.' }, { status: 404, headers: NO_STORE_HEADERS });
    }

    const bioObj = parseBioJson(vendor.bio);
    const isPlus = isVendorPlusActive(bioObj, billing);
    const nowMs = Date.now();
    const hasPaidPlus =
      bioObj?.plusLifetimeFree === true ||
      (bioObj?.subscriptionPlan === 'plus' &&
        (!bioObj?.plusExpiresAt || new Date(bioObj.plusExpiresAt).getTime() > nowMs));

    const targetIdNorm = normKey(vendor.id);
    const targetNameNorm = normKey(vendor.brand_name);
    const vendorKeysNorm = new Set([targetIdNorm, targetNameNorm].filter(Boolean));

    const matchesThisVendor = (candidate?: string | null) => {
      const cNorm = normKey(candidate);
      if (!cNorm) return false;
      for (const k of vendorKeysNorm) {
        if (cNorm === k || (k.length >= 4 && (cNorm.includes(k) || k.includes(cNorm)))) {
          return true;
        }
      }
      return false;
    };

    // 2. Fetch Followers, Orders, Stories, Story Engagements, and Reviews in parallel
    const [
      followNotifsRes,
      followTableRes,
      ordersRes,
      storiesRes,
      engageRes,
      reviewsRes,
    ] = await Promise.all([
      adminClient
        .from('notifications')
        .select('id, title, message, created_at')
        .eq('type', 'vendor_follow')
        .order('created_at', { ascending: false })
        .limit(400),
      Promise.resolve(
        adminClient
          .from('vendor_followers')
          .select('vendor_id, shopper_email, created_at')
          .limit(400)
      ).catch(() => ({ data: [] as any[] })),
      adminClient
        .from('orders')
        .select('id, order_number, customer_name, customer_email, customer_phone, delivery_city, status, created_at, customer_measurements, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(300),
      adminClient
        .from('notifications')
        .select('id, title, message, created_at')
        .eq('type', 'vendor_story')
        .order('created_at', { ascending: false })
        .limit(150),
      adminClient
        .from('notifications')
        .select('id, title, message, created_at')
        .eq('type', 'story_engagement')
        .limit(300),
      Promise.resolve(
        adminClient
          .from('reviews')
          .select('id, product_id, vendor_id, customer_name, customer_email, rating, comment, created_at')
          .order('created_at', { ascending: false })
          .limit(100)
      ).catch(() => ({ data: [] as any[] })),
    ]);

    // 3. Aggregate Followers
    const followerMap = new Map<string, { email: string; followedAt: string }>();
    for (const row of followNotifsRes.data || []) {
      const rawKey = String(row.title || '').replace(/^FOLLOW:/i, '').trim();
      const email = String(row.message || '').toLowerCase().trim();
      if (!email || !email.includes('@')) continue;
      if (matchesThisVendor(rawKey)) {
        if (!followerMap.has(email)) {
          followerMap.set(email, {
            email,
            followedAt: row.created_at || new Date().toISOString(),
          });
        }
      }
    }
    for (const row of (followTableRes as any)?.data || []) {
      const email = String(row.shopper_email || '').toLowerCase().trim();
      if (!email || !email.includes('@')) continue;
      if (matchesThisVendor(row.vendor_id)) {
        if (!followerMap.has(email)) {
          followerMap.set(email, {
            email,
            followedAt: row.created_at || new Date().toISOString(),
          });
        }
      }
    }

    // 4. Aggregate Buyers & Top VIP Customers strictly for this vendor
    interface BuyerAgg {
      key: string;
      name: string;
      email: string;
      phone: string;
      city: string;
      ordersCount: number;
      itemsBought: number;
      totalSpent: number;
      lastOrderDate: string;
      isFollower: boolean;
      favoritePieces: string[];
    }
    const buyerMap = new Map<string, BuyerAgg>();

    for (const ord of ordersRes.data || []) {
      if ((ord as any).status === 'cancelled' || (ord as any).status === 'disputed') continue;
      const meas = (ord as any).customer_measurements || {};
      const rawItems =
        Array.isArray((ord as any).order_items) && (ord as any).order_items.length > 0
          ? (ord as any).order_items
          : Array.isArray(meas.items)
          ? meas.items
          : [];

      const matchingItems = rawItems.filter((it: any) =>
        matchesThisVendor(it.vendor_id || it.vendorId) || matchesThisVendor(it.vendorName || it.vendor_name)
      );
      if (matchingItems.length === 0) continue;

      const email = String((ord as any).customer_email || '').toLowerCase().trim();
      const phone = String((ord as any).customer_phone || '').trim();
      const name = String((ord as any).customer_name || (email ? prettyNameFromEmail(email) : 'Shopper')).trim();
      const city = String((ord as any).delivery_city || meas.deliveryCity || '').trim();
      const key = email || phone.replace(/\D/g, '') || name.toLowerCase();

      const orderSpend = matchingItems.reduce(
        (sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
        0
      );
      const orderQty = matchingItems.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0);
      const pieceNames: string[] = matchingItems
        .map((it: any) => String(it.product_name || it.productName || it.name || '').trim())
        .filter((s: string) => Boolean(s));

      const existing = buyerMap.get(key);
      if (!existing) {
        buyerMap.set(key, {
          key,
          name,
          email,
          phone,
          city,
          ordersCount: 1,
          itemsBought: orderQty,
          totalSpent: orderSpend,
          lastOrderDate: (ord as any).created_at || new Date().toISOString(),
          isFollower: Boolean(email && followerMap.has(email)),
          favoritePieces: Array.from(new Set<string>(pieceNames)).slice(0, 3),
        });
      } else {
        existing.ordersCount += 1;
        existing.itemsBought += orderQty;
        existing.totalSpent += orderSpend;
        if (!existing.name || existing.name === 'Shopper') existing.name = name;
        if (!existing.phone && phone) existing.phone = phone;
        if (!existing.city && city) existing.city = city;
        if (new Date((ord as any).created_at || 0).getTime() > new Date(existing.lastOrderDate).getTime()) {
          existing.lastOrderDate = (ord as any).created_at;
        }
        existing.favoritePieces = Array.from(new Set<string>([...existing.favoritePieces, ...pieceNames])).slice(0, 3);
      }
    }

    const topBuyersFull = Array.from(buyerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent || b.ordersCount - a.ordersCount)
      .map((b, idx) => ({ ...b, rank: idx + 1 }));

    // Enrich Followers with purchase telemetry
    const buyerByEmail = new Map<string, BuyerAgg>();
    topBuyersFull.forEach((b) => {
      if (b.email) buyerByEmail.set(b.email, b);
    });

    const followersFull = Array.from(followerMap.values())
      .map((f) => {
        const buyer = buyerByEmail.get(f.email);
        return {
          email: f.email,
          name: buyer?.name || prettyNameFromEmail(f.email),
          followedAt: f.followedAt,
          hasPurchased: Boolean(buyer),
          ordersCount: buyer?.ordersCount || 0,
          totalSpent: buyer?.totalSpent || 0,
          city: buyer?.city || '',
          phone: buyer?.phone || '',
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent || new Date(b.followedAt).getTime() - new Date(a.followedAt).getTime());

    // 5. Aggregate Story Views, Story Reactions, Reviews & Follow Events into an Interactions Feed
    const myStoryIds = new Map<string, { caption: string; mediaUrl: string; createdAt: string }>();
    for (const sRow of storiesRes.data || []) {
      try {
        const parsed = JSON.parse(sRow.message || '{}');
        if (
          matchesThisVendor(parsed.vendorId) ||
          matchesThisVendor(parsed.vendorSlug) ||
          matchesThisVendor(parsed.vendorName)
        ) {
          myStoryIds.set(sRow.id, {
            caption: parsed.caption || 'Lookbook Story',
            mediaUrl: parsed.mediaUrl || '',
            createdAt: parsed.createdAt || sRow.created_at,
          });
        }
      } catch {}
    }

    let storyViewsTotal = 0;
    let storyReactionsTotal = 0;
    const interactionsFull: Array<{
      id: string;
      type: 'reaction' | 'story_view' | 'follow' | 'review';
      actorName: string;
      detail: string;
      emoji?: string;
      rating?: number;
      timestamp: string;
    }> = [];

    for (const er of engageRes.data || []) {
      const sId = String(er.title || '').replace(/^ENGAGE:/i, '').trim();
      const storyMeta = myStoryIds.get(sId);
      if (!storyMeta) continue;
      try {
        const parsed = JSON.parse(er.message || '{}');
        const viewersObj: Record<string, { name?: string; viewedAt?: string }> = parsed.viewers || {};
        const reactionsObj: Record<string, { name?: string; emoji?: string; reactedAt?: string }> = parsed.reactions || {};

        storyViewsTotal += Math.max(Object.keys(viewersObj).length, Object.keys(reactionsObj).length);
        for (const [k, rx] of Object.entries(reactionsObj)) {
          if (rx?.emoji) {
            storyReactionsTotal += 1;
            interactionsFull.push({
              id: `rx-${sId}-${k}`,
              type: 'reaction',
              actorName: rx.name || 'Shopper',
              detail: `Reacted ${rx.emoji} to your story "${storyMeta.caption.slice(0, 42)}"`,
              emoji: rx.emoji,
              timestamp: rx.reactedAt || er.created_at || new Date().toISOString(),
            });
          }
        }
        for (const [k, v] of Object.entries(viewersObj)) {
          if (!reactionsObj[k]) {
            interactionsFull.push({
              id: `vw-${sId}-${k}`,
              type: 'story_view',
              actorName: v?.name || 'Shopper',
              detail: `Viewed your story "${storyMeta.caption.slice(0, 42)}"`,
              timestamp: v?.viewedAt || er.created_at || new Date().toISOString(),
            });
          }
        }
      } catch {}
    }

    // Add recent follows to interactions timeline
    followersFull.slice(0, 20).forEach((f, idx) => {
      interactionsFull.push({
        id: `fl-${idx}-${f.email}`,
        type: 'follow',
        actorName: f.name,
        detail: f.hasPurchased ? 'Started following your brand (Verified Buyer)' : 'Started following your brand',
        timestamp: f.followedAt,
      });
    });

    // Add verified reviews to interactions timeline
    for (const rev of (reviewsRes as any)?.data || []) {
      if (matchesThisVendor(rev.vendor_id)) {
        interactionsFull.push({
          id: `rv-${rev.id}`,
          type: 'review',
          actorName: rev.customer_name || 'Verified Buyer',
          detail: rev.comment ? `"${String(rev.comment).slice(0, 90)}"` : `Left a ${rev.rating || 5}★ rating`,
          rating: Number(rev.rating || 5),
          timestamp: rev.created_at || new Date().toISOString(),
        });
      }
    }

    interactionsFull.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const totalFollowers = followersFull.length;
    const totalUniqueBuyers = topBuyersFull.length;
    const repeatBuyersCount = topBuyersFull.filter((b) => b.ordersCount >= 2).length;
    const followersWhoBought = followersFull.filter((f) => f.hasPurchased).length;
    const followerConversionPercent =
      totalFollowers > 0 ? Math.round((followersWhoBought / totalFollowers) * 100) : 0;

    const isLockedByPlan = !isPlus;

    return NextResponse.json(
      {
        success: true,
        plan: {
          isPlus,
          hasPaidPlus,
          freeLaunchMode: billing.freeLaunchMode,
          plusMonthlyPriceNgn: billing.plusMonthlyPriceNgn,
          isLockedByPlan,
        },
        summary: {
          totalFollowers,
          totalUniqueBuyers,
          repeatBuyersCount,
          followersWhoBought,
          followerConversionPercent,
          storyViewsTotal,
          storyReactionsTotal,
          activeStoriesCount: myStoryIds.size,
        },
        // On Free plan (after launch trial), return real counts + anonymized teasers to inspire Plus upgrade
        topBuyers: isLockedByPlan
          ? topBuyersFull.slice(0, 3).map((b) => ({
              ...b,
              name: maskName(b.name),
              email: '',
              phone: '',
            }))
          : topBuyersFull.slice(0, 50),
        followers: isLockedByPlan
          ? followersFull.slice(0, 3).map((f) => ({
              ...f,
              name: maskName(f.name),
              email: '••••••@••••.com',
              phone: '',
            }))
          : followersFull.slice(0, 100),
        interactions: isLockedByPlan
          ? interactionsFull.slice(0, 3).map((i) => ({
              ...i,
              actorName: maskName(i.actorName),
            }))
          : interactionsFull.slice(0, 60),
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error('Vendor audience API error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load audience insights' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
