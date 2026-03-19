import React, { useState, useRef, useCallback, useEffect } from 'react';

const FONT_STACKS = {
  'Noto Sans Hebrew': "'Noto Sans Hebrew', 'Arial Hebrew', Arial, sans-serif",
  'Poppins': "'Poppins', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Inter': "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
};

function AlternatingSection({
  rows = [
    {
      image: '',
      title: 'טיפים מאפליקציה',
      description: 'אפשר ללקוחות לקבל תשלומים ישירות מהטלפון. לאחר חיבור לספק תשלומים, התשלום מופעל אוטומטית.',
      linkText: 'למד עוד',
      linkUrl: '#'
    },
    {
      image: '',
      title: 'מחשבון שכר',
      description: 'קבל סקירה כללית של הביצועים העסקיים עם דף האנליטיקס החדש. אתה והלקוחות שלך יכולים לקבל החלטות מבוססות נתונים.',
      linkText: 'למד עוד',
      linkUrl: '#'
    },
    {
      image: '',
      title: 'הגשם את הרעיונות שלך',
      description: 'כשהשראה מכה, תעד את הרעיונות שלך בכתיבה והשראה מכה, תעד את הרעיונות שלך בכתיבה והשראה מכה.',
      linkText: 'למד עוד',
      linkUrl: '#'
    }
  ],
  imageWidth = '45%',
  imageHeight = 250,
  imageFit = 'cover',
  imageBorderRadius = 12,
  backgroundColor = '#FFFFFF',
  textColor = '#1D1D1F',
  descriptionColor = '#86868B',
  linkColor = '#1D1D1F',
  fontFamily = 'Noto Sans Hebrew',
  titleFontSize = 20,
  descFontSize = 14,
  paddingVertical = 32,
  paddingHorizontal = 24,
  rowGap = 48,
  startImagePosition = 'left',
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

  const rowStyle = (index) => {
    const isImageLeft = (startImagePosition === 'left' && index % 2 === 0) || 
                        (startImagePosition === 'right' && index % 2 === 1);
    
    // For RTL, reverse the logic
    const actualImageLeft = textDirection === 'rtl' ? !isImageLeft : isImageLeft;
    
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '32px',
      marginBottom: index < rows.length - 1 ? `${rowGap}px` : 0,
      flexDirection: actualImageLeft ? 'row' : 'row-reverse',
    };
  };

  const imageContainerStyle = {
    width: imageWidth,
    height: `${imageHeight}px`,
    borderRadius: `${imageBorderRadius}px`,
    backgroundColor: '#F0F0F5',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const contentStyle = {
    flex: 1,
    textAlign,
  };

  const titleStyle = {
    fontSize: `${titleFontSize}px`,
    fontWeight: '600',
    color: textColor,
    margin: 0,
    marginBottom: '12px',
    lineHeight: 1.3,
    cursor: isSelected ? 'text' : 'default',
  };

  const descStyle = {
    fontSize: `${descFontSize}px`,
    fontWeight: '400',
    color: descriptionColor,
    margin: 0,
    marginBottom: '16px',
    lineHeight: 1.6,
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

  return (
    <div style={containerStyle}>
      {rows.map((row, index) => (
        <div key={index} style={rowStyle(index)}>
          <div style={imageContainerStyle}>
            {row.image ? (
              <img 
                src={row.image} 
                alt={row.title}
                style={{ width: '100%', height: '100%', objectFit: imageFit }}
              />
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" strokeWidth="1">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            )}
          </div>
          <div style={contentStyle}>
            <h3 
              {...editableProps(`row-${index}-title`)}
              style={{
                ...titleStyle,
                outline: editingField === `row-${index}-title` ? '2px dashed #04D1FC' : 'none',
              }}
            >
              {row.title}
            </h3>
            <p 
              {...editableProps(`row-${index}-description`)}
              style={{
                ...descStyle,
                outline: editingField === `row-${index}-description` ? '2px dashed #04D1FC' : 'none',
              }}
            >
              {row.description}
            </p>
            <a 
              {...editableProps(`row-${index}-linkText`)}
              style={{
                ...linkStyle,
                outline: editingField === `row-${index}-linkText` ? '2px dashed #04D1FC' : 'none',
              }}
              href={editingField ? undefined : row.linkUrl}
            >
              {row.linkText}
              <span>→</span>
            </a>
          </div>
        </div>
      ))}
      
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

export default AlternatingSection;

