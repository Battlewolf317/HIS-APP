// =====================================================================
// triase.repository.js — AKSES DATABASE triase IGD
// =====================================================================

import pool from "../../config/db.js";

// worklist: encounter tipe IGD + status AKTIF, beserta data triase (kalau ada)
export function worklist() {
  return pool
    .query(
      `SELECT e.id AS encounter_id, e.encounter_no, e.tgl_masuk, e.keluhan, e.status,
              p.nama AS pasien_nama, p.id AS patient_id,
              t.id AS triase_id, t.level, t.kategori, t.created_at AS triase_at
         FROM encounter e
         JOIN patient p ON p.id = e.patient_id
         LEFT JOIN triase t ON t.encounter_id = e.id
        WHERE e.tipe = 'IGD' AND e.cancelled = false
        ORDER BY (t.id IS NOT NULL), e.tgl_masuk DESC`
    )
    .then((r) => r.rows);
}

export function findByEncounter(encounterId) {
  return pool.query("SELECT * FROM triase WHERE encounter_id = $1", [encounterId]).then((r) => r.rows[0]);
}

const COLS = ["cara_datang", "keluhan_utama", "td_sistol", "td_diastol", "nadi", "rr", "suhu", "spo2", "gcs", "nyeri", "kesadaran", "level", "kategori", "tindakan_awal", "petugas"];

export function insert(encounterId, d) {
  return pool
    .query(
      `INSERT INTO triase (encounter_id, ${COLS.join(", ")})
       VALUES ($1, ${COLS.map((_, i) => `$${i + 2}`).join(", ")}) RETURNING *`,
      [encounterId, ...COLS.map((c) => d[c] ?? null)]
    )
    .then((r) => r.rows[0]);
}

export function update(id, d) {
  const sets = COLS.map((c, i) => `${c} = $${i + 2}`).join(", ");
  return pool
    .query(`UPDATE triase SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`, [id, ...COLS.map((c) => d[c] ?? null)])
    .then((r) => r.rows[0]);
}
