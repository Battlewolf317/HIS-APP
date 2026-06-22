// =====================================================================
// operasi.repository.js — AKSES DATABASE jadwal operasi (OT)
// =====================================================================

import pool from "../../config/db.js";

const COLS = ["nama_tindakan", "kategori", "kamar_ot", "dokter_bedah", "dokter_anestesi", "jenis_anestesi", "tgl_operasi", "durasi_menit", "diagnosa_pre", "diagnosa_post", "status", "catatan", "petugas"];

export function findAll() {
  return pool
    .query(
      `SELECT o.*, e.encounter_no, e.tipe, p.nama AS pasien_nama, p.mrn
         FROM operasi o
         JOIN encounter e ON e.id = o.encounter_id
         JOIN patient p   ON p.id = e.patient_id
        ORDER BY (o.status = 'SELESAI' OR o.status = 'BATAL'), o.tgl_operasi NULLS LAST, o.created_at DESC`
    )
    .then((r) => r.rows);
}

export function findById(id) {
  return pool.query("SELECT * FROM operasi WHERE id = $1", [id]).then((r) => r.rows[0]);
}

export function insert(encounterId, d) {
  return pool
    .query(
      `INSERT INTO operasi (encounter_id, ${COLS.join(", ")})
       VALUES ($1, ${COLS.map((_, i) => `$${i + 2}`).join(", ")}) RETURNING *`,
      [encounterId, ...COLS.map((c) => d[c] ?? null)]
    )
    .then((r) => r.rows[0]);
}

export function update(id, d) {
  const sets = COLS.map((c, i) => `${c} = $${i + 2}`).join(", ");
  return pool
    .query(`UPDATE operasi SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`, [id, ...COLS.map((c) => d[c] ?? null)])
    .then((r) => r.rows[0]);
}

export function setStatus(id, status) {
  return pool
    .query(`UPDATE operasi SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`, [id, status])
    .then((r) => r.rows[0]);
}
