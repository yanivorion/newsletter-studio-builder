import React, { useState, useRef, useCallback, useEffect } from 'react';

const FONT_STACKS = {
  'Noto Sans Hebrew': "'Noto Sans Hebrew', 'Arial Hebrew', Arial, sans-serif",
  'Poppins': "'Poppins', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Inter': "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Assistant': "'Assistant', 'Arial Hebrew', Arial, sans-serif",
  'Heebo': "'Heebo', 'Arial Hebrew', Arial, sans-serif"
};

function ContactCardsSection({
  contacts = [
    {
      city: 'New York',
      phone: '+1 (555) 123-4567',
      email: 'ny@company.com',
      address: '123 Main Street\nSuite 100\nNew York, NY 10001\nUSA'
    },
    {
      city: 'London',
      phone: '+44 20 1234 5678',
      email: 'london@company.com',
      address: '10 Oxford Street\nFloor 5\nLondon W1D 1BS\nUnited Kingdom'
    }
  ],
  backgroundColor = '#FFFFFF',
  textColor = '#1D1D1F',
  labelColor = '#86868B',
  dividerColor = '#D2D2D7',
  fontFamily = 'Noto Sans Hebrew',
  cityFontSize = 28,
  cityFontWeight = '600',
  infoFontSize = 13,
  infoFontWeight = '400',
  paddingVertical = 32,
  paddingHorizontal = 24,
  cardPadding = 24,
  showDividers = true,
  // RTL support
  textAlign = 'right',
  textDirection = 'rtl',
  // Divider
  dividerBottom = false,
  dividerBottomColor = '#E5E5E5',
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
    borderBottom: dividerBottom ? `${dividerThickness}px solid ${dividerBottomColor}` : 'none'
  };

  const cardStyle = {
    padding: `${cardPadding}px 0`,
    borderBottom: showDividers ? `1px solid ${dividerColor}` : 'none',
    display: 'grid',
    gridTemplateColumns: textDirection === 'rtl' ? '2fr 1fr' : '1fr 2fr',
    gap: '16px',
    alignItems: 'start'
  };

  const cityStyle = {
    fontSize: `${cityFontSize}px`,
    fontWeight: cityFontWeight,
    color: textColor,
    lineHeight: 1.2,
    margin: 0,
    textAlign,
    cursor: isSelected ? 'text' : 'default',
    borderRadius: '4px'
  };

  const infoContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    textAlign
  };

  const infoStyle = {
    fontSize: `${infoFontSize}px`,
    fontWeight: infoFontWeight,
    color: labelColor,
    lineHeight: 1.5,
    margin: 0,
    whiteSpace: 'pre-line',
    cursor: isSelected ? 'text' : 'default',
    borderRadius: '4px'
  };

  const linkStyle = {
    ...infoStyle,
    color: labelColor,
    textDecoration: 'none'
  };

  const editableProps = (field) => ({
    ref: editingField === field ? editRef : null,
    contentEditable: editingField === field,
    suppressContentEditableWarning: true,
    onDoubleClick: (e) => handleDoubleClick(field, e),
    onBlur: () => handleBlur(field),
    onKeyDown: (e) => handleKeyDown(field, e)
  });

  return (
    <div style={containerStyle}>
      {contacts.map((contact, index) => (
        <div 
          key={index} 
          style={{
            ...cardStyle,
            borderBottom: (showDividers && index < contacts.length - 1) ? `1px solid ${dividerColor}` : 'none'
          }}
        >
          <h3 
            {...editableProps(`contact-${index}-city`)}
            style={{
              ...cityStyle,
              outline: editingField === `contact-${index}-city` ? '2px dashed #04D1FC' : 'none'
            }}
          >
            {contact.city}
          </h3>
          <div style={infoContainerStyle}>
            {contact.phone && (
              <a 
                href={editingField === `contact-${index}-phone` ? undefined : `tel:${contact.phone.replace(/\s/g, '')}`} 
                {...editableProps(`contact-${index}-phone`)}
                style={{
                  ...linkStyle,
                  outline: editingField === `contact-${index}-phone` ? '2px dashed #04D1FC' : 'none'
                }}
              >
                {contact.phone}
              </a>
            )}
            {contact.email && (
              <a 
                href={editingField === `contact-${index}-email` ? undefined : `mailto:${contact.email}`} 
                {...editableProps(`contact-${index}-email`)}
                style={{
                  ...linkStyle,
                  outline: editingField === `contact-${index}-email` ? '2px dashed #04D1FC' : 'none'
                }}
              >
                {contact.email}
              </a>
            )}
            {contact.address && (
              <p 
                {...editableProps(`contact-${index}-address`)}
                style={{
                  ...infoStyle,
                  outline: editingField === `contact-${index}-address` ? '2px dashed #04D1FC' : 'none'
                }}
              >
                {contact.address}
              </p>
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

export default ContactCardsSection;
