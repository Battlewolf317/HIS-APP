// =====================================================================
// procurement.service.js — BUSINESS LOGIC pengadaan (PR/PO)
//  Alur status: DRAFT → DIAJUKAN → DISETUJUI → DITERIMA / BATAL
//  Saat DITERIMA: stok inv_item bertambah (lewat inventory movement IN).
// =====================================================================

import * as repo from "./procurement.repository.js";
import * as inventoryService from "../inventory/inventory.service.js";
import * as invRepo from "../inventory/inventory.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

export function getSuppliers() {
  return repo.findSuppliers();
}

export function list() {
  return repo.findAll();
}

export async function getById(id) {
  const doc = await repo.findById(id);
  if (!doc) throw new ValidationError("Dokumen pengadaan tidak ditemukan");
  return doc;
}

async function genNoDok() {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const n = (await repo.countToday(ymd)) + 1;
  return `PO${ymd}${String(n).padStart(3, "0")}`;
}

export async function create(data, user) {
  if (!data.supplier_id) throw new ValidationError("Supplier wajib dipilih");
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) throw new ValidationError("Minimal 1 item barang");

  // validasi tiap line + hitung subtotal & total
  let total = 0;
  const lines = [];
  for (const it of items) {
    const item = await invRepo.findItemById(it.item_id);
    if (!item) throw new ValidationError(`Item id ${it.item_id} tidak ditemukan`);
    const qty = Number(it.qty);
    const harga = Number(it.harga);
    if (!(qty > 0)) throw new ValidationError(`Qty untuk ${item.nama} harus > 0`);
    if (!(harga >= 0)) throw new ValidationError(`Harga untuk ${item.nama} tidak valid`);
    const subtotal = qty * harga;
    total += subtotal;
    lines.push({ item_id: item.id, qty, harga, subtotal });
  }

  const no_dok = await genNoDok();
  const id = await repo.createWithItems(
    { no_dok, supplier_id: data.supplier_id, keterangan: data.keterangan || null, total, requested_by: user?.username || null },
    lines
  );
  return repo.findById(id);
}

export async function submit(id) {
  const doc = await getById(id);
  if (doc.status !== "DRAFT") throw new ValidationError("Hanya dokumen DRAFT yang bisa diajukan");
  await repo.setStatus(id, "DIAJUKAN");
  return repo.findById(id);
}

export async function approve(id, user) {
  const doc = await getById(id);
  if (doc.status !== "DIAJUKAN") throw new ValidationError("Hanya dokumen DIAJUKAN yang bisa disetujui");
  await repo.setStatus(id, "DISETUJUI", user?.username || null);
  return repo.findById(id);
}

export async function cancel(id) {
  const doc = await getById(id);
  if (doc.status === "DITERIMA") throw new ValidationError("Dokumen yang sudah DITERIMA tidak bisa dibatalkan");
  await repo.setStatus(id, "BATAL");
  return repo.findById(id);
}

// terima barang: stok masuk per line + tandai DITERIMA
export async function receive(id, user) {
  const doc = await getById(id);
  if (doc.status !== "DISETUJUI") throw new ValidationError("Hanya dokumen DISETUJUI yang bisa diterima");

  // posting stok masuk (IN) untuk tiap line — reuse logic inventory (update stok + kartu stok)
  for (const line of doc.items) {
    await inventoryService.createMovement(
      { item_id: line.item_id, tipe: "IN", qty: Number(line.qty), ref: doc.no_dok, keterangan: `Penerimaan ${doc.no_dok}` },
      user
    );
  }
  await repo.markReceived(id);
  return repo.findById(id);
}

export { ValidationError };
