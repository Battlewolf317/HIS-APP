// =====================================================================
// cppt.service.js — BUSINESS LOGIC CPPT (catatan terintegrasi)
// =====================================================================

import * as repo from "./cppt.repository.js";
import * as encounterRepo from "../encounter/encounter.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const PROFESI = ["DOKTER", "PERAWAT", "GIZI", "FARMASI", "FISIO"];

export function list() {
  return repo.findAll();
}

export function listByEncounter(encounterId) {
  if (!encounterId) throw new ValidationError("encounter_id wajib diisi");
  return repo.findByEncounter(encounterId);
}

export async function create(encounterId, data) {
  if (!encounterId) throw new ValidationError("Kunjungan wajib dipilih");
  const enc = await encounterRepo.findById(encounterId);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");
  data.profesi = data.profesi || "DOKTER";
  if (!PROFESI.includes(data.profesi)) throw new ValidationError(`Profesi harus: ${PROFESI.join("/")}`);
  // minimal salah satu komponen SOAP terisi
  if (![data.subjektif, data.objektif, data.asesmen, data.plan].some((x) => x && String(x).trim())) {
    throw new ValidationError("Minimal salah satu dari S/O/A/P harus diisi");
  }
  return repo.insert(encounterId, data);
}

export async function remove(id) {
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Catatan tidak ditemukan");
  return repo.remove(id);
}

export { ValidationError };
