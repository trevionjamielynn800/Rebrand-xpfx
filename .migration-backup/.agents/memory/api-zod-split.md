---
name: api-zod split assembly
description: @workspace/api-zod is split across two Replit artifact dirs and must be manually merged for local dev
---

The `@workspace/api-zod` package is split across two numbered artifact dirs:
- `08-lib-api-zod-part1/lib/api-zod/` — has `package.json`, `src/generated/api.ts`, `src/generated/types/` (A-N alphabetically)
- `09-lib-api-zod-part2/lib/api-zod/` — has `src/index.ts`, `src/generated/types/` (G-Z alphabetically), `tsconfig.json`

**Why:** Replit splits large packages across numbered artifact dirs when they exceed size limits. The Replit platform assembles them at deploy time, but the local dev environment sees them separately.

**How to apply:** A merged directory at `.merged/api-zod/` is pre-assembled from both parts (cp files + zod node_modules link). The root `pnpm-workspace.yaml` uses `.merged/api-zod` instead of the numbered part1 dir. If either part is ever modified, re-run:
```bash
MERGED=/home/runner/workspace/.merged/api-zod
P1=/home/runner/workspace/08-lib-api-zod-part1/lib/api-zod
P2=/home/runner/workspace/09-lib-api-zod-part2/lib/api-zod
cp $P2/src/index.ts $MERGED/src/index.ts
cp -r $P2/src/generated/types/. $MERGED/src/generated/types/
cp $P1/src/generated/api.ts $MERGED/src/generated/api.ts
```
