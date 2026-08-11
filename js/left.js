/* ============================================================
   左侧区域 — 欢迎动画、动态圆点布局、主题色彩系统
   Home 用多语言轮播，Intro 用自定义三词轮播
   ============================================================ */

(async function () {
  'use strict';

  const COLORS = ['pink','blue','red','green','yellow','orange','purple'];

  const BASE_TOKENS = {
    pink:   { bg: '#CDA5A5', container: '#D8B8B6', primary: '#8B5A58' },
    blue:   { bg: '#98ACBE', container: '#A8B8C8', primary: '#4A6078' },
    red:    { bg: '#C59E9E', container: '#D0B0B0', primary: '#8B5A58' },
    green:  { bg: '#A2B4A0', container: '#B0C0AE', primary: '#4A6048' },
    yellow: { bg: '#C4BFA0', container: '#D0CCB0', primary: '#6A6040' },
    orange: { bg: '#C8AD9E', container: '#D4BCAE', primary: '#7A5840' },
    purple: { bg: '#AD9EB8', container: '#BAAEC5', primary: '#584868' },
  };

  let currentColor  = COLORS[Math.floor(Math.random() * COLORS.length)];
  let currentFilter = 'none';

  const wallpaper    = document.getElementById('wallpaper');
  const homeContent  = document.getElementById('home-content');
  const root         = document.documentElement;

  /* 各自的 hello-text span：Home 用多语言，Intro 用自定义 */
  const homeHelloSpan  = document.querySelector('.hello-text:not(.intro-hello) span');
  const introHelloSpan = document.querySelector('.intro-hello span');

  /* 收集所有 home-dots 容器 */
  const dotsContainers = document.querySelectorAll('.home-dots');
  if (!homeHelloSpan && !introHelloSpan) return;

  /* ── Home 欢迎语：多语言轮播 ──────────────────────────── */
  const greetings = [
    { locale: 'zh-Hans', text: '你好',       direction: 'ltr' },
    { locale: 'zh-Hant', text: '哈囉',       direction: 'ltr' },
    { locale: 'en',      text: 'Hello',      direction: 'ltr' },
    { locale: 'fr',      text: 'Bonjour',    direction: 'ltr' },
    { locale: 'ja',      text: 'こんにちは', direction: 'ltr' },
    { locale: 'ko',      text: '안녕하세요', direction: 'ltr' },
    { locale: 'de',      text: 'Hallo',      direction: 'ltr' },
    { locale: 'es',      text: 'Hola',       direction: 'ltr' },
    { locale: 'ru',      text: 'Привет', direction: 'ltr' },
    { locale: 'pt-PT',   text: 'Olá',   direction: 'ltr' },
    { locale: 'it',      text: 'Ciao',       direction: 'ltr' },
    { locale: 'tr',      text: 'Merhaba',    direction: 'ltr' },
    { locale: 'th',      text: 'สวัสดี', direction: 'ltr' },
    { locale: 'da',      text: 'Hej',        direction: 'ltr' },
    { locale: 'vi',      text: 'Xin chào', direction: 'ltr' },
    { locale: 'ar',      text: 'مرحبا', direction: 'rtl' },
  ];

  let langIndex = 0;

  /* ── Intro 欢迎语：自定义三词轮播 ────────────────────── */
  const introGreetings = [
    { text: 'Jr.Louis',       direction: 'ltr' },
    { text: 'Nympasu Louis',  direction: 'ltr' },
    { text: '与盼',   direction: 'ltr' },
  ];
  let introLangIndex = 0;

  /* ── 初始化显示 ────────────────────────────────── */
  if (homeHelloSpan) {
    homeHelloSpan.textContent = greetings[0].text;
    homeHelloSpan.style.opacity = '1';
  }
  if (introHelloSpan) {
    introHelloSpan.textContent = introGreetings[0].text;
    introHelloSpan.style.opacity = '1';
  }

  /* ── 统一轮播动画（Home 和 Intro 同步切换） ── */
  setInterval(function() {
    if (homeHelloSpan)  homeHelloSpan.style.opacity  = '0';
    if (introHelloSpan) introHelloSpan.style.opacity = '0';
    dotsContainers.forEach(function(c) { c.style.opacity = '0'; });
    setTimeout(function() {
      langIndex = (langIndex + 1) % greetings.length;
      introLangIndex = (introLangIndex + 1) % introGreetings.length;
      if (homeHelloSpan)  homeHelloSpan.textContent  = greetings[langIndex].text;
      if (introHelloSpan) introHelloSpan.textContent = introGreetings[introLangIndex].text;
      layoutHome();
      /* 强制回流 */
      dotsContainers[0].offsetHeight;
      if (homeHelloSpan)  homeHelloSpan.style.opacity  = '1';
      if (introHelloSpan) introHelloSpan.style.opacity = '1';
      dotsContainers.forEach(function(c) { c.style.opacity = '1'; });
    }, 400);
  }, 1250);

  /* ── 动态圆点布局 ────────────────────────────────────── */
  function layoutHome() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    /* 根据父容器 .visible 类判断当前活跃的是 Home 还是 Intro */
    const introContent = document.getElementById('intro-content');
    const introVisible = introContent && introContent.classList.contains('visible');
    let helloEl = null;
    if (introVisible && introHelloSpan) {
      helloEl = introHelloSpan;
    } else if (homeHelloSpan) {
      helloEl = homeHelloSpan;
    }

    const helloRect   = helloEl.getBoundingClientRect();
    const helloHeight = helloRect.height;
    const helloEndX   = helloRect.right;
    const centerLineX = vw / 2;

    /* 圆点网格常数 — 从 CSS 自定义属性读取 */
    const cs = getComputedStyle(root);
    const DOT_SIZE      = parseFloat(cs.getPropertyValue('--dot-size'));
    const DOT_GAP       = parseFloat(cs.getPropertyValue('--dot-gap'));
    const dotUnit       = DOT_SIZE + DOT_GAP;
    const minTextDotGap = Math.round(DOT_SIZE*1.2);

    /* 根据可见 span 判断是 Home 还是 Intro，取对应方向 */
    const rtl = (helloEl === introHelloSpan)
      ? introGreetings[introLangIndex].direction === 'rtl'
      : greetings[langIndex].direction === 'rtl';

    /* 可用宽度 = 文字右边缘到页面中线的距离 */
    let availableWidth = centerLineX - helloEndX;
    if (!rtl) {
      availableWidth -= (minTextDotGap*1.2);
    }

    let dotColumns = Math.max(1, Math.floor((availableWidth + DOT_GAP) / dotUnit));

    if (rtl) {
      dotColumns = Math.max(dotColumns - 1, 0);
    }

    /* 行数：匹配欢迎文字高度 */
    const dotRows   = Math.max(1, Math.floor((helloHeight + DOT_GAP) / dotUnit)+1);
    const totalDots = dotColumns * dotRows;

    root.style.setProperty('--dot-columns', dotColumns);
    root.style.setProperty('--dot-rows', dotRows);

    /* 计算网格精确尺寸 */
    const gridWidth  = dotColumns * DOT_SIZE + (dotColumns - 1) * DOT_GAP;

    /* 定位：右边缘对齐页面中线 */
    const marginLeft = centerLineX - helloEndX - gridWidth;

    /* 对所有 dots 容器应用相同的布局 */
    dotsContainers.forEach(function(container) {
      if (dotColumns === 0) {
        container.innerHTML = '';
        container.style.width = '0px';
        return;
      }

      container.style.width       = gridWidth + 'px';
      container.style.height      = helloHeight + 'px';
      container.style.left        = (helloEndX + marginLeft) + 'px';
      container.style.bottom      = 'var(--space-3)';

      /* 重建圆点元素 */
      container.innerHTML = '';
      for (let i = 0; i < totalDots; i++) {
        const dot = document.createElement('span');
        const col = i % dotColumns;
        const row = Math.floor(i / dotColumns);
        const isCorner =
          (row === 0 && col === 0) ||
          (row === 0 && col === dotColumns - 1) ||
          (row === dotRows - 1 && col === 0) ||
          (row === dotRows - 1 && col === dotColumns - 1);
        dot.className = isCorner ? 'dot dot-hidden' : 'dot';
        container.appendChild(dot);
      }
    });
  }

  /* ── 颜色运算工具函数 ────────────────────────────────── */
  function hexToRgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function(c) {
      const x = Math.max(0, Math.min(255, Math.round(c)));
      return x.toString(16).padStart(2, '0');
    }).join('');
  }
  function avgRgb(a, b) {
    return [Math.round((a[0]+b[0])/2), Math.round((a[1]+b[1])/2), Math.round((a[2]+b[2])/2)];
  }
  function blendRgb(a, b, r) {
    return [
      Math.round(a[0]*r + b[0]*(1-r)),
      Math.round(a[1]*r + b[1]*(1-r)),
      Math.round(a[2]*r + b[2]*(1-r))
    ];
  }

  function toGray(r, g, b) {
    const y = Math.round(0.299*r + 0.587*g + 0.114*b);
    return [y, y, y];
  }
  function toInvert(r, g, b) { return [255-r, 255-g, 255-b]; }
  function toHueSym(r, g, b) {
    const rf=r/255, gf=g/255, bf=b/255;
    const max=Math.max(rf,gf,bf), min=Math.min(rf,gf,bf);
    const l=(max+min)/2;
    if (max===min) return [r,g,b];
    const d=max-min;
    const s=l>.5 ? d/(2-max-min) : d/(max+min);
    let h;
    if (max===rf) h=((gf-bf)/d+(gf<bf?6:0))/6;
    else if (max===gf) h=((bf-rf)/d+2)/6;
    else h=((rf-gf)/d+4)/6;
    h=(h+.5)%1;
    const hue2rgb=function(p,q,t){
      if(t<0)t+=1;if(t>1)t-=1;
      if(t<1/6)return p+(q-p)*6*t;
      if(t<1/2)return q;
      if(t<2/3)return p+(q-p)*(2/3-t)*6;
      return p;
    };
    const q=l<.5?l*(1+s):l+s-l*s, p=2*l-q;
    return [
      Math.round(hue2rgb(p,q,h+1/3)*255),
      Math.round(hue2rgb(p,q,h)*255),
      Math.round(hue2rgb(p,q,h-1/3)*255)
    ];
  }

  function applyTransform(hex, filter) {
    const [r,g,b] = hexToRgb(hex);
    switch (filter) {
      case 'grayscale':    return toGray(r,g,b);
      case 'invert':       return toInvert(r,g,b);
      case 'hue-symmetry': return toHueSym(r,g,b);
      default:             return [r,g,b];
    }
  }

  /* ── 应用主题令牌到 CSS 变量 ──────────────────────────── */
  function applyTokens() {
    const base = BASE_TOKENS[currentColor];
    const tbg = applyTransform(base.bg, currentFilter);
    const tct = applyTransform(base.container, currentFilter);
    const tpr = applyTransform(base.primary, currentFilter);

    const ttx = avgRgb(tbg, tpr);
    const tho = blendRgb(tpr, tbg, 0.70);

    root.style.setProperty('--md-sys-color-background',         rgbToHex(tbg[0], tbg[1], tbg[2]));
    root.style.setProperty('--md-sys-color-surface-container',  rgbToHex(tct[0], tct[1], tct[2]));
    root.style.setProperty('--md-sys-color-primary',            rgbToHex(tpr[0], tpr[1], tpr[2]));
    root.style.setProperty('--md-sys-color-text-secondary',     rgbToHex(ttx[0], ttx[1], ttx[2]));
    root.style.setProperty('--md-sys-color-hello-text',         rgbToHex(tho[0], tho[1], tho[2]));

    wallpaper.style.filter = '';

    document.querySelectorAll('.swatch').forEach(function(s) {
      s.setAttribute('aria-pressed', s.dataset.color === currentColor ? 'true' : 'false');
    });
    document.querySelectorAll('.filter-btn').forEach(function(b) {
      b.setAttribute('aria-pressed', b.dataset.filter === currentFilter ? 'true' : 'false');
    });
  }

  function setColor(name)  { currentColor = name;  applyTokens(); }
  function setFilter(name) { currentFilter = name; applyTokens(); }

  /* 暴露到全局作用域，供底部区域调用 */
  window.__setColor = setColor;
  window.__layoutHome = layoutHome;
  window.__setFilter = setFilter;

  /* ── 初始化 ────────────────────────────────────────────── */
  await document.fonts.ready;
  applyTokens();
  layoutHome();
  dotsContainers.forEach(function(c) { c.style.opacity = '1'; });
  homeContent.classList.add('visible');

  window.addEventListener('resize', layoutHome);

})();
