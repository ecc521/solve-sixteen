CREATE TABLE IF NOT EXISTS games (
  date       TEXT PRIMARY KEY,
  words      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
