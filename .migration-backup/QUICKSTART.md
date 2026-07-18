# Quickstart

## Clone and install

```bash
git clone https://github.com/great9999/Rebranded-xpfx.git
cd Rebranded-xpfx
npm install
cp .env.local.example .env.local
```

## Configure environment

Edit `.env.local` and set at least:

- `NODE_ENV=development`
- `PORT=3000`
- `SESSION_SECRET`
- `WALLET_ENCRYPTION_KEY`
- `DATABASE_URL`
- `ALLOWED_ORIGINS`

## Run the stack

```bash
npm run dev:api
npm run dev:web
npm run dev:admin
```

## Database bootstrap

```bash
npx drizzle-kit push --config lib/db/drizzle.config.ts
```
