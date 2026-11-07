-- Future authenticated Cloudflare D1 schema; not wired into the static release.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pieces (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  purpose TEXT NOT NULL,
  weight_grams REAL NOT NULL CHECK (weight_grams > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  notes TEXT NOT NULL DEFAULT '',
  photo_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS piece_clays (
  piece_id TEXT NOT NULL REFERENCES pieces(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  clay_name TEXT NOT NULL,
  percentage REAL NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  PRIMARY KEY (piece_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_pieces_created_at ON pieces(created_at DESC);
