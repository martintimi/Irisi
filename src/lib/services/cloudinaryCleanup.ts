import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dvnj8idde';
const apiKey = process.env.CLOUDINARY_API_KEY || '652888692395159';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '0exFgmDJX6tVL7HEH6LNrfsvGpk';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

/**
 * Extracts Cloudinary public_id from a standard Cloudinary delivery URL if publicId wasn't stored directly.
 * Example: https://res.cloudinary.com/dvnj8idde/video/upload/so_0,eo_30/v1732000/irisi_stories/abc123.mp4
 * -> irisi_stories/abc123
 */
export function extractCloudinaryPublicId(url?: string | null): string | null {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    const uploadIdx = parts.indexOf('upload');
    if (uploadIdx === -1) return null;

    let tail = parts.slice(uploadIdx + 1);
    // Drop transformation segments (contain ',' or '_' like so_0,eo_30 or q_auto) and version segments (v12345)
    while (tail.length > 0 && (tail[0].includes(',') || /^v\d+$/.test(tail[0]) || /^(q_|w_|h_|c_|so_|eo_|f_)/.test(tail[0]))) {
      tail = tail.slice(1);
    }
    if (tail.length === 0) return null;
    const joined = tail.join('/');
    // Strip file extension
    return joined.replace(/\.[a-z0-9]{2,5}$/i, '');
  } catch {
    return null;
  }
}

/**
 * Permanently deletes an expired or removed story asset from Cloudinary (image or video).
 */
export async function deleteCloudinaryAsset(params: {
  publicId?: string | null;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video';
}): Promise<{ deleted: boolean; publicId?: string; error?: string }> {
  const publicId = params.publicId || extractCloudinaryPublicId(params.mediaUrl);
  if (!publicId) {
    return { deleted: false, error: 'No Cloudinary publicId found' };
  }

  const isVideo =
    params.mediaType === 'video' ||
    Boolean(params.mediaUrl && (params.mediaUrl.includes('/video/upload/') || /\.(mp4|webm|mov)(\?|$)/i.test(params.mediaUrl)));

  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: isVideo ? 'video' : 'image',
      invalidate: true,
    });
    return { deleted: res?.result === 'ok' || res?.result === 'not found', publicId };
  } catch (err: any) {
    console.warn(`[Cloudinary Cleanup] Failed to delete ${publicId}:`, err?.message);
    return { deleted: false, publicId, error: err?.message };
  }
}
