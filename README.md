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

- Node.js v18+
- npm v9+
- Railway account
- GitHub repository connected to Railway project

---

## Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/alfredgrace904-ops/Rebranded-xpfx.git
cd Rebranded-xpfx

# 2. Navigate to the API server
cd artifacts/api-server

# 3. Install dependencies
npm install

# 4. Copy and configure environment variables
cp .env.example .env
# Open .env and fill in all required values

# 5. Build the TypeScript source
npm run build

# 6. Verify build output
ls dist/
# Confirm index.js exists before proceeding

# 7. Start the production server
npm start
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
| `npm run build` | Compiles TypeScript source to `dist/` |
| `npm start` | Runs the compiled production server |
| `npm run dev` | Runs server in development watch mode |
| `npm test` | Runs the full test suite |
| `npm audit` | Checks for known security vulnerabilities |

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
cd artifacts/api-server
npm install
npm run build
ls dist/
# index.js must be present before pushing
```

Push to your connected Railway branch to trigger automatic deployment.

Railway will execute:
1. Railpack build using `npm run build`
2. Start command: `node artifacts/api-server/dist/index.mjs`
3. Health check against `/healthz`

---

## CI/CD Pipeline — GitHub Actions

The `.github/workflows/deploy.yml` pipeline runs automatically on every push.

| Stage | Description |
|---|---|
| Build & Compile | TypeScript compilation via `npm run build` |
| Automated Tests | Full test suite via `npm test` |
| Security Audit | `npm audit` scan for known vulnerabilities |
| Zero-Downtime Deploy | Rolling deployment with no service interruption |
| Health Check Verification | Post-deploy check against `/healthz` |
| Automatic Rollback | Instant rollback on failed deployment or health check |

---

## Security Considerations

- All secrets and credentials must be stored as Railway environment variables — **never hardcoded**
- CORS origin allowlist must be explicitly configured per environment
- Rate limiting is active on authentication and live-chat routes
- Run `npm audit` before every production release
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
