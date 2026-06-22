// =====================================================================
// encounter.repository.js — LAPISAN AKSES DATABASE
// Tugas: cuma query SQL ke tabel encounter. Tidak ada business rule.
// (Mirip "petugas gudang": ambil/simpan data, ga mikir aturan)
// =====================================================================

import pool from "../../config/db.js";

// Ambil semua kunjungan aktif + JOIN data pasien (nama & MRN)
export function findAll() {
  return pool
    .query(
      `SELECT e.*, p.nama AS patient_nama, p.mrn AS patient_mrn
         FROM encounter e
         JOIN patient p ON p.id = e.patient_id
        WHERE e.cancelled = false
        ORDER BY e.id`
    )
    .then((r) => r.rows);
}

// Ambil 1 kunjungan by id (+ data pasien)
export function findById(id) {
  return pool
    .query(
      `SELECT e.*, p.nama AS patient_nama, p.mrn AS patient_mrn
         FROM encounter e
         JOIN patient p ON p.id = e.patient_id
        WHERE e.id = $1`,
      [id]
    )
    .then((r) => r.rows[0]); // undefined kalau ga ada
}

// Hitung kunjungan pada tanggal tertentu (buat generate nomor urut harian)
export function countByDate(yyyymmdd) {
  return pool
    .query(
      `SELECT COUNT(*)::int AS n FROM encounter
        WHERE to_char(created_at, 'YYYYMMDD') = $1`,
      [yyyymmdd]
    )
    .then((r) => r.rows[0].n);
}

// Simpan kunjungan baru
export function insert(data) {
  const { encounter_no, patient_id, tipe, poli, dokter, keluhan, status } = data;
  return pool
    .query(
      `INSERT INTO encounter (encounter_no, patient_id, tipe, poli, dokter, keluhan, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [encounter_no, patient_id, tipe, poli, dokter, keluhan, status]
    )
    .then((r) => r.rows[0]);
}

// Update kunjungan (data umum)
export function update(id, data) {
  const { tipe, poli, dokter, keluhan } = data;
  return pool
    .query(
      `UPDATE encounter
          SET tipe=$1, poli=$2, dokter=$3, keluhan=$4, updated_at=now()
        WHERE id=$5 RETURNING *`,
      [tipe, poli, dokter, keluhan, id]
    )
    .then((r) => r.rows[0]);
}

// Set status (AKTIF/SELESAI/BATAL) + tgl_keluar saat selesai
export function setStatus(id, status, withDischarge) {
  const sql = withDischarge
    ? `UPDATE encounter SET status=$1, tgl_keluar=now(), updated_at=now() WHERE id=$2 RETURNING *`
    : `UPDATE encounter SET status=$1, updated_at=now() WHERE id=$2 RETURNING *`;
  return pool.query(sql, [status, id]).then((r) => r.rows[0]);
}

// Soft delete (set cancel flag)
export function softDelete(id) {
  return pool
    .query("UPDATE encounter SET cancelled = true, updated_at = now() WHERE id = $1", [id])
    .then(() => true);
}
