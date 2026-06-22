// =====================================================================
// bed.repository.js — AKSES DATABASE bed management (ward, bed)
// =====================================================================

import pool from "../../config/db.js";

// Bed board: semua bed + ward + penghuni (pasien) bila TERISI
export function findBoard() {
  return pool
    .query(
      `SELECT b.id, b.kode_bed, b.status, b.encounter_id, b.ward_id,
              w.kode AS ward_kode, w.nama AS ward_nama, w.kelas,
              e.encounter_no, p.nama AS pasien, p.mrn
         FROM bed b
         JOIN ward w ON w.id = b.ward_id
         LEFT JOIN encounter e ON e.id = b.encounter_id
         LEFT JOIN patient   p ON p.id = e.patient_id
        ORDER BY w.kode, b.kode_bed`
    )
    .then((r) => r.rows);
}

export function findBedById(id) {
  return pool.query("SELECT * FROM bed WHERE id = $1", [id]).then((r) => r.rows[0]);
}

// Encounter RI AKTIF yang belum punya bed (kandidat admit)
export function findAdmittable() {
  return pool
    .query(
      `SELECT e.id, e.encounter_no, e.poli, e.dokter, p.nama AS pasien, p.mrn
         FROM encounter e
         JOIN patient p ON p.id = e.patient_id
        WHERE e.tipe = 'RI' AND e.status = 'AKTIF'
          AND e.id NOT IN (SELECT encounter_id FROM bed WHERE encounter_id IS NOT NULL)
        ORDER BY e.id DESC`
    )
    .then((r) => r.rows);
}

export function setOccupant(bedId, encounterId, status) {
  return pool
    .query(
      "UPDATE bed SET encounter_id = $1, status = $2, updated_at = now() WHERE id = $3 RETURNING *",
      [encounterId, status, bedId]
    )
    .then((r) => r.rows[0]);
}

export function setStatus(bedId, status) {
  return pool
    .query("UPDATE bed SET status = $1, updated_at = now() WHERE id = $2 RETURNING *", [status, bedId])
    .then((r) => r.rows[0]);
}

export function findWards() {
  return pool.query("SELECT * FROM ward ORDER BY kode").then((r) => r.rows);
}

export function isEncounterOnBed(encounterId) {
  return pool
    .query("SELECT id FROM bed WHERE encounter_id = $1", [encounterId])
    .then((r) => r.rows[0]);
}
