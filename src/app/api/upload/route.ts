import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { normalizeVideoBuffer } from '@/lib/utils/videoUtils';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary with reliable production fallbacks
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dvnj8idde';
const apiKey = process.env.CLOUDINARY_API_KEY || '652888692395159';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '0exFgmDJX6tVL7HEH6LNrfsvGpk';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});
const hasCloudinary = true;

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    let buffer: any = Buffer.from(bytes);

    const isVideo =
      file.type.startsWith('video/') ||
      /\.(mp4|webm|mov|m4v)$/i.test(file.name || '');

    let mimeType = file.type || (isVideo ? 'video/mp4' : 'image/jpeg');

    if (isVideo) {
      const normalized = normalizeVideoBuffer(buffer, mimeType);
      buffer = normalized.buffer;
      mimeType = normalized.mimeType;
    }

    const shouldTrim = data.get('trim') === 'true';
    const rawFolder = String(data.get('folder') || 'veyra_drops').replace(/[^a-z0-9_-]/gi, '') || 'veyra_drops';
    const isStoryUpload = rawFolder === 'irisi_stories';
    const maxDurationParam = Number(data.get('maxDuration') || (isStoryUpload ? 30 : shouldTrim ? 10 : 0));

    // 1. Cloudinary Upload (Direct high-speed CDN image & compressed video streaming)
    if (hasCloudinary) {
      const uploadResult: any = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: isVideo ? 'video' : 'image',
            folder: rawFolder,
            ...(isVideo
              ? {
                  // Compress story videos to sleek 720p vertical H.264 to save bandwidth & storage quota
                  eager: [
                    isStoryUpload
                      ? { format: 'mp4', width: 720, crop: 'limit', quality: 'auto:good', video_codec: 'auto' }
                      : { format: 'mp4', quality: 'auto' },
                  ],
                  eager_async: true,
                }
              : isStoryUpload
              ? {
                  quality: 'auto:good',
                  fetch_format: 'auto',
                }
              : {}),
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      let finalUrl = uploadResult.secure_url || uploadResult.url;
      if (isVideo && finalUrl && finalUrl.includes('/upload/')) {
        if (isStoryUpload) {
          const cap = maxDurationParam > 0 ? Math.min(30, maxDurationParam) : 30;
          finalUrl = finalUrl.replace('/upload/', `/upload/so_0,eo_${cap},w_720,c_limit,q_auto:good/`);
        } else if (shouldTrim) {
          finalUrl = finalUrl.replace('/upload/', '/upload/so_0,eo_10/');
        }
      }

      return NextResponse.json({
        success: true,
        url: finalUrl,
        publicId: uploadResult.public_id,
        resourceType: isVideo ? 'video' : 'image',
        duration: typeof uploadResult.duration === 'number' ? Math.round(uploadResult.duration) : undefined,
        fileName: file.name,
        fileSize: file.size,
      });
    }

    // 2. Fallback: Save binary file to local disk
    const rawExt = file.name ? path.extname(file.name).replace('.', '') : '';
    const ext = rawExt || (isVideo ? 'mp4' : mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg');
    const safeName = `upload-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'images', 'products', 'uploaded');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    fs.writeFileSync(path.join(uploadDir, safeName), buffer);
    const finalUrl = `/images/products/uploaded/${safeName}`;

    return NextResponse.json({
      success: true,
      url: finalUrl,
      resourceType: isVideo ? 'video' : 'image',
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error('Upload error in /api/upload:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
