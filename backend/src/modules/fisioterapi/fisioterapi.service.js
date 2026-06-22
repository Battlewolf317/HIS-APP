// =====================================================================
// fisioterapi.service.js — BUSINESS LOGIC fisioterapi
// =====================================================================

import * as repo from "./fisioterapi.repository.js";
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

function cleanSesi(data, fallback) {
  const j = data.jumlah_sesi === "" || data.jumlah_sesi === undefined ? fallback ?? 1 : Number(data.jumlah_sesi);
  if (!(j >= 1)) throw new ValidationError("Jumlah sesi harus >= 1");
  data.jumlah_sesi = j;
}

export async function create(encounterId, data) {
  if (!encounterId) throw new ValidationError("Kunjungan wajib dipilih");
  const enc = await encounterRepo.findById(encounterId);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");
  if (!data.jenis_terapi) throw new ValidationError("Jenis terapi wajib diisi");
  cleanSesi(data);
  data.sesi_selesai = 0;
  data.status = "AKTIF";
  return repo.insert(encounterId, data);
}

export async function update(id, data) {
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Data fisioterapi tidak ditemukan");
  if (!data.jenis_terapi) throw new ValidationError("Jenis terapi wajib diisi");
  cleanSesi(data, rec.jumlah_sesi);
  data.sesi_selesai = data.sesi_selesai === undefined ? rec.sesi_selesai : Number(data.sesi_selesai);
  data.status = data.status || rec.status;
  return repo.update(id, data);
}

export async function setStatus(id, status) {
  if (!STATUS.includes(status)) throw new ValidationError(`Status harus salah satu: ${STATUS.join(", ")}`);
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Data fisioterapi tidak ditemukan");
  return repo.setStatus(id, status);
}

export async function addSesi(id) {
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Data fisioterapi tidak ditemukan");
  if (rec.status !== "AKTIF") throw new ValidationError("Hanya program AKTIF yang bisa ditambah sesi");
  return repo.addSesi(id);
}

export { ValidationError };
