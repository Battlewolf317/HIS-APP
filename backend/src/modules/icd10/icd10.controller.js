// =====================================================================
// icd10.controller.js — CONTROLLER master ICD-10
// =====================================================================

import * as service from "./icd10.service.js";

// GET /api/icd10?q=...  (q opsional buat search)
export async function getAll(req, res) {
  try {
    res.json(await service.list(req.query.q));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Terjadi kesalahan server" });
  }
}
