// =====================================================================
// bed.service.js — BUSINESS LOGIC bed management (Rawat Inap)
//  - assign: tempatkan pasien (encounter RI AKTIF) ke bed KOSONG
//  - transfer: pindah pasien dari 1 bed ke bed KOSONG lain
//  - release: keluarkan pasien, bed jadi KOSONG
//  - maintenance: tandai bed MAINTENANCE / aktifkan lagi
// =====================================================================

import * as repo from "./bed.repository.js";
import * as encounterRepo from "../encounter/encounter.repository.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

export function getBoard() {
  return repo.findBoard();
}

export function getAdmittable() {
  return repo.findAdmittable();
}

export function getWards() {
  return repo.findWards();
}

export async function assign(bedId, encounterId) {
  const bed = await repo.findBedById(bedId);
  if (!bed) throw new ValidationError("Bed tidak ditemukan");
  if (bed.status !== "KOSONG") throw new ValidationError("Bed tidak kosong");

  const enc = await encounterRepo.findById(encounterId);
  if (!enc) throw new ValidationError("Kunjungan tidak ditemukan");
  if (enc.tipe !== "RI") throw new ValidationError("Hanya kunjungan Rawat Inap (RI) yang bisa ditempatkan");
  if (enc.status !== "AKTIF") throw new ValidationError("Kunjungan tidak AKTIF");

  const existing = await repo.isEncounterOnBed(encounterId);
  if (existing) throw new ValidationError("Pasien sudah menempati bed lain");

  return repo.setOccupant(bedId, encounterId, "TERISI");
}

export async function release(bedId) {
  const bed = await repo.findBedById(bedId);
  if (!bed) throw new ValidationError("Bed tidak ditemukan");
  if (bed.status !== "TERISI") throw new ValidationError("Bed tidak terisi");
  return repo.setOccupant(bedId, null, "KOSONG");
}

export async function transfer(fromBedId, toBedId) {
  if (Number(fromBedId) === Number(toBedId)) throw new ValidationError("Bed tujuan sama dengan asal");
  const from = await repo.findBedById(fromBedId);
  if (!from) throw new ValidationError("Bed asal tidak ditemukan");
  if (from.status !== "TERISI") throw new ValidationError("Bed asal tidak terisi");
  const to = await repo.findBedById(toBedId);
  if (!to) throw new ValidationError("Bed tujuan tidak ditemukan");
  if (to.status !== "KOSONG") throw new ValidationError("Bed tujuan tidak kosong");

  await repo.setOccupant(toBedId, from.encounter_id, "TERISI");
  await repo.setOccupant(fromBedId, null, "KOSONG");
  return repo.findBedById(toBedId);
}

export async function setMaintenance(bedId, on) {
  const bed = await repo.findBedById(bedId);
  if (!bed) throw new ValidationError("Bed tidak ditemukan");
  if (bed.status === "TERISI") throw new ValidationError("Bed terisi, tidak bisa diubah status maintenance");
  return repo.setStatus(bedId, on ? "MAINTENANCE" : "KOSONG");
}

export { ValidationError };
