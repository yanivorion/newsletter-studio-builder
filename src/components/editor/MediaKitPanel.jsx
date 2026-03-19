import React, { useState, useRef } from 'react';
import { Image, Copy, Check, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { mediaKit, getLogosByCategory } from '../../lib/mediaKit';
import { useStagger } from '../../hooks/useStagger';
import { cn } from '../../lib/utils';

function MediaKitPanel({ onSelectLogo, onBulkUpload }) {
  const [copiedId, setCopiedId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const fileInputRef = useRef(null);

  const handleCopy = async (logo) => {
    await navigator.clipboard.writeText(logo.url);
    setCopiedId(logo.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelect = (logo) => {
    onSelectLogo?.(logo.url, logo);
  };

  const filteredLogos = getLogosByCategory(activeCategory);
  const logoStagger = useStagger(filteredLogos.length, { delay: 50, baseDelay: 60, distance: 10, key: activeCategory });

  return (
    <div className="p-4 space-y-4 content-enter">
      <div className="flex items-center gap-2">
        <Image className="w-4 h-4 text-zinc-500" />
        <Label className="text-xs uppercase tracking-[0.08em] text-zinc-500">Media Kit</Label>
      </div>

      <p className="text-xs text-zinc-400">
        Click to use, or upload to fill empty spots.
      </p>

      {/* Bulk Upload */}
      {onBulkUpload && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 0) {
                const urls = files.map((f) => URL.createObjectURL(f));
                onBulkUpload(urls);
              }
              e.target.value = '';
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-zinc-300 hover:border-[#04D1FC] hover:bg-[#04D1FC]/5 text-zinc-500 hover:text-[#04D1FC] transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="text-[11px] font-medium">Upload images to fill spots</span>
          </button>
        </>
      )}

      {/* Category Filter */}
      <div className="flex gap-1.5 flex-wrap">
        {mediaKit.categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "pill-transition px-2.5 py-1 rounded-full text-[10px] font-medium",
              activeCategory === cat.id 
                ? "bg-zinc-900 text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]" 
                : "bg-zinc-100/80 text-zinc-500 hover:bg-zinc-200/80 hover:text-zinc-700"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Logos Grid */}
      <div className="grid grid-cols-2 gap-2">
        {filteredLogos.map((logo, i) => (
          <div 
            key={logo.id}
            className="media-card group relative rounded-xl border border-zinc-200/60 p-2 hover:border-[#04D1FC]/40 cursor-pointer bg-white overflow-hidden"
            style={logoStagger(i)}
            onClick={() => handleSelect(logo)}
          >
            {/* Logo Preview */}
            <div className={cn(
              "h-14 flex items-center justify-center rounded-lg overflow-hidden",
              logo.isWhite ? "bg-zinc-800" : "bg-zinc-50"
            )}>
              <img 
                src={logo.url} 
                alt={logo.name}
                className="max-w-full max-h-full object-contain"
                loading="lazy"
                crossOrigin="anonymous"
                style={{ transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)' }}
              />
            </div>
            
            {/* Logo Name */}
            <p className="text-[9px] text-center mt-1.5 truncate text-zinc-500 font-medium">
              {logo.name}
            </p>

            {/* Category Badge */}
            <div className="absolute top-1 right-1">
              <span className={cn(
                "px-1 py-0.5 text-[7px] font-medium rounded",
                logo.category === 'primary' ? "bg-blue-50 text-blue-500" :
                "bg-purple-50 text-purple-500"
              )}>
                {logo.category}
              </span>
            </div>

            {/* Hover ring */}
            <div 
              className="absolute inset-0 rounded-xl border-2 border-[#04D1FC] opacity-0 group-hover:opacity-100 pointer-events-none"
              style={{ transition: 'opacity 200ms cubic-bezier(0.22, 1, 0.36, 1)' }}
            />
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="pt-3 border-t border-zinc-100/60 space-y-2">
        <p className="text-[10px] text-zinc-400 text-center">
          {filteredLogos.length} logo{filteredLogos.length !== 1 ? 's' : ''} • Click to use
        </p>
      </div>
    </div>
  );
}

export default MediaKitPanel;
