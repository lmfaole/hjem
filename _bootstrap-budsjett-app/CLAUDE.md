# budsjett-app

Personlig økonomi-dashboard, deployet til Cloudflare Workers på `budsjett.lmfaole.party`.

## Stack

- Cloudflare Worker (TypeScript) som server-side API mot D1
- Cloudflare D1 (SQLite) for persistent lagring
- Cloudflare Access (Zero Trust) for auth-gating på subdomenet
- Plain TypeScript på klienten — ingen frameworks, ingen runtime npm-deps
- CSS i lag (tokens → base → layout → interactive → forms → components → print)

```
src/
  worker/
    index.ts              ← Worker-entry, dispatch på /api/*
    budsjett.ts           ← API-handlers og input-validering
    budsjett.test.ts
  client/
    index.ts              ← Hovedscript, fetcher data og rendrer dashboardet
    summary.ts            ← Pure compute for 50/30/20-fordeling
    summary.test.ts
    abonnement-utils.ts   ← Frekvens-normalisering, dager-til-dato
    abonnement-utils.test.ts
    tsconfig.json         ← outDir: ../../public
  shared/
    budget-types.ts       ← Delte typer (worker + klient)
migrations/
  0001_init.sql           ← budget_meta + budget_item
  0002_seed.sql           ← Inntekt + budsjett-poster
  0003_abonnementer_eiendeler.sql
  0004_seed_abonnementer_eiendeler.sql
public/
  index.html              ← HTML-skall
  favicon.svg
  styles/                 ← CSS-lag
tsconfig.json             ← Worker-typer
wrangler.jsonc            ← Cloudflare-konfig (D1 + custom domain)
```

## Build og deploy

```
npm run build       # kompiler src/client → public/
npm run typecheck   # type-sjekk worker + klient
npm run test        # node:test over alle .test.ts-filer
npm run deploy      # build + wrangler deploy
```

## D1

Database-id (lokal verdi i wrangler.jsonc) hører til Cloudflare-kontoen som eier `budsjett.lmfaole.party`-domenet.

```
npm run db:create          # opprett ny D1 (kopier id inn i wrangler.jsonc)
npm run db:migrate         # appliser migrations mot remote D1
npm run db:migrate:local   # samme, men mot lokal SQLite-fil
npm run db:seed            # populer Fase 1 fra Notion-data
```

## Auth

`budsjett.lmfaole.party` er gated via Cloudflare Access (Zero Trust → Applications). Workeren trenger ingen egen auth-kode i v1; Access verifiserer ved kanten.

## Stilkonvensjoner

- Norsk i UI og commit-meldinger (imperativ form: «Legg til X», ikke «Lagt til»).
- Lesbare navn — ingen `p`, `s`, `c`, `el`, `inst`, `fmt`. Universelle forkortelser (`url`, `id`, `html`, `api`) er greit.
- Ingen page-spesifikke `<style>`-blokker eller inline `style=""`. Stiler hører hjemme i CSS-lagene.
- Én logisk endring per commit. Ikke commit `public/*.js` (genereres lokalt).
