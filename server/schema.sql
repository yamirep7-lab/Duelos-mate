CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,                 -- bcrypt, coste 12
  elo           INTEGER NOT NULL DEFAULT 1000,
  wins          INTEGER NOT NULL DEFAULT 0,
  losses        INTEGER NOT NULL DEFAULT 0,
  best_survival INTEGER NOT NULL DEFAULT 0,    -- récord Modo Infinito
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Historial de cada partida PvP
CREATE TABLE IF NOT EXISTS matches (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  winner_id  INTEGER NOT NULL REFERENCES users(id),
  loser_id   INTEGER NOT NULL REFERENCES users(id),
  winner_elo_delta INTEGER NOT NULL,
  score_w    INTEGER NOT NULL,
  score_l    INTEGER NOT NULL,
  played_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_matches_w ON matches(winner_id);
CREATE INDEX IF NOT EXISTS idx_matches_l ON matches(loser_id);

-- H2H: una fila por pareja, siempre con user_a < user_b para evitar duplicados
CREATE TABLE IF NOT EXISTS h2h (
  user_a       INTEGER NOT NULL REFERENCES users(id),
  user_b       INTEGER NOT NULL REFERENCES users(id),
  wins_a       INTEGER NOT NULL DEFAULT 0,
  wins_b       INTEGER NOT NULL DEFAULT 0,
  streak_owner INTEGER,                        -- quién lleva la racha actual
  streak_len   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_a, user_b),
  CHECK (user_a < user_b)
);
