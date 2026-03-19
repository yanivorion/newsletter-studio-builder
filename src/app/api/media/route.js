import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-client';
import { processAndUploadImage } from '@/lib/image-pipeline';

const BUCKET = 'newsletter-images';
const FOLDER = 'my-files';

/**
 * GET /api/media?userId=...
 * List all files in a user's media library.
 * Public — anyone with the userId can browse (for shared media).
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const folderPath = `${userId}/${FOLDER}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(folderPath, {
        limit: 200,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) throw error;

    const files = (data || [])
      .filter((f) => f.name && !f.name.startsWith('.'))
      .map((f) => {
        const filePath = `${folderPath}/${f.name}`;
        const { data: urlData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(filePath);
        return {
          id: f.id,
          name: f.name,
          url: urlData.publicUrl,
          path: filePath,
          size: f.metadata?.size || 0,
          contentType: f.metadata?.mimetype || '',
          createdAt: f.created_at,
        };
      });

    return NextResponse.json({ files });
  } catch (error) {
    console.error('List media error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/media
 * Upload a file to the user's media library.
 * Accepts multipart/form-data with: file, userId
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');

    if (!file || !userId) {
      return NextResponse.json({ error: 'file and userId required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name || `upload-${Date.now()}`;
    const isGif = originalName.endsWith('.gif') || file.type === 'image/gif';
    const isSvg = originalName.endsWith('.svg') || file.type === 'image/svg+xml';

    const supabase = getSupabaseAdmin();
    const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = `${userId}/${FOLDER}/${safeName}`;

    if (isGif || isSvg) {
      const contentType = isGif ? 'image/gif' : 'image/svg+xml';
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, buffer, {
          contentType,
          cacheControl: '31536000',
          upsert: true,
        });
      if (error) throw new Error(error.message);
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      return NextResponse.json({
        file: {
          name: safeName,
          url: urlData.publicUrl,
          path: filePath,
          size: buffer.length,
        },
      });
    }

    const ext = originalName.split('.').pop()?.toLowerCase();
    const format = ext === 'png' ? 'png' : ext === 'webp' ? 'webp' : 'jpeg';

    const result = await processAndUploadImage(buffer, {
      userId,
      folder: FOLDER,
      filename: safeName,
      format,
    });

    return NextResponse.json({
      file: {
        name: safeName,
        url: result.url,
        path: result.path,
        size: result.size,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error) {
    console.error('Upload media error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/media?path=...&userId=...
 * Delete a file from the user's media library.
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    const userId = searchParams.get('userId');

    if (!filePath || !userId) {
      return NextResponse.json({ error: 'path and userId required' }, { status: 400 });
    }

    if (!filePath.startsWith(`${userId}/`)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete media error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
