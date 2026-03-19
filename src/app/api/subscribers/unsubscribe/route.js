import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-client';

/**
 * GET /api/subscribers/unsubscribe?email=...&token=...
 * One-click unsubscribe (RFC 8058 / CAN-SPAM / GDPR compliant)
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  if (!email || !token) {
    return new Response(unsubscribePage('Missing parameters', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('id, email, unsubscribe_token')
      .eq('email', email.toLowerCase())
      .eq('unsubscribe_token', token)
      .single();

    if (!subscriber) {
      return new Response(unsubscribePage('Invalid unsubscribe link', false), {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    await supabase
      .from('subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('id', subscriber.id);

    return new Response(unsubscribePage(email, true), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new Response(unsubscribePage('An error occurred', false), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

/**
 * POST handler for List-Unsubscribe-Post (RFC 8058 one-click)
 */
export async function POST(request) {
  const formData = await request.formData();
  const listUnsubscribe = formData.get('List-Unsubscribe');
  
  if (listUnsubscribe === 'One-Click') {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const token = url.searchParams.get('token');

    if (email && token) {
      const supabase = getSupabaseAdmin();
      await supabase
        .from('subscribers')
        .update({
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString(),
        })
        .eq('email', email.toLowerCase())
        .eq('unsubscribe_token', token);
    }
  }

  return NextResponse.json({ success: true });
}

function unsubscribePage(message, success) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Newsletter Studio';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? 'Unsubscribed' : 'Error'} — ${appName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif; background: linear-gradient(145deg, #eef2f7, #e8edf5, #f0f3f8); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: rgba(255,255,255,0.7); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.48); border-radius: 16px; padding: 48px; max-width: 420px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.045); }
    .icon { font-size: 48px; margin-bottom: 20px; }
    h1 { color: #0f172a; font-size: 22px; font-weight: 600; margin-bottom: 12px; }
    p { color: #64748b; font-size: 15px; line-height: 1.6; }
    .email { color: #334155; font-weight: 500; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '✓' : '✕'}</div>
    <h1>${success ? 'Unsubscribed' : 'Something went wrong'}</h1>
    <p>${success ? `<span class="email">${message}</span> has been removed from our mailing list. You won't receive any more emails from us.` : message}</p>
  </div>
</body>
</html>`;
}
