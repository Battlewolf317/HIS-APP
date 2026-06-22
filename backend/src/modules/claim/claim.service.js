// =====================================================================
// claim.service.js — BUSINESS LOGIC klaim penjamin (piutang)
//  Status flow: OPEN → SUBMITTED → APPROVED → PAID
//                              ↘ REJECTED (dari SUBMITTED/APPROVED)
// =====================================================================

import * as repo from "./claim.repository.js";
import * as accounting from "../accounting/accounting.service.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

export function listPenjamin() {
  return repo.findPenjamin();
}

export function listClaims(filter) {
  return repo.findClaims(filter);
}

export function aging() {
  return repo.agingSummary();
}

// generate nomor klaim: CLM-YYYYMMDD-NNN
async function genNoKlaim() {
  const n = await repo.countToday();
  const d = new Date();
  const tgl = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `CLM-${tgl}-${String(n + 1).padStart(3, "0")}`;
}

export async function create(data) {
  const penjaminId = Number(data.penjamin_id) || 0;
  if (!penjaminId) throw new ValidationError("Penjamin wajib dipilih");
  const penjamin = await repo.findPenjaminById(penjaminId);
  if (!penjamin) throw new ValidationError("Penjamin tidak ditemukan");

  const jumlah = Number(data.jumlah_tagih) || 0;
  if (jumlah <= 0) throw new ValidationError("Jumlah tagih harus lebih dari 0");

  const no_klaim = await genNoKlaim();
  return repo.insert({
    no_klaim,
    penjamin_id: penjaminId,
    encounter_id: data.encounter_id,
    bill_id: data.bill_id,
    pasien: data.pasien,
    jumlah_tagih: jumlah,
    keterangan: data.keterangan,
  });
}

async function getOrThrow(id) {
  const c = await repo.findById(id);
  if (!c) throw new ValidationError("Klaim tidak ditemukan");
  return c;
}

export async function submit(id) {
  const c = await getOrThrow(id);
  if (c.status !== "OPEN") throw new ValidationError(`Klaim status ${c.status}, hanya OPEN yang bisa diajukan`);
  return repo.updateStatus(id, { status: "SUBMITTED" });
}

export async function approve(id, jumlahSetuju) {
  const c = await getOrThrow(id);
  if (c.status !== "SUBMITTED") throw new ValidationError(`Klaim status ${c.status}, hanya SUBMITTED yang bisa disetujui`);
  const setuju = jumlahSetuju === undefined || jumlahSetuju === null || jumlahSetuju === ""
    ? Number(c.jumlah_tagih)
    : Number(jumlahSetuju);
  if (setuju <= 0) throw new ValidationError("Jumlah disetujui harus lebih dari 0");
  if (setuju > Number(c.jumlah_tagih)) throw new ValidationError("Jumlah disetujui melebihi jumlah tagih");
  return repo.updateStatus(id, { status: "APPROVED", jumlah_setuju: setuju });
}

export async function pay(id) {
  const c = await getOrThrow(id);
  if (c.status !== "APPROVED") throw new ValidationError(`Klaim status ${c.status}, hanya APPROVED yang bisa dibayar`);
  const today = new Date().toISOString().slice(0, 10);
  const paid = await repo.updateStatus(id, { status: "PAID", tgl_bayar: today });

  // auto-posting pelunasan piutang ke jurnal (P12)
  try {
    await accounting.postClaimPaid(paid);
  } catch (e) {
    console.error("Gagal auto-posting jurnal klaim:", e.message);
  }
  return paid;
}

export async function reject(id, alasan) {
  const c = await getOrThrow(id);
  if (!["SUBMITTED", "APPROVED"].includes(c.status))
    throw new ValidationError(`Klaim status ${c.status}, tidak bisa ditolak`);
  if (!alasan) throw new ValidationError("Alasan penolakan wajib diisi");
  return repo.updateStatus(id, { status: "REJECTED", keterangan: alasan });
}

export { ValidationError };
