module.exports=[46354,t=>{"use strict";let e;async function i(){if(!e){let i=await t.A(11455);e=i.default||i}return e}let n=`
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;600;700&family=Poppins:wght@400;500;600;700&display=swap');
`;function o(t){return({Poppins:"Poppins, Arial, sans-serif","Noto Sans Hebrew":"'Noto Sans Hebrew', Arial, sans-serif",Inter:"Inter, Arial, sans-serif"})[t]||"Arial, sans-serif"}function r(t){let e=o(t.fontFamily||"Poppins"),i=(t,e)=>null!=t?t:e;switch(t.type){case"text":{let n=(t.content||"").replace(/\n/g,"<br>"),o="rtl"===t.direction?"direction:rtl;":"";return`<mj-text font-family="${e}" font-size="${t.fontSize||16}px" color="${t.color||"#333333"}" align="${t.textAlign||"center"}" line-height="${t.lineHeight||1.6}" padding="${i(t.paddingV,i(t.padding,0))}px ${i(t.paddingH,0)}px"><div style="margin:0;padding:0;${o}">${n}</div></mj-text>`}case"title":if(t.backgroundColor){let i,n,o,r;return`<mj-text padding="4px 0">${i=t.padding||10,n=t.color||"#FFFFFF",o=`<div style="width:0;height:0;border-top:6px solid transparent;border-bottom:6px solid transparent;border-left:9px solid ${n};display:inline-block;margin:0 auto;"></div>`,r=t.showChevron?`<td style="width:40px;padding-right:${i}px;vertical-align:middle;text-align:center;"><div style="width:28px;height:28px;border-radius:50%;background-color:rgba(255,255,255,0.25);line-height:28px;text-align:center;margin:0 auto;">${o}</div></td>`:"",`<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${t.backgroundColor};border-radius:${t.borderRadius||24}px;"><tr><td style="padding:${i}px ${i+8}px;font-family:${e};font-size:${t.fontSize||14}px;font-weight:${t.fontWeight||600};color:${n};letter-spacing:${t.letterSpacing||"0.06em"};font-style:${t.fontStyle||"normal"};">${t.text||""}</td>${r}</tr></table>`}</mj-text>`}return`<mj-text font-family="${e}" font-size="${t.fontSize||18}px" font-weight="${t.fontWeight||700}" color="${t.color||"#FFFFFF"}" align="${t.textAlign||"center"}" letter-spacing="${t.letterSpacing||"0.1em"}" line-height="${t.lineHeight||1.2}" padding="${i(t.paddingV,i(t.padding,0))}px ${i(t.paddingH,0)}px"><div style="margin:0;padding:0;font-style:${t.fontStyle||"normal"};">${t.text||""}</div></mj-text>`;case"image":return t.src?`<mj-image src="${t.src}" alt="${t.alt||""}" width="${t.width?t.width+"px":"700px"}" border-radius="${t.borderRadius||0}px" padding="0" fluid-on-mobile="true" />`:"";case"button":return`<mj-button href="${t.url||"#"}" background-color="${t.backgroundColor||"#04D1FC"}" color="${t.textColor||"#FFFFFF"}" font-size="${t.fontSize||16}px" font-weight="${t.fontWeight||"600"}" border-radius="${t.borderRadius||8}px" inner-padding="${i(t.paddingV,14)}px ${i(t.paddingH,32)}px" align="${t.align||"center"}">${t.text||"Click Here"}</mj-button>`;case"divider":return`<mj-divider border-color="${t.color||"#E5E7EB"}" border-width="${t.thickness||1}px" padding="${t.marginTop||8}px 0 ${t.marginBottom||8}px 0" />`;case"spacer":return`<mj-spacer height="${t.height||24}px" />`;case"logo":if(t.rightText){let i=t.src?`<img src="${t.src}" alt="Logo" width="${t.width||120}" style="display:block;" />`:"";return`<mj-text padding="8px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;"><tr><td style="vertical-align:middle;">${i}</td><td style="vertical-align:middle;text-align:right;font-family:${e};font-size:${t.rightTextFontSize||11}px;font-weight:${t.rightTextFontWeight||500};color:${t.rightTextColor||"#FFFFFF"};letter-spacing:${t.rightTextLetterSpacing||"0.05em"};text-transform:uppercase;">${t.rightText}</td></tr></table></mj-text>`}return t.src?`<mj-image src="${t.src}" alt="Logo" width="${t.width||120}px" align="${t.alignment||"center"}" padding="8px 0" />`:"";case"marquee":{if(t.gifUrl)return`<mj-image src="${t.gifUrl}" alt="Marquee" width="700px" padding="0" fluid-on-mobile="true" />`;let n=t.items,o=Array.isArray(n)?n:"string"==typeof n?n.split(",").map(t=>t.trim()).filter(Boolean).map(t=>({type:"text",value:t})):[],r=t.separator||"•",a=t.imageSize||24,l=o.map((t,e)=>{let i=e<o.length-1?`<span style="opacity:0.5;margin:0 12px;">${r}</span>`:"";return"image"===t.type&&t.src?`<img src="${t.src}" alt="" width="${a}" height="${a}" style="display:inline-block;vertical-align:middle;" />${i}`:`<span style="white-space:nowrap;">${t.value||""}</span>${i}`}).join("");return`<mj-text font-family="${e}" font-size="${t.fontSize||14}px" font-weight="${t.fontWeight||"500"}" color="${t.textColor||"#ffffff"}" align="center" letter-spacing="${t.letterSpacing||"0.02em"}" padding="${i(t.paddingVertical,10)}px 0">${l}</mj-text>`}case"multiLayout":{let i=t.title||"",n=(t.body||"").replace(/\n/g,"<br>"),o=t.badgeText||"BUILDER",r=t.badgeColor||"#1a1a3e";return`
        <mj-text font-family="${e}" font-size="14px" font-weight="600" color="${r}" letter-spacing="0.06em" padding="0 0 4px 0" text-transform="uppercase">${o}</mj-text>
        <mj-divider border-color="#E5E7EB" border-width="1px" padding="0 0 8px 0" />
        <mj-text font-family="${e}" font-size="13px" font-weight="700" color="#1C1917" letter-spacing="0.03em" line-height="1.3" padding="8px 0 6px 0">${i}</mj-text>
        <mj-text font-family="${e}" font-size="13px" color="#6B7280" line-height="1.65" padding="0">${n}</mj-text>`}case"promoCard":{let i=t.direction||"rtl",n=(t.body||"").replace(/\n/g,"<br>");return`
        <mj-text font-family="${e}" font-size="${t.titleFontSize||28}px" font-weight="${t.titleFontWeight||700}" color="${t.titleColor||"#1A1A1A"}" align="${t.contentAlign||"right"}" line-height="1.3" padding="0 0 16px 0"><div style="direction:${i};">${t.title||""}</div></mj-text>
        <mj-text font-family="${e}" font-size="${t.bodyFontSize||16}px" color="${t.bodyColor||"#555555"}" align="${t.contentAlign||"right"}" line-height="${t.bodyLineHeight||1.7}" padding="0"><div style="direction:${i};">${n}</div></mj-text>`}case"imageCollage":return(t.images||[]).map(t=>`<mj-image src="${t}" alt="Image" border-radius="8px" padding="4px 0" />`).join("\n        ");case"profileCards":return(t.profiles||[]).map(t=>t?`${t.image?`<mj-image src="${t.image}" alt="${t.name||""}" width="80px" border-radius="50%" padding="0 0 10px 0" />`:""}
        ${t.name?`<mj-text font-family="${e}" font-size="14px" font-weight="600" color="#333" align="center" padding="0 0 4px 0">${t.name}</mj-text>`:""}`:"").join("\n        ");case"socialLinks":{let e={facebook:"https://cdn-icons-png.flaticon.com/512/733/733547.png",x:"https://cdn-icons-png.flaticon.com/512/5968/5968958.png",linkedin:"https://cdn-icons-png.flaticon.com/512/733/733561.png",instagram:"https://cdn-icons-png.flaticon.com/512/733/733558.png",rss:"https://cdn-icons-png.flaticon.com/512/1051/1051277.png"},i=Object.entries(t.links||{}).filter(([,t])=>t&&"#"!==t).map(([i,n])=>`<mj-social-element name="${i}" href="${n}" src="${e[i]||""}" background-color="transparent" icon-size="${t.iconSize||24}px" />`).join("");return i?`<mj-social font-size="0" icon-size="${t.iconSize||24}px" mode="horizontal" padding="0" align="${t.align||"center"}">${i}</mj-social>`:""}case"footerLinks":{let i=t.links||[];if(!i.length)return"";return`<mj-text font-family="${e}" font-size="${t.fontSize||14}px" align="${t.align||"center"}" padding="0">
        ${i.map((e,n)=>{let o=n<i.length-1?'<span style="margin:0 8px;opacity:0.5;">|</span>':"";return`<a href="${e.url||"#"}" style="color:${t.color||"#374151"};text-decoration:underline;">${e.text}</a>${o}`}).join("")}
      </mj-text>`}case"companyInfo":return t.text?`<mj-text font-family="${e}" font-size="${t.fontSize||14}px" color="${t.color||"#374151"}" align="${t.align||"center"}" line-height="1.5" padding="0">${t.text}</mj-text>`:"";case"imageSequence":{let e=t.images||[];if(0===e.length)return"";return`<mj-image src="${e[0]}" alt="Image sequence" width="100%" border-radius="0" padding="0" />`}case"recipe":{let i=(t.ingredients||"").replace(/\n/g,"<br>"),n=(t.instructions||"").replace(/\n/g,"<br>");return`
        <mj-text font-family="${e}" font-size="24px" font-weight="600" color="#333" align="center" padding="0 0 20px 0"><div style="direction:rtl;">${t.title||""}</div></mj-text>
        ${t.image?`<mj-image src="${t.image}" alt="${t.title||""}" border-radius="8px" padding="0 0 20px 0" />`:""}
        <mj-text font-family="${e}" font-size="14px" color="#333" align="right" line-height="1.8" padding="0 0 15px 0"><div style="direction:rtl;">${i}</div></mj-text>
        <mj-text font-family="${e}" font-size="14px" color="#333" align="right" line-height="1.8" padding="0"><div style="direction:rtl;">${n}</div></mj-text>`}default:return""}}async function a(t,e={}){let l=await i(),d=function(t,e={}){let{unsubscribeUrl:i,previewText:a}=e,l=t.pageSettings||{},d=l.outerBackgroundColor||"#F5F5F5",p=l.innerBackgroundColor||"#FFFFFF",g=t.sections.map(t=>(function(t,e){if(Array.isArray(t.rows)||Array.isArray(t.blocks))return function(t,e){let i=t.background||{},n=t.padding||{},o=n.top??24,a=n.bottom??24,l=n.left??24,d=n.right??24,p="solid"===i.type?`background-color="${i.color||e||"#FFFFFF"}"`:"gradient"===i.type?`background-color="${i.gradientStart||"#04D1FC"}"`:"image"===i.type&&i.image?`background-url="${i.image}" background-size="cover" background-position="${i.imagePosition||"center"}" background-color="${i.fallbackColor||i.color||"#1a1a2e"}"`:("none"===i.type||i.type,`background-color="${e||"#FFFFFF"}"`),g=t.height&&"auto"!==t.height?parseInt(t.height,10):0,c=t.minHeight?parseInt(t.minHeight,10):0,s=g||c;function m(e){return s?e.replace(/(<mj-section\b)/,`$1 css-class="sec-h-${t.id}"`):e}if(Array.isArray(t.rows)&&t.rows.length>0){if(t.rows.some(t=>t.columns&&t.columns.length>1)){let e=t.rows.map(t=>(function(t){let e=t.columns||[];if(0===e.length)return"";let i=e.map(t=>{let e=Math.round(t.span/12*100),i=(t.blocks||[]).map(t=>r(t)).filter(Boolean).join("\n        ");return`
      <mj-column width="${e}%">
        ${i||'<mj-text padding="0">&nbsp;</mj-text>'}
      </mj-column>`}).join("");return`
    <mj-section background-color="transparent" padding="0">
      ${i}
    </mj-section>`})(t)).filter(Boolean).join("\n");return`
    <mj-wrapper ${p} padding="${o}px ${d}px ${a}px ${l}px"${s?` css-class="sec-h-${t.id}"`:""}>
      ${e}
    </mj-wrapper>`}let e=[];for(let i of t.rows)for(let t of i.columns||[])for(let i of t.blocks||[])e.push(i);let i=e.map(t=>r(t)).filter(Boolean).join("\n        ");return m(`
    <mj-section ${p} padding="${o}px ${d}px ${a}px ${l}px">
      <mj-column>
        ${i||'<mj-text padding="0">&nbsp;</mj-text>'}
      </mj-column>
    </mj-section>`)}let $=(t.blocks||[]).map(t=>r(t)).filter(Boolean).join("\n        ");return m(`
    <mj-section ${p} padding="${o}px ${d}px ${a}px ${l}px">
      <mj-column>
        ${$||'<mj-text padding="0">&nbsp;</mj-text>'}
      </mj-column>
    </mj-section>`)}(t,e);switch(t.type){case"header":let i,n,a,l,d,p;return i=t.backgroundColor||"#4A90D9",t.gradientEnd,n=t.textColor||"#ffffff",a=o("Poppins"),l=`${t.titleFontSize||28}px`,d=`${t.subtitleFontSize||16}px`,p=`background-color="${i}"`,`
    <mj-section ${p} padding="0">
      <mj-column>
        ${t.logo?`
        <mj-image
          src="${t.logo}"
          alt="Logo"
          width="${t.logoWidth||120}px"
          align="${t.logoAlignment||"center"}"
          padding="40px 20px 20px"
        />`:""}
        ${t.heroImage?`
        <mj-image
          src="${t.heroImage}"
          alt="Hero"
          width="560px"
          border-radius="8px"
          padding="0 20px 24px"
        />`:""}
        <mj-text
          font-family="${a}"
          font-size="${l}"
          font-weight="${t.titleFontWeight||"700"}"
          color="${n}"
          align="center"
          padding="0 20px 10px"
          line-height="1.2"
          letter-spacing="${t.titleLetterSpacing||"-0.02em"}"
        >${t.title||""}</mj-text>
        ${t.subtitle?`
        <mj-text
          font-family="${a}"
          font-size="${d}"
          font-weight="${t.subtitleFontWeight||"400"}"
          color="${n}"
          align="center"
          padding="0 20px ${t.showDateBadge?"20px":"40px"}"
          line-height="1.4"
          css-class="subtitle"
        >${t.subtitle}</mj-text>`:""}
        ${t.showDateBadge&&t.dateBadgeText?`
        <mj-text align="right" padding="0 20px 16px">
          <span style="background-color:${t.dateBadgeBg||"#04D1FC"};color:${t.dateBadgeColor||"#ffffff"};padding:6px 14px;border-radius:4px;font-size:12px;font-weight:600;font-family:${a};letter-spacing:0.05em;">${t.dateBadgeText}</span>
        </mj-text>`:""}
      </mj-column>
    </mj-section>`;case"marquee":return function(t){if(t.gifUrl)return t.paddingVertical,`
    <mj-section background-color="${t.backgroundColor||"#04D1FC"}" padding="0">
      <mj-column>
        <mj-image src="${t.gifUrl}" alt="Marquee" width="700px" padding="0" fluid-on-mobile="true" />
      </mj-column>
    </mj-section>`;let e=t.items,i=Array.isArray(e)?e:"string"==typeof e?e.split(",").map(t=>t.trim()).filter(Boolean).map(t=>({type:"text",value:t})):[],n=t.separator||"•",r=t.imageSize||24,a=o("Poppins"),l=i.map((t,e)=>{let o=e<i.length-1?`<span style="opacity:0.5;margin:0 12px;">${n}</span>`:"";return"image"===t.type&&t.src?`<img src="${t.src}" alt="" width="${r}" height="${r}" style="display:inline-block;vertical-align:middle;" />${o}`:`<span style="white-space:nowrap;">${t.value||""}</span>${o}`}).join("");return`
    <mj-section background-color="${t.backgroundColor||"#04D1FC"}" padding="${t.paddingVertical||10}px 20px">
      <mj-column>
        <mj-text
          font-family="${a}"
          font-size="${t.fontSize||14}px"
          font-weight="${t.fontWeight||"500"}"
          color="${t.textColor||"#ffffff"}"
          align="center"
          letter-spacing="${t.letterSpacing||"0.02em"}"
          padding="0"
        >${l}</mj-text>
      </mj-column>
    </mj-section>`}(t);case"text":let g,c,s,m;return g=o(t.fontFamily||"Poppins"),c=(t.content||"").replace(/\n/g,"<br>"),s="rtl"===t.direction?"direction:rtl;":"",m="transparent"!==t.backgroundColor&&t.backgroundColor?t.backgroundColor:"transparent",`
    <mj-section background-color="${m}" padding="0">
      <mj-column>
        <mj-text
          font-family="${g}"
          font-size="${t.fontSize||16}px"
          color="${t.color||"#333333"}"
          align="${t.textAlign||"center"}"
          line-height="1.6"
          padding="${t.padding||40}px 0"
          css-class="${"rtl"===t.direction?"rtl-text":""}"
        ><div style="margin:0;padding:0;${s}">${c}</div></mj-text>
      </mj-column>
    </mj-section>`;case"sectionHeader":let $,f;return $=o("Poppins"),f=t.backgroundColor||"#04D1FC",`
    <mj-section background-color="${f}" padding="${t.paddingTop??t.padding??14}px ${t.paddingRight??24}px ${t.paddingBottom??t.padding??14}px ${t.paddingLeft??24}px">
      <mj-column>
        <mj-text
          font-family="${$}"
          font-size="${t.fontSize||14}px"
          font-weight="${t.fontWeight||600}"
          color="${t.color||"#ffffff"}"
          align="center"
          letter-spacing="${t.letterSpacing||"0.08em"}"
          text-transform="uppercase"
          padding="0"
        >${t.text||""}</mj-text>
      </mj-column>
    </mj-section>`;case"accentText":return function(t){let e=o(t.fontFamily||"Noto Sans Hebrew"),i=t.direction||"rtl",n=t.contentAlign||"right",r=(t.content||"").replace(/\n\n/g,"<br><br>").replace(/\n/g,"<br>"),a="";if(t.tagText){let i="top-left"===t.tagPosition?"left":"right";a=`
      <mj-text align="${i}" padding="0 0 ${t.tagToContentGap??40}px 0">
        <span style="background-color:${t.tagBackgroundColor||"#04D1FC"};color:${t.tagTextColor||"#FFFFFF"};padding:10px 24px;border-radius:${t.tagBorderRadius||8}px;font-size:${t.tagFontSize||14}px;font-weight:600;font-family:${e};line-height:1.2;display:inline-block;">${t.tagText}</span>
      </mj-text>`}let l=t.paddingTop??t.padding??40,d=t.paddingBottom??t.padding??40,p=t.paddingLeft??t.padding??40,g=t.paddingRight??t.padding??40;return`
    <mj-section background-color="${t.backgroundColor||"#FFFFFF"}" padding="${l}px ${g}px ${d}px ${p}px" direction="${i}">
      <mj-column>
        ${a}
        <mj-text
          font-family="${e}"
          font-size="${t.contentFontSize||18}px"
          color="${t.contentColor||"#333333"}"
          align="${n}"
          line-height="${t.contentLineHeight||1.8}"
          padding="0"
        ><div style="direction:${i};">${r}</div></mj-text>
      </mj-column>
    </mj-section>`}(t);case"promoCard":let x,h,u,j,b,y,w,F,k;return x=o(t.fontFamily||"Noto Sans Hebrew"),h=t.direction||"rtl",u=t.contentAlign||"right",j=(t.body||"").replace(/\n/g,"<br>"),b=t.paddingTop??t.padding??32,y=t.paddingBottom??t.padding??32,w=t.imagePosition||"right",F=t.image?`
    <mj-column width="40%" padding="10px">
      <mj-image
        src="${t.image}"
        alt="Promo"
        border-radius="${t.imageBorderRadius||12}px"
        width="${t.imageWidth||200}px"
      />
    </mj-column>`:"",k=`
    <mj-column width="${t.image?"60%":"100%"}" padding="10px" vertical-align="middle">
      <mj-text
        font-family="${x}"
        font-size="${t.titleFontSize||28}px"
        font-weight="${t.titleFontWeight||700}"
        color="${t.titleColor||"#1A1A1A"}"
        align="${u}"
        line-height="1.3"
        padding="0 0 ${t.titleToBodyGap??16}px 0"
      ><div style="direction:${h};">${t.title||"Card Title"}</div></mj-text>
      <mj-text
        font-family="${x}"
        font-size="${t.bodyFontSize||16}px"
        color="${t.bodyColor||"#555555"}"
        align="${u}"
        line-height="${t.bodyLineHeight||1.7}"
        padding="0 0 ${!1!==t.showCta?(t.bodyToCtaGap??20)+"px":"0"} 0"
      ><div style="direction:${h};">${j}</div></mj-text>
      ${!1!==t.showCta&&t.ctaText?`
      <mj-text
        font-family="${x}"
        font-size="${t.ctaFontSize||16}px"
        font-weight="${t.ctaFontWeight||500}"
        align="${u}"
        padding="0"
      ><a href="${t.ctaLink||"#"}" style="color:${t.ctaColor||"#04D1FC"};text-decoration:none;">${t.ctaText}</a></mj-text>`:""}
    </mj-column>`,`
    <mj-section background-color="${t.backgroundColor||"#F8F9FA"}" padding="${b}px 20px ${y}px 20px" direction="${h}">
      ${"rtl"===h&&"right"===w||"ltr"===h&&"left"===w?F+k:k+F}
    </mj-section>`;case"imageCollage":let z=t.images||[];if(0===z.length)return"";let v=Math.min(z.length,4),C=[];for(let t=0;t<z.length;t+=v)C.push(z.slice(t,t+v));return C.map(e=>{let i=`${Math.floor(100/e.length)}%`,n=e.map((t,e)=>`
      <mj-column width="${i}" padding="4px">
        <mj-image
          src="${t}"
          alt="Image ${e+1}"
          border-radius="8px"
          padding="0"
        />
      </mj-column>`).join("");return`
      <mj-section background-color="${t.backgroundColor||"#ffffff"}" padding="8px 12px">
        ${n}
      </mj-section>`}).join("");case"profileCards":let S=t.profiles||[];if(0===S.length)return"";let A=o("Poppins"),B="circular"===t.imageShape?"50%":"8px",T=S.map(e=>e?`
      <mj-column padding="10px">
        ${e.image?`
        <mj-image
          src="${e.image}"
          alt="${e.name||""}"
          width="80px"
          height="80px"
          border-radius="${B}"
          padding="0 0 10px 0"
        />`:""}
        ${!1!==t.showName&&e.name?`
        <mj-text font-family="${A}" font-size="14px" font-weight="600" color="#333333" align="center" padding="0 0 4px 0">${e.name}</mj-text>`:""}
        ${!1!==t.showTitle&&e.title?`
        <mj-text font-family="${A}" font-size="12px" color="#666666" align="center" padding="0">${e.title}</mj-text>`:""}
      </mj-column>`:"").join("");return`
    <mj-section background-color="${t.backgroundColor||"#ffffff"}" padding="30px 20px">
      ${T}
    </mj-section>`;case"recipe":let L,H,I;return L=o("Noto Sans Hebrew"),H=(t.ingredients||"").replace(/\n/g,"<br>"),I=(t.instructions||"").replace(/\n/g,"<br>"),`
    <mj-section background-color="${t.backgroundColor||"#ffffff"}" padding="30px 20px">
      <mj-column>
        <mj-text font-family="${L}" font-size="24px" font-weight="600" color="#333333" align="center" padding="0 0 20px 0">
          <div style="direction:rtl;">${t.title||""}</div>
        </mj-text>
        ${t.image?`
        <mj-image src="${t.image}" alt="${t.title||""}" border-radius="8px" padding="0 0 20px 0" />`:""}
        <mj-text font-family="${L}" font-size="14px" color="#333333" align="right" line-height="1.8" padding="0 0 15px 0">
          <div style="direction:rtl;">${H}</div>
        </mj-text>
        <mj-text font-family="${L}" font-size="14px" color="#333333" align="right" line-height="1.8" padding="0">
          <div style="direction:rtl;">${I}</div>
        </mj-text>
      </mj-column>
    </mj-section>`;case"footer":return function(t){let e=o(t.fontFamily||"Poppins"),i=t.textAlign||"center",n=t.paddingTop??t.padding??40,r=t.paddingBottom??t.padding??40,a="";if(!1!==t.showSocial&&t.socialLinks){let e={facebook:"https://cdn-icons-png.flaticon.com/512/733/733547.png",x:"https://cdn-icons-png.flaticon.com/512/5968/5968958.png",twitter:"https://cdn-icons-png.flaticon.com/512/5968/5968958.png",linkedin:"https://cdn-icons-png.flaticon.com/512/733/733561.png",instagram:"https://cdn-icons-png.flaticon.com/512/733/733558.png",youtube:"https://cdn-icons-png.flaticon.com/512/733/733579.png",tiktok:"https://cdn-icons-png.flaticon.com/512/3046/3046121.png"},n=["facebook","x","twitter","linkedin","instagram","youtube","tiktok"].filter(e=>t.socialLinks[e]).map(i=>`<mj-social-element name="${i}" href="${t.socialLinks[i]}" src="${e[i]}" background-color="transparent" icon-size="24px" />`).join("");n&&(a=`<mj-social font-size="0" icon-size="24px" mode="horizontal" padding="0 0 20px 0" align="${i}">${n}</mj-social>`)}return`
    <mj-section background-color="${t.backgroundColor||"#FFFFFF"}" padding="${n}px 20px ${r}px 20px">
      <mj-column>
        ${t.logo?`
        <mj-image src="${t.logo}" alt="Logo" width="${t.logoWidth||120}px" align="${i}" padding="0 0 20px 0" />`:""}
        ${a}
        ${!1!==t.showDivider?`
        <mj-divider border-color="${t.dividerColor||"#E5E7EB"}" border-width="${t.dividerWidth||1}px" padding="0 0 20px 0" />`:""}
        ${!1!==t.showCompanyInfo&&t.companyInfo?`
        <mj-text font-family="${e}" font-size="${t.companyInfoFontSize||14}px" color="${t.companyInfoColor||"#374151"}" align="${i}" line-height="1.6" padding="0 0 12px 0">${t.companyInfo}</mj-text>`:""}
        ${!1!==t.showFooterLinks&&t.footerLinks?.length>0?`
        <mj-text font-family="${e}" font-size="${t.linkFontSize||14}px" align="${i}" padding="0">
          ${t.footerLinks.map((e,i)=>{let n=i<t.footerLinks.length-1?`<span style="margin:0 8px;opacity:0.5;">${t.linkSeparator||"|"}</span>`:"";return`<a href="${e.url||"#"}" style="color:${t.linkColor||"#374151"};text-decoration:underline;">${e.text}</a>${n}`}).join("")}
        </mj-text>`:""}
      </mj-column>
    </mj-section>`}(t);default:return""}})(t,p)).filter(Boolean).join("\n"),c=t.sections.filter(t=>{let e=t.height&&"auto"!==t.height?parseInt(t.height,10):0,i=t.minHeight?parseInt(t.minHeight,10):0;return e||i}).map(t=>{let e=t.height&&"auto"!==t.height?parseInt(t.height,10):0,i=t.minHeight?parseInt(t.minHeight,10):0;return`.sec-h-${t.id} { min-height: ${e||i}px !important; }
      .sec-h-${t.id} td { vertical-align: top; }`}).join("\n          ");return`
    <mjml>
      <mj-head>
        <mj-attributes>
          <mj-all font-family="Arial, sans-serif" />
          <mj-body background-color="${d}" />
          <mj-section background-color="transparent" />
          <mj-wrapper background-color="${p}" />
        </mj-attributes>
        <mj-style>
          ${n}
          .rtl-text div { direction: rtl; }
          ${c}
        </mj-style>
        <mj-style inline="inline">
          ${c}
        </mj-style>
        ${a?`<mj-preview>${a}</mj-preview>`:""}
      </mj-head>
      <mj-body width="700px" background-color="${d}">
        ${g}
        ${i?`
    <mj-section padding="20px">
      <mj-column>
        <mj-text font-size="12px" color="#9CA3AF" align="center" line-height="1.5" padding="0">
          You received this because you're subscribed to our newsletter.<br>
          <a href="${i}" style="color:#6B7280;text-decoration:underline;">Unsubscribe</a>
        </mj-text>
      </mj-column>
    </mj-section>`:""}
      </mj-body>
    </mjml>`}(t,e),p=l(d,{keepComments:!1,beautify:!1,minify:!0,validationLevel:"soft"});return p.errors?.length>0&&console.warn("MJML rendering warnings:",p.errors),{html:p.html,errors:p.errors||[],mjml:d}}async function l(t){return a(t,{unsubscribeUrl:"#preview-unsubscribe",previewText:"Preview of your newsletter"})}t.s(["renderNewsletter",()=>a,"renderPreview",()=>l])}];

//# sourceMappingURL=7e03e_Studio%202_0%20Newsletter_newsletter-platform_src_lib_mjml-renderer_bdbbf1ac.js.map