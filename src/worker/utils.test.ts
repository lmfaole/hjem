import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTotalFromLink } from './utils.ts';

test('henter antall fra "last"-relasjon', () => {
  const link = '<https://api.github.com?page=2>; rel="next", <https://api.github.com?page=42>; rel="last"';
  assert.equal(parseTotalFromLink(link), 42);
});

test('returnerer null når header er null', () => {
  assert.equal(parseTotalFromLink(null), null);
});

test('returnerer null når "last"-relasjon mangler', () => {
  const link = '<https://api.github.com?page=2>; rel="next"';
  assert.equal(parseTotalFromLink(link), null);
});

test('returnerer null for tom streng', () => {
  assert.equal(parseTotalFromLink(''), null);
});

test('håndterer enkeltside-repo (kun "last", ingen "next")', () => {
  const link = '<https://api.github.com?page=1>; rel="last"';
  assert.equal(parseTotalFromLink(link), 1);
});

test('håndterer page-parameter uansett posisjon i URL', () => {
  const link = '<https://api.github.com/commits?author=x&page=7>; rel="last"';
  assert.equal(parseTotalFromLink(link), 7);
});
