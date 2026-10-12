// Generador procedural isomórfico: corre en Node (PvP, el servidor es la autoridad) y en el navegador (práctica).
(function (r, f) { typeof module === 'object' && module.exports ? module.exports = f() : r.MathGen = f(); })(typeof self !== 'undefined' ? self : this, function () {
  const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = a => a[ri(0, a.length - 1)];
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const dig = n => ri(10 ** (n - 1), 10 ** n - 1);
  const ICONS = ['🌟', '🍎', '🔷', '🐱', '🍀', '🚀'];

  const G = {
    // 2×1 hasta 2×3 dígitos
    mul() { const a = dig(2), b = dig(ri(1, 3)); return { prompt: `${a} × ${b}`, answer: a * b }; },

    // miles ÷ decenas, siempre exacta (ej. 4,520 ÷ 20)
    div() {
      const d = ri(2, 9) * 10, q = ri(Math.ceil(1000 / d), Math.floor(9999 / d));
      return { prompt: `${(d * q).toLocaleString('en-US')} ÷ ${d}`, answer: q };
    },

    // Álgebra visual: 3 variantes con íconos aleatorios
    algebra() {
      const [A, B] = ICONS.slice().sort(() => Math.random() - .5);
      const v = ri(1, 3);
      if (v === 1) { const x = ri(3, 40), k = pick([2, 3, 4]);
        return { prompt: `${Array(k).fill(A).join(' + ')} = ${x * k}\n${A} = ?`, answer: x }; }
      if (v === 2) { const a = ri(8, 30), b = ri(2, a - 1);
        return { prompt: `${A} + ${B} = ${a + b}\n${A} − ${B} = ${a - b}\n${A} = ?`, answer: a }; }
      const a = ri(5, 25), b = ri(3, 15);
      return { prompt: `${B} + ${B} = ${2 * b}\n${A} + ${B} = ${a + b}\n${A} = ?`, answer: a };
    },

    // Patrones: aritmética, geométrica, alternada, cuadrados+c, y tabla f(x)=ax+b
    pattern() {
      const t = ri(1, 5);
      if (t === 5) {
        const a = ri(2, 9), b = ri(-5, 12);
        const xs = [...new Set(Array.from({ length: 8 }, () => ri(1, 12)))].slice(0, 4).sort((p, q) => p - q);
        const h = ri(2, xs.length - 1);
        return { prompt: xs.map((x, i) => `${x} → ${i === h ? '?' : a * x + b}`).join('\n'), answer: a * xs[h] + b };
      }
      let s;
      if (t === 1) { const a = ri(2, 30), d = ri(3, 19); s = [0, 1, 2, 3, 4].map(n => a + d * n); }
      else if (t === 2) { const a = ri(1, 5), m = pick([2, 3]); s = [0, 1, 2, 3, 4].map(n => a * m ** n); }
      else if (t === 3) { const d1 = ri(2, 9), d2 = ri(2, 9); s = [ri(1, 20)]; for (let n = 1; n < 6; n++) s.push(s[n - 1] + (n % 2 ? d1 : d2)); }
      else { const c = ri(0, 9); s = [1, 2, 3, 4, 5].map(n => n * n + c); }
      const h = ri(2, s.length - 1), answer = s[h];
      return { prompt: s.map((v, i) => i === h ? '?' : v).join(',  '), answer };
    },

    // Sumas y restas grandes, nunca negativas
    mixed() {
      let total = ri(500, 4999), expr = `${total}`;
      for (let i = ri(2, 3); i > 0; i--) {
        const x = pick([dig(2) * 10, dig(3), ri(1000, 4999)]);
        const minus = total - x >= 0 && Math.random() < .5;
        total += minus ? -x : x; expr += ` ${minus ? '−' : '+'} ${x}`;
      }
      return { prompt: expr, answer: total };
    },

    // Porcentajes exactos y simplificación de fracciones (respuesta "p/q")
    percent() {
      if (Math.random() < .7) {
        const p = pick([5, 10, 15, 20, 25, 30, 40, 60, 75]), step = 100 / gcd(p, 100);
        const base = step * ri(Math.ceil(100 / step), Math.floor(900 / step));
        return { prompt: `${p}% de ${base}`, answer: base * p / 100 };
      }
      let p, q; do { p = ri(1, 7); q = ri(p + 1, 12); } while (gcd(p, q) !== 1);
      const k = ri(2, 9);
      return { prompt: `Simplifica ${p * k}/${q * k}`, answer: `${p}/${q}` };
    },

    // Cuadrados hasta 30² y raíces exactas
    powroot() {
      const n = ri(11, 30);
      return Math.random() < .5 ? { prompt: `${n}²`, answer: n * n } : { prompt: `√${n * n}`, answer: n };
    },
  };

  const TYPES = Object.keys(G);
  const MODES = { relampago: { ms: 5000 }, estandar: { ms: 10000 }, precision: { ms: 20000 } }; // solo cambia el cronómetro
  const generate = (types = TYPES) => { const type = pick(types); return { type, ...G[type]() }; };
  const check = (q, v) => String(v).replace(/\s/g, '') === String(q.answer);
  const pub = q => ({ type: q.type, prompt: q.prompt }); // lo que se envía al cliente (sin respuesta)
  return { generate, check, pub, TYPES, MODES };
});
