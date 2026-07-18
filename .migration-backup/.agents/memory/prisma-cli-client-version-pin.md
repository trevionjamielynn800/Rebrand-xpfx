---
name: Prisma CLI/client version pinning
description: A monorepo devDependency pin for the prisma CLI must match the workspace's @prisma/client version or the query engine crashes at runtime.
---

In a monorepo, if the root `package.json` pins the `prisma` CLI to a different major/minor than a workspace's `@prisma/client` dependency, `npm install`/hoisting can leave a query-engine binary generated for one version while the installed client package is another. The failure mode is not a install error — it's a runtime panic when the engine is constructed (e.g. "missing field" in constructor options), because the client's generated call shape doesn't match what that engine version expects.

**Why:** This is invisible until the server actually boots and tries to connect to the database — builds and typechecks pass, only runtime engine init fails, so it's easy to miss in CI that only runs `build`/`typecheck`.

**How to apply:** Keep the root devDependency pin for `prisma` and every workspace's `prisma`/`@prisma/client` pair on the same version. After changing any of them, run `npx --no-install prisma generate` for the affected schema and boot the server to confirm the query engine actually initializes — don't just check that `npm install` and `build` succeed.
