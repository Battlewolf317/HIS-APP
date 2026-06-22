// =====================================================================
// middleware/audit.js — catat aktivitas MUTASI ke tabel audit_log.
//  Hanya method non-GET (POST/PUT/PATCH/DELETE) yang dicatat.
//  Pencatatan async & best-effort: gagal log tidak menggagalkan request.
// =====================================================================

import pool from "../config/db.js";

const MUTASI = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function auditLog(req, res, next) {
  if (!MUTASI.has(req.method)) return next();

  // catat setelah response selesai (tahu status code-nya)
  res.on("finish", () => {
    const u = req.user || {};
    const ip = req.ip || req.socket?.remoteAddress || null;
    // jangan simpan body (bisa berisi password/PII) — cukup metadata
    pool
      .query(
        `INSERT INTO audit_log (user_id, username, role, method, path, status, ip)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [u.id || null, u.username || null, u.role || null, req.method, req.originalUrl?.slice(0, 200), res.statusCode, ip]
      )
      .catch((e) => console.error("audit_log gagal:", e.message));
  });

  next();
}
