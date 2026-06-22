// =====================================================================
// dpjp.repository.js — AKSES DATABASE DPJP (dokter penanggung jawab)
// =====================================================================

import pool from "../../config/db.js";

const COLS = ["dokter", "spesialisasi", "peran", "tgl_mulai", "tgl_selesai", "status", "catatan", "petugas"];

export function findAll() {
  return pool
    .query(
      `SELECT j.*, e.encounter_no, e.tipe, p.nama AS pasien_nama, p.mrn
         FROM dpjp j
         JOIN encounter e ON e.id = j.encounter_id
         JOIN patient p   ON p.id = e.patient_id
        ORDER BY (j.status <> 'AKTIF'), j.created_at DESC`
    )
    .then((r) => r.rows);
}

export function findById(id) {
  return pool.query("SELECT * FROM dpjp WHERE id = $1", [id]).then((r) => r.rows[0]);
}

// tutup DPJP UTAMA aktif lain pada encounter yang sama (sebelum set UTAMA baru)
export function closeActiveUtama(encounterId) {
  return pool.query(
    `UPDATE dpjp SET status='SELESAI', tgl_selesai=current_date, updated_at=now()
      WHERE encounter_id=$1 AND peran='UTAMA' AND status='AKTIF'`,
    [encounterId]
  );
}

export function insert(encounterId, d) {
  return pool
    .query(
      `INSERT INTO dpjp (encounter_id, ${COLS.join(", ")})
       VALUES ($1, ${COLS.map((_, i) => `$${i + 2}`).join(", ")}) RETURNING *`,
      [encounterId, ...COLS.map((c) => d[c] ?? null)]
    )
    .then((r) => r.rows[0]);
}

export function update(id, d) {
  const sets = COLS.map((c, i) => `${c} = $${i + 2}`).join(", ");
  return pool
    .query(`UPDATE dpjp SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`, [id, ...COLS.map((c) => d[c] ?? null)])
    .then((r) => r.rows[0]);
}

export function setStatus(id, status) {
  const withEnd = status === "SELESAI";
  const sql = withEnd
    ? `UPDATE dpjp SET status=$2, tgl_selesai=COALESCE(tgl_selesai, current_date), updated_at=now() WHERE id=$1 RETURNING *`
    : `UPDATE dpjp SET status=$2, updated_at=now() WHERE id=$1 RETURNING *`;
  return pool.query(sql, [id, status]).then((r) => r.rows[0]);
}
