/**
 * Login PIN routes — set up, verify, and remove a short numeric PIN
 * as a secondary security layer (separate from the main password).
 *
 * These are NEW additive routes; no existing auth logic is modified.
 */
import { Router } from "express";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { requireAuth } from "../lib/session";
import { users, logActivity } from "../lib/store";

const router = Router();

const PIN_SCRYPT_N = 16384;
const PIN_SCRYPT_R = 8;
const PIN_SCRYPT_P = 1;
const PIN_KEY_LEN = 32;

function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, PIN_KEY_LEN, {
    N: PIN_SCRYPT_N,
    r: PIN_SCRYPT_R,
    p: PIN_SCRYPT_P,
  }).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPin(pin: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const derived = scryptSync(pin, salt, PIN_KEY_LEN, {
      N: PIN_SCRYPT_N,
      r: PIN_SCRYPT_R,
      p: PIN_SCRYPT_P,
    });
    return timingSafeEqual(derived, Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

function verifyPassword(supplied: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const derived = scryptSync(supplied, salt, 64);
    return timingSafeEqual(derived, Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

type StoredUserWithPin = ReturnType<typeof users.get> & { pinHash?: string };

/**
 * GET /auth/pin/status
 * Returns whether a PIN has been configured for the current user.
 */
router.get("/auth/pin/status", requireAuth, (req, res) => {
  const stored = users.get(req.userId!) as StoredUserWithPin;
  if (!stored) return res.status(404).json({ error: "User not found." });
  return res.json({ pinEnabled: Boolean(stored?.pinHash) });
});

/**
 * POST /auth/pin/setup
 * Set or update the PIN. Requires the user's current password for confirmation.
 */
router.post("/auth/pin/setup", requireAuth, (req, res) => {
  const { pin, currentPassword } = req.body as { pin?: unknown; currentPassword?: unknown };

  if (typeof pin !== "string" || !/^\d{4,8}$/.test(pin)) {
    return res.status(400).json({ error: "PIN must be 4–8 numeric digits." });
  }
  if (typeof currentPassword !== "string" || !currentPassword) {
    return res.status(400).json({
      error: "Your current password is required to set up a PIN.",
    });
  }

  const stored = users.get(req.userId!) as StoredUserWithPin;
  if (!stored) return res.status(404).json({ error: "User not found." });
  if (stored.role === "demo") {
    return res.status(403).json({ error: "Demo accounts cannot set up a PIN." });
  }

  if (!verifyPassword(currentPassword, stored.passwordHash)) {
    return res.status(401).json({ error: "Password is incorrect." });
  }

  stored.pinHash = hashPin(pin);

  logActivity({
    actorId: req.userId!,
    actorName: stored.user.fullName,
    action: "auth.pin_setup",
    detail: "Login PIN configured.",
  });

  return res.json({ ok: true, message: "PIN set up successfully." });
});

/**
 * POST /auth/pin/verify
 * Verify the PIN. Used to gate sensitive actions inside the app.
 */
router.post("/auth/pin/verify", requireAuth, (req, res) => {
  const { pin } = req.body as { pin?: unknown };
  if (typeof pin !== "string" || !pin) {
    return res.status(400).json({ error: "PIN is required." });
  }

  const stored = users.get(req.userId!) as StoredUserWithPin;
  if (!stored) return res.status(404).json({ error: "User not found." });

  if (!stored.pinHash) {
    return res.status(400).json({ error: "No PIN has been set up for this account." });
  }

  if (!verifyPin(pin, stored.pinHash)) {
    return res.status(401).json({ error: "Incorrect PIN." });
  }

  return res.json({ ok: true });
});

/**
 * DELETE /auth/pin
 * Remove the PIN. Requires the user's current password.
 */
router.delete("/auth/pin", requireAuth, (req, res) => {
  const { currentPassword } = req.body as { currentPassword?: unknown };
  if (typeof currentPassword !== "string" || !currentPassword) {
    return res.status(400).json({
      error: "Your current password is required to remove the PIN.",
    });
  }

  const stored = users.get(req.userId!) as StoredUserWithPin;
  if (!stored) return res.status(404).json({ error: "User not found." });

  if (!verifyPassword(currentPassword, stored.passwordHash)) {
    return res.status(401).json({ error: "Password is incorrect." });
  }

  if (!stored.pinHash) {
    return res.status(400).json({ error: "No PIN is currently set." });
  }

  delete stored.pinHash;

  logActivity({
    actorId: req.userId!,
    actorName: stored.user.fullName,
    action: "auth.pin_removed",
    detail: "Login PIN removed.",
  });

  return res.json({ ok: true, message: "PIN removed successfully." });
});

export default router;
