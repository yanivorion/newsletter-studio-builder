'use client';

import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { X } from 'lucide-react';
import { LAYOUT_PRESETS } from '../blocks/MultiLayoutBlock';

const presetEntries = Object.entries(LAYOUT_PRESETS);
const COUNT = presetEntries.length;
const ANGLE_STEP_DEG = 360 / COUNT;
const ANGLE_STEP_RAD = (2 * Math.PI) / COUNT;
const CARD_W = 210;
const RADIUS_X = 700;
const RADIUS_Z = 260;
const PERSPECTIVE = 1400;
const TILT = -8;
const AUTO_SPEED = 360 / (100 * 1000);
const FRICTION = 0.955;
const LERP = 0.1;

export default function LayoutCarousel({ onSelect, onClose }) {
  const faceElsRef = useRef([]);
  const angleRef = useRef(0);
  const targetAngleRef = useRef(null);
  const lastTimeRef = useRef(0);
  const animFrameRef = useRef(null);
  const isHoveredRef = useRef(false);
  const isDraggingRef = useRef(false);
  const wasDragRef = useRef(false);
  const dragStartRef = useRef({ x: 0, angle: 0 });
  const velocityRef = useRef(0);
  const lastDragXRef = useRef(0);
  const lastDragTimeRef = useRef(0);

  const [isVisible, setIsVisible] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 250);
  }, [onClose]);

  const getIdxFromAngle = useCallback((angle) => {
    const raw = Math.round(-angle / ANGLE_STEP_DEG);
    return ((raw % COUNT) + COUNT) % COUNT;
  }, []);

  const updateFaces = useCallback(() => {
    const rotRad = angleRef.current * Math.PI / 180;
    for (let i = 0; i < COUNT; i++) {
      const el = faceElsRef.current[i];
      if (!el) continue;
      const theta = i * ANGLE_STEP_RAD + rotRad;
      const x = RADIUS_X * Math.sin(theta);
      const z = RADIUS_Z * Math.cos(theta);
      const rotDeg = theta * 180 / Math.PI;
      el.style.transform = `translate3d(${x}px, 0px, ${z}px) rotateY(${rotDeg}deg)`;
    }
  }, []);

  useLayoutEffect(() => {
    updateFaces();
  }, [updateFaces]);

  const snapToNearest = useCallback(() => {
    const snapped = Math.round(angleRef.current / ANGLE_STEP_DEG) * ANGLE_STEP_DEG;
    targetAngleRef.current = snapped;
    setActiveIdx(getIdxFromAngle(snapped));
  }, [getIdxFromAngle]);

  const navigateBy = useCallback((delta) => {
    velocityRef.current = 0;
    const base = targetAngleRef.current !== null ? targetAngleRef.current : angleRef.current;
    const next = Math.round(base / ANGLE_STEP_DEG) * ANGLE_STEP_DEG - delta * ANGLE_STEP_DEG;
    targetAngleRef.current = next;
    setActiveIdx(getIdxFromAngle(next));
  }, [getIdxFromAngle]);

  const navigateToIdx = useCallback((idx) => {
    velocityRef.current = 0;
    const currentSnapped = Math.round(angleRef.current / ANGLE_STEP_DEG) * ANGLE_STEP_DEG;
    const currentIdx = getIdxFromAngle(currentSnapped);
    let diff = idx - currentIdx;
    if (diff > COUNT / 2) diff -= COUNT;
    if (diff < -COUNT / 2) diff += COUNT;
    const next = currentSnapped - diff * ANGLE_STEP_DEG;
    targetAngleRef.current = next;
    setActiveIdx(idx);
  }, [getIdxFromAngle]);

  /* ── Animation loop ── */
  useEffect(() => {
    lastTimeRef.current = performance.now();

    const animate = (time) => {
      const dt = Math.min(time - lastTimeRef.current, 50);
      lastTimeRef.current = time;

      if (isDraggingRef.current) {
        // angle driven by drag handler
      } else if (Math.abs(velocityRef.current) > 0.0003) {
        angleRef.current += velocityRef.current * dt;
        velocityRef.current *= FRICTION;
        if (Math.abs(velocityRef.current) < 0.0003) {
          velocityRef.current = 0;
          snapToNearest();
        }
      } else if (targetAngleRef.current !== null) {
        const diff = targetAngleRef.current - angleRef.current;
        if (Math.abs(diff) < 0.15) {
          angleRef.current = targetAngleRef.current;
          targetAngleRef.current = null;
        } else {
          angleRef.current += diff * LERP;
        }
      } else if (!isHoveredRef.current) {
        angleRef.current -= AUTO_SPEED * dt;
      }

      updateFaces();
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [snapToNearest, updateFaces]);

  /* ── Keyboard ── */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') navigateBy(-1);
      if (e.key === 'ArrowRight') navigateBy(1);
      if (e.key === 'Enter') onSelect?.(presetEntries[activeIdx]?.[0]);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClose, onSelect, activeIdx, navigateBy]);

  /* ── Wheel ── */
  const wheelCooldown = useRef(false);
  const handleWheel = useCallback((e) => {
    if (wheelCooldown.current) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 5) return;
    wheelCooldown.current = true;
    navigateBy(delta > 0 ? 1 : -1);
    setTimeout(() => { wheelCooldown.current = false; }, 200);
  }, [navigateBy]);

  /* ── Drag / touch ── */
  const handlePointerDown = useCallback((e) => {
    if (e.target.closest('[data-close-btn]')) return;
    if (e.button && e.button !== 0) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    isDraggingRef.current = true;
    wasDragRef.current = false;
    velocityRef.current = 0;
    targetAngleRef.current = null;
    dragStartRef.current = { x, angle: angleRef.current };
    lastDragXRef.current = x;
    lastDragTimeRef.current = performance.now();
  }, []);

  useEffect(() => {
    const sensitivity = -0.2;

    const handlePointerMove = (e) => {
      if (!isDraggingRef.current) return;
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const dx = x - dragStartRef.current.x;
      if (Math.abs(dx) > 4) wasDragRef.current = true;

      const now = performance.now();
      const dt = now - lastDragTimeRef.current;
      if (dt > 0) {
        velocityRef.current = ((x - lastDragXRef.current) * sensitivity) / dt;
      }
      lastDragXRef.current = x;
      lastDragTimeRef.current = now;
      angleRef.current = dragStartRef.current.angle + dx * sensitivity;
    };

    const handlePointerUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      if (Math.abs(velocityRef.current) < 0.01) {
        snapToNearest();
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [snapToNearest]);

  return (
    <div
      onWheel={handleWheel}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 250ms ease',
        cursor: 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(6, 6, 10, 0.72)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
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
        transition: 'opacity 350ms ease 80ms',
      }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
          Choose Layout
        </span>
        <button
          data-close-btn
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

      {/* Active layout label */}
      <div style={{
        position: 'absolute',
        bottom: 56,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        textAlign: 'center',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 350ms ease 120ms',
      }}>
        <div style={{
          fontSize: 15, fontWeight: 600, color: '#fff',
          letterSpacing: '-0.01em',
          textShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}>
          {presetEntries[activeIdx]?.[1]?.label}
        </div>
        <div style={{
          fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.35)',
          marginTop: 6, letterSpacing: '0.04em',
        }}>
          Drag to browse · Enter to select
        </div>
      </div>

      {/* 3D Elliptic Scene */}
      <div
        onMouseEnter={() => { isHoveredRef.current = true; }}
        onMouseLeave={() => { isHoveredRef.current = false; lastTimeRef.current = performance.now(); }}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: `${PERSPECTIVE}px`,
          perspectiveOrigin: '50% 46%',
          transform: isVisible ? 'none' : 'translateY(40px)',
          transition: 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Tilt group — only rotateX for the wave arc, no rotateY */}
        <div style={{
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${TILT}deg)`,
        }}>
          {presetEntries.map(([id, preset], i) => {
            const isActive = i === activeIdx;
            const isHovered = i === hoveredIdx;

            return (
              <div
                key={id}
                ref={(el) => { faceElsRef.current[i] = el; }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => {
                  if (wasDragRef.current) return;
                  if (isActive) onSelect?.(id);
                  else navigateToIdx(i);
                }}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  marginLeft: -CARD_W / 2,
                  marginTop: -140,
                  width: CARD_W,
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  borderRadius: 16,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'box-shadow 300ms ease',
                  boxShadow: isActive
                    ? '0 20px 60px rgba(0,0,0,0.45), 0 0 0 2px rgba(255,255,255,0.15)'
                    : isHovered
                      ? '0 12px 40px rgba(0,0,0,0.3)'
                      : '0 4px 20px rgba(0,0,0,0.15)',
                }}
              >
                <div style={{
                  background: '#fff',
                  borderRadius: 16,
                  overflow: 'hidden',
                }}>
                  <img
                    src={preset.thumbnail}
                    alt={preset.label}
                    style={{ width: '100%', objectFit: 'contain', display: 'block' }}
                    draggable={false}
                  />
                </div>
                <div style={{ textAlign: 'center', padding: '10px 8px 6px' }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: isActive ? '#fff' : isHovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)',
                    transition: 'color 250ms',
                    whiteSpace: 'nowrap',
                  }}>
                    {preset.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edge vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 100,
        background: 'radial-gradient(ellipse at center, transparent 45%, rgba(6,6,10,0.55) 100%)',
      }} />
    </div>
  );
}
