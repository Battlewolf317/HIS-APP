// =====================================================================
// profil.repository.js — agregasi data profil pasien (360° view)
// =====================================================================

import pool from "../../config/db.js";

const one = (sql, p) => pool.query(sql, p).then((r) => r.rows[0]);
const many = (sql, p) => pool.query(sql, p).then((r) => r.rows);

export function patient(id) {
  return one("SELECT * FROM patient WHERE id = $1", [id]);
}

export function patientByMrn(mrn) {
  return one("SELECT * FROM patient WHERE mrn = $1 AND cancelled = false", [mrn]);
}

export function stats(id) {
  return one(
    `SELECT
       COUNT(*)::int AS total_kunjungan,
       COUNT(*) FILTER (WHERE status = 'AKTIF')::int AS kunjungan_aktif,
       MAX(tgl_masuk) AS kunjungan_terakhir
     FROM encounter WHERE patient_id = $1 AND cancelled = false`,
    [id]
  );
}

export function encounters(id) {
  return many(
    `SELECT id, encounter_no, tipe, poli, dokter, keluhan, tgl_masuk, tgl_keluar, status
       FROM encounter
      WHERE patient_id = $1 AND cancelled = false
      ORDER BY tgl_masuk DESC NULLS LAST, id DESC
      LIMIT 50`,
    [id]
  );
}

export function diagnosa(id) {
  return many(
    `SELECT m.diagnosa_code, m.diagnosa_nama, m.created_at, e.encounter_no
       FROM medical_record m
       JOIN encounter e ON e.id = m.encounter_id
      WHERE e.patient_id = $1 AND m.diagnosa_nama IS NOT NULL
      ORDER BY m.created_at DESC
      LIMIT 20`,
    [id]
  );
}

// alergi/pantangan teragregasi dari order diet (kalau ada)
export function alergi(id) {
  return many(
    `SELECT DISTINCT d.pantangan
       FROM diet_order d
       JOIN encounter e ON e.id = d.encounter_id
      WHERE e.patient_id = $1 AND d.pantangan IS NOT NULL AND d.pantangan <> ''`,
    [id]
  );
}
