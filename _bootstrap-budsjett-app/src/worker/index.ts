import { handleBudsjettApi } from './budsjett.js';

interface Env {
  ASSETS: Fetcher;
  BUDSJETT_DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return handleBudsjettApi(request, url, env);
    }
    return env.ASSETS.fetch(request);
  },
};
