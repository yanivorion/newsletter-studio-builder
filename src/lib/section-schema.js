// ── Section Schema ─────────────────────────────────────────────────
// Defines the new container-based architecture:
//   • 3 top-level types: header | section | footer
//   • Each section is a container with background, padding, sizing
//   • Sections contain an ordered array of blocks (child components)
//   • Presets pre-populate a section with specific blocks
// ───────────────────────────────────────────────────────────────────

import { blocksToRows } from './grid-schema';

// ── Block Types ────────────────────────────────────────────────────
export const BLOCK_TYPES = {
  text:           { label: 'Text',           icon: 'Type' },
  title:          { label: 'Title',          icon: 'Heading' },
  image:          { label: 'Image',          icon: 'Image' },
  imageCollage:   { label: 'Image Grid',     icon: 'LayoutGrid' },
  imageSequence:  { label: 'Sequence',       icon: 'Film' },
  marquee:        { label: 'Marquee',        icon: 'MoveHorizontal' },
  promoCard:      { label: 'Promo Card',     icon: 'LayoutTemplate' },
  profileCards:   { label: 'Profiles',       icon: 'Users' },
  recipe:         { label: 'Recipe',         icon: 'ChefHat' },
  multiLayout:    { label: 'Layout',         icon: 'Columns' },
  button:         { label: 'Button',         icon: 'MousePointerClick' },
  divider:        { label: 'Divider',        icon: 'Minus' },
  spacer:         { label: 'Spacer',         icon: 'ArrowUpDown' },
  logo:           { label: 'Logo',           icon: 'ImageIcon' },
  socialLinks:    { label: 'Social Links',   icon: 'Share2' },
  footerLinks:    { label: 'Footer Links',   icon: 'Link' },
  companyInfo:    { label: 'Company Info',   icon: 'Building2' },
};

// ── Section Types ──────────────────────────────────────────────────
export const SECTION_TYPES = {
  header:  { label: 'Header',  icon: 'LayoutTemplate' },
  section: { label: 'Section', icon: 'Square' },
  footer:  { label: 'Footer',  icon: 'PanelBottom' },
};

// ── Default Background ─────────────────────────────────────────────
export function defaultBackground(overrides = {}) {
  return {
    type: 'solid',        // 'solid' | 'gradient' | 'image' | 'none'
    color: '#FFFFFF',
    fallbackColor: null,
    gradientStart: '#04D1FC',
    gradientEnd: '#17A298',
    gradientAngle: 180,
    image: null,
    imagePosition: 'center',
    imageSize: 'cover',
    imageRepeat: 'no-repeat',
    imageOverlayColor: null,
    imageOverlayOpacity: 0.3,
    ...overrides,
  };
}

// ── Default Padding ────────────────────────────────────────────────
export function defaultPadding(overrides = {}) {
  return {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    ...overrides,
  };
}

// ── Default Block Data ─────────────────────────────────────────────
export function getDefaultBlockData(blockType) {
  const defaults = {
    text: {
      content: 'Enter your text here...',
      textAlign: 'center',
      direction: 'ltr',
      fontFamily: 'Poppins',
      fontSize: 16,
      color: '#120F0F',
      lineHeight: 1.6,
      padding: 0,
    },
    title: {
      text: 'SECTION TITLE',
      fontSize: 18,
      fontWeight: 700,
      fontStyle: 'normal',
      letterSpacing: '0.1em',
      color: '#FFFFFF',
      textAlign: 'center',
      padding: 12,
      backgroundColor: null,
      borderRadius: 0,
      showChevron: false,
      maxWidth: null,
    },
    image: {
      src: null,
      alt: '',
      width: '100%',
      height: 'auto',
      objectFit: 'cover',
      borderRadius: 0,
      showPlaceholder: true,
    },
    imageCollage: {
      layout: '4-column',
      images: [],
      gap: 10,
      imageHeight: 200,
    },
    imageSequence: {
      images: [],
      frameDuration: 500,
      showControls: false,
      showThumbnails: false,
      showFrameCounter: false,
      autoPlay: true,
      previewHeight: 300,
    },
    marquee: {
      items: [
        { type: 'text', value: '🎉 New Announcement' },
        { type: 'text', value: '⭐ Special Offer' },
        { type: 'text', value: '🚀 Coming Soon' },
        { type: 'text', value: '💡 Did You Know' },
      ],
      speed: 30,
      direction: 'left',
      textColor: '#FFFFFF',
      fontSize: 14,
      fontWeight: '500',
      letterSpacing: '0.02em',
      paddingVertical: 10,
      separator: '•',
      imageSize: 24,
      pauseOnHover: true,
    },
    promoCard: {
      title: 'Card Title',
      titleFontSize: 28,
      titleFontWeight: '700',
      titleColor: '#1A1A1A',
      body: 'Add your promotional content here.',
      bodyFontSize: 16,
      bodyLineHeight: 1.7,
      bodyColor: '#555555',
      ctaText: 'Learn More →',
      ctaColor: '#04D1FC',
      ctaFontSize: 16,
      ctaLink: '#',
      showCta: true,
      image: null,
      imagePosition: 'right',
      imageWidth: 200,
      imageHeight: 160,
      imageBorderRadius: 12,
      showImagePlaceholder: true,
      gap: 24,
      direction: 'rtl',
      fontFamily: 'Noto Sans Hebrew',
      contentAlign: 'right',
    },
    profileCards: {
      profiles: [],
      columns: 4,
      imageShape: 'circular',
      showName: true,
      showTitle: true,
    },
    recipe: {
      title: 'Recipe Title',
      image: null,
      ingredients: '',
      instructions: '',
    },
    multiLayout: {
      layout: 'two-col-wide',
      badgeText: 'BUILDER',
      badgeColor: '#1a1a3e',
      title: 'THE LOOK & FEEL OF STUDIO 2.0',
      body: 'The first real look at the Studio 2.0 editor shell. Top Bar, Side Bar, and Side Panels live and interactive. We showcased the design decisions, UX direction, and visual language that define how Studio 2.0 feels.',
      images: [],
      imageHeight: 180,
      imageBorderRadius: 12,
    },
    button: {
      text: 'Click Here',
      url: '#',
      fontSize: 16,
      fontWeight: '600',
      textColor: '#FFFFFF',
      backgroundColor: '#04D1FC',
      borderRadius: 8,
      paddingH: 32,
      paddingV: 14,
      align: 'center',
      fullWidth: false,
    },
    divider: {
      color: '#E5E7EB',
      thickness: 1,
      style: 'solid',
      width: '100%',
      marginTop: 8,
      marginBottom: 8,
    },
    spacer: {
      height: 24,
    },
    logo: {
      src: null,
      width: 120,
      height: 'auto',
      alignment: 'center',
      rightText: null,
      rightTextColor: '#FFFFFF',
      rightTextFontSize: 11,
      rightTextFontWeight: 500,
      rightTextLetterSpacing: '0.05em',
    },
    socialLinks: {
      links: { facebook: '#', x: '#', linkedin: '#', instagram: '#', rss: '#' },
      iconSize: 24,
      iconColor: '#4B5563',
      align: 'center',
      gap: 12,
    },
    footerLinks: {
      links: [
        { text: 'Unsubscribe', url: '#' },
        { text: 'Help Center', url: '#' },
        { text: 'Privacy Policy', url: '#' },
        { text: 'Terms of Use', url: '#' },
      ],
      color: '#374151',
      fontSize: 14,
      align: 'center',
    },
    companyInfo: {
      text: '100 Gansevoort St., New York, NY 10014 • Company Name',
      color: '#374151',
      fontSize: 14,
      align: 'center',
    },
  };

  return defaults[blockType] || {};
}

// ── Create Block ───────────────────────────────────────────────────
export function createBlock(blockType, overrides = {}) {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: blockType,
    ...getDefaultBlockData(blockType),
    ...overrides,
  };
}

// ── Create Section ─────────────────────────────────────────────────
export function createSection(sectionType, options = {}) {
  const { preset = null, blocks = null, skipGrid = false } = options;

  const resolvedBlocks = blocks || getPresetBlocks(sectionType, preset);

  const section = {
    id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: sectionType,
    name: null,
    preset,
    background: defaultBackground(
      sectionType === 'header'
        ? { type: 'gradient', gradientStart: '#04D1FC', gradientEnd: '#17A298' }
        : sectionType === 'footer'
          ? { color: '#FFFFFF' }
          : preset === 'marquee'
            ? { type: 'solid', color: '#04D1FC' }
            : {}
    ),
    padding: defaultPadding(
      sectionType === 'header'
        ? { top: 0, bottom: 0, left: 0, right: 0 }
        : sectionType === 'footer'
          ? { top: 40, bottom: 40 }
          : {}
    ),
    height: sectionType === 'header' ? 350 : 'auto',
    minHeight: null,
    blocks: resolvedBlocks,
  };

  if (!skipGrid) {
    section.rows = blocksToRows(resolvedBlocks);
  }

  return section;
}

// ── Presets ─────────────────────────────────────────────────────────
export const SECTION_PRESETS = {
  blank:    { label: 'Blank',       description: 'Empty section' },
  text:     { label: 'Text',        description: 'Text content' },
  promo:    { label: 'Promo',       description: 'Image + text + CTA' },
  accent:   { label: 'Accent',      description: 'Highlighted text with tag' },
  gallery:  { label: 'Gallery',     description: 'Image grid' },
  sequence: { label: 'Sequence',    description: 'Animated image slideshow' },
  marquee:  { label: 'Marquee',     description: 'Scrolling ticker' },
  profiles: { label: 'Profiles',    description: 'Profile cards grid' },
  recipe:   { label: 'Recipe',      description: 'Recipe with ingredients' },
};

export function getPresetBlocks(sectionType, preset) {
  if (sectionType === 'header') {
    return [
      createBlock('logo'),
      createBlock('image', { showPlaceholder: true }),
    ];
  }

  if (sectionType === 'footer') {
    return [
      createBlock('logo', { width: 120, height: 40 }),
      createBlock('socialLinks'),
      createBlock('divider', { color: '#E5E7EB' }),
      createBlock('companyInfo'),
      createBlock('footerLinks'),
    ];
  }

  // Section presets
  switch (preset) {
    case 'text':
      return [createBlock('text')];

    case 'promo':
      return [createBlock('promoCard')];

    case 'accent':
      return [
        createBlock('title', {
          text: 'HIGHLIGHT',
          fontSize: 14,
          color: '#FFFFFF',
          textAlign: 'right',
        }),
        createBlock('text', {
          content: 'Enter your highlighted text content here...',
          fontSize: 18,
          textAlign: 'right',
          direction: 'rtl',
          fontFamily: 'Noto Sans Hebrew',
          lineHeight: 1.8,
        }),
      ];

    case 'gallery':
      return [createBlock('imageCollage')];

    case 'sequence':
      return [createBlock('imageSequence')];

    case 'marquee':
      return [createBlock('marquee')];

    case 'profiles':
      return [createBlock('profileCards')];

    case 'recipe':
      return [createBlock('recipe')];

    default:
      return [];
  }
}
