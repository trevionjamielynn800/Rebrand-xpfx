---
name: CORS multi-platform
description: How the API server resolves allowed CORS origins on Replit vs other platforms.
---

`artifacts/api-server/src/app.ts` builds the `allowedOrigins` Set from two env vars:

1. `ALLOWED_ORIGINS` — comma-separated **full origin URLs**, e.g. `https://example.com,https://www.example.com`. Intended for Render, Railway, VPS, custom domains. Added in the production-readiness audit.
2. `REPLIT_DOMAINS` — comma-separated **hostnames only** (no scheme), e.g. `foo.repl.co`. Injected automatically by Replit's platform.

Both sources are merged into the same Set. In development (`NODE_ENV !== "production"`) all origins are allowed (null → allow-all).

**Why:** REPLIT_DOMAINS alone only worked on Replit; any other platform would get an empty Set and deny all credentialed cross-origin requests.

**How to apply:** When deploying to a non-Replit platform, set `ALLOWED_ORIGINS` to the comma-separated list of frontend URLs. The env var is already in `env.ts`, `app.ts`, and `.env.example`.
