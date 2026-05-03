import { test } from 'node:test';
import assert from 'node:assert/strict';
import { manedligKostnad, arligKostnad, dagerTilDato } from './abonnement-utils.ts';

test('Månedlig frekvens returnerer kostnaden direkte', () => {
  assert.equal(manedligKostnad(769, 'Månedlig'), 769);
});

test('Kvartalsvis deler på 3', () => {
  assert.equal(manedligKostnad(900, 'Kvartalsvis'), 300);
});

test('Halvårlig deler på 6', () => {
  assert.equal(manedligKostnad(1200, 'Halvårlig'), 200);
});

test('Årlig deler på 12', () => {
  assert.equal(manedligKostnad(2400, 'Årlig'), 200);
});

test('Engang har ingen månedlig kostnad', () => {
  assert.equal(manedligKostnad(5000, 'Engang'), 0);
});

test('ukjent frekvens er 0 (defensiv default)', () => {
  assert.equal(manedligKostnad(1000, 'Tull'), 0);
});

test('arligKostnad multipliserer månedlig med 12', () => {
  assert.equal(arligKostnad(769, 'Månedlig'), 9228);
  assert.equal(arligKostnad(2400, 'Årlig'), 2400);
});

test('dagerTilDato returnerer positivt antall dager til fremtidig dato', () => {
  const idag = new Date('2026-05-03T12:00:00Z');
  assert.equal(dagerTilDato('2026-05-15', idag), 12);
});

test('dagerTilDato returnerer 0 når datoen er i dag', () => {
  const idag = new Date('2026-05-15T08:00:00Z');
  assert.equal(dagerTilDato('2026-05-15', idag), 0);
});

test('dagerTilDato returnerer negativt for fortid', () => {
  const idag = new Date('2026-05-15T12:00:00Z');
  assert.equal(dagerTilDato('2026-05-10', idag), -5);
});

test('dagerTilDato returnerer null når input er null', () => {
  assert.equal(dagerTilDato(null), null);
});

test('dagerTilDato returnerer null for ugyldig dato', () => {
  assert.equal(dagerTilDato('ikke-en-dato'), null);
});
