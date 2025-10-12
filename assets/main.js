// ========= Reveal：滚动入场 =========
(function () {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("on"); });
    }, { threshold: 0.2 });
    els.forEach(el => io.observe(el));
})();

// ========= Landing：像素 TV 雪花（更小 & 更慢）+ 故障横条 =========
(function () {
    const canvas = document.getElementById('fxCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, DPR;
    function resize() {
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        W = canvas.clientWidth; H = canvas.clientHeight;
        canvas.width = Math.floor(W * DPR);
        canvas.height = Math.floor(H * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize(); window.addEventListener('resize', resize);

    // 低分辨率缓冲区（像素化）
    const buf = document.createElement('canvas');
    const bctx = buf.getContext('2d');
    function resizeBuffer() {
        const SCALE = 8;                   // ↑值越大，像素块越小（原 5 → 8）
        const bw = Math.max(220, Math.round(W / SCALE));
        const bh = Math.max(160, Math.round(H / SCALE));
        buf.width = bw; buf.height = bh;
    }
    resizeBuffer(); window.addEventListener('resize', resizeBuffer);

    // 鼠标微视差（更轻）
    let mx = W / 2, my = H / 2;
    function onMove(e) {
        const p = e.touches ? e.touches[0] : e;
        const r = canvas.getBoundingClientRect();
        mx = p.clientX - r.left; my = p.clientY - r.top;
    }
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });

    const PALETTE = [
        [255, 255, 255], [176, 230, 255], [199, 174, 255],
        [167, 255, 231], [154, 209, 255]
    ];

    // 故障条/抖动（更慢更轻）
    let bandY = 0, bandVy = 0.15;   // 原 0.25 → 0.15 更慢
    let jitter = 0;
    let t0 = performance.now();

    function loop(t) {
        const dt = Math.min(32, t - t0); t0 = t;

        // 1) 像素雪花（更稀疏）
        const bw = buf.width, bh = buf.height;
        const img = bctx.createImageData(bw, bh);
        const data = img.data;

        for (let i = 0; i < bw * bh; i++) {
            if (Math.random() < 0.035) { // 原 0.06 → 0.035 更稀
                const c = PALETTE[(Math.random() * PALETTE.length) | 0];
                const a = 140 + (Math.random() * 100) | 0;
                const idx = i * 4;
                data[idx] = c[0];
                data[idx + 1] = c[1];
                data[idx + 2] = c[2];
                data[idx + 3] = a;
            } else {
                const idx = i * 4;
                const v = 8 + (Math.random() * 10) | 0;
                data[idx] = v;
                data[idx + 1] = v + 4;
                data[idx + 2] = v + 12;
                data[idx + 3] = 255;
            }
        }

        // 2) 故障横条（更慢）
        bandY += bandVy * dt * 0.06;
        if (bandY > bh) bandY = -10;
        const bandH = 6;
        for (let y = Math.max(0, bandY | 0); y < Math.min(bh, (bandY + bandH) | 0); y++) {
            for (let x = 0; x < bw; x++) {
                const idx = (y * bw + x) * 4;
                data[idx] = Math.min(255, data[idx] + 24);
                data[idx + 1] = Math.min(255, data[idx + 1] + 40);
                data[idx + 2] = Math.min(255, data[idx + 2] + 32);
            }
        }

        // 3) 偶发横向抖动（更少更小）
        if (Math.random() < 0.02) jitter = (Math.random() < .5 ? -1 : 1) * 1;
        else jitter *= 0.9;

        bctx.putImageData(img, 0, 0);

        // 4) 放大到主画布（禁用平滑）+ 轻视差
        ctx.clearRect(0, 0, W, H);
        ctx.imageSmoothingEnabled = false;

        const parX = (mx - W / 2) * 0.004;  // 原 0.006 → 0.004
        const parY = (my - H / 2) * 0.004;
        const drawW = W + 40, drawH = H + 40;

        ctx.drawImage(
            buf,
            Math.max(0, -jitter), 0, Math.max(1, buf.width - Math.abs(jitter)), buf.height,
            -20 + parX, -20 + parY, drawW, drawH
        );

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
})();

// ========= 单行标题：5 秒后倾斜 + 鼠标 3D 微跟随 =========
(function () {
    const title = document.querySelector('.glitch-title');
    const landing = document.getElementById('landing');
    if (!title || !landing) return;

    setTimeout(() => { title.classList.add('tilt'); }, 5000);

    landing.addEventListener('mousemove', (e) => {
        const r = landing.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        title.style.setProperty('--ry', `${x * 6}deg`);
        title.style.setProperty('--rx', `${-y * 4}deg`);
        title.classList.add('hover-tilt');
    }, { passive: true });
})();

// ---- Tiny Typewriter for [data-typewriter] ----
(function () {
    const el = document.querySelector('[data-typewriter]');
    if (!el) return;
    const text = el.textContent;
    el.textContent = '';
    let i = 0;
    const speed = 12; // 打字速度，越大越快
    function tick() {
        i += Math.max(1, Math.round(Math.random() * 2));
        el.textContent = text.slice(0, i);
        if (i < text.length) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
})();

// ---- Projects: fullscreen stickers + UC toggle ----
(function () {
    const isProjects = document.body.classList.contains('projects');
    if (!isProjects) return;

    // === 1) 生成贴纸：随机散布两侧 & 上下，保持留白不挡内容 ===
    const host = document.getElementById('rw-deco');
    if (host) {
        const types = ['stk-globe', 'stk-cd', 'stk-win', 'stk-msg', 'stk-cursor', 'stk-bubble'];
        const count = Math.max(8, Math.min(16, Math.round(window.innerWidth / 140))); // 自适应数量
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = `sticker ${types[i % types.length]} ${i < 3 ? 'is-core' : ''}`;
            // 分布：左右 15% 区域优先，少量随机在中区边缘；上下避开导航和页脚
            const side = Math.random() < 0.5 ? 0.12 : 0.85; // 左/右
            const x = (Math.random() * 0.18 + (side === 0.12 ? 0.02 : 0.80)) * window.innerWidth;
            const y = (Math.random() * (window.innerHeight - 240)) + 120; // 避开顶部/底部
            const r = (Math.random() * 18 - 9).toFixed(1) + 'deg';

            el.style.setProperty('--x', x + 'px');
            el.style.setProperty('--y', y + 'px');
            el.style.setProperty('--r', r);
            // 轻微错峰动画
            el.style.animationDelay = (Math.random() * 6).toFixed(2) + 's';
            host.appendChild(el);
        }
        // 视口变化时重布
        window.addEventListener('resize', () => {
            host.innerHTML = '';
            // 轻防抖
            clearTimeout(window.__st_r);
            window.__st_r = setTimeout(() => {
                const evt = new Event('DOMContentLoaded'); document.dispatchEvent(evt);
            }, 120);
        }, { passive: true });
    }

    // === 2) Under Construction 开关 ===
    const toggle = document.querySelector('.uc-toggle');
    const badge = document.querySelector('.uc-badge');
    if (toggle && badge) {
        const KEY = 'uc_badge_on';
        const apply = (on) => { badge.classList.toggle('on', !!on); localStorage.setItem(KEY, on ? '1' : '0'); };
        apply(localStorage.getItem(KEY) === '1');
        toggle.addEventListener('click', () => apply(!badge.classList.contains('on')));
    }
})();

// ===== Projects 列表页：全屏贴纸 + UC 开关 =====
(function () {
    if (!document.body.classList.contains('projects')) return;

    // 1) 生成贴纸
    const host = document.getElementById('rw-deco');
    if (host) {
        const types = ['stk-globe', 'stk-cd', 'stk-win', 'stk-msg', 'stk-cursor'];
        const count = Math.max(10, Math.min(18, Math.round(window.innerWidth / 120)));
        const render = () => {
            host.innerHTML = '';
            for (let i = 0; i < count; i++) {
                const el = document.createElement('div');
                el.className = `sticker ${types[i % types.length]} ${i < 3 ? 'is-core' : ''}`;
                const side = Math.random() < 0.5 ? 0.12 : 0.85;
                const x = (Math.random() * 0.18 + (side === 0.12 ? 0.02 : 0.80)) * window.innerWidth;
                const y = (Math.random() * (window.innerHeight - 260)) + 120;
                el.style.setProperty('--x', x + 'px');
                el.style.setProperty('--y', y + 'px');
                el.style.setProperty('--r', ((Math.random() * 18 - 9).toFixed(1)) + 'deg');
                el.style.animationDelay = (Math.random() * 6).toFixed(2) + 's';
                host.appendChild(el);
            }
        };
        render();
        window.addEventListener('resize', () => { clearTimeout(window.__rwR); window.__rwR = setTimeout(render, 120); }, { passive: true });
    }

    // 2) UC 开关
    const toggle = document.querySelector('.uc-toggle');
    const badge = document.querySelector('.uc-badge');
    if (toggle && badge) {
        const KEY = 'uc_badge_on';
        const apply = on => { badge.classList.toggle('on', !!on); localStorage.setItem(KEY, on ? '1' : '0'); };
        apply(localStorage.getItem(KEY) === '1');
        toggle.addEventListener('click', () => apply(!badge.classList.contains('on')));
    }
})();

// ===== DaFeng：火焰 + 火星 =====
(function () {
    if (!document.body.classList.contains('dafeng')) return;
    const host = document.getElementById('fx-dafeng');
    if (!host) return;
    const W = window.innerWidth;
    const flames = Math.max(12, Math.min(26, Math.round(W / 70)));
    for (let i = 0; i < flames; i++) {
        const f = document.createElement('div');
        f.className = 'flame';
        const x = (i / (flames - 1)) * 100; // 均匀分布
        f.style.left = `calc(${x}% - 6px)`;
        f.style.setProperty('--i', i);
        host.appendChild(f);
    }
    // 火星
    for (let i = 0; i < 18; i++) {
        const s = document.createElement('div');
        s.className = 'spark';
        s.style.left = (Math.random() * 100) + '%';
        s.style.animationDelay = (Math.random() * 2.6) + 's';
        host.appendChild(s);
    }
})();

// ===== Fog City：漂落药片/胶囊 =====
(function () {
    if (!document.body.classList.contains('fogcity')) return;
    const host = document.getElementById('fx-fog');
    if (!host) return;
    const n = Math.max(16, Math.min(32, Math.round(window.innerWidth / 60)));
    for (let i = 0; i < n; i++) {
        const el = document.createElement('div');
        const isCapsule = Math.random() < 0.55;
        el.className = isCapsule ? 'capsule' : 'pill';
        el.style.left = (Math.random() * 100) + '%';
        el.style.top = (-10 - Math.random() * 80) + 'vh';
        el.style.animationDuration = (10 + Math.random() * 10) + 's';
        el.style.transform = `rotate(${(Math.random() * 360) | 0}deg)`;
        host.appendChild(el);
    }
})();

// ===== Dream no more：气泡 + 弹窗 =====
(function () {
    if (!document.body.classList.contains('dreampool')) return;
    const host = document.getElementById('fx-pool');
    if (!host) return;

    // 气泡
    const bubbles = Math.max(22, Math.min(40, Math.round(window.innerWidth / 40)));
    for (let i = 0; i < bubbles; i++) {
        const b = document.createElement('div');
        b.className = 'bubble-fx';
        b.style.left = (Math.random() * 100) + '%';
        b.style.bottom = (-10 - Math.random() * 30) + 'vh';
        b.style.setProperty('--s', (6 + Math.random() * 16) + 'px');
        b.style.setProperty('--dur', (10 + Math.random() * 10) + 's');
        b.style.opacity = 0.45 + Math.random() * 0.25;
        host.appendChild(b);
    }

    // 弹窗（old-web）
    const titles = ['Info', 'Notice', 'Pool.exe', 'Dream msg'];
    const bodies = [
        'You feel a quiet pressure.',
        'Corridor loops ahead.',
        'Press F to push the swing.',
        'No jumpscare. Just space.'
    ];
    const popN = 3;
    for (let i = 0; i < popN; i++) {
        const p = document.createElement('div');
        p.className = 'popup';
        p.style.left = (10 + Math.random() * 70) + '%';
        p.style.top = (15 + Math.random() * 40) + '%';
        p.innerHTML = `<div class="bar"><span class="dot"></span><span class="title">${titles[i % titles.length]}</span></div>
                   <div class="body">${bodies[i % bodies.length]}</div>`;
        p.style.animationDelay = (Math.random() * 4) + 's';
        host.appendChild(p);
    }
})();

/* ===== Projects：全屏贴纸 + UC 开关 ===== */
(function () {
    if (!document.body.classList.contains('projects')) return;

    // 贴纸
    const host = document.getElementById('rw-deco');
    if (host) {
        const types = ['stk-globe', 'stk-cd', 'stk-win', 'stk-msg', 'stk-cursor'];
        const count = Math.max(12, Math.min(22, Math.round(window.innerWidth / 110)));
        const render = () => {
            host.innerHTML = '';
            for (let i = 0; i < count; i++) {
                const el = document.createElement('div');
                el.className = `sticker ${types[i % types.length]}`;
                // 两侧/上下边缘优先
                const side = Math.random() < 0.5 ? 0.12 : 0.85;
                const x = (Math.random() * 0.18 + (side === 0.12 ? 0.02 : 0.80)) * window.innerWidth;
                const y = (Math.random() * (window.innerHeight - 260)) + 120;
                el.style.setProperty('--x', x + 'px');
                el.style.setProperty('--y', y + 'px');
                el.style.setProperty('--r', (Math.random() * 18 - 9).toFixed(1) + 'deg');
                el.style.animationDelay = (Math.random() * 6).toFixed(2) + 's';
                host.appendChild(el);
            }
        };
        render();
        window.addEventListener('resize', () => {
            clearTimeout(window.__rwR);
            window.__rwR = setTimeout(render, 120);
        }, { passive: true });
    }

    // UC 开关（按钮、条幅、ESC；状态持久化）
    const badge = document.getElementById('uc-badge');
    const btn = document.querySelector('.uc-toggle');
    const close = document.querySelector('.uc-close');
    if (badge && btn) {
        const KEY = 'uc_badge_on';
        const apply = (on) => {
            badge.classList.toggle('on', !!on);
            btn.setAttribute('aria-expanded', on ? 'true' : 'false');
            localStorage.setItem(KEY, on ? '1' : '0');
        };
        apply(localStorage.getItem(KEY) === '1');

        const toggle = () => apply(!badge.classList.contains('on'));
        btn.addEventListener('click', toggle);
        if (close) close.addEventListener('click', toggle);
        badge.addEventListener('click', toggle);   // 点击条幅也能关
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape') apply(false); });
    }
})();

/* ===== DaFeng：火焰 + 火星 ===== */
(function () {
    if (!document.body.classList.contains('dafeng')) return;
    const host = document.getElementById('fx-dafeng');
    if (!host) return;

    const W = window.innerWidth;
    const n = Math.max(9, Math.min(14, Math.round(W / 160))); // 更少、更像供火
    for (let i = 0; i < n; i++) {
        const f = document.createElement('div');
        f.className = 'flame';
        const leftPct = (i / (n - 1)) * 100;
        const w = 10 + Math.random() * 10; // 10-20px
        const h = 48 + Math.random() * 30; // 48-78px
        const t = (1.8 + Math.random() * .9).toFixed(2) + 's';
        f.style.left = `calc(${leftPct}% - ${w / 2}px)`;
        f.style.setProperty('--w', w + 'px');
        f.style.setProperty('--h', h + 'px');
        f.style.setProperty('--t', t);
        host.appendChild(f);
    }
    // 火星
    for (let i = 0; i < 16; i++) {
        const s = document.createElement('div');
        s.className = 'spark';
        s.style.left = (Math.random() * 100) + '%';
        s.style.animationDelay = (Math.random() * 2.6) + 's';
        host.appendChild(s);
    }
})();

/* ===== Fog City：药片/胶囊落下 ===== */
(function () {
    if (!document.body.classList.contains('fogcity')) return;
    const host = document.getElementById('fx-fog');
    if (!host) return;
    const n = Math.max(16, Math.min(30, Math.round(window.innerWidth / 60)));
    for (let i = 0; i < n; i++) {
        const el = document.createElement('div');
        const isCapsule = Math.random() < 0.55;
        el.className = isCapsule ? 'capsule' : 'pill';
        el.style.left = (Math.random() * 100) + '%';
        el.style.top = (-10 - Math.random() * 80) + 'vh';
        el.style.animationDuration = (10 + Math.random() * 10) + 's';
        el.style.transform = `rotate(${(Math.random() * 360) | 0}deg)`;
        host.appendChild(el);
    }
})();

/* ===== Dream no more：气泡 + 弹窗 ===== */
(function () {
    if (!document.body.classList.contains('dreampool')) return;
    const host = document.getElementById('fx-pool');
    if (!host) return;

    // 气泡
    const bubbles = Math.max(22, Math.min(38, Math.round(window.innerWidth / 42)));
    for (let i = 0; i < bubbles; i++) {
        const b = document.createElement('div');
        b.className = 'bubble-fx';
        b.style.left = (Math.random() * 100) + '%';
        b.style.bottom = (-10 - Math.random() * 30) + 'vh';
        b.style.setProperty('--s', (6 + Math.random() * 16) + 'px');
        b.style.setProperty('--dur', (10 + Math.random() * 10) + 's');
        b.style.opacity = (0.45 + Math.random() * 0.25).toFixed(2);
        host.appendChild(b);
    }

    // 弹窗
    const titles = ['Info', 'Notice', 'Pool.exe', 'Dream msg'];
    const bodies = [
        'You feel a quiet pressure.',
        'Corridor loops ahead.',
        'Press F to push the swing.',
        'No jumpscare. Just space.'
    ];
    const popN = 3;
    for (let i = 0; i < popN; i++) {
        const p = document.createElement('div');
        p.className = 'popup';
        p.style.left = (10 + Math.random() * 70) + '%';
        p.style.top = (15 + Math.random() * 40) + '%';
        p.innerHTML = `<div class="bar"><span class="dot"></span><span class="title">${titles[i % titles.length]}</span></div>
                   <div class="body">${bodies[i % bodies.length]}</div>`;
        p.style.animationDelay = (Math.random() * 4) + 's';
        host.appendChild(p);
    }
})();
/* ------------------------------
   Dream no more: 弹窗可拖动 + 置顶 + 关闭 + 点击水波纹
---------------------------------*/
(function () {
    if (!document.body.classList.contains('dreampool')) return;

    // 1) 拖动与置顶
    const makeDraggable = (popup) => {
        let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false, z = 10;
        const bar = popup.querySelector('.bar');
        popup.style.position = 'fixed';
        popup.style.zIndex = (++z).toString();

        const mdown = (e) => {
            dragging = true;
            const r = popup.getBoundingClientRect();
            sx = (e.touches ? e.touches[0].clientX : e.clientX);
            sy = (e.touches ? e.touches[0].clientY : e.clientY);
            ox = r.left; oy = r.top;
            popup.style.zIndex = (++z).toString(); // 置顶
            e.preventDefault();
        };
        const mmove = (e) => {
            if (!dragging) return;
            const x = (e.touches ? e.touches[0].clientX : e.clientX);
            const y = (e.touches ? e.touches[0].clientY : e.clientY);
            popup.style.left = Math.max(8, Math.min(window.innerWidth - popup.offsetWidth - 8, ox + (x - sx))) + 'px';
            popup.style.top = Math.max(56, Math.min(window.innerHeight - popup.offsetHeight - 8, oy + (y - sy))) + 'px';
        };
        const mup = () => dragging = false;
        bar.addEventListener('mousedown', mdown);
        bar.addEventListener('touchstart', mdown, { passive: false });
        window.addEventListener('mousemove', mmove, { passive: false });
        window.addEventListener('touchmove', mmove, { passive: false });
        window.addEventListener('mouseup', mup);
        window.addEventListener('touchend', mup);

        // 2) 关闭（双击标题栏）
        bar.addEventListener('dblclick', () => popup.remove());
    };
    document.querySelectorAll('.popup').forEach(makeDraggable);

    // 3) 点击水波纹
    const ripplesHost = document.body;
    const addRipple = (x, y) => {
        const r = document.createElement('div');
        r.className = 'click-ripple';
        r.style.left = x + 'px'; r.style.top = y + 'px';
        ripplesHost.appendChild(r);
        setTimeout(() => r.remove(), 1200);
    };
    document.addEventListener('click', (e) => {
        // 避免在 UI 上泛滥：仅空白或视频外区域制造水波
        const t = e.target;
        if (t.closest('.popup') || t.closest('nav') || t.closest('.footer')) return;
        addRipple(e.clientX, e.clientY);
    });
})();

/* ------------------------------
   Fog City: 顶部 EKG + 药片对鼠标轻避让
---------------------------------*/
(function () {
    if (!document.body.classList.contains('fogcity')) return;

    // 1) 动态 EKG SVG
    if (!document.querySelector('.ekg-line')) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('ekg-line'); svg.setAttribute('width', '100%'); svg.setAttribute('height', '40'); svg.setAttribute('viewBox', '0 0 1000 40');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        // 简化的锯齿波（旧网页味道）：
        path.setAttribute('d', 'M0 20 L120 20 L140 20 L160 6 L180 34 L200 20 L320 20 L340 20 L360 6 L380 34 L400 20 L520 20 L540 20 L560 6 L580 34 L600 20 L720 20 L740 20 L760 6 L780 34 L800 20 L920 20 L940 20 L960 6 L980 34 L1000 20');
        svg.appendChild(path); document.body.appendChild(svg);
    }

    // 2) 鼠标避让：靠近时轻微偏移，远离恢复
    const pills = Array.from(document.querySelectorAll('.pill, .capsule'));
    if (pills.length) {
        const repel = (mx, my) => {
            pills.forEach(el => {
                const r = el.getBoundingClientRect();
                const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
                const dx = cx - mx, dy = cy - my;
                const dist = Math.hypot(dx, dy) || 1;
                const radius = 120; // 作用半径
                const strength = 18; // 最大偏移
                let tx = 0, ty = 0;
                if (dist < radius) {
                    const k = (1 - dist / radius);
                    tx = (dx / dist) * strength * k;
                    ty = (dy / dist) * strength * k;
                }
                el.style.transform = `translate(${tx}px, ${ty}px) rotate(${(parseFloat(el.dataset.r) || 0)}deg)`;
            });
        };
        // 初始随机朝向
        pills.forEach(el => { const rot = (Math.random() * 360) | 0; el.dataset.r = rot; el.style.transform = `rotate(${rot}deg)`; });
        window.addEventListener('mousemove', (e) => repel(e.clientX, e.clientY), { passive: true });
    }
})();

/* ------------------------------
   DaFeng: 点击地面产生“火星喷溅”；印章轻视差
---------------------------------*/
(function () {
    if (!document.body.classList.contains('dafeng')) return;
    const host = document.getElementById('fx-dafeng');
    if (!host) return;

    // 点击低处时喷出几颗火星
    document.addEventListener('click', (e) => {
        const h = window.innerHeight;
        if (e.clientY < h * 0.65) return; // 只在靠近底部触发
        for (let i = 0; i < 6; i++) {
            const s = document.createElement('div');
            s.className = 'spark';
            s.style.left = (e.clientX + (Math.random() * 24 - 12)) + 'px';
            s.style.bottom = (h - e.clientY + 6) + 'px';
            s.style.animationDuration = (1.8 + Math.random() * 1.4) + 's';
            s.style.transform = `translateX(${Math.random() * 30 - 15}px)`;
            host.appendChild(s);
            setTimeout(() => s.remove(), 2800);
        }
    });

    // 印章视差
    const seal = document.querySelector('.seal');
    if (seal) {
        window.addEventListener('mousemove', (e) => {
            const nx = (e.clientX / window.innerWidth - .5);
            const ny = (e.clientY / window.innerHeight - .5);
            seal.style.transform = `translate(${nx * 6}px, ${ny * 4}px) rotate(${nx * 1.2}deg)`;
        }, { passive: true });
    }
})();

// ===== Showreel: 章节点击跳转（支持 YouTube 或本地 <video>） =====
(function () {
    if (!document.body.classList.contains('showreel')) return;

    const yt = document.querySelector('.sr-yt');
    const local = document.querySelector('.sr-local');

    // YouTube 跳转：用 postMessage 控制进度
    const seekYT = (sec) => {
        if (!yt) return;
        yt.contentWindow?.postMessage(JSON.stringify({
            event: 'command', func: 'seekTo', args: [sec, true]
        }), '*');
    };
    // HTML5 video 跳转
    const seekLocal = (sec) => {
        if (local) { local.currentTime = sec; local.play(); }
    };

    document.querySelectorAll('.sr-chapters [data-t]').forEach(li => {
        li.addEventListener('click', () => {
            const t = parseFloat(li.dataset.t || '0');
            if (yt) seekYT(t); else seekLocal(t);
        });
    });

    // 键盘 K/Space 播放暂停（本地视频时生效）
    document.addEventListener('keydown', (e) => {
        if (!local) return;
        if (e.key === 'k' || e.code === 'Space') {
            e.preventDefault();
            local.paused ? local.play() : local.pause();
        }
    });
})();

// ===== Projects/Showreel 共用：随机贴纸背景（已在 projects 用，这里让 showreel 也启用） =====
(function () {
    if (!(document.body.classList.contains('projects') || document.body.classList.contains('showreel'))) return;
    const host = document.getElementById('rw-deco'); if (!host) return;
    const types = ['stk-globe', 'stk-cd', 'stk-win', 'stk-msg', 'stk-cursor'];
    const base = document.body.classList.contains('showreel') ? 10 : 14;
    const count = Math.max(base, Math.min(base + 8, Math.round(window.innerWidth / 120)));
    const render = () => {
        host.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = `sticker ${types[i % types.length]}`;
            const side = Math.random() < 0.5 ? 0.12 : 0.85;
            const x = (Math.random() * 0.18 + (side === 0.12 ? 0.02 : 0.80)) * window.innerWidth;
            const y = (Math.random() * (window.innerHeight - 260)) + 120;
            el.style.setProperty('--x', x + 'px');
            el.style.setProperty('--y', y + 'px');
            el.style.setProperty('--r', ((Math.random() * 18 - 9).toFixed(1)) + 'deg');
            el.style.animationDelay = (Math.random() * 6).toFixed(2) + 's';
            host.appendChild(el);
        }
    };
    render();
    window.addEventListener('resize', () => { clearTimeout(window.__srR); window.__srR = setTimeout(render, 120); }, { passive: true });
})();

/* ===== Showreel：贴纸 + VHS HUD + 控制条 & 键盘 + 章节跳转 ===== */
(function () {
    if (!document.body.classList.contains('showreel')) return;

    // 1) 边缘贴纸（复用 projects 的生成器）
    const decoHost = document.getElementById('rw-deco');
    if (decoHost) {
        const types = ['stk-globe', 'stk-cd', 'stk-win', 'stk-msg', 'stk-cursor'];
        const count = Math.max(10, Math.min(16, Math.round(window.innerWidth / 130)));
        const render = () => {
            decoHost.innerHTML = '';
            for (let i = 0; i < count; i++) {
                const el = document.createElement('div'); el.className = `sticker ${types[i % types.length]}`;
                const side = Math.random() < 0.5 ? 0.12 : 0.85;
                const x = (Math.random() * 0.18 + (side === 0.12 ? 0.02 : 0.80)) * window.innerWidth;
                const y = (Math.random() * (window.innerHeight - 260)) + 120;
                el.style.setProperty('--x', x + 'px'); el.style.setProperty('--y', y + 'px'); el.style.setProperty('--r', ((Math.random() * 18 - 9).toFixed(1)) + 'deg');
                el.style.animationDelay = (Math.random() * 6).toFixed(2) + 's';
                decoHost.appendChild(el);
            }
        };
        render(); window.addEventListener('resize', () => { clearTimeout(window.__srDeco); window.__srDeco = setTimeout(render, 120); }, { passive: true });
    }

    const player = document.getElementById('srPlayer');
    const yt = document.querySelector('.sr-yt');
    const local = document.querySelector('.sr-local');
    const timeHUD = document.getElementById('hudTime');

    // 2) HUD 时间码（本地 video 时可读；YouTube 用计时器）
    const toTC = s => {
        s = Math.max(0, Math.floor(s || 0));
        const m = String(Math.floor(s / 60)).padStart(2, '0');
        const ss = String(s % 60).padStart(2, '0');
        return `${m}:${ss}`;
    };
    if (local) {
        local.addEventListener('timeupdate', () => timeHUD.textContent = toTC(local.currentTime));
    } else {
        // 简易每秒自增（YT 控制台也会被 seekTo 替换）
        let sec = 0; timeHUD.textContent = '00:00';
        setInterval(() => { sec = (sec + 1) % 5999; timeHUD.textContent = toTC(sec); }, 1000);
    }

    // 3) 控制：播放/静音/遮幅/CRT
    const postYT = (obj) => yt?.contentWindow?.postMessage(JSON.stringify(obj), '*');
    const playToggle = () => {
        if (local) { local.paused ? local.play() : local.pause(); }
        else { postYT({ event: 'command', func: 'playVideo' }); } // 无法读状态时，触发播放即可
    };
    const muteToggle = () => {
        if (local) { local.muted = !local.muted; }
        else { postYT({ event: 'command', func: 'mute' }); } // 只能强制静音
    };
    const aspectToggle = () => player.classList.toggle('is-scope');
    const crtToggle = () => document.body.classList.toggle('crt'); // 利用全站 CRT class

    document.querySelectorAll('.sr-controls .c-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const act = btn.dataset.act;
            if (act === 'play') playToggle();
            if (act === 'mute') muteToggle();
            if (act === 'aspect') aspectToggle();
            if (act === 'crt') crtToggle();
        });
    });

    // 键盘：K/空格 播放，M 静音，A 遮幅，C CRT
    document.addEventListener('keydown', (e) => {
        if (e.target.closest('input,textarea')) return;
        if (e.key === 'k' || e.code === 'Space') { e.preventDefault(); playToggle(); }
        if (e.key.toLowerCase() === 'm') { muteToggle(); }
        if (e.key.toLowerCase() === 'a') { aspectToggle(); }
        if (e.key.toLowerCase() === 'c') { crtToggle(); }
    });

    // 4) 章节点击跳转（兼容 YT / 本地）
    const seekYT = (sec) => postYT({ event: 'command', func: 'seekTo', args: [sec, true] });
    const seekLocal = (sec) => { if (local) { local.currentTime = sec; local.play(); } };
    document.querySelectorAll('.sr-chapters [data-t]').forEach(li => {
        li.addEventListener('click', () => {
            const t = parseFloat(li.dataset.t || '0');
            yt ? seekYT(t) : seekLocal(t);
        });
    });

    // 5) 轻微水波与视差（鼠标移动）
    const water = player.querySelector('.sr-waterlight');
    const ring = player.querySelector('.sr-sticker.ring');
    const bubble = player.querySelector('.sr-sticker.bubble');
    const parallax = (x, y) => {
        const nx = (x / window.innerWidth - .5);
        const ny = (y / window.innerHeight - .5);
        water.style.transform = `translate(${nx * 6}px, ${ny * 4}px)`;
        ring.style.transform = `translate(${nx * 10}px, ${ny * 6}px)`;
        bubble.style.transform = `translate(${nx * 12}px, ${ny * 8}px)`;
    };
    window.addEventListener('mousemove', (e) => parallax(e.clientX, e.clientY), { passive: true });
})();

/* ===== About：贴纸 + Bio 切换（状态记忆） ===== */
(function () {
    if (!document.body.classList.contains('about')) return;

    // 边缘贴纸（与 projects/showreel 同风格）
    const decoHost = document.getElementById('rw-deco');
    if (decoHost) {
        const types = ['stk-globe', 'stk-cd', 'stk-win', 'stk-msg', 'stk-cursor'];
        const count = Math.max(10, Math.min(18, Math.round(window.innerWidth / 120)));
        const render = () => {
            decoHost.innerHTML = '';
            for (let i = 0; i < count; i++) {
                const el = document.createElement('div');
                el.className = `sticker ${types[i % types.length]}`;
                const side = Math.random() < 0.5 ? 0.12 : 0.85;
                const x = (Math.random() * 0.18 + (side === 0.12 ? 0.02 : 0.80)) * window.innerWidth;
                const y = (Math.random() * (window.innerHeight - 260)) + 120;
                el.style.setProperty('--x', x + 'px'); el.style.setProperty('--y', y + 'px'); el.style.setProperty('--r', ((Math.random() * 18 - 9).toFixed(1)) + 'deg');
                el.style.animationDelay = (Math.random() * 6).toFixed(2) + 's';
                decoHost.appendChild(el);
            }
        };
        render(); window.addEventListener('resize', () => { clearTimeout(window.__abDeco); window.__abDeco = setTimeout(render, 120); }, { passive: true });
    }

    // Bio 切换
    const micro = document.getElementById('bioMicro');
    const std = document.getElementById('bioStd');
    const KEY = 'about_bio_mode'; // micro | std

    const apply = (mode) => {
        const isStd = (mode === 'std');
        micro.classList.toggle('is-hidden', isStd);
        std.classList.toggle('is-hidden', !isStd);
        std.setAttribute('aria-hidden', (!isStd).toString());
        localStorage.setItem(KEY, isStd ? 'std' : 'micro');
    };

    // 初始模式
    apply(localStorage.getItem(KEY) || 'micro');

    // 按钮绑定
    document.querySelectorAll('.bio-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target; // std | micro
            apply(target === 'std' ? 'std' : 'micro');
        });
    });
})();

// About 头像轻视差
(function () {
    if (!document.body.classList.contains('about')) return;
    const card = document.querySelector('.avatar-card .avatar-wrap');
    if (!card) return;
    const tilt = (x, y) => {
        const r = card.getBoundingClientRect();
        const nx = (x - (r.left + r.width / 2)) / (r.width / 2);
        const ny = (y - (r.top + r.height / 2)) / (r.height / 2);
        card.style.transform = `rotateX(${-ny * 4}deg) rotateY(${nx * 4}deg) translateZ(0)`;
    };
    window.addEventListener('mousemove', (e) => tilt(e.clientX, e.clientY), { passive: true });
    window.addEventListener('mouseleave', () => card.style.transform = 'translateZ(0)');
})();

/* ===== About: 聊天框模式切换 + 贴纸 ===== */
(function () {
    if (!document.body.classList.contains('about')) return;

    // 边缘贴纸
    const deco = document.getElementById('rw-deco');
    if (deco) {
        const types = ['stk-globe', 'stk-cd', 'stk-win', 'stk-msg', 'stk-cursor'];
        const count = Math.max(10, Math.min(18, Math.round(window.innerWidth / 120)));
        const render = () => {
            deco.innerHTML = '';
            for (let i = 0; i < count; i++) {
                const el = document.createElement('div');
                el.className = `sticker ${types[i % types.length]}`;
                const side = Math.random() < 0.5 ? 0.12 : 0.85;
                const x = (Math.random() * 0.18 + (side === 0.12 ? 0.02 : 0.80)) * window.innerWidth;
                const y = (Math.random() * (window.innerHeight - 260)) + 120;
                el.style.setProperty('--x', x + 'px');
                el.style.setProperty('--y', y + 'px');
                el.style.setProperty('--r', ((Math.random() * 18 - 9).toFixed(1)) + 'deg');
                el.style.animationDelay = (Math.random() * 6).toFixed(2) + 's';
                deco.appendChild(el);
            }
        };
        render();
        window.addEventListener('resize', () => { clearTimeout(window.__abR); window.__abR = setTimeout(render, 120); }, { passive: true });
    }

    // 聊天内容切换
    const KEY = 'about_chat_mode'; // micro | std
    const micro = document.getElementById('threadMicro');
    const std = document.getElementById('threadStd');
    const typing = document.getElementById('typing');

    const apply = (mode) => {
        const isStd = mode === 'std';
        micro.classList.toggle('is-hidden', isStd);
        std.classList.toggle('is-hidden', !isStd);
        std.setAttribute('aria-hidden', (!isStd).toString());
        localStorage.setItem(KEY, mode);
    };

    // 初始模式
    apply(localStorage.getItem(KEY) || 'micro');

    // 切换按钮（标题栏与底栏）
    document.querySelectorAll('.bio-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target === 'std' ? 'std' : 'micro';
            // 打字指示
            typing.classList.remove('is-hidden');
            setTimeout(() => {
                typing.classList.add('is-hidden');
                apply(target);
            }, 800);
        });
    });
})();

/* ===== About：EN/CN 切换修复 + 彩蛋 + 头像放大 ===== */
(function () {
    if (!document.body.classList.contains('about')) return;

    /* ------ 贴纸（沿用你站内生成逻辑） ------ */
    const deco = document.getElementById('rw-deco');
    if (deco) {
        const types = ['stk-globe', 'stk-cd', 'stk-win', 'stk-msg', 'stk-cursor'];
        const count = Math.max(10, Math.min(18, Math.round(window.innerWidth / 120)));
        const render = () => {
            deco.innerHTML = '';
            for (let i = 0; i < count; i++) {
                const el = document.createElement('div');
                el.className = `sticker ${types[i % types.length]}`;
                const side = Math.random() < 0.5 ? 0.12 : 0.85;
                const x = (Math.random() * 0.18 + (side === 0.12 ? 0.02 : 0.80)) * window.innerWidth;
                const y = (Math.random() * (window.innerHeight - 260)) + 120;
                el.style.setProperty('--x', x + 'px'); el.style.setProperty('--y', y + 'px'); el.style.setProperty('--r', ((Math.random() * 18 - 9).toFixed(1)) + 'deg');
                el.style.animationDelay = (Math.random() * 6).toFixed(2) + 's';
                deco.appendChild(el);
            }
        };
        render();
        window.addEventListener('resize', () => { clearTimeout(window.__abR); window.__abR = setTimeout(render, 120); }, { passive: true });
    }

    /* ------ EN/CN 切换（保证可用 & 记忆） ------ */
    const KEY = 'about_chat_mode'; // micro | std
    const micro = document.getElementById('threadMicro');
    const std = document.getElementById('threadStd');
    const typing = document.getElementById('typing');

    const apply = (mode) => {
        const isStd = (mode === 'std');
        micro?.classList.toggle('is-hidden', isStd);
        std?.classList.toggle('is-hidden', !isStd);
        std?.setAttribute('aria-hidden', (!isStd).toString());
        localStorage.setItem(KEY, mode);
    };
    apply(localStorage.getItem(KEY) || 'micro');

    // 用事件委托，防止按钮选择器对不上
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.bio-toggle');
        if (!btn) return;
        const target = btn.dataset.target === 'std' ? 'std' : 'micro';
        typing?.classList.remove('is-hidden');
        setTimeout(() => { typing?.classList.add('is-hidden'); apply(target); }, 800);
    });

    /* ------ 彩蛋：来电提示 / 震屏 / MSN Toast ------ */
    const banner = document.getElementById('callBanner');
    const toast = document.getElementById('msnToast');

    function showBanner() {
        if (!banner) return;
        banner.classList.add('on');
        banner.setAttribute('aria-hidden', 'false');
    }
    function hideBanner() {
        if (!banner) return;
        banner.classList.remove('on');
        banner.setAttribute('aria-hidden', 'true');
    }
    function screenShake() {
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 650);
    }
    function showToast(text) {
        if (!toast) return;
        if (text) toast.querySelector('.mt-body').textContent = text;
        toast.classList.add('on'); toast.setAttribute('aria-hidden', 'false');
        setTimeout(() => { toast.classList.remove('on'); toast.setAttribute('aria-hidden', 'true'); }, 3200);
    }

    // 按钮触发
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.egg');
        if (!btn) return;
        const act = btn.dataset.act;
        if (act === 'call') { showBanner(); screenShake(); }
        if (act === 'shake') { screenShake(); }
        if (act === 'toast') { showToast('You have 1 new nudge.'); }
    });
    // 来电条“接听/挂断”
    banner?.querySelector('.accept')?.addEventListener('click', () => { hideBanner(); showToast('Call connected. (fake)'); });
    banner?.querySelector('.decline')?.addEventListener('click', () => { hideBanner(); showToast('Call declined.'); });

    // 页面载入 4 秒后自动来电一次（可删）
    setTimeout(showBanner, 4000);

    /* ------ 头像 Lightbox ------ */
    const avBtn = document.getElementById('avatarBtn');
    const modal = document.getElementById('avatarModal');
    const close = modal?.querySelector('.av-close');
    const backdrop = modal?.querySelector('.av-backdrop');

    function openAv() { modal?.classList.add('on'); modal?.setAttribute('aria-hidden', 'false'); }
    function closeAv() { modal?.classList.remove('on'); modal?.setAttribute('aria-hidden', 'true'); }

    avBtn?.addEventListener('click', openAv);
    close?.addEventListener('click', closeAv);
    backdrop?.addEventListener('click', closeAv);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAv(); });
})();

/* ===== About：EN/CN 切换 + 彩蛋 + 头像自然放大 ===== */
(function () {
    if (!document.body.classList.contains('about')) return;

    // —— EN/CN 切换（记忆状态 + 打字动画）
    const KEY = 'about_chat_mode';
    const micro = document.getElementById('threadMicro');
    const std = document.getElementById('threadStd');
    const typing = document.getElementById('typing');

    function apply(mode) {
        const isStd = (mode === 'std');
        micro?.classList.toggle('is-hidden', isStd);
        std?.classList.toggle('is-hidden', !isStd);
        std?.setAttribute('aria-hidden', (!isStd).toString());
        localStorage.setItem(KEY, mode);
    }
    apply(localStorage.getItem(KEY) || 'micro');

    // 用 document 级委托，防止绑定不到
    document.addEventListener('click', (e) => {
        const t = e.target;

        // 切换 Bio
        const toggle = t.closest?.('.bio-toggle');
        if (toggle) {
            const target = toggle.dataset.target === 'std' ? 'std' : 'micro';
            typing?.classList.remove('is-hidden');
            setTimeout(() => { typing?.classList.add('is-hidden'); apply(target); }, 800);
            return;
        }

        // 彩蛋按钮
        const egg = t.closest?.('.egg');
        if (egg) {
            const act = egg.dataset.act;
            if (act === 'call') showBanner(), screenShake();
            if (act === 'shake') screenShake();
            if (act === 'toast') showToast('You have 1 new nudge.');
            return;
        }

        // 头像：点击放大/收起
        if (t.id === 'avatarBtn') {
            document.body.classList.add('avatar-open');
            document.getElementById('avatarBackdrop')?.setAttribute('aria-hidden', 'false');
            return;
        }
        if (t.id === 'avatarBackdrop') {
            closeAvatar();
            return;
        }
    });

    // ESC 关闭头像放大
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAvatar(); });

    function closeAvatar() {
        document.body.classList.remove('avatar-open');
        document.getElementById('avatarBackdrop')?.setAttribute('aria-hidden', 'true');
    }

    // —— 彩蛋：来电提示条 / 震屏 / MSN Toast
    const banner = document.getElementById('callBanner');
    const toast = document.getElementById('msnToast');

    function showBanner() {
        if (!banner) return;
        banner.classList.add('on');
        banner.setAttribute('aria-hidden', 'false');
        // 绑定接听/挂断（只绑定一次）
        banner.querySelector('.accept')?.addEventListener('click', () => { hideBanner(); showToast('Call connected. (fake)'); }, { once: true });
        banner.querySelector('.decline')?.addEventListener('click', () => { hideBanner(); showToast('Call declined.'); }, { once: true });
    }
    function hideBanner() { banner?.classList.remove('on'); banner?.setAttribute('aria-hidden', 'true'); }
    function screenShake() { document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 650); }
    function showToast(text) {
        if (!toast) return;
        const body = toast.querySelector('.mt-body'); if (body && text) body.textContent = text;
        toast.classList.add('on'); toast.setAttribute('aria-hidden', 'false');
        setTimeout(() => { toast.classList.remove('on'); toast.setAttribute('aria-hidden', 'true'); }, 3200);
    }

    // 可关：自动来电
    setTimeout(showBanner, 4000);

    // —— 边缘贴纸（与全站一致）
    const deco = document.getElementById('rw-deco');
    if (deco) {
        const types = ['stk-globe', 'stk-cd', 'stk-win', 'stk-msg', 'stk-cursor'];
        const count = Math.max(10, Math.min(18, Math.round(window.innerWidth / 120)));
        const render = () => {
            deco.innerHTML = '';
            for (let i = 0; i < count; i++) {
                const el = document.createElement('div');
                el.className = `sticker ${types[i % types.length]}`;
                const side = Math.random() < 0.5 ? 0.12 : 0.85;
                const x = (Math.random() * 0.18 + (side === 0.12 ? 0.02 : 0.80)) * window.innerWidth;
                const y = (Math.random() * (window.innerHeight - 260)) + 120;
                el.style.setProperty('--x', x + 'px');
                el.style.setProperty('--y', y + 'px');
                el.style.setProperty('--r', ((Math.random() * 18 - 9).toFixed(1)) + 'deg');
                el.style.animationDelay = (Math.random() * 6).toFixed(2) + 's';
                deco.appendChild(el);
            }
        };
        render();
        window.addEventListener('resize', () => { clearTimeout(window.__abR); window.__abR = setTimeout(render, 120); }, { passive: true });
    }
})();
