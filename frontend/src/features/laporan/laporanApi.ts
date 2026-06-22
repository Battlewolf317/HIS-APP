// =====================================================================
// laporanApi.ts — panggil API laporan resmi RS (ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Sensus, Indikator, Kunjungan } from "./types";

export function getSensus(tanggal: string): Promise<Sensus> {
  return apiFetch(`/laporan/sensus?tanggal=${tanggal}`);
}

export function getIndikator(from: string, to: string): Promise<Indikator> {
  return apiFetch(`/laporan/indikator?from=${from}&to=${to}`);
}

export function getKunjungan(from: string, to: string): Promise<Kunjungan> {
  return apiFetch(`/laporan/kunjungan?from=${from}&to=${to}`);
}
