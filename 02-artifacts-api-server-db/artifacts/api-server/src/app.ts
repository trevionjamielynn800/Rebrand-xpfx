import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import pinoHttp from "pino-http";
import { rateLimit } from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";
import { attachSession } from "./lib/session";
import { platformGate } from "./lib/platform-gate";
import { env, isProduction } from "./lib/env";

const app: Express = express();

// Trust the platform's TLS-terminating reverse proxy in production so that
// rate-limiting middleware keys on real client IPs rather than the proxy's IP.
if (isProduction) {
  app.set("trust proxy", 1);
}

if (isProduction && !env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET is required in production. Set it as an environment secret before starting the server.",
  );
}
const SESSION_SECRET = env.SESSION_SECRET ?? "xpfx-dev-secret-change-me";

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
// Build an explicit allowlist of frontend origins for CORS.
//
// Priority (first match wins):
//   1. ALLOWED_ORIGINS — comma-separated full origins, e.g.:
//        https://app.yourdomain.com,https://admin.yourdomain.com
//      Use this on Railway, Render, VPS, and any non-Replit deployment.
//   2. REPLIT_DOMAINS — comma-separated hostnames injected by Replit, e.g.:
//        foo.repl.co,bar.repl.co
//      The server converts these to https:// origins automatically.
//
// In development all origins are permitted so local work is unimpeded.
// In production, if neither variable is set, all credentialed cross-origin
// requests are denied (fail-closed).
const allowedOrigins: Set<string> | null = (() => {
  if (!isProduction) return null; // null == allow-all in dev

  const origins = new Set<string>();

  // ALLOWED_ORIGINS: values are already full origins (https://...)
  const allowedRaw = env.ALLOWED_ORIGINS ?? "";
  for (const origin of allowedRaw.split(",").map((s) => s.trim()).filter(Boolean)) {
    origins.add(origin);
  }

  // REPLIT_DOMAINS fallback: bare hostnames → https:// origins
  if (origins.size === 0) {
    const replitRaw = env.REPLIT_DOMAINS ?? "";
    for (const host of replitRaw.split(",").map((s) => s.trim()).filter(Boolean)) {
      origins.add(`https://${host}`);
    }
  }

  if (origins.size === 0) {
    logger.warn(
      "Neither ALLOWED_ORIGINS nor REPLIT_DOMAINS is set in production — credentialed cross-origin requests will be denied. " +
      "Set ALLOWED_ORIGINS=https://your-frontend.com in your platform environment.",
    );
  }
  return origins; // may be empty; empty == deny all cross-origin credentialed requests
})();

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header → server-to-server or same-origin request; pass through.
      if (!origin) return callback(null, false);
      if (allowedOrigins === null) return callback(null, true); // dev: allow all
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(null, false); // unknown origin — deny credentials
    },
    credentials: true,
  }),
);

// cookieParser must run before the CSRF middleware so req.signedCookies is
// populated when we check for the session cookie below.
app.use(cookieParser(SESSION_SECRET));

// CSRF defense-in-depth: for cookie-authenticated mutating requests in
// production, reject any Origin/Referer that is not on the allowlist.
// This is a secondary layer; the CORS policy above is the primary guard.
app.use((req, res, next) => {
  if (
    isProduction &&
    allowedOrigins !== null &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)
  ) {
    const originHeader = req.headers.origin as string | undefined;
    let checkOrigin: string | undefined = originHeader;
    if (!checkOrigin && req.headers.referer) {
      try {
        checkOrigin = new URL(req.headers.referer as string).origin;
      } catch {
        checkOrigin = undefined;
      }
    }
    // Only enforce when an origin is present and the request carries a session
    // cookie — unauthenticated mutations (signup, login) don't need protection.
    const hasCookie = Boolean(
      req.signedCookies?.["xpfx_sid"] ?? req.cookies?.["xpfx_sid"],
    );
    if (checkOrigin && hasCookie && !allowedOrigins.has(checkOrigin)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }
  next();
});

// MoonPay signs the *raw* webhook body. Capture it as a Buffer on the
// request before the JSON parser turns it into an object, so the
// /moonpay/webhook handler can HMAC the exact bytes MoonPay signed.
app.use(
  "/api/moonpay/webhook",
  express.raw({ type: "application/json", limit: "1mb" }),
);
app.use(
  "/api/coinbase/webhook",
  express.raw({ type: "application/json", limit: "1mb" }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(attachSession);
app.use(platformGate);

// Rate-limit auth endpoints to resist brute-force and credential stuffing.
// Counts attempts per IP. Limits are intentionally tight on high-risk paths.
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  limit: 20,                 // max 20 auth attempts per IP per window
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
  skip: () => !isProduction,  // enforce only in production
});

const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,                 // stricter limit for OTP verification and resend
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
  skip: () => !isProduction,
});

app.use("/api/auth/login", authRateLimit);
app.use("/api/auth/signup", authRateLimit);
app.use("/api/auth/verify-otp", otpRateLimit);
app.use("/api/auth/resend-otp", otpRateLimit);

// Rate-limit live-chat to prevent cost and availability abuse of the AI backend.
// Keyed per authenticated user ID (falls back to IP for unauthenticated requests).
const liveChatRateLimit = rateLimit({
  windowMs: 60 * 1000,           // 1-minute window
  limit: 10,                     // max 10 messages per user per minute
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => (req as typeof req & { userId?: string }).userId ?? req.ip ?? "unknown",
  validate: { keyGeneratorIpFallback: false },
  message: { error: "Too many messages. Please wait before sending another." },
  skip: () => !isProduction,
});

app.use("/api/live-chat", liveChatRateLimit);

// ---------------------------------------------------------------------------
// Root, /api, and /healthz handlers (config-layer, not route-file handlers)
// ---------------------------------------------------------------------------
// Without these, Replit's preview pane and platform healthchecks both fail:
//
//  - GET /     → no handler → Express 404 → {"status":"error","message":"this route doesn't exist"}
//  - GET /api  → no handler → same 404 (all routes are under /api/*)
//  - GET /healthz → Railway/Render healthcheckPath convention; without this alias
//                  the platform healthcheck 404s and marks the service unhealthy
//
// Fix: redirect browser requests at / and /api to the canonical health endpoint,
// and expose /healthz directly (not just /api/healthz) for platform probes.
// The /healthz response is intentionally DB-independent so a DB blip never
// triggers a platform restart loop.
app.get("/healthz", (_req, res) => res.json({ status: "ok" }));
app.get("/", (_req, res) => res.redirect(302, "/api/healthz"));
app.get("/api", (_req, res) => res.redirect(302, "/api/healthz"));

app.use("/api", router);

export default app;
