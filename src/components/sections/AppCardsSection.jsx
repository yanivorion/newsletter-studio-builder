import React, { useState, useRef, useCallback, useEffect } from 'react';

const FONT_STACKS = {
  'Noto Sans Hebrew': "'Noto Sans Hebrew', 'Arial Hebrew', Arial, sans-serif",
  'Poppins': "'Poppins', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Inter': "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
};

// Icon components - minimalist SVG icons
const IconCart = ({ color = '#22C55E', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="m1 1 4 4h16l-3 9H7L3 3" />
  </svg>
);

const IconImage = ({ color = '#5856D6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const IconReturn = ({ color = '#EC4899', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6 2.3L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const IconStar = ({ color = '#F59E0B', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconSettings = ({ color = '#6366F1', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// Generic placeholder icon
const IconPlaceholder = ({ color = '#86868B', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 9h6v6H9z" />
  </svg>
);

const ICON_MAP = {
  'cart': IconCart,
  'image': IconImage,
  'return': IconReturn,
  'star': IconStar,
  'settings': IconSettings,
  'placeholder': IconPlaceholder,
};

function AppCardsSection({
  title = 'אפליקציות ואינטגרציות חדשות',
  cards = [
    {
      iconType: 'cart',
      iconBg: '#E8FFE8',
      iconColor: '#22C55E',
      name: 'הזמנות חכמות',
      underlineColor: '#FF6B6B',
      description: 'לקוחות יכולים להגדיר כללי כמות למוצרים ספציפיים או לקולקציות שלמות.',
      linkText: 'בדוק את זה',
      linkUrl: '#'
    },
    {
      iconType: 'image',
      iconBg: '#E8E0FF',
      iconColor: '#5856D6',
      name: 'תמונות מוצר AI',
      underlineColor: '#5856D6',
      description: 'השתמש ב-AI כדי למקם מוצרים על כל רקע וליצור תמונות סטודיו.',
      linkText: 'בדוק את זה',
      linkUrl: '#'
    },
    {
      iconType: 'return',
      iconBg: '#FFE8F0',
      iconColor: '#EC4899',
      name: 'ניהול החזרות',
      underlineColor: '#5856D6',
      description: 'הפוך את תהליך ההחזרה לקל ללקוחות עם דשבורד אחד.',
      linkText: 'בדוק את זה',
      linkUrl: '#'
    }
  ],
  columns = 3,
  backgroundColor = '#F5F5F7',
  cardBackgroundColor = '#FFFFFF',
  textColor = '#1D1D1F',
  descriptionColor = '#86868B',
  linkColor = '#5856D6',
  fontFamily = 'Noto Sans Hebrew',
  titleFontSize = 28,
  nameFontSize = 14,
  descFontSize = 14,
  iconSize = 48,
  paddingVertical = 48,
  paddingHorizontal = 24,
  gap = 16,
  cardPadding = 16,
  cardBorderRadius = 8,
  showBorder = true,
  textAlign = 'right',
  textDirection = 'rtl',
  // Inline editing
  isSelected = false,
  onTextChange
}) {
  const fontStack = FONT_STACKS[fontFamily] || FONT_STACKS['Noto Sans Hebrew'];
  const [editingField, setEditingField] = useState(null);
  const editRef = useRef(null);

  const handleDoubleClick = useCallback((field, e) => {
    if (!onTextChange) return;
    e.stopPropagation();
    setEditingField(field);
  }, [onTextChange]);

  const handleBlur = useCallback((field) => {
    if (editRef.current && onTextChange) {
      const newValue = editRef.current.innerText.trim();
      onTextChange(field, newValue);
    }
    setEditingField(null);
  }, [onTextChange]);

  useEffect(() => {
    if (editingField && editRef.current) {
      editRef.current.focus();
    }
  }, [editingField]);

  useEffect(() => {
    if (!isSelected) setEditingField(null);
  }, [isSelected]);

  const containerStyle = {
    backgroundColor,
    padding: `${paddingVertical}px ${paddingHorizontal}px`,
    fontFamily: fontStack,
    direction: textDirection,
  };

  const titleStyle = {
    fontSize: `${titleFontSize}px`,
    fontWeight: '600',
    color: textColor,
    margin: 0,
    marginBottom: '24px',
    textAlign,
    cursor: isSelected ? 'text' : 'default',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap}px`,
  };

  const cardStyle = {
    backgroundColor: cardBackgroundColor,
    borderRadius: `${cardBorderRadius}px`,
    padding: `${cardPadding}px`,
    border: showBorder ? '1px solid #E5E5E7' : 'none',
    textAlign,
  };

  const iconContainerStyle = (bg) => ({
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    borderRadius: '12px',
    backgroundColor: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  });

  const nameContainerStyle = {
    marginBottom: '12px',
  };

  const nameStyle = {
    fontSize: `${nameFontSize}px`,
    fontWeight: '400',
    color: descriptionColor,
    margin: 0,
    marginBottom: '4px',
    cursor: isSelected ? 'text' : 'default',
  };

  const underlineStyle = (color) => ({
    height: '3px',
    backgroundColor: color,
    borderRadius: '2px',
    width: '60px',
  });

  const descStyle = {
    fontSize: `${descFontSize}px`,
    fontWeight: '400',
    color: textColor,
    margin: 0,
    marginBottom: '12px',
    lineHeight: 1.5,
    cursor: isSelected ? 'text' : 'default',
  };

  const linkStyle = {
    fontSize: `${descFontSize}px`,
    fontWeight: '500',
    color: linkColor,
    textDecoration: 'underline',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    cursor: isSelected ? 'text' : 'pointer',
  };

  const editableProps = (field) => ({
    ref: editingField === field ? editRef : null,
    contentEditable: editingField === field,
    suppressContentEditableWarning: true,
    onDoubleClick: (e) => handleDoubleClick(field, e),
    onBlur: () => handleBlur(field),
  });

  const renderIcon = (card) => {
    const IconComponent = ICON_MAP[card.iconType] || IconPlaceholder;
    return <IconComponent color={card.iconColor || '#5856D6'} size={iconSize * 0.5} />;
  };

  return (
    <div style={containerStyle}>
      {title && (
        <h2 
          {...editableProps('title')}
          style={{
            ...titleStyle,
            outline: editingField === 'title' ? '2px dashed #04D1FC' : 'none',
          }}
        >
          {title}
        </h2>
      )}

      <div style={gridStyle}>
        {cards.map((card, index) => (
          <div key={index} style={cardStyle}>
            <div style={iconContainerStyle(card.iconBg)}>
              {renderIcon(card)}
            </div>
            <div style={nameContainerStyle}>
              <p 
                {...editableProps(`card-${index}-name`)}
                style={{
                  ...nameStyle,
                  outline: editingField === `card-${index}-name` ? '2px dashed #04D1FC' : 'none',
                }}
              >
                {card.name}
              </p>
              <div style={underlineStyle(card.underlineColor)} />
            </div>
            <p 
              {...editableProps(`card-${index}-description`)}
              style={{
                ...descStyle,
                outline: editingField === `card-${index}-description` ? '2px dashed #04D1FC' : 'none',
              }}
            >
              {card.description}
            </p>
            <a 
              {...editableProps(`card-${index}-linkText`)}
              style={{
                ...linkStyle,
                outline: editingField === `card-${index}-linkText` ? '2px dashed #04D1FC' : 'none',
              }}
              href={editingField ? undefined : card.linkUrl}
            >
              {card.linkText}
              <span>→</span>
            </a>
          </div>
        ))}
      </div>
      
      {isSelected && !editingField && onTextChange && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '10px',
          color: 'rgba(0,0,0,0.4)',
          backgroundColor: 'rgba(255,255,255,0.8)',
          padding: '2px 8px',
          borderRadius: '4px',
        }}>
          Double-click to edit
        </div>
      )}
    </div>
  );
}

export default AppCardsSection;
