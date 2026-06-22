// =====================================================================
// sdm.service.js — BUSINESS LOGIC SDM (pegawai + presensi)
// =====================================================================

import * as repo from "./sdm.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const STATUS_PEG = ["AKTIF", "NONAKTIF"];
const STATUS_PRESENSI = ["HADIR", "IZIN", "SAKIT", "ALPA", "CUTI"];

// ---------- PEGAWAI ----------
export function listPegawai() {
  return repo.findPegawai();
}

export async function createPegawai(d) {
  if (!d.nip) throw new ValidationError("NIP wajib diisi");
  if (!d.nama) throw new ValidationError("Nama wajib diisi");
  const exist = await repo.findPegawaiByNip(d.nip.trim());
  if (exist) throw new ValidationError(`NIP ${d.nip} sudah dipakai`);
  d.status = d.status || "AKTIF";
  if (!STATUS_PEG.includes(d.status)) throw new ValidationError("Status harus AKTIF/NONAKTIF");
  return repo.insertPegawai({
    nip: d.nip.trim(), nama: d.nama.trim(), jabatan: d.jabatan || null,
    unit: d.unit || null, no_hp: d.no_hp || null, status: d.status,
  });
}

export async function updatePegawai(id, d) {
  const peg = await repo.findPegawaiById(id);
  if (!peg) throw new ValidationError("Pegawai tidak ditemukan");
  if (!d.nama) throw new ValidationError("Nama wajib diisi");
  d.status = d.status || peg.status;
  if (!STATUS_PEG.includes(d.status)) throw new ValidationError("Status harus AKTIF/NONAKTIF");
  return repo.updatePegawai(id, {
    nama: d.nama.trim(), jabatan: d.jabatan || null, unit: d.unit || null,
    no_hp: d.no_hp || null, status: d.status,
  });
}

// ---------- PRESENSI ----------
export function listPresensi(tanggal) {
  const tgl = tanggal || new Date().toISOString().slice(0, 10);
  return repo.findPresensi(tgl);
}

export async function savePresensi(d) {
  if (!d.pegawai_id) throw new ValidationError("Pegawai wajib dipilih");
  const peg = await repo.findPegawaiById(d.pegawai_id);
  if (!peg) throw new ValidationError("Pegawai tidak ditemukan");
  d.status = d.status || "HADIR";
  if (!STATUS_PRESENSI.includes(d.status)) throw new ValidationError(`Status presensi harus: ${STATUS_PRESENSI.join("/")}`);
  return repo.upsertPresensi({
    pegawai_id: d.pegawai_id,
    tanggal: d.tanggal || new Date().toISOString().slice(0, 10),
    jam_masuk: d.jam_masuk || null,
    jam_pulang: d.jam_pulang || null,
    status: d.status,
    catatan: d.catatan || null,
  });
}

export { ValidationError };
