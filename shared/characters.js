// shared/characters.js  (versión 3: estilo "juguete 3D")
// Catálogo de personajes + validación + dibujo SVG.
// Corre en Node (el servidor valida) y en el navegador (dibuja).
// Los modelos son ORIGINALES o INSPIRADOS en superhéroes famosos, con nombres propios.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Characters = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const HEX = /^#[0-9a-fA-F]{6}$/;

  // Piezas del cuerpo. locked:true = solo con la clave secreta.
  const PARTS = {
    hair: [
      { id: 'none', name: 'Sin pelo' },
      { id: 'short', name: 'Corto' },
      { id: 'long', name: 'Largo' },
      { id: 'curl', name: 'Con rizo' },
      { id: 'messy', name: 'Despeinado' },
      { id: 'spikes', name: 'Picos' },
    ],
    headgear: [
      { id: 'none', name: 'Nada' },
      { id: 'domino', name: 'Antifaz' },
      { id: 'cowl_ears', name: 'Capucha con orejas' },
      { id: 'cowl_wings', name: 'Capucha con alas' },
      { id: 'helmet_star', name: 'Casco con estrella' },
      { id: 'web_mask', name: 'Máscara de red' },
      { id: 'tiara', name: 'Tiara' },
      { id: 'goggles', name: 'Gafas de laboratorio', locked: true },
      { id: 'helmet_full', name: 'Casco total', locked: true },
    ],
    emblem: [
      { id: 'none', name: 'Sin emblema' },
      { id: 'star', name: 'Estrella' },
      { id: 'bolt', name: 'Rayo' },
      { id: 'crest', name: 'Escudo' },
      { id: 'bat', name: 'Murciélago' },
      { id: 'circle', name: 'Reactor', locked: true },
    ],
    cape: [
      { id: 'none', name: 'Sin capa' },
      { id: 'short', name: 'Corta' },
      { id: 'long', name: 'Larga' },
    ],
    item: [
      { id: 'none', name: 'Nada' },
      { id: 'shield', name: 'Escudo redondo' },
      { id: 'hammer', name: 'Martillo', locked: true },
      { id: 'trident', name: 'Tridente', locked: true },
    ],
    // NUEVO: la ropa. 'hero' es el traje de siempre.
    outfit: [
      { id: 'hero', name: 'Traje de héroe' },
      { id: 'casual', name: 'Camisa y pantalón', locked: true },
      { id: 'labcoat', name: 'Bata de laboratorio', locked: true },
    ],
  };
  const PART_KEYS = Object.keys(PARTS);
  // Piezas nuevas que los personajes guardados antes no tienen: se rellenan solas.
  const PART_DEFAULTS = { outfit: 'hero' };

  const mk = (hair, headgear, emblem, cape, item, skin, suit, accent, hairc, outfit) =>
    ({ hair, headgear, emblem, cape, item, outfit: outfit || 'hero', skin, suit, accent, hairc: hairc || '#3a2616' });

  // Modelos completos (puntos de partida). Los bloqueados usan piezas bloqueadas.
  const MODELS = [
    { id: 'star_captain', name: 'Capitán Estrella', note: 'inspirado en Marvel', config: mk('short', 'helmet_star', 'star', 'none', 'shield', '#f1c8a0', '#1f4fa3', '#c8102e', '#d9b24a') },
    { id: 'web_climber', name: 'Trepamuros', note: 'inspirado en Marvel', config: mk('none', 'web_mask', 'none', 'none', 'none', '#f1c8a0', '#c8102e', '#1f4fa3') },
    { id: 'night_knight', name: 'Caballero Nocturno', note: 'inspirado en DC', config: mk('none', 'cowl_ears', 'bat', 'long', 'none', '#f1c8a0', '#2b2f3a', '#f2c200') },
    { id: 'sky_son', name: 'Hijo del Cielo', note: 'inspirado en DC', config: mk('curl', 'none', 'crest', 'long', 'none', '#f1c8a0', '#1f5fd0', '#d81f26', '#1b1b1f') },
    { id: 'amazon', name: 'Amazona', note: 'inspirado en DC', config: mk('long', 'tiara', 'star', 'none', 'none', '#e8b98f', '#c8102e', '#e6b800', '#3b2418') },
    { id: 'speedster', name: 'Velocista', note: 'inspirado en DC', config: mk('none', 'cowl_wings', 'bolt', 'none', 'none', '#f1c8a0', '#d81f26', '#f2c200') },
    { id: 'red_armor', name: 'Armadura Roja', note: 'inspirado en Marvel', locked: true, config: mk('none', 'helmet_full', 'circle', 'none', 'none', '#f1c8a0', '#b3202a', '#f2c200') },
    { id: 'thunder_god', name: 'Dios del Trueno', note: 'inspirado en Marvel', locked: true, config: mk('long', 'none', 'none', 'long', 'hammer', '#f1c8a0', '#3a4a6b', '#c0c8d4', '#e8c85a') },
    { id: 'sea_king', name: 'Rey del Mar', note: 'inspirado en DC', locked: true, config: mk('long', 'none', 'none', 'none', 'trident', '#e8b98f', '#1e8a5a', '#f0a800') },
    { id: 'green_ring', name: 'Anillo Verde', note: 'inspirado en DC', locked: true, config: mk('short', 'domino', 'circle', 'none', 'none', '#f1c8a0', '#1fa84f', '#111111', '#5a3a22') },
    // Personajes ORIGINALES (no son superhéroes) — bloqueados con la clave
    { id: 'ishaq', name: 'ISHAQ', note: 'personaje original', locked: true, config: mk('messy', 'none', 'none', 'none', 'none', '#d0936a', '#2c3a6e', '#262e5a', '#14141b', 'casual') },
    { id: 'doc_chispa', name: 'Doctor Chispa', note: 'personaje original', locked: true, config: mk('spikes', 'goggles', 'none', 'none', 'none', '#f0c9a6', '#f08a24', '#1fa39a', '#8a4fd8', 'labcoat') },
  ];
  MODELS.forEach((m) => (m.config.model = m.id));

  const DEFAULT_CONFIG = () => Object.assign({}, MODELS[0].config);

  // ---- Validación (el servidor la usa; nunca confiar en el cliente) ----
  function validate(c) {
    if (!c || typeof c !== 'object') return null;
    if (!MODELS.some((m) => m.id === c.model)) return null;
    const out = { model: c.model };
    for (const k of PART_KEYS) {
      let v = c[k];
      if (v == null && PART_DEFAULTS[k]) v = PART_DEFAULTS[k];   // personajes viejos sin esta pieza
      if (typeof v !== 'string' || !PARTS[k].some((p) => p.id === v)) return null;
      out[k] = v;
    }
    for (const k of ['skin', 'suit', 'accent']) {
      if (typeof c[k] !== 'string' || !HEX.test(c[k])) return null;
      out[k] = c[k].toLowerCase();
    }
    // Color de pelo: opcional (los personajes guardados antes no lo tienen)
    if (c.hairc == null) out.hairc = '#3a2616';
    else if (typeof c.hairc === 'string' && HEX.test(c.hairc)) out.hairc = c.hairc.toLowerCase();
    else return null;
    return out;
  }

  // ¿Esta configuración usa algo que requiere la clave?
  function usesLocked(c) {
    const m = MODELS.find((x) => x.id === c.model);
    if (m && m.locked) return true;
    return PART_KEYS.some((k) => {
      const p = PARTS[k].find((x) => x.id === (c[k] == null ? PART_DEFAULTS[k] : c[k]));
      return p && p.locked;
    });
  }

  // ---- Utilidades de dibujo ----
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = f < 0 ? 0 : 255, p = Math.abs(f);
    r = Math.round((t - r) * p + r);
    g = Math.round((t - g) * p + g);
    b = Math.round((t - b) * p + b);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  function starPts(cx, cy, R, r) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 ? r : R;
      pts.push((cx + Math.cos(a) * rad).toFixed(1) + ',' + (cy + Math.sin(a) * rad).toFixed(1));
    }
    return pts.join(' ');
  }

  // =====================================================================
  //  DIBUJO ESTILO JUGUETE 3D
  //  Ingredientes: contorno oscuro suave, degradados de luz/sombra,
  //  luz de borde (rim light), brillos blancos y sombra de contacto.
  //  render(cfg, tamaño, bust, vista)  vista = 'front' | 'side' | 'back'
  // =====================================================================
  let UID = 0;
  function render(input, size, bust, view) {
    const c = validate(input) || DEFAULT_CONFIG();
    size = size || 120;
    view = view === 'side' || view === 'back' ? view : 'front';
    const uid = 'c' + (++UID) + '_';
    const defs = [], seen = {};
    const reg = (key, xml) => { if (!seen[key]) { seen[key] = uid + defs.length; defs.push(xml.replace('@', seen[key])); } return `url(#${seen[key]})`; };

    // cilindro: luz a la izquierda, sombra a la derecha, un poco de luz rebotada en el borde
    const cyl = (h) => reg('y' + h, `<linearGradient id="@" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(h, -0.3)}"/><stop offset=".2" stop-color="${shade(h, 0.34)}"/><stop offset=".5" stop-color="${h}"/><stop offset=".86" stop-color="${shade(h, -0.4)}"/><stop offset="1" stop-color="${shade(h, -0.16)}"/></linearGradient>`);
    // cilindro vertical (para fundas/piernas vistas de lado)
    const vcl = (h) => reg('v' + h, `<linearGradient id="@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(h, 0.3)}"/><stop offset=".45" stop-color="${h}"/><stop offset="1" stop-color="${shade(h, -0.4)}"/></linearGradient>`);
    // diagonal: piezas planas
    const lin = (h) => reg('l' + h, `<linearGradient id="@" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(h, 0.42)}"/><stop offset=".5" stop-color="${h}"/><stop offset="1" stop-color="${shade(h, -0.42)}"/></linearGradient>`);
    // esfera: cabeza, casco, puños
    const rad = (h) => reg('r' + h, `<radialGradient id="@" cx=".36" cy=".27" r=".86"><stop offset="0" stop-color="${shade(h, 0.5)}"/><stop offset=".3" stop-color="${shade(h, 0.14)}"/><stop offset=".62" stop-color="${h}"/><stop offset="1" stop-color="${shade(h, -0.5)}"/></radialGradient>`);
    const ST = (h, w) => `stroke="${shade(h, -0.66)}" stroke-width="${w || 1.3}" stroke-linejoin="round" stroke-linecap="round"`;
    const gloss = (cx, cy, rx, ry, rot, op) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${op || 0.3}" transform="rotate(${rot || 0} ${cx} ${cy})"/>`;
    const P = (d, fill, h, w, extra) => `<path d="${d}" fill="${fill}" ${ST(h, w)} ${extra || ''}/>`;
    const E = (cx, cy, rx, ry, fill, h, w) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${ST(h, w)}/>`;
    const R = (x, y, w, h, r, fill, hc, sw) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${ST(hc, sw)}/>`;

    const S = c.suit, K = c.skin, A = c.accent, HR = c.hairc, OUT = c.outfit;
    const line = shade(S, -0.6), COAT = '#f4f2ec';
    const PANT = OUT === 'casual' ? '#1d1d27' : OUT === 'labcoat' ? '#4b4e59' : S;
    const IRIS = OUT === 'casual' ? ['#c98f5e', '#6b3a1e', '#2a1408'] : OUT === 'labcoat' ? ['#9fe3d8', '#2a9d8f', '#0f4f48'] : ['#8cc4ff', '#2f6fd0', '#143a7a'];
    const o = [];

    // ---------- piezas reutilizables ----------
    const irisFill = reg('iris' + OUT, `<radialGradient id="@" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="${IRIS[0]}"/><stop offset=".6" stop-color="${IRIS[1]}"/><stop offset="1" stop-color="${IRIS[2]}"/></radialGradient>`);
    const eye = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="6.4" ry="7.4" fill="#fff" ${ST(K, 1.1)}/><circle cx="${x}" cy="${y + 1}" r="4.5" fill="${irisFill}"/><circle cx="${x}" cy="${y + 1.3}" r="2.2" fill="#0b0b12"/><circle cx="${x - 1.5}" cy="${y - 0.8}" r="1.6" fill="#fff"/><circle cx="${x + 1.6}" cy="${y + 3}" r=".8" fill="#fff" opacity=".7"/><path d="M${x - 6.4} ${y - 1} Q${x} ${y - 9.4} ${x + 6.4} ${y - 1}" stroke="${shade(K, -0.75)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    const slit = (x, flip) => `<path d="M${x - 8} 51 Q${x} ${flip ? 43 : 44} ${x + 8} 51 Q${x} 56.5 ${x - 8} 51Z" fill="#fff" ${ST(S, 1)}/>`;
    const gearBase = rad(S);

    // brazo en "A": rot>0 gira el brazo izquierdo hacia fuera, rot<0 el derecho
    const arm = (sx, rot, back) => {
      const g = [];
      const sleeveC = OUT === 'labcoat' ? COAT : S;
      if (OUT === 'casual') {
        g.push(R(sx - 6, 92, 12, 24, 6, cyl(K), K));
        g.push(hand(sx, 119, K, back));
        g.push(R(sx - 7.6, 79, 15.2, 17, 7, cyl(S), S));
        g.push(`<path d="M${sx - 7} 94 Q${sx} 98 ${sx + 7} 94" stroke="${shade(S, -0.5)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`);
      } else if (OUT === 'labcoat') {
        g.push(hand(sx, 116, K, back));
        g.push(R(sx - 7.6, 79, 15.2, 33, 7.5, cyl(COAT), COAT));
        g.push(R(sx - 7.6, 104, 15.2, 7, 3, cyl(shade(COAT, -0.08)), COAT));
      } else {
        g.push(R(sx - 7.4, 79, 14.8, 27, 7.4, cyl(S), S));
        g.push(R(sx - 8.2, 99, 16.4, 9, 4, lin(A), A));              // puño
        g.push(E(sx, 114, 8.4, 8.2, rad(A), A));                       // guante
        g.push(`<ellipse cx="${sx + (sx < 60 ? 5.4 : -5.4)}" cy="111" rx="2.6" ry="3.8" fill="${cyl(A)}" ${ST(A, 1)}/>`);
        g.push(gloss(sx - 2.5, 111, 2.6, 1.6, -30, 0.4));
      }
      g.push(gloss(sx - 3, 88, 1.8, 6, 0, 0.28));
      return `<g transform="rotate(${rot} ${sx} 82)">${g.join('')}</g>`;
    };
    function hand(x, y, col, back) {
      const t = x < 60 ? 1 : -1;
      return `<ellipse cx="${x}" cy="${y}" rx="6.2" ry="7.4" fill="${rad(col)}" ${ST(col, 1.1)}/>` +
        (back ? '' : `<ellipse cx="${x + t * 5}" cy="${y - 3}" rx="2.2" ry="3.6" fill="${rad(col)}" ${ST(col, 1)} transform="rotate(${-t * 18} ${x + t * 5} ${y - 3})"/>`) +
        `<path d="M${x - 3} ${y + 3} L${x - 3} ${y + 7} M${x} ${y + 4} L${x} ${y + 8} M${x + 3} ${y + 3} L${x + 3} ${y + 7}" stroke="${shade(col, -0.35)}" stroke-width=".8" fill="none" stroke-linecap="round"/>`;
    }

    // emblema en el pecho
    const emblem = () => {
      const em = [];
      switch (c.emblem) {
        case 'star': em.push(`<polygon points="${starPts(60, 70, 11, 4.6)}" fill="${lin(A)}" ${ST(A, 1)}/>`); break;
        case 'bolt': em.push(`<polygon points="64,56 52,71 60,71 55,85 70,66 62,66" fill="${lin(A)}" ${ST(A, 1)}/>`); break;
        case 'crest': em.push(`<path d="M49 57 L71 57 L71 70 Q71 79 60 84 Q49 79 49 70Z" fill="${lin(A)}" ${ST(A, 1)}/><path d="M54 61 L66 61 L66 69 Q66 74 60 77 Q54 74 54 69Z" fill="${shade(A, -0.2)}"/>`); break;
        case 'bat': em.push(`<path d="M45 66 Q53 57 60 63 Q67 57 75 66 Q68 66 65 74 Q60 69 55 74 Q52 66 45 66Z" fill="${lin(A)}" ${ST(A, 1)}/>`); break;
        case 'circle': em.push(`<circle cx="60" cy="70" r="10" fill="${lin(A)}" ${ST(A, 1)}/><circle cx="60" cy="70" r="6" fill="#dffaff"/><circle cx="58" cy="68" r="2.4" fill="#fff"/>`); break;
      }
      return em.length ? `<g transform="translate(60 92) scale(.82) translate(-60 -70)">${em.join('')}</g>` : '';
    };

    // objeto (escudo / martillo / tridente); mirror = true en la vista de espaldas
    const item = (mirror) => {
      let s = '';
      if (c.item === 'shield')
        s = `<circle cx="19" cy="104" r="19" fill="${rad(A)}" ${ST(A, 1.4)}/><circle cx="19" cy="104" r="14" fill="#eef1f5" ${ST('#eef1f5', 1)}/><circle cx="19" cy="104" r="9.5" fill="${rad(A)}" ${ST(A, 1)}/><polygon points="${starPts(19, 104, 7, 2.9)}" fill="#f6f6f6"/>` + gloss(11, 93, 8, 3, -40, 0.4);
      if (c.item === 'hammer')
        s = `<rect x="93" y="86" width="6" height="54" rx="2.8" fill="${cyl('#7a4b22')}" ${ST('#7a4b22', 1.1)}/><rect x="80" y="66" width="32" height="22" rx="5" fill="${cyl('#b8c0cb')}" ${ST('#b8c0cb', 1.3)}/><rect x="80" y="74" width="32" height="3" fill="#6b7480" opacity=".5"/>` + gloss(88, 70, 6, 2, 0, 0.55);
      if (c.item === 'trident')
        s = `<rect x="93" y="46" width="5" height="96" rx="2.2" fill="${cyl(A)}" ${ST(A, 1.1)}/><path d="M83 46 L83 60 Q95.5 71 108 60 L108 46 M95.5 38 L95.5 62" stroke="${shade(A, -0.65)}" stroke-width="5.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M83 46 L83 60 Q95.5 71 108 60 L108 46 M95.5 38 L95.5 62" stroke="${A}" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M83 46 L83 58" stroke="#fff" stroke-opacity=".5" stroke-width="1" stroke-linecap="round"/>`;
      if (!s) return '';
      return mirror ? `<g transform="translate(120 0) scale(-1 1)">${s}</g>` : s;
    };

    // ---------- pelo ----------
    const hairShapes = {
      cap: () => `<path d="M29 49 Q24 11 60 11 Q96 11 91 49 Q87 31 73 28 Q60 36 47 28 Q33 31 29 49Z" fill="${lin(HR)}" ${ST(HR, 1.2)}/>`,
      messy: () => `<path d="M28 50 Q21 14 50 8 Q60 3 70 8 Q99 14 92 50 L88 44 L90 33 L81 38 L77 29 L69 37 L64 27 L58 38 L51 29 L46 38 L38 31 L37 42 L31 38Z" fill="${lin(HR)}" ${ST(HR, 1.2)}/><path d="M44 12 L48 2 L55 10 L60 0 L66 10 L74 2 L76 12 Q60 6 44 12Z" fill="${lin(HR)}" ${ST(HR, 1.1)}/>`,
      spikes: () => `<path d="M29 48 L16 38 L27 33 L12 22 L30 24 L26 8 L42 17 L44 0 L56 14 L66 -2 L72 15 L88 2 L88 20 L106 14 L96 30 L110 36 L92 40 L91 48 Q86 33 72 30 Q60 36 48 30 Q34 33 29 48Z" fill="${lin(HR)}" ${ST(HR, 1.3)}/>`,
    };
    const hairFront = () => {
      let s = '';
      if (c.hair === 'short' || c.hair === 'long') s += hairShapes.cap() + `<path d="M40 20 Q56 12 77 19" stroke="#fff" stroke-opacity=".45" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      if (c.hair === 'curl') s += hairShapes.cap() + `<path d="M58 22 Q64 41 78 31 Q74 17 60 19" stroke="${shade(HR, -0.55)}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M58 22 Q64 41 78 31 Q74 17 60 19" stroke="${HR}" stroke-width="4" fill="none" stroke-linecap="round"/>` + gloss(44, 19, 9, 3, -15, 0.3);
      if (c.hair === 'messy') s += hairShapes.messy() + `<path d="M40 16 Q56 7 76 14" stroke="#fff" stroke-opacity=".28" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      if (c.hair === 'spikes') s += hairShapes.spikes() + `<path d="M30 20 L36 10 M52 12 L56 4 M76 10 L82 6" stroke="#fff" stroke-opacity=".4" stroke-width="2" fill="none" stroke-linecap="round"/>`;
      return s;
    };
    const hairBackLong = () => `<path d="M30 40 Q20 86 36 98 Q47 93 46 70 L46 40Z M90 40 Q100 86 84 98 Q73 93 74 70 L74 40Z" fill="${cyl(HR)}" ${ST(HR, 1.2)}/>`;

    // =====================================================================
    //  VISTA DE FRENTE
    // =====================================================================
    function front() {
      o.push(`<ellipse cx="60" cy="152" rx="36" ry="6" fill="#000" opacity=".28"/><ellipse cx="60" cy="152" rx="22" ry="3.4" fill="#000" opacity=".25"/>`);
      // capa detrás
      const capeC = shade(A, -0.1);
      if (c.cape === 'long') o.push(P('M36 78 Q60 69 84 78 L104 146 Q60 160 16 146Z', cyl(capeC), capeC) + `<path d="M60 82 L60 154 M48 82 L38 150 M72 82 L82 150" stroke="#000" stroke-opacity=".16" stroke-width="1.4" fill="none"/>`);
      if (c.cape === 'short') o.push(P('M36 78 Q60 69 84 78 L96 124 Q60 136 24 124Z', cyl(capeC), capeC) + `<path d="M60 82 L60 128 M49 82 L42 126 M71 82 L78 126" stroke="#000" stroke-opacity=".16" stroke-width="1.4" fill="none"/>`);
      if (c.hair === 'long') o.push(hairBackLong());
      // piernas
      o.push(R(44, 104, 15, 38, 7, cyl(PANT), PANT) + R(61, 104, 15, 38, 7, cyl(PANT), PANT));
      o.push(gloss(49, 120, 1.8, 9, 0, 0.22));
      // botas / zapatos
      if (OUT === 'hero') {
        o.push(P('M41 134 Q41 127 48 127 L56 127 Q61 127 61 133 L61 144 Q63 151 57 151 L44 151 Q37 151 39 144Z', cyl(A), A, 1.4));
        o.push(P('M59 134 Q59 127 64 127 L72 127 Q79 127 79 134 L81 144 Q83 151 76 151 L63 151 Q57 151 59 144Z', cyl(A), A, 1.4));
        o.push(R(41, 127, 20, 6, 3, lin(shade(A, 0.18)), A, 1) + R(60, 127, 20, 6, 3, lin(shade(A, 0.18)), A, 1));
        o.push(`<path d="M39.5 148 Q50 152 61 148 M59 148 Q70 152 80.5 148" stroke="${shade(A, -0.6)}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>`);
        o.push(gloss(46, 138, 2, 5, 0, 0.35));
      } else {
        o.push(P('M40 142 Q40 137 47 137 L56 137 Q61 137 61 143 L62 148 Q62 152 57 152 L43 152 Q37 152 38 147Z', cyl(A), A, 1.4));
        o.push(P('M59 143 Q59 137 64 137 L73 137 Q80 137 80 142 L82 147 Q83 152 77 152 L63 152 Q58 152 58 148Z', cyl(A), A, 1.4));
        o.push(`<path d="M44 140 L55 140 M65 140 L76 140" stroke="${shade(A, 0.35)}" stroke-width="1.6" stroke-linecap="round"/>` + gloss(46, 143, 3.4, 1.4, -8, 0.35));
      }
      // torso
      if (OUT === 'labcoat') {
        o.push(P('M38 80 Q60 71 82 80 L83 108 Q60 115 37 108Z', cyl(S), S));
        o.push(P('M36 98 L84 98 L89 132 Q60 140 31 132Z', cyl(COAT), COAT, 1.4));
        o.push(`<path d="M60 100 L60 136" stroke="${shade(COAT, -0.5)}" stroke-width="1.3"/>`);
        o.push(P('M38 80 Q44 74 52 76 L60 106 L44 100Z', lin(COAT), COAT, 1.2) + P('M82 80 Q76 74 68 76 L60 106 L76 100Z', lin(COAT), COAT, 1.2));
        o.push(R(66, 108, 11, 9, 2.5, shade(COAT, -0.04), COAT, 1) + `<rect x="68" y="104" width="2" height="8" rx="1" fill="#e8523c"/>`);
        o.push(gloss(45, 90, 3, 10, -6, 0.3));
      } else {
        o.push(P('M38 80 Q60 71 82 80 L83 108 Q60 115 37 108Z', cyl(S), S));
        o.push(gloss(46, 90, 3.6, 12, -5, 0.24));
        if (OUT === 'hero') {
          o.push(R(37, 101, 46, 9, 4, lin(A), A, 1.2) + R(53.5, 100.5, 13, 10, 3, lin('#f2c200'), '#f2c200', 1));
          o.push(`<path d="M44 90 Q60 96 76 90" stroke="${shade(S, -0.35)}" stroke-width="1.2" fill="none" opacity=".5"/>`);
        } else { // casual
          o.push(P('M52 78 L60 98 L68 78Z', '#14141a', '#14141a', 1));
          o.push(`<path d="M60 82 L60 108" stroke="${shade(S, -0.55)}" stroke-width="1.2"/>`);
          [88, 94, 100, 106].forEach((y) => o.push(`<circle cx="60" cy="${y}" r="1.7" fill="#e9e6da" ${ST('#e9e6da', .5)}/>`));
          o.push(R(42, 90, 11, 9, 2, 'none', S, 1.1) + R(67, 90, 11, 9, 2, 'none', S, 1.1));
          o.push(`<path d="M42 92 L53 92 M67 92 L78 92" stroke="${shade(S, 0.3)}" stroke-width=".8" opacity=".7"/>`);
          o.push(P('M48 76 L60 84 L52 90Z', lin(S), S, 1.1) + P('M72 76 L60 84 L68 90Z', lin(S), S, 1.1));
        }
      }
      if (OUT !== 'labcoat') o.push(emblem());
      // brazos
      o.push(arm(32, 14) + arm(88, -14));
      // hombros redondeados
      if (OUT === 'hero') o.push(`<circle cx="37" cy="84" r="8.2" fill="${rad(S)}"/><circle cx="83" cy="84" r="8.2" fill="${rad(S)}"/>`);
      o.push(item(false));
      // cuello y cabeza
      const neckC = OUT === 'casual' ? shade(K, -0.12) : shade(K, -0.14);
      o.push(R(52, 68, 16, 14, 5, cyl(neckC), K));
      o.push(`<ellipse cx="60" cy="76" rx="14" ry="5" fill="#000" opacity=".16"/>`);
      o.push(`<circle cx="30.5" cy="50" r="5.4" fill="${rad(K)}" ${ST(K, 1.1)}/><circle cx="89.5" cy="50" r="5.4" fill="${rad(K)}" ${ST(K, 1.1)}/><circle cx="30.5" cy="50" r="2.2" fill="${shade(K, -0.2)}" opacity=".6"/><circle cx="89.5" cy="50" r="2.2" fill="${shade(K, -0.2)}" opacity=".6"/>`);
      o.push(`<ellipse cx="60" cy="46" rx="30" ry="29" fill="${rad(K)}" ${ST(K, 1.5)}/>`);
      // cara
      o.push(eye(49, 51) + eye(71, 51));
      const browW = c.hair === 'messy' ? 3.8 : 2.8;
      o.push(`<path d="M40 40.5 Q49 36 57 40.5 M63 40.5 Q71 36 80 40.5" stroke="${HR}" stroke-width="${browW}" fill="none" stroke-linecap="round"/>`);
      o.push(`<path d="M59.5 57 Q56.6 60.4 61 60.8" stroke="${shade(K, -0.42)}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`);
      if (OUT === 'hero') o.push(`<path d="M51 64 Q60 74 69 64Z" fill="#7d2a2a" ${ST('#7d2a2a', .8)}/><path d="M52.6 64.6 Q60 69 67.4 64.6Z" fill="#fff"/>`);
      else if (OUT === 'casual') o.push(`<path d="M52 65 Q60 70 68 65" stroke="${shade(K, -0.6)}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`);
      else o.push(`<path d="M52 66 Q56 64 60 66 Q65 69 69 64" stroke="${shade(K, -0.6)}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`);
      o.push(`<circle cx="41" cy="61" r="4.6" fill="#ff6f6f" opacity=".2"/><circle cx="79" cy="61" r="4.6" fill="#ff6f6f" opacity=".2"/>`);
      o.push(gloss(45, 29, 10, 4.5, -28, 0.26));
      o.push(hairFront());
      // máscaras y cascos
      const cowl = `<path d="M30 50 Q26 10 60 10 Q94 10 90 50 L90 54 Q60 42 30 54Z" fill="${gearBase}" ${ST(S, 1.4)}/>`;
      switch (c.headgear) {
        case 'domino':
          o.push(`<path d="M30 41 Q60 33 90 41 L89 58 Q60 51 31 58Z" fill="${lin(S)}" ${ST(S, 1.3)}/>` + eye(49, 51) + eye(71, 51) + gloss(44, 40, 8, 2, -8, 0.3)); break;
        case 'cowl_ears':
          o.push(`<path d="M31 31 L27 -1 L53 19Z" fill="${lin(S)}" ${ST(S, 1.3)}/><path d="M89 31 L93 -1 L67 19Z" fill="${lin(S)}" ${ST(S, 1.3)}/>` + cowl + slit(49, 0) + slit(71, 1) + gloss(44, 24, 9, 4, -25, 0.3)); break;
        case 'cowl_wings':
          o.push(`<path d="M30 40 L4 27 L26 55Z M90 40 L116 27 L94 55Z" fill="${lin(A)}" ${ST(A, 1.3)}/><path d="M26 38 L12 31 M94 38 L108 31" stroke="#fff" stroke-opacity=".45" stroke-width="1.2" stroke-linecap="round"/>` + cowl + slit(49, 0) + slit(71, 1) + gloss(44, 24, 9, 4, -25, 0.3)); break;
        case 'helmet_star':
          o.push(`<path d="M30 37 L9 25 L29 52Z M90 37 L111 25 L91 52Z" fill="${lin('#f3f3f3')}" ${ST('#9aa3ad', 1.2)}/><path d="M29 48 Q25 8 60 8 Q95 8 91 48 Q60 33 29 48Z" fill="${gearBase}" ${ST(S, 1.4)}/><polygon points="${starPts(60, 21, 8, 3.4)}" fill="${lin('#f3f3f3')}" ${ST('#9aa3ad', .8)}/>` + gloss(43, 19, 10, 4, -25, 0.35)); break;
        case 'web_mask':
          o.push(`<ellipse cx="60" cy="46" rx="30.6" ry="29.6" fill="${gearBase}" ${ST(S, 1.5)}/><path d="M60 16.4 L60 75.6 M29.4 46 L90.6 46 M34 25 Q60 44 86 25 M34 67 Q60 48 86 67 M44 19 Q52 46 44 73 M76 19 Q68 46 76 73" stroke="${line}" stroke-width="1" fill="none" stroke-opacity=".8"/><path d="M33 39 Q49 33 58 50 Q47 60 33 50Z M87 39 Q71 33 62 50 Q73 60 87 50Z" fill="#fff" ${ST('#222', 2)}/>` + gloss(45, 27, 10, 4, -28, 0.32)); break;
        case 'tiara':
          o.push(`<path d="M35 30 L42 10 L51 24 L60 5 L69 24 L78 10 L85 30 Q60 22 35 30Z" fill="${lin(A)}" ${ST(A, 1.2)}/><circle cx="60" cy="19" r="3.2" fill="#ff5a6e" ${ST('#ff5a6e', .8)}/><circle cx="59" cy="18" r="1" fill="#fff"/>`); break;
        case 'goggles':
          o.push(`<path d="M29 31 Q60 21 91 31 L91 37 Q60 27 29 37Z" fill="#2a2b33" ${ST('#2a2b33', 1)}/>` +
            [47, 73].map((x) => `<circle cx="${x}" cy="27" r="10.6" fill="${lin(A)}" ${ST(A, 1.4)}/><circle cx="${x}" cy="27" r="7.6" fill="${reg('lens', '<radialGradient id="@" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#f4ffff"/><stop offset=".5" stop-color="#aee9ee"/><stop offset="1" stop-color="#4fb6c4"/></radialGradient>')}" ${ST('#2a2b33', 1)}/><path d="M${x - 4.6} 24 Q${x - 2} 20.6 ${x + 1.4} 21.4" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".9"/>`).join('')); break;
        case 'helmet_full':
          o.push(`<ellipse cx="60" cy="46" rx="32" ry="30.4" fill="${gearBase}" ${ST(S, 1.5)}/><path d="M36 29 L84 29 L82 65 Q60 80 38 65Z" fill="${lin(A)}" ${ST(A, 1.3)}/><path d="M41 49 L57 49 L55 55 L42 55Z M63 49 L79 49 L78 55 L65 55Z" fill="#e8fbff" ${ST('#9ab', .8)}/><path d="M52 67 L68 67" stroke="${shade(A, -0.55)}" stroke-width="1.6" stroke-linecap="round"/>` + gloss(43, 21, 11, 4.5, -25, 0.38)); break;
      }
    }

    // =====================================================================
    //  VISTA DE ESPALDAS
    // =====================================================================
    function back() {
      o.push(`<ellipse cx="60" cy="152" rx="36" ry="6" fill="#000" opacity=".28"/><ellipse cx="60" cy="152" rx="22" ry="3.4" fill="#000" opacity=".25"/>`);
      const capeC = shade(A, -0.1);
      o.push(R(44, 104, 15, 38, 7, cyl(PANT), PANT) + R(61, 104, 15, 38, 7, cyl(PANT), PANT));
      if (OUT === 'hero') {
        o.push(P('M41 134 Q41 127 48 127 L56 127 Q61 127 61 133 L61 144 Q63 151 57 151 L44 151 Q37 151 39 144Z', cyl(A), A, 1.4));
        o.push(P('M59 134 Q59 127 64 127 L72 127 Q79 127 79 134 L81 144 Q83 151 76 151 L63 151 Q57 151 59 144Z', cyl(A), A, 1.4));
        o.push(R(41, 127, 20, 6, 3, lin(shade(A, 0.18)), A, 1) + R(60, 127, 20, 6, 3, lin(shade(A, 0.18)), A, 1));
      } else {
        o.push(P('M40 142 Q40 137 47 137 L56 137 Q61 137 61 143 L62 148 Q62 152 57 152 L43 152 Q37 152 38 147Z', cyl(A), A, 1.4));
        o.push(P('M59 143 Q59 137 64 137 L73 137 Q80 137 80 142 L82 147 Q83 152 77 152 L63 152 Q58 152 58 148Z', cyl(A), A, 1.4));
      }
      // torso espalda
      if (OUT === 'labcoat') {
        o.push(P('M38 80 Q60 71 82 80 L83 108 Q60 115 37 108Z', cyl(COAT), COAT));
        o.push(P('M36 98 L84 98 L89 132 Q60 140 31 132Z', cyl(COAT), COAT, 1.4));
        o.push(`<path d="M60 84 L60 136" stroke="${shade(COAT, -0.5)}" stroke-width="1.3"/>`);
      } else {
        o.push(P('M38 80 Q60 71 82 80 L83 108 Q60 115 37 108Z', cyl(S), S));
        o.push(`<path d="M60 80 L60 104" stroke="${shade(S, -0.45)}" stroke-width="1.1" opacity=".7"/>`);
        if (OUT === 'hero') o.push(R(37, 101, 46, 9, 4, lin(A), A, 1.2));
        else o.push(`<path d="M44 86 Q60 92 76 86" stroke="${shade(S, -0.4)}" stroke-width="1.2" fill="none" opacity=".6"/>`);
      }
      o.push(gloss(46, 90, 3.6, 12, -5, 0.2));
      o.push(arm(32, 14, true) + arm(88, -14, true));
      if (OUT === 'hero') o.push(`<circle cx="37" cy="84" r="8.2" fill="${rad(S)}"/><circle cx="83" cy="84" r="8.2" fill="${rad(S)}"/>`);
      o.push(item(true));
      // cuello
      o.push(R(52, 68, 16, 14, 5, cyl(shade(K, -0.14)), K));
      // capa por delante del cuerpo
      if (c.cape !== 'none') {
        const bot = c.cape === 'long' ? 142 : 122;
        o.push(P(`M36 79 Q60 69 84 79 L${c.cape === 'long' ? 100 : 94} ${bot} Q60 ${bot + 10} ${c.cape === 'long' ? 20 : 26} ${bot}Z`, cyl(capeC), capeC, 1.4));
        o.push(`<path d="M46 76 Q60 98 74 76 Q60 70 46 76Z" fill="${shade(capeC, -0.25)}" opacity=".7"/><path d="M60 94 L60 ${bot + 6} M48 90 L40 ${bot} M72 90 L80 ${bot}" stroke="#000" stroke-opacity=".18" stroke-width="1.5" fill="none"/>`);
        o.push(gloss(46, 96, 3, 14, -6, 0.2));
      }
      // cabeza (de espaldas)
      const headC = c.headgear === 'none' || c.headgear === 'domino' || c.headgear === 'tiara' || c.headgear === 'goggles';
      o.push(`<circle cx="30.5" cy="50" r="5.4" fill="${rad(K)}" ${ST(K, 1.1)}/><circle cx="89.5" cy="50" r="5.4" fill="${rad(K)}" ${ST(K, 1.1)}/>`);
      if (c.headgear === 'cowl_ears') o.push(`<path d="M31 31 L27 -1 L53 19Z" fill="${lin(S)}" ${ST(S, 1.3)}/><path d="M89 31 L93 -1 L67 19Z" fill="${lin(S)}" ${ST(S, 1.3)}/>`);
      if (c.headgear === 'cowl_wings') o.push(`<path d="M30 40 L4 27 L26 55Z M90 40 L116 27 L94 55Z" fill="${lin(A)}" ${ST(A, 1.3)}/>`);
      if (c.headgear === 'helmet_star') o.push(`<path d="M30 37 L9 25 L29 52Z M90 37 L111 25 L91 52Z" fill="${lin('#f3f3f3')}" ${ST('#9aa3ad', 1.2)}/>`);
      const big = c.headgear === 'helmet_full' ? 32 : c.headgear === 'web_mask' ? 30.6 : 30;
      o.push(`<ellipse cx="60" cy="46" rx="${big}" ry="${big - 1}" fill="${headC ? rad(K) : gearBase}" ${ST(headC ? K : S, 1.5)}/>`);
      if (c.headgear === 'web_mask') o.push(`<path d="M60 16.4 L60 75.6 M29.4 46 L90.6 46 M34 25 Q60 44 86 25 M34 67 Q60 48 86 67 M44 19 Q52 46 44 73 M76 19 Q68 46 76 73" stroke="${line}" stroke-width="1" fill="none" stroke-opacity=".8"/>`);
      if (c.headgear === 'helmet_full') o.push(`<path d="M60 16 L60 76 M34 34 Q60 44 86 34" stroke="${shade(A, -0.2)}" stroke-width="3" fill="none" opacity=".9"/><circle cx="60" cy="60" r="4" fill="${lin(A)}" ${ST(A, 1)}/>`);
      if (c.headgear === 'helmet_star' || c.headgear === 'cowl_ears' || c.headgear === 'cowl_wings') o.push(`<path d="M60 14 L60 74" stroke="${line}" stroke-width="1.2" opacity=".7"/>`);
      // pelo por detrás
      if (c.hair !== 'none' && c.headgear !== 'helmet_full' && c.headgear !== 'web_mask' && c.headgear !== 'cowl_ears' && c.headgear !== 'cowl_wings' && c.headgear !== 'helmet_star') {
        const nape = c.hair === 'long' ? 'M28 48 Q22 10 60 10 Q98 10 92 48 L94 98 Q60 108 26 98Z' : 'M28 48 Q22 10 60 10 Q98 10 92 48 Q92 62 80 68 Q60 72 40 68 Q28 62 28 48Z';
        if (c.hair === 'messy') o.push(`<path d="M28 50 Q21 12 50 6 Q60 2 70 6 Q99 12 92 50 Q93 64 82 70 L77 62 L72 72 L66 63 L60 73 L54 63 L48 72 L43 62 L38 70 Q27 64 28 50Z" fill="${cyl(HR)}" ${ST(HR, 1.3)}/><path d="M44 12 L48 1 L55 9 L60 -2 L66 9 L74 1 L76 12Z" fill="${lin(HR)}" ${ST(HR, 1.1)}/>`);
        else if (c.hair === 'spikes') o.push(`<path d="M28 48 L14 38 L26 33 L10 20 L30 22 L26 6 L42 16 L44 -2 L56 13 L66 -4 L72 14 L90 0 L89 19 L108 13 L96 30 L112 37 L92 42 Q92 62 80 68 Q60 72 40 68 Q28 62 28 48Z" fill="${cyl(HR)}" ${ST(HR, 1.3)}/>`);
        else o.push(`<path d="${nape}" fill="${cyl(HR)}" ${ST(HR, 1.3)}/>`);
        o.push(`<path d="M46 24 Q50 44 46 62 M60 18 Q62 44 60 66 M74 24 Q70 44 74 62" stroke="${shade(HR, -0.5)}" stroke-width="1.1" fill="none" opacity=".55" stroke-linecap="round"/>` + gloss(46, 20, 11, 4, -20, 0.28));
      }
      if (c.headgear === 'domino') o.push(`<path d="M30 40 Q60 48 90 40 L90 47 Q60 55 30 47Z" fill="${lin(S)}" ${ST(S, 1.2)}/>`);
      if (c.headgear === 'tiara') o.push(`<path d="M31 34 Q60 26 89 34 L89 39 Q60 31 31 39Z" fill="${lin(A)}" ${ST(A, 1.1)}/>`);
      if (c.headgear === 'goggles') o.push(`<path d="M29 32 Q60 22 91 32 L91 38 Q60 28 29 38Z" fill="#2a2b33" ${ST('#2a2b33', 1)}/>`);
      if (headC && c.hair === 'none') o.push(gloss(45, 28, 10, 4.5, -28, 0.24));
      else if (!headC) o.push(gloss(44, 22, 11, 4.5, -25, 0.3));
    }

    // =====================================================================
    //  VISTA DE LADO (mirando a la derecha)
    // =====================================================================
    function side() {
      o.push(`<ellipse cx="58" cy="152" rx="32" ry="6" fill="#000" opacity=".28"/><ellipse cx="60" cy="152" rx="20" ry="3.4" fill="#000" opacity=".25"/>`);
      const capeC = shade(A, -0.1);
      if (c.cape !== 'none') {
        const bot = c.cape === 'long' ? 148 : 124;
        o.push(P(`M52 78 Q40 72 36 82 L${c.cape === 'long' ? 18 : 28} ${bot} Q42 ${bot + 8} 58 ${bot - 2}Z`, vcl(capeC), capeC, 1.4));
        o.push(`<path d="M44 84 L34 ${bot - 4} M50 86 L46 ${bot}" stroke="#000" stroke-opacity=".18" stroke-width="1.4" fill="none"/>`);
      }
      if (c.hair === 'long') o.push(`<path d="M34 40 Q22 84 40 98 Q54 92 54 70 L54 40Z" fill="${cyl(HR)}" ${ST(HR, 1.2)}/>`);
      // pierna lejana (más oscura) y cercana
      o.push(R(49, 104, 14, 38, 7, cyl(shade(PANT, -0.25)), PANT) + R(55, 104, 15, 38, 7, cyl(PANT), PANT));
      const shoeD = shade(A, -0.2);
      if (OUT === 'hero') {
        o.push(P('M47 134 Q47 127 54 127 L62 127 Q66 127 66 134 L66 142 Q80 142 84 147 Q84 152 78 152 L50 152 Q45 152 46 146Z', cyl(shoeD), A, 1.4));
        o.push(P('M54 134 Q54 127 60 127 L68 127 Q72 127 72 134 L72 142 Q86 142 90 147 Q90 152 84 152 L56 152 Q51 152 52 146Z', cyl(A), A, 1.4));
        o.push(R(54, 127, 18, 6, 3, lin(shade(A, 0.18)), A, 1));
      } else {
        o.push(P('M48 140 Q48 136 54 136 L62 136 Q66 136 67 141 Q78 142 82 147 Q82 152 76 152 L50 152 Q45 152 46 146Z', cyl(shoeD), A, 1.4));
        o.push(P('M55 140 Q55 136 61 136 L69 136 Q73 136 74 141 Q85 142 89 147 Q89 152 83 152 L57 152 Q52 152 53 146Z', cyl(A), A, 1.4));
      }
      // torso (más estrecho)
      if (OUT === 'labcoat') {
        o.push(P('M44 80 Q58 72 72 80 L72 108 Q58 113 44 108Z', cyl(COAT), COAT));
        o.push(P('M43 98 L73 98 L77 132 Q58 138 40 132Z', cyl(COAT), COAT, 1.4));
        o.push(`<path d="M66 82 L68 104" stroke="${S}" stroke-width="4" stroke-linecap="round"/>`);
      } else {
        o.push(P('M44 80 Q58 72 72 80 L72 108 Q58 113 44 108Z', cyl(S), S));
        if (OUT === 'hero') o.push(R(43, 101, 30, 9, 4, lin(A), A, 1.2) + R(61, 100.5, 11, 10, 3, lin('#f2c200'), '#f2c200', 1));
        else {
          o.push(P('M62 78 L70 90 L64 92Z', lin(S), S, 1.1));
          o.push(`<path d="M68 84 L70 108" stroke="#14141a" stroke-width="3" opacity=".8"/>` + [92, 99, 106].map((y) => `<circle cx="70" cy="${y}" r="1.5" fill="#e9e6da"/>`).join(''));
          o.push(R(62, 90, 9, 8, 2, 'none', S, 1));
        }
      }
      if (c.emblem !== 'none') o.push(`<ellipse cx="72" cy="92" rx="2" ry="9" fill="${lin(A)}" ${ST(A, .8)}/>`);
      o.push(gloss(51, 90, 2.6, 11, -4, 0.24));
      // brazo cercano, un poco adelantado
      const sx = 58, rot = -16;
      const g = [];
      if (OUT === 'casual') {
        g.push(R(sx - 6, 92, 12, 24, 6, cyl(K), K), hand(sx, 119, K, true), R(sx - 7.6, 79, 15.2, 17, 7, cyl(S), S));
      } else if (OUT === 'labcoat') {
        g.push(hand(sx, 116, K, true), R(sx - 7.6, 79, 15.2, 33, 7.5, cyl(COAT), COAT), R(sx - 7.6, 104, 15.2, 7, 3, cyl(shade(COAT, -0.08)), COAT));
      } else {
        g.push(R(sx - 7.4, 79, 14.8, 27, 7.4, cyl(S), S), R(sx - 8.2, 99, 16.4, 9, 4, lin(A), A), E(sx, 114, 8.4, 8.2, rad(A), A), gloss(sx - 2.5, 111, 2.6, 1.6, -30, 0.4));
      }
      g.push(gloss(sx - 3, 88, 1.8, 6, 0, 0.28));
      if (c.item === 'shield') o.push(`<g transform="rotate(${rot} ${sx} 82)">${g.join('')}</g>` + `<ellipse cx="66" cy="106" rx="6" ry="18" fill="${cyl(A)}" ${ST(A, 1.4)}/><ellipse cx="64" cy="106" rx="2.6" ry="11" fill="#eef1f5" opacity=".9"/>`);
      else o.push(`<g transform="rotate(${rot} ${sx} 82)">${g.join('')}</g>`);
      if (c.item === 'hammer') o.push(`<rect x="76" y="88" width="6" height="52" rx="2.8" fill="${cyl('#7a4b22')}" ${ST('#7a4b22', 1.1)}/><rect x="70" y="66" width="18" height="24" rx="5" fill="${cyl('#b8c0cb')}" ${ST('#b8c0cb', 1.3)}/>`);
      if (c.item === 'trident') o.push(`<rect x="76" y="46" width="5" height="96" rx="2.2" fill="${cyl(A)}" ${ST(A, 1.1)}/><path d="M68 46 L68 60 Q78.5 71 89 60 L89 46 M78.5 38 L78.5 62" stroke="${shade(A, -0.65)}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M68 46 L68 60 Q78.5 71 89 60 L89 46 M78.5 38 L78.5 62" stroke="${A}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
      // cuello y cabeza de perfil
      o.push(R(52, 68, 14, 14, 5, cyl(shade(K, -0.14)), K));
      o.push(`<ellipse cx="60" cy="76" rx="11" ry="4" fill="#000" opacity=".16"/>`);
      const hw = c.headgear === 'helmet_full' ? 31 : 29;
      const headC = c.headgear === 'none' || c.headgear === 'domino' || c.headgear === 'tiara' || c.headgear === 'goggles';
      if (c.headgear === 'cowl_wings') o.push(`<path d="M40 38 L12 28 L38 58Z" fill="${lin(A)}" ${ST(A, 1.3)}/>`);
      if (c.headgear === 'helmet_star') o.push(`<path d="M44 36 L18 26 L42 54Z" fill="${lin('#f3f3f3')}" ${ST('#9aa3ad', 1.2)}/>`);
      o.push(`<ellipse cx="58" cy="46" rx="${hw}" ry="${hw - 1}" fill="${rad(K)}" ${ST(K, 1.5)}/>`);
      // nariz, ojo, boca, oreja
      o.push(`<ellipse cx="87.5" cy="57" rx="3.8" ry="3.4" fill="${rad(K)}" ${ST(K, 1.1)}/>`);
      o.push(`<ellipse cx="77" cy="51" rx="5.4" ry="7.4" fill="#fff" ${ST(K, 1.1)}/><circle cx="79" cy="52" r="4.2" fill="${irisFill}"/><circle cx="79.4" cy="52.3" r="2.1" fill="#0b0b12"/><circle cx="77.8" cy="50.2" r="1.5" fill="#fff"/><path d="M71.6 50 Q77 41.6 82.4 50" stroke="${shade(K, -0.75)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`);
      o.push(`<path d="M68 40.5 Q76 36.5 84 41" stroke="${HR}" stroke-width="${c.hair === 'messy' ? 3.6 : 2.8}" fill="none" stroke-linecap="round"/>`);
      o.push(`<path d="M76 67 Q82 70 87 66" stroke="${shade(K, -0.6)}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`);
      o.push(`<circle cx="73" cy="61" r="4.2" fill="#ff6f6f" opacity=".2"/>`);
      o.push(`<ellipse cx="50" cy="51" rx="5" ry="6.6" fill="${rad(K)}" ${ST(K, 1.1)}/><ellipse cx="50.4" cy="51.4" rx="2" ry="3.2" fill="${shade(K, -0.22)}" opacity=".6"/>`);
      o.push(gloss(48, 28, 9, 4, -20, 0.24));
      // pelo de lado
      const hairSide = (spk) => `<path d="M30 52 Q24 10 56 9 Q90 9 88 38 Q80 27 70 31 Q62 24 56 36 Q48 34 46 48 Q44 56 48 62 L44 70 Q32 66 30 52Z" fill="${lin(HR)}" ${ST(HR, 1.3)}/>` + (spk || '');
      if (c.headgear !== 'helmet_full' && c.headgear !== 'web_mask' && c.headgear !== 'cowl_ears' && c.headgear !== 'cowl_wings' && c.headgear !== 'helmet_star') {
        if (c.hair === 'short' || c.hair === 'long') o.push(hairSide() + `<path d="M40 18 Q58 10 78 17" stroke="#fff" stroke-opacity=".4" stroke-width="2.2" fill="none" stroke-linecap="round"/>`);
        if (c.hair === 'curl') o.push(hairSide(`<path d="M72 24 Q78 41 88 32 Q84 18 72 20" stroke="${shade(HR, -0.55)}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M72 24 Q78 41 88 32 Q84 18 72 20" stroke="${HR}" stroke-width="4" fill="none" stroke-linecap="round"/>`));
        if (c.hair === 'messy') o.push(`<path d="M30 54 Q22 12 52 6 Q62 0 74 5 Q96 10 90 36 L84 30 L82 40 L74 31 L70 40 L63 30 L56 42 L50 34 L46 50 Q44 58 49 64 L45 72 Q32 68 30 54Z" fill="${lin(HR)}" ${ST(HR, 1.3)}/><path d="M48 12 L52 0 L59 9 L66 -1 L72 9 L80 2 L82 14Z" fill="${lin(HR)}" ${ST(HR, 1.1)}/><path d="M42 18 Q58 8 78 14" stroke="#fff" stroke-opacity=".28" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
        if (c.hair === 'spikes') o.push(`<path d="M30 50 L14 40 L27 34 L12 22 L32 25 L28 8 L45 17 L47 -1 L58 14 L69 -3 L74 14 L90 2 L88 22 L98 24 L88 36 Q82 28 72 30 Q64 24 58 34 Q48 34 46 48 Q44 56 48 62 L44 68 Q32 64 30 50Z" fill="${lin(HR)}" ${ST(HR, 1.3)}/>`);
      }
      // cascos y máscaras de lado
      switch (c.headgear) {
        case 'domino': o.push(`<path d="M56 40 Q78 36 88 44 L87 57 Q74 53 56 57Z" fill="${lin(S)}" ${ST(S, 1.2)}/>` + `<ellipse cx="77" cy="51" rx="5.4" ry="7.4" fill="#fff" ${ST(K, 1.1)}/><circle cx="79" cy="52" r="4.2" fill="${irisFill}"/><circle cx="79.4" cy="52.3" r="2.1" fill="#0b0b12"/><circle cx="77.8" cy="50.2" r="1.5" fill="#fff"/>`); break;
        case 'cowl_ears': o.push(`<path d="M44 30 L38 -1 L64 20Z" fill="${lin(S)}" ${ST(S, 1.3)}/><path d="M30 52 Q24 8 58 8 Q92 8 88 46 L87 54 Q64 40 50 52 Q48 62 52 66 L46 72 Q32 66 30 52Z" fill="${gearBase}" ${ST(S, 1.4)}/><path d="M68 51 Q77 43 86 51 Q77 57 68 51Z" fill="#fff" ${ST(S, 1)}/>` + gloss(48, 22, 9, 4, -20, 0.3)); break;
        case 'cowl_wings': o.push(`<path d="M30 52 Q24 8 58 8 Q92 8 88 46 L87 54 Q64 40 50 52 Q48 62 52 66 L46 72 Q32 66 30 52Z" fill="${gearBase}" ${ST(S, 1.4)}/><path d="M68 51 Q77 43 86 51 Q77 57 68 51Z" fill="#fff" ${ST(S, 1)}/><path d="M44 40 L14 28 L40 60Z" fill="${lin(A)}" ${ST(A, 1.3)}/>` + gloss(52, 20, 9, 4, -20, 0.3)); break;
        case 'helmet_star': o.push(`<path d="M30 52 Q24 6 58 6 Q92 6 88 40 Q70 30 54 40 Q48 50 52 62 L46 72 Q32 66 30 52Z" fill="${gearBase}" ${ST(S, 1.4)}/><path d="M48 38 L22 28 L44 58Z" fill="${lin('#f3f3f3')}" ${ST('#9aa3ad', 1.2)}/><polygon points="${starPts(60, 20, 7, 3)}" fill="${lin('#f3f3f3')}"/>` + gloss(50, 18, 10, 4, -20, 0.34)); break;
        case 'web_mask': o.push(`<ellipse cx="58" cy="46" rx="29.6" ry="29" fill="${gearBase}" ${ST(S, 1.5)}/><path d="M58 17 L58 75 M28.4 46 L87.6 46 M33 26 Q58 44 83 26 M33 66 Q58 48 83 66 M44 20 Q52 46 44 72 M74 20 Q66 46 74 72" stroke="${line}" stroke-width="1" fill="none" stroke-opacity=".8"/><path d="M68 41 Q80 38 88 46 Q80 58 68 54Z" fill="#fff" ${ST('#222', 2)}/>` + gloss(44, 27, 10, 4, -28, 0.32)); break;
        case 'tiara': o.push(`<path d="M34 30 L40 12 L50 24 L60 7 L70 25 L80 14 L86 32 Q60 22 34 30Z" fill="${lin(A)}" ${ST(A, 1.2)}/>`); break;
        case 'goggles': o.push(`<path d="M28 34 Q58 22 88 36 L88 41 Q58 28 28 40Z" fill="#2a2b33" ${ST('#2a2b33', 1)}/><circle cx="68" cy="26" r="10.4" fill="${lin(A)}" ${ST(A, 1.4)}/><circle cx="68" cy="26" r="7.4" fill="#aee9ee" ${ST('#2a2b33', 1)}/><path d="M63.6 23 Q66 20 69.6 20.6" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>`); break;
        case 'helmet_full': o.push(`<ellipse cx="58" cy="46" rx="31.5" ry="30" fill="${gearBase}" ${ST(S, 1.5)}/><path d="M52 29 L86 31 L84 62 Q68 74 50 64Z" fill="${lin(A)}" ${ST(A, 1.3)}/><path d="M64 49 L82 50 L81 55 L66 55Z" fill="#e8fbff" ${ST('#9ab', .8)}/>` + gloss(44, 21, 11, 4.5, -25, 0.38)); break;
      }
    }

    (view === 'side' ? side : view === 'back' ? back : front)();

    // recorte: "bust" muestra solo cabeza y torso (para listas y menús)
    const vb = bust ? '12 6 96 100' : '0 -10 120 170';
    const h = bust ? Math.round(size * 100 / 96) : Math.round(size * (170 / 120));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${size}" height="${h}" role="img" aria-label="Personaje"${bust ? '' : ' style="overflow:visible"'}><defs>${defs.join('')}</defs>${o.join('')}</svg>`;
  }

  return { PARTS, PART_KEYS, MODELS, DEFAULT_CONFIG, validate, usesLocked, render };
});
