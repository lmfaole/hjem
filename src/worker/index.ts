import { generateOgImage } from './og-image.js';
import { parseTotalFromLink } from './utils.js';
import { handleBudsjett } from './budsjett.js';

const GITHUB_COMMITS = 'https://api.github.com/repos/fremtind/jokul/commits?author=lmfaole';
const CACHE_TTL = 600;
const GITHUB_HEADERS = {
  'User-Agent': 'lmfaole.party',
  'Accept': 'application/vnd.github+json',
};
const BUDSJETT_HOSTNAME = 'budsjett.lmfaole.party';

interface Env {
  ASSETS: Fetcher;
  BUDSJETT_DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname === BUDSJETT_HOSTNAME) {
      return handleBudsjett(request, url, env);
    }
    if (url.pathname === '/api/commits') {
      return handleCommits(context);
    }
    if (url.pathname === '/api/og') {
      return handleOgImage(url, context);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleCommits(context: ExecutionContext): Promise<Response> {
  const cache = caches.default;
  const cacheKey = new Request('https://lmfaole.party/api/commits?v=3', { method: 'GET' });

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  // Fetch the commit list and a single-item page in parallel.
  // The single-item request is only used for its Link header, which tells us
  // the total number of pages (= total commits) without downloading everything.
  const [listResponse, countResponse] = await Promise.all([
    fetch(`${GITHUB_COMMITS}&per_page=25`, { headers: GITHUB_HEADERS }),
    fetch(`${GITHUB_COMMITS}&per_page=1`, { headers: GITHUB_HEADERS }),
  ]);

  if (!listResponse.ok || !countResponse.ok) {
    return new Response(JSON.stringify({ error: 'upstream', status: listResponse.status }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const commits = await listResponse.json<GithubCommit[]>();
  const simplifiedCommits = commits.map(commit => ({
    sha: commit.sha,
    html_url: commit.html_url,
    message: commit.commit.message.split('\n')[0],
    date: commit.commit.author.date,
  }));

  const total = parseTotalFromLink(countResponse.headers.get('Link')) ?? (await countResponse.json<GithubCommit[]>()).length;

  const response = new Response(JSON.stringify({ commits: simplifiedCommits, total }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${CACHE_TTL}`,
    },
  });

  context.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

async function handleOgImage(url: URL, context: ExecutionContext): Promise<Response> {
  const variant = url.searchParams.get('variant') ?? 'default';
  const cache = caches.default;
  const cacheKey = new Request(`https://lmfaole.party/api/og?variant=${variant}&v=1`, { method: 'GET' });

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const png = await generateOgImage(variant, cache);

  const response = new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': `public, max-age=${CACHE_TTL}`,
    },
  });

  context.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

interface GithubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { date: string };
  };
}
