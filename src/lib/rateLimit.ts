const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;

const requestLog = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = requestLog.get(key);

  if (!entry || now > entry.resetAt) {
    requestLog.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count += 1;
  return true;
}
