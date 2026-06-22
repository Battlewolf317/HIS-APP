// =====================================================================
// inventory.service.js — BUSINESS LOGIC inventory / gudang
//  - master item obat & alkes (CRUD)
//  - gerakan stok: IN (masuk), OUT (keluar), ADJ (stock opname)
//  - stok berjalan otomatis ter-update + dicatat di kartu stok (movement)
// =====================================================================

import * as repo from "./inventory.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const KATEGORI_VALID = ["OBAT", "ALKES"];
const TIPE_VALID = ["IN", "OUT", "ADJ"];

// ---------- ITEM ----------
export function getItems(filter) {
  return repo.findItems(filter);
}

export async function getItem(id) {
  const item = await repo.findItemById(id);
  if (!item) throw new ValidationError("Item tidak ditemukan");
  return item;
}

export async function createItem(d) {
  if (!d.kode) throw new ValidationError("Kode item wajib diisi");
  if (!d.nama) throw new ValidationError("Nama item wajib diisi");
  if (!KATEGORI_VALID.includes(d.kategori)) throw new ValidationError("Kategori harus OBAT atau ALKES");
  const exist = await repo.findItemByKode(d.kode);
  if (exist) throw new ValidationError(`Kode ${d.kode} sudah dipakai`);

  return repo.insertItem({
    kode: d.kode.trim().toUpperCase(),
    nama: d.nama.trim(),
    kategori: d.kategori,
    satuan: (d.satuan || "PC").trim().toUpperCase(),
    stok: Number(d.stok) || 0,
    stok_min: Number(d.stok_min) || 0,
    harga: Number(d.harga) || 0,
  });
}

export async function updateItem(id, d) {
  await getItem(id);
  if (!d.nama) throw new ValidationError("Nama item wajib diisi");
  if (!KATEGORI_VALID.includes(d.kategori)) throw new ValidationError("Kategori harus OBAT atau ALKES");
  return repo.updateItem(id, {
    nama: d.nama.trim(),
    kategori: d.kategori,
    satuan: (d.satuan || "PC").trim().toUpperCase(),
    stok_min: Number(d.stok_min) || 0,
    harga: Number(d.harga) || 0,
  });
}

export async function deleteItem(id) {
  await getItem(id);
  return repo.softDeleteItem(id);
}

export function getLowStock() {
  return repo.findLowStock();
}

// ---------- MOVEMENT ----------
export function getMovements(itemId) {
  if (!itemId) throw new ValidationError("item_id wajib diisi");
  return repo.findMovements(itemId);
}

// Catat gerakan stok + update stok berjalan.
//  IN  → stok + qty
//  OUT → stok - qty (tidak boleh sampai minus)
//  ADJ → stok di-set = qty (stock opname); qty movement = nilai opname
export async function createMovement(d, user) {
  const item = await repo.findItemById(d.item_id);
  if (!item) throw new ValidationError("Item tidak ditemukan");
  if (!TIPE_VALID.includes(d.tipe)) throw new ValidationError("Tipe harus IN, OUT, atau ADJ");

  const qty = Number(d.qty);
  if (!(qty >= 0)) throw new ValidationError("Qty harus angka >= 0");
  if (d.tipe !== "ADJ" && qty <= 0) throw new ValidationError("Qty harus lebih dari 0");

  const stokBefore = Number(item.stok);
  let stokAfter;
  if (d.tipe === "IN") {
    stokAfter = stokBefore + qty;
  } else if (d.tipe === "OUT") {
    if (qty > stokBefore) throw new ValidationError(`Stok tidak cukup (tersedia ${stokBefore})`);
    stokAfter = stokBefore - qty;
  } else {
    // ADJ: set stok = qty (hasil opname fisik)
    stokAfter = qty;
  }

  await repo.setStok(d.item_id, stokAfter);
  return repo.insertMovement({
    item_id: d.item_id,
    tipe: d.tipe,
    qty,
    stok_before: stokBefore,
    stok_after: stokAfter,
    ref: d.ref || null,
    keterangan: d.keterangan || null,
    created_by: user?.username || null,
  });
}

export { ValidationError };
