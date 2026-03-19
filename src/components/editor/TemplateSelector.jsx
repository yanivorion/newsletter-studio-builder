import React, { useState, useRef } from 'react';
import { ArrowRight, Upload, Trash2, Sparkles } from 'lucide-react';

// Blank starter template
const blankTemplate = {
  id: 'blank',
  name: 'New Newsletter',
  // Page-level container settings (wrapper around all sections)
  pageSettings: {
    outerBackgroundColor: '#F5F5F5', // Background of the full page
    outerPadding: 20,                 // Padding around the content container
    innerBackgroundColor: '#FFFFFF',  // Background of the content area
    innerBorderWidth: 0,
    innerBorderColor: '#E5E5E5',
    innerBorderRadius: 0
  },
  sections: [
    { 
      id: 'header-1', 
      type: 'header', 
      backgroundColor: '#FFFFFF', 
      gradientEnd: '#F5F5F5', 
      logo: null, 
      title: '', 
      titleFontSize: 32,
      subtitle: '', 
      textColor: '#1C1917',
      paddingTop: 0,
      paddingBottom: 0,
      paddingHorizontal: 0,
      spacingLogoToHero: 20,
      spacingHeroToTitle: 24,
      spacingTitleToSubtitle: 8,
      showHeroPlaceholder: false,
      height: 350
    },
    {
      id: 'footer-1',
      type: 'footer',
      background: { type: 'solid', color: '#FFFFFF' },
      padding: { top: 40, bottom: 40, left: 24, right: 24 },
      height: 'auto',
      textColor: '#6B7280',
      textAlign: 'center',
      logo: null,
      showLogo: true,
      tagline: '',
      taglineUrl: '',
      showTagline: true,
      showSocial: true,
      socialLinks: {},
      socialIconSize: 24,
      socialIconColor: '#4B5563',
      showCompanyInfo: true,
      companyInfo: 'Wix.com • 40 Namal Tel Aviv St.,Tel Aviv 6350671',
      companyInfoColor: '#374151',
      companyInfoFontSize: 14,
      showDivider: true,
      dividerColor: '#E5E7EB',
      showFooterLinks: true,
      footerLinks: [
        { text: 'Unsubscribe', url: '#' },
        { text: 'View in Browser', url: '#' },
        { text: 'Privacy Policy', url: '#' },
      ],
      linkColor: '#374151',
      linkFontSize: 14,
      fontFamily: 'Poppins',
    }
  ]
};

function TemplateSelector({ 
  onSelectTemplate, 
  hasSavedNewsletter, 
  onContinueEditing,
  lastSaveTime,
  projects = [],
  onLoadProject,
  onDeleteProject,
  onImportJSON
}) {
  const [hoveredButton, setHoveredButton] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file && onImportJSON) {
      try {
        await onImportJSON(file);
      } catch (error) {
        alert(`Import failed: ${error.message}`);
      }
    }
    e.target.value = '';
  };

  // Colors
  const backgroundColor = "#FFFFFF";
  const dotColor = "#E7E5E4";
  const heroTextColor = "#1C1917";
  const subheadlineColor = "#78716C";
  const primaryButtonBg = "#1C1917";
  const primaryButtonText = "#FFFFFF";
  const secondaryButtonBg = "#FAFAF9";
  const secondaryButtonText = "#1C1917";
  const cardBorderColor = "#E7E5E4";

  // Create dot pattern background
  const dotPattern = `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`;

  const handleStartNew = () => {
    onSelectTemplate(blankTemplate);
  };

  return (
    <div 
      className="newsletter-builder-landing" 
      style={{
        backgroundColor,
        backgroundImage: dotPattern,
        backgroundSize: '20px 20px',
        minHeight: '100vh',
        padding: '60px 24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}
    >
      {/* Hero Section */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        {/* Logo/Brand */}
        <div style={{
          fontSize: '20px',
          fontWeight: '500',
          color: heroTextColor,
          marginBottom: '80px',
          letterSpacing: '-0.02em'
        }}>
          NewsKit
        </div>

        {/* Hero Headline */}
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: '400',
          color: heroTextColor,
          margin: '0 0 24px 0',
          lineHeight: '1.1',
          letterSpacing: '-0.03em'
        }}>
          Create Beautiful Newsletters
        </h1>

        {/* Hero Subheadline */}
        <p style={{
          fontSize: '20px',
          fontWeight: '400',
          color: subheadlineColor,
          margin: '0 0 48px 0',
          lineHeight: '1.5'
        }}>
          Professional email campaigns in minutes
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Start New Button - Primary */}
          <button
            onClick={handleStartNew}
            onMouseEnter={() => setHoveredButton('start')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              backgroundColor: primaryButtonBg,
              color: primaryButtonText,
              border: 'none',
              borderRadius: '8px',
              padding: '16px 48px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: hoveredButton === 'start' ? 0.9 : 1,
              transform: hoveredButton === 'start' ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'all 250ms ease-out',
              boxShadow: hoveredButton === 'start' ? '0 8px 16px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.08)'
            }}
          >
            Start New
            <ArrowRight size={18} strokeWidth={2} />
          </button>

          {/* Continue Button - Secondary */}
          {hasSavedNewsletter && (
            <button
              onClick={onContinueEditing}
              onMouseEnter={() => setHoveredButton('continue')}
              onMouseLeave={() => setHoveredButton(null)}
              title={lastSaveTime ? `Last saved: ${lastSaveTime.toLocaleString()}` : undefined}
              style={{
                backgroundColor: secondaryButtonBg,
                color: secondaryButtonText,
                border: `1px solid ${cardBorderColor}`,
                borderRadius: '8px',
                padding: '16px 48px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                opacity: hoveredButton === 'continue' ? 0.9 : 1,
                transform: hoveredButton === 'continue' ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 250ms ease-out',
                boxShadow: hoveredButton === 'continue' ? '0 8px 16px rgba(0,0,0,0.08)' : '0 2px 4px rgba(0,0,0,0.04)'
              }}
            >
              Continue Editing
            </button>
          )}

          {/* Upload JSON Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={() => setHoveredButton('upload')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              backgroundColor: secondaryButtonBg,
              color: secondaryButtonText,
              border: `1px solid ${cardBorderColor}`,
              borderRadius: '8px',
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: hoveredButton === 'upload' ? 0.9 : 1,
              transform: hoveredButton === 'upload' ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'all 250ms ease-out',
              boxShadow: hoveredButton === 'upload' ? '0 8px 16px rgba(0,0,0,0.08)' : '0 2px 4px rgba(0,0,0,0.04)'
            }}
          >
            <Upload size={18} />
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* Templates Gallery */}
        <div style={{
          marginTop: '64px',
          textAlign: 'left',
          maxWidth: '900px',
          margin: '64px auto 0',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px',
            justifyContent: 'center',
          }}>
            <Sparkles size={20} color={subheadlineColor} />
            <h2 style={{
              fontSize: '18px',
              fontWeight: '500',
              color: heroTextColor,
              margin: 0,
            }}>
              Templates
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px',
            maxWidth: '900px',
            margin: '0 auto',
          }}>
            {/* Saved Projects as Template Cards */}
            {projects.map(project => {
              const header = project.data?.sections?.find(s => s.type === 'header');
              const coverUrl = header?.backgroundImage || header?.background?.image || null;
              const hKey = `tpl-proj-${project.id}`;
              return (
                <div
                  key={project.id}
                  style={{ position: 'relative' }}
                >
                  <button
                    onClick={() => onLoadProject?.(project.id)}
                    onMouseEnter={() => setHoveredButton(hKey)}
                    onMouseLeave={() => setHoveredButton(null)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      backgroundColor: '#FFFFFF',
                      border: `1px solid ${hoveredButton === hKey ? '#1C1917' : cardBorderColor}`,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 200ms ease-out',
                      transform: hoveredButton === hKey ? 'translateY(-2px)' : 'translateY(0)',
                      boxShadow: hoveredButton === hKey ? '0 8px 24px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
                      padding: 0,
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <div style={{
                      height: 160,
                      backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center top',
                      backgroundColor: coverUrl ? undefined : '#F5F5F5',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      padding: '16px 20px',
                    }}>
                      {!coverUrl && (
                        <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', width: '100%' }}>
                          No cover image
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600, color: heroTextColor, marginBottom: 4,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {project.name}
                      </div>
                      <div style={{ fontSize: 12, color: subheadlineColor }}>
                        {new Date(project.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}
                        {project.data?.sections?.length || 0} sections
                      </div>
                    </div>
                  </button>
                  {onDeleteProject && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this project?')) onDeleteProject(project.id);
                      }}
                      onMouseEnter={() => setHoveredButton(hKey)}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: '6px',
                        padding: '4px 6px',
                        cursor: 'pointer',
                        opacity: hoveredButton === hKey ? 1 : 0,
                        transition: 'opacity 150ms',
                        color: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default TemplateSelector;
