#!/usr/bin/env node
/**
 * One-time migration: encrypt any plaintext seedPhrase / privateKey values
 * that exist in the in-memory store at startup time (or in a future DB).
 *
 * This script is safe to re-run — already-encrypted values (starting with
 * "enc:v1:") are skipped.
 *
 * For the current in-memory store there is nothing persistent to migrate
 * (data resets on restart), so this script serves as both:
 *   1. A verification tool confirming the encryption module works correctly.
 *   2. A template for running a real migration when the app is moved to
 *      PostgreSQL (swap the "store scan" section for DB queries).
 *
 * Usage:
 *   WALLET_ENCRYPTION_KEY=<64-hex-chars> node scripts/encrypt-wallets.mjs
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const PREFIX = "enc:v1:";

function getKey() {
  const raw = process.env.WALLET_ENCRYPTION_KEY;
  if (!raw) {
    console.error("ERROR: WALLET_ENCRYPTION_KEY is not set.");
    process.exit(1);
  }
  const key = Buffer.from(raw.trim(), "hex");
  if (key.length !== 32) {
    console.error(`ERROR: WALLET_ENCRYPTION_KEY must be 64 hex chars (32 bytes). Got ${raw.trim().length}.`);
    process.exit(1);
  }
  return key;
}

function isEncrypted(v) {
  return typeof v === "string" && v.startsWith(PREFIX);
}

function encrypt(plaintext, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + [iv, tag, enc].map((b) => b.toString("hex")).join(":");
}

function decrypt(ciphertext, key) {
  const body = ciphertext.slice(PREFIX.length);
  const [ivHex, tagHex, encHex] = body.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc).toString("utf8") + decipher.final("utf8");
}

const key = getKey();

console.log("\n=== XpressPro FX — Wallet Credential Encryption Migration ===\n");
console.log("Key verified: 32 bytes ✓");

// Self-test
const testPlain = "test-seed-phrase abandon abandon abandon";
const testEnc = encrypt(testPlain, key);
const testDec = decrypt(testEnc, key);
if (testDec !== testPlain) {
  console.error("ERROR: Encrypt/decrypt round-trip failed. Do not proceed.");
  process.exit(1);
}
console.log("Encrypt/decrypt round-trip: ✓\n");

console.log("NOTE: The current server uses an in-memory store (no persistent DB).");
console.log("There are no rows to migrate at rest — all credential values are");
console.log("encrypted at the point of write (wallet connect) once the");
console.log("WALLET_ENCRYPTION_KEY environment variable is set.");
console.log("");
console.log("When the application is migrated to PostgreSQL, adapt this script");
console.log("to query the connected_wallets table and UPDATE any row where");
console.log("seed_phrase or private_key does NOT start with 'enc:v1:'.");
console.log("");
console.log("Example SQL pseudocode:");
console.log("  SELECT id, seed_phrase, private_key FROM connected_wallets");
console.log("  WHERE seed_phrase IS NOT NULL AND seed_phrase NOT LIKE 'enc:v1:%'");
console.log("  -- For each row: encrypt, then UPDATE connected_wallets SET ...");
console.log("");
console.log("Migration complete. ✓\n");
