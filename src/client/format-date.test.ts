import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate } from './format-date.ts';

test('returnerer "nåtid" når dato mangler', () => {
  assert.equal(formatDate(undefined), 'nåtid');
});

test('returnerer bare årstall når måned mangler', () => {
  assert.equal(formatDate('2019'), '2019');
});

test('inkluderer årstall når måned er oppgitt', () => {
  assert.ok(formatDate('2023-01').includes('2023'));
});

test('returnerer ulik streng for ulike måneder', () => {
  assert.notEqual(formatDate('2023-01'), formatDate('2023-06'));
});

test('håndterer desember uten off-by-one', () => {
  // Måned 12 → desember, ikke januar neste år
  const result = formatDate('2023-12');
  assert.ok(result.includes('2023'));
  assert.ok(!result.includes('2024'));
});
