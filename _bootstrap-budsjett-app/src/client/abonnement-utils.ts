export type Frekvens = 'Månedlig' | 'Kvartalsvis' | 'Halvårlig' | 'Årlig' | 'Engang';

const MANEDER_PER_FREKVENS: Record<Frekvens, number> = {
  Månedlig: 1,
  Kvartalsvis: 3,
  Halvårlig: 6,
  Årlig: 12,
  Engang: 0,
};

export function manedligKostnad(kostnad: number, frekvens: string): number {
  const maneder = MANEDER_PER_FREKVENS[frekvens as Frekvens];
  if (maneder === undefined || maneder === 0) return 0;
  return kostnad / maneder;
}

export function arligKostnad(kostnad: number, frekvens: string): number {
  return manedligKostnad(kostnad, frekvens) * 12;
}

export function dagerTilDato(isoDato: string | null, idag: Date = new Date()): number | null {
  if (!isoDato) return null;
  const dato = new Date(isoDato + 'T00:00:00Z');
  if (Number.isNaN(dato.getTime())) return null;
  const millisekunderPerDag = 24 * 60 * 60 * 1000;
  const diff = dato.getTime() - Date.UTC(idag.getUTCFullYear(), idag.getUTCMonth(), idag.getUTCDate());
  return Math.round(diff / millisekunderPerDag);
}
