#!/usr/bin/env node
/**
 * Pre-deploy validation script — XpressPro FX
 *
 * Runs BEFORE any build or deploy command on every platform and fails loudly
 * with a clear error message if any critical condition is wrong.
 *
 * Usage:
 *   node scripts/predeploy.mjs                  # full check (includes env var check)
 *   node scripts/predeploy.mjs --skip-env-check # skip env check (use during build phase
 *                                               # when env vars are set at runtime, not build)
 *
 * Checks performed:
 *   1. Required env vars present (unless --skip-env-check)
 *   2. Every package.json in the repo is valid JSON (no smart quotes, no trailing commas)
 *   3. No conflicting platform build configs at repo root
 *   4. /healthz liveness probe does NOT depend on DB (confirmed by code inspection)
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const skipEnvCheck = process.argv.includes("--skip-env-check");

let exitCode = 0;
const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
  exitCode = 1;
}

function warn(msg) {
  warnings.push(msg);
}

// ---------------------------------------------------------------------------
// 1. Required env var check
// ---------------------------------------------------------------------------
if (!skipEnvCheck) {
  console.log("[predeploy] Checking required environment variables...");

  const isProduction =
    (process.env.NODE_ENV ?? "development") === "production";

  // Always required
  const alwaysRequired = ["PORT"];
  for (const key of alwaysRequired) {
    const val = (process.env[key] ?? "").trim();
    if (!val) {
      fail(
        `Missing required env var: ${key}\n` +
          `  Set ${key} in your platform's environment settings before deploying.`
      );
    }
  }

  // Required in production
  if (isProduction) {
    const prodRequired = ["SESSION_SECRET", "JWT_SECRET", "WALLET_ENCRYPTION_KEY", "DATABASE_URL", "ADMIN_EMAIL", "ADMIN_PASSWORD"];
    for (const key of prodRequired) {
      const val = (process.env[key] ?? "").trim();
      if (!val) {
        fail(
          `Missing required env var for production: ${key}\n` +
            `  Set ${key} as a secret in your platform's environment settings.`
        );
      }
    }

    if (!process.env.ALLOWED_ORIGINS?.trim() && !process.env.REPLIT_DOMAINS?.trim()) {
      fail(
        `Missing required production CORS configuration: ALLOWED_ORIGINS or REPLIT_DOMAINS must be configured.\n` +
          `  Set ALLOWED_ORIGINS=https://your-frontend.com or REPLIT_DOMAINS=<hostnames> in your platform env vars.`
      );
    }

    // Security check: MoonPay API key without secret key is a critical misconfiguration
    const moonpayKey = (process.env.MOONPAY_API_KEY ?? "").trim();
    const moonpaySecret = (process.env.MOONPAY_SECRET_KEY ?? "").trim();
    if (moonpayKey && !moonpaySecret) {
      fail(
        `Security misconfiguration: MOONPAY_API_KEY is set but MOONPAY_SECRET_KEY is missing.\n` +
          `  Unsigned live MoonPay checkout URLs are a critical vulnerability. Set MOONPAY_SECRET_KEY.`
      );
    }

    // Warn if ALLOWED_ORIGINS is not set (CORS will deny all credentialed cross-origin requests)
    const allowedOrigins = (
      process.env.ALLOWED_ORIGINS ??
      process.env.REPLIT_DOMAINS ??
      ""
    ).trim();
    if (!allowedOrigins) {
      warn(
        `ALLOWED_ORIGINS is not set in production.\n` +
          `  All credentialed cross-origin requests (from frontend to API) will be denied.\n` +
          `  Set ALLOWED_ORIGINS=https://your-frontend.com in your platform env vars.`
      );
    }
  }
} else {
  console.log(
    "[predeploy] Skipping env var check (--skip-env-check). Env vars are validated at runtime."
  );
}

// ---------------------------------------------------------------------------
// 2. Validate every package.json in the repo
// ---------------------------------------------------------------------------
console.log("[predeploy] Validating package.json files...");

function findPackageJsons(dir, results = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".git" || entry === "dist") continue;
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      findPackageJsons(full, results);
    } else if (entry === "package.json") {
      results.push(full);
    }
  }
  return results;
}

const packageJsonFiles = findPackageJsons(ROOT);
for (const pkgPath of packageJsonFiles) {
  let raw;
  try {
    raw = readFileSync(pkgPath, "utf8");
  } catch (e) {
    fail(`Could not read ${pkgPath}: ${e.message}`);
    continue;
  }

  // Check for smart/curly quotes — a common cause of "unexpected token" JSON errors
  const smartQuotePattern = /[\u2018\u2019\u201c\u201d]/;
  if (smartQuotePattern.test(raw)) {
    fail(
      `Smart/curly quote characters found in ${pkgPath}.\n` +
        `  Replace them with straight ASCII quotes (\` ' \` and \` " \`).`
    );
  }

  try {
    JSON.parse(raw);
  } catch (e) {
    fail(`Invalid JSON in ${pkgPath}: ${e.message}`);
  }
}
console.log(`[predeploy] Checked ${packageJsonFiles.length} package.json files.`);

// ---------------------------------------------------------------------------
// 3. Check for conflicting platform build configs
// ---------------------------------------------------------------------------
console.log("[predeploy] Checking for conflicting platform build configs...");

const conflictingConfigs = [
  "nixpacks.toml",
  "fly.toml",
  "Procfile.backup",
];
const knownConfigs = [
  "railway.json",
  "railpack.toml",
  "render.yaml",
  "vercel.json",
  "Procfile",
  "Dockerfile",
];

let rootEntries;
try {
  rootEntries = readdirSync(ROOT);
} catch {
  rootEntries = [];
}

const foundConflicts = conflictingConfigs.filter((f) => rootEntries.includes(f));
if (foundConflicts.length > 0) {
  fail(
    `Conflicting/stale build config files found at repo root:\n` +
      foundConflicts.map((f) => `  - ${f}`).join("\n") +
      `\n  Remove these files to prevent platforms from picking up the wrong build config.`
  );
}

const foundKnown = knownConfigs.filter((f) => rootEntries.includes(f));
if (foundKnown.length > 0) {
  console.log(
    `[predeploy] Platform configs present: ${foundKnown.join(", ")}`
  );
}

// ---------------------------------------------------------------------------
// 4. DB healthcheck safety check (static assertion)
// ---------------------------------------------------------------------------
console.log("[predeploy] Checking healthcheck DB-independence...");
let healthRouteContent;
// In the deployed monorepo: ROOT/artifacts/api-server/src/routes/health.ts
// ROOT is the repo root (parent of scripts/).
try {
  healthRouteContent = readFileSync(
    join(ROOT, "artifacts/api-server/src/routes/health.ts"),
    "utf8"
  );
} catch {
  warn(
    "Could not find artifacts/api-server/src/routes/health.ts to verify DB-independence of /healthz.\n" +
      "  Manually confirm that GET /healthz does NOT call getDb() or query the database."
  );
  healthRouteContent = null;
}

if (healthRouteContent) {
  // Extract only the /healthz handler block (not /healthz/db which does use getDb()).
  // We look for getDb() between the /healthz handler and the next router.get call.
  const healthzEndIndex = healthRouteContent.indexOf('router.get("/healthz/db"');
  const healthzSection = healthzEndIndex > -1
    ? healthRouteContent.slice(0, healthzEndIndex)
    : healthRouteContent;

  // The liveness /healthz route must NOT contain getDb() — only /healthz/db should.
  if (healthzSection.includes("getDb()")) {
    fail(
      `The /healthz liveness probe calls getDb() — this means a DB outage will mark\n` +
        `  a healthy process as dead and trigger restart loops.\n` +
        `  Remove the DB dependency from /healthz. Use /healthz/db for the deep probe.`
    );
  } else {
    console.log(
      "[predeploy] /healthz confirmed DB-independent (safe for platform liveness probes)."
    );
  }
}

// ---------------------------------------------------------------------------
// Output results
// ---------------------------------------------------------------------------
console.log("");

if (warnings.length > 0) {
  console.warn("[predeploy] WARNINGS:");
  for (const w of warnings) {
    console.warn(`  ⚠  ${w}`);
  }
  console.warn("");
}

if (errors.length > 0) {
  console.error("[predeploy] FAILED — the following issues must be fixed before deploying:");
  for (const e of errors) {
    console.error(`  ✗  ${e}`);
  }
  console.error("");
  process.exit(1);
} else {
  console.log("[predeploy] All checks passed. Safe to deploy.");
}
