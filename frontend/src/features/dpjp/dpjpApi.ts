// =====================================================================
// dpjpApi.ts — panggil API DPJP (ber-auth)
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Dpjp, DpjpForm, DpjpStatus } from "./types";

export function getDpjp(): Promise<Dpjp[]> {
  return apiFetch("/dpjp");
}

export function createDpjp(data: DpjpForm): Promise<Dpjp> {
  return apiFetch("/dpjp", { method: "POST", body: JSON.stringify(data) });
}

export function updateDpjp(id: number, data: DpjpForm): Promise<Dpjp> {
  return apiFetch(`/dpjp/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function setDpjpStatus(id: number, status: DpjpStatus): Promise<Dpjp> {
  return apiFetch(`/dpjp/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}
