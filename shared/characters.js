// shared/characters.js
// Catálogo de personajes + validación + dibujo SVG.
// Corre en Node (el servidor valida) y en el navegador (dibuja).
// Los modelos son INSPIRADOS en superhéroes famosos, con nombres propios.
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
    ],
    headgear: [
      { id: 'none', name: 'Nada' },
      { id: 'domino', name: 'Antifaz' },
      { id: 'cowl_ears', name: 'Capucha con orejas' },
      { id: 'cowl_wings', name: 'Capucha con alas' },
      { id: 'helmet_star', name: 'Casco con estrella' },
      { id: 'web_mask', name: 'Máscara de red' },
      { id: 'tiara', name: 'Tiara' },
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
  };
  const PART_KEYS = Object.keys(PARTS);

  const mk = (hair, headgear, emblem, cape, item, skin, suit, accent, hairc) =>
    ({ hair, headgear, emblem, cape, item, skin, suit, accent, hairc: hairc || '#3a2616' });

  // Modelos completos (puntos de partida). Los bloqueados usan piezas bloqueadas.
  const MODELS = [
    { id: 'star_captain', name: 'Capitán Estrella', note: 'inspirado en Marvel', config: mk('short', 'helmet_star', 'star', 'none', 'shield', '#f1c8a0', '#1f4fa3', '#c8102e', '#d9b24a') },
    { id: 'web_climber', name: 'Trepamuros', note: 'inspirado en Marvel', config: mk('none', 'web_mask', 'none', 'none', 'none', '#f1c8a0', '#c8102e', '#1f4fa3') },
    { id: 'night_knight', name: 'Caballero Nocturno', note: 'inspirado en DC', config: mk('none', 'cowl_ears', 'bat', 'long', 'none', '#f1c8a0', '#2b2f3a', '#f2c200') },
    { id: 'sky_son', name: 'Hijo del Cielo', note: 'inspirado en DC', config: mk('curl', 'none', 'crest', 'long', 'none', '#f1c8a0', '#1f5fd0', '#d81f26', '#1b1b1f') },
    { id: 'amazon', name: 'Amazona', note: 'inspirado en DC', config: mk('long', 'tiara', 'star', 'none', 'none', '#e8b98f', '#c8102e', '#e6b800', '#1b1b1f') },
    { id: 'speedster', name: 'Velocista', note: 'inspirado en DC', config: mk('none', 'cowl_wings', 'bolt', 'none', 'none', '#f1c8a0', '#d81f26', '#f2c200') },
    { id: 'red_armor', name: 'Armadura Roja', note: 'inspirado en Marvel', locked: true, config: mk('none', 'helmet_full', 'circle', 'none', 'none', '#f1c8a0', '#b3202a', '#f2c200') },
    { id: 'thunder_god', name: 'Dios del Trueno', note: 'inspirado en Marvel', locked: true, config: mk('long', 'none', 'none', 'long', 'hammer', '#f1c8a0', '#3a4a6b', '#c0c8d4', '#e8c85a') },
    { id: 'sea_king', name: 'Rey del Mar', note: 'inspirado en DC', locked: true, config: mk('long', 'none', 'none', 'none', 'trident', '#e8b98f', '#1e8a5a', '#f0a800') },
    { id: 'green_ring', name: 'Anillo Verde', note: 'inspirado en DC', locked: true, config: mk('short', 'domino', 'circle', 'none', 'none', '#f1c8a0', '#1fa84f', '#111111') },
  ];
  MODELS.forEach((m) => (m.config.model = m.id));

  const DEFAULT_CONFIG = () => Object.assign({}, MODELS[0].config);

  // ---- Validación (el servidor la usa; nunca confiar en el cliente) ----
  function validate(c) {
    if (!c || typeof c !== 'object') return null;
    if (!MODELS.some((m) => m.id === c.model)) return null;
    const out = { model: c.model };
    for (const k of PART_KEYS) {
      if (typeof c[k] !== 'string' || !PARTS[k].some((p) => p.id === c[k])) return null;
      out[k] = c[k];
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
      const p = PARTS[k].find((x) => x.id === c[k]);
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

  // ---- Dibujo estilo 3D "chibi": cabeza grande, degradados que dan volumen y brillos ----
  let UID = 0;
  function render(input, size, bust) {
    const c = validate(input) || DEFAULT_CONFIG();
    size = size || 120;
    const uid = 'c' + (++UID) + '_';
    const defs = [], seen = {};
    const reg = (key, xml) => { if (!seen[key]) { seen[key] = uid + defs.length; defs.push(xml.replace('@', seen[key])); } return `url(#${seen[key]})`; };
    // cilindro: luz a la izquierda, sombra a la derecha (brazos, piernas, torso)
    const cyl = (h) => reg('y' + h, `<linearGradient id="@" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(h, -0.22)}"/><stop offset=".3" stop-color="${shade(h, 0.28)}"/><stop offset=".62" stop-color="${h}"/><stop offset="1" stop-color="${shade(h, -0.45)}"/></linearGradient>`);
    // diagonal: para piezas planas (capucha, alas, emblemas)
    const lin = (h) => reg('l' + h, `<linearGradient id="@" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(h, 0.4)}"/><stop offset=".5" stop-color="${h}"/><stop offset="1" stop-color="${shade(h, -0.4)}"/></linearGradient>`);
    // esfera: para cabeza y casco
    const rad = (h) => reg('r' + h, `<radialGradient id="@" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="${shade(h, 0.35)}"/><stop offset=".55" stop-color="${h}"/><stop offset="1" stop-color="${shade(h, -0.42)}"/></radialGradient>`);

    const S = c.suit, K = c.skin, A = c.accent, HR = c.hairc;
    const Dk = shade(S, -0.25), line = shade(S, -0.55), W = '#ffffff';
    const o = [];
    const gloss = (cx, cy, rx, ry, rot, op) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${op || 0.3}" transform="rotate(${rot || 0} ${cx} ${cy})"/>`;

    // Sombra en el suelo
    o.push(`<ellipse cx="60" cy="152" rx="32" ry="5.5" fill="#000" opacity=".3"/>`);

    // Capa (detrás)
    const capeC = shade(A, -0.12);
    if (c.cape === 'long') o.push(`<path d="M38 78 Q60 70 82 78 L102 148 Q60 160 18 148Z" fill="${cyl(capeC)}"/><path d="M60 80 L60 154 M48 80 L40 152 M72 80 L80 152" stroke="#000" stroke-opacity=".18" stroke-width="1.2" fill="none"/>`);
    if (c.cape === 'short') o.push(`<path d="M38 78 Q60 70 82 78 L94 124 Q60 134 26 124Z" fill="${cyl(capeC)}"/><path d="M60 80 L60 128 M49 80 L43 126 M71 80 L77 126" stroke="#000" stroke-opacity=".18" stroke-width="1.2" fill="none"/>`);

    // Pelo largo (detrás de la cabeza)
    if (c.hair === 'long')
      o.push(`<path d="M31 42 Q22 84 36 96 Q46 92 45 72 L45 42Z M89 42 Q98 84 84 96 Q74 92 75 72 L75 42Z" fill="${cyl(HR)}"/>`);

    // Piernas y botas
    o.push(`<rect x="44" y="104" width="14" height="38" rx="6.5" fill="${cyl(S)}"/><rect x="62" y="104" width="14" height="38" rx="6.5" fill="${cyl(S)}"/>`);
    o.push(`<rect x="41" y="130" width="19" height="20" rx="8" fill="${cyl(A)}"/><rect x="60" y="130" width="19" height="20" rx="8" fill="${cyl(A)}"/>`);
    o.push(`<rect x="41.5" y="130" width="18" height="4.5" rx="2.2" fill="${shade(A, 0.35)}"/><rect x="60.5" y="130" width="18" height="4.5" rx="2.2" fill="${shade(A, 0.35)}"/>`);

    // Torso, hombros y cinturón
    o.push(`<path d="M39 80 Q60 72 81 80 L83 108 Q60 115 37 108Z" fill="${cyl(S)}"/>`);
    o.push(gloss(48, 90, 4, 12, -6, 0.2));
    o.push(`<rect x="37" y="102" width="46" height="8" rx="3.5" fill="${lin(A)}"/><rect x="54" y="101.5" width="12" height="9" rx="2.5" fill="${lin('#f2c200')}" stroke="${shade('#f2c200', -0.4)}" stroke-width=".7"/>`);

    // Emblema (centrado en el pecho)
    const em = [];
    switch (c.emblem) {
      case 'star': em.push(`<polygon points="${starPts(60, 70, 11, 4.6)}" fill="${lin(A)}" stroke="${shade(A, -0.5)}" stroke-width=".8"/>`); break;
      case 'bolt': em.push(`<polygon points="64,56 52,71 60,71 55,85 70,66 62,66" fill="${lin(A)}" stroke="${shade(A, -0.5)}" stroke-width=".8"/>`); break;
      case 'crest': em.push(`<path d="M49 57 L71 57 L71 70 Q71 79 60 84 Q49 79 49 70Z" fill="${lin(A)}" stroke="${shade(A, -0.5)}" stroke-width=".8"/><path d="M54 61 L66 61 L66 69 Q66 74 60 77 Q54 74 54 69Z" fill="${shade(A, -0.2)}"/>`); break;
      case 'bat': em.push(`<path d="M45 66 Q53 57 60 63 Q67 57 75 66 Q68 66 65 74 Q60 69 55 74 Q52 66 45 66Z" fill="${lin(A)}" stroke="${shade(A, -0.5)}" stroke-width=".8"/>`); break;
      case 'circle': em.push(`<circle cx="60" cy="70" r="10" fill="${lin(A)}" stroke="${shade(A, -0.5)}" stroke-width=".8"/><circle cx="60" cy="70" r="6" fill="#dffaff"/><circle cx="58" cy="68" r="2.4" fill="#fff"/>`); break;
    }
    if (em.length) o.push(`<g transform="translate(60 92) scale(.82) translate(-60 -70)">${em.join('')}</g>`);

    // Brazos y guantes
    o.push(`<rect x="25" y="79" width="14" height="30" rx="7" fill="${cyl(S)}"/><rect x="81" y="79" width="14" height="30" rx="7" fill="${cyl(S)}"/>`);
    o.push(`<rect x="23.5" y="102" width="17" height="15" rx="7" fill="${cyl(A)}"/><rect x="79.5" y="102" width="17" height="15" rx="7" fill="${cyl(A)}"/>`);
    o.push(`<rect x="24" y="102" width="16" height="4" rx="2" fill="${shade(A, 0.35)}"/><rect x="80" y="102" width="16" height="4" rx="2" fill="${shade(A, 0.35)}"/>`);

    // Objeto
    if (c.item === 'shield') {
      o.push(`<circle cx="22" cy="100" r="19" fill="${rad(A)}" stroke="${shade(A, -0.5)}" stroke-width="1"/><circle cx="22" cy="100" r="14" fill="#eef1f5"/><circle cx="22" cy="100" r="9.5" fill="${rad(A)}"/><polygon points="${starPts(22, 100, 7, 2.9)}" fill="#f3f3f3"/>`);
      o.push(gloss(15, 90, 7, 3, -35, 0.35));
    }
    if (c.item === 'hammer')
      o.push(`<rect x="90" y="86" width="5.5" height="52" rx="2.5" fill="${cyl('#7a4b22')}"/><rect x="78" y="68" width="30" height="20" rx="4" fill="${cyl('#b8c0cb')}" stroke="#6b7480" stroke-width=".8"/><rect x="78" y="75" width="30" height="3" fill="#6b7480" opacity=".5"/>` + gloss(86, 72, 6, 2, 0, 0.5));
    if (c.item === 'trident')
      o.push(`<rect x="90" y="46" width="4.5" height="96" rx="2" fill="${cyl(A)}"/><path d="M80 46 L80 60 Q92.2 70 104 60 L104 46 M92.2 40 L92.2 62" stroke="${A}" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M80 46 L80 60 Q92.2 70 104 60 L104 46 M92.2 40 L92.2 62" stroke="#fff" stroke-opacity=".35" stroke-width="1" fill="none" stroke-linecap="round" transform="translate(-.8 -.8)"/>`);

    // Cuello y orejas
    o.push(`<rect x="53" y="68" width="14" height="14" rx="4" fill="${cyl(shade(K, -0.12))}"/>`);
    o.push(`<circle cx="31" cy="49" r="4.6" fill="${rad(K)}"/><circle cx="89" cy="49" r="4.6" fill="${rad(K)}"/>`);
    // Cabeza grande
    o.push(`<ellipse cx="60" cy="46" rx="29" ry="28" fill="${rad(K)}"/>`);
    // Cara: ojos grandes con brillo, cejas, nariz, sonrisa y mejillas
    const eye = (x) => `<ellipse cx="${x}" cy="51" rx="6" ry="7.2" fill="#fff" stroke="${shade(K, -0.5)}" stroke-width=".7"/><circle cx="${x}" cy="52" r="4.2" fill="${reg('iris', '<radialGradient id="@" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#8cc4ff"/><stop offset=".6" stop-color="#2f6fd0"/><stop offset="1" stop-color="#143a7a"/></radialGradient>')}"/><circle cx="${x}" cy="52.3" r="2" fill="#0b0b12"/><circle cx="${x - 1.4}" cy="50.4" r="1.4" fill="#fff"/>`;
    o.push(eye(49) + eye(71));
    o.push(`<path d="M41 41 Q49 37 56 41 M64 41 Q71 37 79 41" stroke="${HR}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`);
    o.push(`<path d="M59 57 Q56.5 60 60.5 60.5" stroke="${shade(K, -0.4)}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`);
    o.push(`<path d="M51 64 Q60 73 69 64Z" fill="#7d2a2a"/><path d="M52.6 64.4 Q60 68.6 67.4 64.4Z" fill="#fff"/>`);
    o.push(`<circle cx="42" cy="61" r="4.2" fill="#ff6f6f" opacity=".22"/><circle cx="78" cy="61" r="4.2" fill="#ff6f6f" opacity=".22"/>`);
    o.push(gloss(45, 30, 10, 4.5, -28, 0.25));

    // Pelo de adelante
    const capHair = `<path d="M30 48 Q26 12 60 12 Q94 12 90 48 Q86 30 72 27 Q60 35 48 27 Q34 30 30 48Z" fill="${lin(HR)}"/><path d="M40 22 Q56 14 76 20" stroke="${shade(HR, 0.45)}" stroke-opacity=".7" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    if (c.hair === 'short' || c.hair === 'long') o.push(capHair);
    if (c.hair === 'curl') o.push(capHair + `<path d="M58 24 Q64 40 77 31 Q73 19 60 21" stroke="${HR}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`);

    // Máscaras y cascos
    const slit = (x, flip) => `<path d="M${x - 8} 51 Q${x} ${flip ? 43 : 44} ${x + 8} 51 Q${x} 56 ${x - 8} 51Z" fill="#fff" stroke="${line}" stroke-width=".8"/>`;
    const cowl = `<path d="M31 50 Q27 12 60 11 Q93 12 89 50 L89 54 Q60 42 31 54Z" fill="${rad(S)}"/>`;
    switch (c.headgear) {
      case 'domino':
        o.push(`<path d="M31 42 Q60 34 89 42 L88 57 Q60 50 32 57Z" fill="${lin(S)}" stroke="${line}" stroke-width=".8"/>` + slit(49, 0) + slit(71, 1)); break;
      case 'cowl_ears':
        o.push(`<path d="M32 30 L29 2 L52 20Z" fill="${lin(S)}" stroke="${line}" stroke-width=".8"/><path d="M88 30 L91 2 L68 20Z" fill="${lin(S)}" stroke="${line}" stroke-width=".8"/>` + cowl + slit(49, 0) + slit(71, 1) + gloss(44, 24, 9, 4, -25, 0.28)); break;
      case 'cowl_wings':
        o.push(`<path d="M31 40 L6 28 L27 54Z M89 40 L114 28 L93 54Z" fill="${lin(A)}" stroke="${shade(A, -0.5)}" stroke-width=".8"/>` + cowl + slit(49, 0) + slit(71, 1) + gloss(44, 24, 9, 4, -25, 0.28)); break;
      case 'helmet_star':
        o.push(`<path d="M31 36 L12 26 L30 50Z M89 36 L108 26 L90 50Z" fill="${lin('#f3f3f3')}" stroke="#9aa3ad" stroke-width=".8"/><path d="M30 46 Q26 10 60 10 Q94 10 90 46 Q60 34 30 46Z" fill="${rad(S)}"/><polygon points="${starPts(60, 21, 7, 3)}" fill="${lin('#f3f3f3')}"/>` + gloss(44, 20, 10, 4, -25, 0.3)); break;
      case 'web_mask':
        o.push(`<ellipse cx="60" cy="46" rx="29.6" ry="28.6" fill="${rad(S)}"/><path d="M60 17.4 L60 74.6 M30.4 46 L89.6 46 M35 26 Q60 44 85 26 M35 66 Q60 48 85 66 M44 20 Q52 46 44 72 M76 20 Q68 46 76 72" stroke="${line}" stroke-width="1" fill="none" stroke-opacity=".8"/><path d="M35 40 Q49 35 57 50 Q47 59 35 50Z M85 40 Q71 35 63 50 Q73 59 85 50Z" fill="#fff" stroke="${line}" stroke-width="1.4"/>` + gloss(45, 28, 10, 4, -28, 0.3)); break;
      case 'tiara':
        o.push(`<path d="M36 28 L43 11 L51 24 L60 6 L69 24 L77 11 L84 28 Q60 21 36 28Z" fill="${lin(A)}" stroke="${shade(A, -0.5)}" stroke-width=".8"/><circle cx="60" cy="19" r="3" fill="#ff5a6e"/><circle cx="59" cy="18" r="1" fill="#fff"/>`); break;
      case 'helmet_full':
        o.push(`<ellipse cx="60" cy="46" rx="31.5" ry="30" fill="${rad(S)}"/><path d="M37 30 L83 30 L81 64 Q60 78 39 64Z" fill="${lin(A)}" stroke="${shade(A, -0.5)}" stroke-width=".8"/><path d="M42 49 L57 49 L55 54 L43 54Z M63 49 L78 49 L77 54 L65 54Z" fill="#e8fbff"/><path d="M52 66 L68 66" stroke="${shade(A, -0.5)}" stroke-width="1.4" stroke-linecap="round"/>` + gloss(44, 22, 11, 4.5, -25, 0.35)); break;
    }

    // recorte: "bust" muestra solo cabeza y torso (para listas y menús)
    const vb = bust ? '12 6 96 100' : '0 0 120 160';
    const h = bust ? Math.round(size * 100 / 96) : Math.round(size * (160 / 120));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${size}" height="${h}" role="img" aria-label="Personaje"><defs>${defs.join('')}</defs>${o.join('')}</svg>`;
  }

  return { PARTS, PART_KEYS, MODELS, DEFAULT_CONFIG, validate, usesLocked, render };
});
