// server/characters.js
// Rutas del personaje. El servidor es la autoridad:
//  - valida cada pieza y color con shared/characters.js
//  - la clave secreta vive SOLO en la variable de entorno UNLOCK_CODE
const crypto = require('crypto');
const express = require('express');
const Characters = require('../shared/characters');

// Comparar sin revelar información por tiempo: se convierten ambos textos a
// un hash de tamaño fijo (timingSafeEqual exige longitudes iguales).
function sameSecret(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// Límite de intentos fallidos por usuario: 5 fallos => bloqueo de 15 minutos.
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const fails = new Map(); // userId -> { n, until }

// getUserId(req) debe devolver el id del usuario con sesión, o null.
module.exports = function mountCharacters(app, pool, getUserId) {
  const json = express.json({ limit: '2kb' });

  app.get('/api/character', async (req, res) => {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'Inicia sesión' });
    try {
      const r = await pool.query('SELECT character, chars_unlocked FROM users WHERE id = $1', [uid]);
      if (!r.rows.length) return res.status(401).json({ error: 'Inicia sesión' });
      const saved = Characters.validate(r.rows[0].character);
      res.json({ character: saved || Characters.DEFAULT_CONFIG(), unlocked: r.rows[0].chars_unlocked });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error del servidor' });
    }
  });

  app.post('/api/character', json, async (req, res) => {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'Inicia sesión' });
    const clean = Characters.validate(req.body && req.body.character);
    if (!clean) return res.status(400).json({ error: 'Personaje no válido' });
    try {
      const r = await pool.query('SELECT chars_unlocked FROM users WHERE id = $1', [uid]);
      if (!r.rows.length) return res.status(401).json({ error: 'Inicia sesión' });
      if (Characters.usesLocked(clean) && !r.rows[0].chars_unlocked)
        return res.status(403).json({ error: 'Ese personaje o pieza está bloqueado' });
      await pool.query('UPDATE users SET character = $1 WHERE id = $2', [JSON.stringify(clean), uid]);
      res.json({ ok: true, character: clean });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error del servidor' });
    }
  });

  app.post('/api/character/unlock', json, async (req, res) => {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'Inicia sesión' });
    const secret = process.env.UNLOCK_CODE;
    if (!secret) return res.status(503).json({ error: 'La clave no está configurada en el servidor' });

    const st = fails.get(uid) || { n: 0, until: 0 };
    if (st.until > Date.now()) {
      const min = Math.ceil((st.until - Date.now()) / 60000);
      return res.status(429).json({ error: `Demasiados intentos. Espera ${min} min.` });
    }

    const code = req.body && typeof req.body.code === 'string' ? req.body.code.slice(0, 200) : '';
    if (!sameSecret(code, secret)) {
      st.n += 1;
      if (st.n >= MAX_FAILS) { st.until = Date.now() + LOCK_MS; st.n = 0; }
      fails.set(uid, st);
      return res.status(403).json({ error: 'Clave incorrecta' });
    }
    fails.delete(uid);
    try {
      await pool.query('UPDATE users SET chars_unlocked = TRUE WHERE id = $1', [uid]);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error del servidor' });
    }
  });
};
