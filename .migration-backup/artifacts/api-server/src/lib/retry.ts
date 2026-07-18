/**
 * Generic retry-with-backoff for transient failures (DB hiccups, flaky
 * upstream HTTP calls). This is NOT a magic bug-fixer — it only helps when
 * the underlying operation is safe to retry and the failure is transient
 * (network blip, momentary connection drop). Logic errors will still fail
 * every time, as they should.
 *
 * Usage:
 *   const result = await withRetry(() => dbGet(...), { label: "load-user" });
 */
import { logger } from "./logger";

interface RetryOptions {
  label: string;
  attempts?: number; // total attempts including the first try
  baseDelayMs?: number; // delay before the first retry
  maxDelayMs?: number; // cap on backoff delay
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  { label, attempts = 3, baseDelayMs = 250, maxDelayMs = 4000 }: RetryOptions,
): Promise<T> {
  let lastErr: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isLastAttempt = attempt === attempts;
      logger.warn(
        { label, attempt, attempts, err: (err as Error)?.message },
        isLastAttempt
          ? "[retry] final attempt failed, giving up"
          : "[retry] attempt failed, retrying",
      );
      if (isLastAttempt) break;

      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastErr;
}
