// =====================================================================
// triase.service.js — BUSINESS LOGIC triase IGD
// Tugas: aturan validasi + upsert (insert/update) data triase.
// =====================================================================

import * as repo from "./triase.repository.js";
import * as encounterRepo from "../encounter/encounter.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const LEVELS = ["MERAH", "KUNING", "HIJAU", "HITAM"];
const KATEGORI = ["RESUSITASI", "EMERGENCY", "URGENT", "NON_URGENT", "DOA"];

// Worklist pasien IGD (yang sudah & belum ditriase)
export function worklist() {
  return repo.worklist();
}

// Detail 1 pasien IGD + data triase (kalau sudah ada)
export async function getByEncounter(encounterId) {
  if (!encounterId) throw new ValidationError("encounter_id wajib diisi");
  const encounter = await encounterRepo.findById(encounterId);
  if (!encounter) throw new ValidationError("Kunjungan tidak ditemukan");
  if (encounter.tipe !== "IGD") {
    throw new ValidationError("Triase hanya untuk kunjungan tipe IGD");
  }
  const triase = await repo.findByEncounter(encounterId);
  return { encounter, triase: triase || null };
}

// Saran level (ESI-like) berdasarkan vital sign — sekadar bantu, final tetap manual
export function suggestLevel(d) {
  const gcs = num(d.gcs);
  const spo2 = num(d.spo2);
  const nadi = num(d.nadi);
  const rr = num(d.rr);
  const sistol = num(d.td_sistol);

  // MERAH — kondisi mengancam nyawa
  if ((gcs !== null && gcs <= 8) || (spo2 !== null && spo2 < 90) || (sistol !== null && sistol < 90) || (rr !== null && (rr < 8 || rr > 30)) || (nadi !== null && (nadi < 40 || nadi > 140))) {
    return { level: "MERAH", kategori: "RESUSITASI" };
  }
  // KUNING — gawat tidak darurat
  if ((gcs !== null && gcs <= 13) || (spo2 !== null && spo2 < 95) || (nadi !== null && nadi > 120) || (rr !== null && rr > 24)) {
    return { level: "KUNING", kategori: "URGENT" };
  }
  // HIJAU — tidak gawat tidak darurat
  return { level: "HIJAU", kategori: "NON_URGENT" };
}

// Upsert: insert kalau belum ada, update kalau sudah ada
export async function save(encounterId, data) {
  if (!encounterId) throw new ValidationError("encounter_id wajib diisi");
  const encounter = await encounterRepo.findById(encounterId);
  if (!encounter) throw new ValidationError("Kunjungan tidak ditemukan");
  if (encounter.tipe !== "IGD") {
    throw new ValidationError("Triase hanya untuk kunjungan tipe IGD");
  }

  if (!data.keluhan_utama) throw new ValidationError("Keluhan utama wajib diisi");
  if (!data.level) throw new ValidationError("Level triase wajib dipilih");
  if (!LEVELS.includes(data.level)) {
    throw new ValidationError(`Level harus salah satu: ${LEVELS.join(", ")}`);
  }
  if (data.kategori && !KATEGORI.includes(data.kategori)) {
    throw new ValidationError(`Kategori harus salah satu: ${KATEGORI.join(", ")}`);
  }

  const existing = await repo.findByEncounter(encounterId);
  if (existing) {
    return repo.update(existing.id, data);
  }
  return repo.insert(encounterId, data);
}

function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export { ValidationError };
