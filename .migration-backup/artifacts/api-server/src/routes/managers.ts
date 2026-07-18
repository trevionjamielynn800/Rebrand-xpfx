/**
 * /managers routes — list managers, get/select assigned manager.
 */
import { Router, type IRouter } from "express";
import { SelectManagerBody } from "@workspace/api-zod";
import { logActivity, managers } from "../lib/store";
import { requireAuth } from "../lib/session";

const router: IRouter = Router();

router.get("/managers", requireAuth, (_req, res) => {
  res.json(managers);
});

router.get("/managers/selected", requireAuth, (req, res) => {
  const u = req.storedUser!.user;
  if (!u.selectedManagerId) {
    return res.json({ manager: null });
  }
  const manager = managers.find((m) => m.id === u.selectedManagerId) ?? null;
  return res.json({ manager });
});

router.post("/managers/selected", requireAuth, (req, res) => {
  const parsed = SelectManagerBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: "Invalid request" });
  }
  const manager = managers.find((m) => m.id === parsed.data.managerId);
  if (!manager) {
    return res.status(404).json({ success: false, message: "Manager not found" });
  }
  if (!manager.available) {
    return res.json({
      success: false,
      message: `${manager.name} is not currently accepting new clients.`,
    });
  }
  req.storedUser!.user.selectedManagerId = manager.id;
  logActivity({
    actorId: req.userId!,
    actorName: req.storedUser!.user.fullName,
    action: "manager.select",
    detail: `Selected ${manager.name} as account manager`,
  });
  return res.json({
    success: true,
    message: `${manager.name} is now your account manager.`,
  });
});

export default router;
