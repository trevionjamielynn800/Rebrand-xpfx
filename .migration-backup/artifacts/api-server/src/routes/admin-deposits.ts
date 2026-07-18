/**
 * Admin deposit management routes.
 *
 * GET   /admin/deposits                        — list all deposits across all users
 * PATCH /admin/deposits/:depositId/approve     — approve a pending deposit (credits wallet)
 * PATCH /admin/deposits/:depositId/reject      — reject a pending deposit
 */
import { Router, type IRouter } from "express";
import {
  getUserData,
  logActivity,
  newId,
  NOW,
  userData,
  users,
} from "../lib/store";
import { requireAdmin } from "../lib/session";
import { notifyUser } from "../lib/notify";

const router: IRouter = Router();

// GET /admin/deposits — all deposits from all users, newest first
router.get("/admin/deposits", requireAdmin, (_req, res) => {
  const rows: unknown[] = [];
  for (const [userId, data] of userData) {
    const stored = users.get(userId);
    if (!stored) continue;
    for (const dep of data.deposits) {
      rows.push({
        ...dep,
        userId,
        userEmail: stored.user.email,
        userFullName: stored.user.fullName,
      });
    }
  }
  (rows as any[]).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  return res.json(rows);
});

// PATCH /admin/deposits/:depositId/approve
router.patch(
  "/admin/deposits/:depositId/approve",
  requireAdmin,
  (req, res) => {
    const { depositId } = req.params;
    if (!depositId || typeof depositId !== "string") {
      return res.status(400).json({ error: "Invalid depositId" });
    }

    // Find which user owns this deposit
    let ownerUserId: string | null = null;
    for (const [userId, data] of userData) {
      if (data.deposits.some((d) => d.id === depositId)) {
        ownerUserId = userId;
        break;
      }
    }
    if (!ownerUserId)
      return res.status(404).json({ error: "Deposit not found" });

    const data = getUserData(ownerUserId);
    const dep = data.deposits.find((d) => d.id === depositId)!;

    if (dep.status !== "pending") {
      return res.status(409).json({ error: `Deposit is already ${dep.status}` });
    }

    dep.status = "completed";

    // Credit the user's main wallet
    const mainWallet = data.wallets.find((w) => w.type === "main");
    if (mainWallet) {
      mainWallet.balance += dep.amount;
      data.transactions.push({
        id: newId("tx"),
        walletId: mainWallet.id,
        type: "deposit",
        amount: dep.amount,
        currency: dep.currency,
        status: "completed",
        description: `Deposit approved: ${dep.reference ?? dep.method}`,
        createdAt: NOW(),
      });
    }

    logActivity({
      actorId: req.userId!,
      actorName: req.storedUser?.user.fullName ?? "Admin",
      action: "deposit_approved",
      detail: `Approved deposit ${dep.id} (${dep.amount} ${dep.currency}) for user ${ownerUserId}`,
    });

    notifyUser({
      userId: ownerUserId,
      kind: "deposit_confirmed",
      title: "Deposit approved",
      body: `Your ${dep.currency} deposit of ${dep.amount} has been approved and credited to your wallet.`,
    });

    return res.json({ success: true, deposit: dep });
  },
);

// PATCH /admin/deposits/:depositId/reject
router.patch(
  "/admin/deposits/:depositId/reject",
  requireAdmin,
  (req, res) => {
    const { depositId } = req.params;
    if (!depositId || typeof depositId !== "string") {
      return res.status(400).json({ error: "Invalid depositId" });
    }

    const reason =
      req.body?.reason != null && typeof req.body.reason === "string"
        ? req.body.reason.trim().slice(0, 500)
        : undefined;

    let ownerUserId: string | null = null;
    for (const [userId, data] of userData) {
      if (data.deposits.some((d) => d.id === depositId)) {
        ownerUserId = userId;
        break;
      }
    }
    if (!ownerUserId)
      return res.status(404).json({ error: "Deposit not found" });

    const data = getUserData(ownerUserId);
    const dep = data.deposits.find((d) => d.id === depositId)!;

    if (dep.status !== "pending") {
      return res.status(409).json({ error: `Deposit is already ${dep.status}` });
    }

    dep.status = "failed";

    logActivity({
      actorId: req.userId!,
      actorName: req.storedUser?.user.fullName ?? "Admin",
      action: "deposit_rejected",
      detail: `Rejected deposit ${dep.id} for user ${ownerUserId}: ${reason ?? "no reason given"}`,
    });

    notifyUser({
      userId: ownerUserId,
      kind: "deposit_incoming",
      title: "Deposit rejected",
      body: reason
        ? `Your deposit was rejected: ${reason}`
        : "Your deposit could not be processed. Please contact support.",
    });

    return res.json({ success: true, deposit: dep });
  },
);

export default router;
