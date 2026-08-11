/* ============================================================
   右侧区域 — 时间卡片：农历、时辰、点阵轮播
   同时驱动 Home 和 Intro 两个时间卡片
   ============================================================ */
(function () {
  'use strict';

  /* ── 十二时辰 ──────────────────────────────────────────── */
  const SHI_CHEN = [
    '子时','丑时','寅时','卯时','辰时','巳时',
    '午时','未时','申时','酉时','戌时','亥时'
  ];
  function shichen(h) { return SHI_CHEN[((h + 1) % 24) >> 1]; }

  /* ── 星座 ──────────────────────────────────────────────── */
  const ZODIAC = [
    { en: 'Capricorn', cn: '摩羯座', end: [1, 19] },
    { en: 'Aquarius',  cn: '水瓶座', end: [2, 18] },
    { en: 'Pisces',    cn: '双鱼座', end: [3, 20] },
    { en: 'Aries',     cn: '白羊座', end: [4, 19] },
    { en: 'Taurus',    cn: '金牛座', end: [5, 20] },
    { en: 'Gemini',    cn: '双子座', end: [6, 20] },
    { en: 'Cancer',    cn: '巨蟹座', end: [7, 22] },
    { en: 'Leo',       cn: '狮子座', end: [8, 22] },
    { en: 'Virgo',     cn: '处女座', end: [9, 22] },
    { en: 'Libra',     cn: '天秤座', end: [10, 22] },
    { en: 'Scorpio',   cn: '天蝎座', end: [11, 21] },
    { en: 'Sagittarius', cn: '射手座', end: [12, 21] },
    { en: 'Capricorn', cn: '摩羯座', end: [12, 31] },
  ];
  function zodiacSign(m, d) {
    for (const z of ZODIAC)
      if (m < z.end[0] || (m === z.end[0] && d <= z.end[1]))
        return z.cn + '\u3000' + z.en;
    return '';
  }

  /* ── 生肖 ──────────────────────────────────────────────── */
  const SHENGXIAO = ['鼠年','牛年','虎年','兔年','龙年','蛇年','马年','羊年','猴年','鸡年','狗年','猪年'];
  function shengxiao(y) { return SHENGXIAO[(y - 4) % 12]; }

  /* ── 农历 — 2026-2027 查表法（2026 年闰六月） ──────────── */
  const LUNAR_DATA = {
    2026: {
      yearName: '丙午年',
      cny: new Date(2026, 1, 17),
      months: [30, 29, 30, 29, 30, 29, 30, 30, 29, 30, 29, 30, 29],
      leapMonth: 6,
    },
    2027: {
      yearName: '丁未年',
      cny: new Date(2027, 1, 6),
      months: [30, 29, 30, 29, 30, 30, 29, 30, 29, 30, 29, 30],
      leapMonth: 0,
    },
  };

  const LUNAR_MONTH_NAMES = ['正月','二月','三月','四月','五月','六月',
    '七月','八月','九月','十月','十一月','十二月'];

  function lunarDate(d) {
    let y = d.getFullYear();
    let data = LUNAR_DATA[y];
    if (!data) {
      if (y >= 2027) { data = LUNAR_DATA[2027]; y = 2027; }
      else { data = LUNAR_DATA[2026]; y = 2026; }
    }
    let days = Math.floor((d - data.cny) / 86400000);
    if (days < 0) {
      const prev = LUNAR_DATA[y - 1];
      if (prev) {
        days = Math.floor((d - prev.cny) / 86400000);
        data = prev; y = y - 1;
      }
    }
    if (days < 0) return { text: '', yearName: '' };

    let monthIdx = 0;
    for (let i = 0; i < data.months.length; i++) {
      const len = data.months[i];
      if (days < len) { monthIdx = i; break; }
      days -= len;
    }
    const dayNum = days + 1;
    let monthName;
    if (data.leapMonth && monthIdx > data.leapMonth) {
      monthName = LUNAR_MONTH_NAMES[monthIdx - 1] || '';
    } else if (data.leapMonth && monthIdx === data.leapMonth) {
      monthName = '闰' + (LUNAR_MONTH_NAMES[data.leapMonth - 1] || '');
    } else {
      monthName = LUNAR_MONTH_NAMES[monthIdx] || '';
    }
    const CN_NUMS = ['','一','二','三','四','五','六','七','八','九','十',
      '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
      '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
    return {
      text: data.yearName + monthName + (CN_NUMS[dayNum] || dayNum),
      yearName: data.yearName,
    };
  }

  /* ── 年内天数 ──────────────────────────────────────────── */
  function dayOfYear(d) {
    const start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - start) / 86400000);
  }
  function daysInYear(y) {
    return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0) ? 366 : 365;
  }

  /* ── 五个比例模式 ──────────────────────────────────────── */
  const MODES = ['YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE'];
  const MODE_TO_HL_CLASS = {
    YEAR:   'hl-year',
    MONTH:  'hl-month',
    DAY:    'hl-day',
    HOUR:   'hl-hour',
    MINUTE: 'hl-min',
  };

  const WEEKDAYS_CN = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
  function pad(n) { return String(n).padStart(2, '0'); }

  /* ══════════════════════════════════════════════════════════════
     创建单个时间 Widget 实例
     ══════════════════════════════════════════════════════════════ */
  function createTimeWidget(prefix) {
    const el = {
      clock:       document.getElementById(prefix + 'clock'),
      shichen:     document.getElementById(prefix + 'shichen'),
      row1:        document.getElementById(prefix + 'ti-row1'),
      row2:        document.getElementById(prefix + 'ti-row2'),
      row4:        document.getElementById(prefix + 'ti-row4'),
      row5:        document.getElementById(prefix + 'ti-row5'),
      row6:        document.getElementById(prefix + 'ti-row6'),
      dotGrid:     document.getElementById(prefix + 'dot-grid'),
    };
    if (!el.dotGrid) return null;

    /* 构建持久化高亮 span 结构 */
    el.clock.innerHTML =
      '<span class="hl-text hl-hour"></span>:' +
      '<span class="hl-text hl-min"></span>:' +
      '<span class="hl-sec"></span>';

    el.row2.innerHTML =
      '<span><span class="hl-text hl-year"></span>/<span class="hl-text hl-month"></span>/<span class="hl-text hl-day"></span></span><span class="hl-wday"></span>';

    const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetHours = -(new Date().getTimezoneOffset() / 60);
    const gmtStr = 'GMT' + (offsetHours >= 0 ? '+' : '') + offsetHours;
    el.row1.innerHTML = '<span>' + gmtStr + '</span><span>' + tzName + '</span>';

    /* 构建点阵（14×12 = 168 个圆点） */
    const TOTAL_DOTS = 168;
    const dots = [];
    for (let i = 0; i < TOTAL_DOTS; i++) {
      const dot = document.createElement('span');
      dot.className = 'dot';
      el.dotGrid.appendChild(dot);
      dots.push(dot);
    }

    let prevFilled = 0;

    function fillDots(count) {
      const COLS = 14, ROWS = 12;
      const fullRows = Math.floor(count / COLS);
      const partial  = count % COLS;
      for (let i = 0; i < TOTAL_DOTS; i++) {
        const row = Math.floor(i / COLS);
        const col = i % COLS;
        const fromBottom = (ROWS - 1) - row;
        const active = fromBottom < fullRows || (fromBottom === fullRows && col < partial);
        dots[i].classList.toggle('filled', active);
      }
    }

    function pulseLatest() {
      const indices = [];
      for (let i = TOTAL_DOTS - 1; i >= 0 && indices.length < 8; i--)
        if (dots[i].classList.contains('filled')) indices.push(i);
      indices.forEach(idx => dots[idx].classList.add('pulse'));
      setTimeout(() => indices.forEach(idx => dots[idx].classList.remove('pulse')), 320);
    }

    function updateDotGrid(ratio) {
      const filled = Math.round(ratio * TOTAL_DOTS);
      if (filled !== prevFilled && prevFilled > 0) pulseLatest();
      fillDots(filled);
      prevFilled = filled;
    }

    function updateInfo(now, lunarD, zParts, doy, totalDays) {
      el.clock.querySelector('.hl-hour').textContent = pad(now.getHours());
      el.clock.querySelector('.hl-min').textContent   = pad(now.getMinutes());
      el.clock.querySelector('.hl-sec').textContent   = pad(now.getSeconds());
      el.shichen.textContent = shichen(now.getHours());

      el.row2.querySelector('.hl-year').textContent  = '' + now.getFullYear();
      el.row2.querySelector('.hl-month').textContent = pad(now.getMonth() + 1);
      el.row2.querySelector('.hl-day').textContent   = pad(now.getDate());
      el.row2.querySelector('.hl-wday').textContent  = WEEKDAYS_CN[now.getDay()];

      el.row4.innerHTML = '<span>' + lunarD.text + '</span><span>' + shengxiao(now.getFullYear()) + '</span>';
      el.row5.innerHTML = '<span>' + (zParts[0] || '') + '</span><span>' + (zParts[1] || '') + '</span>';

      const pct = ((doy / totalDays) * 100).toFixed(1);
      el.row6.innerHTML = '<span>今年第' + doy + '天</span><span>已过' + pct + '%</span>';
    }

    return { el, dots, updateDotGrid, updateInfo,
      setOpacity: function(v) { el.dotGrid.style.opacity = v; } };
  }

  /* ══════════════════════════════════════════════════════════════
     初始化 Home 和 Intro 两个 Widget 实例
     ══════════════════════════════════════════════════════════════ */
  const homeW  = createTimeWidget('');
  const introW = createTimeWidget('intro-');
  const widgets = [homeW, introW].filter(Boolean);
  if (widgets.length === 0) return;

  let modeIndex = 0;
  let lastSecond = -1;

  function getRatio(now) {
    switch (MODES[modeIndex]) {
      case 'YEAR':  return dayOfYear(now) / daysInYear(now.getFullYear());
      case 'MONTH': return now.getDate() / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      case 'DAY':   return (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400;
      case 'HOUR':  return (now.getMinutes() * 60 + now.getSeconds()) / 3600;
      case 'MINUTE':return now.getSeconds() / 60;
      default:      return 0;
    }
  }

  function syncHighlight() {
    document.querySelectorAll('.time-info .hl-text').forEach(function(el) {
      el.classList.remove('highlight');
    });
    const cls = MODE_TO_HL_CLASS[MODES[modeIndex]];
    if (cls) {
      document.querySelectorAll('.' + cls).forEach(function(el) {
        el.classList.add('highlight');
      });
    }
  }

  function tick() {
    const now = new Date();

    /* 计算一次共享数据 */
    const lunarD = lunarDate(now);
    const zStr = zodiacSign(now.getMonth() + 1, now.getDate());
    const zParts = zStr.split('\u3000');
    const doy = dayOfYear(now);
    const totalDays = daysInYear(now.getFullYear());

    /* 更新所有 Widget 的文字信息 */
    widgets.forEach(function(w) {
      w.updateInfo(now, lunarD, zParts, doy, totalDays);
    });

    /* 每秒更新一次点阵 */
    if (now.getSeconds() !== lastSecond) {
      lastSecond = now.getSeconds();
      const ratio = getRatio(now);
      widgets.forEach(function(w) { w.updateDotGrid(ratio); });
    }

    syncHighlight();
  }

  function switchMode() {
    widgets.forEach(function(w) { w.setOpacity('0'); });
    setTimeout(function() {
      modeIndex = (modeIndex + 1) % MODES.length;
      tick();
      syncHighlight();
      widgets.forEach(function(w) { w.setOpacity('1'); });
    }, 500);
  }

  tick();
  syncHighlight();
  setInterval(tick, 250);
  setInterval(switchMode, 4000);

})();
