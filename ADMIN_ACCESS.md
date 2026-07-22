# Admin access

## How admin login works

The API seeds an admin user at startup only when both `ADMIN_EMAIL` and
`ADMIN_PASSWORD` are configured. `ADMIN_EMAIL` may contain a comma-separated
list; each address is normalized and receives the same admin password. The
password is hashed in memory and is never returned by an API response.

Admin login uses the normal endpoint:

```http
POST /api/auth/login
Content-Type: application/json

{"email":"admin@example.invalid","password":"<configured password>"}
```

A successful response has `role: "admin"` and sets the signed, HTTP-only
`xpfx_sid` session cookie. Admins authenticate directly and do not go through
OTP verification. Do not put the password in shell history, logs, screenshots,
commits, or support tickets.

## Required environment

Set these values in the deployment secret manager or an untracked local `.env`:

- `ADMIN_EMAIL`: one email or a comma-separated list of admin emails.
- `ADMIN_PASSWORD`: the password shared by the seeded admin accounts.
- `SESSION_SECRET`: the cookie-signing secret.

The exact variable names and behavior are implemented in
`artifacts/api-server/src/lib/env.ts` and `artifacts/api-server/src/lib/store.ts`.

## Admin portal

Start the API and admin portal, then open the admin portal URL. Log in with one
of the configured addresses. The API session cookie is scoped to `/` and is
sent to same-origin API requests. Admin-only routes enforce `role === "admin"`
and return `401` when unauthenticated or `403` for non-admin users.

## Recovery and security boundaries

Connected wallets are non-custodial. The service accepts public blockchain
addresses only; it must never receive or store seed phrases, private keys,
PINs, CVVs, or full card numbers. A wallet address change is a public-address
update, not credential recovery. Card replacement must be handled by the card
processor's hosted support/reissue flow. Support and admin views may show
status, provider, masked last-four metadata, and audit events, but never secret
material.

Admin credentials are operational secrets. Rotate them in the deployment
provider and restart the service; never add real values to `.env`, logs, or this
document.
