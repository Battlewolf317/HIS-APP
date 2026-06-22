// =====================================================================
// procurement.repository.js — AKSES DATABASE pengadaan (supplier/purchase)
// =====================================================================

import pool from "../../config/db.js";

// ---------- SUPPLIER ----------
export function findSuppliers() {
  return pool.query("SELECT * FROM supplier ORDER BY kode").then((r) => r.rows);
}

// ---------- PURCHASE (header + lines) ----------
export function findAll() {
  return pool
    .query(
      `SELECT pu.*, s.nama AS supplier_nama,
              (SELECT COUNT(*)::int FROM purchase_item pi WHERE pi.purchase_id = pu.id) AS jml_item
         FROM purchase pu
         LEFT JOIN supplier s ON s.id = pu.supplier_id
        ORDER BY (pu.status IN ('DITERIMA','BATAL')), pu.created_at DESC`
    )
    .then((r) => r.rows);
}

export async function findById(id) {
  const head = await pool.query("SELECT pu.*, s.nama AS supplier_nama FROM purchase pu LEFT JOIN supplier s ON s.id = pu.supplier_id WHERE pu.id = $1", [id]);
  if (!head.rows[0]) return null;
  const items = await pool.query(
    `SELECT pi.*, it.kode AS item_kode, it.nama AS item_nama, it.satuan
       FROM purchase_item pi JOIN inv_item it ON it.id = pi.item_id
      WHERE pi.purchase_id = $1 ORDER BY pi.id`,
    [id]
  );
  return { ...head.rows[0], items: items.rows };
}

export function countToday(yyyymmdd) {
  return pool
    .query("SELECT COUNT(*)::int AS n FROM purchase WHERE to_char(created_at,'YYYYMMDD') = $1", [yyyymmdd])
    .then((r) => r.rows[0].n);
}

// buat header + lines dalam 1 transaksi
export async function createWithItems(head, items) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const h = await client.query(
      `INSERT INTO purchase (no_dok, supplier_id, keterangan, total, status, requested_by)
       VALUES ($1,$2,$3,$4,'DRAFT',$5) RETURNING *`,
      [head.no_dok, head.supplier_id, head.keterangan, head.total, head.requested_by]
    );
    const purchaseId = h.rows[0].id;
    for (const it of items) {
      await client.query(
        `INSERT INTO purchase_item (purchase_id, item_id, qty, harga, subtotal)
         VALUES ($1,$2,$3,$4,$5)`,
        [purchaseId, it.item_id, it.qty, it.harga, it.subtotal]
      );
    }
    await client.query("COMMIT");
    return purchaseId;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export function setStatus(id, status, by) {
  const col = status === "DISETUJUI" ? ", approved_by = $3" : "";
  const params = status === "DISETUJUI" ? [id, status, by] : [id, status];
  return pool
    .query(`UPDATE purchase SET status = $2${col}, updated_at = now() WHERE id = $1 RETURNING *`, params)
    .then((r) => r.rows[0]);
}

// tandai diterima + set qty_terima per line (dipanggil dalam flow receive)
export async function markReceived(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE purchase SET status='DITERIMA', received_at=now(), updated_at=now() WHERE id=$1",
      [id]
    );
    await client.query("UPDATE purchase_item SET qty_terima = qty WHERE purchase_id = $1", [id]);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
