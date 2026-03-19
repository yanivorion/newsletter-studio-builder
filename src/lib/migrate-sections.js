// Migrates old flat-section newsletters to the new container+blocks format.
// Old format: sections = [{ type: 'text', content: '...' }, ...]
// New format: sections = [{ type: 'section', blocks: [{ type: 'text', content: '...' }], background: {...}, padding: {...} }]

import { defaultBackground, defaultPadding, createBlock } from './section-schema';
import { blocksToRows, isGridSection, createGridRow } from './grid-schema';

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function isNewFormat(newsletter) {
  if (!newsletter?.sections?.length) return true;
  const first = newsletter.sections[0];
  return Array.isArray(first.blocks);
}

export function migrateNewsletter(newsletter) {
  if (!newsletter?.sections?.length) return newsletter;

  let sections;
  if (isNewFormat(newsletter)) {
    sections = newsletter.sections.map(normalizeSectionDefaults);
  } else {
    sections = newsletter.sections.map(migrateSection).map(normalizeSectionDefaults);
  }

  const hasFooter = sections.some(s => s.type === 'footer');
  if (!hasFooter) {
    sections.push({
      id: `footer-${uid()}`,
      type: 'footer',
      backgroundColor: '#FFFFFF',
      textColor: '#6B7280',
      textAlign: 'center',
      paddingTop: 40,
      paddingBottom: 40,
      paddingLeft: 24,
      paddingRight: 24,
      logo: null,
      showSocial: true,
      socialLinks: {},
      showFooterLinks: true,
      footerLinks: [
        { text: 'Unsubscribe', url: '#' },
        { text: 'Help Center', url: '#' },
      ],
      companyName: '',
      companyAddress: '',
      copyrightText: '',
      blocks: [],
      rows: [createGridRow()],
    });
  }

  return { ...newsletter, sections };
}

function normalizeSectionDefaults(section) {
  let s = section;
  if (s.type === 'header' && (!s.height || s.height === 'auto')) {
    s = { ...s, height: 350 };
  }

  if (s.type === 'header') {
    const stripDefault = (blocks) =>
      blocks.filter(b => {
        if (b.type === 'title' && b.text === 'Newsletter') return false;
        if (b.type === 'text' && b.content === 'Your Newsletter Title') return false;
        return true;
      });

    if (Array.isArray(s.blocks)) {
      s = { ...s, blocks: stripDefault(s.blocks) };
    }
    if (Array.isArray(s.rows)) {
      s = {
        ...s,
        rows: s.rows.map(row => ({
          ...row,
          columns: row.columns.map(col => ({
            ...col,
            blocks: stripDefault(col.blocks || []),
          })),
        })),
      };
    }
  }

  if (!isGridSection(s) && Array.isArray(s.blocks) && s.blocks.length > 0) {
    s = { ...s, rows: blocksToRows(s.blocks) };
  }

  if (!Array.isArray(s.rows) || s.rows.length === 0) {
    s = { ...s, rows: [createGridRow()] };
  }

  return s;
}

function migrateSection(old) {
  const { type, id, container, ...rest } = old;

  switch (type) {
    case 'header':
      return migrateHeader(old);
    case 'footer':
      return migrateFooter(old);
    default:
      return migrateGenericSection(old);
  }
}

function migrateHeader(old) {
  const blocks = [];

  if (old.logo) {
    blocks.push(createBlock('logo', {
      src: old.logo,
      width: old.logoWidth || 120,
      height: old.logoHeight || 'auto',
      alignment: old.logoAlignment || 'center',
    }));
  }

  if (old.heroImage) {
    blocks.push(createBlock('image', {
      src: old.heroImage,
      height: old.heroImageHeight || 200,
      objectFit: old.heroImageFit || 'cover',
      showPlaceholder: false,
    }));
  } else if (old.showHeroPlaceholder) {
    blocks.push(createBlock('image', { showPlaceholder: true }));
  }

  if (old.title && old.title !== 'Newsletter') {
    blocks.push(createBlock('title', {
      text: old.title,
      fontSize: old.titleFontSize || 28,
      fontWeight: old.titleFontWeight || 700,
      letterSpacing: old.titleLetterSpacing || '-0.02em',
      color: old.textColor || '#FFFFFF',
    }));
  }

  if (old.subtitle && old.subtitle !== 'Your Newsletter Title') {
    blocks.push(createBlock('text', {
      content: old.subtitle,
      fontSize: old.subtitleFontSize || 16,
      color: old.textColor || '#FFFFFF',
      textAlign: 'center',
      padding: 0,
    }));
  }

  const bgColor = old.backgroundColor || '#04D1FC';
  const hasGradient = old.gradientEnd && old.gradientEnd !== bgColor;

  return {
    id: old.id || `section-${uid()}`,
    type: 'header',
    preset: null,
    background: defaultBackground(
      hasGradient
        ? { type: 'gradient', gradientStart: bgColor, gradientEnd: old.gradientEnd }
        : { type: 'solid', color: bgColor }
    ),
    padding: defaultPadding({
      top: old.paddingTop ?? 0,
      bottom: old.paddingBottom ?? 0,
      left: old.paddingHorizontal ?? 0,
      right: old.paddingHorizontal ?? 0,
    }),
    height: old.height ?? 350,
    minHeight: null,
    blocks,
    rows: blocksToRows(blocks),
  };
}

function migrateFooter(old) {
  const blocks = [];

  if (old.logo) {
    blocks.push(createBlock('logo', {
      src: old.logo,
      width: old.logoWidth || 120,
      height: old.logoHeight || 40,
    }));
  }

  if (old.showSocial && old.socialLinks) {
    blocks.push(createBlock('socialLinks', {
      links: old.socialLinks,
      iconSize: old.socialIconSize || 24,
      iconColor: old.socialIconColor || '#4B5563',
    }));
  }

  if (old.showDivider) {
    blocks.push(createBlock('divider', {
      color: old.dividerColor || '#E5E7EB',
    }));
  }

  if (old.showCompanyInfo && old.companyInfo) {
    blocks.push(createBlock('companyInfo', {
      text: old.companyInfo,
      color: old.companyInfoColor || '#374151',
      fontSize: old.companyInfoFontSize || 14,
      align: old.textAlign || 'center',
    }));
  }

  if (old.showFooterLinks && old.footerLinks?.length) {
    blocks.push(createBlock('footerLinks', {
      links: old.footerLinks,
      color: old.linkColor || '#374151',
      fontSize: old.linkFontSize || 14,
    }));
  }

  return {
    id: old.id || `section-${uid()}`,
    type: 'footer',
    preset: null,
    background: defaultBackground({ color: old.backgroundColor || '#FFFFFF' }),
    padding: defaultPadding({
      top: old.padding ?? 40,
      bottom: old.padding ?? 40,
      left: old.padding ?? 40,
      right: old.padding ?? 40,
    }),
    height: 'auto',
    minHeight: null,
    blocks,
    rows: blocksToRows(blocks),
  };
}

function mapOldTypeToPreset(type) {
  const mapping = {
    text: 'text',
    sectionHeader: null,
    accentText: 'accent',
    promoCard: 'promo',
    imageCollage: 'gallery',
    imageSequence: 'sequence',
    marquee: 'marquee',
    profileCards: 'profiles',
    recipe: 'recipe',
  };
  return mapping[type] ?? null;
}

function migrateGenericSection(old) {
  const { type, id, container, ...rest } = old;

  let blocks = [];
  let bgColor = rest.backgroundColor || '#FFFFFF';
  let preset = mapOldTypeToPreset(type);

  switch (type) {
    case 'text':
      blocks = [createBlock('text', {
        content: rest.content,
        textAlign: rest.textAlign,
        direction: rest.direction,
        fontFamily: rest.fontFamily,
        fontSize: rest.fontSize,
        color: rest.color,
      })];
      break;

    case 'sectionHeader':
      blocks = [createBlock('title', {
        text: rest.text,
        fontSize: rest.fontSize,
        fontWeight: rest.fontWeight,
        letterSpacing: rest.letterSpacing,
        color: rest.color,
      })];
      bgColor = rest.backgroundColor || '#04D1FC';
      break;

    case 'accentText':
      blocks = [createBlock('text', {
        content: rest.content,
        fontSize: rest.contentFontSize,
        color: rest.contentColor,
        textAlign: rest.contentAlign,
        direction: rest.direction,
        fontFamily: rest.fontFamily,
        lineHeight: rest.contentLineHeight,
        // Preserve accent-specific props
        tagText: rest.tagText,
        tagBackgroundColor: rest.tagBackgroundColor,
        tagTextColor: rest.tagTextColor,
        tagPosition: rest.tagPosition,
        tagFontSize: rest.tagFontSize,
        tagBorderRadius: rest.tagBorderRadius,
      })];
      preset = 'accent';
      break;

    case 'promoCard':
      blocks = [createBlock('promoCard', { ...rest })];
      break;

    case 'imageCollage':
      blocks = [createBlock('imageCollage', {
        layout: rest.layout,
        images: rest.images,
        gap: rest.gap,
        imageHeight: rest.imageHeight,
      })];
      break;

    case 'imageSequence':
      blocks = [createBlock('imageSequence', {
        images: rest.images,
        frameDuration: rest.frameDuration,
        showControls: rest.showControls,
        showThumbnails: rest.showThumbnails,
        showFrameCounter: rest.showFrameCounter,
        autoPlay: rest.autoPlay,
        previewHeight: rest.previewHeight,
      })];
      break;

    case 'marquee':
      blocks = [createBlock('marquee', {
        items: rest.items,
        speed: rest.speed,
        direction: rest.direction,
        textColor: rest.textColor,
        fontSize: rest.fontSize,
        fontWeight: rest.fontWeight,
        letterSpacing: rest.letterSpacing,
        paddingVertical: rest.paddingVertical,
        separator: rest.separator,
        pauseOnHover: rest.pauseOnHover,
      })];
      bgColor = rest.backgroundColor || '#04D1FC';
      break;

    case 'profileCards':
      blocks = [createBlock('profileCards', {
        profiles: rest.profiles,
        columns: rest.columns,
        imageShape: rest.imageShape,
        showName: rest.showName,
        showTitle: rest.showTitle,
      })];
      break;

    case 'recipe':
      blocks = [createBlock('recipe', {
        title: rest.title,
        image: rest.image,
        ingredients: rest.ingredients,
        instructions: rest.instructions,
      })];
      break;

    default:
      blocks = [createBlock('text', { content: `[Migrated from: ${type}]` })];
      break;
  }

  const sectionPadding = rest.padding ?? 24;

  return {
    id: id || `section-${uid()}`,
    type: 'section',
    preset,
    background: defaultBackground({ color: bgColor }),
    padding: defaultPadding({
      top: sectionPadding,
      bottom: sectionPadding,
      left: sectionPadding,
      right: sectionPadding,
    }),
    height: 'auto',
    minHeight: null,
    blocks,
    rows: blocksToRows(blocks),
  };
}
