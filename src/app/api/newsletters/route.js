import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-client';

function toContent(row) {
  return {
    name: row.name,
    sections: row.sections || [],
    pageSettings: row.page_settings || {},
    projectId: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * GET /api/newsletters?userId=...
 * List newsletters for the authenticated user, ordered by updated_at desc
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const id = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('newsletters')
      .select('id, name, sections, page_settings, created_at, updated_at')
      .eq('user_id', userId);

    if (id) {
      query = query.eq('id', id).maybeSingle();
    } else {
      query = query.order('updated_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    if (id && data) {
      return NextResponse.json({
        newsletter: {
          id: data.id,
          name: data.name,
          content: toContent(data),
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
      });
    }

    const newsletters = (Array.isArray(data) ? data : []).map((row) => ({
      id: row.id,
      name: row.name,
      content: toContent(row),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return NextResponse.json({ newsletters });
  } catch (error) {
    console.error('List newsletters error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/newsletters
 * Create a new newsletter
 * Body: { userId, name, content }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, name, content } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const newsletterName = name || content?.name || 'Untitled Newsletter';
    const sections = content?.sections ?? [];
    const pageSettings = content?.pageSettings ?? {};

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('newsletters')
      .insert({
        user_id: userId,
        name: newsletterName,
        sections,
        page_settings: pageSettings,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      newsletter: {
        id: data.id,
        name: data.name,
        content: toContent(data),
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    });
  } catch (error) {
    console.error('Create newsletter error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/newsletters
 * Update an existing newsletter
 * Body: { userId, id, name?, content? }
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { userId, id, name, content } = body;

    if (!userId || !id) {
      return NextResponse.json({ error: 'userId and id required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const updates = { updated_at: new Date().toISOString() };

    if (name !== undefined) updates.name = name;
    if (content?.sections !== undefined) updates.sections = content.sections;
    if (content?.pageSettings !== undefined) updates.page_settings = content.pageSettings;

    const { data, error } = await supabase
      .from('newsletters')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    return NextResponse.json({
      newsletter: {
        id: data.id,
        name: data.name,
        content: toContent(data),
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    });
  } catch (error) {
    console.error('Update newsletter error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/newsletters?id=...&userId=...
 * Delete a newsletter
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!userId || !id) {
      return NextResponse.json({ error: 'userId and id required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('newsletters')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete newsletter error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
