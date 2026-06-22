// =====================================================================
// middleware/security.js — header keamanan + rate limiter (tanpa dependency)
//  Pengganti ringan helmet + express-rate-limit untuk hardening dasar.
// =====================================================================

// Set header keamanan umum (mirip helmet versi ringkas)
export function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");                 // anti clickjacking
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.removeHeader("X-Powered-By");                          // jangan bocorin Express
  next();
}

// Rate limiter sederhana berbasis memori (per IP, sliding window).
//  windowMs : rentang waktu (ms)
//  max      : maksimal request dalam window
//  message  : pesan saat limit terlampaui
export function makeRateLimiter({ windowMs = 60_000, max = 60, message = "Terlalu banyak permintaan, coba lagi nanti" } = {}) {
  const hits = new Map(); // ip -> [timestamp, ...]

  // bersihkan entri lama tiap windowMs biar memori ga numpuk
  setInterval(() => {
    const now = Date.now();
    for (const [ip, arr] of hits) {
      const fresh = arr.filter((t) => now - t < windowMs);
      if (fresh.length) hits.set(ip, fresh);
      else hits.delete(ip);
    }
  }, windowMs).unref?.();

  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    arr.push(now);
    hits.set(ip, arr);

    if (arr.length > max) {
      const retry = Math.ceil(windowMs / 1000);
      res.setHeader("Retry-After", String(retry));
      return res.status(429).json({ error: message });
    }
    next();
  };
}
