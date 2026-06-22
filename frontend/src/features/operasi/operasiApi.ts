// =====================================================================
// operasiApi.ts — panggil API jadwal operasi (OT) ber-auth
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Operasi, OperasiForm, OperasiStatus } from "./types";

export function getOperasi(): Promise<Operasi[]> {
  return apiFetch("/operasi");
}

export function createOperasi(data: OperasiForm): Promise<Operasi> {
  return apiFetch("/operasi", { method: "POST", body: JSON.stringify(data) });
}

export function updateOperasi(id: number, data: OperasiForm): Promise<Operasi> {
  return apiFetch(`/operasi/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function setOperasiStatus(id: number, status: OperasiStatus): Promise<Operasi> {
  return apiFetch(`/operasi/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}
