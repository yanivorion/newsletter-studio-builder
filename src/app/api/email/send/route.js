import { NextResponse } from 'next/server';
import { renderNewsletter } from '@/lib/mjml-renderer';
import { sendBulkEmails } from '@/lib/ses';
import { processNewsletterImages } from '@/lib/image-pipeline';
import { getSupabaseAdmin } from '@/lib/supabase-client';

/**
 * POST /api/email/send
 * Full pipeline: process images → render MJML → send via SES
 */
export async function POST(request) {
  try {
    const { newsletter, campaignId, subject, subscribers, replyTo, userId } = await request.json();

    if (!newsletter?.sections || !subject || !subscribers?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: newsletter, subject, subscribers' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const supabase = getSupabaseAdmin();

    // Create campaign if not provided
    let activeCampaignId = campaignId;
    if (!activeCampaignId && userId) {
      const { data: newCampaign, error: createErr } = await supabase
        .from('campaigns')
        .insert({
          user_id: userId,
          newsletter_id: newsletter.id || null,
          name: newsletter.name || subject,
          subject,
          status: 'sending',
        })
        .select('id')
        .single();
      if (createErr) {
        console.error('Failed to create campaign:', createErr);
      } else {
        activeCampaignId = newCampaign?.id;
      }
    }

    // Step 1: Process images (replace base64 with hosted URLs)
    const processedNewsletter = await processNewsletterImages(newsletter, 'campaigns');

    // Step 2: Render to email-safe HTML via MJML
    const { html, errors } = await renderNewsletter(processedNewsletter, {
      unsubscribeUrl: `${appUrl}/api/subscribers/unsubscribe`,
      previewText: subject,
    });

    if (!html) {
      return NextResponse.json(
        { error: 'Failed to render email HTML', mjmlErrors: errors },
        { status: 500 }
      );
    }

    const htmlSizeKB = Math.round(Buffer.byteLength(html, 'utf8') / 1024);
    if (htmlSizeKB > 100) {
      console.warn(`Email HTML is ${htmlSizeKB}KB — Gmail may clip at 102KB`);
    }

    // Step 3: Send via SES in batches
    const recipients = subscribers.map(sub => ({
      id: sub.id,
      email: sub.email,
      unsubscribeToken: sub.unsubscribe_token,
      mergeFields: {
        first_name: sub.first_name || '',
        last_name: sub.last_name || '',
        email: sub.email,
        name: sub.first_name ? `${sub.first_name} ${sub.last_name || ''}`.trim() : sub.email,
      },
    }));

    const results = await sendBulkEmails({
      recipients,
      subject,
      html,
      campaignId: activeCampaignId,
      unsubscribeBaseUrl: `${appUrl}/api/subscribers/unsubscribe`,
      replyTo,
      trackingAppUrl: appUrl,
      batchSize: 10,
      delayBetweenBatches: 1000,
    });

    // Step 4: Record campaign results in database
    if (activeCampaignId) {
      try {
        await supabase.from('campaigns').update({
          status: results.failed === 0 ? 'sent' : 'partial',
          sent_count: results.sent,
          failed_count: results.failed,
          sent_at: new Date().toISOString(),
        }).eq('id', activeCampaignId);
      } catch (dbErr) {
        console.error('Failed to update campaign record:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      htmlSizeKB,
    });
  } catch (error) {
    console.error('Send error:', error);
    return NextResponse.json(
      { error: 'Failed to send campaign', details: error.message },
      { status: 500 }
    );
  }
}
