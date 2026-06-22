// =====================================================================
// mcu.repository.js — AKSES DATABASE Medical Check Up
// =====================================================================

import pool from "../../config/db.js";

const COLS = ["paket", "perusahaan", "hasil_ringkas", "kesimpulan", "rekomendasi", "dokter_pemeriksa", "status", "petugas"];

export function findAll() {
  return pool
    .query(
      `SELECT m.*, e.encounter_no, e.tipe, p.nama AS pasien_nama, p.mrn
         FROM mcu m
         JOIN encounter e ON e.id = m.encounter_id
         JOIN patient p   ON p.id = e.patient_id
        ORDER BY (m.status = 'SELESAI'), m.created_at DESC`
    )
    .then((r) => r.rows);
}

export function findById(id) {
  return pool.query("SELECT * FROM mcu WHERE id = $1", [id]).then((r) => r.rows[0]);
}

export function insert(encounterId, d) {
  return pool
    .query(
      `INSERT INTO mcu (encounter_id, ${COLS.join(", ")})
       VALUES ($1, ${COLS.map((_, i) => `$${i + 2}`).join(", ")}) RETURNING *`,
      [encounterId, ...COLS.map((c) => d[c] ?? null)]
    )
    .then((r) => r.rows[0]);
}

export function update(id, d) {
  const sets = COLS.map((c, i) => `${c} = $${i + 2}`).join(", ");
  return pool
    .query(`UPDATE mcu SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`, [id, ...COLS.map((c) => d[c] ?? null)])
    .then((r) => r.rows[0]);
}

export function setStatus(id, status) {
  return pool
    .query(`UPDATE mcu SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`, [id, status])
    .then((r) => r.rows[0]);
}
