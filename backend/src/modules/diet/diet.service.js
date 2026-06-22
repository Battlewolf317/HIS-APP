// =====================================================================
// diet.service.js — BUSINESS LOGIC diet pasien / nutrition
// =====================================================================

import * as repo from "./diet.repository.js";
import * as encounterRepo from "../encounter/encounter.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const STATUS = ["AKTIF", "SELESAI", "BATAL"];

export function list() {
  return repo.findAll();
}

export async function create(encounterId, data) {
  if (!encounterId) throw new ValidationError("Kunjungan wajib dipilih");
  const enc = await encounterRepo.findById(encounterId);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");
  if (!data.jenis_diet) throw new ValidationError("Jenis diet wajib diisi");
  data.status = "AKTIF";
  return repo.insert(encounterId, data);
}

export async function update(id, data) {
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Order diet tidak ditemukan");
  if (!data.jenis_diet) throw new ValidationError("Jenis diet wajib diisi");
  // pertahankan status existing kalau tidak dikirim
  data.status = data.status || rec.status;
  return repo.update(id, data);
}

export async function setStatus(id, status) {
  if (!STATUS.includes(status)) throw new ValidationError(`Status harus salah satu: ${STATUS.join(", ")}`);
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Order diet tidak ditemukan");
  return repo.setStatus(id, status);
}

export { ValidationError };
