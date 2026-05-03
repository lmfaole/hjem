import type { Budget, BudgetGruppe, BudgetItem, BudgetUpdate } from '../shared/budget-types.js';

interface BudsjettEnv {
  ASSETS: Fetcher;
  BUDSJETT_DB: D1Database;
}

const TILLATTE_DELTE_PATHS = ['/styles/', '/favicon.svg', '/site-header.js'];
const GYLDIGE_GRUPPER: ReadonlySet<BudgetGruppe> = new Set(['faste', 'variable', 'sparing']);

export async function handleBudsjett(
  request: Request,
  url: URL,
  env: BudsjettEnv,
): Promise<Response> {
  if (url.pathname === '/api/budget') {
    if (request.method === 'GET') return getBudget(env);
    if (request.method === 'PUT') return putBudget(request, env);
    return new Response('Method Not Allowed', { status: 405, headers: { 'Allow': 'GET, PUT' } });
  }

  if (url.pathname === '/api/abonnementer') {
    if (request.method === 'GET') return getAbonnementer(env);
    return new Response('Method Not Allowed', { status: 405, headers: { 'Allow': 'GET' } });
  }

  if (url.pathname === '/api/eiendeler') {
    if (request.method === 'GET') return getEiendeler(env);
    return new Response('Method Not Allowed', { status: 405, headers: { 'Allow': 'GET' } });
  }

  return serverStatiskAsset(request, url, env);
}

interface AbonnementRad {
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
  sortering: number;
}

interface EiendelRad {
  id: number;
  navn: string;
  type: 'Eiendel' | 'Gjeld';
  kategori: string;
  selskap: string | null;
  verdi: number;
  rente: number | null;
  notat: string | null;
  oppdatert_dato: string | null;
  sortering: number;
}

async function getAbonnementer(env: BudsjettEnv): Promise<Response> {
  const result = await env.BUDSJETT_DB
    .prepare(
      `SELECT id, tjeneste, leverandor, type, kostnad, frekvens, verdi, status, neste_betaling, notat, sortering
       FROM abonnement
       ORDER BY status = 'Aktiv' DESC, sortering ASC`,
    )
    .all<AbonnementRad>();

  return jsonResponse({ abonnementer: result.results });
}

async function getEiendeler(env: BudsjettEnv): Promise<Response> {
  const result = await env.BUDSJETT_DB
    .prepare(
      `SELECT id, navn, type, kategori, selskap, verdi, rente, notat, oppdatert_dato, sortering
       FROM eiendel
       ORDER BY type DESC, sortering ASC`,
    )
    .all<EiendelRad>();

  return jsonResponse({ eiendeler: result.results });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function getBudget(env: BudsjettEnv): Promise<Response> {
  const meta = await env.BUDSJETT_DB
    .prepare('SELECT inntekt_netto, oppdatert_at FROM budget_meta WHERE id = 1')
    .first<{ inntekt_netto: number; oppdatert_at: string }>();

  if (!meta) {
    return jsonResponse({ error: 'Budsjettet er ikke seedet' }, 500);
  }

  const itemsResult = await env.BUDSJETT_DB
    .prepare('SELECT id, gruppe, kategori, belop, notat, sortering FROM budget_item ORDER BY gruppe, sortering')
    .all<BudgetItem>();

  const budget: Budget = {
    inntektNetto: meta.inntekt_netto,
    oppdatertAt: meta.oppdatert_at,
    items: itemsResult.results,
  };

  return jsonResponse(budget);
}

async function putBudget(request: Request, env: BudsjettEnv): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Ugyldig JSON' }, 400);
  }

  const update = parseBudgetUpdate(body);
  if (typeof update === 'string') {
    return jsonResponse({ error: update }, 400);
  }

  const statements: D1PreparedStatement[] = [];

  if (update.inntektNetto !== undefined) {
    statements.push(
      env.BUDSJETT_DB
        .prepare('UPDATE budget_meta SET inntekt_netto = ?, oppdatert_at = datetime(\'now\') WHERE id = 1')
        .bind(update.inntektNetto),
    );
  }

  for (const itemUpdate of update.items ?? []) {
    statements.push(
      env.BUDSJETT_DB
        .prepare('UPDATE budget_item SET belop = ? WHERE id = ?')
        .bind(itemUpdate.belop, itemUpdate.id),
    );
  }

  if (statements.length === 0) {
    return jsonResponse({ error: 'Ingen endringer i forespørselen' }, 400);
  }

  await env.BUDSJETT_DB.batch(statements);
  return jsonResponse({ ok: true });
}

export function parseBudgetUpdate(body: unknown): BudgetUpdate | string {
  if (!body || typeof body !== 'object') return 'Body må være et objekt';

  const candidate = body as Record<string, unknown>;
  const update: BudgetUpdate = {};

  if ('inntektNetto' in candidate) {
    const value = candidate.inntektNetto;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
      return 'inntektNetto må være et ikke-negativt heltall';
    }
    update.inntektNetto = value;
  }

  if ('items' in candidate) {
    const items = candidate.items;
    if (!Array.isArray(items)) return 'items må være en liste';
    const parsed: Array<{ id: number; belop: number }> = [];
    for (const itemCandidate of items) {
      if (!itemCandidate || typeof itemCandidate !== 'object') return 'hver item må være et objekt';
      const itemRecord = itemCandidate as Record<string, unknown>;
      const id = itemRecord.id;
      const belop = itemRecord.belop;
      if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
        return 'item.id må være et positivt heltall';
      }
      if (typeof belop !== 'number' || !Number.isFinite(belop) || belop < 0 || !Number.isInteger(belop)) {
        return 'item.belop må være et ikke-negativt heltall';
      }
      parsed.push({ id, belop });
    }
    update.items = parsed;
  }

  if (update.inntektNetto === undefined && update.items === undefined) {
    return 'inntektNetto eller items må være satt';
  }

  return update;
}

export function isGyldigGruppe(value: string): value is BudgetGruppe {
  return GYLDIGE_GRUPPER.has(value as BudgetGruppe);
}

async function serverStatiskAsset(
  request: Request,
  url: URL,
  env: BudsjettEnv,
): Promise<Response> {
  let assetPath: string | null = null;

  if (url.pathname === '/' || url.pathname === '/index.html') {
    assetPath = '/budsjett/index.html';
  } else if (url.pathname.startsWith('/budsjett/')) {
    assetPath = url.pathname;
  } else if (TILLATTE_DELTE_PATHS.some(prefix => url.pathname.startsWith(prefix) || url.pathname === prefix)) {
    assetPath = url.pathname;
  }

  if (!assetPath) {
    return new Response('Not Found', { status: 404 });
  }

  const assetUrl = new URL(assetPath, url);
  return env.ASSETS.fetch(new Request(assetUrl, request));
}
