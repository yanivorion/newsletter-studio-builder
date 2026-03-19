import React from 'react';
import { Copy, Trash2, Image, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStagger } from '../../hooks/useStagger';

const actions = [
  { id: 'duplicate', icon: Copy, label: 'Duplicate section' },
  { id: 'delete', icon: Trash2, label: 'Delete section', danger: true },
  { id: 'color', icon: Image, label: 'Section background' },
  { id: 'up', icon: ChevronUp, label: 'Move up' },
  { id: 'down', icon: ChevronDown, label: 'Move down' },
];

function SectionActionToolbar({
  sectionId,
  sectionType,
  onAction,
  visible,
}) {
  const stagger = useStagger(actions.length, { delay: 30, baseDelay: 40, distance: 6, key: visible ? sectionId : 'hidden' });

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: -80,
        top: 32,
        zIndex: 35,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {/* Type label */}
      <span style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#0f172a',
        lineHeight: 1,
        marginBottom: 4,
        textAlign: 'left',
      }}>
        {sectionType === 'header' ? 'Header' : sectionType === 'footer' ? 'Footer' : 'Section'}
      </span>

      {actions.map((action, i) => (
        <button
          key={action.id}
          onClick={(e) => {
            e.stopPropagation();
            onAction(action.id, sectionId);
          }}
          title={action.label}
          className={cn(
            "btn-spring w-8 h-8 rounded-lg flex items-center justify-center",
            "border border-zinc-200/60",
            action.danger
              ? "bg-white hover:bg-red-50 text-zinc-400 hover:text-red-500 hover:border-red-200"
              : "bg-white hover:bg-zinc-50 text-zinc-400 hover:text-zinc-700"
          )}
          style={{
            ...stagger(i),
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <action.icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
}

export default SectionActionToolbar;
