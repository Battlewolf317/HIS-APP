// =====================================================================
// patient.service.js — LAPISAN BUSINESS LOGIC
// Tugas: aturan bisnis (validasi, MRN unik, dll). Panggil repository buat data.
// (Mirip "otak": semua aturan di sini, ga ngurus SQL detail)
// =====================================================================

import * as repo from "./patient.repository.js";

// Error khusus business rule (biar controller bisa bedain dari error sistem)
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

export function getAll() {
  return repo.findAll();
}

export async function getById(id) {
  const pasien = await repo.findById(id);
  if (!pasien) throw new ValidationError("Pasien tidak ditemukan");
  return pasien;
}

// Validasi dasar dipakai create & update
function validasi(data) {
  if (!data.mrn) throw new ValidationError("MRN wajib diisi");
  if (!data.nama) throw new ValidationError("Nama wajib diisi");
  if (data.jenis_kelamin && !["L", "P"].includes(data.jenis_kelamin)) {
    throw new ValidationError("Jenis kelamin harus L atau P");
  }
  if (data.nik && data.nik.length !== 16) {
    throw new ValidationError("NIK harus 16 digit");
  }
}

export async function create(data) {
  validasi(data);

  // aturan: MRN harus unik
  const sudahAda = await repo.findByMrn(data.mrn);
  if (sudahAda) throw new ValidationError("MRN sudah terdaftar");

  // normalisasi: nama HURUF BESAR (konsisten kayak NCR2866)
  data.nama = data.nama.toUpperCase();
  data.penjamin = data.penjamin || "UMUM";

  return repo.insert(data);
}

export async function update(id, data) {
  validasi(data);

  const pasien = await repo.findById(id);
  if (!pasien) throw new ValidationError("Pasien tidak ditemukan");

  // MRN unik tapi boleh sama dgn dirinya sendiri
  const bentrok = await repo.findByMrn(data.mrn, id);
  if (bentrok) throw new ValidationError("MRN sudah dipakai pasien lain");

  data.nama = data.nama.toUpperCase();
  data.penjamin = data.penjamin || "UMUM";

  return repo.update(id, data);
}

export async function remove(id) {
  const pasien = await repo.findById(id);
  if (!pasien) throw new ValidationError("Pasien tidak ditemukan");
  return repo.softDelete(id);
}

export { ValidationError };
