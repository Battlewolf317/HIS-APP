// =====================================================================
// queue.repository.js — AKSES DATABASE antrian (queue)
// =====================================================================

import pool from "../../config/db.js";

// nomor antrian berikutnya utk poli + hari ini
export function nextNumber(poli) {
  return pool
    .query(
      `SELECT COALESCE(MAX(queue_no),0)+1 AS n
         FROM queue WHERE poli = $1 AND tanggal = current_date`,
      [poli]
    )
    .then((r) => r.rows[0].n);
}

export function insert(d) {
  return pool
    .query(
      `INSERT INTO queue (encounter_id, poli, queue_no) VALUES ($1,$2,$3) RETURNING *`,
      [d.encounter_id, d.poli, d.queue_no]
    )
    .then((r) => r.rows[0]);
}

export function findById(id) {
  return pool.query("SELECT * FROM queue WHERE id = $1", [id]).then((r) => r.rows[0]);
}

// papan antrian hari ini (semua poli) + nama pasien
export function findBoardToday() {
  return pool
    .query(
      `SELECT q.id, q.poli, q.queue_no, q.status, q.called_at, q.encounter_id,
              e.encounter_no, p.nama AS pasien, p.mrn
         FROM queue q
         JOIN encounter e ON e.id = q.encounter_id
         JOIN patient   p ON p.id = e.patient_id
        WHERE q.tanggal = current_date
        ORDER BY q.poli, q.queue_no`
    )
    .then((r) => r.rows);
}

// encounter RJ/IGD AKTIF hari ini yang belum ambil antrian hari ini
export function findQueueable() {
  return pool
    .query(
      `SELECT e.id, e.encounter_no, e.tipe, e.poli, e.dokter, p.nama AS pasien, p.mrn
         FROM encounter e
         JOIN patient p ON p.id = e.patient_id
        WHERE e.cancelled = false AND e.status = 'AKTIF'
          AND e.tipe IN ('RJ','IGD')
          AND e.id NOT IN (SELECT encounter_id FROM queue WHERE tanggal = current_date)
        ORDER BY e.id DESC`
    )
    .then((r) => r.rows);
}

export function setStatus(id, status, withCalledAt) {
  const sql = withCalledAt
    ? "UPDATE queue SET status=$1, called_at=now() WHERE id=$2 RETURNING *"
    : "UPDATE queue SET status=$1 WHERE id=$2 RETURNING *";
  return pool.query(sql, [status, id]).then((r) => r.rows[0]);
}

export function isEncounterQueuedToday(encounterId) {
  return pool
    .query("SELECT id FROM queue WHERE encounter_id=$1 AND tanggal=current_date", [encounterId])
    .then((r) => r.rows[0]);
}
