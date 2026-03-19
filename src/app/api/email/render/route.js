import { NextResponse } from 'next/server';
import { renderNewsletter, renderPreview } from '@/lib/mjml-renderer';

/**
 * POST /api/email/render
 * Converts newsletter JSON → email-safe HTML via MJML
 */
export async function POST(request) {
  try {
    const { newsletter, options = {} } = await request.json();

    if (!newsletter || !newsletter.sections) {
      return NextResponse.json(
        { error: 'Invalid newsletter data: sections required' },
        { status: 400 }
      );
    }

    const isPreview = options.preview === true;
    const result = isPreview
      ? await renderPreview(newsletter)
      : await renderNewsletter(newsletter, {
          unsubscribeUrl: options.unsubscribeUrl,
          previewText: options.previewText,
        });

    return NextResponse.json({
      html: result.html,
      errors: result.errors,
      size: Buffer.byteLength(result.html, 'utf8'),
      sizeKB: Math.round(Buffer.byteLength(result.html, 'utf8') / 1024),
    });
  } catch (error) {
    console.error('Render error:', error);
    return NextResponse.json(
      { error: 'Failed to render email', details: error.message },
      { status: 500 }
    );
  }
}
