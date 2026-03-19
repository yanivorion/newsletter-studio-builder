/**
 * MJML Email Rendering Engine
 * 
 * Converts newsletter section data into MJML markup, then compiles to
 * email-safe HTML with 100% inline CSS. This solves:
 * - Gmail stripping <style> blocks
 * - Outlook ignoring CSS
 * - Base64 image bloat (images must be hosted URLs)
 * - Responsive stacking on mobile
 */

let mjml2html;
async function getMjml() {
  if (!mjml2html) {
    const mod = await import('mjml');
    mjml2html = mod.default || mod;
  }
  return mjml2html;
}

const FONT_FACE = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;600;700&family=Poppins:wght@400;500;600;700&display=swap');
`;

function fontStack(family) {
  const stacks = {
    Poppins: 'Poppins, Arial, sans-serif',
    'Noto Sans Hebrew': "'Noto Sans Hebrew', Arial, sans-serif",
    Inter: 'Inter, Arial, sans-serif',
  };
  return stacks[family] || 'Arial, sans-serif';
}

function renderHeader(section) {
  const bg = section.backgroundColor || '#4A90D9';
  const gradientEnd = section.gradientEnd;
  const textColor = section.textColor || '#ffffff';
  const font = fontStack('Poppins');
  const titleSize = `${section.titleFontSize || 28}px`;
  const subtitleSize = `${section.subtitleFontSize || 16}px`;

  const bgAttr = gradientEnd
    ? `background-color="${bg}"`
    : `background-color="${bg}"`;

  return `
    <mj-section ${bgAttr} padding="0">
      <mj-column>
        ${section.logo ? `
        <mj-image
          src="${section.logo}"
          alt="Logo"
          width="${section.logoWidth || 120}px"
          align="${section.logoAlignment || 'center'}"
          padding="40px 20px 20px"
        />` : ''}
        ${section.heroImage ? `
        <mj-image
          src="${section.heroImage}"
          alt="Hero"
          width="560px"
          border-radius="8px"
          padding="0 20px 24px"
        />` : ''}
        <mj-text
          font-family="${font}"
          font-size="${titleSize}"
          font-weight="${section.titleFontWeight || '700'}"
          color="${textColor}"
          align="center"
          padding="0 20px 10px"
          line-height="1.2"
          letter-spacing="${section.titleLetterSpacing || '-0.02em'}"
        >${section.title || ''}</mj-text>
        ${section.subtitle ? `
        <mj-text
          font-family="${font}"
          font-size="${subtitleSize}"
          font-weight="${section.subtitleFontWeight || '400'}"
          color="${textColor}"
          align="center"
          padding="0 20px ${section.showDateBadge ? '20px' : '40px'}"
          line-height="1.4"
          css-class="subtitle"
        >${section.subtitle}</mj-text>` : ''}
        ${section.showDateBadge && section.dateBadgeText ? `
        <mj-text align="right" padding="0 20px 16px">
          <span style="background-color:${section.dateBadgeBg || '#04D1FC'};color:${section.dateBadgeColor || '#ffffff'};padding:6px 14px;border-radius:4px;font-size:12px;font-weight:600;font-family:${font};letter-spacing:0.05em;">${section.dateBadgeText}</span>
        </mj-text>` : ''}
      </mj-column>
    </mj-section>`;
}

function renderMarquee(section) {
  // If an animated GIF URL is available, render as image
  if (section.gifUrl) {
    const pv = section.paddingVertical || 10;
    return `
    <mj-section background-color="${section.backgroundColor || '#04D1FC'}" padding="0">
      <mj-column>
        <mj-image src="${section.gifUrl}" alt="Marquee" width="700px" padding="0" fluid-on-mobile="true" />
      </mj-column>
    </mj-section>`;
  }

  // Fallback: static text rendering with mixed text/image layers
  const rawItems = section.items;
  const items = Array.isArray(rawItems)
    ? rawItems
    : (typeof rawItems === 'string'
      ? rawItems.split(',').map(s => s.trim()).filter(Boolean).map(v => ({ type: 'text', value: v }))
      : []);
  const separator = section.separator || '•';
  const imgSize = section.imageSize || 24;
  const font = fontStack('Poppins');

  const content = items
    .map((item, i) => {
      const sep = i < items.length - 1
        ? `<span style="opacity:0.5;margin:0 12px;">${separator}</span>`
        : '';
      if (item.type === 'image' && item.src) {
        return `<img src="${item.src}" alt="" width="${imgSize}" height="${imgSize}" style="display:inline-block;vertical-align:middle;" />${sep}`;
      }
      return `<span style="white-space:nowrap;">${item.value || ''}</span>${sep}`;
    })
    .join('');

  return `
    <mj-section background-color="${section.backgroundColor || '#04D1FC'}" padding="${section.paddingVertical || 10}px 20px">
      <mj-column>
        <mj-text
          font-family="${font}"
          font-size="${section.fontSize || 14}px"
          font-weight="${section.fontWeight || '500'}"
          color="${section.textColor || '#ffffff'}"
          align="center"
          letter-spacing="${section.letterSpacing || '0.02em'}"
          padding="0"
        >${content}</mj-text>
      </mj-column>
    </mj-section>`;
}

function renderText(section) {
  const font = fontStack(section.fontFamily || 'Poppins');
  const content = (section.content || '').replace(/\n/g, '<br>');
  const dir = section.direction === 'rtl' ? 'direction:rtl;' : '';
  const bg = section.backgroundColor === 'transparent' || !section.backgroundColor
    ? 'transparent' : section.backgroundColor;

  return `
    <mj-section background-color="${bg}" padding="0">
      <mj-column>
        <mj-text
          font-family="${font}"
          font-size="${section.fontSize || 16}px"
          color="${section.color || '#333333'}"
          align="${section.textAlign || 'center'}"
          line-height="1.6"
          padding="${section.padding || 40}px 0"
          css-class="${section.direction === 'rtl' ? 'rtl-text' : ''}"
        ><div style="margin:0;padding:0;${dir}">${content}</div></mj-text>
      </mj-column>
    </mj-section>`;
}

function renderSectionHeader(section) {
  const font = fontStack('Poppins');
  const bg = section.backgroundColor || '#04D1FC';

  return `
    <mj-section background-color="${bg}" padding="${section.paddingTop ?? section.padding ?? 14}px ${section.paddingRight ?? 24}px ${section.paddingBottom ?? section.padding ?? 14}px ${section.paddingLeft ?? 24}px">
      <mj-column>
        <mj-text
          font-family="${font}"
          font-size="${section.fontSize || 14}px"
          font-weight="${section.fontWeight || 600}"
          color="${section.color || '#ffffff'}"
          align="center"
          letter-spacing="${section.letterSpacing || '0.08em'}"
          text-transform="uppercase"
          padding="0"
        >${section.text || ''}</mj-text>
      </mj-column>
    </mj-section>`;
}

function renderAccentText(section) {
  const font = fontStack(section.fontFamily || 'Noto Sans Hebrew');
  const dir = section.direction || 'rtl';
  const align = section.contentAlign || 'right';
  const content = (section.content || '').replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

  let tagMjml = '';
  if (section.tagText) {
    const tagAlign = section.tagPosition === 'top-left' ? 'left' : 'right';
    tagMjml = `
      <mj-text align="${tagAlign}" padding="0 0 ${section.tagToContentGap ?? 40}px 0">
        <span style="background-color:${section.tagBackgroundColor || '#04D1FC'};color:${section.tagTextColor || '#FFFFFF'};padding:10px 24px;border-radius:${section.tagBorderRadius || 8}px;font-size:${section.tagFontSize || 14}px;font-weight:600;font-family:${font};line-height:1.2;display:inline-block;">${section.tagText}</span>
      </mj-text>`;
  }

  const pt = section.paddingTop ?? section.padding ?? 40;
  const pb = section.paddingBottom ?? section.padding ?? 40;
  const pl = section.paddingLeft ?? section.padding ?? 40;
  const pr = section.paddingRight ?? section.padding ?? 40;

  return `
    <mj-section background-color="${section.backgroundColor || '#FFFFFF'}" padding="${pt}px ${pr}px ${pb}px ${pl}px" direction="${dir}">
      <mj-column>
        ${tagMjml}
        <mj-text
          font-family="${font}"
          font-size="${section.contentFontSize || 18}px"
          color="${section.contentColor || '#333333'}"
          align="${align}"
          line-height="${section.contentLineHeight || 1.8}"
          padding="0"
        ><div style="direction:${dir};">${content}</div></mj-text>
      </mj-column>
    </mj-section>`;
}

function renderPromoCard(section) {
  const font = fontStack(section.fontFamily || 'Noto Sans Hebrew');
  const dir = section.direction || 'rtl';
  const align = section.contentAlign || 'right';
  const body = (section.body || '').replace(/\n/g, '<br>');
  const pt = section.paddingTop ?? section.padding ?? 32;
  const pb = section.paddingBottom ?? section.padding ?? 32;

  const imagePosition = section.imagePosition || 'right';
  const isImageFirst = (dir === 'rtl' && imagePosition === 'right') || (dir === 'ltr' && imagePosition === 'left');

  const imageCol = section.image ? `
    <mj-column width="40%" padding="10px">
      <mj-image
        src="${section.image}"
        alt="Promo"
        border-radius="${section.imageBorderRadius || 12}px"
        width="${section.imageWidth || 200}px"
      />
    </mj-column>` : '';

  const contentCol = `
    <mj-column width="${section.image ? '60%' : '100%'}" padding="10px" vertical-align="middle">
      <mj-text
        font-family="${font}"
        font-size="${section.titleFontSize || 28}px"
        font-weight="${section.titleFontWeight || 700}"
        color="${section.titleColor || '#1A1A1A'}"
        align="${align}"
        line-height="1.3"
        padding="0 0 ${section.titleToBodyGap ?? 16}px 0"
      ><div style="direction:${dir};">${section.title || 'Card Title'}</div></mj-text>
      <mj-text
        font-family="${font}"
        font-size="${section.bodyFontSize || 16}px"
        color="${section.bodyColor || '#555555'}"
        align="${align}"
        line-height="${section.bodyLineHeight || 1.7}"
        padding="0 0 ${section.showCta !== false ? (section.bodyToCtaGap ?? 20) + 'px' : '0'} 0"
      ><div style="direction:${dir};">${body}</div></mj-text>
      ${section.showCta !== false && section.ctaText ? `
      <mj-text
        font-family="${font}"
        font-size="${section.ctaFontSize || 16}px"
        font-weight="${section.ctaFontWeight || 500}"
        align="${align}"
        padding="0"
      ><a href="${section.ctaLink || '#'}" style="color:${section.ctaColor || '#04D1FC'};text-decoration:none;">${section.ctaText}</a></mj-text>` : ''}
    </mj-column>`;

  const columns = isImageFirst ? imageCol + contentCol : contentCol + imageCol;

  return `
    <mj-section background-color="${section.backgroundColor || '#F8F9FA'}" padding="${pt}px 20px ${pb}px 20px" direction="${dir}">
      ${columns}
    </mj-section>`;
}

function renderImageCollage(section) {
  const images = section.images || [];
  if (images.length === 0) return '';

  const imagesPerRow = Math.min(images.length, 4);
  const rows = [];
  for (let i = 0; i < images.length; i += imagesPerRow) {
    rows.push(images.slice(i, i + imagesPerRow));
  }

  return rows.map(row => {
    const colWidth = `${Math.floor(100 / row.length)}%`;
    const cols = row.map((img, i) => `
      <mj-column width="${colWidth}" padding="4px">
        <mj-image
          src="${img}"
          alt="Image ${i + 1}"
          border-radius="8px"
          padding="0"
        />
      </mj-column>`).join('');

    return `
      <mj-section background-color="${section.backgroundColor || '#ffffff'}" padding="8px 12px">
        ${cols}
      </mj-section>`;
  }).join('');
}

function renderProfileCards(section) {
  const profiles = section.profiles || [];
  if (profiles.length === 0) return '';

  const font = fontStack('Poppins');
  const borderRadius = section.imageShape === 'circular' ? '50%' : '8px';
  const cols = profiles.map(profile => {
    if (!profile) return '';
    return `
      <mj-column padding="10px">
        ${profile.image ? `
        <mj-image
          src="${profile.image}"
          alt="${profile.name || ''}"
          width="80px"
          height="80px"
          border-radius="${borderRadius}"
          padding="0 0 10px 0"
        />` : ''}
        ${section.showName !== false && profile.name ? `
        <mj-text font-family="${font}" font-size="14px" font-weight="600" color="#333333" align="center" padding="0 0 4px 0">${profile.name}</mj-text>` : ''}
        ${section.showTitle !== false && profile.title ? `
        <mj-text font-family="${font}" font-size="12px" color="#666666" align="center" padding="0">${profile.title}</mj-text>` : ''}
      </mj-column>`;
  }).join('');

  return `
    <mj-section background-color="${section.backgroundColor || '#ffffff'}" padding="30px 20px">
      ${cols}
    </mj-section>`;
}

function renderRecipe(section) {
  const font = fontStack('Noto Sans Hebrew');
  const ingredients = (section.ingredients || '').replace(/\n/g, '<br>');
  const instructions = (section.instructions || '').replace(/\n/g, '<br>');

  return `
    <mj-section background-color="${section.backgroundColor || '#ffffff'}" padding="30px 20px">
      <mj-column>
        <mj-text font-family="${font}" font-size="24px" font-weight="600" color="#333333" align="center" padding="0 0 20px 0">
          <div style="direction:rtl;">${section.title || ''}</div>
        </mj-text>
        ${section.image ? `
        <mj-image src="${section.image}" alt="${section.title || ''}" border-radius="8px" padding="0 0 20px 0" />` : ''}
        <mj-text font-family="${font}" font-size="14px" color="#333333" align="right" line-height="1.8" padding="0 0 15px 0">
          <div style="direction:rtl;">${ingredients}</div>
        </mj-text>
        <mj-text font-family="${font}" font-size="14px" color="#333333" align="right" line-height="1.8" padding="0">
          <div style="direction:rtl;">${instructions}</div>
        </mj-text>
      </mj-column>
    </mj-section>`;
}

function renderMultiLayout(block) {
  const font = fontStack('Poppins');
  const layout = block.layout || 'two-col-wide';
  const badgeText = block.badgeText || 'BUILDER';
  const badgeColor = block.badgeColor || '#1a1a3e';
  const title = block.title || '';
  const body = block.body || '';
  const images = block.images || [];
  const imgH = block.imageHeight || 180;
  const br = block.imageBorderRadius || 12;

  const LAYOUTS = {
    'two-col-wide': { cols: [[5, 7]], textLayout: 'full' },
    'three-col': { cols: [[4, 4, 4]], textLayout: 'full' },
    'two-by-two': { cols: [[6, 6], [6, 6]], textLayout: 'full' },
    'two-col-equal': { cols: [[6, 6]], textLayout: 'full' },
    'two-col-text-side': { cols: [[6, 6]], textLayout: 'two-col' },
    'hero-side': { cols: [[8]], textLayout: 'two-col' },
  };

  const preset = LAYOUTS[layout] || LAYOUTS['two-col-wide'];

  const placeholderBg = 'linear-gradient(180deg, #E8E8EC 0%, #C8CDD8 100%)';

  let imgIdx = 0;
  const imageRowsMjml = preset.cols.map(row => {
    const colMjml = row.map(span => {
      const src = images[imgIdx++];
      const pct = Math.round((span / 12) * 100);
      const imgTag = src
        ? `<mj-image src="${src}" width="${Math.round(700 * span / 12)}px" border-radius="${br}px" padding="4px" fluid-on-mobile="true" />`
        : `<mj-text padding="4px"><div style="width:100%;height:${imgH}px;background:${placeholderBg};border-radius:${br}px;"></div></mj-text>`;
      return `<mj-column width="${pct}%">${imgTag}</mj-column>`;
    }).join('');
    return `<mj-section background-color="transparent" padding="0">${colMjml}</mj-section>`;
  }).join('');

  const badgeMjml = `
    <mj-section background-color="transparent" padding="0">
      <mj-column>
        <mj-text font-family="${font}" font-size="14px" font-weight="600" color="${badgeColor}" letter-spacing="0.06em" padding="0 0 4px 0" text-transform="uppercase">${badgeText}</mj-text>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 8px 0" />
      </mj-column>
    </mj-section>`;

  let textMjml = '';
  if (preset.textLayout === 'two-col') {
    textMjml = `
      <mj-section background-color="transparent" padding="8px 0 0 0">
        <mj-column width="42%">
          <mj-text font-family="${font}" font-size="13px" font-weight="700" color="#1C1917" letter-spacing="0.03em" line-height="1.3" padding="0">${title}</mj-text>
        </mj-column>
        <mj-column width="58%">
          <mj-text font-family="${font}" font-size="13px" color="#6B7280" line-height="1.65" padding="0">${body}</mj-text>
        </mj-column>
      </mj-section>`;
  } else {
    textMjml = `
      <mj-section background-color="transparent" padding="8px 0 0 0">
        <mj-column>
          <mj-text font-family="${font}" font-size="13px" font-weight="700" color="#1C1917" letter-spacing="0.03em" line-height="1.3" padding="0 0 6px 0">${title}</mj-text>
          <mj-text font-family="${font}" font-size="13px" color="#6B7280" line-height="1.65" padding="0">${body}</mj-text>
        </mj-column>
      </mj-section>`;
  }

  return badgeMjml + imageRowsMjml + textMjml;
}

function renderFooter(section) {
  const font = fontStack(section.fontFamily || 'Poppins');
  const align = section.textAlign || 'center';
  const pt = section.paddingTop ?? section.padding ?? 40;
  const pb = section.paddingBottom ?? section.padding ?? 40;

  let socialMjml = '';
  if (section.showSocial !== false && section.socialLinks) {
    const platforms = ['facebook', 'x', 'twitter', 'linkedin', 'instagram', 'youtube', 'tiktok'];
    const iconSrcs = {
      facebook: 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
      x: 'https://cdn-icons-png.flaticon.com/512/5968/5968958.png',
      twitter: 'https://cdn-icons-png.flaticon.com/512/5968/5968958.png',
      linkedin: 'https://cdn-icons-png.flaticon.com/512/733/733561.png',
      instagram: 'https://cdn-icons-png.flaticon.com/512/733/733558.png',
      youtube: 'https://cdn-icons-png.flaticon.com/512/733/733579.png',
      tiktok: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png',
    };

    const icons = platforms
      .filter(p => section.socialLinks[p])
      .map(p => `<mj-social-element name="${p}" href="${section.socialLinks[p]}" src="${iconSrcs[p]}" background-color="transparent" icon-size="24px" />`)
      .join('');

    if (icons) {
      socialMjml = `<mj-social font-size="0" icon-size="24px" mode="horizontal" padding="0 0 20px 0" align="${align}">${icons}</mj-social>`;
    }
  }

  return `
    <mj-section background-color="${section.backgroundColor || '#FFFFFF'}" padding="${pt}px 20px ${pb}px 20px">
      <mj-column>
        ${section.logo ? `
        <mj-image src="${section.logo}" alt="Logo" width="${section.logoWidth || 120}px" align="${align}" padding="0 0 20px 0" />` : ''}
        ${socialMjml}
        ${section.showDivider !== false ? `
        <mj-divider border-color="${section.dividerColor || '#E5E7EB'}" border-width="${section.dividerWidth || 1}px" padding="0 0 20px 0" />` : ''}
        ${section.showCompanyInfo !== false && section.companyInfo ? `
        <mj-text font-family="${font}" font-size="${section.companyInfoFontSize || 14}px" color="${section.companyInfoColor || '#374151'}" align="${align}" line-height="1.6" padding="0 0 12px 0">${section.companyInfo}</mj-text>` : ''}
        ${section.showFooterLinks !== false && section.footerLinks?.length > 0 ? `
        <mj-text font-family="${font}" font-size="${section.linkFontSize || 14}px" align="${align}" padding="0">
          ${section.footerLinks.map((link, i) => {
            const sep = i < section.footerLinks.length - 1 ? `<span style="margin:0 8px;opacity:0.5;">${section.linkSeparator || '|'}</span>` : '';
            return `<a href="${link.url || '#'}" style="color:${section.linkColor || '#374151'};text-decoration:underline;">${link.text}</a>${sep}`;
          }).join('')}
        </mj-text>` : ''}
      </mj-column>
    </mj-section>`;
}

function renderUnsubscribeFooter(unsubscribeUrl) {
  return `
    <mj-section padding="20px">
      <mj-column>
        <mj-text font-size="12px" color="#9CA3AF" align="center" line-height="1.5" padding="0">
          You received this because you're subscribed to our newsletter.<br>
          <a href="${unsubscribeUrl}" style="color:#6B7280;text-decoration:underline;">Unsubscribe</a>
        </mj-text>
      </mj-column>
    </mj-section>`;
}

// ── Email-safe badge HTML (no display:flex) ─────────────────────────
function badgeHtml(block, font) {
  const pad = block.padding || 10;
  const clr = block.color || '#FFFFFF';
  const arrow = `<div style="width:0;height:0;border-top:6px solid transparent;border-bottom:6px solid transparent;border-left:9px solid ${clr};display:inline-block;margin:0 auto;"></div>`;
  const chevron = block.showChevron
    ? `<td style="width:40px;padding-right:${pad}px;vertical-align:middle;text-align:center;"><div style="width:28px;height:28px;border-radius:50%;background-color:rgba(255,255,255,0.25);line-height:28px;text-align:center;margin:0 auto;">${arrow}</div></td>`
    : '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${block.backgroundColor};border-radius:${block.borderRadius || 24}px;"><tr><td style="padding:${pad}px ${pad + 8}px;font-family:${font};font-size:${block.fontSize || 14}px;font-weight:${block.fontWeight || 600};color:${clr};letter-spacing:${block.letterSpacing || '0.06em'};font-style:${block.fontStyle || 'normal'};">${block.text || ''}</td>${chevron}</tr></table>`;
}

// ── Block-level MJML rendering ──────────────────────────────────────
function renderTitleBlock(block) {
  const font = fontStack(block.fontFamily || 'Poppins');
  const isBadge = !!block.backgroundColor;

  if (isBadge) {
    return `
      <mj-section background-color="transparent" padding="4px 0"><mj-column>
        <mj-text padding="0">${badgeHtml(block, font)}</mj-text>
      </mj-column></mj-section>`;
  }

  return `
    <mj-section background-color="transparent" padding="${block.padding || 0}px 0"><mj-column>
      <mj-text
        font-family="${font}"
        font-size="${block.fontSize || 18}px"
        font-weight="${block.fontWeight || 700}"
        color="${block.color || '#FFFFFF'}"
        align="${block.textAlign || 'center'}"
        letter-spacing="${block.letterSpacing || '0.1em'}"
        line-height="${block.lineHeight || 1.2}"
        padding="0"
      ><div style="margin:0;padding:0;font-style:${block.fontStyle || 'normal'};">${block.text || ''}</div></mj-text>
    </mj-column></mj-section>`;
}

function renderLogoBlock(block) {
  const font = fontStack('Poppins');
  if (!block.src && !block.rightText) return '';

  if (block.rightText) {
    return `
      <mj-section background-color="transparent" padding="8px 0"><mj-column width="50%" vertical-align="middle">
        ${block.src ? `<mj-image src="${block.src}" alt="Logo" width="${block.width || 120}px" align="left" padding="0" />` : '<mj-text padding="0">&nbsp;</mj-text>'}
      </mj-column><mj-column width="50%" vertical-align="middle">
        <mj-text font-family="${font}" font-size="${block.rightTextFontSize || 11}px" font-weight="${block.rightTextFontWeight || 500}" color="${block.rightTextColor || '#FFFFFF'}" align="right" letter-spacing="${block.rightTextLetterSpacing || '0.05em'}" padding="0" text-transform="uppercase">${block.rightText}</mj-text>
      </mj-column></mj-section>`;
  }

  return block.src ? `
    <mj-section background-color="transparent" padding="8px 0"><mj-column>
      <mj-image src="${block.src}" alt="Logo" width="${block.width || 120}px" align="${block.alignment || 'center'}" padding="0" />
    </mj-column></mj-section>` : '';
}

function blockToMjml(block) {
  switch (block.type) {
    case 'text': return renderText(block);
    case 'title': return renderTitleBlock(block);
    case 'marquee': return renderMarquee(block);
    case 'promoCard': return renderPromoCard(block);
    case 'imageCollage': return renderImageCollage(block);
    case 'profileCards': return renderProfileCards(block);
    case 'recipe': return renderRecipe(block);
    case 'multiLayout': return renderMultiLayout(block);
    case 'logo': return renderLogoBlock(block);
    case 'image':
      return block.src ? `
        <mj-section background-color="transparent" padding="0"><mj-column>
          <mj-image src="${block.src}" alt="${block.alt || ''}" width="${block.width ? block.width + 'px' : '700px'}" border-radius="${block.borderRadius || 0}px" padding="0" fluid-on-mobile="true" />
        </mj-column></mj-section>` : '';
    case 'button': {
      const bPv = block.paddingV != null ? block.paddingV : 14;
      const bPh = block.paddingH != null ? block.paddingH : 32;
      return `
        <mj-section background-color="transparent" padding="8px 0"><mj-column>
          <mj-button
            href="${block.url || '#'}"
            background-color="${block.backgroundColor || '#04D1FC'}"
            color="${block.textColor || '#FFFFFF'}"
            font-size="${block.fontSize || 16}px"
            font-weight="${block.fontWeight || '600'}"
            border-radius="${block.borderRadius || 8}px"
            inner-padding="${bPv}px ${bPh}px"
            align="${block.align || 'center'}"
          >${block.text || 'Click Here'}</mj-button>
        </mj-column></mj-section>`;
    }
    case 'divider':
      return `
        <mj-section background-color="transparent" padding="0 16px"><mj-column>
          <mj-divider border-color="${block.color || '#E5E7EB'}" border-width="${block.thickness || 1}px" border-style="${block.style || 'solid'}" padding="${block.marginTop || 8}px 0 ${block.marginBottom || 8}px 0" />
        </mj-column></mj-section>`;
    case 'spacer':
      return `
        <mj-section background-color="transparent" padding="0"><mj-column>
          <mj-spacer height="${block.height || 24}px" />
        </mj-column></mj-section>`;
    case 'socialLinks': {
      const iconSrcs = {
        facebook: 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
        x: 'https://cdn-icons-png.flaticon.com/512/5968/5968958.png',
        linkedin: 'https://cdn-icons-png.flaticon.com/512/733/733561.png',
        instagram: 'https://cdn-icons-png.flaticon.com/512/733/733558.png',
        rss: 'https://cdn-icons-png.flaticon.com/512/1051/1051277.png',
      };
      const links = block.links || {};
      const icons = Object.entries(links)
        .filter(([, url]) => url && url !== '#')
        .map(([p, url]) => `<mj-social-element name="${p}" href="${url}" src="${iconSrcs[p] || ''}" background-color="transparent" icon-size="${block.iconSize || 24}px" />`)
        .join('');
      return icons ? `
        <mj-section background-color="transparent" padding="8px 0"><mj-column>
          <mj-social font-size="0" icon-size="${block.iconSize || 24}px" mode="horizontal" padding="0" align="${block.align || 'center'}">${icons}</mj-social>
        </mj-column></mj-section>` : '';
    }
    case 'footerLinks': {
      const fLinks = block.links || [];
      if (!fLinks.length) return '';
      const font = fontStack('Poppins');
      return `
        <mj-section background-color="transparent" padding="8px 0"><mj-column>
          <mj-text font-family="${font}" font-size="${block.fontSize || 14}px" align="${block.align || 'center'}" padding="0">
            ${fLinks.map((l, i) => {
              const sep = i < fLinks.length - 1 ? '<span style="margin:0 8px;opacity:0.5;">|</span>' : '';
              return `<a href="${l.url || '#'}" style="color:${block.color || '#374151'};text-decoration:underline;">${l.text}</a>${sep}`;
            }).join('')}
          </mj-text>
        </mj-column></mj-section>`;
    }
    case 'companyInfo': {
      const font = fontStack('Poppins');
      return block.text ? `
        <mj-section background-color="transparent" padding="8px 0"><mj-column>
          <mj-text font-family="${font}" font-size="${block.fontSize || 14}px" color="${block.color || '#374151'}" align="${block.align || 'center'}" line-height="1.5" padding="0">${block.text}</mj-text>
        </mj-column></mj-section>` : '';
    }
    case 'imageSequence': {
      const images = block.images || [];
      if (images.length === 0) return '';
      const firstImage = images[0];
      return `
        <mj-section background-color="${block.backgroundColor || 'transparent'}" padding="0"><mj-column>
          <mj-image src="${firstImage}" alt="Image sequence" width="100%" border-radius="0" padding="0" />
        </mj-column></mj-section>`;
    }
    default: return '';
  }
}

// ── Block → mj-column content (no wrapping mj-section) ─────────────
function blockToColumnContent(block) {
  const font = fontStack(block.fontFamily || 'Poppins');
  const pv = (v, fallback) => v != null ? v : fallback;

  switch (block.type) {
    case 'text': {
      const content = (block.content || '').replace(/\n/g, '<br>');
      const dir = block.direction === 'rtl' ? 'direction:rtl;' : '';
      return `<mj-text font-family="${font}" font-size="${block.fontSize || 16}px" color="${block.color || '#333333'}" align="${block.textAlign || 'center'}" line-height="${block.lineHeight || 1.6}" padding="${pv(block.paddingV, pv(block.padding, 0))}px ${pv(block.paddingH, 0)}px"><div style="margin:0;padding:0;${dir}">${content}</div></mj-text>`;
    }
    case 'title': {
      const isBadge = !!block.backgroundColor;
      if (isBadge) {
        return `<mj-text padding="4px 0">${badgeHtml(block, font)}</mj-text>`;
      }
      return `<mj-text font-family="${font}" font-size="${block.fontSize || 18}px" font-weight="${block.fontWeight || 700}" color="${block.color || '#FFFFFF'}" align="${block.textAlign || 'center'}" letter-spacing="${block.letterSpacing || '0.1em'}" line-height="${block.lineHeight || 1.2}" padding="${pv(block.paddingV, pv(block.padding, 0))}px ${pv(block.paddingH, 0)}px"><div style="margin:0;padding:0;font-style:${block.fontStyle || 'normal'};">${block.text || ''}</div></mj-text>`;
    }
    case 'image':
      return block.src ? `<mj-image src="${block.src}" alt="${block.alt || ''}" width="${block.width ? block.width + 'px' : '700px'}" border-radius="${block.borderRadius || 0}px" padding="0" fluid-on-mobile="true" />` : '';
    case 'button':
      return `<mj-button href="${block.url || '#'}" background-color="${block.backgroundColor || '#04D1FC'}" color="${block.textColor || '#FFFFFF'}" font-size="${block.fontSize || 16}px" font-weight="${block.fontWeight || '600'}" border-radius="${block.borderRadius || 8}px" inner-padding="${pv(block.paddingV, 14)}px ${pv(block.paddingH, 32)}px" align="${block.align || 'center'}">${block.text || 'Click Here'}</mj-button>`;
    case 'divider':
      return `<mj-divider border-color="${block.color || '#E5E7EB'}" border-width="${block.thickness || 1}px" padding="${block.marginTop || 8}px 0 ${block.marginBottom || 8}px 0" />`;
    case 'spacer':
      return `<mj-spacer height="${block.height || 24}px" />`;
    case 'logo': {
      if (block.rightText) {
        const logoHtml = block.src
          ? `<img src="${block.src}" alt="Logo" width="${block.width || 120}" style="display:block;" />`
          : '';
        return `<mj-text padding="8px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;"><tr><td style="vertical-align:middle;">${logoHtml}</td><td style="vertical-align:middle;text-align:right;font-family:${font};font-size:${block.rightTextFontSize || 11}px;font-weight:${block.rightTextFontWeight || 500};color:${block.rightTextColor || '#FFFFFF'};letter-spacing:${block.rightTextLetterSpacing || '0.05em'};text-transform:uppercase;">${block.rightText}</td></tr></table></mj-text>`;
      }
      return block.src ? `<mj-image src="${block.src}" alt="Logo" width="${block.width || 120}px" align="${block.alignment || 'center'}" padding="8px 0" />` : '';
    }
    case 'marquee': {
      if (block.gifUrl) {
        return `<mj-image src="${block.gifUrl}" alt="Marquee" width="700px" padding="0" fluid-on-mobile="true" />`;
      }
      const rawItems = block.items;
      const marqueeItems = Array.isArray(rawItems)
        ? rawItems
        : (typeof rawItems === 'string'
          ? rawItems.split(',').map(s => s.trim()).filter(Boolean).map(v => ({ type: 'text', value: v }))
          : []);
      const marqueeSep = block.separator || '•';
      const marqueeImgSize = block.imageSize || 24;
      const marqueeContent = marqueeItems.map((item, i) => {
        const sep = i < marqueeItems.length - 1 ? `<span style="opacity:0.5;margin:0 12px;">${marqueeSep}</span>` : '';
        if (item.type === 'image' && item.src) {
          return `<img src="${item.src}" alt="" width="${marqueeImgSize}" height="${marqueeImgSize}" style="display:inline-block;vertical-align:middle;" />${sep}`;
        }
        return `<span style="white-space:nowrap;">${item.value || ''}</span>${sep}`;
      }).join('');
      return `<mj-text font-family="${font}" font-size="${block.fontSize || 14}px" font-weight="${block.fontWeight || '500'}" color="${block.textColor || '#ffffff'}" align="center" letter-spacing="${block.letterSpacing || '0.02em'}" padding="${pv(block.paddingVertical, 10)}px 0">${marqueeContent}</mj-text>`;
    }
    case 'multiLayout': {
      const mTitle = block.title || '';
      const mBody = (block.body || '').replace(/\n/g, '<br>');
      const mBadge = block.badgeText || 'BUILDER';
      const mBadgeClr = block.badgeColor || '#1a1a3e';
      return `
        <mj-text font-family="${font}" font-size="14px" font-weight="600" color="${mBadgeClr}" letter-spacing="0.06em" padding="0 0 4px 0" text-transform="uppercase">${mBadge}</mj-text>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 8px 0" />
        <mj-text font-family="${font}" font-size="13px" font-weight="700" color="#1C1917" letter-spacing="0.03em" line-height="1.3" padding="8px 0 6px 0">${mTitle}</mj-text>
        <mj-text font-family="${font}" font-size="13px" color="#6B7280" line-height="1.65" padding="0">${mBody}</mj-text>`;
    }
    case 'promoCard': {
      const dir = block.direction || 'rtl';
      const body = (block.body || '').replace(/\n/g, '<br>');
      return `
        <mj-text font-family="${font}" font-size="${block.titleFontSize || 28}px" font-weight="${block.titleFontWeight || 700}" color="${block.titleColor || '#1A1A1A'}" align="${block.contentAlign || 'right'}" line-height="1.3" padding="0 0 16px 0"><div style="direction:${dir};">${block.title || ''}</div></mj-text>
        <mj-text font-family="${font}" font-size="${block.bodyFontSize || 16}px" color="${block.bodyColor || '#555555'}" align="${block.contentAlign || 'right'}" line-height="${block.bodyLineHeight || 1.7}" padding="0"><div style="direction:${dir};">${body}</div></mj-text>`;
    }
    case 'imageCollage': {
      const images = block.images || [];
      return images.map((img) =>
        `<mj-image src="${img}" alt="Image" border-radius="8px" padding="4px 0" />`
      ).join('\n        ');
    }
    case 'profileCards': {
      const profiles = block.profiles || [];
      return profiles.map(p => {
        if (!p) return '';
        return `${p.image ? `<mj-image src="${p.image}" alt="${p.name || ''}" width="80px" border-radius="50%" padding="0 0 10px 0" />` : ''}
        ${p.name ? `<mj-text font-family="${font}" font-size="14px" font-weight="600" color="#333" align="center" padding="0 0 4px 0">${p.name}</mj-text>` : ''}`;
      }).join('\n        ');
    }
    case 'socialLinks': {
      const iconSrcs = {
        facebook: 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
        x: 'https://cdn-icons-png.flaticon.com/512/5968/5968958.png',
        linkedin: 'https://cdn-icons-png.flaticon.com/512/733/733561.png',
        instagram: 'https://cdn-icons-png.flaticon.com/512/733/733558.png',
        rss: 'https://cdn-icons-png.flaticon.com/512/1051/1051277.png',
      };
      const links = block.links || {};
      const icons = Object.entries(links)
        .filter(([, url]) => url && url !== '#')
        .map(([p, url]) => `<mj-social-element name="${p}" href="${url}" src="${iconSrcs[p] || ''}" background-color="transparent" icon-size="${block.iconSize || 24}px" />`)
        .join('');
      return icons ? `<mj-social font-size="0" icon-size="${block.iconSize || 24}px" mode="horizontal" padding="0" align="${block.align || 'center'}">${icons}</mj-social>` : '';
    }
    case 'footerLinks': {
      const fLinks = block.links || [];
      if (!fLinks.length) return '';
      return `<mj-text font-family="${font}" font-size="${block.fontSize || 14}px" align="${block.align || 'center'}" padding="0">
        ${fLinks.map((l, i) => {
          const sep = i < fLinks.length - 1 ? '<span style="margin:0 8px;opacity:0.5;">|</span>' : '';
          return `<a href="${l.url || '#'}" style="color:${block.color || '#374151'};text-decoration:underline;">${l.text}</a>${sep}`;
        }).join('')}
      </mj-text>`;
    }
    case 'companyInfo':
      return block.text ? `<mj-text font-family="${font}" font-size="${block.fontSize || 14}px" color="${block.color || '#374151'}" align="${block.align || 'center'}" line-height="1.5" padding="0">${block.text}</mj-text>` : '';
    case 'imageSequence': {
      const imgs = block.images || [];
      if (imgs.length === 0) return '';
      return `<mj-image src="${imgs[0]}" alt="Image sequence" width="100%" border-radius="0" padding="0" />`;
    }
    case 'recipe': {
      const ingredients = (block.ingredients || '').replace(/\n/g, '<br>');
      const instructions = (block.instructions || '').replace(/\n/g, '<br>');
      return `
        <mj-text font-family="${font}" font-size="24px" font-weight="600" color="#333" align="center" padding="0 0 20px 0"><div style="direction:rtl;">${block.title || ''}</div></mj-text>
        ${block.image ? `<mj-image src="${block.image}" alt="${block.title || ''}" border-radius="8px" padding="0 0 20px 0" />` : ''}
        <mj-text font-family="${font}" font-size="14px" color="#333" align="right" line-height="1.8" padding="0 0 15px 0"><div style="direction:rtl;">${ingredients}</div></mj-text>
        <mj-text font-family="${font}" font-size="14px" color="#333" align="right" line-height="1.8" padding="0"><div style="direction:rtl;">${instructions}</div></mj-text>`;
    }
    default:
      return '';
  }
}

// ── Grid row → MJML (multi-column) ─────────────────────────────────
function renderGridRow(row) {
  const columns = row.columns || [];
  if (columns.length === 0) return '';

  const colsMarkup = columns.map((col) => {
    const widthPercent = Math.round((col.span / 12) * 100);
    const blocksMarkup = (col.blocks || [])
      .map(b => blockToColumnContent(b))
      .filter(Boolean)
      .join('\n        ');
    return `
      <mj-column width="${widthPercent}%">
        ${blocksMarkup || '<mj-text padding="0">&nbsp;</mj-text>'}
      </mj-column>`;
  }).join('');

  return `
    <mj-section background-color="transparent" padding="0">
      ${colsMarkup}
    </mj-section>`;
}

// ── Section-level rendering ─────────────────────────────────────────
// `innerBg` is passed from the top-level renderer so sections with no
// explicit background can fall back to the newsletter's inner color.
function sectionBgAttr(bg, innerBg) {
  if (bg.type === 'solid') return `background-color="${bg.color || innerBg || '#FFFFFF'}"`;
  if (bg.type === 'gradient') return `background-color="${bg.gradientStart || '#04D1FC'}"`;
  if (bg.type === 'image' && bg.image) return `background-url="${bg.image}" background-size="cover" background-position="${bg.imagePosition || 'center'}" background-color="${bg.fallbackColor || bg.color || '#1a1a2e'}"`;
  if (bg.type === 'none' || bg.type === 'transparent') return `background-color="${innerBg || '#FFFFFF'}"`;
  return `background-color="${innerBg || '#FFFFFF'}"`;
}

function renderContainerSection(section, innerBg) {
  const bg = section.background || {};
  const pad = section.padding || {};
  const pt = pad.top ?? 24;
  const pb = pad.bottom ?? 24;
  const pl = pad.left ?? 24;
  const pr = pad.right ?? 24;

  const bgAttr = sectionBgAttr(bg, innerBg);

  const fixedH = section.height && section.height !== 'auto' ? parseInt(section.height, 10) : 0;
  const minH = section.minHeight ? parseInt(section.minHeight, 10) : 0;
  const targetH = fixedH || minH;

  function wrapWithHeight(mjml) {
    if (!targetH) return mjml;
    return mjml.replace(
      /(<mj-section\b)/,
      `$1 css-class="sec-h-${section.id}"`
    );
  }

  // Grid mode: section has multi-column rows → must use mj-wrapper
  if (Array.isArray(section.rows) && section.rows.length > 0) {
    const hasMultiColumn = section.rows.some(r =>
      r.columns && r.columns.length > 1
    );

    if (hasMultiColumn) {
      const rowsMarkup = section.rows
        .map(r => renderGridRow(r))
        .filter(Boolean)
        .join('\n');
      return `
    <mj-wrapper ${bgAttr} padding="${pt}px ${pr}px ${pb}px ${pl}px"${targetH ? ` css-class="sec-h-${section.id}"` : ''}>
      ${rowsMarkup}
    </mj-wrapper>`;
    }

    // Single-column grid rows → flatten to mj-section for better Gmail compat
    const allBlocks = [];
    for (const row of section.rows) {
      for (const col of (row.columns || [])) {
        for (const block of (col.blocks || [])) {
          allBlocks.push(block);
        }
      }
    }
    const content = allBlocks
      .map(b => blockToColumnContent(b))
      .filter(Boolean)
      .join('\n        ');
    return wrapWithHeight(`
    <mj-section ${bgAttr} padding="${pt}px ${pr}px ${pb}px ${pl}px">
      <mj-column>
        ${content || '<mj-text padding="0">&nbsp;</mj-text>'}
      </mj-column>
    </mj-section>`);
  }

  // Flat blocks mode → single mj-section (most Gmail-compatible)
  const content = (section.blocks || [])
    .map(b => blockToColumnContent(b))
    .filter(Boolean)
    .join('\n        ');

  return wrapWithHeight(`
    <mj-section ${bgAttr} padding="${pt}px ${pr}px ${pb}px ${pl}px">
      <mj-column>
        ${content || '<mj-text padding="0">&nbsp;</mj-text>'}
      </mj-column>
    </mj-section>`);
}

function sectionToMjml(section, innerBg) {
  // New-format sections have blocks or rows
  if (Array.isArray(section.rows) || Array.isArray(section.blocks)) {
    return renderContainerSection(section, innerBg);
  }

  // Legacy format fallback
  switch (section.type) {
    case 'header': return renderHeader(section);
    case 'marquee': return renderMarquee(section);
    case 'text': return renderText(section);
    case 'sectionHeader': return renderSectionHeader(section);
    case 'accentText': return renderAccentText(section);
    case 'promoCard': return renderPromoCard(section);
    case 'imageCollage': return renderImageCollage(section);
    case 'profileCards': return renderProfileCards(section);
    case 'recipe': return renderRecipe(section);
    case 'footer': return renderFooter(section);
    default: return '';
  }
}

/**
 * Convert newsletter data to MJML markup
 */
export function newsletterToMjml(newsletter, options = {}) {
  const { unsubscribeUrl, previewText } = options;
  const pageSettings = newsletter.pageSettings || {};
  const outerBg = pageSettings.outerBackgroundColor || '#F5F5F5';
  const innerBg = pageSettings.innerBackgroundColor || '#FFFFFF';

  const sectionsMarkup = newsletter.sections
    .map(section => sectionToMjml(section, innerBg))
    .filter(Boolean)
    .join('\n');

  const heightStyles = newsletter.sections
    .filter(s => {
      const h = s.height && s.height !== 'auto' ? parseInt(s.height, 10) : 0;
      const mh = s.minHeight ? parseInt(s.minHeight, 10) : 0;
      return h || mh;
    })
    .map(s => {
      const h = s.height && s.height !== 'auto' ? parseInt(s.height, 10) : 0;
      const mh = s.minHeight ? parseInt(s.minHeight, 10) : 0;
      const val = h || mh;
      return `.sec-h-${s.id} { min-height: ${val}px !important; }
      .sec-h-${s.id} td { vertical-align: top; }`;
    })
    .join('\n          ');

  return `
    <mjml>
      <mj-head>
        <mj-attributes>
          <mj-all font-family="Arial, sans-serif" />
          <mj-body background-color="${outerBg}" />
          <mj-section background-color="transparent" />
          <mj-wrapper background-color="${innerBg}" />
        </mj-attributes>
        <mj-style>
          ${FONT_FACE}
          .rtl-text div { direction: rtl; }
          ${heightStyles}
        </mj-style>
        <mj-style inline="inline">
          ${heightStyles}
        </mj-style>
        ${previewText ? `<mj-preview>${previewText}</mj-preview>` : ''}
      </mj-head>
      <mj-body width="700px" background-color="${outerBg}">
        ${sectionsMarkup}
        ${unsubscribeUrl ? renderUnsubscribeFooter(unsubscribeUrl) : ''}
      </mj-body>
    </mjml>`;
}

/**
 * Render newsletter to email-safe HTML
 * This is THE function that solves the inline HTML problem.
 */
export async function renderNewsletter(newsletter, options = {}) {
  const mjml = await getMjml();
  const mjmlMarkup = newsletterToMjml(newsletter, options);
  
  const result = mjml(mjmlMarkup, {
    keepComments: false,
    beautify: false,
    minify: true,
    validationLevel: 'soft',
  });

  if (result.errors?.length > 0) {
    console.warn('MJML rendering warnings:', result.errors);
  }

  return {
    html: result.html,
    errors: result.errors || [],
    mjml: mjmlMarkup,
  };
}

/**
 * Render just the MJML preview (for the editor preview panel)
 */
export async function renderPreview(newsletter) {
  return renderNewsletter(newsletter, {
    unsubscribeUrl: '#preview-unsubscribe',
    previewText: 'Preview of your newsletter',
  });
}
