// =====================================================================
// transfusi.service.js — BUSINESS LOGIC Unit Transfusi Darah (UTD)
//  Alur status: DIMINTA → CROSSMATCH → SIAP → DISERAHKAN / BATAL
// =====================================================================

import * as repo from "./transfusi.repository.js";
import * as encounterRepo from "../encounter/encounter.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const GOL = ["A", "B", "AB", "O"];
const KOMPONEN = ["WB", "PRC", "TC", "FFP", "CRYO"];
const STATUS = ["DIMINTA", "CROSSMATCH", "SIAP", "DISERAHKAN", "BATAL"];

export function list() {
  return repo.findAll();
}

function cleanQty(data, fallback) {
  const q = data.jumlah_kantong === "" || data.jumlah_kantong === undefined ? fallback ?? 1 : Number(data.jumlah_kantong);
  if (!(q >= 1)) throw new ValidationError("Jumlah kantong harus >= 1");
  data.jumlah_kantong = q;
}

export async function create(encounterId, data) {
  if (!encounterId) throw new ValidationError("Kunjungan wajib dipilih");
  const enc = await encounterRepo.findById(encounterId);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");
  if (!GOL.includes(data.gol_darah)) throw new ValidationError(`Golongan darah harus: ${GOL.join("/")}`);
  data.rhesus = data.rhesus || "+";
  data.komponen = data.komponen || "PRC";
  if (!KOMPONEN.includes(data.komponen)) throw new ValidationError(`Komponen harus: ${KOMPONEN.join("/")}`);
  if (!data.indikasi) throw new ValidationError("Indikasi transfusi wajib diisi");
  cleanQty(data);
  data.status = "DIMINTA";
  return repo.insert(encounterId, data);
}

export async function update(id, data) {
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Permintaan transfusi tidak ditemukan");
  if (!GOL.includes(data.gol_darah)) throw new ValidationError(`Golongan darah harus: ${GOL.join("/")}`);
  data.rhesus = data.rhesus || rec.rhesus;
  data.komponen = data.komponen || rec.komponen;
  if (!KOMPONEN.includes(data.komponen)) throw new ValidationError(`Komponen harus: ${KOMPONEN.join("/")}`);
  if (!data.indikasi) throw new ValidationError("Indikasi transfusi wajib diisi");
  cleanQty(data, rec.jumlah_kantong);
  data.status = data.status || rec.status;
  return repo.update(id, data);
}

export async function setStatus(id, status) {
  if (!STATUS.includes(status)) throw new ValidationError(`Status harus salah satu: ${STATUS.join(", ")}`);
  const rec = await repo.findById(id);
  if (!rec) throw new ValidationError("Permintaan transfusi tidak ditemukan");
  if (status === "DISERAHKAN" && !rec.no_kantong) {
    throw new ValidationError("Isi nomor kantong darah sebelum penyerahan");
  }
  return repo.setStatus(id, status);
}

export { ValidationError };
