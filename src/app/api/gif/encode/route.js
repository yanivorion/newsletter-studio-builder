import { NextResponse } from 'next/server';

/**
 * POST /api/gif/encode
 *
 * Server-side GIF encoding using sharp (decode) + gif-encoder-2 (encode).
 * No web workers, no browser hacks — reliable GIF generation like gifski.
 *
 * Body: { frames: string[], width: number, height: number, delay?: number }
 *   frames: array of data-URL strings (image/jpeg or image/png)
 *   delay: ms between frames (default 100)
 *
 * Response: binary GIF buffer (Content-Type: image/gif)
 */
export async function POST(request) {
  try {
    const { frames, width, height, delay = 100 } = await request.json();

    if (!frames?.length || frames.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 frames' },
        { status: 400 }
      );
    }

    if (!width || !height || width > 2000 || height > 2000) {
      return NextResponse.json(
        { error: 'Invalid dimensions (max 2000x2000)' },
        { status: 400 }
      );
    }

    const sharp = (await import('sharp')).default;
    const GIFEncoder = (await import('gif-encoder-2')).default;

    const encoder = new GIFEncoder(width, height, 'neuquant', true);
    encoder.setDelay(delay);
    encoder.setRepeat(0);
    encoder.setQuality(10);
    encoder.start();

    for (let i = 0; i < frames.length; i++) {
      const dataUrl = frames[i];
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const inputBuf = Buffer.from(base64, 'base64');

      const rawPixels = await sharp(inputBuf)
        .resize(width, height, { fit: 'fill' })
        .ensureAlpha()
        .raw()
        .toBuffer();

      encoder.addFrame(rawPixels);
    }

    encoder.finish();

    const gifBuffer = encoder.out.getData();

    return new Response(gifBuffer, {
      headers: {
        'Content-Type': 'image/gif',
        'Content-Length': gifBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('GIF encode error:', error);
    return NextResponse.json(
      { error: 'Failed to encode GIF', details: error.message },
      { status: 500 }
    );
  }
}
