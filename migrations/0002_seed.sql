INSERT INTO budget_meta (id, inntekt_netto) VALUES (1, 43237);

INSERT INTO budget_item (gruppe, kategori, belop, notat, sortering) VALUES
  ('faste', 'Husleie & sikkerhet', 18955, 'Heimstaden 18 755 + sikkerhet 200', 1),
  ('faste', 'Lån & gjeld',          5649, 'Studielån 4 500 + refinansiering 1 149', 2),
  ('faste', 'Abonnementer',         2174, 'Bruce 769 + Revolut Ultra 600 + Ruter 805', 3),
  ('faste', 'Strøm',                 160, 'Separat fra husleie',                       4),
  ('faste', 'Forsikring',             33, 'Ulykkesforsikring II',                      5),

  ('variable', 'Mat (dagligvarer)',     5800, 'Kiwi/Rema/Meny',           1),
  ('variable', 'Restaurant & take-away',2000, 'Inkl. café og Wolt',       2),
  ('variable', 'Ferie',                 1000, '12k/år for kortere turer', 3),
  ('variable', 'Personlig pleie',        500, 'Frisør, hudpleie',         4),
  ('variable', 'Klær & sko',             500, '6k/år',                    5),
  ('variable', 'Underholdning & fritid', 500, 'Konserter, bøker, hobby',  6),
  ('variable', 'Helse',                  200, 'Tannlege/lege',            7),
  ('variable', 'Transport',              200, 'Taxi/bysykkel',            8),
  ('variable', 'Gaver',                  200, 'Bursdager, julegaver',     9),

  ('sparing', 'Aksjer & fond',  4600, 'Revolut Robo + krypto round-up', 1),
  ('sparing', 'Buffer / nødfond', 700, 'Bygges opp gradvis',             2);
