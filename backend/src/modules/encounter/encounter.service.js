// =====================================================================
// encounter.service.js — LAPISAN BUSINESS LOGIC
// Tugas: aturan bisnis kunjungan (validasi, generate nomor, alur status).
// (Mirip "otak": semua aturan di sini, ga ngurus SQL detail)
// =====================================================================

import * as repo from "./encounter.repository.js";
import * as patientRepo from "../patient/patient.repository.js";

// Error khusus business rule (biar controller bisa bedain dari error sistem)
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const TIPE_VALID = ["RJ", "RI", "IGD"];        // Rawat Jalan / Rawat Inap / IGD
const STATUS_VALID = ["AKTIF", "SELESAI", "BATAL"];

export function getAll() {
  return repo.findAll();
}

export async function getById(id) {
  const enc = await repo.findById(id);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");
  return enc;
}

// Validasi dasar dipakai create & update
function validasi(data) {
  if (data.tipe && !TIPE_VALID.includes(data.tipe)) {
    throw new ValidationError("Tipe harus RJ, RI, atau IGD");
  }
  if (!data.dokter) throw new ValidationError("Dokter wajib diisi");
}

// Generate nomor kunjungan: ENC + YYYYMMDD + urut 3 digit
async function generateNomor() {
  const now = new Date();
  const yyyymmdd =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const n = await repo.countByDate(yyyymmdd);
  const urut = String(n + 1).padStart(3, "0");
  return `ENC${yyyymmdd}${urut}`;
}

export async function create(data) {
  validasi(data);

  // aturan: pasien wajib & harus ada
  if (!data.patient_id) throw new ValidationError("Pasien wajib dipilih");
  const pasien = await patientRepo.findById(data.patient_id);
  if (!pasien) throw new ValidationError("Pasien tidak ditemukan");

  // nomor kunjungan di-generate otomatis (bukan input user)
  data.encounter_no = await generateNomor();
  data.tipe = data.tipe || "RJ";
  data.status = "AKTIF";

  return repo.insert(data);
}

export async function update(id, data) {
  validasi(data);

  const enc = await repo.findById(id);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");
  if (enc.status !== "AKTIF") {
    throw new ValidationError("Hanya kunjungan AKTIF yang bisa diubah");
  }

  return repo.update(id, data);
}

// Selesaikan kunjungan (discharge): status → SELESAI + isi tgl_keluar
export async function selesai(id) {
  const enc = await repo.findById(id);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");
  if (enc.status !== "AKTIF") {
    throw new ValidationError("Kunjungan sudah tidak aktif");
  }
  return repo.setStatus(id, "SELESAI", true);
}

export async function remove(id) {
  const enc = await repo.findById(id);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");
  return repo.softDelete(id);
}

export { ValidationError };
