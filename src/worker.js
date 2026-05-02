const GITHUB_COMMITS = 'https://api.github.com/repos/fremtind/jokul/commits?author=lmfaole';
const CACHE_TTL = 600;
const GITHUB_HEADERS = {
  'User-Agent': 'lmfaole.party',
  'Accept': 'application/vnd.github+json',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/commits') {
      return handleCommits(ctx);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleCommits(ctx) {
  const cache = caches.default;
  const cacheKey = new Request('https://lmfaole.party/api/commits?v=3', { method: 'GET' });

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const [listRes, countRes] = await Promise.all([
    fetch(`${GITHUB_COMMITS}&per_page=25`, { headers: GITHUB_HEADERS }),
    fetch(`${GITHUB_COMMITS}&per_page=1`, { headers: GITHUB_HEADERS }),
  ]);

  if (!listRes.ok || !countRes.ok) {
    return new Response(JSON.stringify({ error: 'upstream', status: listRes.status }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const commits = await listRes.json();
  const slim = commits.map(c => ({
    sha: c.sha,
    html_url: c.html_url,
    message: c.commit.message.split('\n')[0],
    date: c.commit.author.date,
  }));

  const total = parseTotalFromLink(countRes.headers.get('Link')) ?? (await countRes.json()).length;

  const response = new Response(JSON.stringify({ commits: slim, total }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${CACHE_TTL}`,
    },
  });

  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

function parseTotalFromLink(link) {
  if (!link) return null;
  const match = link.match(/<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/);
  return match ? Number(match[1]) : null;
}
