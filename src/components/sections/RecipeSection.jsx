import React from 'react';

function RecipeSection({ title, image, ingredients, instructions, backgroundColor }) {
  const containerStyle = {
    backgroundColor: backgroundColor || '#FFFFFF',
    padding: '30px 20px'
  };

  const contentStyle = {
    maxWidth: '500px',
    margin: '0 auto'
  };

  const titleStyle = {
    fontFamily: 'Noto Sans Hebrew, sans-serif',
    fontSize: '24px',
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: '20px',
    direction: 'rtl'
  };

  const imageContainerStyle = {
    width: '100%',
    height: '250px',
    marginBottom: '20px',
    borderRadius: '8px',
    overflow: 'hidden'
  };

  const textBlockStyle = {
    fontFamily: 'Noto Sans Hebrew, sans-serif',
    fontSize: '14px',
    color: '#333333',
    lineHeight: '1.8',
    direction: 'rtl',
    textAlign: 'right',
    marginBottom: '15px',
    whiteSpace: 'pre-wrap'
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <h2 style={titleStyle}>{title || 'מתכון חודשי'}</h2>
        
        <div style={imageContainerStyle}>
          {image ? (
            <img 
              src={image} 
              alt={title} 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover' 
              }} 
            />
          ) : (
            <div 
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#E0E0E0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999999',
                fontSize: '48px'
              }}
            >
              🍽️
            </div>
          )}
        </div>

        <div style={textBlockStyle}>
          {ingredients || 'רכיבים:\n- מצרך 1\n- מצרך 2\n- מצרך 3'}
        </div>

        <div style={textBlockStyle}>
          {instructions || 'הוראות הכנה:\n1. שלב ראשון\n2. שלב שני\n3. שלב שלישי'}
        </div>
      </div>
    </div>
  );
}

export default RecipeSection;
