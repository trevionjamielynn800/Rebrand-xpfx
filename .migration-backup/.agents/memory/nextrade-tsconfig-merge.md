---
name: nextrade-tsconfig-merge
description: How nextrade's split-artifact (parts 1+2) was merged and tsconfig path quirks
---

## Rule
Nextrade is split across `05-artifacts-nextrade-part1/` (src, index.html, package.json) and `06-artifacts-nextrade-part2/` (vite.config.ts, tsconfig.json, additional src). Merged into `.merged/nextrade/` and registered in npm workspaces.

**Why:** vite.config.ts uses `import.meta.dirname` for `root:`, so the config and src must share one directory. Symlinking would give wrong `import.meta.dirname`.

**tsconfig base path quirk:** All package tsconfigs extend `../../tsconfig.base.json`. In 01-root-and-misc, symlinks make this resolve to `01-root-and-misc/tsconfig.base.json`. From `.merged/nextrade/`, it resolves to workspace root. Fix: copy `tsconfig.base.json` to `/home/runner/workspace/` and `/home/runner/workspace/07-lib-misc/`.

**`references` field:** Removed from `.merged/nextrade/tsconfig.json` — Vite/esbuild doesn't use TypeScript project references; keeping them causes esbuild to fail when it can't find the referenced tsconfig.

**Port:** Nextrade runs on PORT=5000 (Replit webview requires 5000). API server on 8080. Both via `prefer-workspace-packages=true` in `.npmrc`.
