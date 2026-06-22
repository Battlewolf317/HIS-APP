// =====================================================================
// cppt.repository.js — AKSES DATABASE CPPT (catatan terintegrasi)
// =====================================================================

import pool from "../../config/db.js";

const COLS = ["profesi", "subjektif", "objektif", "asesmen", "plan", "instruksi", "petugas"];

// semua catatan + info pasien/kunjungan (terbaru dulu)
export function findAll() {
  return pool
    .query(
      `SELECT c.*, e.encounter_no, e.tipe, p.nama AS pasien_nama, p.mrn
         FROM cppt c
         JOIN encounter e ON e.id = c.encounter_id
         JOIN patient p   ON p.id = e.patient_id
        ORDER BY c.created_at DESC`
    )
    .then((r) => r.rows);
}

// catatan untuk 1 kunjungan (kronologis)
export function findByEncounter(encounterId) {
  return pool
    .query("SELECT * FROM cppt WHERE encounter_id = $1 ORDER BY created_at ASC", [encounterId])
    .then((r) => r.rows);
}

export function findById(id) {
  return pool.query("SELECT * FROM cppt WHERE id = $1", [id]).then((r) => r.rows[0]);
}

export function insert(encounterId, d) {
  return pool
    .query(
      `INSERT INTO cppt (encounter_id, ${COLS.join(", ")})
       VALUES ($1, ${COLS.map((_, i) => `$${i + 2}`).join(", ")}) RETURNING *`,
      [encounterId, ...COLS.map((c) => d[c] ?? null)]
    )
    .then((r) => r.rows[0]);
}

export function remove(id) {
  return pool.query("DELETE FROM cppt WHERE id = $1", [id]).then(() => true);
}
