import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeBudgetSummary } from './summary.ts';

const eksempelItems = [
  { gruppe: 'faste',    belop: 18955 } as const,
  { gruppe: 'faste',    belop: 5649  } as const,
  { gruppe: 'variable', belop: 5800  } as const,
  { gruppe: 'variable', belop: 2000  } as const,
  { gruppe: 'sparing',  belop: 4600  } as const,
  { gruppe: 'sparing',  belop: 700   } as const,
];

test('summerer per gruppe og totalt', () => {
  const summary = computeBudgetSummary(eksempelItems, 43237);
  assert.equal(summary.sumFaste,    24604);
  assert.equal(summary.sumVariable,  7800);
  assert.equal(summary.sumSparing,   5300);
  assert.equal(summary.sumTotal,    37704);
  assert.equal(summary.rest,         5533);
});

test('regner ut andel som desimal av inntekt', () => {
  const summary = computeBudgetSummary([{ gruppe: 'faste', belop: 25000 }], 50000);
  assert.equal(summary.andelFaste, 0.5);
  assert.equal(summary.andelVariable, 0);
  assert.equal(summary.andelSparing, 0);
});

test('andelene summerer til 1 (faste + variable + sparing + rest)', () => {
  const summary = computeBudgetSummary(eksempelItems, 43237);
  const sumAndeler = summary.andelFaste + summary.andelVariable + summary.andelSparing + summary.andelRest;
  assert.ok(Math.abs(sumAndeler - 1) < 1e-9, `forventet ~1, fikk ${sumAndeler}`);
});

test('håndterer inntekt på null uten å dele på null', () => {
  const summary = computeBudgetSummary([{ gruppe: 'faste', belop: 100 }], 0);
  assert.equal(Number.isFinite(summary.andelFaste), true);
});

test('returnerer nuller når items er tom liste', () => {
  const summary = computeBudgetSummary([], 50000);
  assert.equal(summary.sumTotal, 0);
  assert.equal(summary.rest, 50000);
});

test('rest blir negativt når utgifter overstiger inntekt', () => {
  const summary = computeBudgetSummary([{ gruppe: 'faste', belop: 60000 }], 50000);
  assert.equal(summary.rest, -10000);
});
