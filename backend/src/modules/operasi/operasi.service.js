// =====================================================================
// operasi.service.js — BUSINESS LOGIC jadwal operasi (OT)
// =====================================================================

import * as repo from "./operasi.repository.js";
import * as encounterRepo from "../encounter/encounter.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const STATUS = ["DIJADWALKAN", "BERLANGSUNG", "SELESAI", "BATAL"];

export function list() {
  return repo.findAll();
}

function clean(data) {
  // normalisasi field numerik & tanggal kosong → null
  data.durasi_menit = data.durasi_menit === "" || data.durasi_menit === undefined ? null : Number(data.durasi_menit);
  if (data.durasi_menit !== null && Number.isNaN(data.durasi_menit)) {
    throw new ValidationError("Durasi harus angka (menit)");
  }
  if (!data.tgl_operasi) data.tgl_operasi = null;
}

export async function create(encounterId, data) {
  if (!encounterId) throw new ValidationError("Kunjungan wajib dipilih");
  const enc = await encounterRepo.findById(encounterId);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");
  if (!data.nama_tindakan) throw new ValidationError("Nama tindakan operasi wajib diisi");
  clean(data);
  data.status = "DIJADWALKAN";
  return repo.insert(encounterId, data);
}

export async function update(id, data) {
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Data operasi tidak ditemukan");
  if (!data.nama_tindakan) throw new ValidationError("Nama tindakan operasi wajib diisi");
  clean(data);
  data.status = data.status || rec.status;
  return repo.update(id, data);
}

export async function setStatus(id, status) {
  if (!STATUS.includes(status)) throw new ValidationError(`Status harus salah satu: ${STATUS.join(", ")}`);
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Data operasi tidak ditemukan");
  return repo.setStatus(id, status);
}

export { ValidationError };
