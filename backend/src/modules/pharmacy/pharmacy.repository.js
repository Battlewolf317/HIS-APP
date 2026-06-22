// =====================================================================
// pharmacy.repository.js — AKSES DATABASE farmasi / dispensing
// =====================================================================

import pool from "../../config/db.js";

// Daftar resep PENDING (order jenis RESEP, status PENDING) + info pasien & kunjungan
export function findPendingResep() {
  return pool
    .query(
      `SELECT o.id, o.encounter_id, o.deskripsi, o.harga, o.status, o.created_at,
              e.encounter_no, p.nama AS pasien, p.mrn
         FROM clinical_order o
         JOIN encounter e ON e.id = o.encounter_id
         JOIN patient   p ON p.id = e.patient_id
        WHERE o.jenis = 'RESEP' AND o.status = 'PENDING'
        ORDER BY o.id DESC`
    )
    .then((r) => r.rows);
}

// Riwayat dispensing per resep (order)
export function findDispenseByOrder(orderId) {
  return pool
    .query(
      `SELECT d.*, i.kode, i.nama AS item_nama, i.satuan
         FROM pharmacy_dispense d
         JOIN inv_item i ON i.id = d.item_id
        WHERE d.order_id = $1 ORDER BY d.id DESC`,
      [orderId]
    )
    .then((r) => r.rows);
}

export function insertDispense(d) {
  return pool
    .query(
      `INSERT INTO pharmacy_dispense (order_id, item_id, qty, dispensed_by)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [d.order_id, d.item_id, d.qty, d.dispensed_by]
    )
    .then((r) => r.rows[0]);
}
