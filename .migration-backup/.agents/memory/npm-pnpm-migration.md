---
name: npm-pnpm-migration
description: XpressPro FX pnpm→npm workspace migration; key gotchas and bridging config
---

## Rule
Production configs (railpack.toml, render.yaml, deploy.sh, post-merge.sh, ecosystem.config.cjs) use `npm ci` and `npm run build -w`. Dev root uses npm workspaces via `"workspaces"` in package.json. pnpm-workspace.yaml backed up at `/home/runner/workspace/pnpm-workspace.yaml.bak`.

**Why:** Artifact-managed API Server workflow still runs pnpm. `prefer-workspace-packages=true` in `.npmrc` makes pnpm link `"*"` workspace deps (not just `workspace:*`). Without this, pnpm would fail to resolve `@workspace/api-zod: "*"` from registry.

**How to apply:** Keep `prefer-workspace-packages=true` in root `.npmrc`. catalog: → actual versions was done via node script inline. `workspace:*` → `*` for cross-PM compat.

## pnpm-only feature with NO npm equivalent
`minimumReleaseAge: 1440` (24h supply-chain delay). Documented in `.npmrc` comments. Run `npm audit --audit-level=high` in CI instead.
