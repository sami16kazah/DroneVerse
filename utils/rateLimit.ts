type RateLimitStore = Map<string, { count: number; startTime: number }>;

const rateLimitStore: RateLimitStore = new Map();

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export function rateLimit(ip: string, config: RateLimitConfig = { windowMs: 60 * 1000, max: 100 }) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record) {
    rateLimitStore.set(ip, { count: 1, startTime: now });
    return { success: true };
  }

  if (now - record.startTime > config.windowMs) {
    // Reset window
    rateLimitStore.set(ip, { count: 1, startTime: now });
    return { success: true };
  }

  if (record.count >= config.max) {
    return { success: false };
  }

  record.count++;
  return { success: true };
}
