/* ============================================================
   底部区域 — 导航栏交互、选项面板（主题色/滤镜切换）
   ============================================================ */
(function () {
  'use strict';

  const COLORS = ['pink','blue','red','green','yellow','orange','purple','gray'];

  const BASE_TOKENS = {
    pink:   { bg: '#CDA5A5', container: '#D8B8B6', primary: '#8B5A58' },
    blue:   { bg: '#98ACBE', container: '#A8B8C8', primary: '#4A6078' },
    red:    { bg: '#C59E9E', container: '#D0B0B0', primary: '#8B5A58' },
    green:  { bg: '#A2B4A0', container: '#B0C0AE', primary: '#4A6048' },
    yellow: { bg: '#C4BFA0', container: '#D0CCB0', primary: '#6A6040' },
    orange: { bg: '#C8AD9E', container: '#D4BCAE', primary: '#7A5840' },
    purple: { bg: '#AD9EB8', container: '#BAAEC5', primary: '#584868' },
    gray:   { bg: '#B2B2B0', container: '#BFBFBD', primary: '#5A5A58' }
  };

  let currentColor  = COLORS[Math.floor(Math.random() * COLORS.length)];
  let currentFilter = 'none';

  const homeContent  = document.getElementById('home-content');
  const optionsPanel = document.getElementById('options-panel');
  const profilesPanel = document.getElementById('profiles-panel');
  const introContent  = document.getElementById('intro-content');
  const terminalPanel = document.getElementById('terminal-panel');
  const swatches     = document.getElementById('theme-swatches');
  const filterOpts   = document.getElementById('filter-options');
  const navPills     = document.querySelectorAll('.nav-pill');
  const wallpaper    = document.getElementById('wallpaper');
  const root         = document.documentElement;

  /* ── 颜色运算 ──────────────────────────────────────────── */
  function hexToRgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(c => {
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
    const hue2rgb=(p,q,t)=>{
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

  function applyTokens() {
    const base = BASE_TOKENS[currentColor];
    const tbg = applyTransform(base.bg, currentFilter);
    const tct = applyTransform(base.container, currentFilter);
    const tpr = applyTransform(base.primary, currentFilter);
    const ttx = blendRgb(tpr, tbg, 0.72);
    const tho = blendRgb(tpr, tbg, 0.70);

    root.style.setProperty('--md-sys-color-background',         rgbToHex(...tbg));
    root.style.setProperty('--md-sys-color-surface-container',  rgbToHex(...tct));
    root.style.setProperty('--md-sys-color-primary',            rgbToHex(...tpr));
    root.style.setProperty('--md-sys-color-text-secondary',     rgbToHex(...ttx));
    root.style.setProperty('--md-sys-color-hello-text',         rgbToHex(...tho));
    wallpaper.style.filter = '';

    swatches.querySelectorAll('.swatch').forEach(s =>
      s.setAttribute('aria-pressed', s.dataset.color === currentColor ? 'true' : 'false'));
    filterOpts.querySelectorAll('.filter-btn').forEach(b =>
      b.setAttribute('aria-pressed', b.dataset.filter === currentFilter ? 'true' : 'false'));
  }

  function setColor(name)  { currentColor = name;  applyTokens(); }
  function setFilter(name) { currentFilter = name; applyTokens(); }

  /* ── 同步左侧区域的初始颜色 ────────────────────────────── */
  applyTokens();

  /* ── 导航按钮 ──────────────────────────────────────────── */
  navPills.forEach(pill => {
    pill.addEventListener('click', () => {
      navPills.forEach(p => p.removeAttribute('aria-current'));
      pill.setAttribute('aria-current', 'page');

      const nav = pill.dataset.nav;
      homeContent.classList.toggle('visible', nav === 'home');
      optionsPanel.classList.toggle('visible', nav === 'option');
      profilesPanel.classList.toggle('visible', nav === 'profiles');
      introContent.classList.toggle('visible', nav === 'intro');
      terminalPanel.classList.toggle('visible', nav === 'terminal');
      if (nav === 'intro' && window.__layoutHome) window.__layoutHome();
      if (nav === 'profiles' && window.__rerenderProfiles) window.__rerenderProfiles();

      const scrollQuote = document.getElementById('scrolling-quote');
      if (scrollQuote) {
        scrollQuote.classList.toggle('option-mode', nav === 'option' || nav === 'profiles');
        scrollQuote.classList.toggle('terminal-mode', nav === 'terminal');
      }
      if (nav === 'terminal' && window.__focusTerminal) window.__focusTerminal();
    });

    pill.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pill.click(); }
    });
  });

  /* ── 色板点击 ──────────────────────────────────────────── */
  swatches.addEventListener('click', e => {
    const btn = e.target.closest('.swatch');
    if (btn) setColor(btn.dataset.color);
  });

  /* ── 滤镜点击 ──────────────────────────────────────────── */
  filterOpts.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (btn) setFilter(btn.dataset.filter);
  });

})();
