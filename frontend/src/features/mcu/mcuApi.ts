// =====================================================================
// mcuApi.ts — panggil API Medical Check Up (ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Mcu, McuForm, McuStatus } from "./types";

export function getMcu(): Promise<Mcu[]> {
  return apiFetch("/mcu");
}
export function createMcu(data: McuForm): Promise<Mcu> {
  return apiFetch("/mcu", { method: "POST", body: JSON.stringify(data) });
}
export function updateMcu(id: number, data: McuForm): Promise<Mcu> {
  return apiFetch(`/mcu/${id}`, { method: "PUT", body: JSON.stringify(data) });
}
export function setMcuStatus(id: number, status: McuStatus): Promise<Mcu> {
  return apiFetch(`/mcu/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}
