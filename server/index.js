const express = require('express'), http = require('http'), session = require('express-session'), bcrypt = require('bcrypt');
const { Server } = require('socket.io'), { Pool } = require('pg'), PgStore = require('connect-pg-simple')(session), fs = require('fs'), path = require('path');
const MathGen = require('../shared/mathGenerator'), { newRatings } = require('./elo');
const mountCharacters = require('./characters');
process.on('unhandledRejection', e => console.error(e));

if (!process.env.DATABASE_URL) { console.error('Falta la variable DATABASE_URL (cadena de conexión de Neon).'); process.exit(1); }
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const q = (sql, a) => pool.query(sql, a).then(r => r.rows), one = async (sql, a) => (await q(sql, a))[0];
const PUB = 'id,username,elo,wins,losses,best_survival,character', me = id => one(`SELECT ${PUB} FROM users WHERE id=$1`, [id]);

const app = express(), srv = http.createServer(app), io = new Server(srv);
app.set('trust proxy', 1);
const sess = session({ store: new PgStore({ pool, createTableIfMissing: true }), secret: process.env.SESSION_SECRET || 'cambia-esto',
  resave: false, saveUninitialized: false, cookie: { maxAge: 30 * 864e5, httpOnly: true, sameSite: 'lax' } });
app.use(express.json(), sess, express.static(path.join(__dirname, '../public')));
app.use('/shared', express.static(path.join(__dirname, '../shared')));
io.engine.use(sess);
mountCharacters(app, pool, req => req.session.uid || null);   // rutas /api/character

const GOAL = 10, LOCK_MS = 1000, MATCH_MS = 180000, GRACE_MS = 20000, CHALLENGE_MS = 30000;
const online = new Map(), active = new Map(), rematch = new Map(), lastOpp = new Map(), challenges = new Map();
let waiting = null;

/* ---------- API ---------- */
app.post('/api/register', async (q_, r) => {
  const { username, password } = q_.body;
  if (!/^\w{3,20}$/.test(username || '') || (password || '').length < 8) return r.status(400).json({ error: 'Usuario de 3-20 caracteres y contraseña de mínimo 8.' });
  try { const u = await one('INSERT INTO users(username,password_hash) VALUES($1,$2) RETURNING id', [username, await bcrypt.hash(password, 12)]);
    q_.session.uid = u.id; r.json(await me(u.id)); } catch { r.status(409).json({ error: 'Ese usuario ya existe.' }); }
});
app.post('/api/login', async (q_, r) => {
  const u = await one('SELECT * FROM users WHERE lower(username)=lower($1)', [q_.body.username || '']);
  if (!u || !(await bcrypt.compare(q_.body.password || '', u.password_hash))) return r.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  q_.session.uid = u.id; r.json(await me(u.id));
});
app.post('/api/logout', (q_, r) => q_.session.destroy(() => r.json({ ok: 1 })));
app.get('/api/me', async (q_, r) => q_.session.uid ? r.json(await me(q_.session.uid)) : r.status(401).end());
app.get('/api/ranking', async (q_, r) => {
  if (!q_.session.uid) return r.status(401).end();
  const rows = await q('SELECT id,username,elo,wins,losses,character FROM users ORDER BY elo DESC, wins DESC LIMIT 100');
  r.json(rows.map(({ id, ...u }) => ({ ...u, online: online.has(id) && !active.has(id), me: id === q_.session.uid })));
});
app.get('/api/h2h', async (q_, r) => {
  const id = q_.session.uid; if (!id) return r.status(401).end();
  r.json(await q(`SELECT u.username rival, CASE WHEN h.user_a=$1 THEN h.wins_a ELSE h.wins_b END wins,
    CASE WHEN h.user_a=$1 THEN h.wins_b ELSE h.wins_a END losses, CASE WHEN h.streak_owner=$1 THEN h.streak_len ELSE -h.streak_len END streak
    FROM h2h h JOIN users u ON u.id = CASE WHEN h.user_a=$1 THEN h.user_b ELSE h.user_a END WHERE h.user_a=$1 OR h.user_b=$1`, [id]));
});
app.post('/api/survival', async (q_, r) => {
  if (!q_.session.uid) return r.status(401).end();
  await q('UPDATE users SET best_survival=GREATEST(best_survival,$1) WHERE id=$2', [Math.floor(+q_.body.streak) || 0, q_.session.uid]); r.json(await me(q_.session.uid));
});

/* ---------- Partidas ---------- */
const other = (g, p) => g.p.find(x => x !== p);
const chars = (g, p) => ({ myChar: p.user.character, rivalChar: other(g, p).user.character });
const view = (g, p) => ({ rival: other(g, p).user, goal: GOAL, you: p.i, rv: other(g, p).i, q: MathGen.pub(g.qs[p.i]),
  msLeft: MATCH_MS - (Date.now() - g.t0), away: !!other(g, p).gone, chat: g.chat.slice(-30) });

async function startGame(a, b) {
  if (waiting && (waiting.uid === a.uid || waiting.uid === b.uid)) waiting = null;
  rematch.delete(a.uid); rematch.delete(b.uid);
  const g = { qs: Array.from({ length: GOAL }, () => MathGen.generate()), over: false, t0: Date.now(), chat: [],
    p: [a, b].map(x => ({ s: x.s, uid: x.uid, i: 0, err: 0, lock: 0, gone: null, timer: null })) };
  const users = await Promise.all(g.p.map(p => me(p.uid)));
  g.p.forEach((p, k) => { p.user = users[k]; active.set(p.uid, g); });
  g.timer = setTimeout(() => finish(g, null, 'tiempo'), MATCH_MS);   // máximo 3 minutos
  g.p.forEach(p => p.s.emit('match', view(g, p)));
}

async function finish(g, w, reason) {
  if (g.over) return; g.over = true; clearTimeout(g.timer);
  g.p.forEach(p => { clearTimeout(p.timer); active.delete(p.uid); });
  const [a, b] = g.p; lastOpp.set(a.uid, b.uid); lastOpp.set(b.uid, a.uid);
  if (!w) { if (a.i !== b.i) w = a.i > b.i ? a : b; else if (a.err !== b.err) w = a.err < b.err ? a : b; } // al acabar el tiempo: más aciertos, luego menos errores
  if (!w) { for (const p of g.p) p.s.emit('end', { draw: true, reason, elo: (await me(p.uid)).elo, delta: 0, rival: other(g, p).user.username, score: [p.i, other(g, p).i], ...chars(g, p) }); return; }
  const l = other(g, w), uw = await me(w.uid), ul = await me(l.uid), [ew, el] = newRatings(uw.elo, ul.elo);
  await q('UPDATE users SET elo=$1,wins=wins+1 WHERE id=$2', [ew, w.uid]);
  await q('UPDATE users SET elo=$1,losses=losses+1 WHERE id=$2', [el, l.uid]);
  await q('INSERT INTO matches(winner_id,loser_id,winner_elo_delta,score_w,score_l) VALUES($1,$2,$3,$4,$5)', [w.uid, l.uid, ew - uw.elo, w.i, l.i]);
  const [x, y] = [w.uid, l.uid].sort((m, n) => m - n);
  await q('INSERT INTO h2h(user_a,user_b) VALUES($1,$2) ON CONFLICT DO NOTHING', [x, y]);
  const r = await one('SELECT * FROM h2h WHERE user_a=$1 AND user_b=$2', [x, y]);
  await q('UPDATE h2h SET wins_a=wins_a+$1,wins_b=wins_b+$2,streak_owner=$3,streak_len=$4 WHERE user_a=$5 AND user_b=$6',
    [w.uid === x ? 1 : 0, w.uid === y ? 1 : 0, w.uid, r.streak_owner === w.uid ? r.streak_len + 1 : 1, x, y]);
  for (const p of g.p) { const won = p === w;
    p.s.emit('end', { won, reason, delta: won ? ew - uw.elo : el - ul.elo, elo: won ? ew : el, rival: other(g, p).user.username, score: [p.i, other(g, p).i], ...chars(g, p) }); }
}

io.on('connection', async s => {
  const uid = s.request.session.uid; if (!uid) return s.disconnect();
  const user = await me(uid), old = online.get(uid); online.set(uid, s);
  const g0 = active.get(uid);
  if (g0 && !g0.over) { // volvió a entrar a mitad de partida
    const p = g0.p.find(x => x.uid === uid); clearTimeout(p.timer); p.gone = null; p.s = s;
    s.emit('match', { ...view(g0, p), resume: true }); other(g0, p).s.emit('rival_back');
  }
  if (old && old !== s) { old.emit('replaced'); old.disconnect(true); }

  s.on('queue', () => {
    if (active.has(uid)) return;
    if (waiting && waiting.uid !== uid && waiting.s.connected) { const w = waiting; waiting = null; startGame(w, { s, uid }); } else waiting = { s, uid };
  });
  s.on('unqueue', () => { if (waiting && waiting.uid === uid) waiting = null; });
  s.on('answer', v => {
    const g = active.get(uid); if (!g || g.over) return;
    const p = g.p.find(x => x.uid === uid); if (p.s !== s || Date.now() < p.lock) return;
    if (MathGen.check(g.qs[p.i], String(v).slice(0, 20))) {
      p.i++; g.p.forEach(x => x.s.emit('progress', { you: x.i, rival: other(g, x).i }));
      if (p.i >= GOAL) return finish(g, p, 'meta');
      s.emit('q', MathGen.pub(g.qs[p.i]));
    } else { p.err++; p.lock = Date.now() + LOCK_MS; s.emit('locked', LOCK_MS); }
  });
  s.on('leave', () => { const g = active.get(uid); if (g && !g.over) finish(g, other(g, g.p.find(x => x.uid === uid)), 'abandono'); });

  s.on('chat', t => { // chat de la partida: máx. 200 caracteres y 1 mensaje cada 0.7 s
    const g = active.get(uid); if (!g || g.over) return;
    const p = g.p.find(x => x.uid === uid); if (p.s !== s || Date.now() < (p.chatAt || 0)) return;
    t = String(t || '').trim().slice(0, 200); if (!t) return; p.chatAt = Date.now() + 700;
    const m = { from: user.username, text: t }; g.chat.push(m); g.p.forEach(x => x.s.emit('chat', m));
  });

  s.on('challenge', async name => {
    if (active.has(uid)) return;
    const t = await one('SELECT id,username FROM users WHERE lower(username)=lower($1)', [String(name || '')]), ts = t && online.get(t.id);
    if (!t || t.id === uid) return s.emit('toast', 'Jugador no encontrado.');
    if (!ts || active.has(t.id)) return s.emit('toast', `${t.username} no está disponible ahora.`);
    const prev = challenges.get(t.id); if (prev) clearTimeout(prev.timer);
    challenges.set(t.id, { from: uid, timer: setTimeout(() => { challenges.delete(t.id); s.emit('toast', 'El reto expiró.'); }, CHALLENGE_MS) });
    ts.emit('challenged', { from: user.username, ms: CHALLENGE_MS }); s.emit('toast', `Reto enviado a ${t.username}. Esperando respuesta…`);
  });
  s.on('reply', ok => {
    const c = challenges.get(uid); if (!c) return; clearTimeout(c.timer); challenges.delete(uid);
    const fs_ = online.get(c.from);
    if (!fs_ || active.has(c.from) || active.has(uid)) return s.emit('toast', 'El reto ya no está disponible.');
    if (ok) startGame({ s: fs_, uid: c.from }, { s, uid }); else fs_.emit('toast', `${user.username} rechazó el reto.`);
  });
  s.on('rematch', () => {
    const o = lastOpp.get(uid), os = o && online.get(o);
    if (!os || active.has(uid) || active.has(o)) return s.emit('toast', 'Tu rival no está disponible.');
    if (rematch.get(o) === uid) startGame({ s: os, uid: o }, { s, uid });
    else { rematch.set(uid, o); os.emit('rematch_offer', { from: user.username }); s.emit('toast', 'Revancha enviada.'); }
  });

  s.on('disconnect', () => {
    if (online.get(uid) === s) online.delete(uid);
    if (waiting && waiting.s === s) waiting = null;
    const g = active.get(uid); if (!g || g.over) return;
    const p = g.p.find(x => x.uid === uid); if (p.s !== s) return;
    p.gone = Date.now(); const o = other(g, p); o.s.emit('rival_away', { ms: GRACE_MS });
    p.timer = setTimeout(() => finish(g, o, 'abandono'), GRACE_MS);  // 20 s para volver
  });
});

(async () => {
  await pool.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  srv.listen(process.env.PORT || 3000, () => console.log('MathDuel en http://localhost:3000'));
})();
