// =====================================================================
// jasamedis.service.js — BUSINESS LOGIC jasa medis dokter
// =====================================================================

import * as repo from "./jasamedis.repository.js";
import * as encounterRepo from "../encounter/encounter.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const JENIS = ["KONSUL", "VISITE", "TINDAKAN", "OPERASI"];
const STATUS = ["DRAFT", "DISETUJUI", "DIBAYAR"];

export function list() {
  return repo.findAll();
}

function cleanJumlah(data) {
  const n = Number(data.jumlah);
  if (Number.isNaN(n) || n < 0) throw new ValidationError("Jumlah jasa harus angka >= 0");
  data.jumlah = n;
}

export async function create(encounterId, data) {
  if (!encounterId) throw new ValidationError("Kunjungan wajib dipilih");
  const enc = await encounterRepo.findById(encounterId);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");
  if (!data.dokter) throw new ValidationError("Nama dokter wajib diisi");
  data.jenis = data.jenis || "KONSUL";
  if (!JENIS.includes(data.jenis)) throw new ValidationError(`Jenis harus: ${JENIS.join(" / ")}`);
  cleanJumlah(data);
  data.status = "DRAFT";
  return repo.insert(encounterId, data);
}

export async function update(id, data) {
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Jasa medis tidak ditemukan");
  if (rec.status === "DIBAYAR") throw new ValidationError("Jasa yang sudah DIBAYAR tidak bisa diubah");
  if (!data.dokter) throw new ValidationError("Nama dokter wajib diisi");
  data.jenis = data.jenis || rec.jenis;
  if (!JENIS.includes(data.jenis)) throw new ValidationError(`Jenis harus: ${JENIS.join(" / ")}`);
  cleanJumlah(data);
  data.status = data.status || rec.status;
  return repo.update(id, data);
}

export async function setStatus(id, status) {
  if (!STATUS.includes(status)) throw new ValidationError(`Status harus salah satu: ${STATUS.join(", ")}`);
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Jasa medis tidak ditemukan");
  return repo.setStatus(id, status);
}

export { ValidationError };
