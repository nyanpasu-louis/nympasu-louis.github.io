/* ============================================================
   Terminal 面板 — 内联输入，命令解析、历史、Tab 补全
   ============================================================ */
(function () {
  'use strict';

  const panel   = document.getElementById('terminal-panel');
  const output  = document.getElementById('terminal-output');
  if (!panel || !output) return;

  /* ── 内部状态 ─────────────────────── */
  let history    = [];
  let histCursor = -1;
  let activeInput = null;
  let pendingW    = '';

  /* ═══════════════════════════════════════════
     命令注册
     ═══════════════════════════════════════════ */
  const cmds = {};

  function reg(name, desc, usage, fn) { cmds[name] = { desc, usage, fn }; }

  reg('help', '显示所有可用命令', 'help [command]', (args) => {
    if (args[0] && cmds[args[0]]) {
      const c = cmds[args[0]];
      print('', '');
      print('  ' + args[0] + ' — ' + c.desc, 'term-line-info');
      print('  用法: ' + c.usage, 'term-line-dim');
      print('', '');
    } else if (args[0]) {
      print('未知命令: ' + args[0], 'term-line-error');
    } else {
      print('', '');
      print('═══════ 可用命令 ═══════', 'term-line-info');
      const keys = Object.keys(cmds).sort();
      for (const k of keys) {
        const c = cmds[k];
        print('  <span class="term-line-info">' + k.padEnd(10) + '</span> ' + c.desc, 'term-line-output');
      }
      print('', '');
    }
  });

  reg('clear', '清空终端屏幕', 'clear', () => {
    output.innerHTML = '';
    appendPrompt();
  });


  reg('date', '显示当前日期和时间', 'date', () => {
    const d = new Date();
    const y = d.getFullYear();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // 星期
    const weekdays = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];

    // 农历（使用 Intl Chinese calendar）
    let lunarStr = '(农历不可用)';
    try {
      const lunar = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
        year: 'numeric', month: 'numeric', day: 'numeric'
      }).formatToParts(d);
      const parts = {};
      lunar.forEach(p => { if (p.type !== 'literal') parts[p.type] = p.value; });
      const lMonth = parseInt(parts.month);
      const lDay = parseInt(parts.day);
      const lMonths = ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月'];
      lunarStr = lMonths[lMonth-1] + '初' + ['一','二','三','四','五','六','七','八','九','十',
        '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
        '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'][lDay-1];
    } catch(_) {}

    // 生肖
    const zodiac = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
    const zodiacYear = zodiac[(y - 4) % 12];

    // 星座
    const m = d.getMonth() + 1, day = d.getDate();
    const signs = ['摩羯','水瓶','双鱼','白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手'];
    const cutoffs = [20,19,21,20,21,22,23,23,23,24,23,22];
    const sign = day <= cutoffs[m-1] ? signs[m-1] : signs[m % 12];

    // 年内第几天
    const start = new Date(y, 0, 0);
    const dayOfYear = Math.floor((d - start) / 86400000);

    print('', '');
    print('时区:      ' + tz, 'term-line-output');
    print('日期:      ' + y + '年' + (m) + '月' + day + '日  ' + weekdays[d.getDay()], 'term-line-output');
    print('时间:      ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0') + ':' + String(d.getSeconds()).padStart(2,'0'), 'term-line-output');
    print('农历:      ' + lunarStr + '　生肖: ' + zodiacYear + '年', 'term-line-output');
    print('星座:      ' + sign + '座　年内第 ' + dayOfYear + ' 天', 'term-line-output');
    print('', '');
  });


  reg('neofetch', '显示系统信息', 'neofetch', () => {
    // 点阵字体 "NYMPASU LOUIS" — 每字符 5 列, 7 行
    const font = {
      'N': [0b10001,0b11001,0b10101,0b10011,0b10001,0b10001,0b10001],
      'Y': [0b10001,0b10001,0b01010,0b00100,0b00100,0b00100,0b00100],
      'M': [0b10001,0b11011,0b10101,0b10101,0b10001,0b10001,0b10001],
      'P': [0b11110,0b10001,0b10001,0b11110,0b10000,0b10000,0b10000],
      'A': [0b01110,0b10001,0b10001,0b11111,0b10001,0b10001,0b10001],
      'S': [0b01110,0b10001,0b10000,0b01110,0b00001,0b10001,0b01110],
      'U': [0b10001,0b10001,0b10001,0b10001,0b10001,0b10001,0b01110],
      ' ': [0,0,0,0,0,0,0],
      'L': [0b10000,0b10000,0b10000,0b10000,0b10000,0b10000,0b11111],
      'O': [0b01110,0b10001,0b10001,0b10001,0b10001,0b10001,0b01110],
      'I': [0b01110,0b00100,0b00100,0b00100,0b00100,0b00100,0b01110],
    };
    const text = 'NYMPASU LOUIS';
    const rows = ['','','','','','',''];
    for (const ch of text) {
      const bm = font[ch] || [0,0,0,0,0,0,0];
      for (let r = 0; r < 7; r++) {
        let rowStr = '';
        for (let c = 4; c >= 0; c--) {
          rowStr += (bm[r] & (1 << c)) ? '██' : '  ';
        }
        rows[r] += rowStr + ' ';
      }
    }
    print('', '');
    for (const row of rows) print(row, 'term-line-info');
    print('', '');
    print('  Webpage   nyanpasu-louis.github.io', 'term-line-output');
    print('  Host      nyanpasu-louis', 'term-line-output');
    print('  Kernel    Github Pages', 'term-line-output');
    print('  Uptime    22 years', 'term-line-output');
    print('  Location  Beijing, CN', 'term-line-output');
    print('', '');
  });


  reg('history', '显示命令历史', 'history', (args) => {
    if (history.length === 0) {
      print('(无历史记录)', 'term-line-dim');
      return;
    }
    const n = parseInt(args[0]) || history.length;
    const start = Math.max(0, history.length - n);
    for (let i = start; i < history.length; i++) {
      print('  ' + String(i+1).padStart(4) + '  ' + history[i], 'term-line-dim');
    }
  });

  reg('profiles', '显示社媒链接', 'profiles', () => {
    print('', '');
    print('<span class="term-line-info">Email</span>     3040708497@qq.com', 'term-line-output');
    print('<span class="term-line-info">GitHub</span>    https://github.com/nyanpasu-louis', 'term-line-output');
    print('<span class="term-line-info">Rednote</span>    https://xhslink.cn/m/yJCDUwVan ; https://xhslink.cn/m/7eSQzpXmZZY', 'term-line-output');
    print('<span class="term-line-info">Bilibili</span>     https://b23.tv/HN7bvwu', 'term-line-output');
    print('<span class="term-line-info">LOFTER</span>    https://jrlouis.lofter.com', 'term-line-output');
    print('<span class="term-line-info">Netease Music</span>    https://y.music.163.com/m/user?id=3293246882', 'term-line-output');
    print('<span class="term-line-info">Youtube</span>     https://www.youtube.com/@JaronLouis-v5u', 'term-line-output');
    print('<span class="term-line-info">Steam</span>    https://steamcommunity.com/profiles/76561199223823513/', 'term-line-output');
    print('<span class="term-line-info">Paradox Mods</span>    https://mods.paradoxplaza.com/authors/JaronLouis', 'term-line-output');
    print('', '');
  });

  reg('theme', '显示当前主题色值', 'theme', () => {
    const style = getComputedStyle(document.documentElement);
    const vars = [
      ['--md-sys-color-background',        'background      '],
      ['--md-sys-color-surface-container', 'surface-container'],
      ['--md-sys-color-primary',           'primary         '],
      ['--md-sys-color-on-surface',        'on-surface      '],
      ['--md-sys-color-text-secondary',    'text-secondary  '],
      ['--md-sys-color-hello-text',        'hello-text      '],
    ];
    print('', '');
    print('当前主题色值:', 'term-line-info');
    for (const [v, label] of vars) {
      const hex = style.getPropertyValue(v).trim();
      print('  ' + label + '  ' + hex, 'term-line-output');
    }
    print('', '');
    print('切换主题请在 Option 页面操作', 'term-line-dim');
    print('', '');
  });

  reg('motd', '随机显示语录', 'motd', () => {
    const quotes = [
      
      '我们仍要对植物人实行人道主义的理由何在?我想，那是因为我们记得:每一个植物人在成为植物人之前都是骄傲的可敬可爱的堂堂正正的人。正因为我们深刻地记得这一点，我们才不能容忍他们有朝一日像一株株植物似的任人摆布而丧失尊严。——史铁生',
      '我们的教条主义者是懒汉，他们拒绝对于具体事物得去做任何艰苦的研究工作，他们把一般真理看成是凭空出现的东西，把它变成人们所不能够捉摸的纯粹抽象的公式，完全否认了并且颠倒了人类认识真理的正常秩序。他们也不懂得人类认识的两个过程的互相联结——由特殊到一般，又由一般到特殊，他们完全不懂得马克思主义的认识论。——毛泽东',
      '长城和金字塔都是完全失败的超级工程，前者没能挡住北方骑马民族的入侵，后者也没能使其中的法老木乃伊复活，但时间使这些都无关紧要，只有凝结于其上的人类精神永远光彩照人！——《地球大炮》',
      '科幻小说经常描述人类将形成一个和谐的整体，我相信这一天的到来不需要等待外星文明的出现。 ——刘慈欣',
      'And the universe said you are the universe tasting itself, talking to itself, reading its own code. And the universe said I love you because you are love. ——《终末之诗》',
    ];
    print('', '');
    print('  “' + quotes[Math.floor(Math.random() * quotes.length)] + '”', 'term-line-output');
    print('', '');
  });

  /* ═══════════════════════════════════════════
     命令别名
     ═══════════════════════════════════════════ */
  const aliases = {
    '?': 'help', 'h': 'help',
    'cls': 'clear',
    'time': 'date',
    'neofetch': 'neofetch'
  };

  /* ═══════════════════════════════════════════
     输出辅助
     ═══════════════════════════════════════════ */
  function print(html, cls) {
    const div = document.createElement('div');
    if (cls) div.className = 'term-line ' + cls;
    else div.className = 'term-line';
    div.innerHTML = html;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  }

  function createPromptLine() {
    const line = document.createElement('div');
    line.className = 'term-prompt-line';

    const span = document.createElement('span');
    span.className = 'term-prompt-inline';
    span.textContent = 'root@Louis\'s Bestie:~$';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'term-input-inline';
    input.spellcheck = false;
    input.autocomplete = 'off';

    line.appendChild(span);
    line.appendChild(input);
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;

    return { line, input };
  }

  function appendPrompt() {
    if (activeInput && activeInput.input) {
      activeInput.input.disabled = true;
      activeInput.input.style.pointerEvents = 'none';
    }
    const { line, input } = createPromptLine();
    activeInput = { line, input };
    input.focus();
    bindInput(input);
  }

  /* ═══════════════════════════════════════════
     命令执行
     ═══════════════════════════════════════════ */
  function run(raw) {
    const trimmed = raw.trim();
    if (!trimmed) { appendPrompt(); return; }

    history.push(trimmed);
    histCursor = history.length;

    // 将当前输入行转为静态文本
    if (activeInput) {
      activeInput.line.textContent = 'root@Louis\'s Bestie:~$ ' + trimmed;
      activeInput.line.className = 'term-line term-line-input';
      activeInput.input = null;
    }

    // 解析命令
    const parts = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const argv = parts.map(p => p.replace(/^"|"$/g, ''));
    const cmdName = argv[0].toLowerCase();
    const args = argv.slice(1);

    const resolved = aliases[cmdName] || cmdName;

    const cmd = cmds[resolved];
    if (cmd) {
      cmd.fn(args);
    } else {
      print('zsh: command not found: ' + cmdName, 'term-line-error');
    }

    appendPrompt();
    try { localStorage.setItem('term_history', JSON.stringify(history)); } catch (_) {}
  }

  /* ═══════════════════════════════════════════
     Tab 补全
     ═══════════════════════════════════════════ */
  function complete(inp, inputVal) {
    const allNames = Object.keys(cmds).concat(Object.keys(aliases));
    const unique   = [...new Set(allNames)].sort();
    const matches  = unique.filter(c => c.startsWith(inputVal));
    if (matches.length === 1) {
      inp.value = matches[0];
      return;
    }
    if (matches.length > 1) {
      let prefix = inputVal;
      for (let i = inputVal.length; i <= matches[0].length; i++) {
        const cand = matches[0].slice(0, i);
        if (matches.every(m => m.startsWith(cand))) prefix = cand;
        else break;
      }
      if (prefix !== inputVal) { inp.value = prefix; return; }
      print('root@Louis\'s Bestie:~$ ' + inputVal, 'term-line-input');
      print(matches.join('  '), 'term-line-dim');
      appendPrompt();
    }
  }

  /* ═══════════════════════════════════════════
     事件绑定
     ═══════════════════════════════════════════ */
  function bindInput(inp) {
    let composing = false;
    inp.addEventListener('compositionstart', () => { composing = true; });
    inp.addEventListener('compositionend', () => { composing = false; });

    inp.addEventListener('keydown', function handler(e) {
      if (e.key === 'Enter') {
        if (composing || e.isComposing) return;
        e.preventDefault();
        const val = inp.value;
        inp.value = '';
        pendingW = '';
        inp.removeEventListener('keydown', handler);
        run(val);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length === 0) return;
        if (histCursor === history.length) pendingW = inp.value;
        histCursor = Math.max(0, histCursor - 1);
        inp.value = history[histCursor] || '';
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (histCursor >= history.length - 1) {
          histCursor = history.length;
          inp.value = pendingW;
          return;
        }
        histCursor = Math.min(history.length - 1, histCursor + 1);
        inp.value = history[histCursor] || '';
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const v = inp.value.trim();
        if (!v) return;
        complete(inp, v);
      }
    });
  }

  // 点击空白区域自动聚焦输入框（选中文字时不触发）
  panel.addEventListener('click', (e) => {
    if (window.getSelection().toString().length > 0) return;
    if (e.target !== output && e.target.closest('.term-input-inline')) return;
    if (activeInput && activeInput.input) {
      activeInput.input.focus();
    }
  });

  /* ── 恢复历史 ──────────────────────── */
  try {
    const saved = localStorage.getItem('term_history');
    if (saved) history = JSON.parse(saved);
    histCursor = history.length;
  } catch (_) {}

  /* ── 初始欢迎 + 首条提示行 ─────────── */
  print('终端模式', 'term-line-output');
  print('输入 <span class="term-line-info">help</span> 查看可用命令，<span class="term-line-info">clear</span> 清屏', 'term-line-dim');
  print('', '');
  appendPrompt();

  /* ── 暴露 focus 给 bottom.js ─────── */
  window.__focusTerminal = () => {
    if (activeInput && activeInput.input) {
      activeInput.input.focus();
    }
  };
})();
