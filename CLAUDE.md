# lmfaole.party

Personal landing site deployed to Cloudflare Workers (static assets).

## Stack

The project uses TypeScript throughout. Worker code is compiled by wrangler (via esbuild). Client-side scripts are compiled with `tsc` to `public/`.

- No React, Vue, Svelte, Next, Astro, etc.
- No Tailwind, Sass, Less, PostCSS, CSS-in-JS.
- No JSX, Vite, Webpack, Rollup, or Parcel.
- No runtime npm dependencies for client-side code.
- Files in `public/` are served as-is by Cloudflare — compiled JS files ship directly.

```
src/
  worker/
    index.ts        ← Cloudflare Worker entry (compiled by wrangler)
    og-image.ts     ← og:image handler         (compiled by wrangler)
    wasm.d.ts       ← type declarations for .wasm imports
  client/
    site-header.ts  ← <site-header> web component  (compiled → public/site-header.js)
    index.ts        ← front page script             (compiled → public/index.js)
    cv.ts           ← CV page script                (compiled → public/cv.js)
    tsconfig.json   ← client build config (outDir: ../../public)
tsconfig.json       ← worker type-check config (noEmit, CF Workers types)
```

## Build and deploy

```
npm run build     # compile src/client → public/
npm run typecheck # type-check everything without emitting
npm run deploy    # build + wrangler deploy
```

## Styling

Styles live in `public/styles/`, split by concern and loaded via CSS layers:

```
public/styles/
  index.css       ← entry point: declares layer order and imports
  tokens.css      ← CSS variables (colours, font, spacing)
  base.css        ← body, typography defaults
  layout.css      ← site-header, section, article spacing
  interactive.css ← links, buttons, focus, hover
  forms.css       ← fieldset, labels, radio/checkbox
  components.css  ← popover, code
  print.css       ← PDF overrides (imported with `print` media condition)
```

Layer order (lowest → highest priority): `tokens → base → layout → interactive → forms → components → print`

Never add page-specific `<style>` blocks or inline `style=""` attributes — CSS rules are layout primitives that apply across the whole site.

## Shared header

The site header is a web component defined in `src/client/site-header.ts`. Use `<site-header></site-header>` in HTML — no JS injection needed. CSS targets the `site-header` element directly.

## CV data

`public/cv.json` follows the [JSON Resume schema](https://jsonresume.org/schema/) with two custom fields:

- `areaLang` on education entries — BCP 47 language tag for the `area` field when it's in a different language than the page
- `nameLang` on certificate entries — same, for the `name` field
- `highlights` items are objects `{ text, url? }` rather than plain strings

## Navngivning og lesbarhet

Foretrekk alltid lesbare navn fremfor korte. Dette gjelder TypeScript, CSS og HTML-attributter.

**Forbudt:**
- Enkeltbokstavs variabelnavn (`p`, `s`, `c`, `e`, `d`, `a`, `l`)
- Forkortelser som krever kontekst for å forstås (`inst`, `fmt`, `el`, `li`, `msg`, `ctx`, `slim`, `top`, `rest`, `listRes`, `countRes`)
- Generiske plassholdernavn som ikke sier noe om innholdet (`items`, `data`, `element`, `result`, `value`)
- Suffiks som ikke kompenserer for et vagt prefiks (`eduHtml`, `certHtml`, `langHtml` — bruk `educationHtml`, `certificatesHtml`, `languagesHtml`)
- Forkortede parameternavn i funksjoner (`str`, `fn`, `cb`) — bruk `dateString`, `callback` osv.
- CSS-variabler som ikke forklarer seg selv (`--font`, `--leading`)

**Påkrevd:**
- Callback-parametere i `.map()`, `.filter()` og `.forEach()` skal navngis etter hva de representerer: `profile` ikke `p`, `commit` ikke `c`, `skill` ikke `s`
- DOM-elementer skal beskrive innholdet: `recentCommitsList` ikke `top`, `link` ikke `a`, `listItem` ikke `li`
- CSS-variabler skal være selvforklarende: `--font-family`, `--line-height`, `--border-strong`
- Funksjoner som transformerer data skal si hva de gjør: `formatDate` ikke `fmtDate`, `renderHighlight` ikke `highlight`
- Unntaket er universelt etablerte forkortelser: `url`, `id`, `html`, `sha`, `api`

## Versjonskontroll

Commit ofte — helst etter hver logisk enhet med arbeid (ny funksjon, bugfix, refaktorering). Små commits gjør det enkelt å gå tilbake, forstå historikk og isolere problemer.

**Regler:**
- Én logisk endring per commit. Ikke bland refaktorering og ny funksjonalitet i samme commit.
- Commitmelding på imperativ form og norsk: «Legg til site-header web component», ikke «la til» eller «added».
- Bruk feature-branches for større endringer som tar mer enn én arbeidsøkt.
- Ikke commit generert kode (`public/*.js`) — disse ligger i `.gitignore`.
- Ikke commit hemmeligheter, nøkler eller `.env`-filer.
