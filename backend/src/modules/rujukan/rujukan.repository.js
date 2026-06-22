// =====================================================================
// rujukan.repository.js — AKSES DATABASE rujukan (SISRUTE)
// =====================================================================

import pool from "../../config/db.js";

const COLS = ["arah", "faskes_tujuan", "faskes_asal", "spesialis", "diagnosa_code", "diagnosa_nama", "alasan", "kondisi", "no_rujukan", "status", "petugas"];

export function findAll() {
  return pool
    .query(
      `SELECT r.*, e.encounter_no, e.tipe, p.nama AS pasien_nama, p.mrn
         FROM rujukan r
         JOIN encounter e ON e.id = r.encounter_id
         JOIN patient p   ON p.id = e.patient_id
        ORDER BY (r.status = 'SELESAI' OR r.status = 'DITOLAK'), r.created_at DESC`
    )
    .then((r) => r.rows);
}

export function findById(id) {
  return pool.query("SELECT * FROM rujukan WHERE id = $1", [id]).then((r) => r.rows[0]);
}

export function insert(encounterId, d) {
  return pool
    .query(
      `INSERT INTO rujukan (encounter_id, ${COLS.join(", ")})
       VALUES ($1, ${COLS.map((_, i) => `$${i + 2}`).join(", ")}) RETURNING *`,
      [encounterId, ...COLS.map((c) => d[c] ?? null)]
    )
    .then((r) => r.rows[0]);
}

export function update(id, d) {
  const sets = COLS.map((c, i) => `${c} = $${i + 2}`).join(", ");
  return pool
    .query(`UPDATE rujukan SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`, [id, ...COLS.map((c) => d[c] ?? null)])
    .then((r) => r.rows[0]);
}

export function setStatus(id, status) {
  return pool
    .query(`UPDATE rujukan SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`, [id, status])
    .then((r) => r.rows[0]);
}
