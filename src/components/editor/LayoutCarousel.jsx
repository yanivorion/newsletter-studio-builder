'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { LAYOUT_PRESETS } from '../blocks/MultiLayoutBlock';

const presetEntries = Object.entries(LAYOUT_PRESETS);
const COUNT = presetEntries.length;
const CARD_W = 200;
const SPACING = 230;
const DROP_FACTOR = 28;

function wrap(idx) {
  return ((idx % COUNT) + COUNT) % COUNT;
}

export default function LayoutCarousel({ onSelect, onClose }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 250);
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') setActiveIdx((p) => p - 1);
      if (e.key === 'ArrowRight') setActiveIdx((p) => p + 1);
      if (e.key === 'Enter') onSelect?.(presetEntries[wrap(activeIdx)]?.[0]);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClose, onSelect, activeIdx]);

  const wheelCooldown = useRef(false);
  const handleWheel = useCallback((e) => {
    if (wheelCooldown.current) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 5) return;
    wheelCooldown.current = true;
    if (delta > 0) setActiveIdx((p) => p + 1);
    else setActiveIdx((p) => p - 1);
    setTimeout(() => { wheelCooldown.current = false; }, 180);
  }, []);

  const visibleRange = 7;
  const slots = [];
  for (let offset = -visibleRange; offset <= visibleRange; offset++) {
    const contIdx = activeIdx + offset;
    const realIdx = wrap(contIdx);
    slots.push({ offset, contIdx, realIdx, id: presetEntries[realIdx][0], preset: presetEntries[realIdx][1] });
  }

  return (
    <div
      onWheel={handleWheel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 250ms ease',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(8, 8, 12, 0.55)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* Title */}
      <div style={{
        position: 'absolute',
        top: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 350ms ease 60ms',
      }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
          Choose Layout
        </span>
        <button
          onClick={handleClose}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', border: 'none',
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Cards */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '52%',
        width: 0,
        height: 0,
        transform: isVisible ? 'none' : 'translateY(40px)',
        transition: 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        {slots.map(({ offset, contIdx, realIdx, id, preset }) => {
          const absDiff = Math.abs(offset);
          const isActive = offset === 0;
          const isHovered = hoveredIdx === realIdx;

          const tx = offset * SPACING;
          const ty = absDiff * absDiff * DROP_FACTOR;
          const rotate = offset * 5;
          const scale = isHovered ? 1.08 : isActive ? 1.0 : Math.max(0.68, 1 - absDiff * 0.05);
          const opacity = Math.max(0, 1 - absDiff * 0.18);
          const z = 100 - absDiff + (isActive ? 60 : 0) + (isHovered ? 50 : 0);

          return (
            <button
              key={contIdx}
              onClick={() => isActive ? onSelect?.(id) : setActiveIdx((p) => p + offset)}
              onMouseEnter={() => setHoveredIdx(realIdx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                position: 'absolute',
                left: -CARD_W / 2,
                top: 0,
                width: CARD_W,
                border: 'none',
                background: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                transform: `translate(${tx}px, ${ty}px) rotate(${rotate}deg) scale(${scale})`,
                transformOrigin: 'center top',
                zIndex: z,
                opacity,
                transition: 'all 500ms cubic-bezier(0.22, 1, 0.36, 1)',
                pointerEvents: absDiff > 5 ? 'none' : 'auto',
              }}
            >
              <div style={{
                width: CARD_W,
                borderRadius: 16,
                overflow: 'hidden',
                background: '#fff',
                boxShadow: isActive
                  ? '0 16px 48px rgba(0,0,0,0.28), 0 0 0 2px rgba(255,255,255,0.12)'
                  : isHovered
                    ? '0 8px 28px rgba(0,0,0,0.2)'
                    : '0 2px 16px rgba(0,0,0,0.1)',
                transition: 'box-shadow 300ms ease',
              }}>
                <img
                  src={preset.thumbnail}
                  alt={preset.label}
                  style={{ width: '100%', objectFit: 'contain', display: 'block' }}
                  draggable={false}
                />
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 500,
                color: isActive ? '#fff' : isHovered ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.3)',
                transition: 'color 250ms',
                whiteSpace: 'nowrap',
              }}>
                {preset.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
