// Lightweight SWR in-memory + sessionStorage cache for 24h Brand Stories
// Eliminates the visible pop-in delay when entering /shop.

import { VendorStory } from '@/types';

const STORAGE_KEY = 'irisi_stories_cache_v1';
const CACHE_TTL_MS = 90_000;

let memStories: VendorStory[] | null = null;
let memFetchedAt = 0;
let inflightPromise: Promise<VendorStory[]> | null = null;

function readSessionCache(): { stories: VendorStory[]; fetchedAt: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.stories)) {
      return {
        stories: parsed.stories,
        fetchedAt: Number(parsed.fetchedAt || 0),
      };
    }
  } catch {}
  return null;
}

export function getCachedStories(): VendorStory[] | null {
  if (memStories !== null) return memStories;
  const sess = readSessionCache();
  if (sess) {
    memStories = sess.stories;
    memFetchedAt = sess.fetchedAt;
    return sess.stories;
  }
  return null;
}

export function setCachedStories(stories: VendorStory[]): void {
  memStories = stories;
  memFetchedAt = Date.now();
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ stories, fetchedAt: memFetchedAt })
      );
    } catch {}
  }
}

export function prefetchStories(force = false): Promise<VendorStory[]> {
  const existing = getCachedStories();
  if (!force && existing !== null && Date.now() - memFetchedAt < CACHE_TTL_MS) {
    return Promise.resolve(existing);
  }
  if (inflightPromise) return inflightPromise;

  inflightPromise = fetch('/api/stories', { cache: 'no-store' })
    .then((res) => res.json())
    .then((data) => {
      const list = data?.success && Array.isArray(data.stories) ? (data.stories as VendorStory[]) : [];
      setCachedStories(list);
      return list;
    })
    .catch(() => existing || [])
    .finally(() => {
      inflightPromise = null;
    });

  return inflightPromise;
}
