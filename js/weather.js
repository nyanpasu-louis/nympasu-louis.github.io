/* ============================================================
   天气 Widget — 同时驱动 Home 和 Intro 两个天气卡片
   ============================================================ */
(function () {
  'use strict';

  /* ── 常量 ────────────────────────────────────────────────── */
  const DEFAULT_LAT = 39.9042;
  const DEFAULT_LON = 116.4074;
  const DOT_COLS = 14;
  const DOT_ROWS = 12;
  const TOTAL_DOTS = DOT_COLS * DOT_ROWS;
  const MODES      = ['TEMP', 'HUMI', 'UV', 'AQI', 'MOON'];
  const MODE_CLASS = { TEMP: 'hl-temp', HUMI: 'hl-humi', UV: 'hl-uv', AQI: 'hl-aqi', MOON: 'hl-moon' };
  const WIND_ARROWS = ['\u2191', '\u2197', '\u2192', '\u2198', '\u2193', '\u2199', '\u2190', '\u2196'];
  const MAX_DATA_AGE = 600_000; // 10 分钟

  /* ── 状态 ────────────────────────────────────────────────── */
  let lat = DEFAULT_LAT;
  let lon = DEFAULT_LON;
  let weatherData = null;
  let modeIndex   = 0;

  /* ══════════════════════════════════════════════════════════════
     创建单个天气 Widget 实例
     ══════════════════════════════════════════════════════════════ */
  function createWeatherWidget(prefix) {
    const dotGrid = document.getElementById(prefix + 'weather-dot-grid');
    const weRow1  = document.getElementById(prefix + 'we-row1');
    const weRow2  = document.getElementById(prefix + 'we-row2');
    const weRow3  = document.getElementById(prefix + 'we-row3');
    const weRow4  = document.getElementById(prefix + 'we-row4');
    const weRow5  = document.getElementById(prefix + 'we-row5');
    const weRow6  = document.getElementById(prefix + 'we-row6');
    if (!dotGrid) return null;

    /* 构建点阵 */
    const dots = [];
    for (let i = 0; i < TOTAL_DOTS; i++) {
      const dot = document.createElement('span');
      dot.className = 'dot';
      dotGrid.appendChild(dot);
      dots.push(dot);
    }

    let prevFilled = 0;

    function fillDots(count) {
      const fullRows = Math.floor(count / DOT_COLS);
      const partial  = count % DOT_COLS;
      for (let i = 0; i < TOTAL_DOTS; i++) {
        const row = Math.floor(i / DOT_COLS);
        const col = i % DOT_COLS;
        const fromBottom = (DOT_ROWS - 1) - row;
        const active = fromBottom < fullRows || (fromBottom === fullRows && col < partial);
        dots[i].classList.toggle('filled', active);
      }
    }

    function pulseLatest() {
      const indices = [];
      for (let i = TOTAL_DOTS - 1; i >= 0 && indices.length < 6; i--)
        if (dots[i].classList.contains('filled')) indices.push(i);
      indices.forEach(function(idx) { dots[idx].classList.add('pulse'); });
      setTimeout(function() {
        indices.forEach(function(idx) { dots[idx].classList.remove('pulse'); });
      }, 320);
    }

    function updateDotGrid(ratio) {
      const filled = Math.round(ratio * TOTAL_DOTS);
      if (filled !== prevFilled && prevFilled > 0) pulseLatest();
      fillDots(filled);
      prevFilled = filled;
    }

    function showPlaceholder() {
      weRow1.style.display = 'none';
      weRow3.style.display = 'none';
      weRow4.style.display = 'none';
      weRow5.style.display = 'none';
      weRow6.style.display = 'none';
      dotGrid.style.display = 'none';
      weRow2.textContent = '\u83b7\u53d6\u4f4d\u7f6e\u4e2d\u55b5';
      weRow2.style.display = 'flex';
      weRow2.style.justifyContent = 'center';
      weRow2.style.alignItems = 'center';
      weRow2.style.height = '100%';
      var infoEl = document.getElementById(prefix + 'weather-info');
      if (infoEl) infoEl.classList.add('loading');
    }

    function updateUI(data, aqiData) {
      var cur = data.current;
      var daily = data.daily;
      if (!cur || !daily) return;

      weRow1.style.display = '';
      weRow3.style.display = '';
      weRow4.style.display = '';
      weRow5.style.display = '';
      weRow6.style.display = '';
      dotGrid.style.display = '';
      var infoEl = document.getElementById(prefix + 'weather-info');
      if (infoEl) infoEl.classList.remove('loading');
      weRow2.style.justifyContent = '';
      weRow2.style.alignItems = '';
      weRow2.style.height = '';

      var temp     = cur.temperature_2m;
      var humidity = cur.relative_humidity_2m;
      var pressure = cur.pressure_msl;
      var windDeg  = cur.wind_direction_10m;
      var windSpd  = cur.wind_speed_10m;
      var isDay    = cur.is_day;
      var now      = new Date();
      var uv       = daily.uv_index_max[0];
      var sunset   = daily.sunset[0];
      var sunrise  = daily.sunrise[0];

      weRow1.innerHTML =
        '<span class="hl-text hl-temp">' + Math.round(temp) + '\u00b0C</span>' +
        '<span class="hl-text hl-humi">\u6e7f\u5ea6 ' + Math.round(humidity) + '%</span>';

      weRow2.innerHTML =
        '<span class="hl-text hl-uv">UV ' + uvLabel(uv) + '(' + uv + ')</span>' +
        '<span>' + windArrow(windDeg) + ' ' + windLevel(windSpd) + '\u7ea7</span>';

      var sunriseStr = sunrise ? sunrise.slice(11, 16) : '--:--';
      var sunsetStr  = sunset  ? sunset.slice(11, 16)  : '--:--';
      var dayNightStr = isDay
        ? '\u2193 ' + sunsetStr
        : '\u2191 ' + sunriseStr;

      weRow3.innerHTML =
        '<span>' + Math.round(pressure) + ' hPa</span>' +
        '<span>' + dayNightStr + '</span>';

      var aqiVal = aqiData && aqiData.current
        ? aqiData.current.european_aqi : null;
      weRow4.innerHTML =
        '<span class="hl-text hl-aqi">AQI ' + (aqiVal !== null ? Math.round(aqiVal) : '--') + '</span>' +
        '<span>' + (aqiVal !== null ? aqiLabel(aqiVal) : '\u65e0\u6570\u636e') + '</span>';

      var visibility = data.hourly && data.hourly.visibility
        ? data.hourly.visibility[now.getHours()] : null;
      var visStr = visibility !== null
        ? (visibility >= 1000 ? (visibility / 1000).toFixed(1) + ' km' : Math.round(visibility) + ' m')
        : '--';
      weRow5.innerHTML =
        '<span class="hl-text hl-moon">' + moonPhase(now) + '</span>' +
        '<span>\u80fd\u89c1\u5ea6 ' + visStr + '</span>';

      var precipProb = daily.precipitation_probability_max
        ? daily.precipitation_probability_max[0] : null;
      weRow6.innerHTML =
        '<span>\u964d\u6c34 ' + (precipProb !== null ? precipProb + '%' : '--') + '</span>' +
        '<span>' + weatherAlert(cur, daily) + '</span>';
    }

    function setOpacity(v) { dotGrid.style.opacity = v; }

    return { dotGrid: dotGrid, updateDotGrid: updateDotGrid, updateUI: updateUI,
      showPlaceholder: showPlaceholder, setOpacity: setOpacity };
  }

  /* ══════════════════════════════════════════════════════════════
     初始化 Home 和 Intro 两个 Widget 实例
     ══════════════════════════════════════════════════════════════ */
  var homeW  = createWeatherWidget('');
  var introW = createWeatherWidget('intro-');
  var widgets = [homeW, introW].filter(Boolean);
  if (widgets.length === 0) return;

  /* ── 共享工具函数 ──────────────────────────────────────── */
  function windArrow(deg) {
    var idx = Math.round(deg / 45) % 8;
    return WIND_ARROWS[idx];
  }

  function uvLabel(index) {
    if (index <= 2)  return '\u5f31';
    if (index <= 5)  return '\u4e2d';
    if (index <= 7)  return '\u8f83\u5f3a';
    if (index <= 10) return '\u5f3a';
    return '\u6781\u5f3a';
  }

  function windLevel(speedKmh) {
    if (speedKmh < 1)   return 0;
    if (speedKmh <= 5)  return 1;
    if (speedKmh <= 11) return 2;
    if (speedKmh <= 19) return 3;
    if (speedKmh <= 28) return 4;
    if (speedKmh <= 38) return 5;
    if (speedKmh <= 49) return 6;
    if (speedKmh <= 61) return 7;
    if (speedKmh <= 74) return 8;
    if (speedKmh <= 88) return 9;
    if (speedKmh <= 102) return 10;
    if (speedKmh <= 117) return 11;
    return 12;
  }

  function moonPhase(date) {
    var KNOWN_NEW_MOON = 2451550.26;
    var y = date.getUTCFullYear();
    var m = date.getUTCMonth() + 1;
    var d = date.getUTCDate();
    var a = Math.floor((14 - m) / 12);
    var y2 = y + 4800 - a;
    var m2 = m + 12 * a - 3;
    var jd = d + Math.floor((153 * m2 + 2) / 5) + 365 * y2
      + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400)
      - 32045 + (date.getUTCHours() - 12) / 24;
    var days = jd - KNOWN_NEW_MOON;
    var phase = ((days % 29.53058867) + 29.53058867) % 29.53058867;
    var idx = Math.round((phase / 29.53058867) * 8) % 8;
    var PHASES = ['\u65b0\u6708', '\u86fe\u7709\u6708', '\u4e0a\u5f26\u6708', '\u76c8\u51f8\u6708', '\u6ee1\u6708', '\u4e8f\u51f8\u6708', '\u4e0b\u5f26\u6708', '\u6b8b\u6708'];
    return PHASES[idx];
  }

  function aqiLabel(aqi) {
    if (aqi <= 50)  return '\u4f18';
    if (aqi <= 100) return '\u826f';
    if (aqi <= 150)  return '\u8f7b\u5ea6\u6c61\u67d3';
    if (aqi <= 200)  return '\u4e2d\u5ea6\u6c61\u67d3';
    if (aqi <= 300) return '\u91cd\u5ea6\u6c61\u67d3';
    return '\u4e25\u91cd\u6c61\u67d3';
  }

  function weatherAlert(cur, daily) {
    var alerts = [];
    var temp = cur.temperature_2m;
    var windSpd = cur.wind_speed_10m;
    var uv = daily.uv_index_max ? daily.uv_index_max[0] : 0;
    if (temp >= 38) alerts.push('\u9ad8\u6e29');
    if (temp <= -15) alerts.push('\u4e25\u5bd2');
    if (windSpd >= 50) alerts.push('\u5927\u98ce');
    if (uv >= 8) alerts.push('\u5f3a\u7d2b\u5916\u7ebf');
    return alerts.length > 0 ? alerts.join('\u00b7') : '\u65e0\u9884\u8b66';
  }

  /* ── 获取天气数据 ──────────────────────────────────────── */
  async function fetchWeather(latP, lonP) {
    var weatherUrl =
      'https://api.open-meteo.com/v1/forecast' +
      '?latitude='  + latP +
      '&longitude=' + lonP +
      '&current=temperature_2m,relative_humidity_2m,is_day,pressure_msl,wind_direction_10m,wind_speed_10m' +
      '&hourly=visibility' +
      '&daily=sunrise,sunset,uv_index_max,precipitation_probability_max' +
      '&timezone=auto&forecast_days=1';

    var aqiUrl =
      'https://air-quality-api.open-meteo.com/v1/air-quality' +
      '?latitude='  + latP +
      '&longitude=' + lonP +
      '&current=european_aqi';

    try {
      var responses = await Promise.all([
        fetch(weatherUrl),
        fetch(aqiUrl).catch(function() { return null; })
      ]);
      if (!responses[0].ok) throw new Error('HTTP ' + responses[0].status);
      var data = await responses[0].json();
      var aqiData = null;
      if (responses[1] && responses[1].ok) {
        aqiData = await responses[1].json();
      }
      weatherData = { main: data, aqi: aqiData };
      updateAllUI();
      return data;
    } catch (e) {
      console.warn('[Weather] \u83b7\u53d6\u5929\u6c14\u5931\u8d25\uff0c\u4f7f\u7528\u7f13\u5b58\u6570\u636e', e);
      return null;
    }
  }

  function updateAllUI() {
    if (!weatherData) return;
    var data = weatherData.main;
    var aqiData = weatherData.aqi;
    widgets.forEach(function(w) { w.updateUI(data, aqiData); });
  }

  /* ── 定位 ────────────────────────────────────────────────── */
  function initLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(pos) {
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          fetchWeather(lat, lon);
        },
        function() { fetchWeather(DEFAULT_LAT, DEFAULT_LON); },
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      fetchWeather(DEFAULT_LAT, DEFAULT_LON);
    }
  }

  /* ── 高亮联动 ──────────────────────────────────────────── */
  function syncHighlight() {
    document.querySelectorAll('.hl-text').forEach(function(el) {
      el.classList.remove('highlight');
    });
    var cls = MODE_CLASS[MODES[modeIndex]];
    if (cls) {
      document.querySelectorAll('.' + cls).forEach(function(el) {
        el.classList.add('highlight');
      });
    }
  }

  /* ── 模式轮播 ──────────────────────────────────────────── */
  function switchMode() {
    widgets.forEach(function(w) { w.setOpacity('0'); });
    setTimeout(function() {
      modeIndex = (modeIndex + 1) % MODES.length;
      if (weatherData) {
        var data = weatherData.main;
        var cur = data.current;
        if (cur) {
          var temp = cur.temperature_2m;
          var humidity = cur.relative_humidity_2m;
          var now = new Date();
          var aqiData = weatherData.aqi;
          var aqiVal = (aqiData && aqiData.current) ? aqiData.current.european_aqi : 0;
          var KNOWN_NEW_MOON = 2451550.26;
          var y = now.getUTCFullYear(), m = now.getUTCMonth() + 1, d = now.getUTCDate();
          var a = Math.floor((14 - m) / 12);
          var y2 = y + 4800 - a, m2 = m + 12 * a - 3;
          var jd = d + Math.floor((153 * m2 + 2) / 5) + 365 * y2
            + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400)
            - 32045 + (now.getUTCHours() - 12) / 24;
          var days = jd - KNOWN_NEW_MOON;
          var phase = ((days % 29.53058867) + 29.53058867) % 29.53058867;
          var daily = data.daily;
          var uv = (daily && daily.uv_index_max) ? daily.uv_index_max[0] : 0;
          var ratio = 0;
          switch (MODES[modeIndex]) {
            case 'TEMP':  ratio = Math.max(0, Math.min(1, (temp + 30) / 80)); break;
            case 'HUMI':  ratio = Math.max(0, Math.min(1, humidity / 100)); break;
            case 'UV':    ratio = Math.max(0, Math.min(1, uv / 15)); break;
            case 'AQI':   ratio = Math.max(0, Math.min(1, aqiVal / 500)); break;
            case 'MOON':  ratio = phase / 29.53058867; break;
          }
          widgets.forEach(function(w) { w.updateDotGrid(ratio); });
        }
      }
      syncHighlight();
      widgets.forEach(function(w) { w.setOpacity('1'); });
    }, 500);
  }

  /* ── 启动 ────────────────────────────────────────────────── */
  widgets.forEach(function(w) { w.showPlaceholder(); });
  initLocation();

  setInterval(function() { fetchWeather(lat, lon); }, MAX_DATA_AGE);
  setInterval(switchMode, 4000);
})();
