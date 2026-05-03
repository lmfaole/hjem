import { computeBudgetSummary, type BudgetGruppe, type SummaryItem } from './summary.js';
import { manedligKostnad, arligKostnad, dagerTilDato } from './abonnement-utils.js';

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

interface Abonnement {
  id: number;
  tjeneste: string;
  leverandor: string | null;
  type: string;
  kostnad: number;
  frekvens: string;
  verdi: number;
  status: string;
  neste_betaling: string | null;
  notat: string | null;
}

interface Eiendel {
  id: number;
  navn: string;
  type: 'Eiendel' | 'Gjeld';
  kategori: string;
  selskap: string | null;
  verdi: number;
  rente: number | null;
  notat: string | null;
  oppdatert_dato: string | null;
}

const GRUPPE_TITTEL: Record<BudgetGruppe, string> = {
  faste: 'Faste utgifter',
  variable: 'Variable utgifter',
  sparing: 'Sparing & investering',
};

const KRONE_FORMAT = new Intl.NumberFormat('no-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 });
const KRONE_PRESIS_FORMAT = new Intl.NumberFormat('no-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 2 });
const PROSENT_FORMAT = new Intl.NumberFormat('no-NO', { style: 'percent', maximumFractionDigits: 0 });
const PROSENT_PRESIS_FORMAT = new Intl.NumberFormat('no-NO', { style: 'percent', maximumFractionDigits: 2 });
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
      const [budgetRespons, abonnementRespons, eiendelRespons] = await Promise.all([
        fetch('/api/budget'),
        fetch('/api/abonnementer'),
        fetch('/api/eiendeler'),
      ]);

      if (!budgetRespons.ok) throw new Error(`Budsjett: HTTP ${budgetRespons.status}`);
      if (!abonnementRespons.ok) throw new Error(`Abonnementer: HTTP ${abonnementRespons.status}`);
      if (!eiendelRespons.ok) throw new Error(`Eiendeler: HTTP ${eiendelRespons.status}`);

      this.budget = await budgetRespons.json() as Budget;
      const abonnementData = await abonnementRespons.json() as { abonnementer: Abonnement[] };
      const eiendelData = await eiendelRespons.json() as { eiendeler: Eiendel[] };

      this.render();
      this.renderAbonnementer(abonnementData.abonnementer);
      this.renderEiendeler(eiendelData.eiendeler);
    } catch (feil) {
      this.rotElement.innerHTML = `<p>Klarte ikke å hente data: ${(feil as Error).message}</p>`;
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

      <section aria-labelledby="abonnementer-overskrift" id="abonnementer-seksjon">
        <h2 id="abonnementer-overskrift">Abonnementer</h2>
        <p>laster …</p>
      </section>

      <section aria-labelledby="eiendeler-overskrift" id="eiendeler-seksjon">
        <h2 id="eiendeler-overskrift">Eiendeler & gjeld</h2>
        <p>laster …</p>
      </section>
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

  private renderAbonnementer(abonnementer: Abonnement[]): void {
    const seksjon = this.rotElement.querySelector<HTMLElement>('#abonnementer-seksjon');
    if (!seksjon) return;

    const aktive = abonnementer.filter(abonnement => abonnement.status === 'Aktiv');
    const inaktive = abonnementer.filter(abonnement => abonnement.status !== 'Aktiv');
    const sumManedlig = aktive.reduce((sum, abonnement) => sum + manedligKostnad(abonnement.kostnad, abonnement.frekvens), 0);
    const sumArlig    = aktive.reduce((sum, abonnement) => sum + arligKostnad(abonnement.kostnad, abonnement.frekvens), 0);

    const radHtml = (abonnement: Abonnement): string => {
      const dager = dagerTilDato(abonnement.neste_betaling);
      const dagerCelle = dager === null ? '—' : dager < 0 ? `${dager} dager siden` : `om ${dager} dager`;
      const stjerner = '⭐'.repeat(abonnement.verdi);
      const kandidatFlagg = abonnement.verdi <= 2 && abonnement.status === 'Aktiv' ? ' <small>kandidat for oppsigelse</small>' : '';
      return `
        <tr>
          <th scope="row">
            ${escapeHtml(abonnement.tjeneste)}
            ${abonnement.leverandor ? `<small>${escapeHtml(abonnement.leverandor)}</small>` : ''}
            ${abonnement.notat ? `<small>${escapeHtml(abonnement.notat)}</small>` : ''}
          </th>
          <td>${escapeHtml(abonnement.type)}</td>
          <td>${KRONE_FORMAT.format(manedligKostnad(abonnement.kostnad, abonnement.frekvens))}/mnd</td>
          <td>${KRONE_FORMAT.format(arligKostnad(abonnement.kostnad, abonnement.frekvens))}/år</td>
          <td>${escapeHtml(stjerner)}${kandidatFlagg}</td>
          <td>${dagerCelle}</td>
        </tr>
      `;
    };

    const tabellHtml = (radene: Abonnement[]): string => {
      if (radene.length === 0) return '';
      return `
        <table>
          <thead>
            <tr>
              <th scope="col">Tjeneste</th>
              <th scope="col">Type</th>
              <th scope="col">Månedlig</th>
              <th scope="col">Årlig</th>
              <th scope="col">Verdi</th>
              <th scope="col">Neste</th>
            </tr>
          </thead>
          <tbody>${radene.map(radHtml).join('')}</tbody>
        </table>
      `;
    };

    seksjon.innerHTML = `
      <h2 id="abonnementer-overskrift">Abonnementer</h2>
      <p>Aktive abonnementer koster <strong>${KRONE_FORMAT.format(sumManedlig)}/mnd</strong> (${KRONE_FORMAT.format(sumArlig)}/år).</p>
      ${tabellHtml(aktive)}
      ${inaktive.length > 0 ? `<details><summary>Inaktive (${inaktive.length})</summary>${tabellHtml(inaktive)}</details>` : ''}
    `;
  }

  private renderEiendeler(eiendeler: Eiendel[]): void {
    const seksjon = this.rotElement.querySelector<HTMLElement>('#eiendeler-seksjon');
    if (!seksjon) return;

    const sumEiendeler = eiendeler.filter(rad => rad.type === 'Eiendel').reduce((sum, rad) => sum + rad.verdi, 0);
    const sumGjeld    = eiendeler.filter(rad => rad.type === 'Gjeld').reduce((sum, rad) => sum + rad.verdi, 0);
    const nettoFormue = sumEiendeler - sumGjeld;

    const radHtml = (rad: Eiendel): string => {
      const fortegn = rad.type === 'Gjeld' ? '−' : '';
      return `
        <tr>
          <th scope="row">
            ${escapeHtml(rad.navn)}
            ${rad.selskap ? `<small>${escapeHtml(rad.selskap)}</small>` : ''}
            ${rad.notat ? `<small>${escapeHtml(rad.notat)}</small>` : ''}
          </th>
          <td>${escapeHtml(rad.kategori)}</td>
          <td>${rad.rente !== null && rad.rente > 0 ? PROSENT_PRESIS_FORMAT.format(rad.rente) : '—'}</td>
          <td>${fortegn}${KRONE_PRESIS_FORMAT.format(rad.verdi)}</td>
        </tr>
      `;
    };

    const eiendelRader = eiendeler.filter(rad => rad.type === 'Eiendel');
    const gjeldRader = eiendeler.filter(rad => rad.type === 'Gjeld');

    const tabell = (overskrift: string, radene: Eiendel[], totalLabel: string, total: number, totalFortegn: string): string => {
      if (radene.length === 0) return '';
      return `
        <h3>${escapeHtml(overskrift)}</h3>
        <table>
          <thead>
            <tr>
              <th scope="col">Navn</th>
              <th scope="col">Kategori</th>
              <th scope="col">Rente</th>
              <th scope="col">Verdi</th>
            </tr>
          </thead>
          <tbody>${radene.map(radHtml).join('')}</tbody>
          <tfoot>
            <tr>
              <th scope="row" colspan="3">${escapeHtml(totalLabel)}</th>
              <td>${totalFortegn}${KRONE_PRESIS_FORMAT.format(total)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    };

    seksjon.innerHTML = `
      <h2 id="eiendeler-overskrift">Eiendeler & gjeld</h2>
      <p>
        Netto formue:
        <strong>${nettoFormue < 0 ? '−' : ''}${KRONE_PRESIS_FORMAT.format(Math.abs(nettoFormue))}</strong>
        (eiendeler ${KRONE_PRESIS_FORMAT.format(sumEiendeler)} − gjeld ${KRONE_PRESIS_FORMAT.format(sumGjeld)})
      </p>
      ${tabell('Eiendeler', eiendelRader, 'Sum eiendeler', sumEiendeler, '')}
      ${tabell('Gjeld', gjeldRader, 'Sum gjeld', sumGjeld, '−')}
    `;
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
