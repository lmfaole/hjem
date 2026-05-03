import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBudgetUpdate, isGyldigGruppe } from './budsjett.ts';

test('aksepterer gyldig inntekt-oppdatering', () => {
  const result = parseBudgetUpdate({ inntektNetto: 45000 });
  assert.deepEqual(result, { inntektNetto: 45000 });
});

test('aksepterer gyldig items-oppdatering', () => {
  const result = parseBudgetUpdate({ items: [{ id: 1, belop: 6000 }] });
  assert.deepEqual(result, { items: [{ id: 1, belop: 6000 }] });
});

test('aksepterer kombinert oppdatering', () => {
  const result = parseBudgetUpdate({ inntektNetto: 50000, items: [{ id: 2, belop: 100 }] });
  assert.deepEqual(result, { inntektNetto: 50000, items: [{ id: 2, belop: 100 }] });
});

test('avviser body som ikke er objekt', () => {
  assert.equal(typeof parseBudgetUpdate(null), 'string');
  assert.equal(typeof parseBudgetUpdate('hei'), 'string');
  assert.equal(typeof parseBudgetUpdate(42), 'string');
});

test('avviser tomt objekt', () => {
  assert.equal(typeof parseBudgetUpdate({}), 'string');
});

test('avviser negativ inntekt', () => {
  assert.equal(typeof parseBudgetUpdate({ inntektNetto: -1 }), 'string');
});

test('avviser desimal inntekt', () => {
  assert.equal(typeof parseBudgetUpdate({ inntektNetto: 100.5 }), 'string');
});

test('avviser items som ikke er liste', () => {
  assert.equal(typeof parseBudgetUpdate({ items: 'feil' }), 'string');
});

test('avviser item uten id', () => {
  assert.equal(typeof parseBudgetUpdate({ items: [{ belop: 100 }] }), 'string');
});

test('avviser item med negativt beløp', () => {
  assert.equal(typeof parseBudgetUpdate({ items: [{ id: 1, belop: -50 }] }), 'string');
});

test('avviser item med id som ikke er heltall', () => {
  assert.equal(typeof parseBudgetUpdate({ items: [{ id: 1.5, belop: 100 }] }), 'string');
});

test('isGyldigGruppe godtar alle tre kategorier', () => {
  assert.equal(isGyldigGruppe('faste'), true);
  assert.equal(isGyldigGruppe('variable'), true);
  assert.equal(isGyldigGruppe('sparing'), true);
});

test('isGyldigGruppe avviser ukjente gruppenavn', () => {
  assert.equal(isGyldigGruppe('annet'), false);
  assert.equal(isGyldigGruppe(''), false);
  assert.equal(isGyldigGruppe('FASTE'), false);
});
