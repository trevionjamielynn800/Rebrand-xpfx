---
name: cookie-parser signed secret
description: express cookie-parser silently 500s on signed-cookie routes if no secret was passed at init; also requires a fail-fast prod guard.
---

`cookieParser()` initialized with no secret will 500 (not warn) the first time any route touches a signed cookie (`signed: true` on `res.cookie`, or `req.signedCookies`). This failure is invisible on plain page loads/health checks and only appears on the specific auth/session routes that use signed cookies, so it survives casual smoke testing.

**Why:** A cookie/session secret is a security-sensitive value — it must never have a hardcoded production fallback. The fix is two-part: pass the real secret to `cookieParser(secret)` (same secret as the session middleware), AND fail startup fast in production if that secret env var is missing, rather than silently falling back to a bundled default string.

**How to apply:** Whenever adding or reviewing cookie/session middleware, confirm (a) `cookieParser` receives the same secret as `express-session`, and (b) production boot throws if that secret isn't set via env — never let a real deployment run on a hardcoded fallback secret. Test an actual signed-cookie-touching endpoint (e.g. login), not just static routes.
