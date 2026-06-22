// =====================================================================
// transfusi.repository.js — AKSES DATABASE Unit Transfusi Darah (UTD)
// =====================================================================

import pool from "../../config/db.js";

const COLS = ["gol_darah", "rhesus", "komponen", "jumlah_kantong", "indikasi", "no_kantong", "crossmatch", "status", "petugas"];

export function findAll() {
  return pool
    .query(
      `SELECT t.*, e.encounter_no, e.tipe, p.nama AS pasien_nama, p.mrn
         FROM transfusi t
         JOIN encounter e ON e.id = t.encounter_id
         JOIN patient p   ON p.id = e.patient_id
        ORDER BY (t.status IN ('DISERAHKAN','BATAL')), t.created_at DESC`
    )
    .then((r) => r.rows);
}

export function findById(id) {
  return pool.query("SELECT * FROM transfusi WHERE id = $1", [id]).then((r) => r.rows[0]);
}

export function insert(encounterId, d) {
  return pool
    .query(
      `INSERT INTO transfusi (encounter_id, ${COLS.join(", ")})
       VALUES ($1, ${COLS.map((_, i) => `$${i + 2}`).join(", ")}) RETURNING *`,
      [encounterId, ...COLS.map((c) => d[c] ?? null)]
    )
    .then((r) => r.rows[0]);
}

export function update(id, d) {
  const sets = COLS.map((c, i) => `${c} = $${i + 2}`).join(", ");
  return pool
    .query(`UPDATE transfusi SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`, [id, ...COLS.map((c) => d[c] ?? null)])
    .then((r) => r.rows[0]);
}

export function setStatus(id, status) {
  return pool
    .query(`UPDATE transfusi SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`, [id, status])
    .then((r) => r.rows[0]);
}
