export type BudgetGruppe = 'faste' | 'variable' | 'sparing';

export interface SummaryItem {
  belop: number;
  gruppe: BudgetGruppe;
}

export interface BudgetSummary {
  sumFaste: number;
  sumVariable: number;
  sumSparing: number;
  sumTotal: number;
  rest: number;
  andelFaste: number;
  andelVariable: number;
  andelSparing: number;
  andelRest: number;
}

export function computeBudgetSummary(items: ReadonlyArray<SummaryItem>, inntektNetto: number): BudgetSummary {
  const sumFaste = sumGruppe(items, 'faste');
  const sumVariable = sumGruppe(items, 'variable');
  const sumSparing = sumGruppe(items, 'sparing');
  const sumTotal = sumFaste + sumVariable + sumSparing;
  const rest = inntektNetto - sumTotal;
  const trygtNevner = inntektNetto > 0 ? inntektNetto : 1;

  return {
    sumFaste,
    sumVariable,
    sumSparing,
    sumTotal,
    rest,
    andelFaste: sumFaste / trygtNevner,
    andelVariable: sumVariable / trygtNevner,
    andelSparing: sumSparing / trygtNevner,
    andelRest: rest / trygtNevner,
  };
}

function sumGruppe(items: ReadonlyArray<SummaryItem>, gruppe: BudgetGruppe): number {
  let sum = 0;
  for (const item of items) {
    if (item.gruppe === gruppe) sum += item.belop;
  }
  return sum;
}
