import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-client';

/**
 * GET /api/analytics?userId=...
 * Aggregate stats and recent events for a user's campaigns
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get all campaigns for user
    const { data: campaigns, error: campaignsErr } = await supabase
      .from('campaigns')
      .select('id, sent_count, open_count, click_count, bounce_count')
      .eq('user_id', userId);

    if (campaignsErr) throw campaignsErr;

    // Aggregate stats from campaigns
    const total_sent = (campaigns || []).reduce((s, c) => s + (c.sent_count || 0), 0);
    const total_opens = (campaigns || []).reduce((s, c) => s + (c.open_count || 0), 0);
    const total_clicks = (campaigns || []).reduce((s, c) => s + (c.click_count || 0), 0);
    const total_bounces = (campaigns || []).reduce((s, c) => s + (c.bounce_count || 0), 0);
    const total_complaints = 0; // schema has no complaint_count on campaigns

    const open_rate = total_sent > 0 ? ((total_opens / total_sent) * 100).toFixed(1) : '0';
    const click_rate = total_sent > 0 ? ((total_clicks / total_sent) * 100).toFixed(1) : '0';
    const bounce_rate = total_sent > 0 ? ((total_bounces / total_sent) * 100).toFixed(1) : '0';

    // Recent events (last 50) - get events for user's campaigns
    const campaignIds = (campaigns || []).map((c) => c.id);
    let recentEvents = [];

    if (campaignIds.length > 0) {
      const { data: events, error: eventsErr } = await supabase
        .from('email_events')
        .select('id, campaign_id, email, event_type, link_url, created_at')
        .in('campaign_id', campaignIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!eventsErr) {
        recentEvents = events || [];
      }
    }

    return NextResponse.json({
      stats: {
        total_sent,
        total_opens,
        total_clicks,
        total_bounces,
        total_complaints,
        open_rate,
        click_rate,
        bounce_rate,
      },
      recent_events: recentEvents,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
