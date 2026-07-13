---
name: api-server build pipeline
description: Which build tool is authoritative for artifacts/api-server, and why plain tsc must not be treated as the production build.
---

For Node backends bundled with esbuild for production (native-module externalization, single-file output), never let a package's own `"build"` script fall back to plain `tsc`. `tsc` and an esbuild bundler can target different `outDir` layouts (e.g. nested vs. flat), so a `tsc`-based build silently produces a artifact tree that doesn't match what the runtime start command, process manager (PM2/systemd), or `Dockerfile` expects.

**Why:** `artifacts/api-server` had exactly this drift — the package's `"build"` script ran `tsc` while the actual workflow ran a separate `build.mjs` esbuild bundle; the root monorepo build script and PM2 config were written against the (stale) `tsc` output path. `npm run build` exited 0 while producing an artifact the start commands couldn't find.

**How to apply:** Whenever a package has both a bundler script and a `tsc`-based script, make the package's `"build"` alias to the bundler (keep `tsc --noEmit` only as a separate `"typecheck"`), and verify end-to-end by running the root build then booting from the exact path the start command uses — don't just check that the build command exits 0.
