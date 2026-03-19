import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';

export default function ImageBlock({
  src,
  alt = '',
  width = '100%',
  height = 'auto',
  objectFit = 'cover',
  borderRadius = 0,
  alignment = 'center',
  showPlaceholder = true,
  onSetImage,
}) {
  const [hovered, setHovered] = useState(false);

  if (!src && showPlaceholder) {
    const canSet = !!onSetImage;
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%',
          height: typeof height === 'number' ? height : 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: hovered && canSet ? 'rgba(4,209,252,0.04)' : 'rgba(255,255,255,0.1)',
          borderRadius,
          position: 'relative',
          cursor: canSet ? 'pointer' : undefined,
          transition: 'background 150ms',
        }}
        onClick={canSet ? (e) => { e.stopPropagation(); onSetImage(); } : undefined}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            color: hovered && canSet ? '#04D1FC' : 'currentColor',
            opacity: hovered ? 0.8 : 0.45,
            transition: 'all 200ms',
          }}
        >
          <ImageIcon size={24} />
          <span style={{ fontSize: 11, fontWeight: 500 }}>
            {hovered && canSet ? 'Set image' : 'Click to set'}
          </span>
        </div>
      </div>
    );
  }

  if (!src) return null;

  const needsAlign = width && width !== '100%';
  const alignMap = { left: 'flex-start', center: 'center', right: 'flex-end' };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius,
        overflow: 'hidden',
        ...(needsAlign ? { display: 'flex', justifyContent: alignMap[alignment] || 'center' } : {}),
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          display: 'block',
          width: typeof width === 'number' ? width : width,
          height: typeof height === 'number' ? height : height,
          objectFit,
          borderRadius,
        }}
      />
      {hovered && onSetImage && (
        <div
          onClick={(e) => { e.stopPropagation(); onSetImage(); }}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'opacity 150ms',
          }}
        >
          <ImageIcon size={16} style={{ color: '#fff' }} />
        </div>
      )}
    </div>
  );
}
