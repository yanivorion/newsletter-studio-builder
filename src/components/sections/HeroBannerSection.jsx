import React, { useState, useRef, useCallback, useEffect } from 'react';

const FONT_STACKS = {
  'Noto Sans Hebrew': "'Noto Sans Hebrew', 'Arial Hebrew', Arial, sans-serif",
  'Poppins': "'Poppins', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Inter': "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Assistant': "'Assistant', 'Arial Hebrew', Arial, sans-serif",
  'Heebo': "'Heebo', 'Arial Hebrew', Arial, sans-serif"
};

function HeroBannerSection({
  title = 'THE SYNC',
  subtitle = '',
  image = '',
  imageFit = 'cover',
  imageHeight = 400,
  titleFontSize = 120,
  titleFontWeight = '900',
  titleLetterSpacing = '-0.02em',
  subtitleFontSize = 16,
  backgroundColor = '#F5F5F7',
  textColor = '#1D1D1F',
  subtitleColor = '#666666',
  fontFamily = 'Noto Sans Hebrew',
  paddingTop = 32,
  paddingBottom = 32,
  paddingHorizontal = 24,
  titlePosition = 'top', // 'top', 'overlay', 'bottom'
  // RTL support
  textAlign = 'center',
  textDirection = 'ltr',
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

  const hasTitle = title && title.trim().length > 0;
  const hasSubtitle = subtitle && subtitle.trim().length > 0;
  const hasImage = image && image.trim().length > 0;

  const containerStyle = {
    backgroundColor,
    paddingLeft: `${paddingHorizontal}px`,
    paddingRight: `${paddingHorizontal}px`,
    fontFamily: fontStack,
    direction: textDirection,
    borderBottom: dividerBottom ? `${dividerThickness}px solid ${dividerColor}` : 'none'
  };

  const titleStyle = {
    fontSize: `${titleFontSize}px`,
    fontWeight: titleFontWeight,
    color: textColor,
    margin: 0,
    letterSpacing: titleLetterSpacing,
    lineHeight: 1,
    textAlign,
    cursor: isSelected ? 'text' : 'default'
  };

  const subtitleStyle = {
    fontSize: `${subtitleFontSize}px`,
    fontWeight: '400',
    color: subtitleColor,
    margin: '16px 0 0 0',
    lineHeight: 1.5,
    textAlign,
    cursor: isSelected ? 'text' : 'default'
  };

  const imageContainerStyle = {
    width: '100%',
    height: `${imageHeight}px`,
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#E8E8ED',
    position: titlePosition === 'overlay' ? 'relative' : 'static'
  };

  const overlayTitleStyle = {
    ...titleStyle,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#FFFFFF',
    textShadow: '0 2px 20px rgba(0,0,0,0.3)',
    zIndex: 2
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
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#B0B0B8" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </div>
  );

  return (
    <div style={containerStyle}>
      {/* Top padding */}
      <div style={{ height: `${paddingTop}px` }} />
      
      {/* Title at top */}
      {titlePosition === 'top' && (hasTitle || isSelected) && (
        <h1 
          {...editableProps('title')}
          style={{
            ...titleStyle,
            marginBottom: (hasImage || isSelected) ? '24px' : 0,
            outline: editingField === 'title' ? '2px dashed #04D1FC' : 'none'
          }}
        >
          {title || (isSelected ? 'TITLE' : '')}
        </h1>
      )}
      
      {/* Image */}
      {(hasImage || isSelected) && (
        <div style={imageContainerStyle}>
          {hasImage ? (
            <img 
              src={image}
              alt={title}
              style={{ width: '100%', height: '100%', objectFit: imageFit }}
            />
          ) : (
            <ImagePlaceholder />
          )}
          
          {/* Overlay title */}
          {titlePosition === 'overlay' && (hasTitle || isSelected) && (
            <h1 
              {...editableProps('title')}
              style={{
                ...overlayTitleStyle,
                outline: editingField === 'title' ? '2px dashed #04D1FC' : 'none'
              }}
            >
              {title || (isSelected ? 'TITLE' : '')}
            </h1>
          )}
        </div>
      )}
      
      {/* Title at bottom */}
      {titlePosition === 'bottom' && (hasTitle || isSelected) && (
        <h1 
          {...editableProps('title')}
          style={{
            ...titleStyle,
            marginTop: (hasImage || isSelected) ? '24px' : 0,
            outline: editingField === 'title' ? '2px dashed #04D1FC' : 'none'
          }}
        >
          {title || (isSelected ? 'TITLE' : '')}
        </h1>
      )}
      
      {/* Subtitle */}
      {(hasSubtitle || isSelected) && (
        <p 
          {...editableProps('subtitle')}
          style={{
            ...subtitleStyle,
            outline: editingField === 'subtitle' ? '2px dashed #04D1FC' : 'none'
          }}
        >
          {subtitle || (isSelected ? 'כתוביות...' : '')}
        </p>
      )}
      
      {/* Bottom padding */}
      <div style={{ height: `${paddingBottom}px` }} />
      
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

export default HeroBannerSection;

