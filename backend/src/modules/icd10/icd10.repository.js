// =====================================================================
// icd10.repository.js — AKSES DATABASE master ICD-10 (read-only utk MVP)
// =====================================================================

import pool from "../../config/db.js";

// Semua diagnosa (urut kode)
export function findAll() {
  return pool.query("SELECT * FROM icd10 ORDER BY code").then((r) => r.rows);
}

// Cari by kode atau nama (buat autocomplete di EMR)
export function search(q) {
  const like = `%${q}%`;
  return pool
    .query(
      `SELECT * FROM icd10
        WHERE code ILIKE $1 OR name ILIKE $1
        ORDER BY code
        LIMIT 20`,
      [like]
    )
    .then((r) => r.rows);
}

// Ambil 1 by kode (buat validasi diagnosa valid)
export function findByCode(code) {
  return pool
    .query("SELECT * FROM icd10 WHERE code = $1", [code])
    .then((r) => r.rows[0]);
}
