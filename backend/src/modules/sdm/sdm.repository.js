// =====================================================================
// sdm.repository.js — AKSES DATABASE SDM (pegawai + presensi)
// =====================================================================

import pool from "../../config/db.js";

// ---------- PEGAWAI ----------
export function findPegawai() {
  return pool.query("SELECT * FROM pegawai ORDER BY nip").then((r) => r.rows);
}

export function findPegawaiById(id) {
  return pool.query("SELECT * FROM pegawai WHERE id = $1", [id]).then((r) => r.rows[0]);
}

export function findPegawaiByNip(nip) {
  return pool.query("SELECT * FROM pegawai WHERE nip = $1", [nip]).then((r) => r.rows[0]);
}

export function insertPegawai(d) {
  return pool
    .query(
      `INSERT INTO pegawai (nip, nama, jabatan, unit, no_hp, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [d.nip, d.nama, d.jabatan, d.unit, d.no_hp, d.status]
    )
    .then((r) => r.rows[0]);
}

export function updatePegawai(id, d) {
  return pool
    .query(
      `UPDATE pegawai SET nama=$1, jabatan=$2, unit=$3, no_hp=$4, status=$5, updated_at=now()
        WHERE id=$6 RETURNING *`,
      [d.nama, d.jabatan, d.unit, d.no_hp, d.status, id]
    )
    .then((r) => r.rows[0]);
}

// ---------- PRESENSI ----------
export function findPresensi(tanggal) {
  return pool
    .query(
      `SELECT pr.*, p.nip, p.nama AS pegawai_nama, p.unit
         FROM presensi pr JOIN pegawai p ON p.id = pr.pegawai_id
        WHERE pr.tanggal = $1 ORDER BY p.nip`,
      [tanggal]
    )
    .then((r) => r.rows);
}

// upsert presensi (unik per pegawai+tanggal)
export function upsertPresensi(d) {
  return pool
    .query(
      `INSERT INTO presensi (pegawai_id, tanggal, jam_masuk, jam_pulang, status, catatan)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (pegawai_id, tanggal)
       DO UPDATE SET jam_masuk=EXCLUDED.jam_masuk, jam_pulang=EXCLUDED.jam_pulang,
                     status=EXCLUDED.status, catatan=EXCLUDED.catatan
       RETURNING *`,
      [d.pegawai_id, d.tanggal, d.jam_masuk, d.jam_pulang, d.status, d.catatan]
    )
    .then((r) => r.rows[0]);
}
