import React, { useState, useRef, useCallback, useEffect } from 'react';

const FONT_STACKS = {
  'Noto Sans Hebrew': "'Noto Sans Hebrew', 'Arial Hebrew', Arial, sans-serif",
  'Poppins': "'Poppins', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Inter': "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
};

// Icon components - minimalist SVG icons
const IconBox = ({ color = '#5856D6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
  </svg>
);

const IconCreditCard = ({ color = '#5856D6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IconPlay = ({ color = '#FF6B6B', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" fill={color} opacity="0.2" />
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

// Generic placeholder icon
const IconPlaceholder = ({ color = '#86868B', size = 24, bgColor = '#E5E5E5' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="3" fill={bgColor} opacity="0.5" />
    <path d="M8 17l3-4 2 2 3-4 4 6H4z" fill={color} opacity="0.6" />
    <circle cx="8.5" cy="8.5" r="1.5" fill={color} opacity="0.6" />
  </svg>
);

const ICON_MAP = {
  'box': IconBox,
  'credit-card': IconCreditCard,
  'play': IconPlay,
  'placeholder': IconPlaceholder,
};

function UpdatesListSection({
  title = 'מה עוד חדש?',
  headerLinkText = 'כל העדכונים',
  headerLinkUrl = '#',
  items = [
    {
      iconBg: '#E8E0FF',
      iconColor: '#5856D6',
      iconType: 'box',
      title: 'מוצרים לפי דרישה',
      description: 'לקוחות יכולים ליצור מיידית קולקציית מוצרים שלמה שמתאימה למותג שלהם.',
      linkText: 'למד עוד',
      linkUrl: '#'
    },
    {
      iconBg: '#E0E8FF',
      iconColor: '#5856D6',
      iconType: 'credit-card',
      title: 'קישורי תשלום אוטומטיים',
      description: 'אפשר קישורי תשלום אוטומטיים כדי שמבקרים יוכלו לשלם ישירות מהמייל.',
      linkText: 'למד עוד',
      linkUrl: '#'
    },
    {
      iconBg: '#FFE8E0',
      iconColor: '#FF6B6B',
      iconType: 'play',
      title: 'השקת מוצר ביוטיוב',
      description: 'מוכרים יכולים כעת להגדיר תאריך פרסום למוצרים ביוטיוב.',
      linkText: 'למד עוד',
      linkUrl: '#'
    }
  ],
  backgroundColor = '#F5F5F7',
  textColor = '#1D1D1F',
  descriptionColor = '#86868B',
  linkColor = '#5856D6',
  dividerColor = '#D2D2D7',
  fontFamily = 'Noto Sans Hebrew',
  titleFontSize = 28,
  itemTitleFontSize = 16,
  descFontSize = 14,
  paddingVertical = 48,
  paddingHorizontal = 24,
  itemPadding = 20,
  iconSize = 48,
  showDividers = true,
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

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: showDividers ? `1px solid ${dividerColor}` : 'none',
  };

  const titleStyle = {
    fontSize: `${titleFontSize}px`,
    fontWeight: '600',
    color: textColor,
    margin: 0,
    cursor: isSelected ? 'text' : 'default',
  };

  const headerLinkStyle = {
    fontSize: `${descFontSize}px`,
    fontWeight: '500',
    color: linkColor,
    textDecoration: 'underline',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    cursor: isSelected ? 'text' : 'pointer',
  };

  const itemStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: `${itemPadding}px 0`,
    borderBottom: showDividers ? `1px solid ${dividerColor}` : 'none',
    flexDirection: textDirection === 'rtl' ? 'row-reverse' : 'row',
  };

  const iconContainerStyle = (bg) => ({
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    borderRadius: '8px',
    backgroundColor: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  });

  const itemContentStyle = {
    flex: 1,
    textAlign,
  };

  const itemTitleStyle = {
    fontSize: `${itemTitleFontSize}px`,
    fontWeight: '600',
    color: textColor,
    margin: 0,
    marginBottom: '4px',
    cursor: isSelected ? 'text' : 'default',
  };

  const itemDescStyle = {
    fontSize: `${descFontSize}px`,
    color: descriptionColor,
    margin: 0,
    marginBottom: '8px',
    lineHeight: 1.5,
    cursor: isSelected ? 'text' : 'default',
  };

  const itemLinkStyle = {
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

  const renderIcon = (item) => {
    const IconComponent = ICON_MAP[item.iconType] || IconPlaceholder;
    return <IconComponent color={item.iconColor || '#5856D6'} size={iconSize * 0.5} />;
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 
          {...editableProps('title')}
          style={{
            ...titleStyle,
            outline: editingField === 'title' ? '2px dashed #04D1FC' : 'none',
          }}
        >
          {title}
        </h2>
        <a 
          {...editableProps('headerLinkText')}
          style={{
            ...headerLinkStyle,
            outline: editingField === 'headerLinkText' ? '2px dashed #04D1FC' : 'none',
          }}
          href={editingField ? undefined : headerLinkUrl}
        >
          {headerLinkText}
          <span>→</span>
        </a>
      </div>

      <div>
        {items.map((item, index) => (
          <div 
            key={index} 
            style={{
              ...itemStyle,
              borderBottom: (showDividers && index < items.length - 1) ? `1px solid ${dividerColor}` : 'none',
            }}
          >
            <div style={iconContainerStyle(item.iconBg)}>
              {renderIcon(item)}
            </div>
            <div style={itemContentStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: textDirection === 'rtl' ? 'row-reverse' : 'row' }}>
                <div style={{ flex: 1 }}>
                  <h3 
                    {...editableProps(`item-${index}-title`)}
                    style={{
                      ...itemTitleStyle,
                      outline: editingField === `item-${index}-title` ? '2px dashed #04D1FC' : 'none',
                    }}
                  >
                    {item.title}
                  </h3>
                  <p 
                    {...editableProps(`item-${index}-description`)}
                    style={{
                      ...itemDescStyle,
                      outline: editingField === `item-${index}-description` ? '2px dashed #04D1FC' : 'none',
                    }}
                  >
                    {item.description}
                  </p>
                </div>
                <a 
                  {...editableProps(`item-${index}-linkText`)}
                  style={{
                    ...itemLinkStyle,
                    outline: editingField === `item-${index}-linkText` ? '2px dashed #04D1FC' : 'none',
                  }}
                  href={editingField ? undefined : item.linkUrl}
                >
                  {item.linkText}
                  <span>→</span>
                </a>
              </div>
            </div>
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

export default UpdatesListSection;
