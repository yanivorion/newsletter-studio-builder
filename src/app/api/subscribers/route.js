import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-client';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/subscribers
 * List subscribers with optional filtering
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('list_id');
    const status = searchParams.get('status') || 'active';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('subscribers')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (listId) {
      query = query.contains('list_ids', [listId]);
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      subscribers: data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('List subscribers error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/subscribers
 * Add new subscriber(s)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const supabase = getSupabaseAdmin();

    const subscribers = Array.isArray(body) ? body : [body];
    const records = subscribers.map(sub => ({
      email: sub.email.toLowerCase().trim(),
      first_name: sub.first_name || null,
      last_name: sub.last_name || null,
      status: 'active',
      list_ids: sub.list_ids || [],
      tags: sub.tags || [],
      metadata: sub.metadata || {},
      unsubscribe_token: uuidv4(),
    }));

    const { data, error } = await supabase
      .from('subscribers')
      .upsert(records, { onConflict: 'email', ignoreDuplicates: false })
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: data.length,
      subscribers: data,
    });
  } catch (error) {
    console.error('Add subscriber error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
