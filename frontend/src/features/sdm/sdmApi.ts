// =====================================================================
// sdmApi.ts — panggil API SDM (pegawai + presensi) ber-auth
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Pegawai, PegawaiForm, Presensi, PresensiForm } from "./types";

// pegawai
export function getPegawai(): Promise<Pegawai[]> {
  return apiFetch("/sdm/pegawai");
}
export function createPegawai(data: PegawaiForm): Promise<Pegawai> {
  return apiFetch("/sdm/pegawai", { method: "POST", body: JSON.stringify(data) });
}
export function updatePegawai(id: number, data: PegawaiForm): Promise<Pegawai> {
  return apiFetch(`/sdm/pegawai/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

// presensi
export function getPresensi(tanggal: string): Promise<Presensi[]> {
  return apiFetch(`/sdm/presensi?tanggal=${tanggal}`);
}
export function savePresensi(data: PresensiForm): Promise<Presensi> {
  return apiFetch("/sdm/presensi", { method: "POST", body: JSON.stringify(data) });
}
