// =====================================================================
// audit.routes.js — baca audit log (admin only)
// =====================================================================

import { Router } from "express";
import pool from "../../config/db.js";
import { authorize } from "../../middleware/auth.js";

const router = Router();

// GET /api/audit?limit=100  — daftar aktivitas mutasi terbaru
router.get("/", authorize("admin"), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const r = await pool.query(
      `SELECT id, username, role, method, path, status, ip, created_at
         FROM audit_log ORDER BY id DESC LIMIT $1`,
      [limit]
    );
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Terjadi kesalahan server" });
  }
});

export default router;
