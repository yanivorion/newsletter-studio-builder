import React, { useState, useRef, useCallback, useEffect } from 'react';

const FONT_STACKS = {
  'Noto Sans Hebrew': "'Noto Sans Hebrew', 'Arial Hebrew', Arial, sans-serif",
  'Poppins': "'Poppins', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Inter': "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Assistant': "'Assistant', 'Arial Hebrew', Arial, sans-serif",
  'Heebo': "'Heebo', 'Arial Hebrew', Arial, sans-serif"
};

function SpecsTableSection({
  title = 'Tech Specs',
  specs = [
    { label: 'Size', value: '6.64 inches × 3.28 inches × 7.37 inches' },
    { label: 'Weight', value: '384.8 grams' },
    { label: 'Battery', value: 'Up to 20 hours' },
    { label: 'Connectivity', value: 'Bluetooth 5.0 wireless technology' }
  ],
  backgroundColor = '#FFFFFF',
  textColor = '#1D1D1F',
  labelColor = '#1D1D1F',
  valueColor = '#86868B',
  dividerColor = '#D2D2D7',
  fontFamily = 'Noto Sans Hebrew',
  titleFontSize = 40,
  titleFontWeight = '700',
  labelFontSize = 14,
  labelFontWeight = '600',
  valueFontSize = 14,
  valueFontWeight = '400',
  paddingVertical = 48,
  paddingHorizontal = 24,
  rowPadding = 16,
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

  // Check if content exists
  const hasTitle = title && title.trim().length > 0;
  const hasSpecs = specs && specs.length > 0;

  const containerStyle = {
    backgroundColor,
    padding: `${paddingVertical}px ${paddingHorizontal}px`,
    fontFamily: fontStack,
    direction: textDirection,
    borderBottom: dividerBottom ? `${dividerThickness}px solid ${dividerBottomColor}` : 'none'
  };

  const titleStyle = {
    fontSize: `${titleFontSize}px`,
    fontWeight: titleFontWeight,
    color: textColor,
    margin: 0,
    marginBottom: hasSpecs ? '32px' : 0,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    textAlign,
    outline: editingField === 'title' ? '2px dashed #04D1FC' : 'none',
    outlineOffset: '4px',
    cursor: isSelected ? 'text' : 'default',
    borderRadius: '4px',
    minHeight: '1em'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse'
  };

  const rowStyle = {
    borderBottom: `1px solid ${dividerColor}`
  };

  const cellStyle = {
    padding: `${rowPadding}px 0`,
    verticalAlign: 'top'
  };

  const labelStyle = {
    fontSize: `${labelFontSize}px`,
    fontWeight: labelFontWeight,
    color: labelColor,
    lineHeight: 1.5,
    width: '40%',
    paddingRight: textDirection === 'rtl' ? '0' : '16px',
    paddingLeft: textDirection === 'rtl' ? '16px' : '0',
    textAlign: textDirection === 'rtl' ? 'right' : 'left',
    cursor: isSelected ? 'text' : 'default',
    borderRadius: '4px'
  };

  const valueStyle = {
    fontSize: `${valueFontSize}px`,
    fontWeight: valueFontWeight,
    color: valueColor,
    lineHeight: 1.5,
    textAlign: textDirection === 'rtl' ? 'left' : 'right',
    cursor: isSelected ? 'text' : 'default',
    borderRadius: '4px'
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
      {(hasTitle || isSelected) && (
        <h2 {...editableProps('title')} style={titleStyle}>
          {title || (isSelected ? 'Add title...' : '')}
        </h2>
      )}
      
      {hasSpecs && <table style={tableStyle}>
        <tbody>
          {specs.map((spec, index) => (
            <tr key={index} style={rowStyle}>
              <td 
                {...editableProps(`spec-${index}-label`)}
                style={{ 
                  ...cellStyle, 
                  ...labelStyle,
                  outline: editingField === `spec-${index}-label` ? '2px dashed #04D1FC' : 'none'
                }}
              >
                {spec.label}
              </td>
              <td 
                {...editableProps(`spec-${index}-value`)}
                style={{ 
                  ...cellStyle, 
                  ...valueStyle,
                  outline: editingField === `spec-${index}-value` ? '2px dashed #04D1FC' : 'none'
                }}
              >
                {spec.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>}
      
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

export default SpecsTableSection;
