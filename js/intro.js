/* ============================================================
   Intro选项卡 — MBTI 点阵
   ============================================================ */
(function () {
  'use strict';

  const grid = document.getElementById('intro-mbti-grid');
  if (!grid) return;

  // 14列 × 4行，每行从左到右填充的比例
  const rows = [
    { letter: 'I', fill: 10 },   // 70%
    { letter: 'N', fill: 14 },   // 100%
    { letter: 'F', fill: 7  },   // 50%
    { letter: 'P', fill: 13 },   // 90%
  ];

  const COLS = 14;
  const fragment = document.createDocumentFragment();

  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < COLS; c++) {
      const dot = document.createElement('div');
      dot.className = 'dot';
      if (c < rows[r].fill) dot.classList.add('filled');
      fragment.appendChild(dot);
    }
  }

  grid.appendChild(fragment);

  /* ── 精确对齐：点阵对上三行，三行文字对下三行 ────────── */
  const rightTextRows = document.querySelectorAll('.intro-info-right .mbti-text-row');

  function syncLayout() {
    const leftRows = document.querySelectorAll('.intro-info-left .intro-info-row');
    const right = document.querySelector('.intro-info-right');
    if (leftRows.length !== 6 || !right) return;

    const leftRect = leftRows[0].parentElement.getBoundingClientRect();

    // 点阵占据上三行（行0-2）
    const gridTop  = leftRows[0].getBoundingClientRect().top  - leftRect.top;
    const gridBot  = leftRows[2].getBoundingClientRect().bottom - leftRect.top;
    grid.style.position = 'absolute';
    grid.style.top      = gridTop + 'px';
    grid.style.height   = (gridBot - gridTop) + 'px';
    grid.style.left     = '0';
    grid.style.width    = '100%';

    // 三行文字各自对齐下三行（行3-5）
    for (let i = 0; i < 3; i++) {
      const lr = leftRows[i + 3];
      const top = lr.getBoundingClientRect().top - leftRect.top;
      const h   = lr.getBoundingClientRect().height;
      const el  = rightTextRows[i];
      el.style.position  = 'absolute';
      el.style.top       = top + 'px';
      el.style.height    = h + 'px';
      el.style.left      = '0';
      el.style.width     = '100%';
      el.style.display   = 'flex';
      el.style.alignItems    = 'center';
      el.style.justifyContent = 'center';
    }
  }

  syncLayout();
  window.addEventListener('resize', syncLayout);
})();
