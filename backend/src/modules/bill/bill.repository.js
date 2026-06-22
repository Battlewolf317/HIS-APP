// =====================================================================
// bill.repository.js — AKSES DATABASE tagihan (bill + bill_item)
// =====================================================================

import pool from "../../config/db.js";

export function findByEncounter(encounterId) {
  return pool
    .query("SELECT * FROM bill WHERE encounter_id = $1", [encounterId])
    .then((r) => r.rows[0]);
}

export function findById(id) {
  return pool.query("SELECT * FROM bill WHERE id = $1", [id]).then((r) => r.rows[0]);
}

export function createForEncounter(encounterId) {
  return pool
    .query("INSERT INTO bill (encounter_id) VALUES ($1) RETURNING *", [encounterId])
    .then((r) => r.rows[0]);
}

export function findItems(billId) {
  return pool
    .query("SELECT * FROM bill_item WHERE bill_id = $1 ORDER BY id", [billId])
    .then((r) => r.rows);
}

export function findItemById(itemId) {
  return pool
    .query("SELECT * FROM bill_item WHERE id = $1", [itemId])
    .then((r) => r.rows[0]);
}

export function insertItem(billId, data) {
  const { deskripsi, qty, harga, subtotal } = data;
  return pool
    .query(
      `INSERT INTO bill_item (bill_id, deskripsi, qty, harga, subtotal)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [billId, deskripsi, qty, harga, subtotal]
    )
    .then((r) => r.rows[0]);
}

export function deleteItem(itemId) {
  return pool.query("DELETE FROM bill_item WHERE id = $1", [itemId]).then(() => true);
}

// Hitung ulang total dari sum subtotal item
export function recomputeTotal(billId) {
  return pool
    .query(
      `UPDATE bill
          SET total = (SELECT COALESCE(SUM(subtotal),0) FROM bill_item WHERE bill_id = $1),
              updated_at = now()
        WHERE id = $1 RETURNING *`,
      [billId]
    )
    .then((r) => r.rows[0]);
}

export function setPaid(billId) {
  return pool
    .query(
      `UPDATE bill SET status = 'LUNAS', paid_at = now(), updated_at = now()
        WHERE id = $1 RETURNING *`,
      [billId]
    )
    .then((r) => r.rows[0]);
}

// --- P10 Kasir lanjutan: payment (multi-metode, deposit, refund) ---

export function findPayments(billId) {
  return pool
    .query("SELECT * FROM payment WHERE bill_id = $1 ORDER BY id", [billId])
    .then((r) => r.rows);
}

export function insertPayment(billId, data) {
  const { jenis, metode, jumlah, keterangan, kasir } = data;
  return pool
    .query(
      `INSERT INTO payment (bill_id, jenis, metode, jumlah, keterangan, kasir)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [billId, jenis, metode, jumlah, keterangan || null, kasir || null]
    )
    .then((r) => r.rows[0]);
}

// Total terbayar = (BAYAR + DEPOSIT) - REFUND
export function sumPaid(billId) {
  return pool
    .query(
      `SELECT COALESCE(SUM(
          CASE WHEN jenis = 'REFUND' THEN -jumlah ELSE jumlah END
        ),0) AS terbayar
         FROM payment WHERE bill_id = $1`,
      [billId]
    )
    .then((r) => Number(r.rows[0].terbayar));
}

// Set status + paid_at sesuai pelunasan
export function setStatus(billId, status, lunas) {
  return pool
    .query(
      `UPDATE bill
          SET status = $2,
              paid_at = CASE WHEN $3 THEN now() ELSE NULL END,
              updated_at = now()
        WHERE id = $1 RETURNING *`,
      [billId, status, lunas]
    )
    .then((r) => r.rows[0]);
}
