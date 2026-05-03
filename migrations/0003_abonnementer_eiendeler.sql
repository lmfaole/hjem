CREATE TABLE abonnement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tjeneste TEXT NOT NULL,
  leverandor TEXT,
  type TEXT NOT NULL,
  kostnad INTEGER NOT NULL,
  frekvens TEXT NOT NULL CHECK (frekvens IN ('Månedlig', 'Kvartalsvis', 'Halvårlig', 'Årlig', 'Engang')),
  verdi INTEGER NOT NULL CHECK (verdi BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'Aktiv' CHECK (status IN ('Aktiv', 'Prøveperiode', 'Pauset', 'Avsluttet')),
  neste_betaling TEXT,
  notat TEXT,
  sortering INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_abonnement_status ON abonnement(status, sortering);

CREATE TABLE eiendel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  navn TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Eiendel', 'Gjeld')),
  kategori TEXT NOT NULL,
  selskap TEXT,
  verdi REAL NOT NULL,
  rente REAL,
  notat TEXT,
  oppdatert_dato TEXT,
  sortering INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_eiendel_type ON eiendel(type, kategori, sortering);
