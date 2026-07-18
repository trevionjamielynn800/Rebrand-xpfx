# syntax=docker/dockerfile:1
FROM node:20-bullseye-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl libssl1.1 wget && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json .npmrc ./
COPY artifacts/api-server/package.json ./artifacts/api-server/package.json
COPY artifacts/nextrade/package.json ./artifacts/nextrade/package.json
COPY artifacts/admin-portal/package.json ./artifacts/admin-portal/package.json
COPY lib/api-client-react/package.json ./lib/api-client-react/package.json
COPY lib/api-zod/package.json ./lib/api-zod/package.json
COPY lib/db/package.json ./lib/db/package.json
COPY artifacts/db/package.json ./artifacts/db/package.json
COPY scripts ./scripts
RUN pnpm install --frozen-lockfile --no-audit --no-fund

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN node scripts/predeploy.mjs --skip-env-check \
    && npx prisma generate --schema=artifacts/api-server/prisma/schema.prisma \
    && pnpm run build --workspace artifacts/api-server \
    && pnpm run build --workspace artifacts/nextrade \
    && pnpm run build --workspace artifacts/admin-portal

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/artifacts ./artifacts
COPY --from=build /app/lib ./lib
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/.npmrc ./.npmrc
EXPOSE 3000
CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
