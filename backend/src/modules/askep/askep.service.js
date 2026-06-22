// =====================================================================
// askep.service.js — BUSINESS LOGIC asuhan keperawatan
// =====================================================================

import * as repo from "./askep.repository.js";
import * as encounterRepo from "../encounter/encounter.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const STATUS = ["AKTIF", "TERATASI", "BATAL"];

export function list() {
  return repo.findAll();
}

export async function create(encounterId, data) {
  if (!encounterId) throw new ValidationError("Kunjungan wajib dipilih");
  const enc = await encounterRepo.findById(encounterId);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");
  if (!data.diagnosa_kep) throw new ValidationError("Diagnosa keperawatan wajib diisi");
  data.status = "AKTIF";
  return repo.insert(encounterId, data);
}

export async function update(id, data) {
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Data asuhan keperawatan tidak ditemukan");
  if (!data.diagnosa_kep) throw new ValidationError("Diagnosa keperawatan wajib diisi");
  data.status = data.status || rec.status;
  return repo.update(id, data);
}

export async function setStatus(id, status) {
  if (!STATUS.includes(status)) throw new ValidationError(`Status harus salah satu: ${STATUS.join(", ")}`);
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Data asuhan keperawatan tidak ditemukan");
  return repo.setStatus(id, status);
}

export { ValidationError };
