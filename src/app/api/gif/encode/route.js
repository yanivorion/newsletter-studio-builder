import { NextResponse } from 'next/server';
import sharp from 'sharp';
import GIFEncoder from 'gif-encoder-2';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/gif/encode
 * Body: { frames: dataURL[], width, height, delay (ms) }
 * Returns: image/gif binary
 *
 * Each frame is decoded with sharp -> raw RGBA, then handed to gif-encoder-2.
 * Using "neuquant" with high sample rate gives clean color quantization
 * for both photographs and rendered text.
 */
export async function POST(request) {
  try {
    const { frames, width, height, delay } = await request.json();

    if (!Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json({ error: 'No frames provided' }, { status: 400 });
    }

    const w = parseInt(width) || 700;
    const h = parseInt(height) || 200;
    const frameDelay = Math.max(20, parseInt(delay) || 100);

    // gif-encoder-2: ('neuquant' produces best color fidelity for text/photo)
    const encoder = new GIFEncoder(w, h, 'neuquant', true);
    encoder.setDelay(frameDelay);
    encoder.setRepeat(0);
    encoder.setQuality(10);
    encoder.start();

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      if (typeof frame !== 'string') continue;

      // Strip dataURL prefix
      const base64 = frame.includes(',') ? frame.split(',')[1] : frame;
      const buf = Buffer.from(base64, 'base64');

      // Decode + force exact size + raw RGBA pixels
      const { data } = await sharp(buf)
        .resize(w, h, { fit: 'cover' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      encoder.addFrame(data);
    }

    encoder.finish();
    const gifBuffer = encoder.out.getData();

    return new NextResponse(gifBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Content-Length': String(gifBuffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[gif/encode] failed:', err);
    return NextResponse.json(
      { error: err.message || 'GIF encoding failed' },
      { status: 500 }
    );
  }
}
