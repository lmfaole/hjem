# lmfaole.party

Personal landing site deployed to Cloudflare Workers (static assets).

## Stack — vanilla only

Always use **vanilla HTML, CSS, and JavaScript**. No frameworks, no build step, no transpilers, no preprocessors.

- No React, Vue, Svelte, Next, Astro, etc.
- No Tailwind, Sass, Less, PostCSS, CSS-in-JS.
- No TypeScript, JSX, Babel, Vite, Webpack, Rollup, Parcel.
- No npm dependencies for the site itself (wrangler is fine for deployment).
- Files in `public/` should be served as-is by Cloudflare.

If styling or interactivity is needed, add it directly to `.html`, `.css`, or `.js` files in `public/`.

## Styling

All styles go in `public/styles.css`. Never add page-specific `<style>` blocks or inline `style=""` attributes — CSS rules are layout primitives that apply across the whole site, not implementation details of a single page.

## Deploy

`npx wrangler@latest deploy`
