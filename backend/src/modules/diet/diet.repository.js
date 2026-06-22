// =====================================================================
// diet.repository.js — AKSES DATABASE diet pasien / nutrition
// =====================================================================

import pool from "../../config/db.js";

const COLS = ["jenis_diet", "bentuk", "kalori", "jadwal", "pantangan", "catatan", "status", "petugas"];

// daftar order diet (+ data pasien & kunjungan)
export function findAll() {
  return pool
    .query(
      `SELECT d.*, e.encounter_no, e.tipe, p.nama AS pasien_nama, p.mrn
         FROM diet_order d
         JOIN encounter e ON e.id = d.encounter_id
         JOIN patient p   ON p.id = e.patient_id
        ORDER BY (d.status <> 'AKTIF'), d.created_at DESC`
    )
    .then((r) => r.rows);
}

export function findById(id) {
  return pool.query("SELECT * FROM diet_order WHERE id = $1", [id]).then((r) => r.rows[0]);
}

export function insert(encounterId, d) {
  return pool
    .query(
      `INSERT INTO diet_order (encounter_id, ${COLS.join(", ")})
       VALUES ($1, ${COLS.map((_, i) => `$${i + 2}`).join(", ")}) RETURNING *`,
      [encounterId, ...COLS.map((c) => d[c] ?? null)]
    )
    .then((r) => r.rows[0]);
}

export function update(id, d) {
  const sets = COLS.map((c, i) => `${c} = $${i + 2}`).join(", ");
  return pool
    .query(`UPDATE diet_order SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`, [id, ...COLS.map((c) => d[c] ?? null)])
    .then((r) => r.rows[0]);
}

export function setStatus(id, status) {
  return pool
    .query(`UPDATE diet_order SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`, [id, status])
    .then((r) => r.rows[0]);
}
