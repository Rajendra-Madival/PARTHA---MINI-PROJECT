import type { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  bucket: string;
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyByUser?: (req: Request) => string | undefined;
}

const windows = new Map<string, number[]>();

// Periodically prune stale buckets to keep memory bounded
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of windows.entries()) {
    const active = timestamps.filter((t) => now - t < 15 * 60_000);
    if (active.length === 0) {
      windows.delete(key);
    } else {
      windows.set(key, active);
    }
  }
}, 5 * 60_000).unref();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function createRateLimiter(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const userKey = options.keyByUser?.(req);
    const identity = userKey ? `user:${userKey}` : `ip:${getClientIp(req)}`;
    const bucketKey = `${options.bucket}:${identity}`;

    const recent = (windows.get(bucketKey) ?? []).filter(
      (ts) => now - ts < options.windowMs,
    );

    if (recent.length >= options.maxRequests) {
      const oldest = recent[0] ?? now;
      const retryAfterSec = Math.max(
        1,
        Math.ceil((options.windowMs - (now - oldest)) / 1000),
      );
      res.setHeader('Retry-After', String(retryAfterSec));
      res.setHeader('X-RateLimit-Limit', String(options.maxRequests));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.status(429).json({
        error:
          options.message ??
          `Too many requests. Please wait ${retryAfterSec} seconds and try again.`,
      });
      return;
    }

    recent.push(now);
    windows.set(bucketKey, recent);

    res.setHeader('X-RateLimit-Limit', String(options.maxRequests));
    res.setHeader(
      'X-RateLimit-Remaining',
      String(Math.max(0, options.maxRequests - recent.length)),
    );
    next();
  };
}
