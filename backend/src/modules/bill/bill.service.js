// =====================================================================
// bill.service.js — BUSINESS LOGIC tagihan
//  - 1 kunjungan : 1 tagihan (auto-create kalau belum ada)
//  - total dihitung otomatis dari item
//  - tagihan LUNAS tidak bisa diubah
// =====================================================================

import * as repo from "./bill.repository.js";
import * as encounterRepo from "../encounter/encounter.repository.js";
import * as accounting from "../accounting/accounting.service.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

// gabung bill + items + payments + ringkasan pembayaran buat frontend
async function withItems(bill) {
  const items = await repo.findItems(bill.id);
  const payments = await repo.findPayments(bill.id);
  const terbayar = await repo.sumPaid(bill.id);
  const sisa = Number(bill.total) - terbayar;
  return { ...bill, items, payments, terbayar, sisa };
}

// ambil tagihan kunjungan, bikin baru kalau belum ada
export async function getByEncounter(encounterId) {
  if (!encounterId) throw new ValidationError("encounter_id wajib diisi");
  const enc = await encounterRepo.findById(encounterId);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");

  let bill = await repo.findByEncounter(encounterId);
  if (!bill) bill = await repo.createForEncounter(encounterId);
  return withItems(bill);
}

export async function addItem(billId, data) {
  const bill = await repo.findById(billId);
  if (!bill) throw new ValidationError("Tagihan tidak ditemukan");
  if (bill.status === "LUNAS") throw new ValidationError("Tagihan sudah LUNAS, tidak bisa diubah");

  if (!data.deskripsi) throw new ValidationError("Deskripsi item wajib diisi");
  const qty = Number(data.qty) || 0;
  const harga = Number(data.harga) || 0;
  if (qty <= 0) throw new ValidationError("Qty harus lebih dari 0");
  if (harga < 0) throw new ValidationError("Harga tidak boleh negatif");

  await repo.insertItem(billId, {
    deskripsi: data.deskripsi,
    qty,
    harga,
    subtotal: qty * harga,
  });

  const updated = await repo.recomputeTotal(billId);
  return withItems(updated);
}

export async function removeItem(itemId) {
  const item = await repo.findItemById(itemId);
  if (!item) throw new ValidationError("Item tidak ditemukan");
  const bill = await repo.findById(item.bill_id);
  if (bill.status === "LUNAS") throw new ValidationError("Tagihan sudah LUNAS, tidak bisa diubah");

  await repo.deleteItem(itemId);
  const updated = await repo.recomputeTotal(item.bill_id);
  return withItems(updated);
}

export async function bayar(billId) {
  const bill = await repo.findById(billId);
  if (!bill) throw new ValidationError("Tagihan tidak ditemukan");
  if (bill.status === "LUNAS") throw new ValidationError("Tagihan sudah LUNAS");
  if (Number(bill.total) <= 0) throw new ValidationError("Tagihan kosong, tambah item dulu");

  // shortcut: lunasi sisa tagihan secara tunai
  const terbayar = await repo.sumPaid(billId);
  const sisa = Number(bill.total) - terbayar;
  if (sisa <= 0) {
    const paid = await repo.setStatus(billId, "LUNAS", true);
    return withItems(paid);
  }
  return addPayment(billId, { jenis: "BAYAR", metode: "TUNAI", jumlah: sisa }, null);
}

// --- P10 Kasir lanjutan: catat pembayaran (multi-metode / deposit / refund) ---
const METODE_VALID = ["TUNAI", "DEBIT", "KREDIT", "TRANSFER", "BPJS", "ASURANSI"];
const JENIS_VALID = ["BAYAR", "DEPOSIT", "REFUND"];

export async function addPayment(billId, data, kasirNama) {
  const bill = await repo.findById(billId);
  if (!bill) throw new ValidationError("Tagihan tidak ditemukan");

  const jenis = (data.jenis || "BAYAR").toUpperCase();
  const metode = (data.metode || "").toUpperCase();
  const jumlah = Number(data.jumlah) || 0;

  if (!JENIS_VALID.includes(jenis)) throw new ValidationError("Jenis transaksi tidak valid");
  if (!METODE_VALID.includes(metode)) throw new ValidationError("Metode pembayaran tidak valid");
  if (jumlah <= 0) throw new ValidationError("Jumlah harus lebih dari 0");

  const terbayar = await repo.sumPaid(billId);

  if (jenis === "REFUND") {
    if (jumlah > terbayar) throw new ValidationError("Refund melebihi total yang sudah dibayar");
  } else if (jenis === "BAYAR") {
    if (bill.status === "LUNAS") throw new ValidationError("Tagihan sudah LUNAS");
    if (Number(bill.total) <= 0) throw new ValidationError("Tagihan kosong, tambah item dulu");
    const sisa = Number(bill.total) - terbayar;
    if (jumlah > sisa) throw new ValidationError(`Pembayaran melebihi sisa tagihan (sisa: ${sisa})`);
  }
  // DEPOSIT: bebas (uang muka, boleh sebelum ada item)

  const paymentRow = await repo.insertPayment(billId, {
    jenis,
    metode,
    jumlah,
    keterangan: data.keterangan,
    kasir: kasirNama,
  });

  // auto-posting ke jurnal akuntansi (P12). Jangan gagalkan pembayaran kalau posting error.
  try {
    await accounting.postPayment(paymentRow);
  } catch (e) {
    console.error("Gagal auto-posting jurnal payment:", e.message);
  }

  // hitung ulang status pelunasan
  const totalBaru = await repo.sumPaid(billId);
  const lunas = Number(bill.total) > 0 && totalBaru >= Number(bill.total);
  const status = lunas ? "LUNAS" : "DRAFT";
  const updated = await repo.setStatus(billId, status, lunas);
  return withItems(updated);
}

export { ValidationError };
