export type BudgetGruppe = 'faste' | 'variable' | 'sparing';

export interface BudgetItem {
  id: number;
  gruppe: BudgetGruppe;
  kategori: string;
  belop: number;
  notat: string | null;
  sortering: number;
}

export interface Budget {
  inntektNetto: number;
  oppdatertAt: string;
  items: BudgetItem[];
}

export interface BudgetUpdate {
  inntektNetto?: number;
  items?: Array<{ id: number; belop: number }>;
}
