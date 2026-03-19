import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-client';

/**
 * GET /api/campaigns?userId=...
 * List campaigns for a user (ordered by created_at desc)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ campaigns: data || [] });
  } catch (error) {
    console.error('List campaigns error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/campaigns
 * Create a new campaign
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, newsletter_id, name, subject, preview_text, target_list_ids, target_tags } = body;

    if (!user_id || !name || !subject) {
      return NextResponse.json(
        { error: 'user_id, name, and subject are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        user_id,
        newsletter_id: newsletter_id || null,
        name,
        subject,
        preview_text: preview_text || null,
        target_list_ids: target_list_ids || [],
        target_tags: target_tags || [],
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ campaign: data });
  } catch (error) {
    console.error('Create campaign error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
