(function () {
    var fonts = {
        'J': [
            [0,0,1,1,1],
            [0,0,0,1,0],
            [0,0,0,1,0],
            [0,0,0,1,0],
            [1,0,0,1,0],
            [1,0,0,1,0],
            [0,1,1,0,0]
        ],
        'r': [
            [0,0,0,0,0],
            [0,0,0,0,0],
            [1,0,1,1,0],
            [1,1,0,0,1],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0]
        ],
        '.': [
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,1,1,0,0],
            [0,1,1,0,0]
        ],
        'L': [
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,1,1,1,1]
        ],
        'o': [
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,0]
        ],
        'u': [
            [0,0,0,0,0],
            [0,0,0,0,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,1,1],
            [0,1,1,0,1]
        ],
        'i': [
            [0,0,0,0,0],
            [0,0,1,0,0],
            [0,0,0,0,0],
            [0,1,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,1,1,1,0]
        ],
        's': [
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,1,1,1,0],
            [1,0,0,0,0],
            [0,1,1,1,0],
            [0,0,0,0,1],
            [1,1,1,1,0]
        ]
    };

    var text = 'Jr.Louis';
    var ROWS = 7;
    var COLS = 5;
    var container = document.getElementById('pixelText');
    var allBlocks = [];

    /* 检测是否为手机或竖屏（紧凑模式），并提供切换函数 */
    var compactMode = false;
    function isMobileUA() {
        return /Mobi|Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile/i.test(navigator.userAgent || '');
    }
    // 防抖工具：用于在窗口大小变化后延迟触发重排
    function debounce(fn, wait) {
        var t = null;
        return function() {
            var ctx = this;
            var args = arguments;
            clearTimeout(t);
            t = setTimeout(function() { try { fn.apply(ctx, args); } catch (e) {} }, wait);
        };
    }

    // 在 syncArea3Layout 可用时安全调用它（多次调度以确保在最大化/动画结束后也能生效）
    function safeSyncArea3Layout() {
        if (typeof syncArea3Layout === 'function') {
            try { syncArea3Layout(); } catch (e) {}
        }
    }

    var scheduleSync = debounce(function() {
        safeSyncArea3Layout();
        setTimeout(safeSyncArea3Layout, 120);
        setTimeout(safeSyncArea3Layout, 360);
    }, 100);
    function setCompactMode(enabled) {
        compactMode = !!enabled;
        if (compactMode) {
            document.body.classList.add('compact-mode');
            if (!document.getElementById('compactBanner')) {
                var b = document.createElement('div');
                b.id = 'compactBanner';
                b.className = 'compact-banner';
                b.textContent = '更多内容请使用桌面端浏览器或拉宽窗口食用~';
                document.body.appendChild(b);
            }
            // 尝试暂停并清空音频资源（若已创建），并隐藏播放器 UI
            try {
                if (typeof playerAudio !== 'undefined' && playerAudio) {
                    try { playerAudio.pause(); } catch(e){}
                    try { playerAudio.src = ''; } catch(e){}
                }
            } catch(e){}
            var pw = document.getElementById('playerWrapper');
            if (pw) pw.style.display = 'none';
            // 紧凑模式下也触发一次重排，确保布局立即生效
            scheduleSync();
        } else {
            document.body.classList.remove('compact-mode');
            var b = document.getElementById('compactBanner');
            if (b && b.parentNode) b.parentNode.removeChild(b);
            var pw = document.getElementById('playerWrapper');
            if (pw) pw.style.display = '';
            // 退出紧凑模式后强制重算布局（可能需要延迟多次以覆盖浏览器渲染抖动）
            scheduleSync();
        }
    }
    function checkAndApplyCompactMode() {
        var isPortrait = window.innerWidth / window.innerHeight < 1;
        var enabled = isPortrait || isMobileUA();
        setCompactMode(enabled);
    }
    checkAndApplyCompactMode();
    // 在 resize 时同时处理紧凑模式开关与延迟重排
    window.addEventListener('resize', function() { checkAndApplyCompactMode(); scheduleSync(); });
    // 监听方向/全屏变化以应对最大化、旋转等场景
    window.addEventListener('orientationchange', function() { setTimeout(scheduleSync, 50); setTimeout(scheduleSync, 300); });
    document.addEventListener('fullscreenchange', function() { setTimeout(scheduleSync, 50); setTimeout(scheduleSync, 300); });
    document.addEventListener('webkitfullscreenchange', function() { setTimeout(scheduleSync, 50); setTimeout(scheduleSync, 300); });

    function randomGray() {
        var val = Math.floor(Math.random() * 41) + 30; //30-70随机亮度
        return 'hsl(0,0%,' + val + '%)';
    }

    //像素字母
    for (var c = 0; c < text.length; c++) {
        var ch = text[c];
        var grid = fonts[ch];
        if (!grid) continue;

        var letterEl = document.createElement('div');
        letterEl.className = 'pixel-letter';
        letterEl.style.gridTemplateColumns = 'repeat(' + COLS + ', 1fr)';
        letterEl.style.gridTemplateRows = 'repeat(' + ROWS + ', 1fr)';

        for (var r = 0; r < ROWS; r++) {
            for (var col = 0; col < COLS; col++) {
                var block = document.createElement('div');
                block.className = 'pixel-block';
                if (grid[r][col]) {
                    block.style.backgroundColor = randomGray();
                    allBlocks.push(block);
                } else {
                    block.style.backgroundColor = 'transparent';
                }
                letterEl.appendChild(block);
            }
        }
        container.appendChild(letterEl);
    }

    //每0.4s更新灰度
    setInterval(function () {
        var count = Math.floor(allBlocks.length / 2);
        var indices = [];
        for (var i = 0; i < allBlocks.length; i++) indices.push(i);
        for (var i = indices.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = indices[i];
            indices[i] = indices[j];
            indices[j] = tmp;
        }
        for (var k = 0; k < count; k++) {
            allBlocks[indices[k]].style.backgroundColor = randomGray();
        }
    }, 400);

    //==========时间显示模块==========
    function pad(num, size) {
        var s = "00" + num;
        return s.substring(s.length - size);
    }
    
    //获取当年的第几天
    function getDayOfYear(now) {
        var start = new Date(now.getFullYear(), 0, 0);
        var diff = now - start;
        var oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    var weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    var chineseHours = ["子时", "丑时", "寅时", "卯时", "辰时", "巳时", "午时", "未时", "申时", "酉时", "戌时", "亥时"];
    var tiangan = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    var dizhi = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

    //算干支纪年
    function getGanZhiYear(year) {
        var offset = year - 1984;
        var tgIndex = ((offset % 10) + 10) % 10;
        var dzIndex = ((offset % 12) + 12) % 12;
        return tiangan[tgIndex] + dizhi[dzIndex] + "年";
    }

    //农历格式化器
    var lunarFormatter;
    try {
        lunarFormatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { month: 'long', day: 'numeric' });
    } catch (e) {
        lunarFormatter = null;
    }

    var tzEl = document.getElementById('timezone');
    var dateEl = document.getElementById('date');
    var lunarEl = document.getElementById('lunar-date');
    var wdEl = document.getElementById('weekday-dayofyear');
    var weekdaySpan = document.getElementById('weekday');
    var dayofyearSpan = document.getElementById('dayofyear');
    var hmEl = document.getElementById('time-hm');
    var sEl = document.getElementById('time-s');
    var chEl = document.getElementById('chinese-hour');
    var msEl = document.getElementById('time-ms');

    //时间可视化方块
    var visualWrapper = document.querySelector('.visual-time-wrapper');
    if (visualWrapper) {
        // 第1行：12个月
        var monthRow = document.createElement('div');
        monthRow.className = 'visual-row';
        for (var i = 0; i < 12; i++) {
            var b = document.createElement('div');
            b.className = 'visual-block month-block';
            monthRow.appendChild(b);
        }
        visualWrapper.appendChild(monthRow);

        // 第2-4行：日 
        var dayCounts = [10, 10, 11];
        for (var r = 0; r < 3; r++) {
            var dayRow = document.createElement('div');
            dayRow.className = 'visual-row';
            for (var i = 0; i < dayCounts[r]; i++) {
                var b = document.createElement('div');
                b.className = 'visual-block day-block';
                dayRow.appendChild(b);
            }
            visualWrapper.appendChild(dayRow);
        }

        // 第5-6行：小时 (12+12)
        for (var r = 0; r < 2; r++) {
            var hourRow = document.createElement('div');
            hourRow.className = 'visual-row';
            for (var i = 0; i < 12; i++) {
                var b = document.createElement('div');
                b.className = 'visual-block hour-block';
                hourRow.appendChild(b);
            }
            visualWrapper.appendChild(hourRow);
        }

        // 第7-12行：分和秒 (左右并排，10x6)
        var splitRow = document.createElement('div');
        splitRow.className = 'visual-row-group';
        splitRow.style.flex = "1";
        
        var minHalf = document.createElement('div');
        minHalf.className = 'visual-half';
        for (var r = 0; r < 6; r++) {
            var row = document.createElement('div');
            row.className = 'visual-row';
            for (var i = 0; i < 10; i++) {
                var b = document.createElement('div');
                b.className = 'visual-block minute-block';
                row.appendChild(b);
            }
            minHalf.appendChild(row);
        }

        var secHalf = document.createElement('div');
        secHalf.className = 'visual-half';
        for (var r = 0; r < 6; r++) {
            var row = document.createElement('div');
            row.className = 'visual-row';
            for (var i = 0; i < 10; i++) {
                var b = document.createElement('div');
                b.className = 'visual-block second-block';
                row.appendChild(b);
            }
            secHalf.appendChild(row);
        }

        splitRow.appendChild(minHalf);
        splitRow.appendChild(secHalf);
        visualWrapper.appendChild(splitRow);
    }

    var monthBlocks = document.querySelectorAll('.month-block');
    var dayBlocks = document.querySelectorAll('.day-block');
    var hourBlocks = document.querySelectorAll('.hour-block');
    var minBlocks = document.querySelectorAll('.minute-block');
    var secBlocks = document.querySelectorAll('.second-block');

    function updateVisualBlocks(now) {
        var m = now.getMonth() + 1; // 1-12
        var d = now.getDate(); // 1-31
        var h = now.getHours(); // 0-23
        var min = now.getMinutes(); // 0-59
        var s = now.getSeconds(); // 0-59

        for (var i = 0; i < monthBlocks.length; i++) monthBlocks[i].classList.toggle('active', i < m);
        
        //当月总天数
        var daysInMonth = new Date(now.getFullYear(), m, 0).getDate();
        for (var i = 0; i < dayBlocks.length; i++) {
            dayBlocks[i].style.visibility = i < daysInMonth ? 'visible' : 'hidden';
            dayBlocks[i].classList.toggle('active', i < d);
        }
        
        for (var i = 0; i < hourBlocks.length; i++) {
            hourBlocks[i].classList.toggle('active', i < h); 
        }

        for (var i = 0; i < minBlocks.length; i++) minBlocks[i].classList.toggle('active', i < min);
        for (var i = 0; i < secBlocks.length; i++) secBlocks[i].classList.toggle('active', i < s);
    }

    function updateTime() {
        var now = new Date();
        
        //第一行：时区 
        var offset = -now.getTimezoneOffset();
        var sign = offset >= 0 ? "+" : "-";
        var absOffset = Math.abs(offset);
        var hours = pad(Math.floor(absOffset / 60), 2);
        var mins = pad(absOffset % 60, 2);
        if (tzEl) tzEl.textContent = "GMT" + sign + hours + ":" + mins;

        //二行：日期 yyyy/MM/dd
        var year = now.getFullYear();
        var month = pad(now.getMonth() + 1, 2);
        var day = pad(now.getDate(), 2);
        if (dateEl) dateEl.textContent = year + "/" + month + "/" + day;

        //农历与天干地支
        if (lunarEl) {
            if (lunarFormatter) {
                var lunarStr = lunarFormatter.format(now);
                //提取月/日部分
                var parts = lunarStr.match(/([正一二三四五六七八九十冬腊闰]+月.*)/);
                var monthDayStr = parts ? parts[1] : lunarStr;
                var lunarYearValue = now.getFullYear();
                if (now.getMonth() <= 1 && (monthDayStr.indexOf("冬月") !== -1 || monthDayStr.indexOf("十二月") !== -1 || monthDayStr.indexOf("腊月") !== -1)) {
                    lunarYearValue -= 1;
                }
                
                var ganzhi = getGanZhiYear(lunarYearValue);
                lunarEl.textContent = ganzhi + monthDayStr;
            } else {
                lunarEl.textContent = "";
            }
        }

        //第三行：星期几和当年的第几天
        var weekday = weekdays[now.getDay()];
        var dayOfYear = getDayOfYear(now);
        if (wdEl) {
            // 按宽高比区分显示：宽屏（宽高比 > 4/3）与窄屏（宽高比 < 4/3）
            var ratio = window.innerWidth / window.innerHeight;
            var isWide = ratio > (4 / 3);
            if (isWide) {
                if (weekdaySpan) weekdaySpan.textContent = weekday + "\u00A0";
                if (dayofyearSpan) dayofyearSpan.textContent = "今年的第" + dayOfYear + "天";
                wdEl.style.flexDirection = '';
            } else {
                if (weekdaySpan) weekdaySpan.textContent = weekday;
                if (dayofyearSpan) dayofyearSpan.textContent = "今年的第" + dayOfYear + "天";
                wdEl.style.flexDirection = 'column';
            }
        }

        //第四行：时分 HH:mm
        var h = now.getHours(); 
        var m = now.getMinutes();
        if (hmEl) hmEl.textContent = pad(h, 2) + ":" + pad(m, 2);

        //第五行：秒、十二时辰和百分之一秒
        var s = pad(now.getSeconds(), 2);
        var ms = pad(Math.floor(now.getMilliseconds() / 10), 2); 
        
        if (sEl) sEl.textContent = s;
        if (chEl) chEl.textContent = chineseHours[Math.floor((h + 1) / 2) % 12];
        if (msEl) msEl.textContent = "." + ms;
        
        if (typeof updateVisualBlocks === 'function') {
            updateVisualBlocks(now);
        }
    }

    //每0.01s更新一次时间
    setInterval(updateTime, 10);
    updateTime();

    // ========== 区域4：地点像素图标 ==========
    var homeIconEl = document.getElementById('homeIcon');
    var schoolIconEl = document.getElementById('schoolIcon');
    var zodiacIconEl = document.getElementById('zodiacIcon');
    var mbtiIconEl = document.getElementById('mbtiIcon');
    var qqIconEl = document.getElementById('qqIcon');
    var mailIconEl = document.getElementById('mailIcon');
    var pacmanIconEl = document.getElementById('pacmanIcon');
    var monitorIconEl = document.getElementById('monitorIcon');
    var heartIconEl = document.getElementById('heartIcon');
    var gamepadIconEl = document.getElementById('gamepadIcon');

    var homePattern = [
        "0000110000",
        "0001111000",
        "0011111100",
        "0111111110",
        "1111111111",
        "0011111100",
        "0010110100",
        "0010110100",
        "0010110100",
        "0011111100"
    ];

    var schoolPattern = [
       "1110000111",
        "1110000111",
        "1110000111",
        "1111111111",
        "1100010011",
        "1100010011",
        "1111110011",
        "1100010011",
        "1100010011",
        "1111111111"
    ];

    var zodiacPattern = [
        "0001000100",
        "0001000100",
        "0011000110",
        "0111001110",
        "1111111111",
        "1111111111",
        "0111001110",
        "0011000110",
        "0001000100",
        "0001000100"
    ];

    var mbtiPattern = [
        "1000101110",
        "1101101001",
        "1010101110",
        "1000101001",
        "1000101110",
        "0000000000",
        "1111101111",
        "0010000110",
        "0010000110",
        "0010001111"
    ];

    var qqPattern = [
        "0110001100",
        "1001010010",
        "1001010010",
        "1001010010",
        "1001010010",
        "1001010010",
        "1011010110",
        "0111001110",
        "0001100011",
        "0000000000"
    ];

    var mailPattern = [
         "1111111111",
        "1100000011",
        "1010000101",
        "1001001001",
        "1000110001",
        "1000000001",
        "1000000001",
        "1000000001",
        "1000000001",
        "1111111111"
    ];

    var pacmanPattern = [
        "1100000011",
        "0110000111",
        "0011001111",
        "0001111011",
        "0000110011",
        "0000110011",
        "0001111011",
        "0011001111",
        "0110000111",
        "1100000011"
    ];

    var monitorPattern = [
        "1111111111",
        "1000000001",
        "1000000001",
        "1000000001",
        "1000000001",
        "1001111001",
        "1000000001",
        "1111111111",
        "0000110000",
        "0001111000"
    ];

    var heartPattern = [
        "0000000000",
        "0110000110",
        "1111001111",
        "1111111111",
        "1111111111",
        "1111111111",
        "0111111110",
        "0011111100",
        "0001111000",
        "0000110000"
    ];

    var gamepadPattern = [
        "0011111100",
        "0111111110",
        "1111111111",
        "1100110011",
        "1100110011",
        "1111111111",
        "1111111111",
        "1110000111",
        "1110000111",
        "1100000011"
    ];

    function paintPixelIcon(iconEl, pattern) {
        if (!iconEl || !pattern || pattern.length !== 10) return;
        iconEl.innerHTML = '';
        for (var r = 0; r < 10; r++) {
            for (var c = 0; c < 10; c++) {
                var dot = document.createElement('span');
                dot.className = pattern[r][c] === '1' ? 'pixel-dot on' : 'pixel-dot';
                iconEl.appendChild(dot);
            }
        }
    }

    paintPixelIcon(homeIconEl, homePattern);
    paintPixelIcon(schoolIconEl, schoolPattern);
    paintPixelIcon(zodiacIconEl, zodiacPattern);
    paintPixelIcon(mbtiIconEl, mbtiPattern);
    paintPixelIcon(qqIconEl, qqPattern);
    paintPixelIcon(mailIconEl, mailPattern);
    paintPixelIcon(pacmanIconEl, pacmanPattern);
    paintPixelIcon(monitorIconEl, monitorPattern);
    paintPixelIcon(heartIconEl, heartPattern);
    paintPixelIcon(gamepadIconEl, gamepadPattern);

    // ========== 区域5：社交图标按钮 ==========
    var iconGrid = document.getElementById('iconGrid');
    if (iconGrid) {
        var socialIcons = [
            { name: 'GitHub', url: 'https://github.com/JiyuanLiu2006', popup: 'Jr.Louis' },
            { name: 'Bilibili', url: 'https://space.bilibili.com/492002509', popup: '自罚三杯快乐水' },
            { name: '小红薯', url: 'https://www.xiaohongshu.com/user/profile/6751bd7a000000001c019284', popup: 'Jr.Louis' },
            { name: 'Steam', url: 'https://steamcommunity.com/profiles/76561199223823513/', popup: 'Jr.Louis' },
            { name: 'YouTube', url: 'https://www.youtube.com/@JaronLouis-v5u', popup: 'JaronLouis' },
            { name: '音符', url: ' https://www.douyin.com/user/MS4wLjABAAAA4HSAOzCTVEobqmAFHoSSVAFyrfMmYKmPgkghblq2QePo2RtNuX-WQVlyOtbX5V7M?from_tab_name=main', popup: '自罚三杯快乐水' },
            { name: 'LOFTER', url: 'https://liuliuliupanzhi.lofter.com/', popup: '盼之喵' },
            { name: '网易云', url: 'https://music.163.com/#/user/home?id=3293246882', popup: '盼之喵' }
        ];

        //渲染图标到网格
        socialIcons.forEach(function(icon) {
            var link = document.createElement('a');
            link.className = 'icon-btn';
            link.href = icon.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.setAttribute('aria-label', icon.name);

            var inner = document.createElement('div');
            inner.className = 'icon-inner';
            inner.textContent = icon.name;
            link.appendChild(inner);

            var popup = document.createElement('span');
            popup.className = 'icon-popup';
            popup.textContent = icon.popup || icon.name;
            link.appendChild(popup);

            iconGrid.appendChild(link);
        });

        //根据按钮实际渲染宽度计算文字大小，统一为最小值
        function fitIconText() {
            var btns = iconGrid.querySelectorAll('.icon-btn');
            var minSize = Infinity;
            var isWide = (window.innerWidth / window.innerHeight) > (4 / 3);
            var multiplier = isWide ? 1.6 : 1.1;

            btns.forEach(function(btn) {
                var inner = btn.querySelector('.icon-inner');
                var text = inner ? inner.textContent : btn.textContent;
                var textLen = Math.max(1, text.length);
                var w = btn.clientWidth;
                var h = btn.clientHeight;
                var sizeByW = Math.floor((w - 12) / textLen * multiplier);
                var sizeByH = Math.floor((h - 8) * 0.85);
                var size = Math.min(sizeByW, sizeByH);
                //最小字号12px
                size = Math.max(12, Math.min(size, 72));
                if (size < minSize) minSize = size;
            });

            //统一应用最小字号
            btns.forEach(function(btn) {
                var inner = btn.querySelector('.icon-inner');
                var popup = btn.querySelector('.icon-popup');
                if (inner) inner.style.fontSize = minSize + 'px';
                if (popup) popup.style.fontSize = minSize + 'px';
            });
        }

      
        fitIconText();
        window.addEventListener('resize', fitIconText);
    }

    // ========== 鼠标交互：像素粒子及颜文字特效 ==========
    var effectCanvas = document.getElementById('effectCanvas');
    if (effectCanvas) {
        var eCtx = effectCanvas.getContext('2d');
        var particles = [];

        function resizeEffectCanvas() {
            effectCanvas.width = window.innerWidth;
            effectCanvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeEffectCanvas);
        resizeEffectCanvas();

        function Particle(x, y, isClick) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 8 + 4; //随机像素大小 4~12px
            this.life = 1.0;
            var gray = Math.floor(Math.random() * 100) + 100; // #646464 ~ #C8C8C8  
            this.color = 'rgba(' + gray + ',' + gray + ',' + gray + ','; 
            
            if (isClick) {
                //点击时的波纹效果
                var angle = Math.random() * Math.PI * 2;
                var speed = Math.random() * 5 + 2;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                this.decay = Math.random() * 0.02 + 0.02; 
            } else {
                //鼠标拖尾
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = Math.random() * 1.5 + 0.5; //下坠
                this.decay = Math.random() * 0.02 + 0.015;
            }
        }

        function updateAndDrawParticles() {
            eCtx.clearRect(0, 0, effectCanvas.width, effectCanvas.height);
            for (var i = particles.length - 1; i >= 0; i--) {
                var p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;
                
                if (p.life <= 0) {
                    particles.splice(i, 1);
                } else {
                    eCtx.fillStyle = p.color + p.life + ')';
                    eCtx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.floor(p.size), Math.floor(p.size));
                }
            }
            requestAnimationFrame(updateAndDrawParticles);
        }
        updateAndDrawParticles();

       
        var gridItems = document.querySelectorAll('.grid-item');
        
        window.addEventListener('mousemove', function(e) {

            particles.push(new Particle(e.clientX, e.clientY, false));
            if (Math.random() > 0.5) {
                particles.push(new Particle(e.clientX, e.clientY, false));
            }
          
            gridItems.forEach(function(item) {
                var rect = item.getBoundingClientRect();
              
                if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                    var x = e.clientX - rect.left;
                    var y = e.clientY - rect.top;
                    item.style.setProperty('--mouse-x', x + 'px');
                    item.style.setProperty('--mouse-y', y + 'px');
                }
            });
        });

        //颜文字
        var kaomojis = ["(≧▽≦)", "(*^▽^*)", "O(∩_∩)O", "(✿◠‿◠)", "(～￣▽￣)～", "ヾ(≧▽≦*)o", "\\(^o^)/~", "φ(゜▽゜*)♪"];

        
        window.addEventListener('mousedown', function(e) {
            //波纹
            var particleCount = Math.floor(Math.random() * 10) + 15; // 15~25个粒子
            for(var i = 0; i < particleCount; i++) {
                particles.push(new Particle(e.clientX, e.clientY, true));
            }

            //产生颜文字
            var kEl = document.createElement('div');
            kEl.className = 'kaomoji-float';
            kEl.textContent = kaomojis[Math.floor(Math.random() * kaomojis.length)];
            kEl.style.left = e.clientX + 'px';
            kEl.style.top = e.clientY + 'px';
            document.body.appendChild(kEl);
            
            //动画播放完毕后移除DOM节点
            setTimeout(function() {
                if (kEl.parentNode) {
                    kEl.parentNode.removeChild(kEl);
                }
            }, 1000); 
        });
    }

    // ========== 区域3：引文与播放器布局 ==========
    var area3 = document.getElementById('area3');
    var quoteWrapper = area3 ? area3.querySelector('.quote-wrapper') : null;
    var quoteText = area3 ? area3.querySelector('.quote-text') : null;
    var quoteSource = area3 ? area3.querySelector('.quote-source') : null;
    var playerWrapper = document.getElementById('playerWrapper');
    var playerFrame = document.getElementById('playerFrame');
    var playerTitleEl = document.getElementById('playerTitle');
    var playerArtistEl = document.getElementById('playerArtist');
    var playerPrevBtn = document.getElementById('playerPrev');
    var playerPlayBtn = document.getElementById('playerPlay');
    var playerNextBtn = document.getElementById('playerNext');
    var syncArea3Layout = null;

    if (area3 && quoteWrapper && quoteText) {
        // 二合一布局：先将引文缩放控制在区域上半部，再确保播放器位于下半部
        function fitQuoteSize(maxAllowedH) {
            quoteWrapper.style.width = '92%';
            var areaH = area3.clientHeight;
            var safeGap = Math.max(10, areaH * 0.025);
            var midline = areaH / 2;
            var allowedH = typeof maxAllowedH === 'number' ? maxAllowedH : Math.max(0, midline - safeGap);

            var minTarget = Math.max(12, Math.floor(areaH * 0.12));
            var maxTarget = Math.floor(areaH * 0.6);
            var targetH = Math.max(minTarget, Math.min(allowedH || (areaH * 0.52), maxTarget));

            var lo = 8, hi = 72;
            while (hi - lo > 0.5) {
                var mid = (lo + hi) / 2;
                quoteText.style.fontSize = mid + 'px';
                if (quoteSource) quoteSource.style.fontSize = mid + 'px';
                var textH = quoteWrapper.scrollHeight;
                if (textH > targetH) {
                    hi = mid;
                } else {
                    lo = mid;
                }
            }
            quoteText.style.fontSize = lo + 'px';
            if (quoteSource) quoteSource.style.fontSize = lo + 'px';

            // 强制引文容器高度上限，防止异步内容导致溢出
            quoteWrapper.style.maxHeight = Math.max(0, targetH) + 'px';
            quoteWrapper.style.overflow = 'auto';
        }

        function layoutArea3() {
            var areaH = area3.clientHeight;
            var safeGap = Math.max(10, areaH * 0.025);
            var midline = areaH / 2;
            var bottomInset = 0;
            try { bottomInset = parseFloat(window.getComputedStyle(playerWrapper).bottom) || 0; } catch (e) { bottomInset = 0; }

            // 1) 让引文在上半区（中线之上）适配
            var maxQuoteH = Math.max(0, midline - safeGap);
            fitQuoteSize(maxQuoteH);

            // 2) 计算播放器可用空间（下半区，从中线+safeGap 到区域底部 - bottomInset）
            var allowedPlayerSpace = Math.max(0, areaH - (midline + safeGap) - bottomInset);

            if (playerWrapper) {
                // 取播放器当前自然高度（如果有内联高度则考虑）
                var naturalH = playerWrapper.offsetHeight || Math.max(180, areaH * 0.32);

                // 限制播放器高度不超过下半区可用区域
                var finalPlayerH = Math.min(naturalH, Math.max(80, Math.floor(allowedPlayerSpace)));

                // 如果播放器当前高度超出允许空间，则缩小播放器高度
                if (naturalH > finalPlayerH) {
                    playerWrapper.style.height = finalPlayerH + 'px';
                    playerWrapper.style.minHeight = '0px';
                } else {
                    // 清除之前可能设置的固定高度，保持原样
                    playerWrapper.style.height = '';
                    playerWrapper.style.minHeight = '';
                }

                // 将播放器定位到下半区（top 不小于 midline + safeGap）
                var computedPlayerH = playerWrapper.offsetHeight || finalPlayerH;
                var topWanted = Math.max(midline + safeGap, areaH - bottomInset - computedPlayerH);
                // 不超过最大顶部位置
                var maxTop = Math.max(0, areaH - bottomInset - Math.max(80, Math.floor(areaH * 0.15)));
                playerWrapper.style.top = Math.max(0, Math.min(topWanted, maxTop)) + 'px';
            }
        }

        syncArea3Layout = function () {
            layoutArea3();
        };

        syncArea3Layout();
        window.addEventListener('resize', syncArea3Layout);
        setTimeout(syncArea3Layout, 0);
        window.addEventListener('load', syncArea3Layout);
    }

    if (playerTitleEl && playerArtistEl && playerPrevBtn && playerPlayBtn && playerNextBtn) {
        if (compactMode) {
            // 紧凑模式：隐藏播放器 UI 并禁用播放按钮
            if (playerWrapper) playerWrapper.style.display = 'none';
            if (playerPlayBtn) { playerPlayBtn.textContent = '已禁用'; playerPlayBtn.classList.remove('is-playing'); }
        } else {
        // 音频路径解析：始终从当前 HTML 文件所在目录加载音频文件（便于直接把音频放在与 index.html 相同目录）
        function resolveTrackPath(fileName) {
            return './' + fileName;
        }

        var playlist = [
            {
                title: 'All for Love',
                artist: 'Tungevaag & Raaban',
                src: resolveTrackPath('All For Love.mp3')
            },
            {
                title: 'Higher',
                artist: 'Tobu',
                src: resolveTrackPath('Higher.mp3')
            },
            {
                title: 'summertime',
                artist: 'cinnamons & evening cinema',
                src: resolveTrackPath('summertime.mp3')
            }
        ];

        var playerAudio = new Audio();
        playerAudio.preload = 'metadata';
        var currentTrackIndex = 0;

        function setPlayBtnState(isPlaying) {
            playerPlayBtn.textContent = isPlaying ? '暂停' : '播放';
            playerPlayBtn.classList.toggle('is-playing', isPlaying);
        }

        function renderTrackInfo() {
            var track = playlist[currentTrackIndex];
            playerTitleEl.textContent = track.title;
            playerArtistEl.textContent = track.artist;
            if (syncArea3Layout) {
                requestAnimationFrame(syncArea3Layout);
            }
        }

        function loadTrack(index, autoPlay) {
            currentTrackIndex = (index + playlist.length) % playlist.length;
            var track = playlist[currentTrackIndex];
            playerAudio.src = track.src;
            renderTrackInfo();
            setPlayBtnState(false);
            if (autoPlay) {
                var playPromise = playerAudio.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(function () {
                        setPlayBtnState(false);
                    });
                }
            }
        }

        function bindControlAction(controlEl, handler) {
            controlEl.addEventListener('click', handler);
            controlEl.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handler();
                }
            });
        }

        bindControlAction(playerPrevBtn, function () {
            loadTrack(currentTrackIndex - 1, true);
        });

        bindControlAction(playerPlayBtn, function () {
            if (!playerAudio.src) {
                loadTrack(currentTrackIndex, false);
            }
            if (playerAudio.paused) {
                var playPromise = playerAudio.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(function () {
                        setPlayBtnState(false);
                    });
                }
            } else {
                playerAudio.pause();
            }
        });

        bindControlAction(playerNextBtn, function () {
            loadTrack(currentTrackIndex + 1, true);
        });

        playerAudio.addEventListener('play', function () {
            setPlayBtnState(true);
        });

        playerAudio.addEventListener('pause', function () {
            setPlayBtnState(false);
        });

        playerAudio.addEventListener('ended', function () {
            loadTrack(currentTrackIndex + 1, true);
        });

        // 播放进度条同步与点击跳转（显示在作者与控件之间）
        var playerProgress = document.getElementById('playerProgress');
        var playerProgressBar = document.getElementById('playerProgressBar');

        function formatTime(s) {
            if (!isFinite(s) || s <= 0) return '00:00';
            s = Math.floor(s);
            var h = Math.floor(s / 3600);
            var m = Math.floor((s % 3600) / 60);
            var sec = s % 60;
            if (h > 0) {
                return h + ':' + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
            }
            return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
        }

        function updateProgress() {
            if (!playerProgressBar || !playerAudio) return;
            var dur = playerAudio.duration;
            var cur = playerAudio.currentTime;
            var pct = (dur && !isNaN(dur)) ? (cur / dur) * 100 : 0;
            if (!isFinite(pct)) pct = 0;
            pct = Math.max(0, Math.min(100, pct));
            playerProgressBar.style.width = pct + '%';
            if (playerProgress) playerProgress.setAttribute('aria-valuenow', Math.floor(pct));

            // 更新时间文本
            var curEl = document.getElementById('playerTimeCurrent');
            var durEl = document.getElementById('playerTimeDuration');
            if (curEl) curEl.textContent = formatTime(cur);
            if (durEl) durEl.textContent = isFinite(dur) && dur > 0 ? formatTime(dur) : '00:00';
        }

        // 在元数据加载、播放进度更新、以及跳转后更新进度显示
        playerAudio.addEventListener('loadedmetadata', updateProgress);
        playerAudio.addEventListener('timeupdate', updateProgress);
        playerAudio.addEventListener('seeked', updateProgress);

        // 播放进度条交互：支持点击、拖拽（scrub）以及键盘微调
        var isScrubbing = false;
        var scrubbingPointerId = null;
        var wasPlayingBeforeScrub = false;
        var pendingSeekTime = null;

        function getRatioFromClientX(clientX) {
            var rect = playerProgress.getBoundingClientRect();
            var x = clientX - rect.left;
            return rect.width > 0 ? Math.max(0, Math.min(1, x / rect.width)) : 0;
        }

        function updateProgressBarUIByRatio(ratio) {
            if (!playerProgressBar) return;
            var pct = Math.max(0, Math.min(100, ratio * 100));
            playerProgressBar.style.width = pct + '%';
            // 更新时间文本为预览值（若可用）
            var dur = playerAudio.duration;
            var curPreview = 0;
            if (isFinite(dur) && dur > 0) {
                curPreview = ratio * dur;
            }
            var curEl = document.getElementById('playerTimeCurrent');
            if (curEl) curEl.textContent = formatTime(isFinite(curPreview) ? curPreview : 0);
        }

        function safeSeek(time) {
            if (playerAudio.duration && isFinite(playerAudio.duration) && playerAudio.duration > 0) {
                try {
                    playerAudio.currentTime = Math.max(0, Math.min(playerAudio.duration, time));
                    pendingSeekTime = null;
                } catch (err) {
                    // 如果设置 currentTime 失败（例如尚未可 seek），记录为 pending
                    pendingSeekTime = time;
                }
            } else {
                pendingSeekTime = time;
            }
        }

        // 当元数据加载完成时，如果有待处理的 seek，则执行
        if (playerAudio) {
            playerAudio.addEventListener('loadedmetadata', function () {
                if (pendingSeekTime != null) {
                    try {
                        playerAudio.currentTime = pendingSeekTime;
                    } catch (err) {}
                    pendingSeekTime = null;
                    updateProgress();
                }
            });
        }

        // 全局左右键快进快退
        // ...existing code...
        // ...existing code...

                // 每次载入默认选择第 0 首（All for Love），尝试自动播放；若被浏览器阻止，则在首次用户交互时再播放
                loadTrack(0, false);

                (function attemptAutoplay() {
                        try {
                                var p = playerAudio.play();
                                if (p && typeof p.then === 'function') {
                                        p.then(function () { setPlayBtnState(true); }).catch(function () {
                                                var onGesture = function () {
                                                        document.removeEventListener('pointerdown', onGesture);
                                                        document.removeEventListener('keydown', onGesture);
                                                        try { playerAudio.play().catch(function () {}); } catch (e) {}
                                                };
                                                document.addEventListener('pointerdown', onGesture, { once: true });
                                                document.addEventListener('keydown', onGesture, { once: true });
                                        });
                                } else {
                                        setPlayBtnState(true);
                                }
                        } catch (err) {
                                var onGesture2 = function () {
                                        document.removeEventListener('pointerdown', onGesture2);
                                        document.removeEventListener('keydown', onGesture2);
                                        try { playerAudio.play().catch(function () {}); } catch (e) {}
                                };
                                document.addEventListener('pointerdown', onGesture2, { once: true });
                                document.addEventListener('keydown', onGesture2, { once: true });
                        }
                })();
        }
    }

    //初始化音频上下文
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    document.addEventListener('pointerdown', ()=> { if (ctx.state === 'suspended') ctx.resume(); }, { once: true });
})();

