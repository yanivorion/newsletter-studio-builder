'use client';

import React, { useState } from 'react';
import { Palette, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Brand colors
const THEME_COLORS = {
  primary: [
    { name: 'Cyan', color: '#04D1FC' },
    { name: 'Teal', color: '#17A298' },
    { name: 'Dark', color: '#120F0F' },
    { name: 'White', color: '#FFFFFF' },
  ],
  accents: [
    { name: 'Coral', color: '#FF6B6B' },
    { name: 'Gold', color: '#FFD93D' },
    { name: 'Purple', color: '#6C5CE7' },
    { name: 'Green', color: '#00B894' },
  ],
  greys: [
    { name: 'Light', color: '#F5F5F5' },
    { name: 'Medium', color: '#9CA3AF' },
    { name: 'Dark Grey', color: '#4B5563' },
    { name: 'Charcoal', color: '#1F2937' },
  ],
};

// Gradients
const GRADIENTS = [
  { name: 'Ocean', start: '#04D1FC', end: '#17A298' },
  { name: 'Sunset', start: '#FF6B6B', end: '#FFD93D' },
  { name: 'Purple', start: '#6C5CE7', end: '#a29bfe' },
  { name: 'Dark', start: '#1F2937', end: '#4B5563' },
];

function FloatingThemeBar({ onSelectColor, onSelectGradient, selectedSection }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorClick = (color) => {
    onSelectColor?.(color);
  };

  const handleGradientClick = (start, end) => {
    onSelectGradient?.(start, end);
  };

  return (
    <div className="absolute bottom-4 left-4 z-40">
      {/* Collapsed State - Floating Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-zinc-200 transition-all",
          "hover:shadow-xl",
          isOpen && "rounded-b-none rounded-t-2xl border-b-0"
        )}
      >
        <Palette className="w-4 h-4 text-zinc-500" />
        <span className="text-xs font-medium text-zinc-600">Theme</span>
        <ChevronDown className={cn("w-3 h-3 text-zinc-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-0 w-[240px] bg-white/95 backdrop-blur-sm rounded-t-2xl rounded-br-2xl shadow-xl border border-zinc-200 border-b-0 p-3 space-y-3">
          {/* Primary Colors */}
          <div>
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Primary</span>
            <div className="flex gap-2 mt-1.5">
              {THEME_COLORS.primary.map(({ name, color }) => (
                <button
                  key={color}
                  onClick={() => handleColorClick(color)}
                  className="group relative"
                  title={name}
                >
                  <div
                    className="w-10 h-10 rounded-lg border-2 border-zinc-200 hover:border-zinc-400 transition-all shadow-sm hover:scale-105"
                    style={{ backgroundColor: color }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Accent Colors */}
          <div>
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Accents</span>
            <div className="flex gap-2 mt-1.5">
              {THEME_COLORS.accents.map(({ name, color }) => (
                <button
                  key={color}
                  onClick={() => handleColorClick(color)}
                  className="group relative"
                  title={name}
                >
                  <div
                    className="w-10 h-10 rounded-lg border-2 border-zinc-200 hover:border-zinc-400 transition-all shadow-sm hover:scale-105"
                    style={{ backgroundColor: color }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Gradients */}
          <div>
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Gradients</span>
            <div className="flex gap-2 mt-1.5">
              {GRADIENTS.map(({ name, start, end }) => (
                <button
                  key={name}
                  onClick={() => handleGradientClick(start, end)}
                  className="group relative"
                  title={name}
                >
                  <div
                    className="w-10 h-10 rounded-lg border-2 border-zinc-200 hover:border-zinc-400 transition-all shadow-sm hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${start}, ${end})` }}
                  />
                </button>
              ))}
            </div>
          </div>

          {selectedSection && (
            <p className="text-[10px] text-zinc-400 pt-2 border-t border-zinc-100">
              Applies to selected section
            </p>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default FloatingThemeBar;
