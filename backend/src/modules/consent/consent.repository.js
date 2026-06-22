// =====================================================================
// consent.repository.js — AKSES DATABASE informed consent
// =====================================================================

import pool from "../../config/db.js";

const COLS = ["jenis_tindakan", "pemberi_info", "penerima_info", "hubungan", "keputusan", "catatan", "petugas"];

export function findAll() {
  return pool
    .query(
      `SELECT c.*, e.encounter_no, e.tipe, p.nama AS pasien_nama, p.mrn
         FROM consent c
         JOIN encounter e ON e.id = c.encounter_id
         JOIN patient p   ON p.id = e.patient_id
        ORDER BY c.created_at DESC`
    )
    .then((r) => r.rows);
}

export function findById(id) {
  return pool.query("SELECT * FROM consent WHERE id = $1", [id]).then((r) => r.rows[0]);
}

export function insert(encounterId, d) {
  return pool
    .query(
      `INSERT INTO consent (encounter_id, ${COLS.join(", ")})
       VALUES ($1, ${COLS.map((_, i) => `$${i + 2}`).join(", ")}) RETURNING *`,
      [encounterId, ...COLS.map((c) => d[c] ?? null)]
    )
    .then((r) => r.rows[0]);
}

export function update(id, d) {
  const sets = COLS.map((c, i) => `${c} = $${i + 2}`).join(", ");
  return pool
    .query(`UPDATE consent SET ${sets} WHERE id = $1 RETURNING *`, [id, ...COLS.map((c) => d[c] ?? null)])
    .then((r) => r.rows[0]);
}
