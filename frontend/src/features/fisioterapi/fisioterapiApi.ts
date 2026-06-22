// =====================================================================
// fisioterapiApi.ts — panggil API fisioterapi (ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Fisioterapi, FisioForm, FisioStatus } from "./types";

export function getFisio(): Promise<Fisioterapi[]> {
  return apiFetch("/fisioterapi");
}
export function createFisio(data: FisioForm): Promise<Fisioterapi> {
  return apiFetch("/fisioterapi", { method: "POST", body: JSON.stringify(data) });
}
export function updateFisio(id: number, data: FisioForm): Promise<Fisioterapi> {
  return apiFetch(`/fisioterapi/${id}`, { method: "PUT", body: JSON.stringify(data) });
}
export function setFisioStatus(id: number, status: FisioStatus): Promise<Fisioterapi> {
  return apiFetch(`/fisioterapi/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}
export function addSesi(id: number): Promise<Fisioterapi> {
  return apiFetch(`/fisioterapi/${id}/sesi`, { method: "PATCH" });
}
