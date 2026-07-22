import { Router, type IRouter } from "express";
import { getUserData, newId, NOW } from "../lib/store";
import { requireFullAuth } from "../lib/session";

const router: IRouter = Router();
const DISCLAIMER =
  "SmartVest is a simulated educational account, not a TFSA, FHSA, investment product, or registered account.";
const allocations = {
  conservative: { cash: 45, bonds: 40, equities: 15 },
  balanced: { cash: 20, bonds: 35, equities: 45 },
  growth: { cash: 10, bonds: 20, equities: 70 },
} as const;

function present(data: ReturnType<typeof getUserData>) {
  const account = data.smartVest;
  const simulatedBalance = data.wallets.reduce((total, wallet) => total + wallet.balance, 0);
  if (!account) return { account: null, simulatedBalance, disclaimer: DISCLAIMER };
  return {
    account: {
      ...account,
      simulatedBalance,
      portfolioValue: simulatedBalance,
      returnPercent: 0,
    },
    disclaimer: DISCLAIMER,
  };
}

router.get("/smartvest", requireFullAuth, (req, res) => {
  res.json(present(getUserData(req.userId!)));
});

router.post("/smartvest", requireFullAuth, (req, res) => {
  const plan = req.body?.plan;
  if (!(plan in allocations)) {
    return res.status(400).json({ error: "Choose conservative, balanced, or growth." });
  }
  const data = getUserData(req.userId!);
  const now = NOW();
  data.smartVest = {
    id: newId("sv"),
    plan,
    allocation: allocations[plan as keyof typeof allocations],
    disclaimerAcknowledged: req.body?.disclaimerAcknowledged === true,
    createdAt: now,
    updatedAt: now,
  };
  return res.status(201).json(present(data));
});

export default router;