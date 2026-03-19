import React, { useState, useRef, useCallback, useEffect } from 'react';

const FONT_STACKS = {
  'Noto Sans Hebrew': "'Noto Sans Hebrew', 'Arial Hebrew', Arial, sans-serif",
  'Poppins': "'Poppins', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Inter': "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
};

function CelebrationSection({
  badgeText = 'ילידי נובמבר',
  badgeColor = '#04D1FC',
  badgeTextColor = '#FFFFFF',
  names = 'אולג יודקביץ, אלדר בלנק, אסטבן ספולבדה אוליבה,\nדור הופמן, דין מרקוס, יניב אליהו ורועי גלבוע...',
  message = 'מזל טוב! מי ייתן וכל משאלות ליבכם יתגשמו:)',
  accentColor = '#FF6B6B',
  accentWidth = 4,
  backgroundColor = '#FFFFFF',
  textColor = '#333333',
  fontFamily = 'Noto Sans Hebrew',
  nameFontSize = 18,
  messageFontSize = 18,
  badgeFontSize = 16,
  paddingVertical = 40,
  paddingHorizontal = 24,
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
    position: 'relative',
    borderLeft: textDirection === 'rtl' ? 'none' : `${accentWidth}px solid ${accentColor}`,
    borderRight: textDirection === 'rtl' ? `${accentWidth}px solid ${accentColor}` : 'none',
  };

  const contentStyle = {
    display: 'flex',
    flexDirection: textDirection === 'rtl' ? 'row-reverse' : 'row',
    alignItems: 'flex-start',
    gap: '24px',
  };

  const badgeStyle = {
    backgroundColor: badgeColor,
    color: badgeTextColor,
    padding: '12px 20px',
    fontSize: `${badgeFontSize}px`,
    fontWeight: '600',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    cursor: isSelected ? 'text' : 'default',
  };

  const textContainerStyle = {
    flex: 1,
    textAlign,
  };

  const namesStyle = {
    fontSize: `${nameFontSize}px`,
    fontWeight: '600',
    color: textColor,
    lineHeight: 1.6,
    margin: 0,
    marginBottom: '8px',
    whiteSpace: 'pre-wrap',
    cursor: isSelected ? 'text' : 'default',
  };

  const messageStyle = {
    fontSize: `${messageFontSize}px`,
    fontWeight: '400',
    color: textColor,
    lineHeight: 1.6,
    margin: 0,
    cursor: isSelected ? 'text' : 'default',
  };

  const editableProps = (field) => ({
    ref: editingField === field ? editRef : null,
    contentEditable: editingField === field,
    suppressContentEditableWarning: true,
    onDoubleClick: (e) => handleDoubleClick(field, e),
    onBlur: () => handleBlur(field),
    onKeyDown: (e) => handleKeyDown(field, e),
  });

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div 
          {...editableProps('badgeText')}
          style={{
            ...badgeStyle,
            outline: editingField === 'badgeText' ? '2px dashed #04D1FC' : 'none',
          }}
        >
          {badgeText}
        </div>
        <div style={textContainerStyle}>
          <p 
            {...editableProps('names')}
            style={{
              ...namesStyle,
              outline: editingField === 'names' ? '2px dashed #04D1FC' : 'none',
            }}
          >
            {names}
          </p>
          <p 
            {...editableProps('message')}
            style={{
              ...messageStyle,
              outline: editingField === 'message' ? '2px dashed #04D1FC' : 'none',
            }}
          >
            {message}
          </p>
        </div>
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

export default CelebrationSection;

