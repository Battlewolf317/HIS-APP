// =====================================================================
// medrec.service.js — BUSINESS LOGIC rekam medis (SOAP)
// =====================================================================

import * as repo from "./medrec.repository.js";
import * as encounterRepo from "../encounter/encounter.repository.js";
import * as icd10Repo from "../icd10/icd10.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

export function getByEncounter(encounterId) {
  if (!encounterId) throw new ValidationError("encounter_id wajib diisi");
  return repo.findByEncounter(encounterId);
}

export async function create(data) {
  // kunjungan harus ada & masih AKTIF
  if (!data.encounter_id) throw new ValidationError("Kunjungan wajib dipilih");
  const enc = await encounterRepo.findById(data.encounter_id);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");
  if (enc.status !== "AKTIF") {
    throw new ValidationError("Hanya kunjungan AKTIF yang bisa diisi rekam medis");
  }

  if (!data.anamnesa) throw new ValidationError("Anamnesa (keluhan) wajib diisi");
  if (!data.diagnosa_code) throw new ValidationError("Diagnosa wajib dipilih");

  // diagnosa harus valid (ada di master ICD-10) — sekalian ambil namanya
  const icd = await icd10Repo.findByCode(data.diagnosa_code);
  if (!icd) throw new ValidationError("Kode diagnosa tidak valid");
  data.diagnosa_nama = icd.name;

  // default dokter dari kunjungan kalau ga diisi
  data.dokter = data.dokter || enc.dokter;

  return repo.insert(data);
}

export async function remove(id) {
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Rekam medis tidak ditemukan");
  return repo.remove(id);
}

export { ValidationError };
