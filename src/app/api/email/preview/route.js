import { NextResponse } from 'next/server';
import { renderPreview } from '@/lib/mjml-renderer';

/**
 * POST /api/email/preview
 * Returns rendered HTML for iframe preview in the editor
 */
export async function POST(request) {
  try {
    const { newsletter } = await request.json();

    if (!newsletter?.sections) {
      return NextResponse.json({ error: 'Invalid newsletter' }, { status: 400 });
    }

    const { html } = await renderPreview(newsletter);
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
