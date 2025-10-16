# Cloudflare AI Starter — `cloudflare-ai-starter`

**Overview**
- Demo app using Cloudflare Agents / Workers AI (Llama 3.3), Workflows pattern, Pages chat UI (Realtime-ready), Durable Objects + Vectorize stubs for memory/state.
- Language: **TypeScript**

**What is included**
- `src/agents/` — example Agent (`ChatAgent.ts`) showing `@callable()` usage.
- `src/workers/` — Workers entrypoints (`chat.ts`) to route chat messages.
- `src/durableObjects/` — `ChatState` durable object skeleton for per-conversation memory.
- `src/vector/` — Vectorize helper (stub) for embeddings & RAG.
- `pages/` — minimal chat UI (index.html + client JS) that works with Pages or Realtime.
- `wrangler.toml`, `package.json`, `.env.example`
- GitHub Actions deploy workflow `.github/workflows/deploy.yml`

**How to use**
1. Install dependencies: `npm install`
2. Fill environment variables in `.env.example` or configure via Cloudflare dashboard.
3. Start local dev: `npm run dev` (wraps `wrangler dev --remote` by default)
4. Deploy: `npm run deploy` (requires Wrangler + Cloudflare account + secrets configured)

**Notes**
- This is a starter scaffold with example code and placeholders. Do NOT commit secrets. Replace placeholders in `wrangler.toml` and `.env.example` with your values.
- The Agent and Workers use the Cloudflare Workers AI meta model reference in comments (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) — ensure your Cloudflare account has permission and available capacity.



**Commands Executed**

1. **Verify Node.js & npm versions**

```
node -v   # v24.7.0
npm -v    # 11.5.1
```

2. **Install Wrangler globally**

```
npm install -g wrangler
```

3. **Login to Cloudflare via Wrangler**

```
wrangler login
```

4. **Fix wrangler.toml Durable Object configuration**

* Add `account_id` and model/namespace placeholders.

5. **Install TypeScript types for Workers**

```
npm install -D @cloudflare/workers-types
```

6. **Update tsconfig.json to include:**

```
"types": ["@cloudflare/workers-types"]
```

7. **Fix TypeScript errors in ChatState and chat.ts**

* Add proper interfaces and typing for JSON bodies.
* Export `ChatState` for Durable Object binding.

8. **Serve chat UI via Worker**

* Updated `chat.ts` to serve `index.html` at `/`.
* Added frontend JS for sending messages to `/api/chat`.

9. **Compile TypeScript and verify**

```
npx tsc --noEmit
```

10. **Run local dev server**

```
npx wrangler dev
```

* Verified at [http://localhost:8787](http://localhost:8787)
* Chat works:

```
You: Hello
Bot: Echo: Hello
```


