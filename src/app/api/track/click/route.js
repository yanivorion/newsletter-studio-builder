import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-client';

/**
 * GET /api/track/click?cid=...&sid=...&url=...
 * Click tracking redirect
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cid = searchParams.get('cid');
    const sid = searchParams.get('sid');
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.redirect(new URL('/', request.url), 302);
    }

    const decodedUrl = decodeURIComponent(url);

    const supabase = getSupabaseAdmin();

    if (cid && sid) {
      const { data: subscriber } = await supabase
        .from('subscribers')
        .select('email')
        .eq('id', sid)
        .single();

      if (subscriber) {
        await supabase.from('email_events').insert({
          campaign_id: cid,
          email: subscriber.email,
          event_type: 'click',
          link_url: decodedUrl,
          details: { url: decodedUrl },
        });

        const { data: campaign } = await supabase
          .from('campaigns')
          .select('click_count')
          .eq('id', cid)
          .single();

        if (campaign) {
          await supabase
            .from('campaigns')
            .update({ click_count: (campaign.click_count || 0) + 1 })
            .eq('id', cid);
        }
      }
    }

    return NextResponse.redirect(decodedUrl, 302);
  } catch (error) {
    console.error('Click tracking error:', error);
    const url = new URL(request.url).searchParams.get('url');
    if (url) {
      return NextResponse.redirect(decodeURIComponent(url), 302);
    }
    return NextResponse.redirect(new URL('/', request.url), 302);
  }
}
