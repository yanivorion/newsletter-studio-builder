import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-client';

/**
 * GET /api/templates/:id
 * Public endpoint — fetches a newsletter by ID for template sharing.
 * No authentication required (link-based access, UUID is unguessable).
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('newsletters')
      .select('id, name, sections, page_settings, created_at, updated_at, user_id')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Fetch owner display name: profile -> auth metadata -> email prefix
    let ownerName = 'Someone';
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', data.user_id)
        .maybeSingle();

      if (profile?.full_name) {
        ownerName = profile.full_name.split(' ')[0];
      } else {
        // Fallback: check auth user metadata or email
        const { data: authData } = await supabase.auth.admin.getUserById(data.user_id);
        const meta = authData?.user?.user_metadata;
        if (meta?.full_name) {
          ownerName = meta.full_name.split(' ')[0];
        } else if (meta?.name) {
          ownerName = meta.name.split(' ')[0];
        } else {
          const email = profile?.email || authData?.user?.email;
          if (email) ownerName = email.split('@')[0];
        }
      }
    } catch {
      // Profile lookup is best-effort
    }

    return NextResponse.json({
      template: {
        id: data.id,
        name: data.name,
        ownerId: data.user_id,
        ownerName,
        sections: data.sections || [],
        pageSettings: data.page_settings || {},
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error('Get template error:', error);
    return NextResponse.json({ error: 'Failed to load template' }, { status: 500 });
  }
}
