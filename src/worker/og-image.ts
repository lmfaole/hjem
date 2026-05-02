import satori, { init as initSatori } from 'satori/wasm';
import initYoga from 'yoga-wasm-web';
import yogaWasm from 'yoga-wasm-web/dist/yoga.wasm';
import { initWasm as initResvg, Resvg } from '@resvg/resvg-wasm';
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm';

const FONT_REGULAR = 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.1.1/files/inter-latin-400-normal.woff2';
const FONT_BOLD = 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.1.1/files/inter-latin-700-normal.woff2';
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;

// Minimal element type compatible with what satori accepts.
interface OgElement {
  type: string;
  props: {
    style?: Record<string, string | number | null>;
    children?: OgElement | OgElement[] | string | null;
  };
}

let wasmReady = false;

async function ensureWasm(): Promise<void> {
  if (wasmReady) return;
  const yoga = await initYoga(yogaWasm);
  initSatori(yoga);
  await initResvg(resvgWasm);
  wasmReady = true;
}

async function loadFont(url: string, cfCache: Cache): Promise<ArrayBuffer> {
  const cacheKey = new Request(url);
  const cached = await cfCache.match(cacheKey);
  if (cached) return cached.arrayBuffer();
  const response = await fetch(url);
  cfCache.put(cacheKey, response.clone());
  return response.arrayBuffer();
}

// Minimal element builder — satori accepts React-element-shaped objects: { type, props: { style, children } }
function el(type: string, style: OgElement['props']['style'], children: OgElement['props']['children']): OgElement {
  return { type, props: { style, children: children ?? null } };
}

function buildElement(variant: string): OgElement {
  const isCv = variant === 'cv';

  const accentBar = el('div', {
    width: '100%',
    height: 8,
    backgroundImage: 'linear-gradient(to right, #7c3aed, #2563eb)',
  }, null);

  const cvPill = el('div', {
    display: 'flex',
    alignSelf: 'flex-start',
    backgroundColor: '#7c3aed',
    color: '#fff',
    fontSize: 20,
    fontWeight: 700,
    padding: '6px 18px',
    borderRadius: 6,
    marginBottom: 20,
  }, 'CV');

  const nameElement = el('div', {
    fontSize: 80,
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.05,
    marginBottom: 16,
  }, 'Ole Jørgen Bakken');

  const subtitle = el('div', {
    fontSize: 36,
    fontWeight: 400,
    color: '#888',
  }, isCv ? 'Webutvikler og designsystem-nørd' : 'Livet er en fest.');

  const content = el('div', {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'center',
  }, [
    ...(isCv ? [cvPill] : []),
    nameElement,
    subtitle,
  ]);

  const footer = el('div', {
    display: 'flex',
    justifyContent: 'flex-end',
    color: '#555',
    fontSize: 28,
    fontWeight: 400,
  }, 'lmfaole.party');

  const body = el('div', {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: '60px 80px 48px',
    justifyContent: 'space-between',
  }, [content, footer]);

  return el('div', {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    backgroundColor: '#111',
    fontFamily: 'Inter',
  }, [accentBar, body]);
}

export async function generateOgImage(variant: string, cfCache: Cache): Promise<Uint8Array> {
  await ensureWasm();

  const [regularFont, boldFont] = await Promise.all([
    loadFont(FONT_REGULAR, cfCache),
    loadFont(FONT_BOLD, cfCache),
  ]);

  const svg = await satori(buildElement(variant) as Parameters<typeof satori>[0], {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    fonts: [
      { name: 'Inter', data: regularFont, weight: 400, style: 'normal' },
      { name: 'Inter', data: boldFont, weight: 700, style: 'normal' },
    ],
  });

  const resvg = new Resvg(svg);
  return resvg.render().asPng();
}
