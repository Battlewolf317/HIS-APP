// =====================================================================
// rujukan.service.js — BUSINESS LOGIC rujukan (SISRUTE)
// =====================================================================

import * as repo from "./rujukan.repository.js";
import * as encounterRepo from "../encounter/encounter.repository.js";
import * as icd10Repo from "../icd10/icd10.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const ARAH = ["KELUAR", "MASUK"];
const STATUS = ["DRAFT", "DIKIRIM", "DITERIMA", "DITOLAK", "SELESAI"];

export function list() {
  return repo.findAll();
}

async function resolveDiagnosa(data) {
  if (data.diagnosa_code) {
    const icd = await icd10Repo.findByCode(data.diagnosa_code);
    if (!icd) throw new ValidationError("Kode diagnosa tidak valid");
    data.diagnosa_nama = icd.name;
  } else {
    data.diagnosa_nama = null;
  }
}

export async function create(encounterId, data) {
  if (!encounterId) throw new ValidationError("Kunjungan wajib dipilih");
  const enc = await encounterRepo.findById(encounterId);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");

  data.arah = data.arah || "KELUAR";
  if (!ARAH.includes(data.arah)) throw new ValidationError(`Arah harus: ${ARAH.join(" / ")}`);
  if (!data.alasan) throw new ValidationError("Alasan rujukan wajib diisi");
  if (data.arah === "KELUAR" && !data.faskes_tujuan) throw new ValidationError("Faskes tujuan wajib diisi untuk rujukan keluar");
  if (data.arah === "MASUK" && !data.faskes_asal) throw new ValidationError("Faskes asal wajib diisi untuk rujukan masuk");

  await resolveDiagnosa(data);
  data.status = "DRAFT";
  return repo.insert(encounterId, data);
}

export async function update(id, data) {
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Rujukan tidak ditemukan");
  if (!data.alasan) throw new ValidationError("Alasan rujukan wajib diisi");
  data.arah = data.arah || rec.arah;
  await resolveDiagnosa(data);
  data.status = data.status || rec.status;
  return repo.update(id, data);
}

export async function setStatus(id, status) {
  if (!STATUS.includes(status)) throw new ValidationError(`Status harus salah satu: ${STATUS.join(", ")}`);
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Rujukan tidak ditemukan");
  return repo.setStatus(id, status);
}

export { ValidationError };
