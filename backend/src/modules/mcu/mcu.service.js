// =====================================================================
// mcu.service.js — BUSINESS LOGIC Medical Check Up
// =====================================================================

import * as repo from "./mcu.repository.js";
import * as encounterRepo from "../encounter/encounter.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const PAKET = ["BASIC", "STANDARD", "EXECUTIVE"];
const KESIMPULAN = ["LAYAK", "LAYAK_CATATAN", "TIDAK_LAYAK"];
const STATUS = ["TERDAFTAR", "PROSES", "SELESAI"];

export function list() {
  return repo.findAll();
}

export async function create(encounterId, data) {
  if (!encounterId) throw new ValidationError("Kunjungan wajib dipilih");
  const enc = await encounterRepo.findById(encounterId);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");
  data.paket = data.paket || "BASIC";
  if (!PAKET.includes(data.paket)) throw new ValidationError(`Paket harus: ${PAKET.join(" / ")}`);
  data.status = "TERDAFTAR";
  return repo.insert(encounterId, data);
}

export async function update(id, data) {
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Data MCU tidak ditemukan");
  data.paket = data.paket || rec.paket;
  if (!PAKET.includes(data.paket)) throw new ValidationError(`Paket harus: ${PAKET.join(" / ")}`);
  if (data.kesimpulan && !KESIMPULAN.includes(data.kesimpulan)) {
    throw new ValidationError(`Kesimpulan harus: ${KESIMPULAN.join(" / ")}`);
  }
  data.status = data.status || rec.status;
  return repo.update(id, data);
}

export async function setStatus(id, status) {
  if (!STATUS.includes(status)) throw new ValidationError(`Status harus salah satu: ${STATUS.join(", ")}`);
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Data MCU tidak ditemukan");
  if (status === "SELESAI" && !rec.kesimpulan) {
    throw new ValidationError("Lengkapi kesimpulan sebelum menyelesaikan MCU");
  }
  return repo.setStatus(id, status);
}

export { ValidationError };
