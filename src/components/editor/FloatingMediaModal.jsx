import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import MediaKitPanel from './MediaKitPanel';

function FloatingMediaModal({ open, onClose, onSelectLogo, onBulkUpload, anchorRect }) {
  const modalRef = useRef(null);

  const handleClickOutside = useCallback((e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, handleClickOutside, onClose]);

  if (!open) return null;

  const style = {
    position: 'fixed',
    zIndex: 100,
    width: 320,
    maxHeight: '70vh',
    overflowY: 'auto',
    background: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.48)',
    borderRadius: 16,
    boxShadow: '0 24px 64px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.55)',
  };

  if (anchorRect) {
    style.top = anchorRect.top;
    style.left = anchorRect.right + 12;
    const viewW = typeof window !== 'undefined' ? window.innerWidth : 1400;
    if (style.left + 320 > viewW - 20) {
      style.left = anchorRect.left - 320 - 12;
    }
  } else {
    style.top = 80;
    style.right = 340;
  }

  return (
    <div ref={modalRef} style={style} className="content-enter">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
          Media Assets
        </span>
        <button
          onClick={onClose}
          className="btn-spring w-6 h-6 rounded-md flex items-center justify-center hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <MediaKitPanel onSelectLogo={onSelectLogo} onBulkUpload={onBulkUpload} />
    </div>
  );
}

export default FloatingMediaModal;
