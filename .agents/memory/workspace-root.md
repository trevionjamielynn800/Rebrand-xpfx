---
name: workspace root setup
description: The true pnpm workspace root for XpressPro FX is /home/runner/workspace/, NOT 01-root-and-misc
---

**Rule:** Always run `pnpm install` from `/home/runner/workspace/` (the actual repo root), never from `01-root-and-misc/`. Node.js resolves module paths using real filesystem paths, so packages must be installed relative to the real numbered artifact dirs (e.g. `02-artifacts-api-server-db/artifacts/api-server/node_modules/`).

**Why:** Installing from `01-root-and-misc/` creates node_modules relative to that dir. When Node.js loads files from `02-artifacts-api-server-db/artifacts/api-server/src/`, it resolves modules via the REAL path, not any symlink in `01-root-and-misc/artifacts/api-server/`. The result is that esbuild/Node can't find packages.

**Key files:**
- `/home/runner/workspace/pnpm-workspace.yaml` — workspace root (uses `.merged/api-zod`, all artifact packages)
- `/home/runner/workspace/package.json` — workspace root manifest (packageManager: pnpm@10.26.1)
- `/home/runner/workspace/01-root-and-misc/package.json` — still has `pnpm@9.15.4` for Railway/corepack compat, leave as-is

**Dev workflow:**
1. `cd /home/runner/workspace && COREPACK_ENABLE_STRICT=0 pnpm install --no-frozen-lockfile`
2. `cd 02-artifacts-api-server-db/artifacts/api-server && node ./build.mjs`
3. `node --enable-source-maps ./dist/index.mjs`

The Replit workflow (artifact.toml dev command) runs install + build + start automatically on each restart.
