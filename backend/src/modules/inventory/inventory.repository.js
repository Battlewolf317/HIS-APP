// =====================================================================
// inventory.repository.js — AKSES DATABASE inventory (inv_item, inv_movement)
// =====================================================================

import pool from "../../config/db.js";

// ---------- ITEM (master stok) ----------
export function findItems({ q, kategori } = {}) {
  const where = ["cancelled = false"];
  const params = [];
  if (q) {
    params.push(`%${q.toUpperCase()}%`);
    where.push(`(UPPER(kode) LIKE $${params.length} OR UPPER(nama) LIKE $${params.length})`);
  }
  if (kategori) {
    params.push(kategori);
    where.push(`kategori = $${params.length}`);
  }
  return pool
    .query(`SELECT * FROM inv_item WHERE ${where.join(" AND ")} ORDER BY kode`, params)
    .then((r) => r.rows);
}

export function findItemById(id) {
  return pool.query("SELECT * FROM inv_item WHERE id = $1", [id]).then((r) => r.rows[0]);
}

export function findItemByKode(kode) {
  return pool.query("SELECT * FROM inv_item WHERE kode = $1", [kode]).then((r) => r.rows[0]);
}

export function insertItem(d) {
  return pool
    .query(
      `INSERT INTO inv_item (kode, nama, kategori, satuan, stok, stok_min, harga)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [d.kode, d.nama, d.kategori, d.satuan, d.stok, d.stok_min, d.harga]
    )
    .then((r) => r.rows[0]);
}

export function updateItem(id, d) {
  return pool
    .query(
      `UPDATE inv_item SET nama=$1, kategori=$2, satuan=$3, stok_min=$4, harga=$5, updated_at=now()
        WHERE id=$6 RETURNING *`,
      [d.nama, d.kategori, d.satuan, d.stok_min, d.harga, id]
    )
    .then((r) => r.rows[0]);
}

export function softDeleteItem(id) {
  return pool
    .query("UPDATE inv_item SET cancelled=true, updated_at=now() WHERE id=$1 RETURNING *", [id])
    .then((r) => r.rows[0]);
}

export function setStok(id, stok) {
  return pool
    .query("UPDATE inv_item SET stok=$1, updated_at=now() WHERE id=$2 RETURNING *", [stok, id])
    .then((r) => r.rows[0]);
}

export function findLowStock() {
  return pool
    .query("SELECT * FROM inv_item WHERE cancelled=false AND stok <= stok_min ORDER BY kode")
    .then((r) => r.rows);
}

// ---------- MOVEMENT (kartu stok) ----------
export function findMovements(itemId) {
  return pool
    .query("SELECT * FROM inv_movement WHERE item_id=$1 ORDER BY id DESC", [itemId])
    .then((r) => r.rows);
}

export function insertMovement(m) {
  return pool
    .query(
      `INSERT INTO inv_movement (item_id, tipe, qty, stok_before, stok_after, ref, keterangan, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [m.item_id, m.tipe, m.qty, m.stok_before, m.stok_after, m.ref, m.keterangan, m.created_by]
    )
    .then((r) => r.rows[0]);
}
