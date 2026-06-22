// =====================================================================
// discharge.service.js — BUSINESS LOGIC ringkasan pulang / resep pulang
// =====================================================================

import * as repo from "./discharge.repository.js";
import * as encounterRepo from "../encounter/encounter.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const KONDISI = ["SEMBUH", "MEMBAIK", "RUJUK", "APS", "MENINGGAL"];

export function list() {
  return repo.findAll();
}

export async function getByEncounter(encounterId) {
  if (!encounterId) throw new ValidationError("encounter_id wajib diisi");
  const encounter = await encounterRepo.findById(encounterId);
  if (!encounter) throw new ValidationError("Kunjungan tidak ditemukan");
  const discharge = await repo.findByEncounter(encounterId);
  return { encounter, discharge: discharge || null };
}

// upsert: insert kalau belum ada, update kalau sudah ada
export async function save(encounterId, data) {
  if (!encounterId) throw new ValidationError("encounter_id wajib diisi");
  const enc = await encounterRepo.findById(encounterId);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");
  if (data.kondisi_pulang && !KONDISI.includes(data.kondisi_pulang)) {
    throw new ValidationError(`Kondisi pulang harus salah satu: ${KONDISI.join(", ")}`);
  }
  if (!data.ringkasan) throw new ValidationError("Ringkasan/resume medis wajib diisi");
  if (!data.kontrol_tgl) data.kontrol_tgl = null;

  const existing = await repo.findByEncounter(encounterId);
  if (existing) return repo.update(existing.id, data);
  return repo.insert(encounterId, data);
}

export { ValidationError };
