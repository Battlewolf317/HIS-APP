// =====================================================================
// discharge.repository.js — AKSES DATABASE ringkasan pulang / resep pulang
// =====================================================================

import pool from "../../config/db.js";

const COLS = ["kondisi_pulang", "cara_pulang", "diagnosa_akhir", "ringkasan", "instruksi", "obat_pulang", "kontrol_tgl", "dokter", "petugas"];

export function findAll() {
  return pool
    .query(
      `SELECT d.*, e.encounter_no, e.tipe, p.nama AS pasien_nama, p.mrn
         FROM discharge d
         JOIN encounter e ON e.id = d.encounter_id
         JOIN patient p   ON p.id = e.patient_id
        ORDER BY d.updated_at DESC`
    )
    .then((r) => r.rows);
}

export function findByEncounter(encounterId) {
  return pool.query("SELECT * FROM discharge WHERE encounter_id = $1", [encounterId]).then((r) => r.rows[0]);
}

export function insert(encounterId, d) {
  return pool
    .query(
      `INSERT INTO discharge (encounter_id, ${COLS.join(", ")})
       VALUES ($1, ${COLS.map((_, i) => `$${i + 2}`).join(", ")}) RETURNING *`,
      [encounterId, ...COLS.map((c) => d[c] ?? null)]
    )
    .then((r) => r.rows[0]);
}

export function update(id, d) {
  const sets = COLS.map((c, i) => `${c} = $${i + 2}`).join(", ");
  return pool
    .query(`UPDATE discharge SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`, [id, ...COLS.map((c) => d[c] ?? null)])
    .then((r) => r.rows[0]);
}
