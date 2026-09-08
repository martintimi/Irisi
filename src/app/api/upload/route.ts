import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { normalizeVideoBuffer } from '@/lib/utils/videoUtils';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary if environment variables are set (individual keys or CLOUDINARY_URL)
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const hasCloudinary = !!(
  (cloudName && apiKey && apiSecret) ||
  process.env.CLOUDINARY_URL
);

if (hasCloudinary) {
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  } else if (process.env.CLOUDINARY_URL) {
    cloudinary.config(true);
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read bytes
    const bytes = await file.arrayBuffer();
    let buffer: any = Buffer.from(bytes);

    const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm') || file.name.endsWith('.mov');

    let mimeType = file.type || (isVideo ? 'video/mp4' : 'image/jpeg');

    if (isVideo) {
      const normalized = normalizeVideoBuffer(buffer, mimeType);
      buffer = normalized.buffer;
      mimeType = normalized.mimeType;
    }

    const shouldTrim = data.get('trim') === 'true';

    // 1. Cloudinary Upload (Direct high-speed CDN video streaming)
    if (hasCloudinary) {
      const uploadResult: any = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: isVideo ? 'video' : 'image',
            folder: 'veyra_drops',
            ...(isVideo ? { eager: [{ format: 'mp4', quality: 'auto' }] } : {}),
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      let finalUrl = uploadResult.secure_url || uploadResult.url;
      if (isVideo && shouldTrim && finalUrl && finalUrl.includes('/upload/')) {
        finalUrl = finalUrl.replace('/upload/', '/upload/so_0,eo_5/');
      }

      return NextResponse.json({
        success: true,
        url: finalUrl,
        publicId: uploadResult.public_id,
        fileName: file.name,
        fileSize: file.size,
      });
    }

    // 2. Fallback: Save binary file to local disk (public/images/products/uploaded)
    // Never return base64 strings to prevent database egress exhaustion
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
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error('Upload error in /api/upload:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
