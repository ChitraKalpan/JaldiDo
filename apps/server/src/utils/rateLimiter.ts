export class RateLimiter {
  private entries = new Map<string, { count: number; firstRequestAt: number }>();

  constructor(private readonly limit = 5, private readonly windowMs = 60_000) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const existing = this.entries.get(key);

    if (!existing) {
      this.entries.set(key, { count: 1, firstRequestAt: now });
      return true;
    }

    if (now - existing.firstRequestAt > this.windowMs) {
      this.entries.set(key, { count: 1, firstRequestAt: now });
      return true;
    }

    if (existing.count >= this.limit) {
      return false;
    }

    this.entries.set(key, { ...existing, count: existing.count + 1 });
    return true;
  }
}
