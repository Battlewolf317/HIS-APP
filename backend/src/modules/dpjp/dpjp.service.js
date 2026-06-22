// =====================================================================
// dpjp.service.js — BUSINESS LOGIC DPJP (dokter penanggung jawab)
// =====================================================================

import * as repo from "./dpjp.repository.js";
import * as encounterRepo from "../encounter/encounter.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const PERAN = ["UTAMA", "KONSULEN", "ALIH"];
const STATUS = ["AKTIF", "SELESAI"];

export function list() {
  return repo.findAll();
}

export async function create(encounterId, data) {
  if (!encounterId) throw new ValidationError("Kunjungan wajib dipilih");
  const enc = await encounterRepo.findById(encounterId);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");
  if (!data.dokter) throw new ValidationError("Nama dokter DPJP wajib diisi");
  data.peran = data.peran || "UTAMA";
  if (!PERAN.includes(data.peran)) throw new ValidationError(`Peran harus: ${PERAN.join(" / ")}`);
  if (!data.tgl_mulai) data.tgl_mulai = today();   // jangan null (kolom NOT NULL)
  if (!data.tgl_selesai) data.tgl_selesai = null;
  data.status = "AKTIF";

  // hanya boleh 1 DPJP UTAMA aktif — tutup yang lama dulu
  if (data.peran === "UTAMA") await repo.closeActiveUtama(encounterId);
  return repo.insert(encounterId, data);
}

export async function update(id, data) {
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("DPJP tidak ditemukan");
  if (!data.dokter) throw new ValidationError("Nama dokter DPJP wajib diisi");
  data.peran = data.peran || rec.peran;
  if (!PERAN.includes(data.peran)) throw new ValidationError(`Peran harus: ${PERAN.join(" / ")}`);
  if (!data.tgl_mulai) data.tgl_mulai = rec.tgl_mulai;
  if (!data.tgl_selesai) data.tgl_selesai = null;
  data.status = data.status || rec.status;
  return repo.update(id, data);
}

export async function setStatus(id, status) {
  if (!STATUS.includes(status)) throw new ValidationError(`Status harus salah satu: ${STATUS.join(", ")}`);
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("DPJP tidak ditemukan");
  return repo.setStatus(id, status);
}

export { ValidationError };

function today() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}
