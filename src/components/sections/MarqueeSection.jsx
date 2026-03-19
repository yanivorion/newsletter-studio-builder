import React, { useState, useEffect, forwardRef } from 'react';

/**
 * Normalize items to an array of { type: 'text'|'image', value/src }.
 * Supports legacy comma-separated string format.
 */
function normalizeItems(items) {
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    return items
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(value => ({ type: 'text', value }));
  }
  return [{ type: 'text', value: 'New Announcement' }];
}

const MarqueeSection = forwardRef(function MarqueeSection({
  items = [],
  speed = 30,
  direction = 'left',
  backgroundColor = '#04D1FC',
  textColor = '#FFFFFF',
  fontSize = 16,
  fontWeight = '500',
  letterSpacing = '0.02em',
  paddingVertical = 12,
  separator = '\u2022',
  imageSize = 24,
  pauseOnHover = true,
}, ref) {
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const itemsArray = normalizeItems(items);
  const duplicatedItems = [...itemsArray, ...itemsArray];

  const keyframes = `
    @keyframes marqueeScrollLeft {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }
    @keyframes marqueeScrollRight {
      from { transform: translateX(-50%); }
      to { transform: translateX(0); }
    }
  `;

  const containerStyle = {
    backgroundColor,
    padding: `${paddingVertical}px 0`,
    overflow: 'hidden',
    position: 'relative',
  };

  const trackStyle = {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    animation: prefersReducedMotion
      ? 'none'
      : `marqueeScroll${direction === 'left' ? 'Left' : 'Right'} ${speed}s linear infinite`,
    animationPlayState: (pauseOnHover && isPaused) ? 'paused' : 'running',
    willChange: 'transform',
  };

  const textItemStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0 12px',
    fontSize: `${fontSize}px`,
    fontWeight,
    letterSpacing,
    color: textColor,
    fontFamily: "'Poppins', 'Helvetica Neue', Arial, sans-serif",
  };

  const imgItemStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0 12px',
    flexShrink: 0,
  };

  const separatorStyle = {
    opacity: 0.5,
    fontSize: `${fontSize}px`,
    color: textColor,
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0 4px',
  };

  const renderItem = (item) => {
    if (item.type === 'image' && item.src) {
      return (
        <span style={imgItemStyle}>
          <img
            src={item.src}
            alt=""
            style={{
              width: `${imageSize}px`,
              height: `${imageSize}px`,
              objectFit: 'contain',
              flexShrink: 0,
            }}
            draggable={false}
          />
        </span>
      );
    }
    return (
      <span style={textItemStyle}>
        {item.value || ''}
      </span>
    );
  };

  return (
    <div
      ref={ref}
      style={containerStyle}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      className="marquee-section"
    >
      <style>{keyframes}</style>
      <div style={trackStyle}>
        {duplicatedItems.map((item, index) => (
          <React.Fragment key={`${item.type}-${index}`}>
            {renderItem(item)}
            {index < duplicatedItems.length - 1 && (
              <span style={separatorStyle}>{separator}</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
});

export { normalizeItems };
export default MarqueeSection;
