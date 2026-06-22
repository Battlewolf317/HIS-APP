// =====================================================================
// config/security.js — pusat konfigurasi keamanan (P16 hardening)
//  - JWT secret divalidasi di satu tempat
//  - di production WAJIB ada JWT_SECRET kuat; di dev boleh fallback (dgn warning)
// =====================================================================

const isProd = process.env.NODE_ENV === "production";
const envSecret = process.env.JWT_SECRET;

if (isProd && (!envSecret || envSecret.length < 16)) {
  // fatal: jangan jalan di production tanpa secret kuat
  throw new Error(
    "JWT_SECRET wajib di-set (min 16 karakter) saat NODE_ENV=production. " +
      "Set di environment / .env sebelum start."
  );
}

if (!envSecret) {
  console.warn(
    "⚠️  JWT_SECRET belum di-set — pakai dev secret (TIDAK aman untuk production)."
  );
}

export const JWT_SECRET = envSecret || "dev_secret_change_me";
export const JWT_EXPIRES = process.env.JWT_EXPIRES || "8h";

// origin frontend yang diizinkan (CORS). Default: dev Vite ports.
export const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ||
  "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
