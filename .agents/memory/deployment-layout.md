---
name: Deployment layout
description: How the monorepo is structured for git, builds, and deployment across platforms.
---

The `artifacts/` directory (api-server, nextrade, admin-portal, mockup-sandbox) is committed to git — it is NOT gitignored. Only `dist/` subdirectories inside them are gitignored (standard build output).

The old approach stored artifacts in ZIP files and extracted them at build time; that was replaced with direct source commits.

**Build command (Render, Railway, VPS, local):**
```
npm install -g pnpm@9 && pnpm install && pnpm --filter @workspace/api-server build
```

**Start command:**
```
node artifacts/api-server/dist/index.mjs
```

**Why:** External platforms (Render, Railway) need to build from source because dist/ is not committed. The pnpm catalog: feature requires pnpm 9+, so `npm install -g pnpm@9` is required before `pnpm install`.

**How to apply:** Any new CI/CD or deployment platform config must use this build + start pattern. The root package.json `build` script and all platform configs (render.yaml, railway.json, nixpacks.toml, fly.toml, Procfile, ecosystem.config.cjs) follow this pattern.

**Security:** `artifacts/api-server/env` is gitignored (it was found to contain real credentials). Real secrets live in Replit Secrets (SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD).
