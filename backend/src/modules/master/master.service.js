// =====================================================================
// master.service.js — BUSINESS LOGIC master data (poli/dokter/tarif)
// =====================================================================

import * as repo from "./master.repository.js";
import { getEntity } from "./master.config.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

function entOrThrow(name) {
  const ent = getEntity(name);
  if (!ent) throw new ValidationError("Entitas master tidak dikenal");
  return ent;
}

// ambil hanya kolom yang diizinkan dari body (sanitasi)
function pick(ent, body) {
  const out = {};
  for (const c of ent.cols) out[c] = body[c] ?? null;
  return out;
}

export function getAll(name) {
  return repo.list(entOrThrow(name));
}

export async function create(name, body) {
  const ent = entOrThrow(name);
  const data = pick(ent, body);
  if (!data.kode) throw new ValidationError("Kode wajib diisi");
  if (!data.nama) throw new ValidationError("Nama wajib diisi");
  data.kode = String(data.kode).trim().toUpperCase();
  const exist = await repo.findByKode(ent, data.kode);
  if (exist) throw new ValidationError(`Kode ${data.kode} sudah dipakai`);
  if (ent.cols.includes("harga")) data.harga = Number(data.harga) || 0;
  return repo.insert(ent, data);
}

export async function update(name, id, body) {
  const ent = entOrThrow(name);
  const cur = await repo.findById(ent, id);
  if (!cur) throw new ValidationError("Data tidak ditemukan");
  const data = pick(ent, body);
  if (!data.nama) throw new ValidationError("Nama wajib diisi");
  if (ent.cols.includes("harga")) data.harga = Number(data.harga) || 0;
  return repo.update(ent, id, data);
}

export async function remove(name, id) {
  const ent = entOrThrow(name);
  const cur = await repo.findById(ent, id);
  if (!cur) throw new ValidationError("Data tidak ditemukan");
  return repo.remove(ent, id);
}

export { ValidationError };
