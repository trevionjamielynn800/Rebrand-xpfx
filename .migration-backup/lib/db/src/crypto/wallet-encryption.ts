/**
 * AES-256-GCM encryption for wallet credential material (seed phrases and
 * private keys) stored at rest. Key is sourced from the WALLET_ENCRYPTION_KEY
 * environment variable (64 hex chars = 32 bytes). Never hardcoded.
 *
 * Encrypted format: "enc:v1:{iv_hex}:{authTag_hex}:{ciphertext_hex}"
 *
 * Backward compatibility: if a value does NOT start with the enc:v1: prefix it
 * is treated as legacy plain-text and returned as-is. Run the one-time
 * migration script (scripts/encrypt-wallets.mjs) to encrypt all existing rows.
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
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  const trimmed = raw.trim();
  const key = Buffer.from(trimmed, "hex");
  if (key.length !== 32) {
    throw new Error(
      `WALLET_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). Got ${trimmed.length} characters.`,
    );
  }
  return key;
}

/**
 * Encrypt a credential string. Returns an enc:v1:... prefixed string.
 * Throws if WALLET_ENCRYPTION_KEY is missing or malformed.
 */
export function encryptCredential(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + [iv, tag, encrypted].map((b) => b.toString("hex")).join(":");
}

/**
 * Decrypt an encrypted credential. If the value is not prefixed with enc:v1:
 * (legacy plain-text), returns it unchanged — safe for pre-migration records.
 * Throws on authentication failure (tampered ciphertext).
 */
export function decryptCredential(ciphertext: string): string {
  if (!isEncryptedCredential(ciphertext)) {
    return ciphertext;
  }
  const key = getKey();
  const body = ciphertext.slice(PREFIX.length);
  const parts = body.split(":");
  if (parts.length !== 3) throw new Error("Malformed encrypted credential — expected 3 segments.");
  const iv = Buffer.from(parts[0]!, "hex");
  const tag = Buffer.from(parts[1]!, "hex");
  const encrypted = Buffer.from(parts[2]!, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted).toString("utf8") + decipher.final("utf8");
}

/**
 * Returns true if the value is an enc:v1:... encrypted string.
 * Use this to distinguish encrypted values from legacy plain-text ones.
 */
export function isEncryptedCredential(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}
