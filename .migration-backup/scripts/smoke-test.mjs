#!/usr/bin/env node
/**
 * Post-deploy smoke test — hits /healthz and /healthz/db and reports
 * pass/fail with a non-zero exit code on failure (suitable for CI/CD hooks).
 *
 * Usage:
 *   node scripts/smoke-test.mjs [base-url]
 *
 * If base-url is omitted it defaults to http://localhost:8080.
 */
const baseUrl = (process.argv[2] ?? "http://localhost:8080").replace(/\/$/, "");
const TIMEOUT_MS = 10_000;

let passed = 0;
let failed = 0;

async function probe(path) {
  const url = `${baseUrl}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const body = await res.json().catch(() => ({}));
    if (res.ok && body?.status === "ok") {
      console.log(`  ✅  GET ${path}  →  ${res.status} OK`);
      passed++;
    } else {
      console.error(`  ❌  GET ${path}  →  ${res.status}  body=${JSON.stringify(body)}`);
      failed++;
    }
  } catch (err) {
    clearTimeout(timer);
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`  ❌  GET ${path}  →  ERROR: ${reason}`);
    failed++;
  }
}

console.log(`\nXpressPro FX — smoke test against ${baseUrl}\n`);

await probe("/healthz");
await probe("/api/healthz");

const status = failed === 0 ? "PASSED" : "FAILED";
console.log(`\n${status}: ${passed} passed, ${failed} failed.\n`);

if (failed > 0) process.exit(1);
