// =====================================================================
// transfusiApi.ts — panggil API Unit Transfusi Darah (ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Transfusi, TransfusiForm, TransfusiStatus } from "./types";

export function getTransfusi(): Promise<Transfusi[]> {
  return apiFetch("/transfusi");
}
export function createTransfusi(data: TransfusiForm): Promise<Transfusi> {
  return apiFetch("/transfusi", { method: "POST", body: JSON.stringify(data) });
}
export function updateTransfusi(id: number, data: TransfusiForm): Promise<Transfusi> {
  return apiFetch(`/transfusi/${id}`, { method: "PUT", body: JSON.stringify(data) });
}
export function setTransfusiStatus(id: number, status: TransfusiStatus): Promise<Transfusi> {
  return apiFetch(`/transfusi/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}
