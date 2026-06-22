// =====================================================================
// diagnostic.repository.js — AKSES DATABASE penunjang (Lab LIS / Radiologi RIS)
//  Worklist & hasil berbasis clinical_order (jenis LAB / RAD).
// =====================================================================

import pool from "../../config/db.js";

// Worklist: order PENDING utk jenis tertentu (LAB / RAD) + info pasien
export function findWorklist(jenis) {
  return pool
    .query(
      `SELECT o.id, o.encounter_id, o.jenis, o.deskripsi, o.harga, o.status, o.hasil, o.created_at,
              e.encounter_no, p.nama AS pasien, p.mrn
         FROM clinical_order o
         JOIN encounter e ON e.id = o.encounter_id
         JOIN patient   p ON p.id = e.patient_id
        WHERE o.jenis = $1 AND o.status = 'PENDING'
        ORDER BY o.id DESC`,
      [jenis]
    )
    .then((r) => r.rows);
}

// Hasil yang sudah selesai (DONE) — buat tab "Sudah Selesai"
export function findDone(jenis) {
  return pool
    .query(
      `SELECT o.id, o.encounter_id, o.jenis, o.deskripsi, o.status, o.hasil, o.updated_at,
              e.encounter_no, p.nama AS pasien, p.mrn
         FROM clinical_order o
         JOIN encounter e ON e.id = o.encounter_id
         JOIN patient   p ON p.id = e.patient_id
        WHERE o.jenis = $1 AND o.status = 'DONE'
        ORDER BY o.updated_at DESC
        LIMIT 50`,
      [jenis]
    )
    .then((r) => r.rows);
}
