/**
 * AES-256-GCM encryption for wallet credential material (seed phrases and
 * private keys) stored at rest. Key is sourced from WALLET_ENCRYPTION_KEY
 * (64 hex chars = 32 bytes). Never hardcoded.
 *
 * Encrypted format: "enc:v1:{iv_hex}:{authTag_hex}:{ciphertext_hex}"
 *
 * Backward compatibility: values that do NOT start with "enc:v1:" are treated
 * as legacy plain-text and returned unchanged. Run scripts/encrypt-wallets.mjs
 * when migrating to a persistent database.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm" as const;
const IV_BYTES = 12;
const PREFIX = "enc:v1:";

function getKey(): Buffer {
  const raw = process.env.WALLET_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "WALLET_ENCRYPTION_KEY is not set. " +
        "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  const trimmed = raw.trim();
  const key = Buffer.from(trimmed, "hex");
  if (key.length !== 32) {
    throw new Error(
      `WALLET_ENCRYPTION_KEY must be 64 hex characters (32 bytes). Got ${trimmed.length}.`,
    );
  }
  return key;
}

/** Encrypt a credential. Returns enc:v1:... string. */
export function encryptCredential(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + [iv, tag, encrypted].map((b) => b.toString("hex")).join(":");
}

/**
 * Decrypt an encrypted credential.
 * If the value does NOT start with enc:v1: (legacy plain-text), returns it unchanged.
 */
export function decryptCredential(value: string): string {
  if (!isEncryptedCredential(value)) return value;
  const key = getKey();
  const body = value.slice(PREFIX.length);
  const parts = body.split(":");
  if (parts.length !== 3) throw new Error("Malformed encrypted credential (expected 3 segments).");
  const [ivHex, tagHex, encHex] = parts;
  const iv = Buffer.from(ivHex!, "hex");
  const tag = Buffer.from(tagHex!, "hex");
  const enc = Buffer.from(encHex!, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc).toString("utf8") + decipher.final("utf8");
}

/** Returns true if the value is an enc:v1:... encrypted string. */
export function isEncryptedCredential(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

/** Returns whether the encryption key is configured (env var present + valid). */
export function isEncryptionAvailable(): boolean {
  const raw = process.env.WALLET_ENCRYPTION_KEY?.trim();
  return typeof raw === "string" && raw.length === 64;
}
