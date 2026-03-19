import React, { useState } from 'react';
import { ImageIcon, ChevronDown } from 'lucide-react';

const LAYOUT_PRESETS = {
  'text-only': {
    label: 'Text Only',
    images: [],
    textLayout: 'full',
    thumbnail: '/media-kit/layout-text-only.png',
  },
  'text-centered': {
    label: 'Centered Text',
    images: [],
    textLayout: 'centered',
    thumbnail: '/media-kit/layout-text-centered.png',
  },
  'text-list': {
    label: 'Text + List',
    images: [],
    textLayout: 'full',
    thumbnail: '/media-kit/layout-text-list.png',
  },
  'hero-text': {
    label: 'Hero + Text',
    images: [{ span: 12 }],
    textLayout: 'full',
    thumbnail: '/media-kit/layout-hero-text.png',
  },
  'hero-repeat': {
    label: 'Image + Text Rows',
    images: [{ span: 5 }, { span: 5 }, { span: 5 }],
    textLayout: 'repeat-side',
    thumbnail: '/media-kit/layout-hero-repeat.png',
  },
  'hero-side': {
    label: 'Hero + Side Text',
    images: [{ span: 5 }],
    textLayout: 'two-col',
    thumbnail: '/media-kit/layout-hero-side.png',
  },
  'three-col': {
    label: '3 Columns',
    images: [{ span: 4 }, { span: 4 }, { span: 4 }],
    textLayout: 'full',
    thumbnail: '/media-kit/layout-three-col.png',
  },
  'two-by-two': {
    label: '2×2 Grid',
    imageRows: [
      [{ span: 6 }, { span: 6 }],
      [{ span: 6 }, { span: 6 }],
    ],
    textLayout: 'full',
    thumbnail: '/media-kit/layout-two-by-two.png',
  },
  'two-col-wide': {
    label: '2 Columns (5/7)',
    images: [{ span: 5 }, { span: 7 }],
    textLayout: 'full',
    thumbnail: '/media-kit/layout-two-col-wide.png',
  },
  'two-col-equal': {
    label: '2 Columns (Equal)',
    images: [{ span: 6 }, { span: 6 }],
    textLayout: 'full',
    thumbnail: '/media-kit/layout-two-col-equal.png',
  },
  'two-col-text-side': {
    label: '2 Columns + Side Text',
    images: [{ span: 6 }, { span: 6 }],
    textLayout: 'images-then-two-col',
    thumbnail: '/media-kit/layout-two-col-text-side.png',
  },
  'hero-above': {
    label: 'Hero Above Badge',
    images: [{ span: 12 }],
    textLayout: 'full',
    imageAboveBadge: true,
    thumbnail: '/media-kit/layout-hero-above.png',
  },
  'track-list': {
    label: 'Track List',
    images: [],
    textLayout: 'track-list',
    thumbnail: '/media-kit/layout-track-list.png',
  },
};

function ImagePlaceholder({ height = 180, borderRadius = 12, src, onSetImage }) {
  const [hovered, setHovered] = useState(false);

  if (src) {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ position: 'relative', borderRadius, overflow: 'hidden' }}
      >
        <img
          src={src}
          alt=""
          style={{
            width: '100%',
            height,
            objectFit: 'cover',
            borderRadius,
            display: 'block',
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
            }}
          >
            <ImageIcon size={16} style={{ color: '#fff' }} />
          </div>
        )}
      </div>
    );
  }
  const canSet = !!onSetImage;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={canSet ? (e) => { e.stopPropagation(); onSetImage(); } : undefined}
      style={{
        width: '100%',
        height,
        background: hovered && canSet
          ? 'linear-gradient(180deg, #ddf4fc 0%, #c2e8f4 100%)'
          : 'linear-gradient(180deg, #E8E8EC 0%, #C8CDD8 100%)',
        borderRadius,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        cursor: canSet ? 'pointer' : undefined,
        transition: 'background 200ms',
      }}
    >
      <ImageIcon size={24} style={{ opacity: hovered && canSet ? 0.6 : 0.25, color: hovered && canSet ? '#04D1FC' : '#9CA3AF', transition: 'all 200ms' }} />
      <span style={{ fontSize: 11, fontWeight: 500, color: hovered && canSet ? '#04D1FC' : '#9CA3AF', opacity: hovered && canSet ? 1 : 0.6, transition: 'all 200ms' }}>
        {hovered && canSet ? 'Set image' : 'Click to set'}
      </span>
    </div>
  );
}

const DEFAULT_TRACKS = [
  {
    title: 'TITLE PROJECT 01',
    subjects: ['Subject 01', 'Subject 02', 'Subject 03', 'Subject 04', 'Subject 05', 'Subject 06', 'Subject 07', 'Subject 08'],
  },
  {
    title: 'TITLE PROJECT 02',
    subjects: ['Subject 01', 'Subject 02', 'Subject 03', 'Subject 04', 'Subject 05', 'Subject 06', 'Subject 07', 'Subject 08'],
  },
  {
    title: 'TITLE PROJECT 03',
    subjects: ['Subject 01', 'Subject 02', 'Subject 03', 'Subject 04', 'Subject 05', 'Subject 06', 'Subject 07', 'Subject 08'],
  },
  {
    title: 'TITLE PROJECT 04',
    subjects: ['Subject 01', 'Subject 02', 'Subject 03', 'Subject 04', 'Subject 05', 'Subject 06', 'Subject 07', 'Subject 08'],
  },
];

function TrackListLayout({ badgeText, badgeColor, tracks, badgeFontSize = 16, titleFontSize = 15, bodyFontSize = 15 }) {
  const items = tracks && tracks.length > 0 ? tracks : DEFAULT_TRACKS;
  return (
    <div style={{ padding: 0, fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ marginBottom: 8 }}>
        <span style={{ display: 'inline-block', fontSize: badgeFontSize, fontWeight: 600, letterSpacing: '0.06em', color: badgeColor, textTransform: 'uppercase' }}>
          {badgeText}
        </span>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '0 0 16px' }} />
      {items.map((track, ti) => (
        <div key={ti} style={{ marginBottom: ti < items.length - 1 ? 24 : 0 }}>
          <div style={{ fontSize: titleFontSize, fontWeight: 700, letterSpacing: '0.04em', color: '#1C1917', marginBottom: 8, textTransform: 'uppercase' }}>
            {track.title}
          </div>
          {track.subjects.map((subj, si) => (
            <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: bodyFontSize, color: '#6B7280', lineHeight: 1.6 }}>
              <span style={{ fontSize: bodyFontSize - 1, color: '#9CA3AF', flexShrink: 0 }}>↳</span>
              <span>{subj}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function MultiLayoutBlock({
  layout = 'two-col-wide',
  badgeText = 'BUILDER',
  badgeColor = '#1a1a3e',
  title = 'THE LOOK & FEEL OF STUDIO 2.0',
  body = 'The first real look at the Studio 2.0 editor shell. Top Bar, Side Bar, and Side Panels live and interactive.',
  images = [],
  imageHeight = 180,
  imageBorderRadius = 12,
  badgeFontSize = 16,
  titleFontSize = 15,
  bodyFontSize = 15,
  imageGap = 8,
  tracks,
  onSetLayoutImage,
}) {
  const preset = LAYOUT_PRESETS[layout] || LAYOUT_PRESETS['two-col-wide'];

  const renderImageRow = (cols, rowIdx = 0) => (
    <div
      key={rowIdx}
      style={{
        display: 'grid',
        gridTemplateColumns: cols.map(c => `${c.span}fr`).join(' '),
        gap: 8,
        marginBottom: imageGap,
      }}
    >
      {cols.map((col, i) => {
        const imgIdx = rowIdx * cols.length + i;
        return (
          <ImagePlaceholder
            key={i}
            height={imageHeight}
            borderRadius={imageBorderRadius}
            src={images[imgIdx]}
            onSetImage={onSetLayoutImage ? () => onSetLayoutImage(imgIdx) : undefined}
          />
        );
      })}
    </div>
  );

  const renderTextFull = () => (
    <div style={{ padding: '8px 0 0' }}>
      <div style={{ fontSize: titleFontSize, fontWeight: 700, letterSpacing: '0.03em', color: '#1C1917', lineHeight: 1.3, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: bodyFontSize, color: '#6B7280', lineHeight: 1.65, fontFamily: 'Poppins, sans-serif' }}>
        {body}
      </div>
    </div>
  );

  const renderTextTwoCol = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 12, padding: '8px 0 0' }}>
      <div style={{ fontSize: titleFontSize, fontWeight: 700, letterSpacing: '0.03em', color: '#1C1917', lineHeight: 1.3 }}>
        {title}
      </div>
      <div style={{ fontSize: bodyFontSize, color: '#6B7280', lineHeight: 1.65, fontFamily: 'Poppins, sans-serif' }}>
        {body}
      </div>
    </div>
  );

  if (preset.textLayout === 'track-list') {
    return (
      <>
        <TrackListLayout badgeText={badgeText} badgeColor={badgeColor} tracks={tracks} badgeFontSize={badgeFontSize} titleFontSize={titleFontSize} bodyFontSize={bodyFontSize} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, padding: '4px 8px', background: '#F4F4F5', borderRadius: 6, width: 'fit-content', fontSize: 10, color: '#71717A' }}>
          <ChevronDown size={10} />
          {preset.label}
        </div>
      </>
    );
  }

  const badgeBlock = (
    <>
      <div style={{ marginBottom: 8 }}>
        <span
          style={{
            display: 'inline-block',
            fontSize: badgeFontSize,
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: badgeColor,
            textTransform: 'uppercase',
          }}
        >
          {badgeText}
        </span>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '0 0 12px' }} />
    </>
  );

  const heroAboveImages = preset.imageAboveBadge && preset.images && preset.images.length > 0;

  return (
    <div style={{ padding: 0, fontFamily: 'Poppins, sans-serif' }}>
      {/* Images above badge (hero-above layout) */}
      {heroAboveImages && renderImageRow(preset.images)}

      {/* Badge */}
      {badgeBlock}

      {/* Layout content */}
      {preset.textLayout === 'repeat-side' ? (
        /* Repeating rows: image + text side by side */
        (preset.images || []).map((col, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: `${col.span}fr ${12 - col.span}fr`, gap: 12, marginBottom: i < preset.images.length - 1 ? 16 : 0 }}>
            <ImagePlaceholder
              height={imageHeight}
              borderRadius={imageBorderRadius}
              src={images[i]}
              onSetImage={onSetLayoutImage ? () => onSetLayoutImage(i) : undefined}
            />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: titleFontSize, fontWeight: 700, letterSpacing: '0.03em', color: '#1C1917', lineHeight: 1.3, marginBottom: 6 }}>
                {title}
              </div>
              <div style={{ fontSize: bodyFontSize, color: '#6B7280', lineHeight: 1.65, fontFamily: 'Poppins, sans-serif' }}>
                {body}
              </div>
            </div>
          </div>
        ))
      ) : preset.textLayout === 'two-col' ? (
        /* Hero image + side text */
        <>
          {preset.images && preset.images.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `${preset.images[0].span}fr ${12 - preset.images[0].span}fr`, gap: 12 }}>
              <ImagePlaceholder
                height={imageHeight}
                borderRadius={imageBorderRadius}
                src={images[0]}
                onSetImage={onSetLayoutImage ? () => onSetLayoutImage(0) : undefined}
              />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: titleFontSize, fontWeight: 700, letterSpacing: '0.03em', color: '#1C1917', lineHeight: 1.3, marginBottom: 6 }}>
                  {title}
                </div>
                <div style={{ fontSize: bodyFontSize, color: '#6B7280', lineHeight: 1.65, fontFamily: 'Poppins, sans-serif' }}>
                  {body}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Standard: image grid on top, text below */
        <>
          {!heroAboveImages && (preset.imageRows
            ? preset.imageRows.map((row, i) => renderImageRow(row, i))
            : preset.images && preset.images.length > 0 && renderImageRow(preset.images)
          )}
          {preset.textLayout === 'centered' ? (
            <div style={{ padding: '8px 0 0', textAlign: 'center' }}>
              <div style={{ fontSize: titleFontSize, fontWeight: 700, letterSpacing: '0.03em', color: '#1C1917', lineHeight: 1.3, marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: bodyFontSize, color: '#6B7280', lineHeight: 1.65, fontFamily: 'Poppins, sans-serif' }}>{body}</div>
            </div>
          ) : preset.textLayout === 'images-then-two-col' ? renderTextTwoCol() : renderTextFull()}
        </>
      )}

      {/* Layout indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginTop: 8,
          padding: '4px 8px',
          background: '#F4F4F5',
          borderRadius: 6,
          width: 'fit-content',
          fontSize: 10,
          color: '#71717A',
        }}
      >
        <ChevronDown size={10} />
        {preset.label}
      </div>
    </div>
  );
}

export { LAYOUT_PRESETS };
