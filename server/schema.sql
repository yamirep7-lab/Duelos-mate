CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  elo INT NOT NULL DEFAULT 1000,
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  best_survival INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_name ON users (lower(username));
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  winner_id INT NOT NULL REFERENCES users(id),
  loser_id INT NOT NULL REFERENCES users(id),
  winner_elo_delta INT NOT NULL,
  score_w INT NOT NULL,
  score_l INT NOT NULL,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS h2h (
  user_a INT NOT NULL REFERENCES users(id),
  user_b INT NOT NULL REFERENCES users(id),
  wins_a INT NOT NULL DEFAULT 0,
  wins_b INT NOT NULL DEFAULT 0,
  streak_owner INT,
  streak_len INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_a, user_b),
  CHECK (user_a < user_b)
);
