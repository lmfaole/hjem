CREATE TABLE budget_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  inntekt_netto INTEGER NOT NULL,
  oppdatert_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE budget_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gruppe TEXT NOT NULL CHECK (gruppe IN ('faste', 'variable', 'sparing')),
  kategori TEXT NOT NULL,
  belop INTEGER NOT NULL,
  notat TEXT,
  sortering INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_budget_item_gruppe ON budget_item(gruppe, sortering);
