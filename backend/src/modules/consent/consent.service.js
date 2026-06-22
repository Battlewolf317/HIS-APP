// =====================================================================
// consent.service.js — BUSINESS LOGIC informed consent
// =====================================================================

import * as repo from "./consent.repository.js";
import * as encounterRepo from "../encounter/encounter.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const KEPUTUSAN = ["SETUJU", "TOLAK"];

export function list() {
  return repo.findAll();
}

export async function create(encounterId, data) {
  if (!encounterId) throw new ValidationError("Kunjungan wajib dipilih");
  const enc = await encounterRepo.findById(encounterId);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");
  if (!data.jenis_tindakan) throw new ValidationError("Jenis tindakan wajib diisi");
  data.keputusan = data.keputusan || "SETUJU";
  if (!KEPUTUSAN.includes(data.keputusan)) throw new ValidationError(`Keputusan harus: ${KEPUTUSAN.join("/")}`);
  return repo.insert(encounterId, data);
}

export async function update(id, data) {
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Consent tidak ditemukan");
  if (!data.jenis_tindakan) throw new ValidationError("Jenis tindakan wajib diisi");
  data.keputusan = data.keputusan || rec.keputusan;
  if (!KEPUTUSAN.includes(data.keputusan)) throw new ValidationError(`Keputusan harus: ${KEPUTUSAN.join("/")}`);
  return repo.update(id, data);
}

export { ValidationError };
