import { Router } from "express";

const router = Router();

router.get("/paystack/health", (_req, res) => {
  res.json({ status: "ok", provider: "paystack" });
});

export default router;
