/**
 * GIF Export — client renders frames, server encodes the GIF.
 *
 * Frames are generated on canvas in the browser (fast, uses native fonts)
 * then sent to /api/gif/encode where sharp + gif-encoder-2 produce a
 * reliable animated GIF — no gifshot, no web workers, no CDN scripts.
 */

const SERVER_ENCODE_TIMEOUT = 60000;

function loadImage(src, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      reject(new Error('Image load timeout'));
    }, timeout);

    img.onload = () => {
      if (!timedOut) {
        clearTimeout(timer);
        resolve(img);
      }
    };

    img.onerror = () => {
      if (!timedOut) {
        clearTimeout(timer);
        if (img.crossOrigin) {
          const img2 = new Image();
          img2.onload = () => resolve(img2);
          img2.onerror = () => reject(new Error('Failed to load image'));
          img2.src = src;
        } else {
          reject(new Error('Failed to load image'));
        }
      }
    };

    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.src = src;
  });
}

function drawImageCover(ctx, img, width, height, backgroundColor) {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;

  if (imgW <= 0 || imgH <= 0) return;

  const imgRatio = imgW / imgH;
  const canvasRatio = width / height;
  let dw, dh, dx, dy;

  if (imgRatio > canvasRatio) {
    dh = height;
    dw = height * imgRatio;
    dx = (width - dw) / 2;
    dy = 0;
  } else {
    dw = width;
    dh = width / imgRatio;
    dx = 0;
    dy = (height - dh) / 2;
  }

  try {
    ctx.drawImage(img, dx, dy, dw, dh);
  } catch (e) {
    console.warn('Error drawing image:', e);
  }
}

async function encodeGifOnServer(frames, width, height, delay) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SERVER_ENCODE_TIMEOUT);

  try {
    const res = await fetch('/api/gif/encode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frames, width, height, delay }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server GIF encode failed (${res.status})`);
    }

    return new Blob([await res.arrayBuffer()], { type: 'image/gif' });
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

/**
 * Export an array of image URLs/dataURLs as an animated GIF.
 */
export async function exportSequenceAsGif(images, options = {}) {
  const {
    width = 700,
    height = 400,
    delay = 500,
    backgroundColor = '#FFFFFF',
    onProgress = null
  } = options;

  console.log('Starting GIF export with', images?.length, 'images');

  if (!images || images.length < 2) {
    throw new Error('Need at least 2 images to create a GIF');
  }

  const validImages = images.filter(src => src && typeof src === 'string' && src.length > 0);
  if (validImages.length < 2) {
    throw new Error('Need at least 2 valid images');
  }

  if (onProgress) onProgress(5);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const processedFrames = [];

  for (let i = 0; i < validImages.length; i++) {
    try {
      const img = await loadImage(validImages[i]);
      drawImageCover(ctx, img, width, height, backgroundColor);
      processedFrames.push(canvas.toDataURL('image/jpeg', 0.85));
    } catch (e) {
      console.warn(`Failed to process image ${i + 1}:`, e.message);
    }

    if (onProgress) {
      onProgress(5 + Math.round((i / validImages.length) * 55));
    }
  }

  if (processedFrames.length < 2) {
    throw new Error(`Only ${processedFrames.length} images could be processed.`);
  }

  if (onProgress) onProgress(65);
  console.log(`Sending ${processedFrames.length} frames to server for GIF encoding...`);

  const blob = await encodeGifOnServer(processedFrames, width, height, delay);

  console.log('GIF blob size:', blob.size, 'bytes');
  if (onProgress) onProgress(100);
  return blob;
}

/**
 * Normalize items: backward compat for legacy comma-separated strings.
 */
function normalizeItems(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    return raw.split(',').map(s => s.trim()).filter(Boolean).map(v => ({ type: 'text', value: v }));
  }
  return [{ type: 'text', value: 'New Announcement' }];
}

/**
 * Export a marquee block as an animated GIF.
 * Supports mixed text + image layers.
 * Renders scrolling frames on canvas, then encodes server-side.
 */
export async function exportMarqueeAsGif(section, options = {}) {
  const {
    width = 700,
    onProgress = null
  } = options;

  const items = normalizeItems(section.items);
  const bgColor = section.backgroundColor || '#04D1FC';
  const textColor = section.textColor || '#FFFFFF';
  const fontSize = section.fontSize || 16;
  const fontWeight = section.fontWeight || '500';
  const paddingVertical = section.paddingVertical || 12;
  const separator = section.separator || '\u2022';
  const imgSize = section.imageSize || 24;
  const speed = section.speed || 30;
  const direction = section.direction || 'left';

  const lineHeight = Math.round(fontSize * 1.4);
  const height = paddingVertical * 2 + lineHeight;
  const separatorGap = 24;

  const fps = 10;
  const totalDuration = Math.min(speed, 4);
  const totalFrames = Math.round(fps * totalDuration);
  const frameDelay = Math.round(1000 / fps);

  if (onProgress) onProgress(5);

  // Preload all image layers
  const imageCache = {};
  for (const item of items) {
    if (item.type === 'image' && item.src) {
      try {
        imageCache[item.src] = await loadImage(item.src);
      } catch (e) {
        console.warn('Failed to load marquee image:', e.message);
      }
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const font = `${fontWeight} ${fontSize}px 'Poppins', 'Helvetica Neue', Arial, sans-serif`;
  ctx.font = font;

  // Measure total strip width
  let stripWidth = 0;
  for (const item of items) {
    if (item.type === 'image') {
      stripWidth += 12 + imgSize + 12;
    } else {
      stripWidth += 12 + ctx.measureText(item.value || '').width + 12;
    }
    stripWidth += ctx.measureText(` ${separator} `).width;
  }
  stripWidth = Math.max(stripWidth, 1);

  const processedFrames = [];

  for (let i = 0; i < totalFrames; i++) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    const progress = i / totalFrames;
    const offset = direction === 'left'
      ? -(progress * stripWidth)
      : -(1 - progress) * stripWidth;

    ctx.font = font;
    ctx.textBaseline = 'middle';
    const y = height / 2;

    const copies = Math.ceil((width + stripWidth) / stripWidth) + 1;

    for (let c = 0; c < copies; c++) {
      let x = offset + c * stripWidth;

      for (let j = 0; j < items.length; j++) {
        const item = items[j];
        x += 12;

        if (item.type === 'image' && item.src && imageCache[item.src]) {
          ctx.drawImage(imageCache[item.src], x, y - imgSize / 2, imgSize, imgSize);
          x += imgSize;
        } else {
          ctx.fillStyle = textColor;
          ctx.fillText(item.value || '', x, y);
          x += ctx.measureText(item.value || '').width;
        }

        x += 12;

        if (j < items.length - 1 || c < copies - 1) {
          ctx.fillStyle = textColor;
          ctx.globalAlpha = 0.5;
          ctx.fillText(separator, x, y);
          ctx.globalAlpha = 1.0;
          x += ctx.measureText(` ${separator} `).width;
        }
      }
    }

    processedFrames.push(canvas.toDataURL('image/jpeg', 0.8));

    if (onProgress) {
      onProgress(5 + Math.round((i / totalFrames) * 55));
    }
  }

  if (onProgress) onProgress(65);
  console.log(`Sending ${processedFrames.length} marquee frames to server for GIF encoding...`);

  const blob = await encodeGifOnServer(processedFrames, width, height, frameDelay);

  console.log('Marquee GIF blob size:', blob.size, 'bytes');
  if (onProgress) onProgress(100);
  return { blob, height };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
