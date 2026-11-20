import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 20;

const ALLOWED_EMOJIS = new Set(['🔥', '❤️', '😍', '👏', '✨']);

// POST /api/stories/interact — Record deduplicated view or reaction on a 24h story
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      storyId,
      action = 'view', // 'view' | 'react'
      emoji,
      viewerKey,
      viewerName,
    } = body;

    const cleanStoryId = String(storyId || '').trim();
    const cleanViewerKey = String(viewerKey || '').trim().toLowerCase().slice(0, 120);
    if (!cleanStoryId || !cleanViewerKey) {
      return NextResponse.json({ success: false, error: 'storyId and viewerKey are required' }, { status: 400 });
    }

    const cleanName = String(viewerName || (cleanViewerKey.includes('@') ? cleanViewerKey.split('@')[0] : 'Shopper'))
      .trim()
      .slice(0, 60);

    const adminClient = createAdminClient();
    const titleKey = `ENGAGE:${cleanStoryId}`;

    const { data: existingRows } = await adminClient
      .from('notifications')
      .select('id, message')
      .eq('type', 'story_engagement')
      .eq('title', titleKey)
      .limit(1);

    const existingRow = existingRows?.[0] || null;
    let state: {
      viewers: Record<string, { name: string; viewedAt: string }>;
      reactions: Record<string, { name: string; emoji: string; reactedAt: string }>;
    } = { viewers: {}, reactions: {} };

    if (existingRow?.message) {
      try {
        const parsed = JSON.parse(existingRow.message);
        state = {
          viewers: parsed.viewers || {},
          reactions: parsed.reactions || {},
        };
      } catch {}
    }

    const nowIso = new Date().toISOString();

    // Always record viewer when viewing OR reacting
    if (!state.viewers[cleanViewerKey]) {
      state.viewers[cleanViewerKey] = { name: cleanName, viewedAt: nowIso };
    } else if (cleanName && cleanName !== 'Shopper') {
      state.viewers[cleanViewerKey].name = cleanName;
    }

    let viewerReaction: string | null = state.reactions[cleanViewerKey]?.emoji || null;

    if (action === 'react') {
      const cleanEmoji = String(emoji || '').trim();
      if (!ALLOWED_EMOJIS.has(cleanEmoji)) {
        return NextResponse.json({ success: false, error: 'Unsupported reaction emoji' }, { status: 400 });
      }
      // Tapping the same emoji toggles it off; tapping a different one updates it cleanly
      if (state.reactions[cleanViewerKey]?.emoji === cleanEmoji) {
        delete state.reactions[cleanViewerKey];
        viewerReaction = null;
      } else {
        state.reactions[cleanViewerKey] = {
          name: cleanName,
          emoji: cleanEmoji,
          reactedAt: nowIso,
        };
        viewerReaction = cleanEmoji;
      }
    }

    if (existingRow?.id) {
      await adminClient
        .from('notifications')
        .update({ message: JSON.stringify(state) })
        .eq('id', existingRow.id);
    } else {
      await adminClient.from('notifications').insert({
        title: titleKey,
        message: JSON.stringify(state),
        type: 'story_engagement',
        read: false,
      });
    }

    const reactionsCount: Record<string, number> = {};
    let totalReactions = 0;
    for (const r of Object.values(state.reactions)) {
      if (r?.emoji) {
        reactionsCount[r.emoji] = (reactionsCount[r.emoji] || 0) + 1;
        totalReactions += 1;
      }
    }

    return NextResponse.json({
      success: true,
      storyId: cleanStoryId,
      viewCount: Object.keys(state.viewers).length,
      reactions: reactionsCount,
      totalReactions,
      viewerReaction,
    });
  } catch (err: any) {
    console.error('POST /api/stories/interact error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
