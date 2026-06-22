// =====================================================================
// patient.repository.js — LAPISAN AKSES DATABASE
// Tugas: cuma query SQL ke tabel patient. Tidak ada business rule di sini.
// (Mirip "petugas gudang": ambil/simpan data, ga mikir aturan)
// =====================================================================

import pool from "../../config/db.js";

// Ambil semua pasien aktif (belum di-cancel)
export function findAll() {
  return pool
    .query("SELECT * FROM patient WHERE cancelled = false ORDER BY id")
    .then((r) => r.rows);
}

// Ambil 1 pasien by id
export function findById(id) {
  return pool
    .query("SELECT * FROM patient WHERE id = $1", [id])
    .then((r) => r.rows[0]);   // undefined kalau ga ada
}

// Cari pasien by MRN (buat cek unik) — opsi excludeId buat mode edit
export function findByMrn(mrn, excludeId = null) {
  if (excludeId) {
    return pool
      .query(
        "SELECT * FROM patient WHERE mrn = $1 AND id <> $2 AND cancelled = false",
        [mrn, excludeId]
      )
      .then((r) => r.rows[0]);
  }
  return pool
    .query("SELECT * FROM patient WHERE mrn = $1 AND cancelled = false", [mrn])
    .then((r) => r.rows[0]);
}

// Simpan pasien baru
export function insert(data) {
  const { mrn, nik, nama, tgl_lahir, jenis_kelamin, alamat, no_hp, penjamin, no_penjamin } = data;
  return pool
    .query(
      `INSERT INTO patient (mrn, nik, nama, tgl_lahir, jenis_kelamin, alamat, no_hp, penjamin, no_penjamin)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [mrn, nik, nama, tgl_lahir, jenis_kelamin, alamat, no_hp, penjamin, no_penjamin]
    )
    .then((r) => r.rows[0]);
}

// Update pasien
export function update(id, data) {
  const { mrn, nik, nama, tgl_lahir, jenis_kelamin, alamat, no_hp, penjamin, no_penjamin } = data;
  return pool
    .query(
      `UPDATE patient
         SET mrn=$1, nik=$2, nama=$3, tgl_lahir=$4, jenis_kelamin=$5,
             alamat=$6, no_hp=$7, penjamin=$8, no_penjamin=$9, updated_at=now()
       WHERE id=$10 RETURNING *`,
      [mrn, nik, nama, tgl_lahir, jenis_kelamin, alamat, no_hp, penjamin, no_penjamin, id]
    )
    .then((r) => r.rows[0]);
}

// Soft delete (set cancel flag)
export function softDelete(id) {
  return pool
    .query("UPDATE patient SET cancelled = true, updated_at = now() WHERE id = $1", [id])
    .then(() => true);
}
