import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-client';

// 1x1 transparent GIF (base64 decoded)
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/**
 * GET /api/track/open?cid=...&sid=...
 * Open tracking pixel
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cid = searchParams.get('cid');
    const sid = searchParams.get('sid');

    if (!cid || !sid) {
      return new Response(TRANSPARENT_GIF, {
        headers: { 'Content-Type': 'image/gif' },
      });
    }

    const supabase = getSupabaseAdmin();

    // Get subscriber email
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('email')
      .eq('id', sid)
      .single();

    if (subscriber) {
      // Insert open event
      await supabase.from('email_events').insert({
        campaign_id: cid,
        email: subscriber.email,
        event_type: 'open',
      });

      // Increment campaign open_count
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('open_count')
        .eq('id', cid)
        .single();

      if (campaign) {
        await supabase
          .from('campaigns')
          .update({ open_count: (campaign.open_count || 0) + 1 })
          .eq('id', cid);
      }
    }

    return new Response(TRANSPARENT_GIF, {
      headers: { 'Content-Type': 'image/gif' },
    });
  } catch (error) {
    console.error('Open tracking error:', error);
    return new Response(TRANSPARENT_GIF, {
      headers: { 'Content-Type': 'image/gif' },
    });
  }
}
