// Generador procedural isomórfico: corre en Node (PvP, el servidor es la autoridad) y en el navegador (práctica).
// Niveles de dificultad: 1 = fácil · 2 = medio (el de siempre) · 3 = difícil. Duelo = nivel 2 por defecto.
(function (r, f) { typeof module === 'object' && module.exports ? module.exports = f() : r.MathGen = f(); })(typeof self !== 'undefined' ? self : this, function () {
  const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = a => a[ri(0, a.length - 1)];
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const dig = n => ri(10 ** (n - 1), 10 ** n - 1);
  const L = (lv, a, b, c) => lv === 1 ? a : lv === 3 ? c : b;   // valor según el nivel
  const ICONS = ['🌟', '🍎', '🔷', '🐱', '🍀', '🚀'];

  const G = {
    // fácil 2×1 · medio 2×1 hasta 2×3 · difícil 3×2 dígitos
    mul(lv) {
      const a = lv === 3 ? dig(3) : dig(2), b = lv === 1 ? ri(2, 9) : lv === 3 ? dig(2) : dig(ri(1, 3));
      return { prompt: `${a} × ${b}`, answer: a * b };
    },

    // siempre exacta. fácil: ÷ una cifra · medio: miles ÷ decenas · difícil: ÷ 12 a 29
    div(lv) {
      if (lv === 1) { const d = ri(2, 9), q = ri(12, 99); return { prompt: `${d * q} ÷ ${d}`, answer: q }; }
      if (lv === 3) { const d = ri(12, 29), q = ri(30, 99); return { prompt: `${(d * q).toLocaleString('en-US')} ÷ ${d}`, answer: q }; }
      const d = ri(2, 9) * 10, q = ri(Math.ceil(1000 / d), Math.floor(9999 / d));
      return { prompt: `${(d * q).toLocaleString('en-US')} ÷ ${d}`, answer: q };
    },

    // Álgebra visual con íconos aleatorios (5 variantes según el nivel)
    algebra(lv) {
      const [A, B] = ICONS.slice().sort(() => Math.random() - .5);
      const v = pick(L(lv, [1, 2], [1, 2, 3, 5], [3, 4, 5])), hi = L(lv, 15, 30, 50);
      if (v === 1) { const x = ri(3, L(lv, 15, 40, 40)), k = pick([2, 3, 4]);
        return { prompt: `${Array(k).fill(A).join(' + ')} = ${x * k}\n${A} = ?`, answer: x }; }
      if (v === 2) { const a = ri(8, hi), b = ri(2, a - 1);
        return { prompt: `${A} + ${B} = ${a + b}\n${A} − ${B} = ${a - b}\n${A} = ?`, answer: a }; }
      if (v === 3) { const a = ri(5, hi - 5), b = ri(3, Math.floor(hi / 2));
        return { prompt: `${B} + ${B} = ${2 * b}\n${A} + ${B} = ${a + b}\n${A} = ?`, answer: a }; }
      if (v === 4) { const a = ri(5, hi - 5), b = ri(3, Math.floor(hi / 2));
        return { prompt: `${A} + ${A} + ${B} = ${2 * a + b}\n${A} + ${B} + ${B} = ${a + 2 * b}\n${A} = ?`, answer: a }; }
      const m = L(lv, 9, 12, 19), a = ri(3, m), b = ri(3, m);
      return { prompt: `${B} = ${b}\n${A} × ${B} = ${a * b}\n${A} = ?`, answer: a };
    },

    // Patrones: aritmética, geométrica, alternada, cuadrados+c, tabla f(x)=ax+b, diferencias crecientes, tipo Fibonacci
    pattern(lv) {
      const t = pick(L(lv, [1, 2, 3], [1, 2, 3, 4, 5], [2, 3, 5, 6, 7]));
      if (t === 5) {
        const a = ri(2, L(lv, 9, 9, 12)), b = lv === 3 ? ri(0, 25) : ri(-5, 12);
        const xs = [...new Set(Array.from({ length: 8 }, () => ri(1, 12)))].slice(0, 4).sort((p, q) => p - q);
        const h = ri(2, xs.length - 1);
        return { prompt: xs.map((x, i) => `${x} → ${i === h ? '?' : a * x + b}`).join('\n'), answer: a * xs[h] + b };
      }
      let s;
      if (t === 1) { const a = ri(2, L(lv, 20, 30, 60)), d = ri(L(lv, 2, 3, 7), L(lv, 9, 19, 39)); s = [0, 1, 2, 3, 4].map(n => a + d * n); }
      else if (t === 2) { const a = ri(1, L(lv, 4, 5, 5)), m = pick(L(lv, [2], [2, 3], [2, 3, 4])); s = [0, 1, 2, 3, 4].map(n => a * m ** n); }
      else if (t === 3) { const lo = L(lv, 2, 2, 3), hi = L(lv, 9, 9, 15), d1 = ri(lo, hi), d2 = ri(lo, hi); s = [ri(1, L(lv, 20, 20, 40))]; for (let n = 1; n < 6; n++) s.push(s[n - 1] + (n % 2 ? d1 : d2)); }
      else if (t === 4) { const c = ri(0, 9); s = [1, 2, 3, 4, 5].map(n => n * n + c); }
      else if (t === 6) { const a = ri(1, 20), d = ri(1, 8), e = ri(1, 5); s = [0, 1, 2, 3, 4, 5].map(n => a + d * n + e * n * (n - 1) / 2); }
      else { s = [ri(1, 6), ri(2, 9)]; for (let n = 2; n < 6; n++) s.push(s[n - 1] + s[n - 2]); }
      const h = ri(2, s.length - 1), answer = s[h];
      return { prompt: s.map((v, i) => i === h ? '?' : v).join(',  '), answer };
    },

    // Sumas y restas encadenadas, nunca negativas
    mixed(lv) {
      let total = L(lv, ri(100, 999), ri(500, 4999), ri(1000, 9999)), expr = `${total}`;
      for (let i = L(lv, 2, ri(2, 3), ri(3, 4)); i > 0; i--) {
        const x = lv === 1 ? pick([dig(2), dig(2), dig(3)]) : lv === 3 ? pick([dig(3), ri(1000, 4999), dig(4)]) : pick([dig(2) * 10, dig(3), ri(1000, 4999)]);
        const minus = total - x > 0 && Math.random() < .5;
        total += minus ? -x : x; expr += ` ${minus ? '−' : '+'} ${x}`;
      }
      return { prompt: expr, answer: total };
    },

    // Porcentajes exactos y simplificación de fracciones (respuesta "p/q")
    percent(lv) {
      if (Math.random() < .7) {
        const p = pick(L(lv, [10, 20, 25, 50], [5, 10, 15, 20, 25, 30, 40, 60, 75], [5, 10, 12, 15, 20, 25, 30, 35, 40, 45, 60, 75, 80]));
        const [lo, hi] = L(lv, [20, 400], [100, 900], [200, 2000]), step = 100 / gcd(p, 100);
        const base = step * ri(Math.ceil(lo / step), Math.floor(hi / step));
        return { prompt: `${p}% de ${base}`, answer: base * p / 100 };
      }
      const [pm, qm, km, kx] = L(lv, [5, 8, 2, 5], [7, 12, 2, 9], [11, 16, 3, 12]);
      let p, q; do { p = ri(1, pm); q = ri(p + 1, qm); } while (gcd(p, q) !== 1);
      const k = ri(km, kx);
      return { prompt: `Simplifica ${p * k}/${q * k}`, answer: `${p}/${q}` };
    },

    // Cuadrados y raíces exactas (fácil hasta 15², medio hasta 30², difícil hasta 40²)
    powroot(lv) {
      const [a, b] = L(lv, [6, 15], [11, 30], [16, 40]), n = ri(a, b);
      return Math.random() < .5 ? { prompt: `${n}²`, answer: n * n } : { prompt: `√${n * n}`, answer: n };
    },

    // Número escondido: □ × 7 = 245 · 340 − □ = 188 · □ × 6 + 14 = 98
    hidden(lv) {
      const [xl, xh] = L(lv, [2, 12], [6, 40], [12, 60]), [fl, fh] = L(lv, [2, 9], [3, 12], [6, 19]), [sl, sh] = L(lv, [10, 99], [100, 999], [1000, 9999]);
      const x = ri(xl, xh), b = ri(fl, fh), s1 = ri(sl, sh), s2 = ri(sl, sh), t = ri(1, lv === 1 ? 8 : 9);
      if (t === 1) return { prompt: `□ × ${b} = ${x * b}`, answer: x };
      if (t === 2) return { prompt: `${b} × □ = ${x * b}`, answer: x };
      if (t === 3) return { prompt: `□ ÷ ${b} = ${x}`, answer: x * b };
      if (t === 4) return { prompt: `${x * b} ÷ □ = ${x}`, answer: b };
      if (t === 5) return { prompt: `□ + ${s2} = ${s1 + s2}`, answer: s1 };
      if (t === 6) return { prompt: `${s2} + □ = ${s1 + s2}`, answer: s1 };
      if (t === 7) return { prompt: `□ − ${s2} = ${s1}`, answer: s1 + s2 };
      if (t === 8) return { prompt: `${s1 + s2} − □ = ${s2}`, answer: s1 };
      const plus = Math.random() < .5, c = ri(3, Math.min(L(lv, 20, 40, 90), x * b - 1));
      return { prompt: `□ × ${b} ${plus ? '+' : '−'} ${c} = ${x * b + (plus ? c : -c)}`, answer: x };
    },

    // Orden de operaciones y paréntesis: (48 ÷ 6) + 3 × 5 · todas las divisiones son exactas, nunca hay negativos
    order(lv) {
      const m = L(lv, 9, 12, 15), big = L(lv, 30, 80, 150), n = ri;
      const T = [
        () => { const b = n(2, 9), q = n(2, m), c = n(2, 9), d = n(2, Math.min(m, 12)); return [`(${b * q} ÷ ${b}) + ${c} × ${d}`, q + c * d]; },
        () => { const a = n(5, big), b = n(2, m), c = n(2, m); return [`${a} + ${b} × ${c}`, a + b * c]; },
        () => { const a = n(3, m), b = n(3, m), q = n(2, 8), d = n(2, 9); return [`${a} × ${b} − ${q * d} ÷ ${d}`, a * b - q]; },
        () => { const a = n(2, big), b = n(2, big), c = n(2, m); return [`(${a} + ${b}) × ${c}`, (a + b) * c]; },
        () => { const b = n(2, m), c = n(2, m), a = b * c + n(1, big); return [`${a} − ${b} × ${c}`, a - b * c]; },
        () => { const b = n(2, big), a = b + n(2, big), c = n(2, m), d = n(2, m); return [`(${a} − ${b}) × (${c} + ${d})`, (a - b) * (c + d)]; },
        () => { const a = n(2, m), b = n(2, m), c = n(2, m), d = n(2, m); return [`${a} × ${b} + ${c} × ${d}`, a * b + c * d]; },
        () => { const d = n(2, m), c = d + n(2, 9), a = n(2, big), b = n(2, m); return [`${a} + ${b} × (${c} − ${d})`, a + b * (c - d)]; },
      ];
      const [prompt, answer] = T[pick(L(lv, [1, 3, 4, 0], [0, 1, 2, 3, 4, 5, 6, 7], [0, 2, 5, 6, 7]))]();
      return { prompt, answer };
    },

    // Problemas con contexto corto (2 líneas máximo). Respuesta siempre entera.
    story(lv) {
      const n = ri, S = [
        () => { const c = n(L(lv, 3, 4, 6), L(lv, 6, 9, 15)), k = n(L(lv, 6, 10, 12), L(lv, 12, 24, 48)), r = n(2, Math.min(c * k - 1, L(lv, 9, 25, 60)));
          return [`${c} cajas de ${k} ${pick(['huevos', 'lápices', 'galletas', 'botellas'])}.\nSe pierden ${r}. ¿Cuántos quedan?`, c * k - r]; },
        () => { const p = pick(L(lv, [10, 20, 25, 50], [10, 20, 25, 50, 15, 30, 40], [10, 20, 25, 50, 15, 30, 40, 60, 75])), price = 20 * n(L(lv, 5, 8, 15), L(lv, 20, 40, 100));
          return [`${pick(['Una camisa', 'Unos tenis', 'Una mochila', 'Un balón'])} de $${price}.\nDescuento: ${p}%. ¿Cuánto pagas?`, price - price * p / 100]; },
        () => { const h = n(L(lv, 1, 1, 2), L(lv, 3, 3, 5)), mi = lv === 1 ? 5 * n(1, 11) : n(5, 59);
          return [`Una película dura ${h} h ${mi} min.\n¿Cuántos minutos son?`, h * 60 + mi]; },
        () => { const k = n(3, L(lv, 6, 9, 12)), q = n(L(lv, 5, 10, 15), L(lv, 20, 40, 80));
          return [`${k * q} ${pick(['caramelos', 'stickers', 'canicas', 'cartas'])} entre ${k} niños.\n¿Cuántos recibe cada uno?`, q]; },
        () => { const c = n(L(lv, 2, 3, 5), L(lv, 5, 8, 12)), pr = n(L(lv, 5, 10, 25), L(lv, 25, 60, 95)), cost = c * pr, pay = Math.ceil((cost + 1) / 50) * 50 + 50 * n(0, 1);
          return [`Pagas $${pay} por ${c} ${pick(['cuadernos', 'jugos', 'revistas', 'gorras'])} de $${pr}.\n¿Cuánto recibes de cambio?`, pay - cost]; },
        () => { const v = pick(L(lv, [20, 30, 40, 50, 60], [30, 40, 50, 60, 70, 80, 90], [40, 50, 60, 70, 80, 90, 100, 110])), h = n(2, L(lv, 5, 6, 9));
          return [`Un auto va a ${v} km/h.\n¿Cuántos km recorre en ${h} horas?`, v * h]; },
        () => { const a = n(L(lv, 10, 15, 30), L(lv, 30, 60, 150)), s = n(L(lv, 50, 100, 300), L(lv, 300, 900, 2000)), w = n(3, L(lv, 6, 8, 12));
          return [`Tengo $${s} y ahorro $${a} por semana.\n¿Cuánto tendré en ${w} semanas?`, s + a * w]; },
        () => { const a = n(L(lv, 20, 30, 50), L(lv, 60, 120, 250)), b = n(5, a - 5), c = n(5, L(lv, 40, 60, 120));
          return [`Un tren lleva ${a} pasajeros.\nBajan ${b} y suben ${c}. ¿Cuántos van ahora?`, a - b + c]; },
      ];
      const [prompt, answer] = S[pick(L(lv, [0, 3, 5, 7], [0, 1, 2, 3, 4, 5, 6, 7], [0, 1, 2, 4, 6, 7]))]();
      return { prompt, answer };
    },
  };

  // Cadena que se arrastra: 12 → ×3 → +8 → ÷4 → ?   4 a 7 operaciones; × y ÷ solo por 2 o 3. Todo entero y positivo.
  // No forma parte de TYPES (no sale en Clásico ni en Práctica): es para un modo propio.
  function chain(lv) {
    const cap = L(lv, 200, 500, 999), amax = L(lv, 9, 20, 40);
    for (;;) {
      const n = ri(4, 7); let cur = ri(2, L(lv, 12, 20, 40)); const start = cur, steps = []; let prev = '';
      while (steps.length < n) {
        const op = pick(['+', '−', '×', '÷', '+', '−']), a = op === '+' || op === '−' ? ri(2, amax) : ri(2, 3);
        if (op === '+' && cur + a <= cap) cur += a;
        else if (op === '−' && cur - a >= 1) cur -= a;
        else if (op === '×' && cur * a <= cap && prev !== '÷' + a) cur *= a;
        else if (op === '÷' && cur % a === 0 && prev !== '×' + a) cur /= a;
        else continue;
        prev = op + a; steps.push(prev);
      }
      if (steps.some(s => s[0] === '×' || s[0] === '÷')) return { prompt: `${start} → ${steps.join(' → ')} → ?`, answer: cur };
    }
  }

  const TYPES = Object.keys(G);
  // Práctica: 20 s / 40 s / 1 min, y el nivel de dificultad que corresponde a cada tiempo
  const MODES = { relampago: { ms: 20000, level: 1 }, estandar: { ms: 40000, level: 2 }, precision: { ms: 60000, level: 3 } };
  const lvl = l => Math.min(3, Math.max(1, Math.round(+l) || 2));
  const generate = (types = TYPES, level = 2) => { const type = pick(types); return { type, ...G[type](lvl(level)) }; };
  const generateChain = (level = 2) => ({ type: 'chain', ...chain(lvl(level)) });
  const check = (q, v) => String(v).replace(/\s/g, '') === String(q.answer);
  const pub = q => ({ type: q.type, prompt: q.prompt }); // lo que se envía al cliente (sin respuesta)
  return { generate, generateChain, check, pub, TYPES, MODES };
});
