// =====================================================================
// medrec.repository.js — AKSES DATABASE rekam medis (medical_record)
// =====================================================================

import pool from "../../config/db.js";

// Semua rekam medis untuk 1 kunjungan (terbaru di atas)
export function findByEncounter(encounterId) {
  return pool
    .query(
      "SELECT * FROM medical_record WHERE encounter_id = $1 ORDER BY id DESC",
      [encounterId]
    )
    .then((r) => r.rows);
}

export function findById(id) {
  return pool
    .query("SELECT * FROM medical_record WHERE id = $1", [id])
    .then((r) => r.rows[0]);
}

export function insert(data) {
  const { encounter_id, anamnesa, pemeriksaan, diagnosa_code, diagnosa_nama, tindak_lanjut, dokter } = data;
  return pool
    .query(
      `INSERT INTO medical_record
         (encounter_id, anamnesa, pemeriksaan, diagnosa_code, diagnosa_nama, tindak_lanjut, dokter)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [encounter_id, anamnesa, pemeriksaan, diagnosa_code, diagnosa_nama, tindak_lanjut, dokter]
    )
    .then((r) => r.rows[0]);
}

export function remove(id) {
  return pool
    .query("DELETE FROM medical_record WHERE id = $1", [id])
    .then(() => true);
}
