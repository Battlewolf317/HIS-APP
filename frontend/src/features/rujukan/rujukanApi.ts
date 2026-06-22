// =====================================================================
// rujukanApi.ts — panggil API rujukan (SISRUTE) ber-auth
// =====================================================================

import { apiFetch } from "../../lib/api";
import type { Rujukan, RujukanForm, RujukanStatus } from "./types";

export function getRujukan(): Promise<Rujukan[]> {
  return apiFetch("/rujukan");
}

export function createRujukan(data: RujukanForm): Promise<Rujukan> {
  return apiFetch("/rujukan", { method: "POST", body: JSON.stringify(data) });
}

export function updateRujukan(id: number, data: RujukanForm): Promise<Rujukan> {
  return apiFetch(`/rujukan/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function setRujukanStatus(id: number, status: RujukanStatus): Promise<Rujukan> {
  return apiFetch(`/rujukan/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}
