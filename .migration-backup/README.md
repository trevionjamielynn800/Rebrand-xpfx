Here is your complete `README.md`, production enterprise grade, ready to copy in one click.

---

**`README.md`**

```markdown
# XpressPro FX — Rebranded XPFX

A production-ready, enterprise-grade trading platform API server built with Node.js, TypeScript, deployed on Railway using Railpack with a fully automated GitHub Actions CI/CD pipeline.

---

## Project Structure

```
Rebranded-xpfx/
├── artifacts/
│   └── api-server/
│       ├── src/
│       │   ├── app.ts            # Express app — middleware, routes, security
│       │   └── index.ts          # Server entry point
│       ├── dist/                 # Compiled output (auto-generated, do not edit)
│       ├── package.json          # API server dependencies and scripts
│       └── tsconfig.json         # TypeScript compiler configuration
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions CI/CD pipeline
├── railway.json                  # Railway deployment configuration
├── railpack.json                 # Railpack build configuration
├── .railwayignore                # Files excluded from Railway deployment
├── .env.example                  # Environment variable template
└── README.md
```

---

## Requirements

- Node.js v20+
- pnpm v10+
- Railway account
- GitHub repository connected to Railway project

---

## Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/maxgiesingerofficialchat1-wq/Rebranded-xpfx.git
cd Rebranded-xpfx

# 2. Install dependencies
pnpm install

# 3. Copy and configure environment variables
cp .env.example .env
# Open .env and fill in all required values

# 4. Build the TypeScript source
pnpm build

# 5. Verify build output
ls artifacts/api-server/dist/
# Confirm index.mjs exists before proceeding

# 6. Start the production server
pnpm start
```

---

## Environment Variables

All required environment variables are defined in `.env.example`.
Copy it to `.env` and fill in every value before running locally or deploying to Railway.

> **Important:** Never commit `.env` to version control.
> All production secrets must be set directly in Railway environment variable settings.

---

## Available Scripts

| Script | Description |
|---|---|
| `pnpm run build` | Compiles TypeScript source to `dist/` |
| `pnpm start` | Runs the compiled production server |
| `pnpm run predeploy` | Validates repo config and production readiness |
| `pnpm run dev` | Runs server in development watch mode |
| `pnpm test` | Runs the full test suite |
| `pnpm audit` | Checks for known security vulnerabilities |

---

## API Health Check Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/healthz` | GET | Basic server liveness check |
| `/api/healthz` | GET | API-level deep health check |

---

## Production Features

| Feature | Status |
|---|---|
| CORS with origin allowlist | ✅ Active |
| CSRF defense | ✅ Active |
| Rate limiting — auth routes | ✅ Active |
| Rate limiting — live-chat routes | ✅ Active |
| Webhook raw body capture | ✅ Active |
| Session and platform gate | ✅ Active |
| Static file serving for SPA | ✅ Active |
| Pino HTTP structured logging | ✅ Active |
| Health check endpoints `/healthz` `/api/healthz` | ✅ Active |

---

## Deployment — Railway via Railpack

This project uses **Railpack** as the build system on **Railway**.

```bash
# Before every deployment, verify build output locally
pnpm install
pnpm build
ls artifacts/api-server/dist/
# index.mjs must be present before proceeding
```

Push to your connected Railway branch to trigger automatic deployment.

Railway will execute:
1. Railpack build using `pnpm build`
2. Start command: `node artifacts/api-server/dist/index.mjs`
3. Health check against `/healthz`

---

## CI/CD Pipeline — GitHub Actions

The `.github/workflows/ci.yml` pipeline runs automatically on every push.

| Stage | Description |
|---|---|
| Install dependencies | `pnpm install --frozen-lockfile --no-audit --no-fund` |
| Predeploy validation | `pnpm run predeploy` |
| Run lint | `pnpm lint` |
| Run tests | `pnpm test` |
| Build all workspaces | `pnpm build` |
| Security audit | `pnpm audit --audit-level=high` |

---

## Security Considerations

- All secrets and credentials must be stored as Railway environment variables — **never hardcoded**
- CORS origin allowlist must be explicitly configured per environment
- Rate limiting is active on authentication and live-chat routes
- Run `pnpm audit --audit-level=high` before every production release
- HTTPS and SSL/TLS are enforced at the Railway infrastructure level
- `.env` must never be committed to version control

---

## Real-Time Experience

The platform is architected for real-time trading data and live user interactions through:

- Low-latency Express API response architecture
- Webhook integration with raw body capture
- Session-aware platform gating
- Live-chat route with dedicated rate limiting
- Structured real-time observability logging via Pino HTTP

---

## License

Private — All rights reserved. XpressPro FX © 2026
```

---

That is the full file, composed from everything covered across our session. You can copy it entirely in one click. Let me know if you need the `deploy.yml` or `.env.example` reviewed and matched to this same production standard.
