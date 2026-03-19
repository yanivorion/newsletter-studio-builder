import React, { useState, useRef, useCallback, useEffect } from 'react';

const FONT_STACKS = {
  'Noto Sans Hebrew': "'Noto Sans Hebrew', 'Arial Hebrew', Arial, sans-serif",
  'Poppins': "'Poppins', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Inter': "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Assistant': "'Assistant', 'Arial Hebrew', Arial, sans-serif",
  'Heebo': "'Heebo', 'Arial Hebrew', Arial, sans-serif"
};

function FeatureHighlightSection({
  highlights = [
    {
      image: '',
      title: 'טיפים מאפליקציית Wix',
      description: 'אפשרו לעסקים קטנים לקבל תשלומי Venmo ישירות מהטלפונים של הלקוחות. לאחר חיבור PayPal כספק תשלום, Venmo מופעל אוטומטית בקופה.',
      cta: 'למידע נוסף',
      ctaUrl: '#'
    },
    {
      image: '',
      title: 'מחשבון שכר',
      description: 'קבלו סקירה על הביצועים האונליין של העסק עם דף האנליטיקס החדש. אתם והלקוחות שלכם יכולים לקבל החלטות מבוססות נתונים.',
      cta: 'למידע נוסף',
      ctaUrl: '#'
    },
    {
      image: '',
      title: 'הגשימו את הרעיונות שלכם',
      description: 'כשההשראה מכה, הביאו את הרעיונות שלכם לחיים באמצעות כתיבה. כשההשראה מכה, הביאו את הרעיונות שלכם לחיים.',
      cta: 'למידע נוסף',
      ctaUrl: '#'
    }
  ],
  backgroundColor = '#FFFFFF',
  textColor = '#1D1D1F',
  descColor = '#666666',
  ctaColor = '#1D1D1F',
  fontFamily = 'Noto Sans Hebrew',
  titleFontSize = 20,
  descFontSize = 14,
  imageWidth = 280,
  imageHeight = 200,
  imageFit = 'cover',
  imageRadius = 16,
  paddingVertical = 40,
  paddingHorizontal = 24,
  itemGap = 48,
  alternateLayout = true,
  // RTL support
  textAlign = 'right',
  textDirection = 'rtl',
  // Divider
  dividerBottom = false,
  dividerColor = '#E5E5E5',
  dividerThickness = 1,
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

  const handleKeyDown = useCallback((field, e) => {
    if (e.key === 'Escape') {
      setEditingField(null);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur(field);
    }
  }, [handleBlur]);

  useEffect(() => {
    if (editingField && editRef.current) {
      editRef.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
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
    borderBottom: dividerBottom ? `${dividerThickness}px solid ${dividerColor}` : 'none'
  };

  const itemStyle = (index) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
    marginBottom: index < highlights.length - 1 ? `${itemGap}px` : 0,
    flexDirection: alternateLayout 
      ? (index % 2 === 0 
        ? (textDirection === 'rtl' ? 'row-reverse' : 'row') 
        : (textDirection === 'rtl' ? 'row' : 'row-reverse'))
      : (textDirection === 'rtl' ? 'row-reverse' : 'row')
  });

  const imageContainerStyle = {
    width: `${imageWidth}px`,
    height: `${imageHeight}px`,
    borderRadius: `${imageRadius}px`,
    overflow: 'hidden',
    backgroundColor: '#F0F0F5',
    flexShrink: 0
  };

  const contentStyle = {
    flex: 1,
    textAlign
  };

  const titleStyle = {
    fontSize: `${titleFontSize}px`,
    fontWeight: '600',
    color: textColor,
    margin: '0 0 12px 0',
    lineHeight: 1.3,
    cursor: isSelected ? 'text' : 'default'
  };

  const descStyle = {
    fontSize: `${descFontSize}px`,
    fontWeight: '400',
    color: descColor,
    margin: '0 0 16px 0',
    lineHeight: 1.6,
    cursor: isSelected ? 'text' : 'default'
  };

  const ctaStyle = {
    fontSize: '14px',
    fontWeight: '500',
    color: ctaColor,
    textDecoration: 'underline',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  };

  const editableProps = (field) => ({
    ref: editingField === field ? editRef : null,
    contentEditable: editingField === field,
    suppressContentEditableWarning: true,
    onDoubleClick: (e) => handleDoubleClick(field, e),
    onBlur: () => handleBlur(field),
    onKeyDown: (e) => handleKeyDown(field, e)
  });

  // Image placeholder
  const ImagePlaceholder = () => (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#E8E8ED'
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#B0B0B8" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </div>
  );

  return (
    <div style={containerStyle}>
      {highlights.map((item, index) => (
        <div key={index} style={itemStyle(index)}>
          {/* Image */}
          <div style={imageContainerStyle}>
            {item.image ? (
              <img 
                src={item.image} 
                alt={item.title}
                style={{ width: '100%', height: '100%', objectFit: imageFit }}
              />
            ) : (
              <ImagePlaceholder />
            )}
          </div>
          
          {/* Content */}
          <div style={contentStyle}>
            <h3 
              {...editableProps(`highlight-${index}-title`)}
              style={{
                ...titleStyle,
                outline: editingField === `highlight-${index}-title` ? '2px dashed #04D1FC' : 'none'
              }}
            >
              {item.title}
            </h3>
            
            <p 
              {...editableProps(`highlight-${index}-description`)}
              style={{
                ...descStyle,
                outline: editingField === `highlight-${index}-description` ? '2px dashed #04D1FC' : 'none'
              }}
            >
              {item.description}
            </p>
            
            {item.cta && (
              <a 
                href={item.ctaUrl || '#'}
                {...editableProps(`highlight-${index}-cta`)}
                style={{
                  ...ctaStyle,
                  outline: editingField === `highlight-${index}-cta` ? '2px dashed #04D1FC' : 'none'
                }}
              >
                {item.cta}
                <span>→</span>
              </a>
            )}
          </div>
        </div>
      ))}
      
      {isSelected && !editingField && onTextChange && (
        <div 
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            color: 'rgba(0,0,0,0.4)',
            backgroundColor: 'rgba(255,255,255,0.8)',
            padding: '2px 8px',
            borderRadius: '4px',
            zIndex: 10
          }}
        >
          Double-click to edit
        </div>
      )}
    </div>
  );
}

export default FeatureHighlightSection;

