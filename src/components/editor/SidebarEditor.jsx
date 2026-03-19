import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  MousePointerClick,
  Loader2,
  Palette,
  Image,
  Settings,
  Lock,
  Unlock,
  Layers,
  FileImage,
  Camera,
  Plus,
  Type,
  GripVertical
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';
import { EditableInput, EditableTextarea, EditableColorInput } from '../ui/EditableField';
import { NumberInput } from '../ui/NumberInput';
import { Label } from '../ui/Label';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import GradientPicker from './GradientPicker';
import ImageUploader from './ImageUploader';
import ThemePanel from './ThemePanel';
import MediaKitPanel from './MediaKitPanel';
import CollagePresetPicker from './CollagePresetPicker';
import FocalPointPicker from './FocalPointPicker';
import BulkImageUploader from './BulkImageUploader';
import { getPresetById, getImageCountForPreset } from '../../lib/collagePresets';
import { exportToGif, downloadDataUrl } from '../../utils/gifExport';
import { exportSequenceAsGif, exportMarqueeAsGif, downloadBlob } from '../../utils/sequenceGifExport';
import { IconPickerButton } from './IconPicker';
import {
  isGridSection,
  ROW_LAYOUTS,
  createGridRow,
  createGridColumn,
  blocksToRows,
  splitColumn,
  mergeColumns,
} from '../../lib/grid-schema';
import { LAYOUT_PRESETS } from '../blocks/MultiLayoutBlock';

const REMOVE_BG_API_KEY = 'rDrPT41QWFrheRJc4MARam3m';

// Uncontrolled color picker component - uses refs to avoid focus issues
function ImageColorPicker({ value, onChange, placeholder = 'Enter color', allowClear = false }) {
  const textRef = useRef(null);
  const lastValueRef = useRef(value);

  // Initialize and sync only when value changes from parent (not during typing)
  React.useEffect(() => {
    if (textRef.current && document.activeElement !== textRef.current) {
      textRef.current.value = value || '';
      lastValueRef.current = value;
    }
  }, [value]);

  const handleColorChange = (e) => {
    const newValue = e.target.value;
    if (textRef.current) {
      textRef.current.value = newValue;
    }
    lastValueRef.current = newValue;
    onChange?.(newValue);
  };

  const handleTextBlur = () => {
    if (textRef.current) {
      lastValueRef.current = textRef.current.value;
      onChange?.(textRef.current.value);
    }
  };

  const handleClear = () => {
    if (textRef.current) {
      textRef.current.value = '';
    }
    lastValueRef.current = '';
    onChange?.('');
  };

  const safeColorValue = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#04D1FC';

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={safeColorValue}
        onChange={handleColorChange}
        className="w-8 h-8 rounded border border-zinc-200 cursor-pointer"
      />
      <input
        ref={textRef}
        type="text"
        defaultValue={value || ''}
        onBlur={handleTextBlur}
        placeholder={placeholder}
        className="flex-1 h-8 px-2 text-xs rounded border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#04D1FC]"
      />
      {allowClear && (
        <button
          onClick={handleClear}
          type="button"
          className="h-8 px-2 text-[10px] text-zinc-500 hover:text-zinc-700 border border-zinc-200 rounded"
        >
          Clear
        </button>
      )}
    </div>
  );
}

function SidebarEditor({ 
  newsletter, 
  selectedSection, 
  selectedBlock,
  onSectionClick,
  onBlockClick,
  onSectionUpdate, 
  onBlockUpdate,
  onDeleteBlock,
  onReorderBlocks,
  onPageSettingsUpdate,
  onDeleteSection, 
  onMoveSection,
  isUnlocked,
  onToggleUnlock,
  marqueeRef,
  onSetBlockImage,
  onSetCollageImage, 
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [isExportingGif, setIsExportingGif] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
  const [isContainerExpanded, setIsContainerExpanded] = useState(false);
  
  // Ref to preserve scroll position
  const scrollContainerRef = useRef(null);
  const scrollPositionRef = useRef(0);
  
  // Preserve scroll position on re-render
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    // Save scroll position before any updates
    const handleScroll = () => {
      scrollPositionRef.current = container.scrollTop;
    };
    
    container.addEventListener('scroll', handleScroll);
    
    // Restore scroll position after render
    if (scrollPositionRef.current > 0) {
      container.scrollTop = scrollPositionRef.current;
    }
    
    return () => container.removeEventListener('scroll', handleScroll);
  });
  
  // Prevent scroll jump when clicking inputs
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const preventScrollJump = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        // Save current scroll position
        const currentScroll = container.scrollTop;
        // Restore after a tiny delay (after browser's default scroll)
        requestAnimationFrame(() => {
          if (Math.abs(container.scrollTop - currentScroll) > 50) {
            container.scrollTop = currentScroll;
          }
        });
      }
    };
    
    container.addEventListener('focusin', preventScrollJump);
    return () => container.removeEventListener('focusin', preventScrollJump);
  }, []);
  
  // parentSection: the actual section container (header/section/footer)
  const parentSection = selectedSection 
    ? newsletter?.sections.find(s => s.id === selectedSection)
    : null;

  // block: the selected child block within the section (search flat + grid)
  const block = (() => {
    if (!selectedBlock || !parentSection) return null;
    const flat = parentSection.blocks?.find(b => b.id === selectedBlock);
    if (flat) return flat;
    if (parentSection.rows) {
      for (const r of parentSection.rows) {
        for (const c of r.columns) {
          const found = c.blocks?.find(b => b.id === selectedBlock);
          if (found) return found;
        }
      }
    }
    return null;
  })();

  // 'section' alias: when editing a block, points to block (backward compat
  // with render*Editor functions that read section.fieldName). When no block
  // is selected, points to the section itself.
  const section = block || parentSection;

  const handleExportMarqueeGif = useCallback(async () => {
    const marqueeBlock = block?.type === 'marquee' ? block : section?.blocks?.find(b => b.type === 'marquee');
    if (!marqueeBlock) {
      alert('Marquee block not found.');
      return;
    }

    setIsExportingGif(true);
    setGifProgress(0);

    try {
      const result = await exportMarqueeAsGif(marqueeBlock, {
        width: 600,
        onProgress: (progress) => setGifProgress(progress)
      });

      downloadBlob(result.blob, `marquee-${Date.now()}.gif`);
    } catch (error) {
      console.error('GIF export failed:', error);
      alert('Failed to export GIF. Please try again.');
    } finally {
      setIsExportingGif(false);
      setGifProgress(0);
    }
  }, [block, section]);

  // Routes field changes to block or section depending on what's selected
  const handleFieldChange = useCallback((field, value) => {
    if (selectedBlock && block) {
      onBlockUpdate?.(selectedSection, selectedBlock, { [field]: value });
    } else {
      onSectionUpdate(selectedSection, { [field]: value });
    }
  }, [selectedSection, selectedBlock, block, onSectionUpdate, onBlockUpdate]);

  // Section-level background helper
  const handleBackgroundChange = useCallback((field, value) => {
    onSectionUpdate(selectedSection, {
      background: { ...(parentSection?.background || {}), [field]: value },
    });
  }, [selectedSection, parentSection, onSectionUpdate]);

  // Section-level padding helper
  const handlePaddingChange = useCallback((side, value) => {
    onSectionUpdate(selectedSection, {
      padding: { ...(parentSection?.padding || {}), [side]: value },
    });
  }, [selectedSection, parentSection, onSectionUpdate]);

  const handleColorSelect = useCallback((color) => {
    if (block) {
      if (block.type === 'text' || block.type === 'title') {
        handleFieldChange('color', color);
      }
    } else if (section) {
      handleBackgroundChange('color', color);
    }
  }, [section, handleFieldChange]);

  const handleGradientSelect = useCallback((start, end) => {
    if (section) {
      handleBackgroundChange('type', 'gradient');
      handleBackgroundChange('gradientStart', start);
      handleBackgroundChange('gradientEnd', end);
    }
  }, [section, handleBackgroundChange]);

  const handleLogoSelect = useCallback((logoUrl, logoData) => {
    // Cover images → set as section background
    if (logoData?.category === 'cover' && parentSection) {
      onSectionUpdate(selectedSection, {
        background: {
          ...(parentSection.background || {}),
          type: 'image',
          image: logoUrl,
          imageSize: 'cover',
          imagePosition: 'center',
        },
      });
      return;
    }

    // Background images → set as section background
    if (logoData?.category === 'background' && parentSection) {
      onSectionUpdate(selectedSection, {
        background: {
          ...(parentSection.background || {}),
          type: 'image',
          image: logoUrl,
          imageSize: 'cover',
          imagePosition: 'center',
        },
      });
      return;
    }

    if (block) {
      if (block.type === 'logo' || block.type === 'image') {
        handleFieldChange('src', logoUrl);
      } else if ('image' in block) {
        handleFieldChange('image', logoUrl);
      }
    } else if (parentSection) {
      const logoBlock = (parentSection.blocks || []).find(b => b.type === 'logo');
      if (logoBlock) {
        onBlockUpdate?.(selectedSection, logoBlock.id, { src: logoUrl });
      } else {
        // Fallback: set as section background
        onSectionUpdate(selectedSection, {
          background: {
            ...(parentSection.background || {}),
            type: 'image',
            image: logoUrl,
            imageSize: 'cover',
            imagePosition: 'center',
          },
        });
      }
    }
  }, [block, parentSection, selectedSection, handleFieldChange, onBlockUpdate, onSectionUpdate]);

  const handleImageUpload = useCallback(async (fileOrUrl, field) => {
    // Handle removal (null/undefined)
    if (!fileOrUrl) {
      handleFieldChange(field, null);
      return;
    }
    
    // If it's a URL string, use it directly (no base64 conversion!)
    if (typeof fileOrUrl === 'string') {
      handleFieldChange(field, fileOrUrl);
      return;
    }
    
    // If it's a File, convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      handleFieldChange(field, e.target.result);
    };
    reader.readAsDataURL(fileOrUrl);
  }, [handleFieldChange]);

  const handleRemoveBackground = useCallback(async (imageField) => {
    const imageData = section?.[imageField];
    if (!imageData) {
      alert('No image to process');
      return;
    }

    setIsProcessing(true);
    try {
      // Extract base64 data
      const base64Data = imageData.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid image data');
      }
      
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      const formData = new FormData();
      formData.append('image_file', blob, 'image.png');
      formData.append('size', 'auto');

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': REMOVE_BG_API_KEY },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Remove.bg API error:', response.status, errorText);
        throw new Error(`API Error: ${response.status}`);
      }

      const resultBlob = await response.blob();
      const reader = new FileReader();
      reader.onload = (e) => handleFieldChange(imageField, e.target.result);
      reader.readAsDataURL(resultBlob);
    } catch (error) {
      console.error('Remove background error:', error);
      alert(`Failed to remove background: ${error.message}\n\nTip: You can use remove.bg website directly and upload the result.`);
    } finally {
      setIsProcessing(false);
    }
  }, [section, handleFieldChange]);

  const handleArrayImageUpload = useCallback(async (fileOrUrl, arrayField, index) => {
    // Handle removal (null/undefined)
    if (!fileOrUrl) {
      const currentArray = section?.[arrayField] || [];
      const newArray = [...currentArray];
      newArray[index] = null;
      handleFieldChange(arrayField, newArray);
      return;
    }
    
    // If it's a URL string, use it directly (no base64!)
    if (typeof fileOrUrl === 'string') {
      const currentArray = section?.[arrayField] || [];
      const newArray = [...currentArray];
      newArray[index] = fileOrUrl;
      handleFieldChange(arrayField, newArray);
      return;
    }
    
    // If it's a File, convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const currentArray = section?.[arrayField] || [];
      const newArray = [...currentArray];
      newArray[index] = e.target.result;
      handleFieldChange(arrayField, newArray);
    };
    reader.readAsDataURL(fileOrUrl);
  }, [section, handleFieldChange]);

  const handleFocalPointChange = useCallback((index, focalPoint) => {
    const currentFocalPoints = section?.focalPoints || [];
    const newFocalPoints = [...currentFocalPoints];
    newFocalPoints[index] = focalPoint;
    handleFieldChange('focalPoints', newFocalPoints);
  }, [section, handleFieldChange]);

  const handleImageBackgroundChange = useCallback((index, color) => {
    const currentBackgrounds = section?.imageBackgrounds || [];
    const newBackgrounds = [...currentBackgrounds];
    newBackgrounds[index] = color;
    handleFieldChange('imageBackgrounds', newBackgrounds);
  }, [section, handleFieldChange]);

  const handleImageOverlayChange = useCallback((index, overlay) => {
    const currentOverlays = section?.imageOverlays || [];
    const newOverlays = [...currentOverlays];
    newOverlays[index] = overlay;
    handleFieldChange('imageOverlays', newOverlays);
  }, [section, handleFieldChange]);

  const handleBulkProfileImages = useCallback((images) => {
    const profiles = section?.profiles || [];
    const newProfiles = images.map((image, index) => ({
      ...profiles[index],
      image,
      name: profiles[index]?.name || '',
      title: profiles[index]?.title || ''
    }));
    handleFieldChange('profiles', newProfiles);
  }, [section, handleFieldChange]);

  const handleProfileFieldChange = useCallback((index, field, value) => {
    const profiles = section?.profiles || [];
    const newProfiles = [...profiles];
    newProfiles[index] = { ...newProfiles[index], [field]: value };
    handleFieldChange('profiles', newProfiles);
  }, [section, handleFieldChange]);

  const FieldGroup = ({ label, children, className }) => (
    <div className={cn("space-y-2", className)}>
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{label}</Label>
      {children}
    </div>
  );

  // Container settings handler
  const handleContainerChange = useCallback((field, value) => {
    const currentContainer = section?.container || {};
    onSectionUpdate(selectedSection, { 
      container: { ...currentContainer, [field]: value } 
    });
  }, [selectedSection, onSectionUpdate, section?.container]);

  // Container Settings Component
  const renderContainerSettings = () => {
    const container = section?.container || {};
    
    return (
      <div className="mb-6 p-3 bg-gradient-to-br from-zinc-50 to-zinc-100/50 rounded-xl border border-zinc-200">
        <button
          onClick={() => setIsContainerExpanded(!isContainerExpanded)}
          className="w-full flex items-center justify-between text-xs font-semibold text-zinc-600 hover:text-zinc-900"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Container Frame</span>
          </div>
          <ChevronDown className={cn("w-4 h-4 transition-transform", isContainerExpanded && "rotate-180")} />
        </button>
        
        {isContainerExpanded && (
          <div className="mt-4 space-y-4">
            {/* Outer Container (Padding/Margin) */}
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-zinc-400"></span>
                Outer Frame (Padding)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Top</span>
                  <NumberInput
                    value={container.outerPaddingTop ?? container.outerPadding ?? 0}
                    onChange={(val) => handleContainerChange('outerPaddingTop', val)}
                    step={4}
                    suffix="px"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Bottom</span>
                  <NumberInput
                    value={container.outerPaddingBottom ?? container.outerPadding ?? 0}
                    onChange={(val) => handleContainerChange('outerPaddingBottom', val)}
                    step={4}
                    suffix="px"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Left</span>
                  <NumberInput
                    value={container.outerPaddingLeft ?? container.outerPadding ?? 0}
                    onChange={(val) => handleContainerChange('outerPaddingLeft', val)}
                    step={4}
                    suffix="px"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Right</span>
                  <NumberInput
                    value={container.outerPaddingRight ?? container.outerPadding ?? 0}
                    onChange={(val) => handleContainerChange('outerPaddingRight', val)}
                    step={4}
                    suffix="px"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-400">Outer Background</span>
                <ImageColorPicker
                  value={container.outerBackgroundColor || ''}
                  onChange={(val) => handleContainerChange('outerBackgroundColor', val)}
                  placeholder="#FDFBF8"
                  allowClear
                />
              </div>
            </div>
            
            {/* Inner Container (Border/Radius/Background) */}
            <div className="space-y-2 pt-3 border-t border-zinc-200">
              <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm border-2 border-zinc-400"></span>
                Inner Frame (Stroke & Radius)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Border Width</span>
                  <NumberInput
                    value={container.innerBorderWidth ?? 0}
                    onChange={(val) => handleContainerChange('innerBorderWidth', val)}
                    step={1}
                    suffix="px"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Border Radius</span>
                  <NumberInput
                    value={container.innerBorderRadius ?? 0}
                    onChange={(val) => handleContainerChange('innerBorderRadius', val)}
                    step={4}
                    suffix="px"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-400">Border Color</span>
                <ImageColorPicker
                  value={container.innerBorderColor || '#E5E5E5'}
                  onChange={(val) => handleContainerChange('innerBorderColor', val)}
                  placeholder="#E5E5E5"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-400">Inner Background</span>
                <ImageColorPicker
                  value={container.innerBackgroundColor || ''}
                  onChange={(val) => handleContainerChange('innerBackgroundColor', val)}
                  placeholder="transparent"
                  allowClear
                />
              </div>
            </div>
            
            {/* Background Image */}
            <div className="space-y-2 pt-3 border-t border-zinc-200">
              <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                <Image className="w-3 h-3" />
                Background Image
              </span>
              <ImageUploader
                currentImage={container.backgroundImage}
                onImageUpload={(file) => {
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (e) => handleContainerChange('backgroundImage', e.target.result);
                  reader.readAsDataURL(file);
                }}
                onRemoveBackground={() => {}}
                isProcessing={false}
                compact
              />
              {container.backgroundImage && (
                <>
                  <button
                    onClick={() => handleContainerChange('backgroundImage', null)}
                    className="w-full h-7 text-[10px] text-zinc-500 hover:text-red-500 border border-zinc-200 rounded transition-colors"
                  >
                    Remove Background Image
                  </button>
                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-400">Position</span>
                    <Select
                      value={container.backgroundPosition || 'center'}
                      onChange={(e) => handleContainerChange('backgroundPosition', e.target.value)}
                      className="h-8 text-xs"
                    >
                      <option value="center">Center</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-400">Repeat</span>
                    <Select
                      value={container.backgroundRepeat || 'no-repeat'}
                      onChange={(e) => handleContainerChange('backgroundRepeat', e.target.value)}
                      className="h-8 text-xs"
                    >
                      <option value="no-repeat">No Repeat</option>
                      <option value="repeat">Repeat</option>
                      <option value="repeat-x">Repeat X</option>
                      <option value="repeat-y">Repeat Y</option>
                    </Select>
                  </div>
                </>
              )}
              <p className="text-[9px] text-zinc-400">
                Background fills 100% width, auto height
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHeaderEditor = () => (
    <div className="space-y-6">
      {renderContainerSettings()}
      
      {/* Logo Section */}
      <FieldGroup label="Logo">
        <ImageUploader
          currentImage={section.logo}
          onImageUpload={(file) => handleImageUpload(file, 'logo')}
          onRemoveBackground={() => handleRemoveBackground('logo')}
          isProcessing={isProcessing}
        />
        {section.logo && (
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Width</span>
                <NumberInput
                  value={section.logoWidth || 120}
                  onChange={(val) => handleFieldChange('logoWidth', val)}
                  
                  
                  step={10}
                  suffix="px"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Height</span>
                <Select
                  value={section.logoHeight || 'auto'}
                  onChange={(e) => handleFieldChange('logoHeight', e.target.value)}
                  className="h-10"
                >
                  <option value="auto">Auto</option>
                  <option value="40">40px</option>
                  <option value="60">60px</option>
                  <option value="80">80px</option>
                  <option value="100">100px</option>
                </Select>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Align</span>
                <Select
                  value={section.logoAlignment || 'center'}
                  onChange={(e) => handleFieldChange('logoAlignment', e.target.value)}
                  className="h-10"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </Select>
              </div>
            </div>
          </div>
        )}
      </FieldGroup>

      {/* Hero Image Section */}
      <FieldGroup label="Hero Image">
        <ImageUploader
          currentImage={section.heroImage}
          onImageUpload={(file) => handleImageUpload(file, 'heroImage')}
          onRemoveBackground={() => handleRemoveBackground('heroImage')}
          isProcessing={isProcessing}
        />
        {section.heroImage && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400">Height</span>
              <NumberInput
                value={section.heroImageHeight || 200}
                onChange={(val) => handleFieldChange('heroImageHeight', val)}
                
                
                step={10}
                suffix="px"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400">Fit</span>
              <Select
                value={section.heroImageFit || 'cover'}
                onChange={(e) => handleFieldChange('heroImageFit', e.target.value)}
                className="h-10"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
              </Select>
            </div>
          </div>
        )}
      </FieldGroup>

      {/* Title Section */}
      <FieldGroup label="Title">
        <input
          type="text"
          key={`title-${selectedSection}`}
          defaultValue={section.title || ''}
          onBlur={(e) => handleFieldChange('title', e.target.value)}
          placeholder="Newsletter title"
          className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#04D1FC] focus:border-transparent"
        />

        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Size</span>
            <NumberInput
              value={section.titleFontSize || 28}
              onChange={(val) => handleFieldChange('titleFontSize', val)}
              
              
              step={2}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Weight</span>
            <Select
              value={section.titleFontWeight || '700'}
              onChange={(e) => handleFieldChange('titleFontWeight', e.target.value)}
              className="h-10"
            >
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Style</span>
            <Select
              value={section.titleFontStyle || 'normal'}
              onChange={(e) => handleFieldChange('titleFontStyle', e.target.value)}
              className="h-10"
            >
              <option value="normal">Normal</option>
              <option value="italic">Italic</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Kerning</span>
            <Select
              value={section.titleLetterSpacing || '-0.02em'}
              onChange={(e) => handleFieldChange('titleLetterSpacing', e.target.value)}
              className="h-10"
            >
              <option value="-0.05em">Tight (-0.05)</option>
              <option value="-0.02em">Snug (-0.02)</option>
              <option value="0">Normal (0)</option>
              <option value="0.02em">Wide (0.02)</option>
              <option value="0.05em">Wider (0.05)</option>
              <option value="0.1em">Widest (0.1)</option>
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Leading</span>
            <Select
              value={section.titleLineHeight || '1.2'}
              onChange={(e) => handleFieldChange('titleLineHeight', parseFloat(e.target.value))}
              className="h-10"
            >
              <option value="1">Tight (1.0)</option>
              <option value="1.1">Snug (1.1)</option>
              <option value="1.2">Normal (1.2)</option>
              <option value="1.4">Relaxed (1.4)</option>
              <option value="1.6">Loose (1.6)</option>
            </Select>
          </div>
        </div>
      </FieldGroup>

      {/* Subtitle Section */}
      <FieldGroup label="Subtitle">
        <EditableInput
          value={section.subtitle || ''}
          onChange={(val) => handleFieldChange('subtitle', val)}
          sectionKey={selectedSection}
          placeholder="Newsletter subtitle"
        />
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Size</span>
            <NumberInput
              value={section.subtitleFontSize || 16}
              onChange={(val) => handleFieldChange('subtitleFontSize', val)}
              
              
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Weight</span>
            <Select
              value={section.subtitleFontWeight || '400'}
              onChange={(e) => handleFieldChange('subtitleFontWeight', e.target.value)}
              className="h-10"
            >
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semi</option>
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Kerning</span>
            <Select
              value={section.subtitleLetterSpacing || '0'}
              onChange={(e) => handleFieldChange('subtitleLetterSpacing', e.target.value)}
              className="h-10"
            >
              <option value="-0.02em">Tight</option>
              <option value="0">Normal</option>
              <option value="0.05em">Wide</option>
            </Select>
          </div>
        </div>
      </FieldGroup>

      {/* Date Badge */}
      <FieldGroup label="Date Badge">
        <div className="flex items-center gap-2 mb-2">
          <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
            <input
              type="checkbox"
              checked={section.showDateBadge || false}
              onChange={(e) => handleFieldChange('showDateBadge', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Show date badge
          </label>
        </div>
        {section.showDateBadge && (
          <div className="space-y-3 p-3 bg-zinc-50 rounded-xl">
            <EditableInput
              value={section.dateBadgeText || 'JULY 2025'}
              onChange={(val) => handleFieldChange('dateBadgeText', val)}
              sectionKey={selectedSection}
              placeholder="MONTH YEAR"
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Background</span>
                <input
                  type="color"
                  value={section.dateBadgeBg || '#04D1FC'}
                  onChange={(e) => handleFieldChange('dateBadgeBg', e.target.value)}
                  className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Text</span>
                <input
                  type="color"
                  value={section.dateBadgeColor || '#FFFFFF'}
                  onChange={(e) => handleFieldChange('dateBadgeColor', e.target.value)}
                  className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </FieldGroup>

      {/* Colors */}
      <FieldGroup label="Colors">
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Text Color</span>
            <div className="flex gap-2">
              <input
                type="color"
                value={section.textColor || '#FFFFFF'}
                onChange={(e) => handleFieldChange('textColor', e.target.value)}
                className="w-10 h-10 rounded border border-zinc-200 cursor-pointer"
              />
              <EditableInput
                value={section.textColor || '#FFFFFF'}
                onChange={(val) => handleFieldChange('textColor', val)}
                sectionKey={selectedSection}
                className="flex-1 font-mono text-xs"
              />
            </div>
          </div>
          
          {/* Transparent background toggle - to show container's background image */}
          <div className="flex items-center gap-2 p-2 bg-zinc-50 rounded-lg">
            <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
              <input
                type="checkbox"
                checked={section.backgroundColor === 'transparent'}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleFieldChange('backgroundColor', 'transparent');
                  } else {
                    handleFieldChange('backgroundColor', '#04D1FC');
                  }
                }}
                className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
              />
              Transparent (use container BG image)
            </label>
          </div>
          
          {section.backgroundColor !== 'transparent' && (
            <GradientPicker
              startColor={section.backgroundColor}
              endColor={section.gradientEnd}
              onStartColorChange={(color) => handleFieldChange('backgroundColor', color)}
              onEndColorChange={(color) => handleFieldChange('gradientEnd', color)}
              sectionKey={selectedSection}
            />
          )}
        </div>
      </FieldGroup>

      {/* Spacing & Padding */}
      <FieldGroup label="Spacing & Padding">
        <div className="space-y-4">
          {/* Container Padding */}
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-500 font-medium">Container Padding</span>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Top</span>
                <NumberInput
                  value={section.paddingTop ?? 0}
                  onChange={(val) => handleFieldChange('paddingTop', val)}
                  
                  
                  step={4}
                  suffix="px"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Bottom</span>
                <NumberInput
                  value={section.paddingBottom ?? 0}
                  onChange={(val) => handleFieldChange('paddingBottom', val)}
                  
                  
                  step={4}
                  suffix="px"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Sides</span>
                <NumberInput
                  value={section.paddingHorizontal ?? 0}
                  onChange={(val) => handleFieldChange('paddingHorizontal', val)}
                  
                  
                  step={4}
                  suffix="px"
                />
              </div>
            </div>
          </div>

          {/* Element Spacing */}
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-500 font-medium">Element Spacing</span>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Logo→Hero</span>
                <NumberInput
                  value={section.spacingLogoToHero ?? 20}
                  onChange={(val) => handleFieldChange('spacingLogoToHero', val)}
                  
                  
                  step={4}
                  suffix="px"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Hero→Title</span>
                <NumberInput
                  value={section.spacingHeroToTitle ?? 24}
                  onChange={(val) => handleFieldChange('spacingHeroToTitle', val)}
                  
                  
                  step={4}
                  suffix="px"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Title→Sub</span>
                <NumberInput
                  value={section.spacingTitleToSubtitle ?? 8}
                  onChange={(val) => handleFieldChange('spacingTitleToSubtitle', val)}
                  
                  
                  step={2}
                  suffix="px"
                />
              </div>
            </div>
          </div>

          {/* Hero placeholder toggle */}
          <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer pt-2 border-t border-zinc-100">
            <input
              type="checkbox"
              checked={section.showHeroPlaceholder !== false}
              onChange={(e) => handleFieldChange('showHeroPlaceholder', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Show hero placeholder when empty
          </label>
        </div>
      </FieldGroup>
    </div>
  );

  const renderTextEditor = () => (
    <div className="space-y-6">
      {renderContainerSettings()}
      
      <FieldGroup label="Content">
        <EditableTextarea
          value={section.content || ''}
          onChange={(val) => handleFieldChange('content', val)}
          sectionKey={selectedSection}
          rows={6}
          placeholder="Enter your text..."
          className="resize-none"
        />
      </FieldGroup>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Font">
          <Select
            value={section.fontFamily || 'Poppins'}
            onChange={(e) => handleFieldChange('fontFamily', e.target.value)}
          >
            <option value="Poppins">Poppins</option>
            <option value="Noto Sans Hebrew">Noto Sans Hebrew</option>
            <option value="Inter">Inter</option>
          </Select>
        </FieldGroup>

        <FieldGroup label="Size">
          <NumberInput
            value={section.fontSize || 16}
            onChange={(val) => handleFieldChange('fontSize', val)}
            
            
            suffix="px"
          />
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Text Color">
          <EditableColorInput
            value={section.color || '#120F0F'}
            onChange={(val) => handleFieldChange('color', val)}
            sectionKey={selectedSection}
          />
        </FieldGroup>

        <FieldGroup label="Background">
          <EditableColorInput
            value={section.backgroundColor || '#FFFFFF'}
            onChange={(val) => handleFieldChange('backgroundColor', val)}
            sectionKey={selectedSection}
          />
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Direction">
          <Select
            value={section.direction || 'ltr'}
            onChange={(e) => handleFieldChange('direction', e.target.value)}
          >
            <option value="ltr">LTR</option>
            <option value="rtl">RTL</option>
          </Select>
        </FieldGroup>

        <FieldGroup label="Align">
          <Select
            value={section.textAlign || 'center'}
            onChange={(e) => handleFieldChange('textAlign', e.target.value)}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </Select>
        </FieldGroup>
      </div>
    </div>
  );

  const renderSectionHeaderEditor = () => (
    <div className="space-y-6">
      {renderContainerSettings()}
      
      <FieldGroup label="Text">
        <EditableInput
          value={section.text || ''}
          onChange={(val) => handleFieldChange('text', val)}
          sectionKey={selectedSection}
          placeholder="Section title"
        />
      </FieldGroup>

      <FieldGroup label="Background">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Start Color</span>
            <input
              type="color"
              value={section.backgroundColor || '#04D1FC'}
              onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
              className="w-full h-8 rounded border border-zinc-200 cursor-pointer bg-transparent"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">End Color (Gradient)</span>
            <div className="flex gap-1">
              <input
                type="color"
                value={section.gradientEnd || section.backgroundColor || '#04D1FC'}
                onChange={(e) => handleFieldChange('gradientEnd', e.target.value)}
                className="flex-1 h-8 rounded border border-zinc-200 cursor-pointer bg-transparent"
              />
              {section.gradientEnd && (
                <button
                  onClick={() => handleFieldChange('gradientEnd', null)}
                  className="px-2 h-8 text-xs text-zinc-400 hover:text-zinc-600 border border-zinc-200 rounded"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
        {section.gradientEnd && (
          <div className="space-y-1 mt-2">
            <span className="text-[9px] text-zinc-400">Gradient Direction</span>
            <Select
              value={section.gradientDirection || '90deg'}
              onChange={(e) => handleFieldChange('gradientDirection', e.target.value)}
              className="h-8"
            >
              <option value="90deg">Left → Right</option>
              <option value="270deg">Right → Left</option>
              <option value="180deg">Top → Bottom</option>
              <option value="0deg">Bottom → Top</option>
              <option value="135deg">Diagonal ↘</option>
              <option value="45deg">Diagonal ↗</option>
            </Select>
          </div>
        )}
      </FieldGroup>

      <FieldGroup label="Text Color">
        <input
          type="color"
          value={section.color || '#FFFFFF'}
          onChange={(e) => handleFieldChange('color', e.target.value)}
          className="w-full h-8 rounded border border-zinc-200 cursor-pointer bg-transparent"
        />
      </FieldGroup>

      <FieldGroup label="Font Size">
        <NumberInput
          value={section.fontSize || 18}
          onChange={(val) => handleFieldChange('fontSize', val)}
          suffix="px"
        />
      </FieldGroup>

      <FieldGroup label="Section Padding">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Top</span>
            <NumberInput
              value={section.paddingTop ?? section.padding ?? 14}
              onChange={(val) => handleFieldChange('paddingTop', val)}
              step={2}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Bottom</span>
            <NumberInput
              value={section.paddingBottom ?? section.padding ?? 14}
              onChange={(val) => handleFieldChange('paddingBottom', val)}
              step={2}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Left</span>
            <NumberInput
              value={section.paddingLeft ?? 24}
              onChange={(val) => handleFieldChange('paddingLeft', val)}
              step={2}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Right</span>
            <NumberInput
              value={section.paddingRight ?? 24}
              onChange={(val) => handleFieldChange('paddingRight', val)}
              step={2}
              suffix="px"
            />
          </div>
        </div>
      </FieldGroup>
    </div>
  );

  const renderImageBlockEditor = () => (
    <div className="space-y-4">
      <FieldGroup label="Image">
        {block?.src ? (
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden border border-zinc-200">
              <img src={block.src} alt="" className="w-full h-24 object-cover" />
            </div>
            <button
              onClick={() => onSetBlockImage?.(selectedSection, selectedBlock)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 hover:border-[#04D1FC] hover:bg-[#04D1FC]/5 text-zinc-600 hover:text-[#04D1FC] text-[11px] font-medium transition-colors"
            >
              Replace image
            </button>
          </div>
        ) : (
          <button
            onClick={() => onSetBlockImage?.(selectedSection, selectedBlock)}
            className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg border-2 border-dashed border-zinc-300 hover:border-[#04D1FC] hover:bg-[#04D1FC]/5 text-zinc-500 hover:text-[#04D1FC] text-[12px] font-medium transition-colors"
          >
            Set image
          </button>
        )}
      </FieldGroup>

      <FieldGroup label="Size">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Width</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleFieldChange('width', '100%')}
                className={cn(
                  "flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors",
                  (!block?.width || block.width === '100%') ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                )}
              >
                Full
              </button>
              <button
                onClick={() => handleFieldChange('width', block?.width && block.width !== '100%' ? block.width : 300)}
                className={cn(
                  "flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors",
                  (block?.width && block.width !== '100%') ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                )}
              >
                Fixed
              </button>
            </div>
            {block?.width && block.width !== '100%' && (
              <NumberInput
                value={typeof block.width === 'number' ? block.width : 300}
                onChange={(val) => handleFieldChange('width', val)}
                step={10}
                min={20}
                max={700}
                suffix="px"
              />
            )}
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Height</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleFieldChange('height', 'auto')}
                className={cn(
                  "flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors",
                  (!block?.height || block.height === 'auto') ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                )}
              >
                Auto
              </button>
              <button
                onClick={() => handleFieldChange('height', typeof block?.height === 'number' ? block.height : 200)}
                className={cn(
                  "flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors",
                  (typeof block?.height === 'number') ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                )}
              >
                Fixed
              </button>
            </div>
            {typeof block?.height === 'number' && (
              <NumberInput
                value={block.height}
                onChange={(val) => handleFieldChange('height', val)}
                step={10}
                min={20}
                suffix="px"
              />
            )}
          </div>
        </div>
        {block?.width && block.width !== '100%' && (
          <div className="space-y-1 mt-2">
            <span className="text-[10px] text-zinc-400">Alignment</span>
            <div className="flex gap-1">
              {['left', 'center', 'right'].map((a) => (
                <button
                  key={a}
                  onClick={() => handleFieldChange('alignment', a)}
                  className={cn(
                    "flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors capitalize",
                    (block?.alignment || 'center') === a ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}
      </FieldGroup>

      <FieldGroup label="Object Fit">
        <div className="flex gap-1">
          {['cover', 'contain', 'fill'].map((fit) => (
            <button
              key={fit}
              onClick={() => handleFieldChange('objectFit', fit)}
              className={cn(
                "flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors",
                (block?.objectFit || 'cover') === fit
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              )}
            >
              {fit.charAt(0).toUpperCase() + fit.slice(1)}
            </button>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="Border Radius">
        <NumberInput
          value={block?.borderRadius || 0}
          min={0}
          max={50}
          onChange={(val) => handleFieldChange('borderRadius', val)}
          suffix="px"
        />
      </FieldGroup>
    </div>
  );

  const renderImageCollageEditor = () => {
    const currentPreset = section.layout || 'featured-left';
    const preset = getPresetById(currentPreset);
    const imageCount = preset ? getImageCountForPreset(preset) : 4;
    const selectedImage = selectedImageIndex !== null ? section.images?.[selectedImageIndex] : null;
    const selectedFocalPoint = selectedImageIndex !== null 
      ? section.focalPoints?.[selectedImageIndex] || { x: 50, y: 50 }
      : null;
    const selectedBackground = selectedImageIndex !== null 
      ? section.imageBackgrounds?.[selectedImageIndex] || ''
      : '';
    const selectedOverlay = selectedImageIndex !== null 
      ? section.imageOverlays?.[selectedImageIndex] || { color: '', opacity: 0 }
      : { color: '', opacity: 0 };
    
    return (
      <div className="space-y-6">
        {renderContainerSettings()}
        
        <FieldGroup label="Layout Preset">
          <CollagePresetPicker
            currentPreset={currentPreset}
            onSelectPreset={(presetId) => handleFieldChange('layout', presetId)}
          />
        </FieldGroup>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Gap">
            <NumberInput
              value={section.gap || 8}
              onChange={(val) => handleFieldChange('gap', val)}
              
              
              suffix="px"
            />
          </FieldGroup>

          <FieldGroup label="Height">
            <NumberInput
              value={section.imageHeight || 200}
              onChange={(val) => handleFieldChange('imageHeight', val)}
              
              
              step={10}
              suffix="px"
            />
          </FieldGroup>
        </div>

        <FieldGroup label="Bulk Import">
          <BulkImageUploader
            maxImages={imageCount}
            currentImages={section.images || []}
            onImagesChange={(images) => handleFieldChange('images', images)}
          />
        </FieldGroup>

        <FieldGroup label={`Individual Images (${imageCount})`}>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: imageCount }).map((_, index) => {
              const hasBackground = section.imageBackgrounds?.[index];
              const hasOverlay = section.imageOverlays?.[index]?.opacity > 0;
              
              return (
                <div 
                  key={index} 
                  className={cn(
                    "relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
                    selectedImageIndex === index 
                      ? "border-[#04D1FC] ring-2 ring-[#04D1FC]/20" 
                      : "border-zinc-200 hover:border-zinc-300"
                  )}
                  onClick={() => setSelectedImageIndex(selectedImageIndex === index ? null : index)}
                >
                  <ImageUploader
                    currentImage={section.images?.[index]}
                    onImageUpload={(file) => {
                      handleArrayImageUpload(file, 'images', index);
                      setSelectedImageIndex(index);
                    }}
                    onRemoveBackground={() => {}}
                    isProcessing={isProcessing}
                    compact={true}
                  />
                  <span className="absolute top-1 left-1 w-5 h-5 rounded bg-black/60 text-white text-[10px] font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  {onSetCollageImage && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onSetCollageImage(selectedSection, selectedBlock, index); }}
                      className="absolute top-1 right-1 w-5 h-5 rounded bg-[#04D1FC]/80 hover:bg-[#04D1FC] text-white text-[8px] font-bold flex items-center justify-center transition-colors"
                      title="Set from media"
                    >
                      M
                    </button>
                  )}
                  {/* Indicators for background/overlay */}
                  <div className="absolute bottom-1 right-1 flex gap-0.5">
                    {hasBackground && (
                      <span 
                        className="w-3 h-3 rounded-full border border-white shadow"
                        style={{ backgroundColor: section.imageBackgrounds[index] }}
                        title="Has background"
                      />
                    )}
                    {hasOverlay && (
                      <span 
                        className="w-3 h-3 rounded-full border border-white shadow opacity-70"
                        style={{ backgroundColor: section.imageOverlays[index]?.color }}
                        title="Has overlay"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </FieldGroup>

        {/* Selected Image Settings */}
        {selectedImageIndex !== null && selectedImage && (
          <>
            <FieldGroup label={`Image ${selectedImageIndex + 1} Settings`}>
              <div className="space-y-4 p-3 bg-zinc-50 rounded-xl">
                {/* Focal Point */}
                <div>
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block mb-2">Focal Point</span>
                  <FocalPointPicker
                    image={selectedImage}
                    focalPoint={selectedFocalPoint}
                    onChange={(fp) => handleFocalPointChange(selectedImageIndex, fp)}
                  />
                </div>

                {/* Background Color (for cutouts) */}
                <div>
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block mb-2">
                    Background (for cutouts)
                  </span>
                  <ImageColorPicker
                    value={selectedBackground}
                    onChange={(color) => handleImageBackgroundChange(selectedImageIndex, color)}
                    placeholder="No background"
                    allowClear
                  />
                  <p className="text-[9px] text-zinc-400 mt-1">
                    Set a solid color behind transparent images
                  </p>
                </div>

                {/* Overlay Color */}
                <div>
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block mb-2">
                    Color Overlay
                  </span>
                  <ImageColorPicker
                    value={selectedOverlay.color}
                    onChange={(color) => handleImageOverlayChange(selectedImageIndex, { 
                      ...selectedOverlay, 
                      color: color,
                      opacity: selectedOverlay.opacity || 30
                    })}
                    placeholder="No overlay"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 w-12">Opacity</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedOverlay.opacity || 0}
                      onChange={(e) => handleImageOverlayChange(selectedImageIndex, { 
                        ...selectedOverlay, 
                        opacity: parseInt(e.target.value) 
                      })}
                      className="flex-1 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] text-zinc-600 w-8">{selectedOverlay.opacity || 0}%</span>
                  </div>
                  <p className="text-[9px] text-zinc-400 mt-1">
                    Add a color tint for text readability
                  </p>
                  {selectedOverlay.color && selectedOverlay.opacity > 0 && (
                    <button
                      onClick={() => handleImageOverlayChange(selectedImageIndex, { color: '', opacity: 0 })}
                      className="mt-2 h-7 px-2 text-[10px] text-zinc-500 hover:text-zinc-700 border border-zinc-200 rounded w-full"
                    >
                      Remove Overlay
                    </button>
                  )}
                </div>
              </div>
            </FieldGroup>
          </>
        )}

        {/* Snapshot to Image - backup for email clients that don't render gaps */}
        <FieldGroup label="Export as Image">
          <p className="text-[9px] text-zinc-400 mb-2">
            If gaps don't render correctly in email, snapshot the collage as a single image
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={async () => {
              const images = section.images || [];
              if (images.length === 0) {
                alert('No images to snapshot');
                return;
              }
              
              try {
                const gap = section.gap || 8;
                const totalHeight = section.imageHeight || 200;
                const canvasWidth = 600;
                const bgColor = section.backgroundColor || '#ffffff';
                
                // Get preset layout
                const currentPreset = section.layout || 'featured-left';
                const presetModule = await import('../../lib/collagePresets');
                const presetData = presetModule.getPresetById(currentPreset);
                
                if (!presetData || !presetData.preview) {
                  alert('Could not find layout preset');
                  return;
                }
                
                const grid = presetData.preview;
                const rows = grid.length;
                const cols = grid[0].length;
                const cellWidth = (canvasWidth - (gap * (cols - 1))) / cols;
                const cellHeight = (totalHeight - (gap * (rows - 1))) / rows;
                
                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = canvasWidth;
                canvas.height = totalHeight;
                const ctx = canvas.getContext('2d');
                
                // Fill background
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvasWidth, totalHeight);
                
                // Track which cells we've drawn
                const drawnCells = new Set();
                
                // Load and draw images
                for (let r = 0; r < rows; r++) {
                  for (let c = 0; c < cols; c++) {
                    const cellId = grid[r][c];
                    if (drawnCells.has(cellId)) continue;
                    drawnCells.add(cellId);
                    
                    const imageIndex = cellId - 1;
                    const imageSrc = images[imageIndex];
                    if (!imageSrc) continue;
                    
                    // Calculate cell span
                    let colSpan = 1, rowSpan = 1;
                    while (c + colSpan < cols && grid[r][c + colSpan] === cellId) colSpan++;
                    while (r + rowSpan < rows && grid[r + rowSpan]?.[c] === cellId) rowSpan++;
                    
                    const x = c * (cellWidth + gap);
                    const y = r * (cellHeight + gap);
                    const w = cellWidth * colSpan + gap * (colSpan - 1);
                    const h = cellHeight * rowSpan + gap * (rowSpan - 1);
                    
                    // Load image
                    const img = new window.Image();
                    img.crossOrigin = 'anonymous';
                    await new Promise((resolve, reject) => {
                      img.onload = resolve;
                      img.onerror = reject;
                      img.src = imageSrc;
                    });
                    
                    // Draw with object-fit: cover
                    const imgRatio = img.width / img.height;
                    const cellRatio = w / h;
                    let sx, sy, sw, sh;
                    
                    if (imgRatio > cellRatio) {
                      sh = img.height;
                      sw = sh * cellRatio;
                      sx = (img.width - sw) / 2;
                      sy = 0;
                    } else {
                      sw = img.width;
                      sh = sw / cellRatio;
                      sx = 0;
                      sy = (img.height - sh) / 2;
                    }
                    
                    // Round corners with clipping
                    ctx.save();
                    ctx.beginPath();
                    ctx.roundRect(x, y, w, h, 8);
                    ctx.clip();
                    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
                    ctx.restore();
                  }
                }
                
                // Download
                const link = document.createElement('a');
                link.download = `collage-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
              } catch (error) {
                console.error('Snapshot failed:', error);
                alert('Snapshot failed: ' + error.message);
              }
            }}
          >
            <Camera className="w-4 h-4" />
            Snapshot as PNG
          </Button>
        </FieldGroup>
      </div>
    );
  };

  const renderImageSequenceEditor = () => {
    const sequenceImages = section.images || [];

    const handleSequenceImageUpload = async (files) => {
      const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
      if (imageFiles.length === 0) return;

      const newImages = await Promise.all(
        imageFiles.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
        })
      );

      handleFieldChange('images', [...sequenceImages, ...newImages]);
    };

    const removeSequenceImage = (index) => {
      const newImages = sequenceImages.filter((_, i) => i !== index);
      handleFieldChange('images', newImages);
    };

    const clearAllImages = () => {
      handleFieldChange('images', []);
    };

    return (
      <div className="space-y-6">
        {renderContainerSettings()}
        
        <FieldGroup label="Upload Images">
          <div 
            className="border-2 border-dashed border-zinc-200 rounded-xl p-6 text-center hover:border-[#04D1FC] transition-colors cursor-pointer"
            onClick={() => document.getElementById('sequence-upload')?.click()}
            onDrop={(e) => {
              e.preventDefault();
              handleSequenceImageUpload(e.dataTransfer.files);
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="text-3xl mb-2 opacity-30">📁</div>
            <p className="text-sm text-zinc-600 mb-1">Drop images or click to upload</p>
            <p className="text-xs text-zinc-400">{sequenceImages.length} images added</p>
            <input
              id="sequence-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleSequenceImageUpload(e.target.files)}
            />
          </div>
        </FieldGroup>

        {sequenceImages.length > 0 && (
          <>
            <FieldGroup label={`Frames (${sequenceImages.length})`}>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {sequenceImages.map((img, index) => (
                  <div key={index} className="relative group aspect-square rounded overflow-hidden border border-zinc-200">
                    <img src={img} alt={`Frame ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeSequenceImage(index)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      ×
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAllImages}
                  className="flex-1"
                >
                  Clear All
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    if (sequenceImages.length < 2) {
                      alert('Add at least 2 images to create a GIF');
                      return;
                    }
                    
                    setIsExportingGif(true);
                    setGifProgress(0);
                    
                    try {
                      const blob = await exportSequenceAsGif(sequenceImages, {
                        width: 600,
                        height: section.previewHeight || 300,
                        delay: section.frameDuration || 500,
                        backgroundColor: section.backgroundColor || '#FFFFFF',
                        onProgress: setGifProgress
                      });
                      
                      downloadBlob(blob, `sequence-${Date.now()}.gif`);
                    } catch (error) {
                      console.error('GIF export failed:', error);
                      alert('GIF export failed: ' + error.message);
                    } finally {
                      setIsExportingGif(false);
                      setGifProgress(0);
                    }
                  }}
                  disabled={isExportingGif || sequenceImages.length < 2}
                  className="flex-1 bg-[#04D1FC] hover:bg-[#04D1FC]/90"
                >
                  {isExportingGif ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {gifProgress}%
                    </>
                  ) : (
                    <>
                      <FileImage className="w-3.5 h-3.5" />
                      Export GIF
                    </>
                  )}
                </Button>
              </div>
            </FieldGroup>

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Frame Duration">
                <Select
                  value={section.frameDuration || 500}
                  onChange={(e) => handleFieldChange('frameDuration', parseInt(e.target.value))}
                  className="h-10"
                >
                  <option value={200}>200ms (Fast)</option>
                  <option value={300}>300ms</option>
                  <option value={500}>500ms</option>
                  <option value={750}>750ms</option>
                  <option value={1000}>1s</option>
                  <option value={1500}>1.5s</option>
                  <option value={2000}>2s (Slow)</option>
                </Select>
              </FieldGroup>

              <FieldGroup label="Preview Height">
                <NumberInput
                  value={section.previewHeight || 300}
                  onChange={(val) => handleFieldChange('previewHeight', val)}
                  
                  
                  step={25}
                  suffix="px"
                />
              </FieldGroup>
            </div>

            <FieldGroup label="Display Options">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={section.autoPlay !== false}
                    onChange={(e) => handleFieldChange('autoPlay', e.target.checked)}
                    className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
                  />
                  Auto-play animation
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={section.showControls || false}
                    onChange={(e) => handleFieldChange('showControls', e.target.checked)}
                    className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
                  />
                  Show play/pause controls
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={section.showThumbnails || false}
                    onChange={(e) => handleFieldChange('showThumbnails', e.target.checked)}
                    className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
                  />
                  Show thumbnails strip
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={section.showFrameCounter || false}
                    onChange={(e) => handleFieldChange('showFrameCounter', e.target.checked)}
                    className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
                  />
                  Show frame counter
                </label>
              </div>
            </FieldGroup>

            <FieldGroup label="Background Color">
              <input
                type="color"
                value={section.backgroundColor || '#FFFFFF'}
                onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
                className="w-full h-10 rounded-lg border border-zinc-200 cursor-pointer"
              />
            </FieldGroup>

          </>
        )}

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-[10px] text-amber-700">
            <strong>📧 Email Note:</strong> Most email clients support GIFs. Export your sequence as a GIF for better compatibility.
          </p>
        </div>
      </div>
    );
  };

  const renderProfileCardsEditor = () => {
    const profileCount = section.columns || 4;
    const currentProfileImages = (section.profiles || []).map(p => p?.image).filter(Boolean);
    
    return (
      <div className="space-y-6">
        {renderContainerSettings()}
        
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Columns">
            <Select
              value={section.columns || 4}
              onChange={(e) => handleFieldChange('columns', parseInt(e.target.value))}
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </Select>
          </FieldGroup>

          <FieldGroup label="Shape">
            <Select
              value={section.imageShape || 'circular'}
              onChange={(e) => handleFieldChange('imageShape', e.target.value)}
            >
              <option value="circular">Circle</option>
              <option value="square">Square</option>
            </Select>
          </FieldGroup>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
            <input
              type="checkbox"
              checked={section.showName !== false}
              onChange={(e) => handleFieldChange('showName', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Name
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
            <input
              type="checkbox"
              checked={section.showTitle !== false}
              onChange={(e) => handleFieldChange('showTitle', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Title
          </label>
        </div>

        <FieldGroup label="Bulk Import Photos">
          <BulkImageUploader
            maxImages={profileCount}
            currentImages={currentProfileImages}
            onImagesChange={handleBulkProfileImages}
          />
        </FieldGroup>

        <FieldGroup label="Profiles">
          <div className="space-y-2">
            {Array.from({ length: profileCount }).map((_, index) => {
              const profile = section.profiles?.[index] || {};
              return (
                <div key={`${selectedSection}-profile-${index}`} className="p-3 bg-zinc-50 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-zinc-200 text-zinc-600 text-[10px] font-semibold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">Profile {index + 1}</span>
                  </div>
                  
                  <ImageUploader
                    currentImage={profile.image}
                    onImageUpload={(file) => {
                      if (!file) {
                        handleProfileFieldChange(index, 'image', null);
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        handleProfileFieldChange(index, 'image', e.target.result);
                      };
                      reader.readAsDataURL(file);
                    }}
                    onRemoveBackground={() => {}}
                    isProcessing={isProcessing}
                    compact={true}
                  />

                  <EditableInput
                    placeholder="Name"
                    value={profile.name || ''}
                    onChange={(val) => handleProfileFieldChange(index, 'name', val)}
                    sectionKey={`${selectedSection}-${index}`}
                    className="text-sm"
                  />

                  <EditableInput
                    placeholder="Title"
                    value={profile.title || ''}
                    onChange={(val) => handleProfileFieldChange(index, 'title', val)}
                    sectionKey={`${selectedSection}-${index}`}
                    className="text-sm"
                  />
                </div>
              );
            })}
          </div>
        </FieldGroup>
      </div>
    );
  };

  const renderRecipeEditor = () => (
    <div className="space-y-6">
      {renderContainerSettings()}
      
      <FieldGroup label="Recipe Title">
        <EditableInput
          value={section.title || ''}
          onChange={(val) => handleFieldChange('title', val)}
          sectionKey={selectedSection}
          placeholder="Recipe name"
        />
      </FieldGroup>

      <FieldGroup label="Recipe Image">
        <ImageUploader
          currentImage={section.image}
          onImageUpload={(file) => handleImageUpload(file, 'image')}
          onRemoveBackground={() => handleRemoveBackground('image')}
          isProcessing={isProcessing}
        />
      </FieldGroup>

      <FieldGroup label="Ingredients">
        <EditableTextarea
          value={section.ingredients || ''}
          onChange={(val) => handleFieldChange('ingredients', val)}
          sectionKey={selectedSection}
          rows={4}
          placeholder="List ingredients..."
          className="resize-none"
        />
      </FieldGroup>

      <FieldGroup label="Instructions">
        <EditableTextarea
          value={section.instructions || ''}
          onChange={(val) => handleFieldChange('instructions', val)}
          sectionKey={selectedSection}
          rows={4}
          placeholder="Step by step..."
          className="resize-none"
        />
      </FieldGroup>
    </div>
  );

  const renderMultiLayoutEditor = () => (
    <div className="space-y-6">
      {renderContainerSettings()}

      <FieldGroup label="Layout">
        <div className="grid grid-cols-3 gap-1.5">
          {Object.entries(LAYOUT_PRESETS).map(([id, preset]) => (
            <button
              key={id}
              onClick={() => handleFieldChange('layout', id)}
              className={cn(
                "relative rounded-lg overflow-hidden border-2 transition-all",
                (block?.layout || 'two-col-wide') === id
                  ? "border-[#04D1FC] shadow-sm"
                  : "border-zinc-200 hover:border-zinc-300"
              )}
              title={preset.label}
            >
              <img
                src={preset.thumbnail}
                alt={preset.label}
                className="w-full h-auto block"
                style={{ aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top' }}
              />
              {(block?.layout || 'two-col-wide') === id && (
                <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#04D1FC] flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="Badge Text">
        <EditableInput
          value={block?.badgeText || 'BUILDER'}
          onChange={(val) => handleFieldChange('badgeText', val)}
          sectionKey={selectedSection}
          placeholder="Badge label"
        />
      </FieldGroup>

      {(block?.layout || 'two-col-wide') === 'track-list' ? (
        <>
          <FieldGroup label="Tracks">
            {(block?.tracks || [
              { title: 'TITLE PROJECT 01', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
              { title: 'TITLE PROJECT 02', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
              { title: 'TITLE PROJECT 03', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
              { title: 'TITLE PROJECT 04', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
            ]).map((track, ti) => (
              <div key={ti} style={{ marginBottom: 12, padding: 8, background: 'rgba(0,0,0,0.03)', borderRadius: 8 }}>
                <EditableInput
                  value={track.title}
                  onChange={(val) => {
                    const tracks = [...(block?.tracks || [
                      { title: 'TITLE PROJECT 01', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                      { title: 'TITLE PROJECT 02', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                      { title: 'TITLE PROJECT 03', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                      { title: 'TITLE PROJECT 04', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                    ])];
                    tracks[ti] = { ...tracks[ti], title: val };
                    handleFieldChange('tracks', tracks);
                  }}
                  sectionKey={selectedSection}
                  placeholder="Track title"
                />
                <EditableTextarea
                  value={track.subjects.join('\n')}
                  onChange={(val) => {
                    const tracks = [...(block?.tracks || [
                      { title: 'TITLE PROJECT 01', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                      { title: 'TITLE PROJECT 02', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                      { title: 'TITLE PROJECT 03', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                      { title: 'TITLE PROJECT 04', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                    ])];
                    tracks[ti] = { ...tracks[ti], subjects: val.split('\n').filter(Boolean) };
                    handleFieldChange('tracks', tracks);
                  }}
                  sectionKey={selectedSection}
                  rows={4}
                  placeholder="One subject per line"
                  className="resize-none"
                  style={{ marginTop: 4, fontSize: 12 }}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const tracks = [...(block?.tracks || [
                  { title: 'TITLE PROJECT 01', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                  { title: 'TITLE PROJECT 02', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                  { title: 'TITLE PROJECT 03', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                  { title: 'TITLE PROJECT 04', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                ])];
                tracks.push({ title: `TITLE PROJECT ${String(tracks.length + 1).padStart(2, '0')}`, subjects: ['Subject 01'] });
                handleFieldChange('tracks', tracks);
              }}
              className="w-full py-1.5 text-xs text-zinc-500 hover:text-zinc-700 border border-dashed border-zinc-300 rounded-md"
            >
              + Add Track
            </button>
          </FieldGroup>
        </>
      ) : (
        <>
          <FieldGroup label="Title">
            <EditableInput
              value={block?.title || ''}
              onChange={(val) => handleFieldChange('title', val)}
              sectionKey={selectedSection}
              placeholder="Section title"
            />
          </FieldGroup>

          <FieldGroup label="Body Text">
            <EditableTextarea
              value={block?.body || ''}
              onChange={(val) => handleFieldChange('body', val)}
              sectionKey={selectedSection}
              rows={4}
              placeholder="Description..."
              className="resize-none"
            />
          </FieldGroup>

          <FieldGroup label="Image Height">
            <NumberInput
              value={block?.imageHeight || 180}
              min={80}
              max={400}
              onChange={(val) => handleFieldChange('imageHeight', val)}
            />
          </FieldGroup>

          <FieldGroup label="Image Border Radius">
            <NumberInput
              value={block?.imageBorderRadius || 12}
              min={0}
              max={32}
              onChange={(val) => handleFieldChange('imageBorderRadius', val)}
            />
          </FieldGroup>
        </>
      )}

      <FieldGroup label="Images">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, index) => {
            const img = block?.images?.[index];
            return (
              <div
                key={index}
                className="relative rounded-lg overflow-hidden border border-zinc-200 cursor-pointer hover:border-[#04D1FC] transition-colors"
                style={{ height: 48 }}
                onClick={() => onSetCollageImage?.(selectedSection, selectedBlock, index)}
              >
                {img ? (
                  <img src={img} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                    <Image size={14} style={{ opacity: 0.3 }} />
                  </div>
                )}
                <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded bg-black/60 text-white text-[8px] font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>
            );
          })}
        </div>
      </FieldGroup>
    </div>
  );

  const renderFooterEditor = () => {
    const socialLinks = section.socialLinks || {};
    const footerLinks = section.footerLinks || [];

    const handleSocialLinkChange = (platform, url) => {
      handleFieldChange('socialLinks', { ...socialLinks, [platform]: url });
    };

    const handleFooterLinkChange = (index, field, value) => {
      const newLinks = [...footerLinks];
      newLinks[index] = { ...newLinks[index], [field]: value };
      handleFieldChange('footerLinks', newLinks);
    };

    const addFooterLink = () => {
      handleFieldChange('footerLinks', [...footerLinks, { text: 'New Link', url: '#' }]);
    };

    const removeFooterLink = (index) => {
      handleFieldChange('footerLinks', footerLinks.filter((_, i) => i !== index));
    };

    return (
      <div className="space-y-6">
        {renderContainerSettings()}
        
        {/* Logo */}
        <FieldGroup label="Logo">
          <ImageUploader
            currentImage={section.logo}
            onImageUpload={(file) => handleImageUpload(file, 'logo')}
            className="h-24"
          />
          {section.logo && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-400">Width</span>
                <NumberInput
                  value={section.logoWidth || 120}
                  onChange={(val) => handleFieldChange('logoWidth', val)}
                  suffix="px"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-400">Height</span>
                <NumberInput
                  value={section.logoHeight || 40}
                  onChange={(val) => handleFieldChange('logoHeight', val)}
                  suffix="px"
                />
              </div>
            </div>
          )}
        </FieldGroup>

        {/* Social Links */}
        <FieldGroup label="Social Links">
          <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={section.showSocial !== false}
              onChange={(e) => handleFieldChange('showSocial', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Show social icons
          </label>
          {section.showSocial !== false && (
            <div className="space-y-2">
              {['facebook', 'x', 'linkedin', 'instagram', 'youtube', 'tiktok', 'rss'].map(platform => (
                <div key={platform} className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 w-16 capitalize">{platform}</span>
                  <input
                    type="text"
                    defaultValue={socialLinks[platform] || ''}
                    onBlur={(e) => handleSocialLinkChange(platform, e.target.value)}
                    placeholder="URL or #"
                    className="flex-1 h-8 px-2 text-xs rounded border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#04D1FC]"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-100">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Icon Size</span>
                  <NumberInput
                    value={section.socialIconSize || 24}
                    onChange={(val) => handleFieldChange('socialIconSize', val)}
                    suffix="px"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Icon Color</span>
                  <input
                    type="color"
                    value={section.socialIconColor || '#4B5563'}
                    onChange={(e) => handleFieldChange('socialIconColor', e.target.value)}
                    className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </FieldGroup>

        {/* Company Info */}
        <FieldGroup label="Company Info">
          <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={section.showCompanyInfo !== false}
              onChange={(e) => handleFieldChange('showCompanyInfo', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Show company info
          </label>
          {section.showCompanyInfo !== false && (
            <>
              <EditableTextarea
                value={section.companyInfo || ''}
                onChange={(val) => handleFieldChange('companyInfo', val)}
                sectionKey={selectedSection}
                rows={2}
                placeholder="Address, company name..."
                className="resize-none text-xs"
              />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Font Size</span>
                  <NumberInput
                    value={section.companyInfoFontSize || 14}
                    onChange={(val) => handleFieldChange('companyInfoFontSize', val)}
                    suffix="px"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Text Color</span>
                  <input
                    type="color"
                    value={section.companyInfoColor || '#374151'}
                    onChange={(e) => handleFieldChange('companyInfoColor', e.target.value)}
                    className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
                  />
                </div>
              </div>
            </>
          )}
        </FieldGroup>

        {/* Footer Links */}
        <FieldGroup label="Footer Links">
          <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={section.showFooterLinks !== false}
              onChange={(e) => handleFieldChange('showFooterLinks', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Show footer links
          </label>
          {section.showFooterLinks !== false && (
            <div className="space-y-2">
              {footerLinks.map((link, index) => (
                <div key={index} className="flex gap-1 items-center">
                  <input
                    type="text"
                    defaultValue={link.text}
                    onBlur={(e) => handleFooterLinkChange(index, 'text', e.target.value)}
                    placeholder="Text"
                    className="flex-1 h-8 px-2 text-xs rounded border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#04D1FC]"
                  />
                  <input
                    type="text"
                    defaultValue={link.url}
                    onBlur={(e) => handleFooterLinkChange(index, 'url', e.target.value)}
                    placeholder="URL"
                    className="flex-1 h-8 px-2 text-xs rounded border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#04D1FC]"
                  />
                  <button
                    onClick={() => removeFooterLink(index)}
                    className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded"
                  >
                    ×
                  </button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addFooterLink} className="w-full text-xs">
                + Add Link
              </Button>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-100">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Link Color</span>
                  <input
                    type="color"
                    value={section.linkColor || '#374151'}
                    onChange={(e) => handleFieldChange('linkColor', e.target.value)}
                    className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Font Size</span>
                  <NumberInput
                    value={section.linkFontSize || 14}
                    onChange={(val) => handleFieldChange('linkFontSize', val)}
                    suffix="px"
                  />
                </div>
              </div>
            </div>
          )}
        </FieldGroup>

        {/* Divider */}
        <FieldGroup label="Divider">
          <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
            <input
              type="checkbox"
              checked={section.showDivider !== false}
              onChange={(e) => handleFieldChange('showDivider', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Show divider line
          </label>
          {section.showDivider !== false && (
            <div className="space-y-1 mt-2">
              <span className="text-[9px] text-zinc-400">Divider Color</span>
              <input
                type="color"
                value={section.dividerColor || '#E5E7EB'}
                onChange={(e) => handleFieldChange('dividerColor', e.target.value)}
                className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
              />
            </div>
          )}
        </FieldGroup>

        {/* Style */}
        <FieldGroup label="Style">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-400">Background</span>
              <input
                type="color"
                value={section.backgroundColor || '#FFFFFF'}
                onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
                className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-400">Text Align</span>
              <Select
                value={section.textAlign || 'center'}
                onChange={(e) => handleFieldChange('textAlign', e.target.value)}
                className="h-8 text-xs"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </Select>
            </div>
          </div>
        </FieldGroup>

        {/* Spacing */}
        <FieldGroup label="Spacing">
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Tag to Content Gap</span>
            <NumberInput
              value={section.tagToContentGap ?? 60}
              onChange={(val) => handleFieldChange('tagToContentGap', val)}
              step={4}
              suffix="px"
            />
          </div>
        </FieldGroup>

        {/* Section Padding */}
        <FieldGroup label="Section Padding">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-400">Top</span>
              <NumberInput
                value={section.paddingTop ?? section.padding ?? 40}
                onChange={(val) => handleFieldChange('paddingTop', val)}
                step={4}
                suffix="px"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-400">Bottom</span>
              <NumberInput
                value={section.paddingBottom ?? section.padding ?? 40}
                onChange={(val) => handleFieldChange('paddingBottom', val)}
                step={4}
                suffix="px"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-400">Left</span>
              <NumberInput
                value={section.paddingLeft ?? section.padding ?? 40}
                onChange={(val) => handleFieldChange('paddingLeft', val)}
                step={4}
                suffix="px"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-400">Right</span>
              <NumberInput
                value={section.paddingRight ?? section.padding ?? 40}
                onChange={(val) => handleFieldChange('paddingRight', val)}
                step={4}
                suffix="px"
              />
            </div>
          </div>
        </FieldGroup>
      </div>
    );
  };

  const renderMarqueeEditor = () => {
    // Normalize items: backward compat for legacy comma-separated strings
    const getItemsArray = () => {
      const raw = section.items;
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') {
        return raw.split(',').map(s => s.trim()).filter(Boolean).map(v => ({ type: 'text', value: v }));
      }
      return [];
    };

    const itemsArray = getItemsArray();

    const updateItems = (newItems) => handleFieldChange('items', newItems);

    const updateItemAt = (index, patch) => {
      const next = [...itemsArray];
      next[index] = { ...next[index], ...patch };
      updateItems(next);
    };

    const removeItemAt = (index) => {
      updateItems(itemsArray.filter((_, i) => i !== index));
    };

    const moveItem = (index, dir) => {
      const target = index + dir;
      if (target < 0 || target >= itemsArray.length) return;
      const next = [...itemsArray];
      [next[index], next[target]] = [next[target], next[index]];
      updateItems(next);
    };

    const addTextLayer = () => {
      updateItems([...itemsArray, { type: 'text', value: 'New item' }]);
    };

    const addImageLayer = () => {
      updateItems([...itemsArray, { type: 'image', src: '' }]);
    };

    const handleImageUpload = async (index, file) => {
      if (!file) return;
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'newsletters/marquee');
        const res = await fetch('/api/images/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        updateItemAt(index, { src: data.url });
      } catch (err) {
        console.error('Marquee image upload failed:', err);
      }
    };

    return (
    <div className="space-y-6">
      {renderContainerSettings()}

      <FieldGroup label="Marquee Layers">
        <div className="space-y-2">
          {itemsArray.map((item, i) => (
            <div
              key={i}
              className="group flex items-start gap-1.5 p-2 bg-zinc-50 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors"
            >
              {/* Type badge */}
              <div className={cn(
                'flex-shrink-0 w-6 h-6 rounded flex items-center justify-center mt-0.5',
                item.type === 'image' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
              )}>
                {item.type === 'image' ? <FileImage className="w-3 h-3" /> : <Type className="w-3 h-3" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {item.type === 'image' ? (
                  item.src ? (
                    <div className="flex items-center gap-2">
                      <img src={item.src} alt="" className="w-8 h-8 object-contain rounded border border-zinc-200 bg-white" />
                      <button
                        onClick={() => updateItemAt(i, { src: '' })}
                        className="text-[10px] text-zinc-400 hover:text-red-500"
                      >
                        Replace
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-1.5 h-8 rounded border border-dashed border-zinc-300 hover:border-zinc-400 cursor-pointer transition-colors">
                      <FileImage className="w-3 h-3 text-zinc-400" />
                      <span className="text-[10px] text-zinc-500">Upload PNG</span>
                      <input
                        type="file"
                        accept="image/png,image/svg+xml,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => handleImageUpload(i, e.target.files?.[0])}
                      />
                    </label>
                  )
                ) : (
                  <input
                    type="text"
                    value={item.value || ''}
                    onChange={(e) => updateItemAt(i, { value: e.target.value })}
                    placeholder="Enter text..."
                    className="w-full h-7 px-2 text-xs rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#04D1FC] focus:border-transparent"
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => moveItem(i, -1)}
                  disabled={i === 0}
                  className="p-0.5 text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => moveItem(i, 1)}
                  disabled={i === itemsArray.length - 1}
                  className="p-0.5 text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeItemAt(i)}
                  className="p-0.5 text-zinc-400 hover:text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          {/* Add layer buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={addTextLayer}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border-2 border-dashed border-zinc-300 hover:border-[#04D1FC] hover:text-[#04D1FC] text-zinc-500 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span className="text-[10px] font-medium">Text</span>
            </button>
            <button
              onClick={addImageLayer}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border-2 border-dashed border-zinc-300 hover:border-purple-400 hover:text-purple-500 text-zinc-500 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span className="text-[10px] font-medium">Image</span>
            </button>
          </div>
        </div>
      </FieldGroup>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Speed">
          <Select
            value={section.speed || 30}
            onChange={(e) => handleFieldChange('speed', parseInt(e.target.value))}
          >
            <option value={15}>Fast (15s)</option>
            <option value={20}>Medium-Fast (20s)</option>
            <option value={30}>Medium (30s)</option>
            <option value={40}>Slow (40s)</option>
            <option value={60}>Very Slow (60s)</option>
          </Select>
        </FieldGroup>

        <FieldGroup label="Direction">
          <Select
            value={section.direction || 'left'}
            onChange={(e) => handleFieldChange('direction', e.target.value)}
          >
            <option value="left">← Left</option>
            <option value="right">→ Right</option>
          </Select>
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Background">
          <input
            type="color"
            value={section.backgroundColor || '#04D1FC'}
            onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
            className="w-full h-10 rounded-lg border border-zinc-200 cursor-pointer"
          />
        </FieldGroup>

        <FieldGroup label="Text Color">
          <input
            type="color"
            value={section.textColor || '#FFFFFF'}
            onChange={(e) => handleFieldChange('textColor', e.target.value)}
            className="w-full h-10 rounded-lg border border-zinc-200 cursor-pointer"
          />
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Font Size">
          <NumberInput
            value={section.fontSize || 14}
            onChange={(val) => handleFieldChange('fontSize', val)}
            suffix="px"
          />
        </FieldGroup>

        <FieldGroup label="Padding">
          <NumberInput
            value={section.paddingVertical || 10}
            onChange={(val) => handleFieldChange('paddingVertical', val)}
            suffix="px"
          />
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Separator">
          <Select
            value={section.separator || '•'}
            onChange={(e) => handleFieldChange('separator', e.target.value)}
          >
            <option value="•">• Bullet</option>
            <option value="|">| Pipe</option>
            <option value="·">· Dot</option>
            <option value="-">- Dash</option>
            <option value="★">★ Star</option>
            <option value="◆">◆ Diamond</option>
            <option value=" "> None</option>
          </Select>
        </FieldGroup>

        <FieldGroup label="Font Weight">
          <Select
            value={section.fontWeight || '500'}
            onChange={(e) => handleFieldChange('fontWeight', e.target.value)}
          >
            <option value="300">Light</option>
            <option value="400">Regular</option>
            <option value="500">Medium</option>
            <option value="600">Semibold</option>
            <option value="700">Bold</option>
          </Select>
        </FieldGroup>
      </div>

      <FieldGroup label="Image Size">
        <NumberInput
          value={section.imageSize || 24}
          onChange={(val) => handleFieldChange('imageSize', val)}
          suffix="px"
        />
        <span className="text-[10px] text-zinc-400 mt-1">Size of image layers in the marquee</span>
      </FieldGroup>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
          <input
            type="checkbox"
            checked={section.pauseOnHover !== false}
            onChange={(e) => handleFieldChange('pauseOnHover', e.target.checked)}
            className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
          />
          Pause on hover
        </label>
      </div>

      <FieldGroup label="GIF Export">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExportMarqueeGif()}
          disabled={isExportingGif}
          className="w-full"
        >
          {isExportingGif ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting... {gifProgress}%
            </>
          ) : (
            <>
              <FileImage className="w-4 h-4" />
              Export as GIF
            </>
          )}
        </Button>
        <p className="text-[9px] text-zinc-400 mt-1">
          For email clients without CSS animation support.
        </p>
      </FieldGroup>
    </div>
    );
  };

  const renderAccentTextEditor = () => (
    <div className="space-y-6">
      {renderContainerSettings()}
      
      <FieldGroup label="Tag/Badge">
        <input
          type="text"
          key={`tagText-${selectedSection}`}
          defaultValue={section.tagText || 'HIGHLIGHT'}
          onBlur={(e) => handleFieldChange('tagText', e.target.value)}
          placeholder="Tag text"
          className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#04D1FC]"
        />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Background</span>
            <input
              type="color"
              value={section.tagBackgroundColor || '#04D1FC'}
              onChange={(e) => handleFieldChange('tagBackgroundColor', e.target.value)}
              className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Text Color</span>
            <input
              type="color"
              value={section.tagTextColor || '#FFFFFF'}
              onChange={(e) => handleFieldChange('tagTextColor', e.target.value)}
              className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Position</span>
            <Select
              value={section.tagPosition || 'top-right'}
              onChange={(e) => handleFieldChange('tagPosition', e.target.value)}
              className="h-10"
            >
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Font Size</span>
            <NumberInput
              value={section.tagFontSize || 14}
              onChange={(val) => handleFieldChange('tagFontSize', val)}
              suffix="px"
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup label="Content">
        <EditableTextarea
          value={section.content || ''}
          onChange={(val) => handleFieldChange('content', val)}
          sectionKey={selectedSection}
          rows={5}
          placeholder="Enter content..."
          className="resize-none"
        />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Font Size</span>
            <NumberInput
              value={section.contentFontSize || 18}
              onChange={(val) => handleFieldChange('contentFontSize', val)}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Text Color</span>
            <input
              type="color"
              value={section.contentColor || '#333333'}
              onChange={(e) => handleFieldChange('contentColor', e.target.value)}
              className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup label="Layout">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Direction</span>
            <Select
              value={section.direction || 'rtl'}
              onChange={(e) => handleFieldChange('direction', e.target.value)}
              className="h-10"
            >
              <option value="rtl">RTL (Hebrew)</option>
              <option value="ltr">LTR (English)</option>
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Text Align</span>
            <Select
              value={section.contentAlign || 'right'}
              onChange={(e) => handleFieldChange('contentAlign', e.target.value)}
              className="h-10"
            >
              <option value="right">Right</option>
              <option value="center">Center</option>
              <option value="left">Left</option>
            </Select>
          </div>
        </div>
        <div className="space-y-1 mt-2">
          <span className="text-[10px] text-zinc-400">Background</span>
          <input
            type="color"
            value={section.backgroundColor || '#FFFFFF'}
            onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
            className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
          />
        </div>
      </FieldGroup>

      <FieldGroup label="Section Padding">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Top</span>
            <NumberInput
              value={section.paddingTop ?? section.padding ?? 40}
              onChange={(val) => handleFieldChange('paddingTop', val)}
              step={4}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Bottom</span>
            <NumberInput
              value={section.paddingBottom ?? section.padding ?? 40}
              onChange={(val) => handleFieldChange('paddingBottom', val)}
              step={4}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Left</span>
            <NumberInput
              value={section.paddingLeft ?? section.padding ?? 40}
              onChange={(val) => handleFieldChange('paddingLeft', val)}
              step={4}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Right</span>
            <NumberInput
              value={section.paddingRight ?? section.padding ?? 40}
              onChange={(val) => handleFieldChange('paddingRight', val)}
              step={4}
              suffix="px"
            />
          </div>
        </div>
      </FieldGroup>
    </div>
  );

  const renderPromoCardEditor = () => (
    <div className="space-y-6">
      {renderContainerSettings()}
      
      <FieldGroup label="Title">
        <input
          type="text"
          key={`title-${selectedSection}`}
          defaultValue={section.title || ''}
          onBlur={(e) => handleFieldChange('title', e.target.value)}
          placeholder="Card title"
          className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#04D1FC]"
        />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Font Size</span>
            <NumberInput
              value={section.titleFontSize || 28}
              onChange={(val) => handleFieldChange('titleFontSize', val)}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Color</span>
            <input
              type="color"
              value={section.titleColor || '#1A1A1A'}
              onChange={(e) => handleFieldChange('titleColor', e.target.value)}
              className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup label="Body">
        <EditableTextarea
          value={section.body || ''}
          onChange={(val) => handleFieldChange('body', val)}
          sectionKey={selectedSection}
          rows={4}
          placeholder="Card content..."
          className="resize-none"
        />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Font Size</span>
            <NumberInput
              value={section.bodyFontSize || 16}
              onChange={(val) => handleFieldChange('bodyFontSize', val)}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Color</span>
            <input
              type="color"
              value={section.bodyColor || '#555555'}
              onChange={(e) => handleFieldChange('bodyColor', e.target.value)}
              className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup label="Call to Action">
        <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={section.showCta !== false}
            onChange={(e) => handleFieldChange('showCta', e.target.checked)}
            className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
          />
          Show CTA link
        </label>
        {section.showCta !== false && (
          <>
            <input
              type="text"
              key={`cta-${selectedSection}`}
              defaultValue={section.ctaText || ''}
              onBlur={(e) => handleFieldChange('ctaText', e.target.value)}
              placeholder="Link text"
              className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#04D1FC]"
            />
            <div className="space-y-1 mt-2">
              <span className="text-[10px] text-zinc-400">CTA Color</span>
              <input
                type="color"
                value={section.ctaColor || '#04D1FC'}
                onChange={(e) => handleFieldChange('ctaColor', e.target.value)}
                className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
              />
            </div>
          </>
        )}
      </FieldGroup>

      <FieldGroup label="Image">
        <ImageUploader
          currentImage={section.image}
          onImageUpload={(file) => handleImageUpload(file, 'image')}
          onRemoveBackground={() => handleRemoveBackground('image')}
          isProcessing={isProcessing}
        />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Position</span>
            <Select
              value={section.imagePosition || 'right'}
              onChange={(e) => handleFieldChange('imagePosition', e.target.value)}
              className="h-10"
            >
              <option value="right">Right</option>
              <option value="left">Left</option>
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Width</span>
            <NumberInput
              value={section.imageWidth || 200}
              onChange={(val) => handleFieldChange('imageWidth', val)}
              suffix="px"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer mt-2">
          <input
            type="checkbox"
            checked={section.showImagePlaceholder !== false}
            onChange={(e) => handleFieldChange('showImagePlaceholder', e.target.checked)}
            className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
          />
          Show placeholder when empty
        </label>
      </FieldGroup>

      <FieldGroup label="Card Style">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Background</span>
            <input
              type="color"
              value={section.backgroundColor || '#F8F9FA'}
              onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
              className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Border Radius</span>
            <NumberInput
              value={section.borderRadius || 16}
              onChange={(val) => handleFieldChange('borderRadius', val)}
              suffix="px"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Direction</span>
            <Select
              value={section.direction || 'rtl'}
              onChange={(e) => handleFieldChange('direction', e.target.value)}
              className="h-10"
            >
              <option value="rtl">RTL (Hebrew)</option>
              <option value="ltr">LTR (English)</option>
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Text Align</span>
            <Select
              value={section.contentAlign || 'right'}
              onChange={(e) => handleFieldChange('contentAlign', e.target.value)}
              className="h-10"
            >
              <option value="right">Right</option>
              <option value="center">Center</option>
              <option value="left">Left</option>
            </Select>
          </div>
        </div>
      </FieldGroup>

      {/* Spacing */}
      <FieldGroup label="Content Spacing">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Title to Body</span>
            <NumberInput
              value={section.titleToBodyGap ?? 16}
              onChange={(val) => handleFieldChange('titleToBodyGap', val)}
              step={4}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Body to CTA</span>
            <NumberInput
              value={section.bodyToCtaGap ?? 20}
              onChange={(val) => handleFieldChange('bodyToCtaGap', val)}
              step={4}
              suffix="px"
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup label="Section Padding">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Top</span>
            <NumberInput
              value={section.paddingTop ?? section.padding ?? 32}
              onChange={(val) => handleFieldChange('paddingTop', val)}
              step={4}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Bottom</span>
            <NumberInput
              value={section.paddingBottom ?? section.padding ?? 32}
              onChange={(val) => handleFieldChange('paddingBottom', val)}
              step={4}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Left</span>
            <NumberInput
              value={section.paddingLeft ?? section.padding ?? 32}
              onChange={(val) => handleFieldChange('paddingLeft', val)}
              step={4}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Right</span>
            <NumberInput
              value={section.paddingRight ?? section.padding ?? 32}
              onChange={(val) => handleFieldChange('paddingRight', val)}
              step={4}
              suffix="px"
            />
          </div>
        </div>
      </FieldGroup>
    </div>
  );

  // Section-level background + padding + height editor
  const renderSectionSettingsEditor = () => {
    if (!parentSection) return null;
    const bg = parentSection.background || {};
    const pad = parentSection.padding || {};

    return (
      <div className="space-y-2">
        <FieldGroup label="Section">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Name</span>
            <input
              type="text"
              value={parentSection.name || ''}
              onChange={(e) => onSectionUpdate(selectedSection, { name: e.target.value || null })}
              placeholder={parentSection.type === 'header' ? 'Header' : parentSection.type === 'footer' ? 'Footer' : 'Section'}
              className="w-full h-8 px-2 text-xs border border-zinc-200 rounded-md bg-white placeholder:text-zinc-300"
            />
          </div>
        </FieldGroup>

        <FieldGroup label="Background">
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400">Type</span>
              <select
                value={bg.type || 'solid'}
                onChange={(e) => handleBackgroundChange('type', e.target.value)}
                className="w-full h-8 px-2 text-xs border border-zinc-200 rounded-md bg-white"
              >
                <option value="solid">Solid Color</option>
                <option value="gradient">Gradient</option>
                <option value="image">Image</option>
                <option value="none">Transparent</option>
              </select>
            </div>

            {bg.type === 'solid' && (
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Color</span>
                <ImageColorPicker
                  value={bg.color || '#FFFFFF'}
                  onChange={(val) => handleBackgroundChange('color', val)}
                  allowClear
                />
              </div>
            )}

            {bg.type === 'gradient' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400">Start</span>
                    <ImageColorPicker
                      value={bg.gradientStart || '#04D1FC'}
                      onChange={(val) => handleBackgroundChange('gradientStart', val)}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400">End</span>
                    <ImageColorPicker
                      value={bg.gradientEnd || '#17A298'}
                      onChange={(val) => handleBackgroundChange('gradientEnd', val)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400">Angle</span>
                  <NumberInput
                    value={bg.gradientAngle ?? 180}
                    onChange={(val) => handleBackgroundChange('gradientAngle', val)}
                    min={0} max={360} step={15}
                    suffix="°"
                  />
                </div>
              </>
            )}

            {bg.type === 'image' && (
              <div className="space-y-2">
                <ImageUploader
                  currentImage={bg.image || null}
                  onImageUpload={(fileOrUrl) => {
                    if (!fileOrUrl) {
                      handleBackgroundChange('image', null);
                      return;
                    }
                    if (typeof fileOrUrl === 'string') {
                      handleBackgroundChange('image', fileOrUrl);
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (e) => handleBackgroundChange('image', e.target.result);
                    reader.readAsDataURL(fileOrUrl);
                  }}
                  onImageUrl={(url) => handleBackgroundChange('image', url)}
                  compact
                />
                <p className="text-[9px] text-zinc-400">Background fills 100% width, auto height</p>
                {bg.image && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400">Size</span>
                      <select
                        value={bg.imageSize || 'cover'}
                        onChange={(e) => handleBackgroundChange('imageSize', e.target.value)}
                        className="w-full h-8 px-2 text-xs border border-zinc-200 rounded-md bg-white"
                      >
                        <option value="cover">Cover</option>
                        <option value="contain">Contain</option>
                        <option value="100% auto">Stretch</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400">Position</span>
                      <select
                        value={bg.imagePosition || 'center'}
                        onChange={(e) => handleBackgroundChange('imagePosition', e.target.value)}
                        className="w-full h-8 px-2 text-xs border border-zinc-200 rounded-md bg-white"
                      >
                        <option value="center">Center</option>
                        <option value="center top">Top</option>
                        <option value="center bottom">Bottom</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </FieldGroup>

        <FieldGroup label="Padding">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400">Top</span>
              <NumberInput value={pad.top ?? 24} onChange={(v) => handlePaddingChange('top', v)} step={4} suffix="px" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400">Bottom</span>
              <NumberInput value={pad.bottom ?? 24} onChange={(v) => handlePaddingChange('bottom', v)} step={4} suffix="px" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400">Left</span>
              <NumberInput value={pad.left ?? 24} onChange={(v) => handlePaddingChange('left', v)} step={4} suffix="px" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400">Right</span>
              <NumberInput value={pad.right ?? 24} onChange={(v) => handlePaddingChange('right', v)} step={4} suffix="px" />
            </div>
          </div>
        </FieldGroup>

        <FieldGroup label="Size">
          <div className="space-y-2">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400">Height</span>
              <div className="flex gap-2">
                <button
                  onClick={() => onSectionUpdate(selectedSection, { height: 'auto' })}
                  className={cn("flex-1 h-8 text-xs rounded-md border", (!parentSection.height || parentSection.height === 'auto') ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200 text-zinc-600")}
                >
                  Auto
                </button>
                <button
                  onClick={() => onSectionUpdate(selectedSection, { height: 200 })}
                  className={cn("flex-1 h-8 text-xs rounded-md border", (parentSection.height && parentSection.height !== 'auto') ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200 text-zinc-600")}
                >
                  Fixed
                </button>
              </div>
            </div>
            {parentSection.height && parentSection.height !== 'auto' && (
              <NumberInput
                value={parentSection.height || 200}
                onChange={(v) => onSectionUpdate(selectedSection, { height: v })}
                step={10}
                min={40}
                suffix="px"
              />
            )}
          </div>
        </FieldGroup>

        <FieldGroup label="Corners">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Border Radius</span>
            <NumberInput
              value={parentSection.borderRadius ?? 0}
              onChange={(v) => onSectionUpdate(selectedSection, { borderRadius: v })}
              step={2}
              min={0}
              max={48}
              suffix="px"
            />
          </div>
        </FieldGroup>

        {/* Content structure */}
        {isGridSection(parentSection) ? (
          /* ── Grid mode: rows & columns ── */
          <FieldGroup label={`Rows (${parentSection.rows?.length || 0})`}>
            <div className="space-y-2">
              {parentSection.rows?.map((row, rowIdx) => (
                <div key={row.id} className="border border-zinc-200 rounded-md p-2 space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-wide">Row {rowIdx + 1}</span>
                    <span className="text-[9px] text-zinc-300 ml-auto">
                      {row.columns.map(c => c.span).join(' + ')} = 12
                    </span>
                  </div>
                  {row.columns.map((col, colIdx) => (
                    <div key={col.id} className="pl-2 border-l-2 border-zinc-100 space-y-0.5">
                      <span className="text-[9px] text-zinc-400">Col {colIdx + 1} ({col.span}/12)</span>
                      {col.blocks.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => onBlockClick?.(parentSection.id, b.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1 rounded text-[10px] transition-all text-left",
                            selectedBlock === b.id
                              ? "bg-zinc-900 text-white"
                              : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                          )}
                        >
                          <span className="capitalize font-medium truncate">{b.type}</span>
                        </button>
                      ))}
                      {col.blocks.length === 0 && (
                        <p className="text-[9px] text-zinc-300 italic pl-2">empty</p>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {/* Add Row */}
              <div className="space-y-1 pt-1">
                <span className="text-[9px] text-zinc-400 font-medium">Add Row</span>
                <div className="grid grid-cols-3 gap-1">
                  {ROW_LAYOUTS.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => {
                        const cols = layout.spans.map(span => createGridColumn(span));
                        const newRow = createGridRow(cols);
                        onSectionUpdate(selectedSection, {
                          rows: [...(parentSection.rows || []), newRow],
                        });
                      }}
                      className="h-7 px-1 text-[8px] text-zinc-500 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded transition-colors truncate"
                      title={layout.label}
                    >
                      {layout.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </FieldGroup>
        ) : (
          /* ── Legacy flat blocks mode (unchanged) ── */
          <FieldGroup label={`Blocks (${parentSection.blocks?.length || 0})`}>
            <div className="space-y-1">
              {parentSection.blocks?.map((b, idx) => (
                <button
                  key={b.id}
                  onClick={() => onBlockClick?.(parentSection.id, b.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all text-left",
                    selectedBlock === b.id
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                  )}
                >
                  <span className="capitalize font-medium truncate">{b.type}</span>
                  <span className="ml-auto text-[10px] opacity-50">#{idx + 1}</span>
                </button>
              ))}
              {(!parentSection.blocks || parentSection.blocks.length === 0) && (
                <p className="text-[10px] text-zinc-400 text-center py-2">No blocks yet</p>
              )}
            </div>

            {/* Convert to Grid */}
            {parentSection.type === 'section' && (
              <button
                onClick={() => {
                  const rows = blocksToRows(parentSection.blocks || []);
                  onSectionUpdate(selectedSection, { rows, blocks: parentSection.blocks });
                }}
                className="w-full mt-2 h-7 text-[10px] text-zinc-500 hover:text-[#04D1FC] bg-zinc-50 hover:bg-[#04D1FC]/5 border border-dashed border-zinc-200 hover:border-[#04D1FC] rounded-md transition-colors"
              >
                Switch to Grid Layout
              </button>
            )}
          </FieldGroup>
        )}
      </div>
    );
  };

  const renderBlockEditor = () => {
    if (!block) return null;

    switch (block.type) {
      case 'text': return renderTextEditor();
      case 'title': return renderSectionHeaderEditor();
      case 'marquee': return renderMarqueeEditor();
      case 'promoCard': return renderPromoCardEditor();
      case 'image': return renderImageBlockEditor();
      case 'imageCollage': return renderImageCollageEditor();
      case 'imageSequence': return renderImageSequenceEditor();
      case 'profileCards': return renderProfileCardsEditor();
      case 'recipe': return renderRecipeEditor();
      case 'multiLayout': return renderMultiLayoutEditor();
      default: return <p className="text-sm text-zinc-500">Block: {block.type}</p>;
    }
  };

  const renderEditor = () => {
    if (!section) return null;
    if (block) return renderBlockEditor();
    return renderSectionSettingsEditor();
  };

  const tabs = [
    { id: 'edit', label: 'Edit', icon: Settings },
    { id: 'theme', label: 'Theme', icon: Palette },
  ];

  return (
    <div className="w-80 bg-white/95 backdrop-blur-sm border-l border-zinc-200/60 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-zinc-200/60 bg-zinc-50/30">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-active={isActive}
              className={cn(
                "sidebar-tab flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1.5",
                isActive
                  ? "text-zinc-900" 
                  : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Lock Toggle */}
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-600">Reorder</span>
        </div>
        <button
          onClick={onToggleUnlock}
          className={cn(
            "btn-spring flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium",
            isUnlocked 
              ? "bg-[#04D1FC] text-white shadow-[0_2px_10px_rgba(4,209,252,0.3)]" 
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          )}
        >
          {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          {isUnlocked ? 'Unlocked' : 'Locked'}
        </button>
      </div>

      {/* Content */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        style={{ scrollBehavior: 'auto' }}
      >
        {activeTab === 'edit' && (
          <>
            {!selectedSection ? (
              <div className="p-4">
                {/* Page Settings when no section selected */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                      <Layers className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-900">Page Settings</h2>
                      <p className="text-[10px] text-zinc-400">Global canvas container</p>
                    </div>
                  </div>
                </div>

                {/* Outer Container */}
                <FieldGroup label="Page Background">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400">Outer Background Color</span>
                      <ImageColorPicker
                        value={newsletter?.pageSettings?.outerBackgroundColor || '#F5F5F5'}
                        onChange={(val) => onPageSettingsUpdate?.({ outerBackgroundColor: val })}
                        placeholder="#F5F5F5"
                        allowClear
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400">Outer Padding</span>
                      <NumberInput
                        value={newsletter?.pageSettings?.outerPadding ?? 20}
                        onChange={(val) => onPageSettingsUpdate?.({ outerPadding: val })}
                        step={4}
                        suffix="px"
                      />
                    </div>
                  </div>
                </FieldGroup>

                {/* Inner Container */}
                <FieldGroup label="Content Container">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400">Background Color</span>
                      <ImageColorPicker
                        value={newsletter?.pageSettings?.innerBackgroundColor || '#FFFFFF'}
                        onChange={(val) => onPageSettingsUpdate?.({ innerBackgroundColor: val })}
                        placeholder="#FFFFFF"
                        allowClear
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-400">Border Width</span>
                        <NumberInput
                          value={newsletter?.pageSettings?.innerBorderWidth ?? 0}
                          onChange={(val) => onPageSettingsUpdate?.({ innerBorderWidth: val })}
                          step={1}
                          suffix="px"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-400">Border Radius</span>
                        <NumberInput
                          value={newsletter?.pageSettings?.innerBorderRadius ?? 0}
                          onChange={(val) => onPageSettingsUpdate?.({ innerBorderRadius: val })}
                          step={2}
                          suffix="px"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400">Border Color</span>
                      <ImageColorPicker
                        value={newsletter?.pageSettings?.innerBorderColor || '#E5E5E5'}
                        onChange={(val) => onPageSettingsUpdate?.({ innerBorderColor: val })}
                        placeholder="#E5E5E5"
                        allowClear
                      />
                    </div>
                  </div>
                </FieldGroup>

                <div className="mt-6 p-3 bg-zinc-50 rounded-lg text-center">
                  <MousePointerClick className="w-5 h-5 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">Click a section to edit its content</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                  <div className="flex items-center justify-between">
                    {block ? (
                      <>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onBlockClick?.(selectedSection, null)}
                            className="text-xs text-zinc-400 hover:text-zinc-600"
                          >
                            ← Section
                          </button>
                          <span className="text-zinc-300">/</span>
                          <h2 className="text-sm font-semibold text-zinc-900 capitalize">{block.type} Block</h2>
                        </div>
                        <Badge className="text-[10px] capitalize bg-[#04D1FC] text-white">
                          {block.type}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <h2 className="text-sm font-semibold text-zinc-900 capitalize">
                          {parentSection?.name || (parentSection?.type === 'section' ? 'Section' : parentSection?.type)} Settings
                        </h2>
                        <Badge className="text-[10px] capitalize bg-zinc-900 text-white">
                          {parentSection?.type}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 content-enter" key={block ? `block-${selectedBlock}` : `section-${selectedSection}`}>
                  {renderEditor()}
                </div>

                {block && (
                  <div className="p-4 border-t border-zinc-100 bg-zinc-50/30">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Delete this block?')) {
                          onDeleteBlock?.(selectedSection, selectedBlock);
                        }
                      }}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Block
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'theme' && (
          <ThemePanel 
            onSelectColor={handleColorSelect}
            onSelectGradient={handleGradientSelect}
          />
        )}

      </div>
    </div>
  );
}

export default SidebarEditor;
