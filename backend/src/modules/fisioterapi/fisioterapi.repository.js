// =====================================================================
// fisioterapi.repository.js — AKSES DATABASE fisioterapi
// =====================================================================

import pool from "../../config/db.js";

const COLS = ["jenis_terapi", "diagnosa", "modalitas", "jumlah_sesi", "sesi_selesai", "status", "terapis", "catatan"];

export function findAll() {
  return pool
    .query(
      `SELECT f.*, e.encounter_no, e.tipe, p.nama AS pasien_nama, p.mrn
         FROM fisioterapi f
         JOIN encounter e ON e.id = f.encounter_id
         JOIN patient p   ON p.id = e.patient_id
        ORDER BY (f.status <> 'AKTIF'), f.created_at DESC`
    )
    .then((r) => r.rows);
}

export function findById(id) {
  return pool.query("SELECT * FROM fisioterapi WHERE id = $1", [id]).then((r) => r.rows[0]);
}

export function insert(encounterId, d) {
  return pool
    .query(
      `INSERT INTO fisioterapi (encounter_id, ${COLS.join(", ")})
       VALUES ($1, ${COLS.map((_, i) => `$${i + 2}`).join(", ")}) RETURNING *`,
      [encounterId, ...COLS.map((c) => d[c] ?? null)]
    )
    .then((r) => r.rows[0]);
}

export function update(id, d) {
  const sets = COLS.map((c, i) => `${c} = $${i + 2}`).join(", ");
  return pool
    .query(`UPDATE fisioterapi SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`, [id, ...COLS.map((c) => d[c] ?? null)])
    .then((r) => r.rows[0]);
}

export function setStatus(id, status) {
  return pool
    .query(`UPDATE fisioterapi SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`, [id, status])
    .then((r) => r.rows[0]);
}

// tambah 1 sesi selesai (tidak melebihi jumlah_sesi); auto SELESAI bila penuh
export function addSesi(id) {
  return pool
    .query(
      `UPDATE fisioterapi
          SET sesi_selesai = LEAST(sesi_selesai + 1, jumlah_sesi),
              status = CASE WHEN sesi_selesai + 1 >= jumlah_sesi THEN 'SELESAI' ELSE status END,
              updated_at = now()
        WHERE id = $1 RETURNING *`,
      [id]
    )
    .then((r) => r.rows[0]);
}
