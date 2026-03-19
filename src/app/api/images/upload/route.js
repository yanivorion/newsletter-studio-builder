import { NextResponse } from 'next/server';
import { processAndUploadImage, base64ToHostedUrl } from '@/lib/image-pipeline';
import { getSupabaseAdmin } from '@/lib/supabase-client';

/**
 * POST /api/images/upload
 * Upload and optimize an image, return hosted URL
 * Accepts: multipart/form-data (file) or JSON (base64)
 */
export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const userId = formData.get('userId') || 'public';
      const folder = formData.get('folder') || 'uploads';

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      // GIF files: upload directly without sharp processing to preserve animation
      const isGif = file.name?.endsWith('.gif') || file.type === 'image/gif';
      if (isGif) {
        const supabase = getSupabaseAdmin();
        const filePath = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.gif`;
        const { error } = await supabase.storage
          .from('newsletter-images')
          .upload(filePath, buffer, {
            contentType: 'image/gif',
            cacheControl: '31536000',
            upsert: true,
          });
        if (error) throw new Error(error.message);
        const { data } = supabase.storage.from('newsletter-images').getPublicUrl(filePath);
        return NextResponse.json({ url: data.publicUrl, size: buffer.length });
      }

      const result = await processAndUploadImage(buffer, {
        userId,
        folder,
        filename: file.name,
      });

      return NextResponse.json(result);
    }

    const { base64, userId = 'public', folder = 'uploads', format } = await request.json();

    if (!base64) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    const result = await base64ToHostedUrl(base64, { userId, folder, format });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process image', details: error.message },
      { status: 500 }
    );
  }
}
