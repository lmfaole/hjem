# budsjett-app

Personlig budsjett-dashboard på `budsjett.lmfaole.party`. Cloudflare Workers + D1 + Cloudflare Access.

Utfyllende dokumentasjon i [CLAUDE.md](./CLAUDE.md).

## Kom i gang

```
npm install
npm run typecheck
npm run test
npm run build
```

For å deploye:

```
npm run deploy
```

For å lage en ny D1-database fra scratch:

```
npm run db:create        # kopier returnert database_id inn i wrangler.jsonc
npm run db:migrate
npm run db:seed
```
