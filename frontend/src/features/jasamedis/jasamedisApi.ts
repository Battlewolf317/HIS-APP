// =====================================================================
// jasamedisApi.ts — panggil API jasa medis dokter (ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { JasaMedis, JasaForm, JasaStatus } from "./types";

export function getJasa(): Promise<JasaMedis[]> {
  return apiFetch("/jasamedis");
}

export function createJasa(data: JasaForm): Promise<JasaMedis> {
  return apiFetch("/jasamedis", { method: "POST", body: JSON.stringify(data) });
}

export function updateJasa(id: number, data: JasaForm): Promise<JasaMedis> {
  return apiFetch(`/jasamedis/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function setJasaStatus(id: number, status: JasaStatus): Promise<JasaMedis> {
  return apiFetch(`/jasamedis/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}
