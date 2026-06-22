// =====================================================================
// queue.service.js — BUSINESS LOGIC antrian
//  - take: ambil nomor antrian utk encounter RJ/IGD AKTIF (poli dari encounter)
//  - call: panggil antrian (DIPANGGIL) · done: selesai (SELESAI)
// =====================================================================

import * as repo from "./queue.repository.js";
import * as encounterRepo from "../encounter/encounter.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

export function getBoard() {
  return repo.findBoardToday();
}

export function getQueueable() {
  return repo.findQueueable();
}

export async function take(encounterId) {
  const enc = await encounterRepo.findById(encounterId);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");
  if (enc.status !== "AKTIF") throw new ValidationError("Kunjungan tidak AKTIF");
  if (!["RJ", "IGD"].includes(enc.tipe)) throw new ValidationError("Antrian hanya untuk Rawat Jalan / IGD");

  const exist = await repo.isEncounterQueuedToday(encounterId);
  if (exist) throw new ValidationError("Kunjungan ini sudah punya antrian hari ini");

  const poli = enc.poli || "UMUM";
  const queue_no = await repo.nextNumber(poli);
  return repo.insert({ encounter_id: encounterId, poli, queue_no });
}

export async function call(id) {
  const q = await repo.findById(id);
  if (!q) throw new ValidationError("Antrian tidak ditemukan");
  if (q.status === "SELESAI") throw new ValidationError("Antrian sudah selesai");
  return repo.setStatus(id, "DIPANGGIL", true);
}

export async function done(id) {
  const q = await repo.findById(id);
  if (!q) throw new ValidationError("Antrian tidak ditemukan");
  return repo.setStatus(id, "SELESAI", false);
}

export { ValidationError };
