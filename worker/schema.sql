CREATE TABLE IF NOT EXISTS games (
  date          TEXT PRIMARY KEY,
  words         TEXT NOT NULL,
  original_data TEXT,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- original_data holds the NYT feed response verbatim, including the per-card
-- `position` and the puzzle's editor/id/print_date, none of which survive the
-- transform into `words`. Added after the initial Firestore migration; existing
-- databases were upgraded with:
--   ALTER TABLE games ADD COLUMN original_data TEXT;
