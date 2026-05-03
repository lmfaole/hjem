INSERT INTO abonnement (tjeneste, leverandor, type, kostnad, frekvens, verdi, status, neste_betaling, notat, sortering) VALUES
  ('Bruce Studios Black',     'Bruce Studios',           'Trening',          769, 'Månedlig', 5, 'Aktiv', '2026-05-19', 'Black-medlemskap, Oslo. 1 måneds oppsigelsestid. 12 besøk/mnd på 6 ulike studioer.',                                                  1),
  ('Ruter månedskort (Entur)','Entur (Ruter månedskort)','Internett & Mobil',805, 'Månedlig', 4, 'Aktiv', NULL,         'Trekkes ~22. hver måned. Sammenlign med enkeltbillett (35 kr) hvis bruken faller.',                                                  2),
  ('Revolut Ultra',           'Revolut',                 'Bank/Finans',      600, 'Månedlig', 4, 'Aktiv', '2026-05-15', 'Årspris fakturert månedlig. Inkluderer valutaveksling, sparekonto 4 % p.a., reiseforsikring, lounge-tilgang.',                       3),
  ('Sikkerhetsabonnement',    NULL,                      'Annet',            200, 'Månedlig', 4, 'Aktiv', '2026-06-01', 'Sikkerhetsabonnement knyttet til leiligheten. Bekreft eksakt beløp og leverandør.',                                                  4);

INSERT INTO eiendel (navn, type, kategori, selskap, verdi, rente, notat, oppdatert_dato, sortering) VALUES
  ('SpareBank 1 Østlandet — Brukskonto', 'Eiendel', 'Bank/Kontant', 'SpareBank 1 Østlandet', 10940.36, 0.005,  'Daglig bruk. ⚠️ 0,5 % rente — vurder å flytte til høyrentekonto.',          '2026-05-02', 1),
  ('SpareBank 1 Østlandet — Lønnskonto', 'Eiendel', 'Bank/Kontant', 'SpareBank 1 Østlandet',  9271.56, 0.005,  'Hovedkonto for lønn og faste utgifter.',                                    '2026-05-02', 2),
  ('Revolut — Personlig konto (NOK)',    'Eiendel', 'Bank/Kontant', 'Revolut',                  34.17, 0,      'Lommepenger-konto for daglig forbruk via kort.',                            '2026-05-02', 3),
  ('Refinansieringslån',                 'Gjeld',   'Forbrukslån',  'SpareBank 1 Østlandet', 45531,    0.106,  'Utbetalt 09.02.2026, opprinnelig 45 872 kr. Forfall 15. hver måned.',       '2026-05-02', 1),
  ('Studielån',                          'Gjeld',   'Studielån',    'Lånekassen',            706000,   0.04611,'Flytende rente, justeres annenhver måned. Vurder fastrente.',               '2026-05-02', 2);
