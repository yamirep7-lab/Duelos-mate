const express = require('express'), http = require('http'), session = require('express-session'), bcrypt = require('bcrypt');
const { Server } = require('socket.io'), Database = require('better-sqlite3'), fs = require('fs'), path = require('path');
const MathGen = require('../shared/mathGenerator'), { newRatings } = require('./elo');

const db = new Database('mathduel.db'); db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
const app = express(), srv = http.createServer(app), io = new Server(srv);
const sess = session({ secret: process.env.SESSION_SECRET || 'cambia-esto', resave: false, saveUninitialized: false,
  cookie: { maxAge: 30 * 864e5, httpOnly: true, sameSite: 'lax' } }); // sesión persistente 30 días
app.use(express.json(), sess, express.static(path.join(__dirname, '../public')));
app.use('/shared', express.static(path.join(__dirname, '../shared')));
io.engine.use(sess);

const GOAL = 10, LOCK_MS = 1000;
const me = id => db.prepare('SELECT id,username,elo,wins,losses,best_survival FROM users WHERE id=?').get(id);

app.post('/api/register', async (q, r) => {
  const { username, password } = q.body;
  if (!/^\w{3,20}$/.test(username || '') || (password || '').length < 8) return r.status(400).json({ error: 'Usuario de 3-20 caracteres y contraseña de mínimo 8.' });
  try { const i = db.prepare('INSERT INTO users(username,password_hash) VALUES(?,?)').run(username, await bcrypt.hash(password, 12));
    q.session.uid = Number(i.lastInsertRowid); r.json(me(q.session.uid)); }
  catch { r.status(409).json({ error: 'Ese usuario ya existe.' }); }
});
app.post('/api/login', async (q, r) => {
  const u = db.prepare('SELECT * FROM users WHERE username=?').get(q.body.username || '');
  if (!u || !(await bcrypt.compare(q.body.password || '', u.password_hash))) return r.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  q.session.uid = u.id; r.json(me(u.id));
});
app.get('/api/me', (q, r) => q.session.uid ? r.json(me(q.session.uid)) : r.status(401).end());
app.get('/api/h2h', (q, r) => { // historial contra cada rival
  const id = q.session.uid; if (!id) return r.status(401).end();
  r.json(db.prepare(`SELECT u.username rival, CASE WHEN user_a=@id THEN wins_a ELSE wins_b END wins,
    CASE WHEN user_a=@id THEN wins_b ELSE wins_a END losses, CASE WHEN streak_owner=@id THEN streak_len ELSE -streak_len END streak
    FROM h2h JOIN users u ON u.id = CASE WHEN user_a=@id THEN user_b ELSE user_a END WHERE user_a=@id OR user_b=@id`).all({ id }));
});
app.post('/api/survival', (q, r) => { // NOTA: el cliente reporta su récord; para competir en serio, validar en servidor.
  if (!q.session.uid) return r.status(401).end();
  db.prepare('UPDATE users SET best_survival=MAX(best_survival,?) WHERE id=?').run(Math.floor(+q.body.streak) || 0, q.session.uid); r.json(me(q.session.uid));
});

let waiting = null;
function startGame(a, b) {
  const g = { qs: Array.from({ length: GOAL }, () => MathGen.generate()), over: false,
    p: [a, b].map(x => ({ s: x.s, uid: x.uid, i: 0, lock: 0 })) };
  g.p.forEach(p => { p.s.game = g; p.s.emit('match', { rival: me(g.p.find(x => x !== p).uid), goal: GOAL, q: MathGen.pub(g.qs[0]) }); });
}
function finish(g, w) {
  g.over = true; const l = g.p.find(x => x !== w), before = me(w.uid).elo, [ew, el] = newRatings(before, me(l.uid).elo);
  db.prepare('UPDATE users SET elo=?,wins=wins+1 WHERE id=?').run(ew, w.uid);
  db.prepare('UPDATE users SET elo=?,losses=losses+1 WHERE id=?').run(el, l.uid);
  db.prepare('INSERT INTO matches(winner_id,loser_id,winner_elo_delta,score_w,score_l) VALUES(?,?,?,?,?)').run(w.uid, l.uid, ew - before, w.i, l.i);
  const [a, b] = [w.uid, l.uid].sort((x, y) => x - y);
  db.prepare('INSERT OR IGNORE INTO h2h(user_a,user_b) VALUES(?,?)').run(a, b);
  const r = db.prepare('SELECT * FROM h2h WHERE user_a=? AND user_b=?').get(a, b);
  db.prepare('UPDATE h2h SET wins_a=wins_a+?,wins_b=wins_b+?,streak_owner=?,streak_len=? WHERE user_a=? AND user_b=?')
    .run(w.uid === a ? 1 : 0, w.uid === b ? 1 : 0, w.uid, r.streak_owner === w.uid ? r.streak_len + 1 : 1, a, b);
  g.p.forEach(p => p.s.emit('end', { won: p === w, me: me(p.uid) }));
}

io.on('connection', s => {
  const uid = s.request.session.uid; if (!uid) return s.disconnect();
  s.on('queue', () => {
    if (waiting && waiting.uid !== uid && waiting.s.connected) { startGame(waiting, { s, uid }); waiting = null; }
    else waiting = { s, uid };
  });
  s.on('answer', v => {
    const g = s.game; if (!g || g.over) return;
    const p = g.p.find(x => x.s === s);
    if (Date.now() < p.lock) return;                                  // micro-bloqueo aplicado en servidor
    if (MathGen.check(g.qs[p.i], v)) {
      p.i++; g.p.forEach(x => x.s.emit('progress', { you: x.i, rival: g.p.find(y => y !== x).i }));
      if (p.i >= GOAL) return finish(g, p);
      s.emit('q', MathGen.pub(g.qs[p.i]));
    } else { p.lock = Date.now() + LOCK_MS; s.emit('locked', LOCK_MS); }
  });
  s.on('disconnect', () => {
    if (waiting && waiting.s === s) waiting = null;
    const g = s.game; if (g && !g.over) finish(g, g.p.find(x => x.s !== s)); // abandono = derrota
  });
});
srv.listen(process.env.PORT || 3000, () => console.log('MathDuel en http://localhost:3000'));
