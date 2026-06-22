// =====================================================================
// order.service.js — BUSINESS LOGIC order/CPOE
//  - order dibuat terhadap kunjungan AKTIF
//  - lifecycle: PENDING → DONE (isi hasil) / BATAL
//  - saat DONE & ada harga → otomatis masuk item tagihan (integrasi billing)
// =====================================================================

import * as repo from "./order.repository.js";
import * as encounterRepo from "../encounter/encounter.repository.js";
import * as billService from "../bill/bill.service.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const JENIS_VALID = ["LAB", "RAD", "RESEP"];

export function getByEncounter(encounterId) {
  if (!encounterId) throw new ValidationError("encounter_id wajib diisi");
  return repo.findByEncounter(encounterId);
}

export async function create(data) {
  if (!data.encounter_id) throw new ValidationError("Kunjungan wajib dipilih");
  const enc = await encounterRepo.findById(data.encounter_id);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");
  if (enc.status !== "AKTIF") throw new ValidationError("Hanya kunjungan AKTIF yang bisa dibuat order");

  if (!data.jenis || !JENIS_VALID.includes(data.jenis)) {
    throw new ValidationError("Jenis order harus LAB, RAD, atau RESEP");
  }
  if (!data.deskripsi) throw new ValidationError("Deskripsi order wajib diisi");

  data.harga = Number(data.harga) || 0;
  return repo.insert(data);
}

export async function selesai(id, hasil) {
  const order = await repo.findById(id);
  if (!order) throw new ValidationError("Order tidak ditemukan");
  if (order.status !== "PENDING") throw new ValidationError("Order sudah tidak PENDING");

  const done = await repo.setStatus(id, "DONE", hasil);

  // integrasi billing: kalau ada harga, tambahkan ke tagihan kunjungan
  if (Number(done.harga) > 0) {
    try {
      const bill = await billService.getByEncounter(done.encounter_id);
      await billService.addItem(bill.id, {
        deskripsi: `[${done.jenis}] ${done.deskripsi}`,
        qty: 1,
        harga: Number(done.harga),
      });
    } catch {
      // kalau tagihan sudah LUNAS / error → order tetap DONE, billing dilewati
    }
  }
  return done;
}

export async function batal(id) {
  const order = await repo.findById(id);
  if (!order) throw new ValidationError("Order tidak ditemukan");
  if (order.status === "DONE") throw new ValidationError("Order sudah DONE, tidak bisa dibatalkan");
  return repo.setStatus(id, "BATAL", null);
}

export { ValidationError };
