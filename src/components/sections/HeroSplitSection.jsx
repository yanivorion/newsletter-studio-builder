import React, { useState, useRef, useCallback, useEffect } from 'react';

const FONT_STACKS = {
  'Noto Sans Hebrew': "'Noto Sans Hebrew', 'Arial Hebrew', Arial, sans-serif",
  'Poppins': "'Poppins', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Inter': "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
};

function HeroSplitSection({
  headline = 'היי,\nיוצרים',
  description = 'אנחנו יודעים שהזמן שלכם יקר. לכן אנחנו מקלים עליכם ללמוד מיומנויות חדשות, מהר יותר. מציגים סדרה חדשה של מדריכים קצרים עם טיפים מעשיים, רעיונות יצירתיים ודוגמאות אמיתיות.',
  linkText = 'צפו עכשיו',
  linkUrl = '#',
  image = '',
  imageHeight = 400,
  imageFit = 'cover',
  imagePosition = 'top',
  backgroundColor = '#F5F5F7',
  textColor = '#1D1D1F',
  linkColor = '#5856D6',
  fontFamily = 'Noto Sans Hebrew',
  headlineFontSize = 48,
  descFontSize = 16,
  paddingVertical = 48,
  paddingHorizontal = 24,
  gap = 48,
  headlinePosition = 'left',
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
    fontFamily: fontStack,
    direction: textDirection,
  };

  const imageContainerStyle = {
    width: '100%',
    height: `${imageHeight}px`,
    backgroundColor: '#E5E5E7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const contentStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: `${gap}px`,
    padding: `${paddingVertical}px ${paddingHorizontal}px`,
    alignItems: 'flex-start',
  };

  const headlineStyle = {
    fontSize: `${headlineFontSize}px`,
    fontWeight: '700',
    color: textColor,
    margin: 0,
    lineHeight: 1.1,
    whiteSpace: 'pre-wrap',
    textAlign: textDirection === 'rtl' ? 'right' : 'left',
    cursor: isSelected ? 'text' : 'default',
  };

  const descContainerStyle = {
    textAlign,
  };

  const descStyle = {
    fontSize: `${descFontSize}px`,
    fontWeight: '400',
    color: textColor,
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

  const headlineContent = (
    <h2 
      {...editableProps('headline')}
      style={{
        ...headlineStyle,
        outline: editingField === 'headline' ? '2px dashed #04D1FC' : 'none',
      }}
    >
      {headline}
    </h2>
  );

  const descriptionContent = (
    <div style={descContainerStyle}>
      <p 
        {...editableProps('description')}
        style={{
          ...descStyle,
          outline: editingField === 'description' ? '2px dashed #04D1FC' : 'none',
        }}
      >
        {description}
      </p>
      <a 
        {...editableProps('linkText')}
        style={{
          ...linkStyle,
          outline: editingField === 'linkText' ? '2px dashed #04D1FC' : 'none',
        }}
        href={editingField ? undefined : linkUrl}
      >
        {linkText}
        <span>→</span>
      </a>
    </div>
  );

  return (
    <div style={containerStyle}>
      {imagePosition === 'top' && (
        <div style={imageContainerStyle}>
          {image ? (
            <img 
              src={image} 
              alt=""
              style={{ width: '100%', height: '100%', objectFit: imageFit }}
            />
          ) : (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          )}
        </div>
      )}

      <div style={contentStyle}>
        {textDirection === 'rtl' ? (
          <>
            {descriptionContent}
            {headlineContent}
          </>
        ) : headlinePosition === 'left' ? (
          <>
            {headlineContent}
            {descriptionContent}
          </>
        ) : (
          <>
            {descriptionContent}
            {headlineContent}
          </>
        )}
      </div>

      {imagePosition === 'bottom' && (
        <div style={imageContainerStyle}>
          {image ? (
            <img 
              src={image} 
              alt=""
              style={{ width: '100%', height: '100%', objectFit: imageFit }}
            />
          ) : (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          )}
        </div>
      )}
      
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

export default HeroSplitSection;

