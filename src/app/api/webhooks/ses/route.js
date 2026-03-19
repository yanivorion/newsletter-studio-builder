import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-client';

/**
 * POST /api/webhooks/ses
 * Handle SES bounce, complaint, and delivery notifications
 * Configure this URL in SES → Configuration Set → SNS Topic
 */
export async function POST(request) {
  try {
    const body = await request.json();

    if (body.Type === 'SubscriptionConfirmation') {
      const confirmUrl = body.SubscribeURL;
      if (confirmUrl) {
        await fetch(confirmUrl);
      }
      return NextResponse.json({ confirmed: true });
    }

    if (body.Type !== 'Notification') {
      return NextResponse.json({ ignored: true });
    }

    const message = JSON.parse(body.Message);
    const eventType = message.eventType || message.notificationType;
    const supabase = getSupabaseAdmin();

    switch (eventType) {
      case 'Bounce': {
        const bounceType = message.bounce?.bounceType;
        const recipients = message.bounce?.bouncedRecipients || [];

        for (const recipient of recipients) {
          const email = recipient.emailAddress?.toLowerCase();
          if (!email) continue;

          if (bounceType === 'Permanent') {
            await supabase
              .from('subscribers')
              .update({ status: 'bounced', bounced_at: new Date().toISOString() })
              .eq('email', email);
          }

          await supabase.from('email_events').insert({
            email,
            event_type: 'bounce',
            bounce_type: bounceType,
            details: recipient,
          });
        }
        break;
      }

      case 'Complaint': {
        const recipients = message.complaint?.complainedRecipients || [];

        for (const recipient of recipients) {
          const email = recipient.emailAddress?.toLowerCase();
          if (!email) continue;

          await supabase
            .from('subscribers')
            .update({ status: 'complained', complained_at: new Date().toISOString() })
            .eq('email', email);

          await supabase.from('email_events').insert({
            email,
            event_type: 'complaint',
            details: recipient,
          });
        }
        break;
      }

      case 'Delivery': {
        const recipients = message.delivery?.recipients || [];
        for (const email of recipients) {
          await supabase.from('email_events').insert({
            email: email.toLowerCase(),
            event_type: 'delivery',
            details: { timestamp: message.delivery?.timestamp },
          });
        }
        break;
      }
    }

    return NextResponse.json({ processed: eventType });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
