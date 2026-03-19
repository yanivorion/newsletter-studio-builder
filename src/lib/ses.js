/**
 * Amazon SES Email Sending Service
 * 
 * Handles bulk email sending with:
 * - Rate limiting (14 emails/sec for SES default)
 * - Batch processing
 * - Proper headers (List-Unsubscribe for CAN-SPAM/GDPR)
 * - Bounce/complaint tracking via message IDs
 */

import { SESv2Client, SendEmailCommand, GetAccountCommand } from '@aws-sdk/client-sesv2';

let sesClient = null;

function getClient() {
  if (!sesClient) {
    sesClient = new SESv2Client({
      region: process.env.AWS_SES_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
      },
    });
  }
  return sesClient;
}

/**
 * Send a single email via SES
 */
export async function sendEmail({ to, subject, html, replyTo, unsubscribeUrl, tags = {} }) {
  const client = getClient();
  const fromEmail = process.env.SES_FROM_EMAIL;
  const fromName = process.env.SES_FROM_NAME || 'Newsletter';

  const headers = [];
  if (unsubscribeUrl) {
    headers.push(
      { Name: 'List-Unsubscribe', Value: `<${unsubscribeUrl}>` },
      { Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' }
    );
  }

  const command = new SendEmailCommand({
    FromEmailAddress: `${fromName} <${fromEmail}>`,
    Destination: {
      ToAddresses: [to],
    },
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: html, Charset: 'UTF-8' },
        },
        Headers: headers,
      },
    },
    ReplyToAddresses: replyTo ? [replyTo] : undefined,
    EmailTags: Object.entries(tags).map(([Name, Value]) => ({ Name, Value })),
  });

  const response = await client.send(command);
  return {
    messageId: response.MessageId,
    success: true,
  };
}

/**
 * Wrap <a href="..."> links with click tracking (except unsubscribe and mailto)
 */
function wrapLinksWithTracking(html, appUrl, campaignId, subscriberId) {
  return html.replace(
    /<a\s+([^>]*?)href="([^"]+)"([^>]*)>/gi,
    (match, before, href, after) => {
      const lower = href.toLowerCase();
      if (lower.startsWith('mailto:') || lower.includes('/api/subscribers/unsubscribe')) {
        return match;
      }
      const trackUrl = `${appUrl}/api/track/click?cid=${campaignId}&sid=${subscriberId}&url=${encodeURIComponent(href)}`;
      return `<a ${before}href="${trackUrl}"${after}>`;
    }
  );
}

/**
 * Inject open tracking pixel before </body>
 */
function injectTrackingPixel(html, appUrl, campaignId, subscriberId) {
  const pixel = `<img src="${appUrl}/api/track/open?cid=${campaignId}&sid=${subscriberId}" width="1" height="1" style="display:none" />`;
  return html.replace('</body>', `${pixel}</body>`);
}

/**
 * Send emails in batches with rate limiting
 * SES default rate: 14 emails/second
 */
export async function sendBulkEmails({
  recipients,
  subject,
  html,
  campaignId,
  unsubscribeBaseUrl,
  replyTo,
  trackingAppUrl,
  onProgress,
  batchSize = 10,
  delayBetweenBatches = 1000,
}) {
  const results = {
    total: recipients.length,
    sent: 0,
    failed: 0,
    errors: [],
    messageIds: [],
  };

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    const batchPromises = batch.map(async (recipient) => {
      const unsubscribeUrl = unsubscribeBaseUrl
        ? `${unsubscribeBaseUrl}?email=${encodeURIComponent(recipient.email)}&token=${recipient.unsubscribeToken}`
        : null;

      let personalizedHtml = html;

      // Inject tracking (per-recipient) when campaignId and trackingAppUrl provided
      if (campaignId && trackingAppUrl && recipient.id) {
        personalizedHtml = injectTrackingPixel(personalizedHtml, trackingAppUrl, campaignId, recipient.id);
        personalizedHtml = wrapLinksWithTracking(personalizedHtml, trackingAppUrl, campaignId, recipient.id);
      }

      if (recipient.mergeFields) {
        Object.entries(recipient.mergeFields).forEach(([key, value]) => {
          personalizedHtml = personalizedHtml.replace(
            new RegExp(`{{${key}}}`, 'g'),
            value || ''
          );
        });
      }

      try {
        const result = await sendEmail({
          to: recipient.email,
          subject,
          html: personalizedHtml,
          replyTo,
          unsubscribeUrl,
          tags: {
            campaign_id: campaignId || 'unknown',
            subscriber_id: recipient.id || 'unknown',
          },
        });

        results.sent++;
        results.messageIds.push({
          email: recipient.email,
          messageId: result.messageId,
        });
      } catch (error) {
        results.failed++;
        results.errors.push({
          email: recipient.email,
          error: error.message,
        });
      }
    });

    await Promise.all(batchPromises);

    if (onProgress) {
      onProgress({
        sent: results.sent,
        failed: results.failed,
        total: results.total,
        percent: Math.round(((results.sent + results.failed) / results.total) * 100),
      });
    }

    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}

/**
 * Check SES account status and sending limits
 */
export async function getAccountStatus() {
  const client = getClient();
  try {
    const command = new GetAccountCommand({});
    const response = await client.send(command);
    return {
      configured: true,
      sendingEnabled: response.SendingEnabled,
      productionAccess: response.ProductionAccessEnabled,
      sendQuota: response.SendQuota,
    };
  } catch (error) {
    return {
      configured: false,
      error: error.message,
    };
  }
}
