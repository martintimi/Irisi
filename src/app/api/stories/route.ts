import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchLivePlatformBillingConfig } from '@/lib/config/platformBillingServer';
import { isVendorPlusActive } from '@/lib/config/platformBilling';
import { sendNewDropNotificationEmail } from '@/lib/services/emailService';
import { getBaseUrl } from '@/lib/utils/url';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const STORY_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours visibility window

// Rate-limit follower story email blasts per vendor (max once per 12 hours)
const lastStoryBlastByVendor = new Map<string, number>();

export interface PersistedVendorStory {
  id: string;
  vendorId: string;
  vendorSlug: string;
  vendorName: string;
  vendorAvatar: string;
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  caption: string;
  taggedProductId?: string;
  taggedProductName?: string;
  taggedProductPrice?: number;
  taggedProductImage?: string;
  createdAt: string;
  expiresAt: string;
}

// GET /api/stories?vendorId=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorFilter = (searchParams.get('vendorId') || searchParams.get('vendorSlug') || '').toLowerCase().trim();
    const includeExpired = searchParams.get('includeExpired') === 'true';

    const adminClient = createAdminClient();
    const { data: rows, error } = await adminClient
      .from('notifications')
      .select('id, title, message, created_at')
      .eq('type', 'vendor_story')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Error loading stories from Supabase:', error);
      return NextResponse.json({ success: true, stories: [] });
    }

    const now = Date.now();
    const stories: PersistedVendorStory[] = [];

    for (const row of rows || []) {
      try {
        const parsed = JSON.parse(row.message);
        const createdAt = parsed.createdAt || row.created_at;
        const expiresAt = parsed.expiresAt || new Date(new Date(createdAt).getTime() + STORY_TTL_MS).toISOString();

        if (!includeExpired && new Date(expiresAt).getTime() <= now) {
          continue;
        }

        const story: PersistedVendorStory = {
          id: row.id,
          vendorId: parsed.vendorId || '',
          vendorSlug: parsed.vendorSlug || parsed.vendorId || '',
          vendorName: parsed.vendorName || 'Verified Brand',
          vendorAvatar: parsed.vendorAvatar || parsed.mediaUrl || '',
          mediaUrl: parsed.mediaUrl || '',
          mediaType: parsed.mediaType === 'video' ? 'video' : 'image',
          caption: parsed.caption || '',
          taggedProductId: parsed.taggedProductId || undefined,
          taggedProductName: parsed.taggedProductName || undefined,
          taggedProductPrice: parsed.taggedProductPrice ? Number(parsed.taggedProductPrice) : undefined,
          taggedProductImage: parsed.taggedProductImage || undefined,
          createdAt,
          expiresAt,
        };

        if (!story.mediaUrl) continue;

        if (vendorFilter) {
          const vId = story.vendorId.toLowerCase();
          const vSlug = story.vendorSlug.toLowerCase();
          const vNameSlug = story.vendorName.toLowerCase().replace(/\s+/g, '-');
          if (vId !== vendorFilter && vSlug !== vendorFilter && vNameSlug !== vendorFilter) {
            continue;
          }
        }

        stories.push(story);
      } catch {}
    }

    return NextResponse.json(
      { success: true, stories },
      { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=15, stale-while-revalidate=30' } }
    );
  } catch (err: any) {
    console.error('GET /api/stories error:', err);
    return NextResponse.json({ success: false, stories: [], error: err?.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/stories — Publish live story & notify followers
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      vendorId,
      vendorEmail,
      vendorName,
      vendorAvatar,
      mediaUrl,
      mediaType = 'image',
      caption,
      taggedProductId,
      taggedProductName,
      taggedProductPrice,
      taggedProductImage,
      notifyFollowers = true,
    } = body;

    if (!mediaUrl || typeof mediaUrl !== 'string') {
      return NextResponse.json({ success: false, error: 'Story media URL is required.' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const billing = await fetchLivePlatformBillingConfig();

    // Resolve vendor row for slug, avatar & Plus check
    const lookupKey = (vendorId || vendorEmail || '').trim();
    let vendorRow: any = null;
    if (lookupKey) {
      if (lookupKey.includes('@')) {
        const { data } = await adminClient
          .from('vendors')
          .select('*')
          .ilike('email', lookupKey.toLowerCase())
          .order('created_at', { ascending: false })
          .limit(1);
        vendorRow = data?.[0] || null;
      } else {
        const { data } = await adminClient.from('vendors').select('*').eq('id', lookupKey).maybeSingle();
        vendorRow = data || null;
      }
    }

    let bioObj: Record<string, any> = {};
    if (vendorRow?.bio && String(vendorRow.bio).trim().startsWith('{')) {
      try {
        bioObj = JSON.parse(vendorRow.bio);
      } catch {}
    }

    // Option B Plus perk: Stories require Plus ONLY after global free launch period is turned OFF
    if (!billing.freeLaunchMode && vendorRow && !isVendorPlusActive(bioObj, billing)) {
      return NextResponse.json(
        {
          success: false,
          requiresPlus: true,
          error: `Lookbook Stories & Follower Drop Alerts are part of ÌRÍSÍ Plus (₦${billing.plusMonthlyPriceNgn.toLocaleString()}/month). Upgrade in Billing to publish live stories.`,
        },
        { status: 403 }
      );
    }

    const resolvedVendorId = vendorRow?.id || (vendorName || lookupKey || 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const resolvedBrandName = vendorRow?.brand_name || vendorName || 'Verified Brand';
    const resolvedAvatar = bioObj.logoUrl || bioObj.logo || vendorAvatar || mediaUrl;

    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + STORY_TTL_MS).toISOString();

    const storyPayload = {
      vendorId: resolvedVendorId,
      vendorSlug: resolvedVendorId,
      vendorName: resolvedBrandName,
      vendorAvatar: resolvedAvatar,
      mediaUrl,
      mediaType: (mediaType === 'video' ? 'video' : 'image') as 'image' | 'video',
      caption: (caption || `New update from ${resolvedBrandName}`).trim().slice(0, 220),
      taggedProductId: taggedProductId || undefined,
      taggedProductName: taggedProductName || undefined,
      taggedProductPrice: taggedProductPrice ? Number(taggedProductPrice) : undefined,
      taggedProductImage: taggedProductImage || undefined,
      createdAt: nowIso,
      expiresAt,
    };

    const { data: inserted, error: insertErr } = await adminClient
      .from('notifications')
      .insert({
        title: `STORY:${resolvedVendorId}`,
        message: JSON.stringify(storyPayload),
        type: 'vendor_story',
        read: false,
        action_url: taggedProductId
          ? `${getBaseUrl()}/shop/${encodeURIComponent(taggedProductId)}`
          : `${getBaseUrl()}/brand/${encodeURIComponent(resolvedVendorId)}`,
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('Failed to persist vendor story:', insertErr);
      return NextResponse.json({ success: false, error: insertErr.message }, { status: 500 });
    }

    const savedStory: PersistedVendorStory = {
      id: inserted.id,
      ...storyPayload,
    };

    // Notify followers (non-blocking, rate-limited to 1 email blast per vendor every 12h)
    let notifiedCount = 0;
    if (notifyFollowers) {
      const lastBlast = lastStoryBlastByVendor.get(resolvedVendorId) || 0;
      const canEmailBlast = Date.now() - lastBlast > 12 * 60 * 60 * 1000;

      try {
        const followerEmails = new Set<string>();
        const possibleKeys = [resolvedVendorId.toLowerCase(), resolvedBrandName.toLowerCase().replace(/\s+/g, '-')];

        const { data: followRows } = await adminClient
          .from('notifications')
          .select('message, title')
          .eq('type', 'vendor_follow')
          .limit(500);

        for (const r of followRows || []) {
          const key = (r.title || '').replace(/^FOLLOW:/i, '').toLowerCase().trim();
          if (possibleKeys.includes(key) && r.message && r.message.includes('@')) {
            followerEmails.add(r.message.toLowerCase().trim());
          }
        }

        notifiedCount = followerEmails.size;

        if (canEmailBlast && followerEmails.size > 0 && taggedProductId && taggedProductName) {
          lastStoryBlastByVendor.set(resolvedVendorId, Date.now());
          const recipients = Array.from(followerEmails).slice(0, 50);
          Promise.allSettled(
            recipients.map((email) =>
              sendNewDropNotificationEmail({
                customerEmail: email,
                vendorName: resolvedBrandName,
                product: {
                  id: taggedProductId,
                  name: taggedProductName,
                  price: Number(taggedProductPrice || 0),
                  imageUrl: taggedProductImage || mediaUrl,
                },
              })
            )
          ).catch(() => {});
        }
      } catch (notifyErr) {
        console.warn('Follower story notification skipped:', notifyErr);
      }
    }

    return NextResponse.json({
      success: true,
      story: savedStory,
      followersNotified: notifiedCount,
    });
  } catch (err: any) {
    console.error('POST /api/stories error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

// DELETE /api/stories?id=...
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Story ID required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('type', 'vendor_story');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
