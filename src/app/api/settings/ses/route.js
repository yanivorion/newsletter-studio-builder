import { NextResponse } from 'next/server';
import { getAccountStatus } from '@/lib/ses';

/**
 * GET /api/settings/ses
 * Return SES connection status and account info (informational)
 */
export async function GET() {
  try {
    const fromEmail = process.env.SES_FROM_EMAIL;
    const fromName = process.env.SES_FROM_NAME || 'Newsletter';
    const configured = !!(process.env.AWS_SES_ACCESS_KEY_ID && process.env.AWS_SES_SECRET_ACCESS_KEY);

    const accountStatus = configured ? await getAccountStatus() : { configured: false };

    return NextResponse.json({
      configured,
      fromEmail: fromEmail || null,
      fromName,
      accountStatus,
    });
  } catch (error) {
    console.error('SES status error:', error);
    return NextResponse.json({
      configured: false,
      fromEmail: null,
      fromName: 'Newsletter',
      accountStatus: { configured: false, error: error.message },
    });
  }
}
