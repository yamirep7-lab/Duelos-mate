// public/creator.js
// Interfaz del creador. Requiere shared/characters.js cargado antes (window.Characters).
// Uso: Characters.mountCreator(elemento, { initial, unlocked, onSave, onUnlock })
(function () {
  const C = window.Characters;
  const PART_LABELS = { hair: 'Pelo', headgear: 'Cabeza', emblem: 'Emblema', cape: 'Capa', item: 'Objeto' };
  const COLOR_LABELS = { suit: 'Vestimenta', skin: 'Piel', accent: 'Accesorios', hairc: 'Pelo' };

  const CSS = `
  .cc{font-family:Nunito,system-ui,sans-serif;color:var(--tx);display:flex;flex-wrap:wrap;gap:24px;max-width:960px;margin:0 auto}
  .cc *{box-sizing:border-box}
  .cc-left{flex:0 0 260px;display:flex;flex-direction:column;align-items:center;gap:12px}
  .cc-stage{background:var(--card);border:2px solid var(--line);border-radius:16px;padding:16px;width:100%;display:flex;justify-content:center}
  .cc-right{flex:1 1 360px;display:flex;flex-direction:column;gap:18px;min-width:300px}
  .cc h3{margin:0 0 8px;font-size:15px;font-weight:800;color:var(--g)}
  .cc-btn{font:inherit;font-weight:800;color:#fff;background:var(--g);border:0;border-bottom:4px solid var(--gd);border-radius:10px;padding:10px 16px;cursor:pointer}
  .cc-btn:active{transform:translateY(2px);border-bottom-width:2px}
  .cc-btn:focus-visible,.cc-chip:focus-visible,.cc-model:focus-visible{outline:3px solid #fff;outline-offset:2px}
  .cc-models{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:8px}
  .cc-model{font:inherit;background:var(--card2);color:var(--tx);border:2px solid var(--line);border-radius:12px;padding:6px 4px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:12px;font-weight:700}
  .cc-model.on{border-color:var(--g);background:#1c2a1a}
  .cc-row{margin-bottom:10px}
  .cc-chips{display:flex;flex-wrap:wrap;gap:6px}
  .cc-chip{font:inherit;font-size:13px;font-weight:700;color:var(--tx);background:var(--card2);border:2px solid var(--line);border-radius:999px;padding:5px 12px;cursor:pointer}
  .cc-chip.on{border-color:var(--g);background:#1c2a1a}
  .cc-colors{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
  .cc canvas{border-radius:50%;cursor:crosshair;touch-action:none;background:#111}
  .cc-side{display:flex;flex-direction:column;gap:10px;min-width:150px}
  .cc-swatch{width:100%;height:28px;border-radius:8px;border:2px solid var(--line)}
  .cc-hex{font-weight:800;font-size:13px;opacity:.85}
  .cc input[type=range]{width:100%;accent-color:var(--g);padding:0;border:0;margin:0;background:none}
  .cc input[type=password]{font:inherit;background:var(--bg);color:#fff;margin:0;border:2px solid var(--line);border-radius:8px;padding:8px;flex:1;min-width:0}
  .cc-unlock{display:flex;gap:8px}
  .cc-msg{min-height:20px;font-size:13px;font-weight:700;text-align:center}
  .cc-msg.err{color:#ff8a80}.cc-msg.ok{color:var(--g)}
  .cc-note{font-size:11px;opacity:.6;text-align:center}`;

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
    }
    let cfg = C.validate(opts.initial) || C.DEFAULT_CONFIG();
    let unlocked = !!opts.unlocked;
    let target = 'suit';
    let hsv = hexToHsv(cfg[target]);

    root.textContent = '';
    const wrap = el('div', 'cc'); root.appendChild(wrap);

    // Izquierda: vista previa + guardar
    const left = el('div', 'cc-left');
    const stage = el('div', 'cc-stage');
    const saveBtn = el('button', 'cc-btn', 'Guardar personaje');
    const msg = el('div', 'cc-msg');
    left.append(stage, saveBtn, msg, el('div', 'cc-note', 'Modelos inspirados en superhéroes famosos.'));

    // Derecha
    const right = el('div', 'cc-right');
    const secModels = el('div'); secModels.appendChild(el('h3', null, 'Modelos'));
    const modelsBox = el('div', 'cc-models'); secModels.appendChild(modelsBox);
    const secParts = el('div'); secParts.appendChild(el('h3', null, 'Partes del cuerpo'));
    const partsBox = el('div'); secParts.appendChild(partsBox);

    const secColors = el('div'); secColors.appendChild(el('h3', null, 'Colores'));
    const tabs = el('div', 'cc-chips'); tabs.style.marginBottom = '10px';
    const colorsBox = el('div', 'cc-colors');
    const canvas = el('canvas'); const W = 170, R = W / 2; canvas.width = W; canvas.height = W;
    const side = el('div', 'cc-side');
    const swatch = el('div', 'cc-swatch');
    const hexLabel = el('div', 'cc-hex');
    const bright = el('input'); bright.type = 'range'; bright.min = 10; bright.max = 100; bright.setAttribute('aria-label', 'Brillo');
    side.append(el('div', 'cc-hex', 'Brillo'), bright, swatch, hexLabel);
    colorsBox.append(canvas, side);
    secColors.append(tabs, colorsBox);

    const secKey = el('div'); secKey.appendChild(el('h3', null, 'Clave de desbloqueo'));
    const keyRow = el('div', 'cc-unlock');
    const keyIn = el('input'); keyIn.type = 'password'; keyIn.placeholder = 'Clave secreta'; keyIn.autocomplete = 'off';
    const keyBtn = el('button', 'cc-btn', 'Desbloquear');
    keyRow.append(keyIn, keyBtn); secKey.appendChild(keyRow);

    right.append(secModels, secParts, secColors, secKey);
    wrap.append(left, right);

    function say(text, kind) { msg.textContent = text || ''; msg.className = 'cc-msg' + (kind ? ' ' + kind : ''); }

    function drawPreview() { stage.innerHTML = C.render(cfg, 210); }

    function drawModels() {
      modelsBox.textContent = '';
      C.MODELS.forEach((m) => {
        const b = el('button', 'cc-model' + (cfg.model === m.id ? ' on' : ''));
        b.type = 'button';
        const thumb = el('div'); thumb.innerHTML = C.render(m.config, 52, true);
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
        row.appendChild(el('div', 'cc-hex', PART_LABELS[k]));
        const chips = el('div', 'cc-chips');
        C.PARTS[k].forEach((p) => {
          const b = el('button', 'cc-chip' + (cfg[k] === p.id ? ' on' : ''), (p.locked && !unlocked ? '🔒 ' : '') + p.name);
          b.type = 'button';
          b.addEventListener('click', () => { cfg[k] = p.id; say(''); drawPreview(); drawParts(); });
          chips.appendChild(b);
        });
        row.appendChild(chips); partsBox.appendChild(row);
      });
    }

    function drawTabs() {
      tabs.textContent = '';
      Object.keys(COLOR_LABELS).forEach((k) => {
        const b = el('button', 'cc-chip' + (k === target ? ' on' : ''), COLOR_LABELS[k]);
        b.type = 'button';
        b.addEventListener('click', () => { target = k; hsv = hexToHsv(cfg[k]); drawTabs(); drawWheel(); });
        tabs.appendChild(b);
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

    function refreshAll() { drawPreview(); drawModels(); drawParts(); drawTabs(); drawWheel(); }

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
