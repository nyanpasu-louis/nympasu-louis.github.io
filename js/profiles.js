(function () {
  'use strict';

  const accounts = [
    { platform: 'Rednote',     nick: 'Jr.Louis',          url: 'https://xhslink.cn/m/yJCDUwVan' },
    { platform: 'Rednote',     nick: 'JaronLouis Metro',  url: 'https://xhslink.cn/m/7eSQzpXmZZY' },
    { platform: '小破站',       nick: '自罚三杯快乐水',      url: 'https://b23.tv/HN7bvwu' },
    { platform: 'Steam',       nick: 'Jr.Louis',          url: 'https://steamcommunity.com/profiles/76561199223823513/' },
    { platform: 'Paradox Mods',nick: 'JaronLouis',        url: 'https://mods.paradoxplaza.com/authors/JaronLouis' },
    { platform: '油管',         nick: 'JaronLouis',        url: 'https://www.youtube.com/@JaronLouis-v5u' },
    { platform: '网易云',       nick: '-与盼-',             url: 'https://y.music.163.com/m/user?id=3293246882' },
    { platform: 'Github',      nick: '与盼 nympasu-louis', url: 'https://github.com/nyanpasu-louis' },
    { platform: 'LOFTER',      nick: '与盼',               url: 'https://jrlouis.lofter.com' },
    { platform: '微信公众号',   nick: 'Jr.Louis',          image: 'res/subs.jpg' },
  ];

  const container = document.getElementById('capsules-container');
  const overlay   = document.getElementById('wechat-overlay');
  const closeBtn  = document.getElementById('overlay-close');

  /* ── 尺寸档位（从紧凑到舒展均匀轮转） ── */
  const SIZE_TIERS = [
    { platSize: 18, nickSize: 15, padH: 24, padV: 14 },
    { platSize: 20, nickSize: 16, padH: 28, padV: 16 },
    { platSize: 22, nickSize: 18, padH: 32, padV: 18 },
    { platSize: 19, nickSize: 16, padH: 38, padV: 15 },
  ];

  /* ── 锚点（覆盖视口，避免大片空白） ── */
  const ANCHORS = [
    { x: 8,  y: 12 }, { x: 30, y: 7  }, { x: 58, y: 14 },
    { x: 80, y: 9  }, { x: 18, y: 36 }, { x: 48, y: 40 },
    { x: 74, y: 32 }, { x: 10, y: 64 }, { x: 55, y: 68 },
    { x: 78, y: 60 },
  ];

  /* ── 生成布局 ── */
  function generateLayout() {
    const seed = Date.now() % 2147483647;
    function rand(n) {
      let s = (seed + n * 16807) % 2147483647;
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    }

    /* 打乱锚点顺序 */
    const anchors = [...ANCHORS];
    for (let i = anchors.length - 1; i > 0; i--) {
      const j = Math.floor(rand(i) * (i + 1));
      [anchors[i], anchors[j]] = [anchors[j], anchors[i]];
    }

    /* 尺寸轮转分配 */
    const sizes = [];
    for (let i = 0; i < accounts.length; i++) {
      sizes.push(SIZE_TIERS[i % SIZE_TIERS.length]);
    }

    return accounts.map((acct, idx) => {
      const anchor = anchors[idx];
      const sz = sizes[idx];

      /* 锚点 ±4% 抖动 */
      const jx = (rand(idx * 2)     - 0.5) * 8;
      const jy = (rand(idx * 2 + 1) - 0.5) * 8;
      const left = Math.max(3, Math.min(85, anchor.x + jx));
      const top  = Math.max(3, Math.min(88, anchor.y + jy));

      /* 独立浮动参数 */
      const floatDur   = 4.0 + rand(idx * 3)     * 4.0;
      const floatDelay = rand(idx * 3 + 1) * 2.5;
      const floatAmp   = 7  + rand(idx * 3 + 2) * 10;

      return {
        account: acct,
        left, top,
        platSize: sz.platSize, nickSize: sz.nickSize,
        padH: sz.padH, padV: sz.padV,
        floatDur, floatDelay, floatAmp,
      };
    });
  }

  /* ── 渲染 ── */
  function render() {
    container.innerHTML = '';
    generateLayout().forEach(l => {
      const btn = document.createElement('button');
      btn.className = 'capsule';
      btn.style.left = l.left + '%';
      btn.style.top  = l.top  + '%';
      btn.style.setProperty('--plat-size',  l.platSize  + 'px');
      btn.style.setProperty('--nick-size',  l.nickSize  + 'px');
      btn.style.padding = l.padV + 'px ' + l.padH + 'px';
      btn.style.setProperty('--float-dur',   l.floatDur   + 's');
      btn.style.setProperty('--float-delay', l.floatDelay + 's');
      btn.style.setProperty('--float-amp',   l.floatAmp   + 'px');

      const plat = document.createElement('span');
      plat.className = 'capsule-platform';
      plat.textContent = l.account.platform;

      const nick = document.createElement('span');
      nick.className = 'capsule-nick';
      nick.textContent = l.account.nick;

      btn.appendChild(plat);
      btn.appendChild(nick);

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (l.account.image) {
          overlay.classList.add('visible');
        } else if (l.account.url) {
          window.open(l.account.url, '_blank');
        }
      });

      container.appendChild(btn);
    });
  }

  /* ── 浮层关闭 ── */
  function closeOverlay() {
    overlay.classList.remove('visible');
  }
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeOverlay();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlay();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('visible')) {
      closeOverlay();
    }
  });

  /* ── 初始化 ── */
  render();
  window.__rerenderProfiles = render;
})();
