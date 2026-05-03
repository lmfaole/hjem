import { computeBudgetSummary, type BudgetGruppe, type SummaryItem } from './summary.js';

interface BudgetItem extends SummaryItem {
  id: number;
  kategori: string;
  notat: string | null;
  sortering: number;
}

interface Budget {
  inntektNetto: number;
  oppdatertAt: string;
  items: BudgetItem[];
}

interface BudgetUpdate {
  inntektNetto?: number;
  items?: Array<{ id: number; belop: number }>;
}

const GRUPPE_TITTEL: Record<BudgetGruppe, string> = {
  faste: 'Faste utgifter',
  variable: 'Variable utgifter',
  sparing: 'Sparing & investering',
};

const KRONE_FORMAT = new Intl.NumberFormat('no-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 });
const PROSENT_FORMAT = new Intl.NumberFormat('no-NO', { style: 'percent', maximumFractionDigits: 0 });
const DATO_FORMAT = new Intl.DateTimeFormat('no-NO', { day: '2-digit', month: 'short', year: 'numeric' });

const DEBOUNCE_MS = 600;

class BudsjettApp {
  private budget: Budget | null = null;
  private endredeItems = new Map<number, number>();
  private endretInntekt: number | null = null;
  private debounceTimer: number | null = null;
  private readonly rotElement: HTMLElement;

  constructor(rotElement: HTMLElement) {
    this.rotElement = rotElement;
  }

  async last(): Promise<void> {
    try {
      const respons = await fetch('/api/budget');
      if (!respons.ok) throw new Error(`HTTP ${respons.status}`);
      this.budget = await respons.json() as Budget;
      this.render();
    } catch (feil) {
      this.rotElement.innerHTML = `<p>Klarte ikke å hente budsjett: ${(feil as Error).message}</p>`;
    }
  }

  private render(): void {
    if (!this.budget) return;

    const grupper: BudgetGruppe[] = ['faste', 'variable', 'sparing'];
    const tabeller = grupper.map(gruppe => this.renderGruppeTabell(gruppe)).join('');

    this.rotElement.innerHTML = `
      <hgroup>
        <h1>Budsjett</h1>
        <p>Sist oppdatert: ${formatOppdatertTid(this.budget.oppdatertAt)}</p>
      </hgroup>

      <section aria-labelledby="inntekt-overskrift">
        <h2 id="inntekt-overskrift">Inntekt</h2>
        <label>
          Netto utbetalt per måned
          <input type="number" inputmode="numeric" min="0" step="1" id="inntekt-input" value="${this.budget.inntektNetto}" />
        </label>
      </section>

      <section aria-labelledby="oversikt-overskrift" class="budsjett-summary">
        <h2 id="oversikt-overskrift">Oversikt</h2>
        <div id="summary-tabell" aria-live="polite"></div>
      </section>

      ${tabeller}
    `;

    this.rotElement.querySelector<HTMLInputElement>('#inntekt-input')!
      .addEventListener('input', event => this.haandterInntektEndring(event));

    this.rotElement.querySelectorAll<HTMLInputElement>('input[data-item-id]')
      .forEach(input => input.addEventListener('input', event => this.haandterItemEndring(event)));

    this.renderSummary();
  }

  private renderGruppeTabell(gruppe: BudgetGruppe): string {
    if (!this.budget) return '';
    const items = this.budget.items.filter(item => item.gruppe === gruppe);
    const rader = items.map(item => `
      <tr>
        <th scope="row">
          ${escapeHtml(item.kategori)}
          ${item.notat ? `<small>${escapeHtml(item.notat)}</small>` : ''}
        </th>
        <td>
          <input type="number" inputmode="numeric" min="0" step="1"
                 data-item-id="${item.id}" value="${item.belop}"
                 aria-label="Beløp for ${escapeHtml(item.kategori)}" />
        </td>
      </tr>
    `).join('');

    return `
      <section aria-labelledby="gruppe-${gruppe}-overskrift">
        <h2 id="gruppe-${gruppe}-overskrift">${GRUPPE_TITTEL[gruppe]}</h2>
        <table>
          <thead>
            <tr>
              <th scope="col">Kategori</th>
              <th scope="col">Beløp (kr/mnd)</th>
            </tr>
          </thead>
          <tbody>${rader}</tbody>
        </table>
      </section>
    `;
  }

  private renderSummary(): void {
    if (!this.budget) return;
    const summaryHolder = this.rotElement.querySelector<HTMLDivElement>('#summary-tabell');
    if (!summaryHolder) return;

    const inntekt = this.gjeldendeInntekt();
    const items = this.budget.items.map(item => ({
      gruppe: item.gruppe,
      belop: this.endredeItems.get(item.id) ?? item.belop,
    }));
    const summary = computeBudgetSummary(items, inntekt);

    summaryHolder.innerHTML = `
      <table>
        <tbody>
          <tr><th scope="row">Inntekt</th><td>${KRONE_FORMAT.format(inntekt)}</td><td>100 %</td></tr>
          <tr><th scope="row">Faste (behov)</th>     <td>−${KRONE_FORMAT.format(summary.sumFaste)}</td>    <td>${PROSENT_FORMAT.format(summary.andelFaste)}</td></tr>
          <tr><th scope="row">Variable (ønsker)</th> <td>−${KRONE_FORMAT.format(summary.sumVariable)}</td> <td>${PROSENT_FORMAT.format(summary.andelVariable)}</td></tr>
          <tr><th scope="row">Sparing</th>           <td>−${KRONE_FORMAT.format(summary.sumSparing)}</td>  <td>${PROSENT_FORMAT.format(summary.andelSparing)}</td></tr>
          <tr><th scope="row">Rest</th>              <td>${KRONE_FORMAT.format(summary.rest)}</td>          <td>${PROSENT_FORMAT.format(summary.andelRest)}</td></tr>
        </tbody>
      </table>

      <div class="budsjett-bar" role="img" aria-label="50/30/20-fordeling: behov ${PROSENT_FORMAT.format(summary.andelFaste)}, ønsker ${PROSENT_FORMAT.format(summary.andelVariable)}, sparing ${PROSENT_FORMAT.format(summary.andelSparing)}">
        <span class="budsjett-bar-faste"     style="flex-grow: ${Math.max(summary.sumFaste, 0)}"></span>
        <span class="budsjett-bar-variable"  style="flex-grow: ${Math.max(summary.sumVariable, 0)}"></span>
        <span class="budsjett-bar-sparing"   style="flex-grow: ${Math.max(summary.sumSparing, 0)}"></span>
        <span class="budsjett-bar-rest"      style="flex-grow: ${Math.max(summary.rest, 0)}"></span>
      </div>

      <p class="budsjett-mal">Mål 50/30/20: behov 50 % · ønsker 30 % · sparing 20 %.</p>
    `;
  }

  private haandterInntektEndring(event: Event): void {
    const input = event.target as HTMLInputElement;
    const verdi = input.valueAsNumber;
    if (!Number.isFinite(verdi) || verdi < 0) return;
    this.endretInntekt = Math.round(verdi);
    this.renderSummary();
    this.planlegglagring();
  }

  private haandterItemEndring(event: Event): void {
    const input = event.target as HTMLInputElement;
    const id = Number(input.dataset.itemId);
    const verdi = input.valueAsNumber;
    if (!Number.isFinite(verdi) || verdi < 0 || !Number.isInteger(id)) return;
    this.endredeItems.set(id, Math.round(verdi));
    this.renderSummary();
    this.planlegglagring();
  }

  private gjeldendeInntekt(): number {
    if (this.endretInntekt !== null) return this.endretInntekt;
    return this.budget?.inntektNetto ?? 0;
  }

  private planlegglagring(): void {
    if (this.debounceTimer !== null) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.lagre(), DEBOUNCE_MS) as unknown as number;
  }

  private async lagre(): Promise<void> {
    if (!this.budget) return;
    const oppdatering: BudgetUpdate = {};

    if (this.endretInntekt !== null) {
      oppdatering.inntektNetto = this.endretInntekt;
    }
    if (this.endredeItems.size > 0) {
      oppdatering.items = Array.from(this.endredeItems.entries()).map(([id, belop]) => ({ id, belop }));
    }

    if (Object.keys(oppdatering).length === 0) return;

    try {
      const respons = await fetch('/api/budget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oppdatering),
      });
      if (!respons.ok) throw new Error(`HTTP ${respons.status}`);

      if (oppdatering.inntektNetto !== undefined) {
        this.budget.inntektNetto = oppdatering.inntektNetto;
        this.endretInntekt = null;
      }
      for (const itemUpdate of oppdatering.items ?? []) {
        const item = this.budget.items.find(kandidat => kandidat.id === itemUpdate.id);
        if (item) item.belop = itemUpdate.belop;
        this.endredeItems.delete(itemUpdate.id);
      }
    } catch (feil) {
      console.warn('Kunne ikke lagre budsjett:', feil);
    }
  }
}

function formatOppdatertTid(isoString: string): string {
  const dato = new Date(isoString.includes('T') ? isoString : isoString.replace(' ', 'T') + 'Z');
  return DATO_FORMAT.format(dato);
}

function escapeHtml(tekst: string): string {
  return tekst
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const rotElement = document.getElementById('budsjett') as HTMLElement;
new BudsjettApp(rotElement).last();
