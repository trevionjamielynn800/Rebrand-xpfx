/**
 * Billing engine
 * --------------
 * Computes monthly mandatory fees for each user:
 *
 *   - Maintenance fee (flat monthly)
 *   - AI assistance bot subscription (flat monthly)
 *   - Active ongoing trade fee (per active trade opened during the cycle)
 *
 * Rates can be overridden per user from the admin console; otherwise
 * `defaultBillingRates` apply. A "cycle" is a calendar month, identified
 * by `YYYY-MM`. When a request comes in for a new month, the previous
 * open cycle is moved to history (with its current paid/unpaid state)
 * and a new cycle is opened.
 */
import type { BillingCharge, BillingCycle, BillingRates } from "@workspace/api-zod";
import { defaultBillingRates, type UserData } from "./store";

const NOW = () => new Date();

/** Returns the rates that apply to a user (override or defaults). */
export function getEffectiveRates(data: UserData): {
  rates: BillingRates;
  usingDefaults: boolean;
} {
  if (data.billingRatesOverride) {
    return { rates: data.billingRatesOverride, usingDefaults: false };
  }
  return { rates: { ...defaultBillingRates }, usingDefaults: true };
}

/** YYYY-MM identifier for the calendar month containing `d`. */
function cycleIdFor(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** First instant of the month containing `d` (UTC). */
function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/** First instant of the month after `d` (UTC). */
function startOfNextMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

/** Counts active trades that are billable for the cycle. */
function activeTradeCount(data: UserData): number {
  return data.trades.filter((t) => t.status === "active").length;
}

function buildCycle(data: UserData, when: Date): BillingCycle {
  const start = startOfMonth(when);
  const end = startOfNextMonth(when);
  const { rates } = getEffectiveRates(data);
  const tradeCount = activeTradeCount(data);

  const charges: BillingCharge[] = [
    {
      key: "maintenance",
      label: "Monthly maintenance fee",
      amount: rates.maintenance,
      paid: false,
      paidAt: null,
    },
    {
      key: "aiBot",
      label: "AI assistance bot subscription",
      amount: rates.aiBot,
      paid: false,
      paidAt: null,
    },
    {
      key: "activeTrade",
      label: `Active ongoing trade fee${tradeCount > 1 ? ` (×${tradeCount})` : ""}`,
      amount: rates.activeTrade * Math.max(tradeCount, 1),
      paid: false,
      paidAt: null,
    },
  ];

  const totalDue = charges.reduce((s, c) => s + c.amount, 0);
  return {
    cycleId: cycleIdFor(when),
    cycleStart: start.toISOString(),
    cycleEnd: end.toISOString(),
    dueAt: end.toISOString(),
    currency: rates.currency,
    charges,
    totalDue,
    totalPaid: 0,
    fullySettled: false,
  };
}

/**
 * Ensures `data.currentBillingCycle` is set and aligned with the current
 * calendar month. If the previous cycle has ended, it is pushed to
 * history (preserving its paid status) and a fresh one is opened.
 */
export function ensureCurrentCycle(data: UserData): BillingCycle {
  const now = NOW();
  const expectedId = cycleIdFor(now);

  if (!data.currentBillingCycle) {
    data.currentBillingCycle = buildCycle(data, now);
    return data.currentBillingCycle;
  }

  if (data.currentBillingCycle.cycleId !== expectedId) {
    // Roll over: close out the previous cycle and put it on history.
    data.billingHistory.unshift(data.currentBillingCycle);
    if (data.billingHistory.length > 24) data.billingHistory.length = 24;
    data.currentBillingCycle = buildCycle(data, now);
  } else {
    // Same cycle but trade count or rates may have changed — update the
    // unpaid charge amounts in place so the UI reflects what's owed now.
    const rebuilt = buildCycle(data, now);
    for (const fresh of rebuilt.charges) {
      const existing = data.currentBillingCycle.charges.find(
        (c) => c.key === fresh.key,
      );
      if (existing && !existing.paid) {
        existing.amount = fresh.amount;
        existing.label = fresh.label;
      }
    }
    recomputeTotals(data.currentBillingCycle);
  }
  return data.currentBillingCycle;
}

/** Recomputes the cached totals on a cycle. Mutates in place. */
export function recomputeTotals(cycle: BillingCycle): void {
  cycle.totalDue = cycle.charges.reduce((s, c) => s + c.amount, 0);
  cycle.totalPaid = cycle.charges.reduce((s, c) => s + (c.paid ? c.amount : 0), 0);
  cycle.fullySettled = cycle.charges.every((c) => c.paid);
}

/** Returns true if the cycle is past its due date with unpaid charges. */
export function isOverdue(cycle: BillingCycle): boolean {
  if (cycle.fullySettled) return false;
  return new Date(cycle.dueAt).getTime() < Date.now();
}
