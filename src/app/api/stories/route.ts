import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchLivePlatformBillingConfig } from '@/lib/config/platformBillingServer';
import { isVendorPlusActive } from '@/lib/config/platformBilling';
import { sendNewDropNotificationEmail } from '@/lib/services/emailService';
import { deleteCloudinaryAsset } from '@/lib/services/cloudinaryCleanup';
import { getBaseUrl } from '@/lib/utils/url';
import { StoryTextOverlay, VendorStory } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const STORY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours auto-expiry window
const MAX_SLIDES_PER_DROP = 5;

// Rate-limit follower story email blasts per vendor (max once per 6 hours)
const lastStoryBlastByVendor = new Map<string, number>();

function sanitizeOverlays(raw: any): StoryTextOverlay[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 6)
    .map((ov: any, idx: number) => ({
      id: String(ov?.id || `txt-${idx}`),
      text: String(ov?.text || '').trim().slice(0, 140),
      x: Math.max(8, Math.min(92, Number(ov?.x ?? 50))),
      y: Math.max(12, Math.min(82, Number(ov?.y ?? 50))),
      fontStyle: (ov?.fontStyle === 'editorial' || ov?.fontStyle === 'mono' ? ov.fontStyle : 'sans') as 'editorial' | 'sans' | 'mono',
      color: typeof ov?.color === 'string' && ov.color.startsWith('#') ? ov.color : '#ffffff',
      bgStyle: (['none', 'dark', 'light', 'gold'].includes(ov?.bgStyle) ? ov.bgStyle : 'dark') as 'none' | 'dark' | 'light' | 'gold',
      size: (['sm', 'md', 'lg'].includes(ov?.size) ? ov.size : 'md') as 'sm' | 'md' | 'lg',
    }))
    .filter((ov) => ov.text.length > 0);
}

// GET /api/stories?vendorId=...
// Automatically purges stories older than 24h from BOTH Supabase and Cloudinary!
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorFilter = (searchParams.get('vendorId') || searchParams.get('vendorSlug') || '').toLowerCase().trim();

    const adminClient = createAdminClient();
    const [{ data: rows, error }, { data: engageRows }] = await Promise.all([
      adminClient
        .from('notifications')
        .select('id, title, message, created_at')
        .eq('type', 'vendor_story')
        .order('created_at', { ascending: false })
        .limit(200),
      adminClient
        .from('notifications')
        .select('id, title, message')
        .eq('type', 'story_engagement')
        .limit(300),
    ]);

    if (error) {
      console.error('Error loading stories from Supabase:', error);
      return NextResponse.json({ success: true, stories: [] });
    }

    // Build engagement map by storyId
    const engagementByStory = new Map<
      string,
      {
        rowId: string;
        viewCount: number;
        reactions: Record<string, number>;
        totalReactions: number;
        recentInteractions: Array<{ viewerName: string; emoji?: string; viewedAt: string }>;
      }
    >();

    for (const er of engageRows || []) {
      const sId = (er.title || '').replace(/^ENGAGE:/i, '').trim();
      if (!sId) continue;
      try {
        const parsed = JSON.parse(er.message || '{}');
        const viewersObj: Record<string, { name?: string; viewedAt?: string }> = parsed.viewers || {};
        const reactionsObj: Record<string, { name?: string; emoji?: string; reactedAt?: string }> = parsed.reactions || {};

        const reactionCounts: Record<string, number> = {};
        let totalReactions = 0;
        for (const r of Object.values(reactionsObj)) {
          if (r?.emoji) {
            reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
            totalReactions += 1;
          }
        }

        const mergedList: Array<{ viewerName: string; emoji?: string; viewedAt: string }> = [];
        for (const [k, v] of Object.entries(viewersObj)) {
          const rx = reactionsObj[k];
          mergedList.push({
            viewerName: rx?.name || v?.name || 'Shopper',
            emoji: rx?.emoji,
            viewedAt: rx?.reactedAt || v?.viewedAt || new Date().toISOString(),
          });
        }
        // Include reactors who somehow weren't in viewers map
        for (const [k, rx] of Object.entries(reactionsObj)) {
          if (!viewersObj[k] && rx?.emoji) {
            mergedList.push({
              viewerName: rx.name || 'Shopper',
              emoji: rx.emoji,
              viewedAt: rx.reactedAt || new Date().toISOString(),
            });
          }
        }

        mergedList.sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());

        engagementByStory.set(sId, {
          rowId: er.id,
          viewCount: Math.max(Object.keys(viewersObj).length, Object.keys(reactionsObj).length),
          reactions: reactionCounts,
          totalReactions,
          recentInteractions: mergedList.slice(0, 30),
        });
      } catch {}
    }

    const now = Date.now();
    const stories: VendorStory[] = [];
    const expiredCleanupTasks: Promise<any>[] = [];

    for (const row of rows || []) {
      try {
        const parsed = JSON.parse(row.message);
        const createdAt = parsed.createdAt || row.created_at;
        // Enforce 24h max lifespan even on older stories created during 48h window
        const createdMs = new Date(createdAt).getTime();
        const computedExpiryMs = Math.min(
          parsed.expiresAt ? new Date(parsed.expiresAt).getTime() : createdMs + STORY_TTL_MS,
          createdMs + STORY_TTL_MS
        );
        const expiresAt = new Date(computedExpiryMs).toISOString();

        if (computedExpiryMs <= now) {
          // AUTO-DELETE EXPIRED STORY FROM CLOUDINARY + SUPABASE
          expiredCleanupTasks.push(
            (async () => {
              await deleteCloudinaryAsset({
                publicId: parsed.mediaPublicId,
                mediaUrl: parsed.mediaUrl,
                mediaType: parsed.mediaType === 'video' ? 'video' : 'image',
              });
              await adminClient.from('notifications').delete().eq('id', row.id).eq('type', 'vendor_story');
              const eng = engagementByStory.get(row.id);
              if (eng?.rowId) {
                await adminClient.from('notifications').delete().eq('id', eng.rowId).eq('type', 'story_engagement');
              }
            })().catch(() => {})
          );
          continue;
        }

        const eng = engagementByStory.get(row.id);
        const story: VendorStory = {
          id: row.id,
          vendorId: parsed.vendorId || '',
          vendorSlug: parsed.vendorSlug || parsed.vendorId || '',
          vendorName: parsed.vendorName || 'Verified Brand',
          vendorAvatar: parsed.vendorAvatar || parsed.mediaUrl || '',
          mediaUrl: parsed.mediaUrl || '',
          mediaPublicId: parsed.mediaPublicId || undefined,
          mediaType: parsed.mediaType === 'video' ? 'video' : 'image',
          durationSec: parsed.durationSec ? Math.min(30, Number(parsed.durationSec)) : undefined,
          caption: parsed.caption || '',
          textOverlays: sanitizeOverlays(parsed.textOverlays),
          taggedProductId: parsed.taggedProductId || undefined,
          taggedProductName: parsed.taggedProductName || undefined,
          taggedProductPrice: parsed.taggedProductPrice ? Number(parsed.taggedProductPrice) : undefined,
          taggedProductImage: parsed.taggedProductImage || undefined,
          createdAt,
          expiresAt,
          viewCount: eng?.viewCount || 0,
          reactions: eng?.reactions || {},
          totalReactions: eng?.totalReactions || 0,
          recentInteractions: eng?.recentInteractions || [],
        };

        if (!story.mediaUrl) continue;

        if (vendorFilter) {
          const vId = (story.vendorId || '').toLowerCase();
          const vSlug = (story.vendorSlug || '').toLowerCase();
          const vNameSlug = (story.vendorName || '').toLowerCase().replace(/\s+/g, '-');
          if (vId !== vendorFilter && vSlug !== vendorFilter && vNameSlug !== vendorFilter) {
            continue;
          }
        }

        stories.push(story);
      } catch {}
    }

    // Await automatic 24h Cloudinary + DB purge (capped to avoid slow reads)
    if (expiredCleanupTasks.length > 0) {
      await Promise.allSettled(expiredCleanupTasks.slice(0, 12));
    }

    return NextResponse.json(
      { success: true, stories },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: any) {
    console.error('GET /api/stories error:', err);
    return NextResponse.json({ success: false, stories: [], error: err?.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/stories — Publish single or multi-slide 24h story & send LIVE follower notifications
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      vendorId,
      vendorEmail,
      vendorName,
      vendorAvatar,
      notifyFollowers = true,
      slides,
    } = body;

    // Support both single slide payload and batch multi-slide payload
    const rawSlides: any[] =
      Array.isArray(slides) && slides.length > 0
        ? slides.slice(0, MAX_SLIDES_PER_DROP)
        : [
            {
              mediaUrl: body.mediaUrl,
              mediaPublicId: body.mediaPublicId,
              mediaType: body.mediaType,
              durationSec: body.durationSec,
              caption: body.caption,
              textOverlays: body.textOverlays,
              taggedProductId: body.taggedProductId,
              taggedProductName: body.taggedProductName,
              taggedProductPrice: body.taggedProductPrice,
              taggedProductImage: body.taggedProductImage,
            },
          ];

    const validSlides = rawSlides.filter((s) => s && typeof s.mediaUrl === 'string' && s.mediaUrl.trim().length > 0);
    if (validSlides.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one story photo or video is required.' }, { status: 400 });
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
          error: `Lookbook Stories & Follower Drop Alerts are part of ÌRÍSÍ Plus (₦${billing.plusMonthlyPriceNgn.toLocaleString()}/month). Upgrade in Plan & Fees to publish live stories.`,
        },
        { status: 403 }
      );
    }

    const resolvedVendorId =
      vendorRow?.id || (vendorName || lookupKey || 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const resolvedBrandName = vendorRow?.brand_name || vendorName || 'Verified Brand';
    const resolvedAvatar = bioObj.logoUrl || bioObj.logo || vendorAvatar || validSlides[0].mediaUrl;

    const nowMs = Date.now();
    const expiresAt = new Date(nowMs + STORY_TTL_MS).toISOString();
    const savedStories: VendorStory[] = [];

    for (let i = 0; i < validSlides.length; i++) {
      const s = validSlides[i];
      const slideCreatedIso = new Date(nowMs + i * 50).toISOString();
      const mediaType: 'image' | 'video' = s.mediaType === 'video' ? 'video' : 'image';
      const overlays = sanitizeOverlays(s.textOverlays);
      const caption = String(s.caption || '').trim().slice(0, 220);

      const storyPayload = {
        vendorId: resolvedVendorId,
        vendorSlug: resolvedVendorId,
        vendorName: resolvedBrandName,
        vendorAvatar: resolvedAvatar,
        mediaUrl: s.mediaUrl,
        mediaPublicId: s.mediaPublicId || undefined,
        mediaType,
        durationSec: s.durationSec ? Math.min(30, Math.max(3, Number(s.durationSec))) : mediaType === 'video' ? 30 : 5,
        caption,
        textOverlays: overlays,
        taggedProductId: s.taggedProductId || undefined,
        taggedProductName: s.taggedProductName || undefined,
        taggedProductPrice: s.taggedProductPrice ? Number(s.taggedProductPrice) : undefined,
        taggedProductImage: s.taggedProductImage || undefined,
        createdAt: slideCreatedIso,
        expiresAt,
      };

      const { data: inserted, error: insertErr } = await adminClient
        .from('notifications')
        .insert({
          title: `STORY:${resolvedVendorId}`,
          message: JSON.stringify(storyPayload),
          type: 'vendor_story',
          read: false,
          action_url: s.taggedProductId
            ? `${getBaseUrl()}/shop/${encodeURIComponent(s.taggedProductId)}`
            : `${getBaseUrl()}/shop?story=${encodeURIComponent(resolvedVendorId)}`,
        })
        .select('id')
        .single();

      if (insertErr) {
        console.error('Failed to persist vendor story slide:', insertErr);
        continue;
      }

      savedStories.push({
        id: inserted.id,
        ...storyPayload,
        viewCount: 0,
        reactions: {},
        totalReactions: 0,
        recentInteractions: [],
      });
    }

    if (savedStories.length === 0) {
      return NextResponse.json({ success: false, error: 'Could not save story slides.' }, { status: 500 });
    }

    // LIVE FOLLOWER NOTIFICATIONS (In-App Bell Alert ALWAYS created + Email blast awaited cleanly!)
    let notifiedCount = 0;
    if (notifyFollowers) {
      try {
        const followerEmails = new Set<string>();
        const resolvedVendorEmail = (vendorRow?.email || vendorEmail || '').toLowerCase().trim();
        const brandSlug = resolvedBrandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const possibleKeys = Array.from(
          new Set([
            resolvedVendorId.toLowerCase(),
            resolvedBrandName.toLowerCase().trim(),
            brandSlug,
            resolvedVendorEmail,
          ])
        ).filter(Boolean);

        // Check vendor_followers table if present
        try {
          const { data: vfRows } = await adminClient
            .from('vendor_followers')
            .select('vendor_id, shopper_email')
            .limit(500);
          for (const vf of vfRows || []) {
            const key = String(vf.vendor_id || '').toLowerCase().trim();
            const keySlug = key.replace(/[^a-z0-9]+/g, '-');
            if ((possibleKeys.includes(key) || possibleKeys.includes(keySlug)) && vf.shopper_email && String(vf.shopper_email).includes('@')) {
              followerEmails.add(String(vf.shopper_email).toLowerCase().trim());
            }
          }
        } catch {}

        const { data: followRows } = await adminClient
          .from('notifications')
          .select('message, title')
          .eq('type', 'vendor_follow')
          .limit(500);

        for (const r of followRows || []) {
          const key = (r.title || '').replace(/^FOLLOW:/i, '').toLowerCase().trim();
          const keySlug = key.replace(/[^a-z0-9]+/g, '-');
          if (
            (possibleKeys.includes(key) || possibleKeys.includes(keySlug)) &&
            r.message &&
            r.message.includes('@')
          ) {
            followerEmails.add(r.message.toLowerCase().trim());
          }
        }

        notifiedCount = followerEmails.size;

        // 1. Persist live in-app follower alert (reaches ALL followers — both logged-in email AND guest localStorage followers!)
        const firstSlide = savedStories[0];
        const alertTitle = `${resolvedBrandName} posted a new story`;
        const alertMessage =
          savedStories.length > 1
            ? `${resolvedBrandName} shared ${savedStories.length} new lookbook slides — watch before they expire in 24h.`
            : firstSlide.caption || `${resolvedBrandName} just dropped a new 24h lookbook story on Shop.`;

        await adminClient.from('notifications').insert({
          title: `ALERT:${resolvedVendorId}`,
          message: JSON.stringify({
            kind: 'vendor_story',
            vendorId: resolvedVendorId,
            vendorSlug: brandSlug || resolvedVendorId,
            vendorName: resolvedBrandName,
            vendorEmail: resolvedVendorEmail || undefined,
            vendorAvatar: resolvedAvatar,
            storyId: firstSlide.id,
            slideCount: savedStories.length,
            title: alertTitle,
            message: alertMessage,
            previewImage: firstSlide.taggedProductImage || firstSlide.mediaUrl,
            targetEmails: Array.from(followerEmails),
            createdAt: new Date().toISOString(),
          }),
          type: 'follower_alert',
          read: false,
          action_url: `/shop?story=${encodeURIComponent(resolvedVendorId)}`,
        });

        // 2. Email blast to followers with verified email (rate-limited to 1 per 6h per vendor, awaited cleanly!)
        const lastBlast = lastStoryBlastByVendor.get(resolvedVendorId) || 0;
        const canEmailBlast = Date.now() - lastBlast > 6 * 60 * 60 * 1000;
        if (canEmailBlast && followerEmails.size > 0) {
          lastStoryBlastByVendor.set(resolvedVendorId, Date.now());
          const recipients = Array.from(followerEmails).slice(0, 40);
          await Promise.allSettled(
            recipients.map((email) =>
              sendNewDropNotificationEmail({
                customerEmail: email,
                vendorName: resolvedBrandName,
                product: {
                  id: firstSlide.taggedProductId || resolvedVendorId,
                  name: firstSlide.taggedProductName || `${resolvedBrandName} — New 24h Story`,
                  price: Number(firstSlide.taggedProductPrice || 0),
                  imageUrl: firstSlide.taggedProductImage || firstSlide.mediaUrl,
                },
              })
            )
          );
        }
      } catch (notifyErr) {
        console.warn('Follower story notification skipped:', notifyErr);
      }
    }

    return NextResponse.json({
      success: true,
      story: savedStories[0],
      stories: savedStories,
      followersNotified: notifiedCount,
    });
  } catch (err: any) {
    console.error('POST /api/stories error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

// DELETE /api/stories?id=...
// Deletes BOTH from Supabase AND permanently destroys the media asset from Cloudinary!
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Story ID required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: existing } = await adminClient
      .from('notifications')
      .select('id, message')
      .eq('id', id)
      .eq('type', 'vendor_story')
      .maybeSingle();

    if (existing?.message) {
      try {
        const parsed = JSON.parse(existing.message);
        await deleteCloudinaryAsset({
          publicId: parsed.mediaPublicId,
          mediaUrl: parsed.mediaUrl,
          mediaType: parsed.mediaType === 'video' ? 'video' : 'image',
        });
      } catch {}
    }

    const { error } = await adminClient
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('type', 'vendor_story');

    // Also remove engagement row for this story
    await adminClient
      .from('notifications')
      .delete()
      .eq('type', 'story_engagement')
      .eq('title', `ENGAGE:${id}`);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, cloudinaryDeleted: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
