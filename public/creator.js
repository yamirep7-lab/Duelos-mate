// public/creator.js  (versión 3: estudio 3D)
// Interfaz del creador. Requiere shared/characters.js cargado antes (window.Characters).
// Uso: Characters.mountCreator(elemento, { initial, unlocked, onSave, onUnlock })
(function () {
  const C = window.Characters;
  const PART_LABELS = { hair: 'Pelo', headgear: 'Cabeza', emblem: 'Emblema', cape: 'Capa', item: 'Objeto', outfit: 'Ropa' };
  const COLOR_LABELS = { suit: 'Traje', skin: 'Piel', accent: 'Accesorios', hairc: 'Pelo' };
  const TABS = [['models', 'Modelos'], ['body', 'Cuerpo'], ['color', 'Color']];
  const VIEWS = [['front', 'FRONT'], ['side', 'SIDE'], ['back', 'BACK']];

  const CSS = `
  .cc{font-family:Nunito,system-ui,sans-serif;color:#e8eaed;max-width:1040px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
  .cc *{box-sizing:border-box}
  .cc-studio{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:0;border:2px solid #000;border-radius:14px;overflow:hidden;background:#1b1d20;box-shadow:0 10px 30px rgba(0,0,0,.45)}
  @media(max-width:860px){.cc-studio{grid-template-columns:1fr}}
  .cc-menu{grid-column:1/-1;display:flex;gap:18px;align-items:center;padding:7px 14px;background:#2b2d31;border-bottom:1px solid #000;font-size:12px;color:#aab0b8}
  .cc-menu b{color:#e8eaed}.cc-menu .sp{flex:1}
  .cc-theme{display:flex;gap:4px}
  .cc-theme button{font:inherit;font-size:11px;font-weight:800;color:#c9ced6;background:#3a3d42;border:1px solid #000;border-radius:5px;padding:3px 10px;cursor:pointer}
  .cc-theme button.on{background:var(--g,#58cc02);color:#10210a}
  .cc-stage{position:relative;min-height:380px;padding:18px 18px 0;overflow:hidden;background:radial-gradient(ellipse at 50% 35%,#34383d 0%,#1c1e21 70%);transition:background .3s}
  .cc-stage.light{background:radial-gradient(ellipse at 50% 35%,#f3f5f7 0%,#b9c0c8 78%)}
  .cc-title{position:relative;z-index:2;font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;line-height:1.02;letter-spacing:.5px;text-transform:uppercase}
  .cc-title .t1{font-size:40px;color:#f1f3f5}.cc-title .t2{font-size:22px;color:#8d939b}
  .cc-stage.light .cc-title .t1{color:#1d2024}.cc-stage.light .cc-title .t2{color:#59616b}
  .cc-views{position:relative;z-index:2;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px}
  .cc-view{position:relative;display:flex;flex-direction:column;align-items:center}
  .cc-tag{align-self:flex-start;font-family:'Bebas Neue',Impact,sans-serif;font-size:17px;letter-spacing:1px;color:#d5d9de;border:1px solid #4a4f56;background:rgba(0,0,0,.35);border-radius:6px;padding:0 9px;margin-bottom:2px}
  .cc-stage.light .cc-tag{color:#2a2f36;border-color:#8b939c;background:rgba(255,255,255,.5)}
  .cc-fig{width:100%;max-width:230px;filter:drop-shadow(0 8px 10px rgba(0,0,0,.45))}
  .cc-fig svg{display:block;width:100%;height:auto}
  .cc-view:nth-child(1) .cc-fig{animation:ccbob 3.4s ease-in-out infinite}
  .cc-view:nth-child(2) .cc-fig{animation:ccbob 3.4s ease-in-out .3s infinite}
  .cc-view:nth-child(3) .cc-fig{animation:ccbob 3.4s ease-in-out .6s infinite}
  @keyframes ccbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
  @media(prefers-reduced-motion:reduce){.cc-fig{animation:none!important}}
  .cc-floor{position:absolute;z-index:1;left:-12%;right:-12%;bottom:-6px;height:52%;transform:perspective(240px) rotateX(62deg);transform-origin:50% 100%;
    background-image:linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px);background-size:20px 20px;
    -webkit-mask-image:radial-gradient(ellipse at 50% 60%,#000 25%,transparent 72%);mask-image:radial-gradient(ellipse at 50% 60%,#000 25%,transparent 72%)}
  .cc-stage.light .cc-floor{background-image:linear-gradient(rgba(0,0,0,.32) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.32) 1px,transparent 1px)}
  .cc-panel{background:#2a2c30;border-left:1px solid #000;display:flex;flex-direction:column;min-width:0}
  @media(max-width:860px){.cc-panel{border-left:0;border-top:1px solid #000}}
  .cc-tabs{display:flex;background:#232528;border-bottom:1px solid #000}
  .cc-tab{flex:1;font:inherit;font-size:13px;font-weight:800;color:#9aa0a8;background:transparent;border:0;border-bottom:3px solid transparent;padding:10px 6px;cursor:pointer}
  .cc-tab.on{color:#fff;background:#2a2c30;border-bottom-color:var(--g,#58cc02)}
  .cc-body{padding:14px;display:flex;flex-direction:column;gap:12px;max-height:470px;overflow:auto}
  .cc-btn{font:inherit;font-weight:800;color:#fff;background:var(--g,#58cc02);border:0;border-bottom:4px solid var(--gd,#46a302);border-radius:10px;padding:10px 16px;cursor:pointer}
  .cc-btn:active{transform:translateY(2px);border-bottom-width:2px}
  .cc-btn:disabled{opacity:.6}
  .cc-btn:focus-visible,.cc-chip:focus-visible,.cc-model:focus-visible,.cc-tab:focus-visible,.cc-theme button:focus-visible{outline:3px solid #fff;outline-offset:2px}
  .cc-models{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:8px}
  .cc-model{font:inherit;background:#1f2124;color:#e8eaed;border:2px solid #000;border-radius:12px;padding:6px 4px 7px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11.5px;font-weight:800;text-align:center;line-height:1.1}
  .cc-model:hover{border-color:#4a4f56}
  .cc-model.on{border-color:var(--g,#58cc02);background:#25301f}
  .cc-model .th{background:radial-gradient(circle at 50% 30%,#3a3e44,#1b1d20);border-radius:9px;width:100%;display:flex;justify-content:center;padding-top:4px}
  .cc-row{margin-bottom:2px}
  .cc-lab{font-size:12px;font-weight:800;color:#9aa0a8;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px}
  .cc-chips{display:flex;flex-wrap:wrap;gap:6px}
  .cc-chip{font:inherit;font-size:13px;font-weight:700;color:#e8eaed;background:#1f2124;border:2px solid #000;border-radius:999px;padding:5px 12px;cursor:pointer}
  .cc-chip.on{border-color:var(--g,#58cc02);background:#25301f}
  .cc-colors{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
  .cc canvas{border-radius:50%;cursor:crosshair;touch-action:none;background:#111;box-shadow:0 0 0 4px #1b1d20,0 0 0 5px #4a4f56}
  .cc-side{display:flex;flex-direction:column;gap:8px;min-width:120px;flex:1}
  .cc-swatch{width:100%;height:30px;border-radius:8px;border:2px solid #000}
  .cc-hex{font-weight:800;font-size:13px;opacity:.9}
  .cc input[type=range]{width:100%;accent-color:var(--g,#58cc02);padding:0;border:0;margin:0;background:none}
  .cc input[type=password]{font:inherit;background:#15171a;color:#fff;margin:0;border:2px solid #000;border-radius:8px;padding:8px;flex:1;min-width:0}
  .cc-unlock{display:flex;gap:8px}
  .cc-foot{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:12px 14px;background:#232528;border-top:1px solid #000;grid-column:1/-1}
  .cc-msg{flex:1;min-width:160px;min-height:20px;font-size:13px;font-weight:700}
  .cc-msg.err{color:#ff8a80}.cc-msg.ok{color:var(--g,#58cc02)}
  .cc-note{font-size:11px;opacity:.6}`;

  function hexToHsv(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return { h, s: max ? d / max : 0, v: max };
  }
  function hsvToRgb(h, s, v) {
    const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
  function hsvToHex(h, s, v) {
    const [r, g, b] = hsvToRgb(h, s, v);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function mountCreator(root, opts) {
    if (!document.getElementById('cc-style')) {
      const st = el('style'); st.id = 'cc-style'; st.textContent = CSS; document.head.appendChild(st);
      // Tipografía condensada para los títulos (si no carga, se usa Impact)
      const fl = el('link'); fl.rel = 'stylesheet'; fl.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap'; document.head.appendChild(fl);
    }
    let cfg = C.validate(opts.initial) || C.DEFAULT_CONFIG();
    let unlocked = !!opts.unlocked;
    let target = 'suit';
    let tab = 'models';
    let hsv = hexToHsv(cfg[target]);

    root.textContent = '';
    const wrap = el('div', 'cc'); root.appendChild(wrap);
    const studio = el('div', 'cc-studio'); wrap.appendChild(studio);

    // Barra superior (decorativa) + interruptor Light / Dark del escenario
    const menu = el('div', 'cc-menu');
    const theme = el('div', 'cc-theme');
    const bDark = el('button', 'on', 'Dark'), bLight = el('button', null, 'Light');
    bDark.type = bLight.type = 'button';
    theme.append(bLight, bDark);
    menu.append(el('b', null, 'MathDuel'), el('span', null, 'Personaje'), el('span', null, 'Diseño'), el('span', 'sp'), theme);

    // Escenario: título + tres vistas + suelo con rejilla
    const stage = el('div', 'cc-stage');
    const title = el('div', 'cc-title');
    const t1 = el('div', 't1'), t2 = el('div', 't2', '3D character model');
    title.append(t1, t2);
    const views = el('div', 'cc-views');
    const figs = {};
    VIEWS.forEach(([id, label]) => {
      const v = el('div', 'cc-view'); v.appendChild(el('div', 'cc-tag', label));
      const f = el('div', 'cc-fig'); figs[id] = f; v.appendChild(f); views.appendChild(v);
    });
    stage.append(title, views, el('div', 'cc-floor'));

    // Panel derecho con pestañas
    const panel = el('div', 'cc-panel');
    const tabsBar = el('div', 'cc-tabs'); tabsBar.setAttribute('role', 'tablist');
    const body = el('div', 'cc-body');
    panel.append(tabsBar, body);

    // Zonas del panel
    const modelsBox = el('div', 'cc-models');
    const partsBox = el('div');
    const colorBox = el('div');
    const tabsC = el('div', 'cc-chips'); tabsC.style.marginBottom = '12px';
    const colorsRow = el('div', 'cc-colors');
    const canvas = el('canvas'); const W = 170, R = W / 2; canvas.width = W; canvas.height = W;
    const side = el('div', 'cc-side');
    const swatch = el('div', 'cc-swatch');
    const hexLabel = el('div', 'cc-hex');
    const bright = el('input'); bright.type = 'range'; bright.min = 10; bright.max = 100; bright.setAttribute('aria-label', 'Brillo');
    side.append(el('div', 'cc-lab', 'Brillo'), bright, swatch, hexLabel);
    colorsRow.append(canvas, side);
    colorBox.append(tabsC, colorsRow);

    const keySec = el('div'); keySec.appendChild(el('div', 'cc-lab', 'Clave de desbloqueo'));
    const keyRow = el('div', 'cc-unlock');
    const keyIn = el('input'); keyIn.type = 'password'; keyIn.placeholder = 'Clave secreta'; keyIn.autocomplete = 'off';
    const keyBtn = el('button', 'cc-btn', 'Desbloquear');
    keyRow.append(keyIn, keyBtn); keySec.appendChild(keyRow);

    // Pie: guardar + mensajes
    const foot = el('div', 'cc-foot');
    const saveBtn = el('button', 'cc-btn', 'Guardar personaje');
    const msg = el('div', 'cc-msg');
    foot.append(saveBtn, msg, el('div', 'cc-note', 'Modelos originales o inspirados en superhéroes famosos.'));

    studio.append(menu, stage, panel, foot);

    function say(text, kind) { msg.textContent = text || ''; msg.className = 'cc-msg' + (kind ? ' ' + kind : ''); }

    function drawPreview() {
      VIEWS.forEach(([id]) => { figs[id].innerHTML = C.render(cfg, 220, false, id); });
      const m = C.MODELS.find((x) => x.id === cfg.model);
      t1.textContent = m ? m.name : 'Personaje';
    }

    function drawModels() {
      modelsBox.textContent = '';
      C.MODELS.forEach((m) => {
        const b = el('button', 'cc-model' + (cfg.model === m.id ? ' on' : ''));
        b.type = 'button';
        const thumb = el('div', 'th'); thumb.innerHTML = C.render(m.config, 56, true);
        b.append(thumb, el('span', null, (m.locked && !unlocked ? '🔒 ' : '') + m.name));
        b.addEventListener('click', () => {
          cfg = Object.assign({}, m.config); hsv = hexToHsv(cfg[target]);
          say(''); refreshAll();
        });
        modelsBox.appendChild(b);
      });
    }

    function drawParts() {
      partsBox.textContent = '';
      C.PART_KEYS.forEach((k) => {
        const row = el('div', 'cc-row');
        row.appendChild(el('div', 'cc-lab', PART_LABELS[k] || k));
        const chips = el('div', 'cc-chips');
        C.PARTS[k].forEach((p) => {
          const b = el('button', 'cc-chip' + (cfg[k] === p.id ? ' on' : ''), (p.locked && !unlocked ? '🔒 ' : '') + p.name);
          b.type = 'button';
          b.addEventListener('click', () => { cfg[k] = p.id; say(''); drawPreview(); drawParts(); });
          chips.appendChild(b);
        });
        row.appendChild(chips); partsBox.appendChild(row);
        partsBox.appendChild(el('div')).style.height = '10px';
      });
    }

    function drawColorTabs() {
      tabsC.textContent = '';
      Object.keys(COLOR_LABELS).forEach((k) => {
        const b = el('button', 'cc-chip' + (k === target ? ' on' : ''), COLOR_LABELS[k]);
        b.type = 'button';
        b.addEventListener('click', () => { target = k; hsv = hexToHsv(cfg[k]); drawColorTabs(); drawWheel(); });
        tabsC.appendChild(b);
      });
    }

    // Disco de color: ángulo = tono, distancia al centro = saturación, deslizador = brillo
    const ctx = canvas.getContext('2d');
    function drawWheel() {
      const img = ctx.createImageData(W, W);
      for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
        const dx = x - R + 0.5, dy = y - R + 0.5, d = Math.hypot(dx, dy) / R, i = (y * W + x) * 4;
        if (d <= 1) {
          const h = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
          const [r, g, b] = hsvToRgb(h, d, hsv.v);
          img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      const a = (hsv.h * Math.PI) / 180, mx = R + Math.cos(a) * hsv.s * R, my = R + Math.sin(a) * hsv.s * R;
      ctx.beginPath(); ctx.arc(mx, my, 7, 0, Math.PI * 2);
      ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = '#000'; ctx.stroke();
      bright.value = Math.round(hsv.v * 100);
      swatch.style.background = cfg[target]; hexLabel.textContent = cfg[target].toUpperCase();
    }
    function applyColor() {
      cfg[target] = hsvToHex(hsv.h, hsv.s, hsv.v);
      drawPreview(); drawWheel();
    }
    function pick(ev) {
      const rect = canvas.getBoundingClientRect();
      const dx = ((ev.clientX - rect.left) / rect.width) * W - R, dy = ((ev.clientY - rect.top) / rect.height) * W - R;
      hsv.h = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
      hsv.s = Math.min(1, Math.hypot(dx, dy) / R);
      applyColor();
    }
    let dragging = false;
    canvas.addEventListener('pointerdown', (e) => { dragging = true; canvas.setPointerCapture(e.pointerId); pick(e); });
    canvas.addEventListener('pointermove', (e) => { if (dragging) pick(e); });
    canvas.addEventListener('pointerup', () => { dragging = false; });
    bright.addEventListener('input', () => { hsv.v = bright.value / 100; applyColor(); });

    // Pestañas del panel
    function drawTabs() {
      tabsBar.textContent = '';
      TABS.forEach(([id, label]) => {
        const b = el('button', 'cc-tab' + (id === tab ? ' on' : ''), label);
        b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', id === tab ? 'true' : 'false');
        b.addEventListener('click', () => { tab = id; drawTabs(); showTab(); });
        tabsBar.appendChild(b);
      });
    }
    function showTab() {
      body.textContent = '';
      if (tab === 'models') body.append(modelsBox);
      if (tab === 'body') body.append(partsBox);
      if (tab === 'color') { body.append(colorBox); drawWheel(); }
      body.append(keySec);
    }

    function setTheme(light) {
      stage.classList.toggle('light', light);
      bLight.classList.toggle('on', light); bDark.classList.toggle('on', !light);
    }
    bLight.addEventListener('click', () => setTheme(true));
    bDark.addEventListener('click', () => setTheme(false));

    function refreshAll() { drawPreview(); drawModels(); drawParts(); drawColorTabs(); drawTabs(); showTab(); }

    saveBtn.addEventListener('click', async () => {
      if (C.usesLocked(cfg) && !unlocked) return say('Este personaje usa piezas bloqueadas 🔒. Escribe la clave.', 'err');
      saveBtn.disabled = true; say('Guardando…');
      try { await opts.onSave(cfg); say('¡Personaje guardado!', 'ok'); }
      catch (e) { say(e.message || e.error || 'No se pudo guardar', 'err'); }
      saveBtn.disabled = false;
    });
    keyBtn.addEventListener('click', async () => {
      if (!keyIn.value) return;
      keyBtn.disabled = true;
      try { await opts.onUnlock(keyIn.value); unlocked = true; keyIn.value = ''; say('¡Desbloqueado!', 'ok'); drawModels(); drawParts(); }
      catch (e) { say(e.message || e.error || 'Clave incorrecta', 'err'); }
      keyBtn.disabled = false;
    });

    refreshAll();
    return { getConfig: () => Object.assign({}, cfg) };
  }

  C.mountCreator = mountCreator;
})();
