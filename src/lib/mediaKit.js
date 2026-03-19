// Media Kit - Hardcoded logos and brand assets

export const mediaKit = {
  logos: [
    {
      id: 'logo-dark-png',
      name: 'Logo Dark',
      url: '/media-kit/logo-dark.png',
      category: 'logo'
    },
    {
      id: 'logo-dark-svg',
      name: 'Logo Dark (SVG)',
      url: '/media-kit/logo-dark.svg',
      category: 'logo'
    },
    {
      id: 'logo-light-png',
      name: 'Logo Light',
      url: '/media-kit/logo-light.png',
      category: 'logo'
    },
    {
      id: 'logo-light-svg',
      name: 'Logo Light (SVG)',
      url: '/media-kit/logo-light.svg',
      category: 'logo'
    },
    {
      id: 'background-png',
      name: 'Background',
      url: '/media-kit/background.png',
      category: 'background'
    },
    {
      id: 'background-svg',
      name: 'Background (SVG)',
      url: '/media-kit/background.svg',
      category: 'background'
    },
    {
      id: 'frame-layout',
      name: 'Frame Layout',
      url: '/media-kit/frame-layout.png',
      category: 'background'
    },
    {
      id: 'newsletter-template-png',
      name: 'Newsletter Template',
      url: '/media-kit/newsletter-template.png',
      category: 'template'
    },
    {
      id: 'newsletter-template-svg',
      name: 'Newsletter Template (SVG)',
      url: '/media-kit/newsletter-template.svg',
      category: 'template'
    },
    {
      id: 'cover-1',
      name: 'Cover — Full Branding',
      url: '/media-kit/cover-1.png',
      category: 'cover'
    },
    {
      id: 'cover-2',
      name: 'Cover — Centered',
      url: '/media-kit/cover-2.png',
      category: 'cover'
    },
    {
      id: 'cover-3',
      name: 'Cover — With Logo Bar',
      url: '/media-kit/cover-3.png',
      category: 'cover'
    },
    {
      id: 'cover-4',
      name: 'Cover — No Branding',
      url: '/media-kit/cover-4.png',
      category: 'cover'
    },
    {
      id: 'cover-5',
      name: 'Cover — Checkpoint³',
      url: '/media-kit/cover-5.png',
      category: 'cover'
    },
    {
      id: 'cover-6',
      name: 'Cover — Wix Studio',
      url: '/media-kit/cover-6.png',
      category: 'cover'
    },
    {
      id: 'cover-nologo-1',
      name: 'Cover No Logo — 1',
      url: '/media-kit/cover-nologo-1.png',
      category: 'cover-nologo'
    },
    {
      id: 'cover-nologo-2',
      name: 'Cover No Logo — 2',
      url: '/media-kit/cover-nologo-2.png',
      category: 'cover-nologo'
    },
    {
      id: 'cover-nologo-3',
      name: 'Cover No Logo — 3',
      url: '/media-kit/cover-nologo-3.png',
      category: 'cover-nologo'
    },
  ],

  categories: [
    { id: 'all', name: 'All' },
    { id: 'logo', name: 'Logos' },
    { id: 'background', name: 'Backgrounds' },
    { id: 'cover', name: 'Covers' },
    { id: 'cover-nologo', name: 'Covers / No Logo' },
    { id: 'template', name: 'Templates' }
  ]
};

export function getLogosByCategory(category) {
  if (category === 'all') {
    return mediaKit.logos;
  }
  return mediaKit.logos.filter(logo => logo.category === category);
}

export function getLogoById(id) {
  return mediaKit.logos.find(logo => logo.id === id);
}

export default mediaKit;
