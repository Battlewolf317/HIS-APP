// =====================================================================
// middleware/auth.js — proteksi endpoint (JWT) + cek role (RBAC)
// =====================================================================

import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/security.js";

// authenticate: wajib ada token JWT valid di header Authorization: Bearer <token>
export function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Token tidak ada, silakan login" });

  try {
    req.user = jwt.verify(token, JWT_SECRET); // { id, username, nama, role }
    next();
  } catch {
    return res.status(401).json({ error: "Token tidak valid / kadaluarsa" });
  }
}

// authorize(...roles): batasi akses ke role tertentu (admin selalu boleh)
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Belum login" });
    if (req.user.role === "admin" || roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: "Akses ditolak untuk role Anda" });
  };
}
