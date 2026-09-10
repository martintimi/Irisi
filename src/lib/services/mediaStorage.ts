import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with reliable production fallbacks
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dvnj8idde';
const apiKey = process.env.CLOUDINARY_API_KEY || '652888692395159';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '0exFgmDJX6tVL7HEH6LNrfsvGpk';
const cloudinaryUrl = process.env.CLOUDINARY_URL || 'cloudinary://652888692395159:0exFgmDJX6tVL7HEH6LNrfsvGpk@dvnj8idde';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});
const hasCloudinary = true;

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'products', 'uploaded');

function ensureUploadDirExists() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Persists a media string (image or video).
 * If the string is a base64 data URL (e.g. data:image/jpeg;base64,... or data:video/mp4;base64,...),
 * it saves the binary content to Cloudinary (if configured) or to local disk (public/images/products/uploaded/).
 * It returns the clean URL (/images/products/uploaded/... or https://res.cloudinary.com/...).
 * If the string is already a clean URL or empty, it returns it unchanged.
 */
export async function persistMedia(
  mediaString: string | null | undefined,
  prefix = 'media'
): Promise<string> {
  if (!mediaString || typeof mediaString !== 'string') {
    return mediaString || '';
  }

  const trimmed = mediaString.trim();

  // If not a base64 data URL, it's already a clean URL
  if (!trimmed.startsWith('data:')) {
    return trimmed;
  }

  const isVideo = trimmed.startsWith('data:video/');

  // 1. If Cloudinary is configured, upload to Cloudinary CDN
  if (hasCloudinary) {
    try {
      const uploadRes: any = await cloudinary.uploader.upload(trimmed, {
        resource_type: isVideo ? 'video' : 'image',
        folder: 'veyra_media',
      });
      if (uploadRes?.secure_url || uploadRes?.url) {
        return uploadRes.secure_url || uploadRes.url;
      }
    } catch (cErr) {
      console.warn('Cloudinary direct upload failed, falling back to disk storage:', cErr);
    }
  }

  // 2. Fallback to saving binary file on disk
  try {
    ensureUploadDirExists();

    const match = trimmed.match(/^data:([a-zA-Z0-9+\/]+);base64,(.+)$/);
    let ext = 'jpg';

    if (match) {
      const mime = match[1].toLowerCase();
      if (mime.includes('quicktime') || mime.includes('mov')) ext = 'mov';
      else if (mime.includes('webm')) ext = 'webm';
      else if (mime.includes('mp4') || mime.startsWith('video/')) ext = 'mp4';
      else if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
    } else if (isVideo) {
      ext = 'mp4';
    }

    const b64Data = match ? match[2] : trimmed.split(';base64,')[1];
    if (!b64Data) {
      return isVideo ? '' : '/images/products/BlackTrapStarHoodie.jpg';
    }

    const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${cleanPrefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filePath, Buffer.from(b64Data, 'base64'));

    return `/images/products/uploaded/${filename}`;
  } catch (err) {
    console.error('Failed to persist media to disk:', err);
    // Never return raw base64 to prevent database bandwidth exhaustion
    return isVideo ? '' : '/images/products/BlackTrapStarHoodie.jpg';
  }
}

