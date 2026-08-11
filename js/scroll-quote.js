/* ============================================================
   滚动文字背景层
   ============================================================ */
(function () {
  'use strict';

  const container = document.getElementById('scrolling-quote');
  if (!container) return;

  const QUOTE = '谁也不知道中国太阳将飞多远，水娃他们将看到什么样的神奇世界，也许有一天他们对地球发出一声呼唤，要上千年才能得到回音。但水娃始终会牢记母亲行星上的一个叫中国的国度，牢记那个国度西部一片干旱土地上的一个小村庄，牢记村前的那条小路，他就是从那里启程的。  ——《中国太阳》';

  /* ── 构建滚动轨道 ──────────────────────────────────────── */
  const canvas = document.createElement('div');
  canvas.className = 'scroll-canvas';
  container.appendChild(canvas);

  const wrapper = document.createElement('div');
  wrapper.className = 'scroll-lines-wrapper';
  canvas.appendChild(wrapper);

  // 足够的行数填满旋转后的画布
  const lineCount = 8;

  function createLineSet() {
    const set = document.createElement('div');
    set.className = 'scroll-lines-set';
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < lineCount; i++) {
      const line = document.createElement('div');
      line.className = 'scroll-line';
      line.textContent = QUOTE;
      fragment.appendChild(line);
    }
    set.appendChild(fragment);
    return set;
  }

  // 两份首尾相连，translateY(-50%) 实现无缝循环
  wrapper.appendChild(createLineSet());
  wrapper.appendChild(createLineSet());
})();
