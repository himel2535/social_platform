const WINDOW_MS = 10 * 1000;
const MAX_MESSAGES = 10;

const buckets = new Map();

function pruneOldTimestamps(timestamps, now) {
  const cutoff = now - WINDOW_MS;
  return timestamps.filter((timestamp) => timestamp > cutoff);
}

function checkMessageRateLimit(userId) {
  const key = userId.toString();
  const now = Date.now();
  const existing = buckets.get(key) || [];
  const active = pruneOldTimestamps(existing, now);

  if (active.length >= MAX_MESSAGES) {
    buckets.set(key, active);
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - active[0]) };
  }

  active.push(now);
  buckets.set(key, active);

  return { allowed: true };
}

function resetMessageRateLimiter() {
  buckets.clear();
}

module.exports = {
  checkMessageRateLimit,
  resetMessageRateLimiter,
  WINDOW_MS,
  MAX_MESSAGES,
};
