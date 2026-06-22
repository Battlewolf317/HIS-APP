// =====================================================================
// jasamedis.repository.js — AKSES DATABASE jasa medis dokter
// =====================================================================

import pool from "../../config/db.js";

const COLS = ["dokter", "jenis", "deskripsi", "jumlah", "status", "petugas"];

export function findAll() {
  return pool
    .query(
      `SELECT j.*, e.encounter_no, e.tipe, p.nama AS pasien_nama, p.mrn
         FROM jasa_medis j
         JOIN encounter e ON e.id = j.encounter_id
         JOIN patient p   ON p.id = e.patient_id
        ORDER BY (j.status = 'DIBAYAR'), j.created_at DESC`
    )
    .then((r) => r.rows);
}

export function findById(id) {
  return pool.query("SELECT * FROM jasa_medis WHERE id = $1", [id]).then((r) => r.rows[0]);
}

export function insert(encounterId, d) {
  return pool
    .query(
      `INSERT INTO jasa_medis (encounter_id, ${COLS.join(", ")})
       VALUES ($1, ${COLS.map((_, i) => `$${i + 2}`).join(", ")}) RETURNING *`,
      [encounterId, ...COLS.map((c) => d[c] ?? null)]
    )
    .then((r) => r.rows[0]);
}

export function update(id, d) {
  const sets = COLS.map((c, i) => `${c} = $${i + 2}`).join(", ");
  return pool
    .query(`UPDATE jasa_medis SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`, [id, ...COLS.map((c) => d[c] ?? null)])
    .then((r) => r.rows[0]);
}

export function setStatus(id, status) {
  return pool
    .query(`UPDATE jasa_medis SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`, [id, status])
    .then((r) => r.rows[0]);
}
