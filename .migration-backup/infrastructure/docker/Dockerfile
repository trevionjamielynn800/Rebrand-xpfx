# syntax=docker/dockerfile:1
FROM node:20-bullseye-slim AS base
WORKDIR /app
COPY package.json package-lock.json* ./
COPY artifacts/api-server/package.json ./artifacts/api-server/package.json
COPY artifacts/nextrade/package.json ./artifacts/nextrade/package.json
COPY artifacts/admin-portal/package.json ./artifacts/admin-portal/package.json
COPY lib/api-client-react/package.json ./lib/api-client-react/package.json
COPY lib/api-zod/package.json ./lib/api-zod/package.json
COPY lib/db/package.json ./lib/db/package.json
COPY artifacts/db/package.json ./artifacts/db/package.json
COPY scripts ./scripts
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build --workspace=artifacts/api-server
EXPOSE 3000
CMD ["node", "artifacts/api-server/dist/index.mjs"]
